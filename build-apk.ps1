param(
  [string]$BuildType = "debug"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LJKitchen APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: 检查 Node
Write-Host "[1/4] 检查 Node.js 环境..." -ForegroundColor Yellow
try {
  $nodeVer = node --version
  Write-Host "  Node.js: $nodeVer" -ForegroundColor Green
} catch {
  Write-Host "  错误: 找不到 Node.js，请先安装 Node.js 并配置 PATH" -ForegroundColor Red
  exit 1
}

# Step 2: 构建前端
Write-Host ""
Write-Host "[2/4] 构建前端 (npm run build)..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "  错误: 前端构建失败" -ForegroundColor Red
  Pop-Location
  exit 1
}
Write-Host "  前端构建成功" -ForegroundColor Green

# Step 3: 同步到 Android
Write-Host ""
Write-Host "[3/4] 同步到 Android 项目 (cap sync android)..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
  Write-Host "  错误: Capacitor 同步失败" -ForegroundColor Red
  Pop-Location
  exit 1
}
Write-Host "  同步成功" -ForegroundColor Green

# Step 4: 构建 APK
Write-Host ""
Write-Host "[4/4] 构建 APK..." -ForegroundColor Yellow
Push-Location android

$gradlew = Join-Path $PWD "gradlew.bat"
if (-not (Test-Path $gradlew)) {
  Write-Host "  错误: 找不到 gradlew.bat，请确保 Android 平台已添加" -ForegroundColor Red
  Pop-Location
  Pop-Location
  exit 1
}

if ($BuildType -eq "release") {
  Write-Host "  构建 Release APK..." -ForegroundColor Cyan
  & .\gradlew.bat assembleRelease
} else {
  Write-Host "  构建 Debug APK..." -ForegroundColor Cyan
  & .\gradlew.bat assembleDebug
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "  错误: APK 构建失败" -ForegroundColor Red
  Pop-Location
  Pop-Location
  exit 1
}

Pop-Location
Pop-Location

# 输出结果
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK 构建成功!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

if ($BuildType -eq "release") {
  $apkPath = Join-Path $PSScriptRoot "android\app\build\outputs\apk\release\app-release.apk"
} else {
  $apkPath = Join-Path $PSScriptRoot "android\app\build\outputs\apk\debug\app-debug.apk"
}

Write-Host ""
Write-Host "APK 路径: $apkPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示:" -ForegroundColor Yellow
Write-Host "  - Debug 版可直接安装到手机（需开启 USB 调试）" -ForegroundColor White
Write-Host "  - Release 版需要签名才能安装" -ForegroundColor White
Write-Host "  - 用数据线连接手机后，直接双击 APK 安装" -ForegroundColor White
