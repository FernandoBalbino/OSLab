param(
  [Parameter(Mandatory = $true)][string]$SourcePath,
  [Parameter(Mandatory = $true)][string]$ImplementationPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$TargetWidth = 1288
)

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Image]::FromFile($SourcePath)
$implementation = [System.Drawing.Image]::FromFile($ImplementationPath)

try {
  $targetWidth = $TargetWidth
  $headerHeight = 42
  $sourceHeight = [Math]::Round($source.Height * $targetWidth / $source.Width)
  $implementationHeight = [Math]::Round($implementation.Height * $targetWidth / $implementation.Width)
  $canvas = New-Object System.Drawing.Bitmap($targetWidth, ($headerHeight * 2 + $sourceHeight + $implementationHeight))
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)

  try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(31, 31, 31))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
    $brush = [System.Drawing.Brushes]::White

    $graphics.DrawString("REFERÊNCIA", $font, $brush, 14, 9)
    $graphics.DrawImage($source, 0, $headerHeight, $targetWidth, $sourceHeight)
    $secondHeaderY = $headerHeight + $sourceHeight
    $graphics.DrawString("IMPLEMENTAÇÃO", $font, $brush, 14, ($secondHeaderY + 9))
    $graphics.DrawImage($implementation, 0, ($secondHeaderY + $headerHeight), $targetWidth, $implementationHeight)
    $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    if ($font) { $font.Dispose() }
    if ($graphics) { $graphics.Dispose() }
    if ($canvas) { $canvas.Dispose() }
  }
} finally {
  $source.Dispose()
  $implementation.Dispose()
}
