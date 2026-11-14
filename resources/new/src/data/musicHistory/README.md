# 音乐史题库：语义挖空与反向挑战

音乐史题库独立于英语学习。音乐体裁现有 37 题；分类数量及关卡数量仍由分类 JSON 自动读取。

## 数据来源与生成

当前题库完全从无标记的完整原文重新划分，不读取、复用旧文档的【】得分点。

- [genres-source.json](../../../tools/music-history/genres-source.json)：完整原文、稳定题目 ID 和名称。
- [semantic-knowledge.json](../../../tools/music-history/semantic-knowledge.json)：人工审校的逐段知识词块，按原文出现次序排列；重复文字分别列出。
- [build-semantic-music.mjs](../../../tools/build-semantic-music.mjs)：定位知识词块、生成框架和知识语义片段，并逐字验证原文还原。

在项目 `resources/new` 目录执行：

```bash
node tools/build-semantic-music.mjs
npm run test:music
npm run lint
npm run build
```

历史时期、人名、地点、音乐体裁、创作特点及作品名称使用完整的语义词块，不经过词性分词。作品书名号、逗号等位于固定句子中；专名内部的间隔号（如“威廉·退尔”）随完整专名保留。知识词块按段落分仓，避免一次展示整道长答案。正常模式保留主体与“起源于、采用、代表作品有、形成”等表达线索，避免只剩虚词。

## 两种模式

- **正常**：框架固定，具体知识留空。
- **反向**：原知识内容固定，原框架变为待填写词块。框架按自然短语拆分，不拆专业术语；标点、独立的“的／与／和／及／或”连接成分在两种模式下均固定，不作为孤立词块。

正常完成后解锁反向。两个模式复用同一原文和语义划分，分别记录完成情况。仓库打乱顺序，答案依据数据中的原始位置检查。独立 ID 保证同文词块可互换、不能被重复使用。每次提示只补当前段落最前面的一个空位，复用词块音效与自动存档；正确词块立即变深，检查整题成功后播放庆祝音效及动画。

## 兼容与扩展

存档仍使用 `collection.musicHistory`，保留既有 `organize`（正常）和 `retrieve`（反向）内部键以及完成记录；界面不再使用“一刷／二刷”。内容版本包含新的语义规则，旧版不兼容草稿会重置，通关标记与历史记录保留。英语档案、等级及现场独立，不需要数据库迁移。

未来题库可通过分类 JSON 使用通用 `semanticParagraphs` 格式：

```json
{
  "id": "music-works-example",
  "title": "音响技法",
  "rawAnswer": "作品运用微复调技法。",
  "semanticParagraphs": [[
    {"role": "framework", "text": "作品运用"},
    {"role": "knowledge", "text": "微复调技法"},
    {"role": "framework", "text": "。"}
  ]]
}
```

通过 `npm run import:music -- --input /absolute/path/works.json --category works` 导入。导入器兼容旧版标记 JSON，但当前音乐体裁生成流程不使用旧得分点。构建会校验每段均有知识与框架、正确顺序、题目 ID 唯一及原文一致性。

## 验证

```bash
npm run test:music
npm run test:cloud
# 启动 npm run preview -- --host 127.0.0.1 --port 4173 后：
PLAYWRIGHT_MODULE=/path/to/playwright node tests/music-history-ui.cjs
PLAYWRIGHT_MODULE=/path/to/playwright node tests/music-feedback-ui.cjs
```

覆盖全部题目在两种模式下的原文恢复、语义互换、专业术语完整性、重复词块、提示、草稿恢复、备份及云端存档隔离，以及触摸／桌面操作、深色反馈、庆祝、音效和无横向溢出。

## 个人内容修改入口

题目顶部的「修改内容」可逐段编辑知识词块与固定文字，保持原有角色和结构。编辑器实时预览完整句子，支持取消与恢复原版；恢复操作点击保存后才生效。知识文字不能包含逗号、书名号等句子标点，固定文字仍可修改标点。

修改保存在个人 `collection.musicHistory.edits[questionId]`（语义段落与更新时间），自动包含在本地存档、完整备份及账号同步中。共享设置不导出此字段。静态题库保持原版。每次修改统一编译正常／反向两种模式并更换内容版本，清空本题两个模式的旧拼块草稿，保留通关标志、历史记录及其他题目记录。恢复原版后移除个人覆盖。

服务端沿用存档权限并校验编辑结构、文字长度及原文重建；没有新增公开修改题库的接口，也无需数据库迁移。编辑验证及浏览器检查：

```bash
PLAYWRIGHT_MODULE=/path/to/playwright node tests/music-content-editor-ui.cjs
```
