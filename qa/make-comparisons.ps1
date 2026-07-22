Add-Type -AssemblyName System.Drawing

function New-SettingsComparison {
  param(
    [string]$SourcePath,
    [string]$ImplementationPath,
    [string]$OutputPath
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  $implementation = [System.Drawing.Image]::FromFile($ImplementationPath)
  $targetWidth = $implementation.Width
  $targetHeight = $implementation.Height
  $targetAspect = $targetWidth / $targetHeight
  $cropWidth = [int]($source.Height * $targetAspect)
  $cropX = [int](($source.Width - $cropWidth) / 2)
  $normalized = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
  $normalGraphics = [System.Drawing.Graphics]::FromImage($normalized)
  $normalGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $normalGraphics.DrawImage(
    $source,
    (New-Object System.Drawing.Rectangle(0, 0, $targetWidth, $targetHeight)),
    (New-Object System.Drawing.Rectangle($cropX, 0, $cropWidth, $source.Height)),
    [System.Drawing.GraphicsUnit]::Pixel
  )

  $labelHeight = 38
  $canvas = New-Object System.Drawing.Bitmap(($targetWidth * 2), ($targetHeight + $labelHeight))
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::White)
  $font = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Regular)
  $brush = [System.Drawing.Brushes]::Black
  $graphics.DrawString('Referência', $font, $brush, 12, 8)
  $graphics.DrawString('Implementação', $font, $brush, ($targetWidth + 12), 8)
  $graphics.DrawImage($normalized, 0, $labelHeight, $targetWidth, $targetHeight)
  $graphics.DrawImage($implementation, $targetWidth, $labelHeight, $targetWidth, $targetHeight)
  $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $font.Dispose()
  $canvas.Dispose()
  $normalGraphics.Dispose()
  $normalized.Dispose()
  $implementation.Dispose()
  $source.Dispose()
}

function New-ContextComparison {
  param(
    [string]$SourcePath,
    [string]$ImplementationPath,
    [string]$OutputPath
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  $implementation = [System.Drawing.Image]::FromFile($ImplementationPath)
  $targetWidth = 550
  $targetHeight = 437
  $crop = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
  $cropGraphics = [System.Drawing.Graphics]::FromImage($crop)
  $cropGraphics.Clear([System.Drawing.Color]::Black)
  $cropGraphics.DrawImage(
    $implementation,
    (New-Object System.Drawing.Rectangle(0, 0, $targetWidth, $targetHeight)),
    (New-Object System.Drawing.Rectangle(610, 290, 570, 420)),
    [System.Drawing.GraphicsUnit]::Pixel
  )

  $labelHeight = 38
  $canvas = New-Object System.Drawing.Bitmap(($targetWidth * 2), ($targetHeight + $labelHeight))
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::White)
  $font = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString('Referência', $font, [System.Drawing.Brushes]::Black, 12, 8)
  $graphics.DrawString('Implementação', $font, [System.Drawing.Brushes]::Black, ($targetWidth + 12), 8)
  $graphics.DrawImage($source, 0, $labelHeight, $targetWidth, $targetHeight)
  $graphics.DrawImage($crop, $targetWidth, $labelHeight, $targetWidth, $targetHeight)
  $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $font.Dispose()
  $canvas.Dispose()
  $cropGraphics.Dispose()
  $crop.Dispose()
  $implementation.Dispose()
  $source.Dispose()
}

$qaRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
New-SettingsComparison `
  -SourcePath 'C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-bc11ada8-b191-4f2e-a9ba-fce7d188f1ea.png' `
  -ImplementationPath (Join-Path $qaRoot 'settings-network-current.png') `
  -OutputPath (Join-Path $qaRoot 'compare-settings-network.png')
New-SettingsComparison `
  -SourcePath 'C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-7032f122-bc27-43c8-a000-46a01528f634.png' `
  -ImplementationPath (Join-Path $qaRoot 'settings-personalization-current.png') `
  -OutputPath (Join-Path $qaRoot 'compare-settings-personalization.png')
New-ContextComparison `
  -SourcePath 'C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-6ae16943-2d90-489f-85d3-bec02ef557a1.png' `
  -ImplementationPath (Join-Path $qaRoot 'context-menu-current.png') `
  -OutputPath (Join-Path $qaRoot 'compare-context-menu.png')
