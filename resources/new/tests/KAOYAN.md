# 考研长难句精练：第五学习阶段

入口为大厅「关卡选择」→「考研长难句精练」。取消独立首页入口和独立拼句页面。

原四阶段1190题保持原顺序、原ID、原题目不变。新增第五阶段30关，全局关卡号1191–1220，稳定ID100001–100030，使用题库原始chunks。源JSON未改写。六个专题、考点、解析和易错提示保留在关卡元数据与通关折叠解析里。

`shared/kaoyan-levels.mjs` 是唯一数据适配器，由前端题库与服务端目录生成工具共同调用。游戏直接沿用原 App、CandyWordBlock、railState、translationEvaluator、提示、计时、音效、鱼干/任务奖励和通关庆祝，不再维护独立操作引擎。服务端认识新增ID、词块与阶段，仍验证有效学习后才给予社交学习机会。

进度纳入现有profile及草稿，通过原账号同步/导入导出基础设施处理；不修改存档格式。先前独立测试页面的完成记录按账号合并到原profile（不重复发奖），其草稿作为首次进入时的兼容来源。原localStorage记录不删除；收藏、错题本等操作现在遵循原英语学习界面的功能。

验证：

```bash
npm run lint
npm run build
npm run test:kaoyan
npm run test:rail
npm run test:social
npm run preview -- --host 0.0.0.0 --port 4173
# 另一个终端，需要安装 Playwright/Chromium；也可用 PLAYWRIGHT_MODULE 指定已有模块
npm run test:kaoyan:ui
```

数据测试覆盖原1190题逐对象不变、题库SHA256不变、第五阶段30题与ID唯一、所有题目原轨道/真实校验/撤回/单词组提示可用。UI测试在390/1366宽度检查第五阶段及分页、原词块和原庆祝界面、折叠解析与profile进度。手工检查提示、拖动、长按信息卡、音乐、翻译官、返回大厅和继续学习，均走原界面。

更新正式服务前需运行完整build，确保同时更新前端和server/social-catalog.json；只替换网页文件会导致旧服务器无法识别新增30关。无需数据库迁移。
