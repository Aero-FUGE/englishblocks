#!/usr/bin/env bash
# Upgrade the existing single-container installation without changing Caddy or its certificates.
set -Eeuo pipefail
umask 077
RELEASE='server-20261113-bb5072f'
SOURCE_SHA='bb5072f'
BASE_URL="${ENGLISHBLOCKS_UPDATE_URL:-https://github.com/Aero-FUGE/englishblocks/releases/download/$RELEASE}"
NAME="${ENGLISHBLOCKS_CONTAINER:-englishblocks}"
PORT="${ENGLISHBLOCKS_PORT:-3000}"
ROOT="${ENGLISHBLOCKS_RELEASE_DIR:-$HOME/englishblocks-releases}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)-$$"
WORK="$ROOT/$RELEASE-$STAMP"
OLD="$NAME-previous-$STAMP"
BASE_TAG="englishblocks:base-$STAMP"
NEW_TAG="englishblocks:$RELEASE"
STOPPED=0
RENAMED=0
COMMITTED=0
for command in docker python3 curl tar sha256sum; do command -v "$command" >/dev/null || { echo "缺少命令：$command"; exit 1; }; done
if docker info >/dev/null 2>&1; then D=(docker); else sudo -v; D=(sudo docker); fi
mkdir -p "$WORK"
chmod 700 "$ROOT" "$WORK"
fail_update() {
  local status="$1"
  trap - ERR INT TERM
  if [[ "$COMMITTED" = 0 && "$STOPPED" = 1 ]]; then
    echo '更新未通过验证，正在恢复旧容器……'
    if [[ "$RENAMED" = 1 ]] || "${D[@]}" inspect "$OLD" >/dev/null 2>&1; then
      "${D[@]}" rm -f "$NAME" >/dev/null 2>&1 || true
      "${D[@]}" rename "$OLD" "$NAME" || true
    fi
    "${D[@]}" start "$NAME" >/dev/null || true
    local recovered=0
    for recovery_attempt in $(seq 1 15); do
      if curl -fsS --max-time 3 "http://127.0.0.1:$PORT/api/cloud/health" >/dev/null 2>&1; then recovered=1; break; fi
      sleep 1
    done
    if [[ "$recovered" = 1 ]]; then echo '旧版已恢复运行。'; else echo '请检查旧容器的启动日志，旧存档卷和备份均已保留。'; fi
  fi
  echo "更新未完成；原存档卷未删除。诊断和备份目录：$WORK"
  exit "$status"
}
trap 'fail_update $?' ERR
trap 'fail_update 130' INT
trap 'fail_update 143' TERM
"${D[@]}" inspect "$NAME" > "$WORK/container-inspect.json"
python3 - "$WORK" "$PORT" <<'PY'
import json,sys,pathlib
root=pathlib.Path(sys.argv[1]); old=json.loads((root/'container-inspect.json').read_text())[0]
if not old['State']['Running']: raise SystemExit('当前游戏容器未运行，请先恢复原服务。')
settings=dict(item.split('=',1) for item in old['Config'].get('Env',[]) if '=' in item)
if settings.get('CLOUD_DATA_DIR','/data')!='/data': raise SystemExit('存档目录不是 /data，已停止自动更新，请先核对挂载。')
mounts=[m for m in old.get('Mounts',[]) if m['Destination']=='/data' and m['Type'] in ('volume','bind')]
if len(mounts)!=1: raise SystemExit('没有找到唯一的持久存档挂载；为保护数据，停止更新。')
bindings=(old.get('NetworkSettings',{}).get('Ports',{}).get('3000/tcp') or old.get('HostConfig',{}).get('PortBindings',{}).get('3000/tcp') or [])
if not any(p['HostPort']==sys.argv[2] for p in bindings): raise SystemExit('现有游戏端口与预期不同，停止更新。')
values=old['Config'].get('Env',[])
if any('\n' in item or '\r' in item for item in values): raise SystemExit('环境变量包含换行，请人工迁移。')
(root/'container.env').write_text('\n'.join(values)+'\n')
m=mounts[0]; meta={'image':old['Image'],'data':m['Name'] if m['Type']=='volume' else m['Source'],'version':(old['Config'].get('Labels') or {}).get('io.englishblocks.release','')}
(root/'metadata.json').write_text(json.dumps(meta))
PY
OLD_IMAGE="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["image"])' "$WORK/metadata.json")"
DATA="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["data"])' "$WORK/metadata.json")"
INSTALLED="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["version"])' "$WORK/metadata.json")"
if [[ "$INSTALLED" = "$RELEASE" ]] && curl -fsS --max-time 10 "http://127.0.0.1:$PORT/api/cloud/health" >/dev/null; then
  echo "当前已是最新版 $RELEASE，无需重复更新。"
  exit 0
fi
"${D[@]}" run --rm --network none --entrypoint node "$OLD_IMAGE" -e "require('express');require('dotenv');require('node:sqlite');if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
FREE_KB="$(df -Pk "$ROOT" | awk 'NR==2 {print $4}')"
if (( FREE_KB < 1048576 )); then echo '磁盘剩余不足 1GB，停止更新。'; exit 1; fi
fetch() { curl --fail --location --retry 3 --retry-delay 3 --connect-timeout 20 --max-time 3600 "$BASE_URL/$1" -o "$WORK/$1"; }
verify() { (cd "$WORK"; grep "  $1$" SHA256SUMS | sha256sum -c -); }
extract() {
  python3 - "$WORK/$1" <<'PY'
import sys,tarfile,pathlib
with tarfile.open(sys.argv[1],'r:gz') as archive:
    for m in archive.getmembers():
        p=pathlib.PurePosixPath(m.name)
        if p.is_absolute() or '..' in p.parts or not (m.isfile() or m.isdir()) or p.parts[0] not in ('dist','server','shared','Dockerfile.update','VERSION.json','audio-manifest.json'): raise SystemExit('更新包路径校验失败')
PY
  tar -xzf "$WORK/$1" -C "$WORK/app"
}
echo '下载最新版；下载期间原网站继续运行……'
fetch SHA256SUMS
fetch englishblocks-web.tar.gz
verify englishblocks-web.tar.gz
mkdir "$WORK/app"
extract englishblocks-web.tar.gz
python3 - "$WORK/app/VERSION.json" "$SOURCE_SHA" <<'PY'
import json,sys
if json.load(open(sys.argv[1]))['source']!=sys.argv[2]: raise SystemExit('更新包版本不匹配')
PY
# Reuse identical music/SFX from the existing image; fetch the complete audio pack only if needed.
if ! "${D[@]}" run --rm --network none --entrypoint node -v "$WORK/app/audio-manifest.json:/manifest.json:ro" "$OLD_IMAGE" -e 'const fs=require("fs"),crypto=require("crypto");const m=JSON.parse(fs.readFileSync("/manifest.json"));for(const [p,h]of Object.entries(m)){try{if(crypto.createHash("sha256").update(fs.readFileSync("/app/dist/"+p)).digest("hex")!==h)process.exit(42)}catch{process.exit(42)}}'; then
  echo '需要补齐音乐素材，正在下载音频包……'
  fetch englishblocks-audio.tar.gz
  verify englishblocks-audio.tar.gz
  extract englishblocks-audio.tar.gz
fi
"${D[@]}" image tag "$OLD_IMAGE" "$BASE_TAG"
echo '准备新镜像；继续保留现有网站运行……'
"${D[@]}" build --pull=false -f "$WORK/app/Dockerfile.update" --build-arg "BASE_IMAGE=$BASE_TAG" --build-arg "RELEASE_VERSION=$RELEASE" -t "$NEW_TAG" "$WORK/app"
echo '短暂停服，备份存档并切换版本……'
# Mark before stopping, so interruption during docker stop also starts the old container again.
STOPPED=1
"${D[@]}" stop --time 30 "$NAME" >/dev/null
mkdir "$WORK/backup"
"${D[@]}" run --rm --network none --user 0:0 --entrypoint sh -v "$DATA:/data:ro" -v "$WORK/backup:/backup" "$OLD_IMAGE" -c 'umask 077; tar -czf /backup/data.tar.gz -C /data .'
"${D[@]}" rename "$NAME" "$OLD"
RENAMED=1
"${D[@]}" run -d --name "$NAME" --restart unless-stopped --env-file "$WORK/container.env" -e CLOUD_DATA_DIR=/data -e PORT=3000 -e HOST=0.0.0.0 -p "127.0.0.1:$PORT:3000" -v "$DATA:/data" "$NEW_TAG" >/dev/null
HEALTHY=0
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 3 "http://127.0.0.1:$PORT/api/cloud/health" -o "$WORK/health.json" && python3 -c 'import json,sys;sys.exit(0 if json.load(open(sys.argv[1])).get("ok") is True else 1)' "$WORK/health.json"; then HEALTHY=1; break; fi
  sleep 1
done
[[ "$HEALTHY" = 1 ]] || { echo '新版健康检查失败。'; false; }
EXPECTED_JS="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["bundle"])' "$WORK/app/VERSION.json")"
curl -fsS --max-time 10 "http://127.0.0.1:$PORT/" -o "$WORK/index.html"
grep -F "$EXPECTED_JS" "$WORK/index.html" >/dev/null
COMMITTED=1
trap - ERR INT TERM
echo "更新成功：$RELEASE"
echo "存档备份：$WORK/backup/data.tar.gz"
echo "旧容器已保留：$OLD"
echo '账号、密钥、存档卷与 HTTPS 配置已保留。打开 https://englishblocks.cn/?v=bb5072f 并刷新。'
