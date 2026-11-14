# 音乐史题库

音乐史与英语 `allLevels.json` 完全独立，分类为 `genres`（音乐体裁）、`composers`（作曲家）、`works`（音乐作品）。当前 `genres.json` 从用户提供的「音乐体裁_得分点标注版.docx」导入。图标为用户提供的「音乐史.png」，未经重新绘制。

## 后续导入

在项目 `resources/new` 目录执行：

```bash
npm run import:music -- --input '../source/UI/音乐体裁_得分点标注版.docx' --category genres
npm run import:music -- --input /absolute/path/composers.json --category composers
npm run import:music -- --input /absolute/path/works.json --category works
```

`.docx` 通过 Python 标准库读取，无需安装 Office；标题采用「01  题目名称」格式，其后各段落作为答案，直到下一标题。JSON 支持题目数组或 `{ "questions": [...] }`，例如：

```json
[
  {
    "id": "music-composers-ligeti",
    "title": "利盖蒂的音色探索",
    "annotatedAnswer": "利盖蒂的《大气》运用【微复调技法】，形成【连续变化的音响织体】。"
  }
]
```

已有拆分数据也可使用 `paragraphs: [{segments: [{kind: "language", text: "原文"}, {kind: "score", text: "得分点"}]}]`；此时保留已有词块边界。`answer` 也是 `annotatedAnswer` 的兼容字段。原始完整答案、得分点、语言骨架、正确顺序、唯一词块 ID 与内容版本由导入工具生成；`npm run build` 会校验，不能手工改动正确顺序冒充答案。各分类 JSON 自动发现，不需要修改关卡数量或导航代码。

已发布题目必须保持 ID 稳定，不要重新编号。修改文字后重新导入：内容版本改变会废弃旧的拼块草稿，但按题目 ID 保留一刷、二刷完成记录及历史答题记录。

## 学习与存档

一刷固定得分点、拼语言骨架（含标点）；二刷固定骨架、拼得分点。固定和可动词块始终按原文位置交错，每段独立使用原有 `railState` 引擎；同文词块有不同 ID，判题按对应位置的文本比较。

进度保存在 `collection.musicHistory`，与英语 `profile.completedLevelIds` 分离。每题保存两刷完成标志、最近学习时间、最近 20 次核对记录（含模式、原文版本、答案）、两种模式的草稿及当前段落。完整备份及账号同步包含这些记录；设置分享不导出、也不覆盖接收者的音乐史学习记录。旧存档没有该字段时视为尚未学习，无需迁移数据库表。

## 验证

```bash
npm run test:music
npm run test:cloud
npm run lint
npm run build
# 先运行 npm run preview -- --host 127.0.0.1 --port 4173
PLAYWRIGHT_MODULE=/path/to/playwright npm run test:music:ui
```

浏览器测试使用独立测试账号/本机存储，不操作线上存档。手机触摸与桌面窗口覆盖两刷完整通关、半途恢复、重复练习、英语现场保留、导入导出及页面横向溢出。
