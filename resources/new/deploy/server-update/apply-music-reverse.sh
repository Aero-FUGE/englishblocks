#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
NAME="${ENGLISHBLOCKS_CONTAINER:-englishblocks}"
PORT="${ENGLISHBLOCKS_PORT:-3000}"
BASE_URL="${ENGLISHBLOCKS_UI_UPDATE_URL:-https://github.com/Aero-FUGE/englishblocks/releases/download/ui-20261114-music-reverse}"
ROOT="${ENGLISHBLOCKS_UI_UPDATE_DIR:-/home/ubuntu/englishblocks-ui-updates}"
if docker info >/dev/null 2>&1; then D=(docker); else sudo -v; D=(sudo docker); fi
[[ "$("${D[@]}" inspect "$NAME" --format '{{.State.Running}}')" = true ]] || { echo '游戏容器未运行，停止更新。'; exit 1; }
mkdir -p "$ROOT"
exec 9>"$ROOT/.ui-update.lock"
flock -n 9 || { echo '另一个更新正在运行，请稍后再试。'; exit 1; }
WORK="$(mktemp -d "$ROOT/music-reverse-XXXXXX")"
MUTATED=0
healthy(){ curl -fsS --max-time 3 "http://127.0.0.1:$PORT/api/cloud/health" -o "$WORK/health.json" && python3 -c 'import json,sys;sys.exit(0 if json.load(open(sys.argv[1])).get("ok") is True else 1)' "$WORK/health.json"; }
rollback(){
 local status="$1"; trap - ERR INT TERM
 if [[ "$MUTATED" = 1 ]]; then
  echo '验证未通过，恢复旧页面与存档校验代码……'
  "${D[@]}" cp "$WORK/backup/shared/." "$NAME:/app/shared/" || true
  "${D[@]}" cp "$WORK/backup/index.html" "$NAME:/app/dist/index.html" || true
  "${D[@]}" restart "$NAME" >/dev/null || true
  for attempt in $(seq 1 15); do if healthy >/dev/null 2>&1; then echo '原网站已恢复。'; break; fi; sleep 1; done
 fi
 echo "更新未完成；存档卷与密钥未修改。备份：$WORK"; exit "$status"
}
trap 'rollback $?' ERR
trap 'rollback 130' INT
trap 'rollback 143' TERM
cd "$WORK"
echo '下载最新网页增量包（约 3.5MB），现有网站继续运行……'
curl --http1.1 -fL --retry 10 --retry-all-errors --retry-delay 3 --connect-timeout 30 "$BASE_URL/englishblocks-music-reverse.tar.gz" -o update.tar.gz
echo 'e55107fc8a2a4dbebcc296e47585dee2d21e9459c1058458f26d7ecb2ca677f6  update.tar.gz' | sha256sum -c -
tar -xzf update.tar.gz
mkdir -p backup/shared
"${D[@]}" cp "$NAME:/app/dist/index.html" backup/index.html
"${D[@]}" cp "$NAME:/app/shared/." backup/shared/
"${D[@]}" cp dist/assets/. "$NAME:/app/dist/assets/"
MUTATED=1
"${D[@]}" cp shared/. "$NAME:/app/shared/"
echo '短暂重启，加载兼容新旧存档的校验代码……'
"${D[@]}" restart "$NAME" >/dev/null
READY=0
for attempt in $(seq 1 30); do if healthy >/dev/null 2>&1; then READY=1; break; fi; sleep 1; done
[[ "$READY" = 1 ]]
"${D[@]}" cp dist/index.html "$NAME:/app/dist/index.html"
curl -fsS --max-time 15 "http://127.0.0.1:$PORT/" -o served-index.html
grep -Fq 'index-BP1NBrFN.js' served-index.html
MUTATED=0
trap - ERR INT TERM
echo "网站更新成功！旧页面备份：$WORK/backup"
echo '英语进度、账号、密钥、小鱼干、HTTPS 与备案链接已保留。'
echo '已包含：37题语义挖空、正常/反向模式、词块提示、个人内容修改和最新主页排版。'
echo '打开 https://englishblocks.cn/?v=music-reverse1 并刷新。'
