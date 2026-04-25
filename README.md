# 多用户并发管理浏览器 — 项目文档

> **项目周期**: 24 周 | **技术栈**: Electron 28 + React 18 + Ant Design 5 | **目标平台**: Windows 10/11

---

## 文档索引

| # | 文档 | 内容 | 路径 |
|---|------|------|------|
| 1 | **软件开发流程** | 6 阶段全流程、阶段门禁、质量指标 | [01-软件开发流程.md](./01-软件开发流程.md) |
| 2 | **技术路线规划** | 技术栈选型、Electron 架构、IPC 设计、安全架构 | [02-技术路线规划.md](./02-技术路线规划.md) |
| 3 | **详细开发方案** | 代码结构、WBS 任务分解、进度计划、风险管理 | [03-详细开发方案.md](./03-详细开发方案.md) |

---

## 相对于原版文档的改进

### ❌ 原版问题
- 《软件开发流程》与《项目开发指南》内容 90% 重复
- 《技术路线规划》在多处重复出现
- 选用了 React + Express + MongoDB + Redis（Web 全栈架构），与 Electron 桌面应用不匹配
- 缺少 Electron 特有的主进程/渲染进程架构、IPC 通信设计、session 隔离方案

### ✅ 改进后
- **消除重复**: 三份文档各司其职，无冗余
- **技术对齐**: 全面围绕 Electron 桌面应用设计
- **架构具体**: 包含 IPC 通道清单（30+）、Preload 安全暴露、数据模型 Schema
- **可执行**: 任务分解到代码文件级别，含具体开发日程
- **风险聚焦**: 针对 Electron 特有风险（会话隔离、webview 安全、打包签名）

---

## 快速开始

```bash
# 1. 创建 GitHub 仓库
gh repo create mmmmmh2o/multi-user-browser --private

# 2. 初始化项目
npm init -y
npm install electron electron-store electron-log
npm install react react-dom antd @reduxjs/toolkit react-redux
npm install -D vite @vitejs/plugin-react electron-builder jest

# 3. 启动开发
npm run dev
```
