#!/usr/bin/env bash
set -e
cd ""/bin/website"
tar -czvf ../magdrive-website-deploy.tar.gz --exclude=".*" ./*
echo "✅ 打包完成: magdrive-website-deploy.tar.gz"
