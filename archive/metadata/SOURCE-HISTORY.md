# 源码历史清单

汇总时间：2026-11-17T00:20:27.892Z

已核对 1699 个源码/公开示例资源文件，共 84,312,311 字节；32 组封存清单，0 处哈希不一致。

| 源码版本 | 应用版本 | 状态 | 目录 | 文件 |
| --- | --- | --- | --- | ---: |
| v001-foundation | 0.0.1 | specification-foundation | `versions/v001-foundation` | 8 |
| v002-app | 0.0.1 | archived-source-version | `versions/v002-app` | 18 |
| v003-validation | 0.0.1 | archived-source-version | `versions/v003-validation` | 18 |
| v004-core | 0.0.1 | archived-source-version | `versions/v004-core` | 20 |
| v005-pmg-ui | 0.0.1 | archived-source-version | `versions/v005-pmg-ui` | 21 |
| v006-launch-fix | 0.0.1 | archived-source-version | `versions/v006-launch-fix` | 23 |
| v007-library-actions | 0.0.1 | archived-source-version | `versions/v007-library-actions` | 24 |
| v008-palette | 0.0.1 | archived-source-version | `versions/v008-palette` | 24 |
| v009-collector | 0.9.0 | archived-source-version | `versions/v009-collector` | 32 |
| v010-capture-fix | 0.9.0 | archived-source-version | `versions/v010-capture-fix` | 33 |
| v011-inline-workspace | 0.11.0 | archived-source-version | `versions/v011-inline-workspace` | 38 |
| v012-complete-fields | 0.12.0 | archived-source-version | `versions/v012-complete-fields` | 39 |
| v013-unified-library | 0.13.0 | archived-source-version | `versions/v013-unified-library` | 39 |
| v014-inline-release | 0.14.0 | archived-source-version | `versions/v014-inline-release` | 39 |
| v015-inline-final | 0.15.0 | archived-source-version | `versions/v015-inline-final` | 40 |
| v016-separated-pages | 0.16.0 | archived-source-version | `versions/v016-separated-pages` | 43 |
| v017-image-groups-prototype | 0.16.0 | abandoned-first-image-group-ui | `versions/v017-image-groups-prototype` | 54 |
| v018-display-group | 0.16.0 | second-image-group-ui-preview | `versions/v018-display-group` | 55 |
| v019-windows-installer | 0.16.1 | historical-windows-installer | `versions/v019-windows-installer` | 51 |
| v020-unlimited-import | 0.16.2 | previous-stable-0.16.2 | `versions/v020-unlimited-import` | 54 |
| v021-image-groups | 0.18.0 | currently-installed-stable-0.18.0 | `versions/v021-image-groups` | 58 |
| v022-fluid-ui | 0.19.0 | abandoned-fluid-ui-experiment | `versions/v022-fluid-ui` | 61 |
| v023-window-preview | 0.18.1-preview.1 | window-shell-preview | `versions/v023-window-preview` | 60 |
| v025-browser-compat | 0.18.1-preview.2 | browser-compatibility-preview | `versions/v025-browser-compat` | 63 |
| v027-ascii-identity | 0.18.1-preview.2 | ascii-identity-diagnostic-preview | `versions/v027-ascii-identity` | 64 |
| v028-state-sync | 0.18.1-preview.2 | state-sync-diagnostic-preview | `versions/v028-state-sync` | 69 |
| v029-windows-preview | 0.18.2-preview.1 | windows-prerelease-live-website-acceptance-pending | `versions/v029-windows-preview` | 69 |

## 说明

- v017-image-groups-prototype is the abandoned first image-group UI design. v018-display-group is the second UI design.
- v022-fluid-ui is an abandoned experimental redesign; it is not the active Windows UI.
- v024 is an Android/web review batch; v026 is a browser retest batch, not an application release.
- Public example fixture PMGX and official sample front/back images are retained only when owned by the sealed source manifest.
- Original sealed source is never changed. For preview portals only, screen assets listed in the source seal are omitted from the publication. Retained code hashes are verified; their original seal remains as provenance.
- The retest HTML report references local-only recordings. The code is retained for reproducibility; recordings and screenshot output are not published.
- v029 Windows release is 0.18.2-preview.1, a prerelease packaged from sealed v028 state-sync source. The installed stable Windows application remains 0.18.0 (v021).

## 排除

浏览器会话、用户藏品、Cookie、凭据、签名私钥、node_modules、构建产物、屏幕录制和截图均未纳入。Windows 版本源码按原封存清单完整复制，未改动历史版本。

v024/v025 的预览门户原清单含 windows-preserved.png 屏幕画面；这 5 个重复画面资产有意排除。门户代码与原封存清单保留，保留文件逐个校验；门户封存不能称为全资产齐备。重测报告源码中引用的屏幕媒体仅在本机。

详细文件 SHA256、分组和有意排除项见 source-inventory.json；发布路径及凭据形态检查结果见 SOURCE-AUDIT.json。
