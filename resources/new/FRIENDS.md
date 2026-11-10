# 好友小窝：实现、规则与部署

## 复用与最小补充

继续使用 `server/cloud.cjs` 的独立账号、Bearer 会话、来源检查、SQLite 数据库与持久卷。好友逻辑放在 `server/social.cjs`，无需新的数据库或第三方服务。现有猫咪、服装 PNG 图层、衣柜预览组件、关卡词库、奶油白/鼠尾草绿的 UI 均复用。

原项目没有独立经验等级，只有当前关卡编号；通关历史由客户端存档提交，因此不能直接用来兑换恶作剧机会。本版新增独立的服务器有效学习记录：Lv.1 起，每10道有效完成提升1级，旧学习档案、关卡、小鱼干完全保留。好友名片明确显示“学习等级”和“当前第几关”，两者不混淆。

## 有效完成与奖励

- 登录云账号后，进入一关会向服务器取得归属于该账号的随机学习凭证（有效1小时）。
- 提交的是实际词块 ID，不是“我完成了几题”。服务端从固定题库取出文本，验证词块存在、没有重复、数量和顺序正确；分阶段关卡必须顺序完成全部阶段。
- 凭证签发后至少3秒才能提交第一阶段，后续阶段至少1秒。凭证不可用于其他账号。
- 每账号每关首次服务器核验只计一次；重新提交、重复复习、跨设备同时完成不能重复计数或领奖。旧题可通过重新拼句完成首次核验，旧 JSON/云存档导入本身不算完成。
- 每个北京时间自然日，完成10/20/30道有效题目时各自动发放1次恶作剧机会；每天最多3次。库存可累积、保存在服务器，不写进客户端存档。
- 本周对决从北京时间周一00:00计算。只比较服务器有效完成，避免通过修改本地存档刷分。
- 普通离线学习继续保留本地成绩；服务器未确认时显示“重试确认”。未完成核验的离线旧存档不会直接补发道具。页面内待确认提交可重试，刷新/关闭前应确认完成；云账号切换会停止上一账号的待确认任务。
- 这是服务端答案核验、唯一性及频率约束，不声称能够证明真人作答或阻止所有自动答题脚本。没有充值购买入口。

全题库1190题与39件衣柜物品通过 `tools/build-social-catalog.mjs` 生成服务端目录；`npm run build` 会自动运行该步骤。同步修正了旧题库第69号句子的句末所有格弯引号规范化问题，避免正确词序无法通过原判题。

## 好友与权限

每账号首次访问自动生成12位随机好友码（数据库唯一约束）。只能申请，不能直接成为好友；对方明确接受后创建规范化的一对好友关系。最多100位好友、每人最多50个待收申请。拒绝后可再次申请，重复待确认请求不会刷出多条。

好友空间只返回白名单字段：昵称、猫咪、允许的服装/姿态、当前关卡/阶段、有效学习统计与最近20条学习事件。服装 ID 必须在真实衣柜目录里并为该存档已拥有物品或免费物品。不返回完整存档、错题、私人AI聊天、音量设置、小鱼干余额或会话。当前角色和所选关卡来自对方最近云存档，是已有客户端存档的展示信息；学习等级/比赛/道具的统计完全独立由服务端记录。

在线状态按最近3分钟的已认证活动判断，是“最近在线”的近似值。学习页通常每60秒拉取通知，小窝页面每30秒刷新，切回窗口/恢复网络可立即刷新。不依赖 WebSocket。

## 恶作剧

只有当前好友可以发送；每人每天向同一好友最多3次，每次消耗1个服务器库存。库存扣减、日次数判断和投掷写入在同一 `BEGIN IMMEDIATE` 事务中。

每次投掷有请求唯一键，超时重试复用该键不会重复扣减。接收者离线也会持久保存。通知支持未查看/已查看/已处理；只有接收者能处理。反击的发送和原通知处理在一个事务中，失败时不误处理、不扣库存；重复处理不会再次反击。删除好友后旧通知仍能“知道啦”，不能反击。

动画为本地CSS，约1.5秒、不可拦截鼠标点击，不改经验、学习进度或小鱼干；支持减少动态效果系统设置。

## 数据库变更

启动时幂等 `CREATE TABLE IF NOT EXISTS`，不删除或重建原有 `users/sessions/saves/history`。

| 新表 | 用途与唯一性 |
| --- | --- |
| social_profiles | user_id 主键、唯一 friend_code、last_active |
| friend_requests | 申请双方/状态/时间，发送方+接收方唯一 |
| friendships | 规范化双方账号联合主键 |
| learning_attempts | 凭证、归属账号、关卡、当前阶段、准备/过期时间 |
| learning_completions | user_id+level_id 联合主键、完成时间与日期 |
| prank_wallet | 服务器库存，非负约束 |
| prank_grants | user_id+day+threshold 唯一，防重复领奖 |
| pranks | 发送/接收/类型/日期/查看与处理时间；sender+request_key 唯一 |
| learning_events | 服务器生成的通关/等级/成就动态 |

为收件箱、申请、每日完成、学习活动、凭证和投掷日限额建立索引。所有表按账号关联。迁移可重复启动，已有数据不丢失。

## 接口

所有接口均在 `/api/cloud` 下，沿用原云账号鉴权；GET 不接受指定其他用户的存档写入。

| 接口 | 用途 |
| --- | --- |
| GET /social | 我的好友码、库存、好友、申请、通知、比赛统计 |
| GET /social/notifications | 轻量收件箱与库存 |
| POST /social/request | 按好友码申请 |
| POST /social/requests/:id | 接受/拒绝，仅接收者 |
| GET /social/friends/:id | 只读好友空间及动态 |
| POST /social/friends/:id | 解除好友 |
| POST /social/throw | 发送道具，必须含幂等 key |
| POST /social/pranks/:id | seen/handle/counter，仅接收者 |
| POST /learning/start | 获取本人指定关卡的凭证 |
| POST /learning/complete | 校验阶段答案并在整关完成后计奖 |

## 部署到现有服务器

1. 下载 `englishblocks-friends-update.tar.gz`，上传到 `/home/ubuntu`。这是累积更新包，也包含之前的咪咪AI与气泡改动；旧服务器尚未更新AI时同样可用。音乐和原始词库无需重传。
2. 先备份服务器数据库。保持原容器 `englishblocks` 正常运行，执行：

```bash
sudo docker exec englishblocks node -e "const {DatabaseSync,backup}=require('node:sqlite'); const db=new DatabaseSync('/data/accounts.sqlite'); backup(db,'/data/accounts-before-friends.sqlite').then(()=>{db.close();console.log('数据库备份完成')}).catch(e=>{console.error(e.message);process.exitCode=1})"
```

该备份保存在原数据卷内，包含个人数据，请勿公开上传。

3. 备份源码并解压构建（旧容器仍可继续玩）：

```bash
cd /home/ubuntu
tar -czf englishblocks-code-before-friends.tar.gz -C englishblocks src server package.json Dockerfile
```

然后：

```bash
cd /home/ubuntu
tar -xzf englishblocks-friends-update.tar.gz
cd englishblocks
sudo docker build -t englishblocks:friends .
```

4. 构建成功后才切换容器。切换时暂停游玩，选择一个尚未占用的备份容器名，以下使用 `englishblocks-before-friends`：

```bash
sudo docker stop englishblocks
sudo docker rename englishblocks englishblocks-before-friends
sudo docker run -d --name englishblocks --restart unless-stopped \
  -p 127.0.0.1:3000:3000 -v englishblocks-data:/data \
  -e CLOUD_DATA_DIR=/data -e PORT=3000 -e HOST=0.0.0.0 \
  englishblocks:friends
```

如果已配置服务端环境文件（如DeepSeek密钥、允许来源），必须在 `docker run` 中保留原 `--env-file /home/ubuntu/englishblocks/.env` 参数，放在 `-e CLOUD_DATA_DIR=/data` 前。不要把密钥写到前端或发到聊天。好友功能本身无需新密钥。

**必须沿用 `englishblocks-data:/data`**；不要执行 `docker volume rm` 或 `compose down -v`。如果服务器原来使用 Compose，继续沿用原 Compose 项目名和卷，按其原部署方式重新构建，不能换到全新数据卷。

5. 检查：

```bash
sudo docker logs --tail 40 englishblocks
curl --max-time 10 http://127.0.0.1:3000/api/cloud/health
```

刷新当前SSH预览/正式网址，分别登录你和妹妹的账号，交换好友码并接受申请。每账号学习/复习10个不同关卡，服务器确认后即可投掷。之前做的旧备份和本地记录继续保留。

如果新容器异常，可停止并将新容器改名后，恢复旧容器名并启动。新增表对旧版代码无影响，回退不需要删除表，不要覆盖正在运行中的SQLite文件。

## 验证

- `npm run lint` / `npm run build`
- `npm run test:cloud` / `npm run test:mimi`
- `npm run test:social`：申请双方确认、拒绝/再申请/删除、越权访问、公开数据白名单、凭证归属/过早提交/错误词块/重复提交/分阶段/过期、每日奖励/同好友投掷上限、断线收件/反击/去重、北京时间日周边界、迁移重启、1190题目录一致性。
- `npm run test:rail` / `npm run test:timing` / `npm run test:bgm`；短语、答案、进度迁移回归也已检查。
- `previews/check-social.cjs`：独立临时数据库中的两个真实账号，通过真实HTTP接口和浏览器操作完成申请、接受、实际拼句入账、学习得库存、离线投掷、重新连接通知与反击、页面进出保留词块。浏览器测试仅将最短作答等待缩短到40毫秒以节约测试时间；正式服务器固定3秒，页面和生产接口没有修改该限制的入口。
- 浏览器截图使用桌面Chromium及iPhone尺寸触控上下文；本地WebKit的空白页面正常，但新旧游戏版本加载时均出现渲染进程崩溃，因此不能将Safari兼容性标为通过；需真实iPhone Safari验收，此问题也存在于新增好友前的对照版本。不等同于已测试真实Windows EXE或iPhone设备。

Windows EXE 需要重新构建，并在构建时设置 `VITE_CLOUD_URL` 为正式HTTPS网址，服务端设置 `CLOUD_ALLOWED_ORIGINS=englishblocks://app`。本次更新包是网页/服务端源码更新，不包含重新打包的EXE。

## 修改文件索引

- `server/social.cjs` / `server/social-catalog.json`：好友、学习凭证、库存、通知、活动及数据库表。
- `server/cloud.cjs`：沿用账号鉴权并挂载新接口、更新最近活动。
- `src/utils/social.ts` / `src/utils/useSocialActivity.ts`：客户端接口、幂等投掷键、后台核验和通知。
- `src/components/FriendsPage.tsx` / `src/components/PrankToast.tsx`：独立小窝页面、只读空间、通知与轻量动画。
- `src/App.tsx` / `src/components/LeftSidebar.tsx` / `src/index.css`：入口、返回状态保留、暂停计时、响应式布局。
- `src/utils/cloudSync.ts`：复用现有账号的请求方法。
- `src/utils/translationEvaluator.ts`：句末所有格符号的判题兼容修正。
- `tools/build-social-catalog.mjs` / `package.json` / `Dockerfile`：生成服务器词库及打包。
- `tests/social.test.cjs` / `tests/social-learning-regression.mjs` / `tests/cloud-server.test.cjs` / `tests/bgm-regression.cjs`：业务、安全、数据一致性与鉴权回归。
- `previews/check-social.cjs` / `previews/check-social-webkit.cjs`：浏览器验收脚本，使用隔离测试账号和数据库。
