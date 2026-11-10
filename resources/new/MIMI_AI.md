# 咪咪 AI 翻译官

使用 DeepSeek 官方 Chat Completions API。密钥只通过服务器环境变量读取，不在前端构建、浏览器存储或同步备份中。需要登录现有云账号后才能调用。

## 功能

- 自动陪聊在可拖动悬浮猫咪旁显示短气泡，不再放在学习卡片下方。点击小猫（或键盘 Enter/空格）展开提问区，拖动不触发打开。气泡可单独收起。
- 宽屏提问时为右侧面板让出空间；手机/窄屏使用底部紧凑面板，最多占30%视口高度（上限220px），页面预留对应滚动空间，导航仍可用。收起后恢复小猫与气泡，输入内容保留。
- 手动翻译当前拼法（包含空位、错误词序）、一点点提示、鼓励和自由提问。
- 自动陪聊默认关闭，玩家可开启；操作暂停至少2.2秒且距上次请求12秒后再请求。连续3次改动没有新增正确位置时点拨。已拼对时庆祝。旧拼法的异步回复不会显示在新拼法上。
- 每次只发送本关题目、正确句子、当前轨道、连续无进展次数和最近几轮聊天。不发送完整学习数据、个人资料或音频。
- 只显示文本，不执行AI返回的代码或操作。AI不会代填、判分、增加奖励或改动存档。
- 最近10条聊天仅保留在当前关卡内存，切关或刷新清除。API失败保留游戏原有本地提示。

## 开发配置

在项目目录创建 `.env`（不要提交）：

```dotenv
DEEPSEEK_API_KEY=在这里填写你的真实密钥
DEEPSEEK_MODEL=deepseek-flash
MIMI_DAILY_LIMIT=150
```

然后重启开发服务器。不要使用 `VITE_DEEPSEEK_API_KEY`。默认模型按当前官方文档选择低延迟非思考模式；如账号模型权限不同，可修改服务端 `DEEPSEEK_MODEL`。

## 当前服务器更新（已有 Docker 容器）

把 `englishblocks-mimi-bubble-update.tar.gz` 上传到服务器用户主目录。先保存现有源码（此备份不含数据库，数据库仍在原数据卷）：

```bash
cd /home/ubuntu/englishblocks
cp -a server server.before-ai
cp -a src src.before-ai
cd /home/ubuntu
tar -xzf englishblocks-mimi-bubble-update.tar.gz
cd englishblocks
nano .env
```

在编辑器填写上述三个环境变量，Ctrl+O、回车保存，Ctrl+X退出，再执行：

```bash
chmod 600 .env
sudo docker build -t englishblocks:ai .
```

构建成功才切换。以下停止容器期间不要在其他设备继续玩：

```bash
sudo docker stop englishblocks
sudo docker rename englishblocks englishblocks-before-ai
sudo docker run -d --name englishblocks --restart unless-stopped \
  --env-file /home/ubuntu/englishblocks/.env \
  -p 127.0.0.1:3000:3000 \
  -v englishblocks-data:/data englishblocks:ai
curl --max-time 10 http://127.0.0.1:3000/api/cloud/health
```

必须沿用 `englishblocks-data:/data`，不要删除该数据卷。`.env` 只在运行时注入（Docker构建会排除该文件）。如果旧容器名已被占用，先检查已有容器，不要重复执行重命名步骤。

若新容器无法运行，可保留故障容器后回退：

```bash
sudo docker stop englishblocks
sudo docker rename englishblocks englishblocks-ai-failed
sudo docker rename englishblocks-before-ai englishblocks
sudo docker start englishblocks
```

继续沿用现有 SSH 预览网址。刷新游戏，登录云账号，点「问咪咪」提问。不要把密钥发到聊天、截图或 GitHub。

## 使用限制与验证

每账号同时最多1个请求，间隔至少5秒，默认UTC每天150次尝试。计数在服务内存中，重启会重置；适合当前家庭自用，不是账单硬上限。可在DeepSeek账户另设预算提醒。上游超时28秒，不自动重试扣费请求。聊天无联网搜索或工具执行。

运行 `npm run lint`、`npm run build`、`npm run test:cloud` 和 `npm run test:mimi`。接口测试使用模拟DeepSeek响应；真实调用需部署后填入密钥验证。

官方接口：https://api-docs.deepseek.com/api/create-chat-completion/
