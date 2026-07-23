Write-Host "=== CURRENT LOCATION ===" -ForegroundColor Cyan
Get-Location

Write-Host "`n=== TOP LEVEL FILES ===" -ForegroundColor Cyan
Get-ChildItem -Force | Select-Object Name, Mode

Write-Host "`n=== SEARCHING FOR WORKSPACE PACKAGES ===" -ForegroundColor Cyan
Get-ChildItem -Path ..\..\ -Recurse -Directory -ErrorAction SilentlyContinue |
Where-Object {$_.Name -match "api-client|workspace|packages|apps"} |
Select-Object FullName

Write-Host "`n=== ALL PACKAGE.JSON FILES ===" -ForegroundColor Cyan
Get-ChildItem -Path ..\..\ -Recurse -Filter package.json -ErrorAction SilentlyContinue |
Select-Object FullName

Write-Host "`n=== CHECKING ROOT PACKAGE.JSON ===" -ForegroundColor Cyan
$rootPackage = Get-ChildItem -Path ..\..\ -Filter package.json -ErrorAction SilentlyContinue | Select-Object -First 1

if ($rootPackage) {
    Get-Content $rootPackage.FullName | Select-String "workspaces|api-client|workspace"
}
else {
    Write-Host "No root package.json found"
}

Write-Host "`n=== CHECKING CURRENT PACKAGE.JSON ===" -ForegroundColor Cyan
Get-Content .\package.json | Select-String "workspace|api-client"

Write-Host "`n=== CHECKING INSTALLED API CLIENT ===" -ForegroundColor Cyan
$apiPath = ".\node_modules\@workspace\api-client-react"

if (Test-Path $apiPath) {
    Write-Host "Found: $apiPath" -ForegroundColor Green
    
    if (Test-Path "$apiPath\package.json") {
        Write-Host "`nPackage information:"
        Get-Content "$apiPath\package.json"
    }
    else {
        Write-Host "No package.json inside api-client-react" -ForegroundColor Red
    }
}
else {
    Write-Host "api-client-react NOT found in node_modules" -ForegroundColor Red
}

Write-Host "`n=== SEARCHING ALL REFERENCES ===" -ForegroundColor Cyan
Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue |
Select-String "@workspace/api-client-react" |
Select-Object Path, LineNumber, Line

Write-Host "`n=== DONE ===" -ForegroundColor Green