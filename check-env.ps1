Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Android Build Environment Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# Java
Write-Host "[1] Java (JDK)" -ForegroundColor Yellow
try {
  $javaVer = java -version 2>&1
  Write-Host "    OK: $($javaVer[0])" -ForegroundColor Green
} catch {
  Write-Host "    缺失: 找不到 java，请安装 JDK 8+" -ForegroundColor Red
  Write-Host "    您的 JDK: E:\study\jdk8\bin\java.exe" -ForegroundColor White
  Write-Host "    需要把 E:\study\jdk8\bin 加入系统 PATH" -ForegroundColor White
  $allOk = $false
}
Write-Host ""

# Android SDK
Write-Host "[2] Android SDK" -ForegroundColor Yellow
$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) { $sdkPath = $env:ANDROID_SDK_ROOT }
if ($sdkPath -and (Test-Path $sdkPath)) {
  Write-Host "    OK: $sdkPath" -ForegroundColor Green
} else {
  Write-Host "    缺失: 未找到 ANDROID_HOME 环境变量" -ForegroundColor Red
  Write-Host "    请安装 Android Studio 或单独安装 Android SDK" -ForegroundColor White
  $allOk = $false
}
Write-Host ""

# Gradle
Write-Host "[3] Gradle (Android 项目自带 wrapper)" -ForegroundColor Yellow
$gradlew = Join-Path $PSScriptRoot "android\gradlew.bat"
if (Test-Path $gradlew) {
  Write-Host "    OK: gradlew.bat 存在 (项目自带)" -ForegroundColor Green
} else {
  Write-Host "    警告: gradlew.bat 不存在，请先执行 cap add android" -ForegroundColor Red
  $allOk = $false
}
Write-Host ""

# Node
Write-Host "[4] Node.js" -ForegroundColor Yellow
try {
  $nodeVer = node --version
  Write-Host "    OK: $nodeVer" -ForegroundColor Green
} catch {
  Write-Host "    缺失: 找不到 node" -ForegroundColor Red
  $allOk = $false
}
Write-Host ""

if ($allOk) {
  Write-Host "========================================" -ForegroundColor Green
  Write-Host "  环境检查通过，可以构建 APK!" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
} else {
  Write-Host "========================================" -ForegroundColor Red
  Write-Host "  环境不完整，请先安装缺失的组件" -ForegroundColor Red
  Write-Host "========================================" -ForegroundColor Red
}
Write-Host ""
Write-Host "构建 APK 命令:" -ForegroundColor Cyan
Write-Host "  .\build-apk.ps1          # Debug 版" -ForegroundColor White
Write-Host "  .\build-apk.ps1 release  # Release 版" -ForegroundColor White
