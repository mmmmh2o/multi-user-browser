# 变更日志

本项目遵循 [语义化版本](https://semver.org/) 规范。

---

## [Unreleased]

### Planned
- 生产构建 + 打包测试
- E2E 测试

---

## [0.2.1] - 2026-04-26

### Fixed
- **safeCall 传参错误** — Bookmarks/History/DownloadManager/ScriptManager/Settings 五个页面 `safeCall` 传函数引用改为箭头函数，修复 IPC 调用静默失败
- **删除用户不清理会话** — `delete-user` 现在调用 `destroyUserSession()`，防止内存泄漏
- **主页按钮硬编码** — 从 Settings 读取 `homepage` 配置，不再固定 `about:blank`
- **书签/历史链接不切路由** — MainLayout 监听 `mub-navigate` 事件，自动导航到浏览器页
- **通知未读数永远为 0** — 新通知标记 `read: false`，打开下拉后自动标记已读
- **下载轮询器永不停止** — 新增 `checkAndStopPoller()`，所有任务终态后自动停止
- **webview 事件闭包旧值** — 用 `useRef` 替代闭包捕获 `activeTabKey`，地址栏正确更新
- **mub-navigate 双重 setTabs** — 事件处理不再在 `setTabs` 回调内调用 `addNewTab`
- **历史记录无 userId** — `addHistory` 携带 `userId`，多用户历史互不可见
- **new-window 事件废弃** — 新增 `setWindowOpenHandler`（Electron 28+），保留旧版兼容
- **get-files 返回类型不一致** — 失败时返回空数组而非 `{ error }`，前端不再崩溃
- **webview preload 路径竞态** — 新增 `preloadReady` 状态守卫，路径就绪后才渲染 webview
- **GM_xmlhttpRequest 只支持 GET** — 支持 POST body，返回 Tampermonkey 兼容响应格式
- **下载分类与 fileClassifier 不同步** — downloadHandlers 改用共享 fileClassifier 模块
- **URL 通配符正则不转义** — `matchesPage` 先转义 `.` 等特殊字符再替换通配符
- **store slices 缺 pending/rejected** — bookmark/history/settings slice 补齐 loading 状态
- **constants.js 缺 code 分类** — 与 fileClassifier.js 同步
- **测试复制源码逻辑** — pathValidator/fileClassifier/utils 测试改为 import 源模块

---

## [0.2.0] - 2026-04-25

### Added
- **浏览器核心** — 真实 webview 实现，支持多标签页浏览
- **用户会话隔离** — webview partition 绑定用户 ID，Cookie/存储完全隔离
- **导航控制** — 前进/后退/刷新/停止/主页
- **智能地址栏** — URL 直接访问，非 URL 转 Google 搜索
- **安全指示** — HTTPS 页面显示🔒锁图标
- **新标签页** — 快捷链接网格（Google/GitHub/YouTube/百度/B站/知乎）
- **标签页右键菜单** — 关闭其他/关闭右侧/复制标签
- **书签收藏** — 浏览器内点击⭐收藏，书签管理页面
- **浏览历史** — 自动记录访问历史，历史管理页面（≤100条）
- **脚本注入** — webview preload 机制，支持 Tampermonkey 风格 UserScript
  - `@match`/`@include` URL 匹配
  - GM_getValue/GM_setValue/GM_deleteValue 存储 API
  - GM_xmlhttpRequest 跨域请求
  - GM_addStyle 样式注入
- **设置持久化** — electron-store 持久化，支持重置默认值
- **通知铃铛** — 集成到顶栏，显示未读通知
- **文件管理器** — 目录浏览、文件 CRUD、路径安全验证
- **下载管理器** — HTTP 下载、进度推送、断点续传、自动分类
- **脚本管理** — 脚本 CRUD、启用/禁用切换
- **用户管理** — 用户 CRUD、激活/停用会话

### Changed
- 默认首页改为浏览器页面
- 侧边栏菜单重新组织（浏览器优先，书签/历史独立入口）
- Redux store 新增 bookmarkSlice + historySlice
- browserSlice 重构，支持更多标签页状态

### Fixed
- 补充缺失的 `@ant-design/icons` 依赖
- 修复 webview tag 未启用的问题

---

## [0.1.0] - 2026-04-25

### Added
- 项目创建
- 技术选型确定：Electron 28 + React 18 + Ant Design 5
- 架构设计：主进程/渲染进程分离 + IPC 通信
- 文档编写与上传

---

## 版本规划

### v0.3.0（Phase 4 - 集成优化）
- 全模块集成联调
- 界面优化（主题、动画）
- 性能优化（启动速度、内存）
- 单元测试补充

### v0.4.0（Phase 5 - 测试验证）
- 集成测试
- 系统测试
- 性能测试
- 安全测试

### v1.0.0（Phase 6 - 正式发布）
- 生产构建
- 代码签名
- 自动更新
- 用户手册
- GitHub Release
