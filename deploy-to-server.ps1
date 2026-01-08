# 玉珍健身生产环境部署脚本
# 服务器: 182.92.78.183
# 更新日期: 2026-01-07

param(
    [string]$ServerIP = "182.92.78.183",
    [string]$ServerUser = "root",
    [string]$SSHKeyPath = "",
    [switch]$SkipBuild = $false
)

Write-Host "🚀 开始部署玉珍健身到生产服务器..." -ForegroundColor Green
Write-Host "服务器: $ServerIP" -ForegroundColor Cyan
Write-Host ""

# 步骤1: 构建前端应用
if (-not $SkipBuild) {
    Write-Host "📦 步骤1: 构建前端应用..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 构建失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 构建完成！" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  跳过构建步骤（使用现有dist目录）" -ForegroundColor Yellow
    Write-Host ""
}

# 步骤2: 检查dist目录
Write-Host "📁 步骤2: 检查构建文件..." -ForegroundColor Yellow
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist目录不存在！请先运行构建。" -ForegroundColor Red
    exit 1
}
$distFiles = Get-ChildItem -Path "dist" -Recurse | Measure-Object
Write-Host "✅ 找到 $($distFiles.Count) 个文件" -ForegroundColor Green
Write-Host ""

# 步骤3: 上传到服务器
Write-Host "📤 步骤3: 上传文件到服务器..." -ForegroundColor Yellow
Write-Host "目标: $ServerUser@$ServerIP:/usr/share/nginx/html/" -ForegroundColor Cyan

# 构建SCP命令
$scpCommand = "scp -r dist/* ${ServerUser}@${ServerIP}:/usr/share/nginx/html/"
if ($SSHKeyPath) {
    $scpCommand = "scp -i `"$SSHKeyPath`" -r dist/* ${ServerUser}@${ServerIP}:/usr/share/nginx/html/"
}

Write-Host "执行命令: $scpCommand" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  请输入服务器密码（如果使用密钥则自动登录）" -ForegroundColor Yellow
Write-Host ""

# 执行上传
Invoke-Expression $scpCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 上传失败！" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 故障排查建议:" -ForegroundColor Yellow
    Write-Host "1. 检查服务器IP是否正确: $ServerIP" -ForegroundColor White
    Write-Host "2. 检查SSH连接是否正常: ssh $ServerUser@$ServerIP" -ForegroundColor White
    Write-Host "3. 检查目标目录权限: /usr/share/nginx/html/" -ForegroundColor White
    Write-Host "4. 如果使用密钥，请指定: -SSHKeyPath `"path/to/key.pem`"" -ForegroundColor White
    exit 1
}

Write-Host "✅ 文件上传完成！" -ForegroundColor Green
Write-Host ""

# 步骤4: 重启Nginx
Write-Host "🔄 步骤4: 重启Nginx服务..." -ForegroundColor Yellow

$sshCommand = "ssh"
if ($SSHKeyPath) {
    $sshCommand += " -i `"$SSHKeyPath`""
}
$sshCommand += " ${ServerUser}@${ServerIP} `"docker exec fitness_nginx_v2 nginx -s reload`""

Write-Host "执行命令: $sshCommand" -ForegroundColor Gray
Invoke-Expression $sshCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nginx重启失败，但文件已上传" -ForegroundColor Yellow
    Write-Host "请手动SSH到服务器执行: docker exec fitness_nginx_v2 nginx -s reload" -ForegroundColor White
} else {
    Write-Host "✅ Nginx重启完成！" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📝 访问地址:" -ForegroundColor Cyan
Write-Host "   主站: https://yuzhen-fitness.cn" -ForegroundColor White
Write-Host "   国际: https://yuzhen-fitness.fun" -ForegroundColor White
Write-Host "   商城: https://yuzhen-fitness.shop" -ForegroundColor White
Write-Host "   测试: https://yuzhen-fitness.online" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意事项:" -ForegroundColor Yellow
Write-Host "1. 首次访问可能需要清除浏览器缓存" -ForegroundColor White
Write-Host "2. 如果域名未解析，请先配置DNS" -ForegroundColor White
Write-Host "3. 如果SSL证书未配置，请参考部署文档" -ForegroundColor White
Write-Host ""
Write-Host "📚 相关文档:" -ForegroundColor Cyan
Write-Host "   - docs/06-部署指南/deployment-implementation-plan.md" -ForegroundColor White
Write-Host "   - DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host ""
