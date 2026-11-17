# Local Windows OCR only. Never print/store the complete recognized text.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType = WindowsRuntime]
$taskAsTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Wait-LocalWinRT($Operation, [Type]$ResultType) {
  $taskAwait = $taskAsTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $taskAwait.Wait()
  $taskAwait.Result
}
$taskEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $taskEngine) { throw 'No installed local OCR language engine.' }
$taskIndicators = @(
  'Codex', 'ChatGPT', 'Cloudflare', 'PMG', 'pmgnotes', 'Verify', 'Verifying',
  '查询与采集', '检验PMG评级', '验证', '验证您是真人', '库', 'Add context',
  'New thread', '新建聊天', '终端', 'Review', 'Sources'
)
$taskResults = foreach ($taskSecond in @(40, 55, 70, 100)) {
  $taskFilePath = Join-Path $PSScriptRoot ('frame-' + $taskSecond.ToString('000') + 's.png')
  $taskFile = Wait-LocalWinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($taskFilePath)) ([Windows.Storage.StorageFile])
  $taskStream = Wait-LocalWinRT ($taskFile.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
  try {
    $taskDecoder = Wait-LocalWinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($taskStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $taskBitmap = Wait-LocalWinRT ($taskDecoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    try {
      $taskOCR = Wait-LocalWinRT ($taskEngine.RecognizeAsync($taskBitmap)) ([Windows.Media.Ocr.OcrResult])
      $taskHits = foreach ($taskIndicator in $taskIndicators) {
        $taskCount = @($taskOCR.Lines | Where-Object { $_.Text.IndexOf($taskIndicator, [StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count
        if ($taskCount -gt 0) { [pscustomobject]@{ indicator = $taskIndicator; matchedLines = $taskCount } }
      }
      $taskTopHits = foreach ($taskLine in $taskOCR.Lines) {
        $taskWords = @($taskLine.Words)
        if ($taskWords.Count -gt 0 -and $taskWords[0].BoundingRect.Y -lt 180) {
          foreach ($taskIndicator in $taskIndicators) {
            if ($taskLine.Text.IndexOf($taskIndicator, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
              [pscustomobject]@{ indicator = $taskIndicator; firstWordY = $taskWords[0].BoundingRect.Y }
            }
          }
        }
      }
      [pscustomobject]@{ second = $taskSecond; localOCRLanguage = $taskEngine.RecognizerLanguage.LanguageTag; recognizedLineCount = @($taskOCR.Lines).Count; indicators = @($taskHits); topIndicators = @($taskTopHits); completeRecognizedTextSaved = $false }
    } finally { $taskBitmap.Dispose() }
  } finally { $taskStream.Dispose() }
}
$taskResults | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'local-ocr-indicators.json') -Encoding UTF8
$taskResults | ConvertTo-Json -Depth 8 -Compress
