# 更新已经运行的腾讯云单容器部署

适用于现有 `englishblocks` 容器、Node 24、持久挂载 `/data`、主机回环端口 3000。已有 Caddy 域名入口保持不变。

```bash
curl -fL --retry 3 https://github.com/Aero-FUGE/englishblocks/releases/download/server-20261113-bb5072f/update-server.sh -o /home/ubuntu/update-englishblocks.sh
bash /home/ubuntu/update-englishblocks.sh
```

## 执行流程

1. 检查旧容器、Node/依赖、存档卷、端口与可用磁盘。
2. 从实际运行容器保留环境变量到服务器本机的私有文件，保留现有 API 密钥，不显示密钥内容。
3. 下载并校验预构建网页和服务端包。旧镜像里的音乐逐文件 SHA256 匹配时直接复用，否则下载完整音频包。
4. 基于旧镜像复用 Node、Express 与 dotenv，覆盖最新版 dist/server/shared，无需服务器重新编译前端或安装 npm 依赖。
5. 准备完成后才停止旧容器，备份整个 `/data`（包括 SQLite 及 WAL），重命名并保留旧容器。
6. 用同一存档卷和环境变量启动新版，验证健康接口和网页主脚本版本。新服务启动失败则自动重新启动旧容器。

脚本不会修改 Caddy、证书、域名解析、源代码目录里的 `.env`，不会删除存档卷。备份与运行环境副本保存在 `~/englishblocks-releases/`，目录权限 700，环境文件权限 600。备份包含私人存档，请勿公开上传。

成功后打开 https://englishblocks.cn/?v=bb5072f 并刷新。静态 GitHub Pages 的访客本机存档属于不同域名；需要在原页面导出后导入，或通过已有云账号同步。

## 下载失败

下载和镜像准备失败时旧服务保持运行。可以重新运行同一命令；已安装且健康的同版本不会重复切换。若服务器无法连接 GitHub，请在本机从 Release 页面下载文件，通过原终端文件管理器上传；先排查网络或改为本地包部署，不要删除旧容器或数据卷。

## 回退

自动回退不依赖网络。完成更新后如果希望人工回退，使用成功输出中保存的旧容器名：先停止并重命名新版，再将旧容器恢复为 `englishblocks` 并启动。回退容器不恢复数据库历史；历史数据备份保留供必要时人工恢复，避免覆盖更新后产生的新存档。

## 本地验证

先构建网页并准备 Release 包，再运行：

```sh
npm run build
node tools/build-server-release.cjs
node tests/server-update-smoke.cjs
```

测试使用独立 Docker 容器、卷、临时账号和假 API 密钥，覆盖更新、完整音频补齐、账号会话/存档/密钥保留、重复执行以及坏镜像回退。需要本机 Docker，不连接生产服务器。
