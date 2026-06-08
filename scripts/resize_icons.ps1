param (
    [string]$srcPath = "C:\Users\User\.gemini\antigravity-ide\brain\ee644bba-4fcb-4770-887b-6107b69e4803\visions_app_icon_1780893869770.png",
    [string]$destDir = "c:\xampp\htdocs\Visions\public"
)

# Ensure output directory exists
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

# Load System.Drawing assembly
[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

function Resize-Image {
    param (
        [string]$source,
        [string]$destination,
        [int]$width,
        [int]$height
    )
    $srcImg = [System.Drawing.Image]::FromFile($source)
    $destBmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    
    # Configure high quality rendering
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($srcImg, 0, 0, $width, $height)
    
    # Save image
    $destBmp.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $destBmp.Dispose()
    $srcImg.Dispose()
    Write-Host "Resized to $width x $height and saved to $destination"
}

# Generate 512x512
Resize-Image -source $srcPath -destination (Join-Path $destDir "icon-512.png") -width 512 -height 512

# Generate 192x192
Resize-Image -source $srcPath -destination (Join-Path $destDir "icon-192.png") -width 192 -height 192

# Generate favicon.ico (as PNG formatted file, which browsers accept)
Resize-Image -source $srcPath -destination (Join-Path $destDir "favicon.ico") -width 32 -height 32

Write-Host "All icons resized successfully."
