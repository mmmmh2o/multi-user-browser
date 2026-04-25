# 多用户并发管理浏览器 (Multi-User Browser)

> 基于 Electron 的多用户并发管理桌面浏览器应用

## 📖 项目简介

多用户并发管理浏览器是一款桌面应用，解决浏览器脚本（Tampermonkey 等）只能在浏览器内操作、多脚本切换繁琐的痛点。通过 Electron 实现独立桌面窗口，支持多用户会话隔离、内置文件管理、下载管理、脚本管理等功能。

## ✨ 核心功能

| 模块 | 功能 | 状态 |
|------|------|------|
| 用户管理 | 多用户 CRUD、会话隔离 | 📋 规划中 |
| 浏览器核心 | 网页浏览、多标签页、地址栏 | 📋 规划中 |
| 书签管理 | 书签增删查、持久化 | 📋 规划中 |
| 历史记录 | 浏览历史（≤100条）、可清空 | 📋 规划中 |
| 文件管理器 | 文件浏览、CRUD、预览、路径安全验证 | 📋 规划中 |
| 下载管理器 | 下载任务、断点续传、自动分类 | 📋 规划中 |
| 脚本管理 | 脚本增删改查、启用/禁用 | 📋 规划中 |
| 活动监控 | 用户活跃状态、通知系统 | 📋 规划中 |

## 🛠 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^28.0.0 |
| 前端框架 | React | ^18.0.0 |
| UI 组件库 | Ant Design | ^5.0.0 |
| 状态管理 | Redux Toolkit | ^2.0.0 |
| 构建工具 | Vite | ^5.0.0 |
| 打包工具 | electron-builder | ^24.0.0 |
| 本地存储 | electron-store | ^8.0.0 |
| 测试框架 | Jest | ^29.0.0 |
| E2E 测试 | Playwright | ^1.40.0 |

## 📁 项目结构

```
multi-user-browser/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.js             # 应用入口
│   │   ├── ipc/                 # IPC Handler
│   │   ├── modules/             # 业务模块
│   │   └── utils/               # 工具函数
│   ├── preload/
│   │   └── index.js             # contextBridge 安全暴露
│   ├── renderer/                # React 渲染进程
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # 通用组件
│   │   ├── store/               # Redux store
│   │   └── styles/              # 样式文件
│   └── shared/                  # 共享常量/类型
├── tests/
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                     # E2E 测试
├── docs/                        # 项目文档
├── scripts/                     # 构建脚本
├── electron-builder.yml         # 打包配置
├── vite.config.js               # Vite 配置
├── jest.config.js               # Jest 配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Windows 10/11 (主要目标平台)

### 安装

```bash
git clone https://github.com/mmmmh2o/multi-user-browser.git
cd multi-user-browser
npm install
```

### 开发

```bash
npm run dev        # 启动开发模式（Vite + Electron）
npm run lint       # 代码检查
npm run test       # 运行单元测试
npm run test:e2e   # 运行 E2E 测试
```

### 构建

```bash
npm run build      # 构生产安装包
```

构建产物位于 `dist/` 目录。

## 📐 架构设计

```
┌─────────────────────────────────────────────┐
│           渲染进程 (Renderer)                │
│     React 18 + Ant Design + Redux Toolkit   │
├─────────────────────────────────────────────┤
│        contextBridge (Preload)              │
├─────────────────────────────────────────────┤
│            主进程 (Main)                     │
│   Node.js + electron-store + electron-log   │
│   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│   │ User  │ │Session│ │ File  │ │Download│  │
│   │Manager│ │Manager│ │Manager│ │Manager │  │
│   └───────┘ └───────┘ └───────┘ └───────┘  │
│   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│   │Bookmark│ │History│ │Script │ │Activity│  │
│   │Manager │ │Manager│ │Manager│ │Monitor │  │
│   └───────┘ └───────┘ └───────┘ └───────┘  │
├─────────────────────────────────────────────┤
│          electron-store (持久化)              │
└─────────────────────────────────────────────┘
```

### IPC 通信

渲染进程通过 `contextBridge` 安全暴露的 `window.electronAPI` 与主进程通信：

```javascript
// 渲染进程调用
const users = await window.electronAPI.getUsers();
await window.electronAPI.saveUser({ name: 'Alice', email: 'alice@example.com' });

// 监听主进程推送
window.electronAPI.onDownloadProgress((event, data) => {
  console.log(`下载进度: ${data.progress}%`);
});
```

### 安全设计

- **会话隔离**: 每个用户独立 `session.fromPartition`，数据互不可见
- **路径验证**: 文件操作前验证路径合法性，防止路径遍历攻击
- **CSP 配置**: 限制资源加载来源
- **contextIsolation**: 默认启用，防止渲染进程访问主进程 API

## 📊 性能指标

| 指标 | 目标值 |
|------|--------|
| 应用启动时间 | ≤ 5s |
| 页面响应时间 | ≤ 2s |
| 内存占用（空闲） | ≤ 200MB |
| 内存占用（正常使用） | ≤ 500MB |
| 文件列表加载（1000文件） | ≤ 1s |
| 并发用户会话 | ≥ 10 |

## 📅 开发计划

| 阶段 | 时间 | 内容 |
|------|------|------|
| Phase 1 | 第 1-4 周 | 需求分析与设计 |
| Phase 2 | 第 5-6 周 | 环境搭建 |
| Phase 3 | 第 7-12 周 | 核心功能开发 |
| Phase 4 | 第 13-15 周 | 集成与优化 |
| Phase 5 | 第 16-19 周 | 测试验证 |
| Phase 6 | 第 20-24 周 | 部署上线 |

## 📚 文档

- [软件开发流程](./docs/01-软件开发流程.md)
- [技术路线规划](./docs/02-技术路线规划.md)
- [详细开发方案](./docs/03-详细开发方案.md)
- [API 文档](./docs/API.md)
- [变更日志](./docs/CHANGELOG.md)

## 📄 License

MIT

## 作者

[mmmmh2o](https://github.com/mmmmh2o)
