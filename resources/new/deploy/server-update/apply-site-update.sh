#!/usr/bin/env bash
# In-place code update; keeps the existing container, environment, mounts and HTTPS proxy.
set -Eeuo pipefail
umask 077
NAME="${ENGLISHBLOCKS_CONTAINER:-englishblocks}"
PORT="${ENGLISHBLOCKS_PORT:-3000}"
ROOT="${ENGLISHBLOCKS_UI_UPDATE_DIR:-/home/ubuntu/englishblocks-ui-updates}"
BASE_URL="${ENGLISHBLOCKS_UI_UPDATE_URL:-https://github.com/Aero-FUGE/englishblocks/releases/download/site-20261116-stage5}"
if docker info >/dev/null 2>&1; then D=(docker); else sudo -v; D=(sudo docker); fi
[[ "$("${D[@]}" inspect "$NAME" --format '{{.State.Running}}')" = true ]] || { echo '网站容器未运行，停止更新。'; exit 1; }
"${D[@]}" inspect "$NAME" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' | grep -q . || { echo '未找到持久存档挂载，停止更新。'; exit 1; }
mkdir -p "$ROOT"
exec 9>"$ROOT/.ui-update.lock"
flock -n 9 || { echo '另一个更新正在运行，请稍后再试。'; exit 1; }
WORK="$(mktemp -d "$ROOT/stage5-XXXXXX")"
MUTATED=0
healthy(){ curl -fsS --max-time 3 "http://127.0.0.1:$PORT/api/cloud/health" -o "$WORK/health.json" && python3 -c 'import json,sys;sys.exit(0 if json.load(open(sys.argv[1])).get("ok") is True else 1)' "$WORK/health.json"; }
rollback(){
 local status="$1"; trap - ERR INT TERM
 if [[ "$MUTATED" = 1 ]]; then
  echo '验证未通过，恢复原程序……'
  "${D[@]}" stop "$NAME" >/dev/null 2>&1 || true
  "${D[@]}" cp "$WORK/backup/server/." "$NAME:/app/server/" || true
  "${D[@]}" cp "$WORK/backup/shared/." "$NAME:/app/shared/" || true
  "${D[@]}" cp "$WORK/backup/index.html" "$NAME:/app/dist/index.html" || true
  if [[ -f "$WORK/backup/VERSION.json" ]]; then "${D[@]}" cp "$WORK/backup/VERSION.json" "$NAME:/app/DEPLOYED_VERSION.json" || true; fi
  "${D[@]}" start "$NAME" >/dev/null || true
  for attempt in $(seq 1 20); do if healthy >/dev/null 2>&1; then echo '原网站已恢复。'; break; fi; sleep 1; done
 fi
 echo "更新未完成，存档和密钥未删除。备份目录：$WORK"; exit "$status"
}
trap 'rollback $?' ERR
trap 'rollback 130' INT
trap 'rollback 143' TERM
cd "$WORK"
echo '下载最新更新包（约 2.9MB），现有网站继续运行……'
curl --http1.1 -fL --retry 10 --retry-all-errors --retry-delay 3 --connect-timeout 30 "$BASE_URL/englishblocks-site-update.tar.gz" -o update.tar.gz
echo '09a1164c8f3adea16109cfc8d2ce74dd4e170e5f42bd4892f0e3d1f9cc55987d  update.tar.gz' | sha256sum -c -
tar -xzf update.tar.gz
sha256sum -c SHA256SUMS >/dev/null
mkdir -p backup/server backup/shared backup/data
"${D[@]}" cp "$NAME:/app/dist/index.html" backup/index.html
"${D[@]}" cp "$NAME:/app/server/." backup/server/
"${D[@]}" cp "$NAME:/app/shared/." backup/shared/
"${D[@]}" cp "$NAME:/app/DEPLOYED_VERSION.json" backup/VERSION.json 2>/dev/null || true
# Static hashed assets can be copied while the old website still runs.
"${D[@]}" cp dist/assets/. "$NAME:/app/dist/assets/"
MUTATED=1
echo '备份存档并短暂重启网站……'
"${D[@]}" stop "$NAME" >/dev/null
"${D[@]}" cp "$NAME:/data/." backup/data/
"${D[@]}" cp server/. "$NAME:/app/server/"
"${D[@]}" cp shared/. "$NAME:/app/shared/"
"${D[@]}" cp VERSION.json "$NAME:/app/DEPLOYED_VERSION.json"
"${D[@]}" start "$NAME" >/dev/null
READY=0
for attempt in $(seq 1 30); do if healthy >/dev/null 2>&1; then READY=1; break; fi; sleep 1; done
[[ "$READY" = 1 ]]
"${D[@]}" exec "$NAME" node -e 'const c=require("/app/server/social-catalog.json");if(c.levels.filter(l=>l.tier===5).length!==30)process.exit(1)'
"${D[@]}" cp dist/index.html "$NAME:/app/dist/index.html"
curl -fsS --max-time 15 "http://127.0.0.1:$PORT/" -o served-index.html
grep -Fq 'index-CuSD4WUf.js' served-index.html
grep -Fq '宁ICP备2026004648号' served-index.html
grep -Fq 'https://beian.miit.gov.cn/' served-index.html
MUTATED=0
trap - ERR INT TERM
echo "网站更新成功！备份：$WORK/backup"
echo '已同步：第五阶段、音乐史移除、好友小窝、四季按钮、每日挑战玻璃卡片和统一小鱼干图标。'
echo '原账号、存档、小鱼干、API密钥、HTTPS配置均保留。'
echo '打开 https://englishblocks.cn/?v=stage5-glass1 并刷新。'
