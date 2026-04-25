# 变更日志

本项目遵循 [语义化版本](https://semver.org/) 规范。

---

## [Unreleased]

### Planned
- 书签/历史 UI 页面（✅ 已完成，待打包验证）
- 脚本注入 preload 机制（✅ 已完成，待打包验证）
- 设置持久化（✅ 已完成，待打包验证）
- 生产构建 + 打包测试
- E2E 测试

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
