# GitHub 手机测试版

源代码位于 resources/new。Windows 安装包、API 密钥、账号数据库不上传。

GitHub Pages 发布 gh-pages 分支根目录。仓库 Settings → Pages → Deploy from a branch → gh-pages → / (root)。私有仓库需要 GitHub 账户套餐支持 Pages，不自动改变仓库可见性。

Pages 只提供静态网页：学习、衣柜、音乐和本机存档可用。AI、好友、云存档需要 HTTPS 后端，不能在 Pages 存储 DeepSeek 密钥。当前服务器仅监听环回地址，不能直接用其 HTTP IP 作为 HTTPS 页面的后端。

未来接入已配置 HTTPS 的后端：构建时设置 VITE_CLOUD_URL=https://你的后端域名，同时服务器 CLOUD_ALLOWED_ORIGINS 添加 https://aero-fuge.github.io，重新创建服务器容器。

手动构建：在 resources/new 运行 npm install 与 npm run build，将 dist 内容发布到 gh-pages。使用相对资源路径，支持 /englishblocks/ 项目子目录。网站地址变化时浏览器本机存档不会自动迁移，请先导出备份；云端账号仍由同一个后端管理。

图标已复制为 electron/icon.ico 与 public/favicon.ico，并从 ICO 内置 PNG 提取 public/apple-touch-icon.png。Windows exe 需重新打包才更新图标，已有 exe 不会自动改变。
