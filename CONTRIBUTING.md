# 贡献指南

感谢你对本项目的关注！以下是参与贡献的指南。

---

## 开发流程

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/multi-user-browser.git
cd multi-user-browser
npm install
```

### 2. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/*` — 新功能
- `bugfix/*` — Bug 修复
- `docs/*` — 文档更新
- `refactor/*` — 代码重构

### 3. 开发

```bash
npm run dev    # 启动开发模式
npm run lint   # 代码检查
npm run test   # 运行测试
```

### 4. 提交

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git commit -m "feat: 添加用户管理功能"
git commit -m "fix: 修复下载暂停后无法恢复的问题"
git commit -m "docs: 更新 API 文档"
git commit -m "test: 添加会话管理单元测试"
git commit -m "refactor: 重构文件管理模块"
git commit -m "chore: 更新依赖版本"
```

提交类型：
| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

### 5. 推送 & PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

---

## 代码规范

### JavaScript

- 使用 ES6+ 语法
- 使用 `const` / `let`，禁止 `var`
- 函数使用箭头函数或声明式函数
- 异步操作使用 `async/await`
- 字符串使用单引号 `'`

### React

- 函数组件 + Hooks
- 组件文件名 PascalCase（如 `UserManager.jsx`）
- 工具函数文件名 camelCase（如 `pathValidator.js`）

### 样式

- 使用 CSS Modules + Less
- 类名使用 camelCase

---

## 测试要求

- 新功能必须附带单元测试
- Bug 修复必须附带回归测试
- 测试覆盖率不低于 80%
- 运行所有测试确保无回归：

```bash
npm run test
```

---

## 代码评审

- 所有 PR 必须至少 1 人 Review
- 评审关注点：
  - 安全性（路径验证、会话隔离）
  - 性能（内存泄漏、异步处理）
  - 可维护性（代码清晰、注释完整）
  - Electron 最佳实践（主进程/渲染进程分离）

---

## 问题反馈

- 使用 GitHub Issues 提交问题
- 提供复现步骤、期望行为、实际行为
- 包含环境信息（OS、Node.js 版本、Electron 版本）

---

## 开发环境

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| npm | 9+ | 包管理器 |
| VS Code | Latest | 推荐编辑器 |
| Git | Latest | 版本控制 |

### 推荐 VS Code 插件

- ESLint
- Prettier
- JavaScript (ES6) code snippets
- React snippets

---

## 文档

- 修改代码时同步更新相关文档
- API 变更需更新 `docs/API.md`
- 架构变更需更新 `docs/02-技术路线规划.md`
- 所有变更记录到 `docs/CHANGELOG.md`
