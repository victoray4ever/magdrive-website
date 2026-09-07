#!/usr/bin/env bash
set -e

echo "=============================================="
echo "  🚀 迈德瑞网站 自动化部署与环境初始化脚本"
echo "  适用于: Oracle Cloud ARM (Ubuntu / Oracle Linux)"
echo "=============================================="

# 确保目标目录
TARGET_DIR="/var/www/magdrive"
mkdir -p ""
cp -r ./* "/"

# 安装 systemd 服务
cp "/deploy/magdrive.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable magdrive
systemctl restart magdrive

echo "✅ MagDrive 本地服务已启动在 127.0.0.1:8080"
systemctl status magdrive --no-pager
