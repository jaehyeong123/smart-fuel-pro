$ErrorActionPreference = "Stop"

$workspace = (Get-Location).Path
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$zipTarget = Join-Path $desktop "smart-fuel-pro.zip"

Write-Host "Creating zip package at: $zipTarget"
Write-Host "Source workspace: $workspace"

if (Test-Path $zipTarget) {
    Remove-Item -Path $zipTarget -Force
    Write-Host "Existing zip archive removed."
}

# Collect all root items excluding node_modules
$items = Get-ChildItem -Path $workspace -Force | Where-Object { $_.Name -ne 'node_modules' }

Write-Host "Compressing $($items.Count) items..."
Compress-Archive -Path $items.FullName -DestinationPath $zipTarget -CompressionLevel Optimal

if (Test-Path $zipTarget) {
    $zipItem = Get-Item $zipTarget
    $sizeMB = [Math]::Round($zipItem.Length / 1MB, 2)
    Write-Host "SUCCESS: Created $zipTarget ($sizeMB MB)"
} else {
    Write-Error "Failed to create $zipTarget"
}
