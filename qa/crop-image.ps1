param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [Parameter(Mandatory = $true)][int]$X,
  [Parameter(Mandatory = $true)][int]$Y,
  [Parameter(Mandatory = $true)][int]$Width,
  [Parameter(Mandatory = $true)][int]$Height
)

Add-Type -AssemblyName System.Drawing

$image = [System.Drawing.Image]::FromFile($InputPath)
try {
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $sourceRect = New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)
    $targetRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $graphics.DrawImage($image, $targetRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
} finally {
  $image.Dispose()
}
