package io.github.yushendu224.pmglibrary.preview;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Offline, trusted-asset preview. No JavaScript interface and no network permission. */
public final class MainActivity extends Activity {
    private static final String APP_HOST = "pmg-preview.local";
    private static final String APP_URL = "https://" + APP_HOST + "/index.html";
    private static final int PICK_IMAGE = 100;
    private static final int EXPORT_SETTINGS = 101;
    private static final Set<String> ASSETS = new HashSet<>(Arrays.asList(
        "index.html", "app.mjs", "score-picker.mjs", "style.css", "layout-v024.css",
        "android-native.css", "assets/front.jpg", "assets/back.jpg", "assets/pmg-logo.svg"));
    private static final Set<String> IMAGE_TYPES = new HashSet<>(Arrays.asList("image/jpeg", "image/png", "image/webp"));
    private FrameLayout root;
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private byte[] pendingExport;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        configureInsets();
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Only user-selected document URIs reach the file input.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(settings.getUserAgentString() + " PMGAndroidPreview/0.1.0");
        if (Build.VERSION.SDK_INT >= 33) settings.setAlgorithmicDarkeningAllowed(false);
        else if (Build.VERSION.SDK_INT >= 29) settings.setForceDark(WebSettings.FORCE_DARK_OFF);
        web.setWebViewClient(new OfflineClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                cancelChooser();
                chooser = callback;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("image/*");
                pick.putExtra(Intent.EXTRA_MIME_TYPES, IMAGE_TYPES.toArray(new String[0]));
                pick.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivityForResult(pick, PICK_IMAGE); }
                catch (ActivityNotFoundException error) { cancelChooser(); notice("此设备没有可用的系统文件选择器"); }
                return true;
            }
        });
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
            android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        updateSystemTheme();
        web.loadUrl(APP_URL);
    }

    private void configureInsets() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                Insets ime = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                return WindowInsets.CONSUMED;
            });
            root.requestApplyInsets();
        }
    }

    private boolean isDark() { return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES; }

    private void updateSystemTheme() {
        boolean dark = isDark();
        int background = Color.parseColor(dark ? "#1c1c1c" : "#f5f5f5");
        root.setBackgroundColor(background);
        web.setBackgroundColor(background);
        getWindow().setStatusBarColor(background);
        getWindow().setNavigationBarColor(background);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                int appearance = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                controller.setSystemBarsAppearance(dark ? 0 : appearance, appearance);
            }
        } else getWindow().getDecorView().setSystemUiVisibility(dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        if (trusted(web.getUrl())) web.evaluateJavascript("window.pmgNativeSystemTheme && window.pmgNativeSystemTheme(" + JSONObject.quote(dark ? "dark" : "light") + ")", null);
    }

    @Override public void onConfigurationChanged(Configuration configuration) {
        super.onConfigurationChanged(configuration);
        updateSystemTheme();
        root.requestApplyInsets();
    }

    private boolean trusted(String value) {
        if (value == null) return false;
        Uri uri = Uri.parse(value);
        return "https".equals(uri.getScheme()) && APP_HOST.equals(uri.getHost())
            && uri.getPort() == -1 && uri.getUserInfo() == null && "/index.html".equals(uri.getPath());
    }

    private final class OfflineClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String path = uri.getPath();
            if (!"GET".equals(request.getMethod()) || !"https".equals(uri.getScheme()) || !APP_HOST.equals(uri.getHost())
                || uri.getPort() != -1 || uri.getUserInfo() != null || uri.getQuery() != null || path == null
                || !path.startsWith("/") || !ASSETS.contains(path.substring(1))) return response(403, "text/plain", "Blocked".getBytes(StandardCharsets.UTF_8));
            String asset = path.substring(1);
            try {
                String mime = asset.endsWith(".html") ? "text/html" : asset.endsWith(".css") ? "text/css" : asset.endsWith(".mjs") ? "text/javascript" : asset.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
                return new WebResourceResponse(mime, asset.endsWith(".jpg") ? null : "UTF-8", getAssets().open("web/" + asset));
            } catch (Exception error) { return response(404, "text/plain", "Not found".getBytes(StandardCharsets.UTF_8)); }
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (trusted(uri.toString())) return false;
            if (request.isForMainFrame() && "pmg-preview-export".equals(uri.getScheme()) && "settings".equals(uri.getHost())
                && uri.getQuery() == null && uri.getFragment() == null && (uri.getPath() == null || uri.getPath().isEmpty()) && trusted(view.getUrl())) {
                exportSettings();
                return true;
            }
            if (request.isForMainFrame() && "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null && !APP_HOST.equals(uri.getHost())) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
                catch (ActivityNotFoundException error) { notice("未找到可打开网址的浏览器"); }
            } else notice("预览只允许在系统浏览器打开 HTTPS 外链");
            return true;
        }

        @Override public void onPageFinished(WebView view, String url) { if (trusted(url)) updateSystemTheme(); }
    }

    private static WebResourceResponse response(int status, String mime, byte[] bytes) {
        return new WebResourceResponse(mime, "UTF-8", status, status == 404 ? "Not Found" : "Forbidden", java.util.Collections.emptyMap(), new ByteArrayInputStream(bytes));
    }

    private void exportSettings() {
        if (pendingExport != null || !trusted(web.getUrl())) return;
        // Fixed script, fixed structure, fixed suggested filename. No generic JavaScript bridge.
        web.evaluateJavascript("window.pmgExportSettingsJSON ? window.pmgExportSettingsJSON() : null", result -> {
            try {
                Object decoded = new JSONTokener(result).nextValue();
                if (!(decoded instanceof String)) throw new IllegalArgumentException();
                byte[] bytes = ((String) decoded).getBytes(StandardCharsets.UTF_8);
                if (bytes.length > 262144) throw new IllegalArgumentException();
                JSONObject input = new JSONObject((String) decoded);
                if (!"pmg-android-ui-preview".equals(input.getString("format"))) throw new IllegalArgumentException();
                JSONObject safe = new JSONObject();
                safe.put("format", "pmg-android-ui-preview");
                safe.put("preferredImageGroupId", input.getString("preferredImageGroupId"));
                JSONArray groups = input.getJSONArray("groups"), clean = new JSONArray();
                if (groups.length() > 500) throw new IllegalArgumentException();
                for (int i = 0; i < groups.length(); i++) {
                    JSONObject group = groups.getJSONObject(i), item = new JSONObject();
                    for (String key : new String[]{"id", "name", "source", "url", "notes", "frontFilename", "backFilename"}) {
                        if (group.has(key) && !group.isNull(key)) item.put(key, group.getString(key));
                    }
                    clean.put(item);
                }
                safe.put("groups", clean);
                pendingExport = safe.toString(2).getBytes(StandardCharsets.UTF_8);
                Intent create = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");
                create.putExtra(Intent.EXTRA_TITLE, "PMG-Android-preview-settings.json");
                startActivityForResult(create, EXPORT_SETTINGS);
            } catch (Exception error) { pendingExport = null; notice("无法导出本次界面设置"); }
        });
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = data == null ? null : data.getData();
        if (request == PICK_IMAGE) {
            ValueCallback<Uri[]> callback = chooser;
            chooser = null;
            if (callback == null) return;
            boolean valid = result == RESULT_OK && uri != null && "content".equals(uri.getScheme());
            if (valid) {
                try {
                    valid = IMAGE_TYPES.contains(getContentResolver().getType(uri));
                    if (valid) try (InputStream stream = getContentResolver().openInputStream(uri)) {
                        BitmapFactory.Options image = new BitmapFactory.Options();
                        image.inJustDecodeBounds = true;
                        BitmapFactory.decodeStream(stream, null, image);
                        valid = image.outWidth > 0 && image.outHeight > 0 && IMAGE_TYPES.contains(image.outMimeType);
                    }
                } catch (Exception error) { valid = false; }
            }
            callback.onReceiveValue(valid ? new Uri[]{uri} : null);
            if (result == RESULT_OK && !valid) notice("请选择可读取的 JPG、PNG 或 WebP 图片");
        } else if (request == EXPORT_SETTINGS) {
            byte[] bytes = pendingExport;
            pendingExport = null;
            if (result != RESULT_OK) return;
            if (uri == null || bytes == null || !"content".equals(uri.getScheme())) { notice("未能保存设置文件"); return; }
            try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException();
                output.write(bytes);
                notice("已导出设置 JSON；此文件不包含图片，也不是藏品备份");
            } catch (Exception error) { notice("设置保存失败，请重新导出"); }
        }
    }

    private void handleBack() {
        if (!trusted(web.getUrl())) { finish(); return; }
        web.evaluateJavascript("window.pmgHandleAndroidBack ? window.pmgHandleAndroidBack() : false", handled -> { if (!"true".equals(handled)) finish(); });
    }
    @Override public void onBackPressed() { handleBack(); }
    private void cancelChooser() { if (chooser != null) { chooser.onReceiveValue(null); chooser = null; } }
    private void notice(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }
    @Override protected void onDestroy() {
        cancelChooser(); pendingExport = null;
        root.removeView(web); web.destroy();
        super.onDestroy();
    }
}
