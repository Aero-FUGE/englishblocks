# 全局四季主题

`src/themes.css` 是所有色彩的唯一配置入口，定义 spring / summer / autumn / winter 的背景、表面、文字、按钮、辅助色、边框、阴影、柔光及装饰变量。现有界面的固定 UI 色彩已迁移为语义变量；Tailwind 命名颜色与阴影通过 `@theme inline` 映射到相同变量，新增界面直接继承。猫咪与服装原图不重新着色；错误和答对使用独立语义状态色。

`src/utils/seasonTheme.ts` 负责初始化、校验、本机保存、跨标签页通知以及 React 订阅。没有保存值或值无效时使用春季，不读取现实月份。大厅和设置面板复用 `SeasonPicker`。根节点 data-season 使 body 内的所有 Portal 弹窗、气泡、音乐面板立即更新。

`SeasonAtmosphere` 仅渲染 8 个固定装饰元素，手机最多 4 个，使用 transform / opacity 动画，无定时循环、外部素材或画布。春季樱花瓣、夏季光斑、秋叶与暖阳木纹、冬季雪花及暖色窗景均不拦截输入。prefers-reduced-motion 下隐藏飘落元素，保留静态柔光。

初始化在应用挂载前执行，HTML 头部同步恢复 data-season，避免保存的冬季主题启动时先显示春季。颜色集中在 CSS，JS 只管理季节标识、标签和动画节点。

验证：类型检查、生产构建、Chromium 手机四季循环（设置弹窗内切换、关卡选择、衣柜、好友页、音乐 Portal、拼句界面）、刷新保存、跨标签页同步、无横向溢出、减少动态效果、装饰层 pointer-events:none；另跑原手机单击/1秒长按/大厅往返/草稿恢复检查及轨道、存档回归。未把桌面模拟视为物理 iPhone 测试。

新增 UI 优先使用 `var(--theme-surface)`、`var(--theme-text)`、`var(--theme-muted)`、`var(--theme-primary)`、`var(--theme-on-primary)`、`var(--theme-border)` 和 `var(--theme-shadow)`，避免写入季节色值。切换不写学习记录、不修改好友数据、不调用 AI，也不重新加载应用。

大厅布局现按用户提供的参考图调整为紧凑的角色名片、真实统计、场景、主按钮与功能网格。`src/lobby.css` 独立管理大厅布局；`public/assets/lobby/{spring,summer,autumn,winter}.png` 使用用户提供的四季背景，随主题切换。背景 URL 按 document.baseURI 生成，兼容 GitHub 项目子目录。主题面板收纳到四季入口，原有播放器保留在页脚。未创建参考图中缺乏数据基础的经验、日常任务或连续天数。

大厅的四季入口现使用居中 Portal 弹窗，选择后自动关闭，支持背景点击、关闭按钮和 Escape；打开期间锁定背景滚动并约束键盘焦点，关闭后恢复触发按钮焦点。弹窗不增加大厅文档高度。设置面板继续复用同一组精简图标选项。春季主色调整为樱花粉，夏季主色调整为绿荫绿，秋冬 palette 未改动。顶部遮罩在背景图片起始处保持不透明，再渐变为透明，消除图片起始边界。
