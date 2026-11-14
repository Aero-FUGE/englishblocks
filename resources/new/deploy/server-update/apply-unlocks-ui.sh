#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
if docker info >/dev/null 2>&1; then D=(docker); else sudo -v; D=(sudo docker); fi
NAME=englishblocks
"${D[@]}" inspect "$NAME" >/dev/null
WORK="$(mktemp -d /home/ubuntu/englishblocks-unlocks-XXXXXX)"
cd "$WORK"
echo '下载主题、头像与账号同步更新（约 2MB）……'
curl --http1.1 -fL --retry 10 --retry-all-errors --retry-delay 3 --connect-timeout 30 \
 https://github.com/Aero-FUGE/englishblocks/releases/download/ui-20261114-unlocks/englishblocks-unlocks-ui.tar.gz -o update.tar.gz
echo '25f9311992a1819c280596f68c703dd3d951fa441e9205d6bfff5baaa29f1f9b  update.tar.gz' | sha256sum -c -
tar -xzf update.tar.gz
"${D[@]}" cp "$NAME:/app/dist/index.html" ./previous-index.html
"${D[@]}" cp assets/. "$NAME:/app/dist/assets/"
"${D[@]}" cp index.html "$NAME:/app/dist/index.html"
if ! curl -fsS --max-time 15 http://127.0.0.1:3000/ -o served-index.html || ! grep -Fq 'index-DKpncFl6.js' served-index.html; then
 "${D[@]}" cp previous-index.html "$NAME:/app/dist/index.html"
 echo "页面验证失败，已恢复旧入口。备份在 $WORK"; exit 1
fi
echo "更新成功！旧页面备份：$WORK/previous-index.html"
echo '账号、存档、密钥与备案信息保留。打开 https://englishblocks.cn/?v=unlocks1 刷新。'
