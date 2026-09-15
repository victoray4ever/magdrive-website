#!/bin/bash
# ==============================================================================
# MagDrive 智能装备官网 - GitHub Webhook 自动部署更新脚本
# 当代码推送到 GitHub 仓库时，由 server.py 的 /api/webhook 接口在后台自动调用
# ==============================================================================

set -e

LOG_FILE="/var/log/magdrive_deploy.log"
REPO_DIR="/var/www/magdrive-repo"
TARGET_DIR="/var/www/magdrive"

# 重定向所有标准输出与错误输出至日志文件
mkdir -p "$(dirname "$LOG_FILE")"
exec >> "$LOG_FILE" 2>&1

echo "=================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 收到 GitHub 代码更新触发，开始自动部署..."

if [ ! -d "$REPO_DIR" ]; then
    echo "[ERROR] 仓库目录 $REPO_DIR 不存在，部署中止！"
    exit 1
fi

cd "$REPO_DIR"

# 记录更新前版本
OLD_REV=$(git rev-parse HEAD 2>/dev/null || echo "none")

# 从 GitHub 拉取主分支最新代码
echo "[INFO] 正在拉取 GitHub origin/main 最新提交..."
git fetch origin main
git reset --hard origin/main
NEW_REV=$(git rev-parse HEAD)

echo "[INFO] 代码已同步: ${OLD_REV:0:7} -> ${NEW_REV:0:7}"
COMMIT_MSG=$(git log -1 --pretty=format:"%h - %s (%an)")
echo "[INFO] 最新提交: $COMMIT_MSG"

# 同步文件到运行目录，严格排除生产环境敏感数据和动态生成的文件
if [ -d "$REPO_DIR/website" ]; then
    echo "[INFO] 同步网站文件到生产环境 $TARGET_DIR ..."
    rsync -av \
        --exclude 'data/admin.json' \
        --exclude 'data/inquiries.json' \
        --exclude 'data/webhook_secret.txt' \
        --exclude '__pycache__' \
        "$REPO_DIR/website/" "$TARGET_DIR/"
    
    chmod +x "$TARGET_DIR/deploy/webhook_deploy.sh" 2>/dev/null || true
fi

# 如果 server.py 发生变化，需要重启 Python 服务
if [ "$OLD_REV" != "$NEW_REV" ]; then
    CHANGED_FILES=$(git diff --name-only "$OLD_REV" "$NEW_REV" 2>/dev/null || echo "")
    if echo "$CHANGED_FILES" | grep -q "website/server.py"; then
        echo "[INFO] 检测到 server.py 发生变动，准备异步重启 magdrive 服务..."
        # 延迟 1 秒在后台重启，确保当前 HTTP 请求已完成响应
        (sleep 1 && systemctl restart magdrive) >/dev/null 2>&1 &
        echo "[INFO] 服务重启指令已派发。"
    else
        echo "[INFO] 仅静态资源或文案更新，前端已直接生效，无需重启服务。"
    fi
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 自动部署执行成功！"
echo "=================================================="
