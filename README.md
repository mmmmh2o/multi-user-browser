# Multi-User Browser

> 基于 Electron 的多用户并发管理桌面浏览器 — 每个用户独立会话，内置脚本管理、下载管理、文件管理

## ✨ 功能一览

| 模块 | 功能 | 状态 |
|------|------|------|
| 🌐 浏览器核心 | 多标签页、地址栏、前进/后退/刷新、主页 | ✅ |
| 👤 用户管理 | CRUD、激活/停用、会话隔离（partition） | ✅ |
| 🔖 书签管理 | 增删查、按用户关联、搜索 | ✅ |
| 📜 历史记录 | 自动记录、≤100条、可清空、按用户隔离 | ✅ |
| 📁 文件管理器 | 目录浏览、新建/删除/重命名、路径安全验证 | ✅ |
| ⬇️ 下载管理器 | aria2 多线程下载、暂停/恢复/取消、自动分类 | ✅ |
| 📝 脚本管理 | UserScript 注入、GM_* API、启用/禁用、URL 匹配 | ✅ |
| ⚙️ 设置 | 主页、搜索引擎、深色模式、下载路径 | ✅ |
| 🔔 通知 | 实时通知铃铛、未读计数 | ✅ |

## 🛠 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^28.0.0 |
| 前端 | React 18 + Ant Design 5 + Redux Toolkit | ^18 / ^5 / ^2 |
| 构建 | Vite + electron-builder | ^5 / ^24 |
| 存储 | electron-store（JSON 持久化） | ^8.0.0 |
| 下载引擎 | aria2c（JSON-RPC） | - |
| 测试 | Jest + Playwright | ^29 / ^1.40 |

## 🚀 快速开始

```bash
# 环境要求：Node.js >= 18
git clone https://github.com/mmmmh2o/multi-user-browser.git
cd multi-user-browser
npm install

# 开发
npm run dev          # Vite + Electron 热重载
npm run lint         # ESLint 检查
npm run test         # 单元测试

# 构建
npm run build        # 当前平台安装包
npm run build:win    # Windows NSIS 安装包
npm run build:mac    # macOS DMG
npm run build:linux  # Linux AppImage + deb
```

## 📁 项目结构

```
multi-user-browser/
│
├── src/
│   ├── main/                          # ═══ Electron 主进程 ═══
│   │   ├── index.js                   # 应用入口：窗口创建、生命周期
│   │   │
│   │   ├── ipc/                       # IPC Handler（渲染进程 ↔ 主进程）
│   │   │   ├── index.js               #   统一注册入口，独立 try-catch
│   │   │   ├── userHandlers.js        #   用户 CRUD + electron-store
│   │   │   ├── sessionHandlers.js     #   会话隔离（session.fromPartition）
│   │   │   ├── bookmarkHandlers.js    #   书签 CRUD
│   │   │   ├── historyHandlers.js     #   历史记录（上限 100 条）
│   │   │   ├── fileHandlers.js        #   文件操作 + 路径遍历防护
│   │   │   ├── downloadHandlers.js    #   下载任务 + aria2 RPC + 进度轮询
│   │   │   ├── scriptHandlers.js      #   UserScript CRUD + 启用状态
│   │   │   └── settingsHandlers.js    #   设置读写 + 默认值合并
│   │   │
│   │   ├── preload/
│   │   │   └── webview-preload.js     # webview 注入：UserScript 执行 + GM_* API
│   │   │
│   │   └── utils/
│   │       ├── aria2Manager.js        # aria2c 进程管理 + JSON-RPC 客户端
│   │       ├── fileClassifier.js      # 文件类型分类（images/videos/code/...）
│   │       ├── pathValidator.js       # 路径遍历防护工具
│   │       └── logger.js              # electron-log 配置
│   │
│   ├── preload/
│   │   └── index.js                   # contextBridge 暴露 electronAPI
│   │
│   ├── renderer/                      # ═══ React 渲染进程 ═══
│   │   ├── main.jsx                   # React 入口（Provider + ConfigProvider）
│   │   ├── App.jsx                    # 路由定义（HashRouter）
│   │   ├── index.html                 # HTML 模板
│   │   │
│   │   ├── pages/                     # 页面组件
│   │   │   ├── Browser.jsx            #   浏览器（webview + 多标签 + 地址栏）
│   │   │   ├── UserManager.jsx        #   用户管理（表格 + 激活/停用）
│   │   │   ├── Bookmarks.jsx          #   书签列表（搜索 + 删除）
│   │   │   ├── History.jsx            #   历史记录（搜索 + 清空）
│   │   │   ├── FileManager.jsx        #   文件管理（目录树 + CRUD）
│   │   │   ├── DownloadManager.jsx    #   下载管理（进度条 + 暂停/恢复）
│   │   │   ├── ScriptManager.jsx      #   脚本管理（编辑器 + 启用开关）
│   │   │   └── Settings.jsx           #   设置页（表单 + 重置）
│   │   │
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx         # 主布局（侧边栏 + 顶栏 + Outlet）
│   │   │   └── BrowserLayout.jsx      # 浏览器全屏布局
│   │   │
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx   # 通知铃铛（下拉 + 未读计数）
│   │   │   └── FileExplorer.jsx       # 文件目录树组件
│   │   │
│   │   ├── store/                     # Redux 状态管理
│   │   │   ├── index.js               #   configureStore
│   │   │   └── slices/
│   │   │       ├── userSlice.js       #     用户状态 + fetchUsers thunk
│   │   │       ├── browserSlice.js    #     标签页状态（本地 state 为主）
│   │   │       ├── bookmarkSlice.js   #     书签状态
│   │   │       ├── historySlice.js    #     历史记录状态
│   │   │       ├── downloadSlice.js   #     下载任务状态 + 进度更新
│   │   │       └── settingsSlice.js   #     设置状态
│   │   │
│   │   ├── utils/
│   │   │   ├── ipcHelper.js           # safeCall：IPC 超时兜底（5s）
│   │   │   └── api.js                 # electronAPI 封装（类型安全调用）
│   │   │
│   │   └── styles/
│   │       └── global.less            # 全局样式
│   │
│   └── shared/                        # ═══ 主进程/渲染进程共享 ═══
│       ├── constants.js               # 文件分类映射、状态常量
│       └── types.js                   # JSDoc 类型定义
│
├── tests/
│   ├── unit/main/                     # 单元测试
│   │   ├── ipc.test.js                #   IPC Handler 注册验证
│   │   ├── pathValidator.test.js      #   路径安全测试
│   │   ├── fileClassifier.test.js     #   文件分类测试
│   │   ├── downloadHandlers.test.js   #   下载 Handler 测试
│   │   ├── scriptHandlers.test.js     #   脚本 Handler 测试
│   │   ├── settingsHandlers.test.js   #   设置 Handler 测试
│   │   ├── userScriptParser.test.js   #   UserScript 解析测试
│   │   └── utils.test.js             #   工具函数测试
│   └── integration/
│       └── ipc.test.js                # 数据模型集成测试
│
├── docs/                              # 项目文档
├── scripts/                           # 构建脚本
├── __mocks__/                         # Jest mock
├── .github/workflows/                 # CI/CD
│   ├── ci.yml                         #   lint + test + build
│   └── release.yml                    #   tag 触发发布
│
├── electron-builder.yml               # 打包配置
├── vite.config.js                     # Vite 配置
├── jest.config.js                     # Jest 配置
└── package.json
```

## 🏗 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│                     渲染进程 (Renderer)                       │
│           React 18 + Ant Design 5 + Redux Toolkit            │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Browser  │ │ UserManager│ │ Bookmarks│ │ History  │  ...  │
│  │ (webview)│ │  (Table) │ │  (Table) │ │  (Table) │        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
│       └─────────────┴────────────┴─────────────┘              │
│                         │ window.electronAPI.*                │
├─────────────────────────┼────────────────────────────────────┤
│              contextBridge (Preload)                          │
│              safeInvoke(channel, ...args)                     │
├─────────────────────────┼────────────────────────────────────┤
│                     主进程 (Main)                              │
│                         │ ipcMain.handle                      │
│  ┌──────────────────────┴───────────────────────────┐        │
│  │              IPC Handlers（独立 try-catch）        │        │
│  │  user │ session │ bookmark │ history │ file │ ... │        │
│  └──────┬──────────┬────────────────────────────────┘        │
│         │                                                      │
│  ┌──────┴──────┐  ┌──────────┐  ┌──────────────┐             │
│  │electron-store│  │ aria2c   │  │ fileClassifier│             │
│  │ (JSON 持久化)│  │(JSON-RPC)│  │ (路径安全)    │             │
│  └─────────────┘  └──────────┘  └──────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户操作 → React 组件 → window.electronAPI.xxx()
                              ↓
                    preload: safeInvoke(channel, args)
                              ↓
                    ipcMain.handle(channel, handler)
                              ↓
                    handler: electron-store 读写 / aria2 RPC
                              ↓
                    返回结果 → React 组件更新 UI
```

### 会话隔离机制

```
用户 A 激活 → session.fromPartition("persist:user-A")
用户 B 激活 → session.fromPartition("persist:user-B")
                    ↓
webview src={url} partition={getPartition()}
                    ↓
每个用户独立的 Cookie / LocalStorage / Cache
```

## 🔒 安全设计

| 机制 | 实现 |
|------|------|
| 上下文隔离 | `contextIsolation: true` + `contextBridge` |
| 路径遍历防护 | `pathValidator.js` — 所有文件操作校验路径在 `homedir` 内 |
| 会话隔离 | `session.fromPartition` — 用户数据互不可见 |
| 沙箱模式 | `sandbox: true` — preload 脚本限制 Node.js 访问 |
| IPC 超时 | `safeCall` — 5 秒超时兜底，防止 handler 未注册时挂起 |

## 📡 IPC 通道一览

| 通道 | 方向 | 说明 |
|------|------|------|
| `get-users` / `save-user` / `delete-user` | R→M | 用户 CRUD |
| `create-user-session` / `get-user-session` | R→M | 会话管理 |
| `activate-user` / `deactivate-user` | R→M | 用户激活/停用 |
| `get-bookmarks` / `save-bookmark` / `delete-bookmark` | R→M | 书签 |
| `get-history` / `add-history` / `clear-history` / `delete-history` | R→M | 历史记录 |
| `get-files` / `create-file` / `delete-file` / `rename-file` / ... | R→M | 文件操作 |
| `add-download` / `pause-download` / `resume-download` / `cancel-download` | R→M | 下载控制 |
| `get-scripts` / `save-script` / `delete-script` / `get-enabled-scripts` | R→M | 脚本管理 |
| `get-settings` / `save-settings` / `reset-settings` | R→M | 设置 |
| `download-progress` / `download-completed` / `notification` | M→R | 主进程推送 |

## 🧪 测试

```bash
npm run test              # 运行所有测试
npm run test:watch        # 监听模式
npm run test:coverage     # 覆盖率报告
```

测试覆盖：IPC 注册验证、路径安全、文件分类、UserScript 解析、数据模型验证。

## 📄 License

[MIT](./LICENSE) · [mmmmh2o](https://github.com/mmmmh2o)
