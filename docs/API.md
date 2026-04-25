# API 文档

> 主进程 IPC 接口参考

---

## 通用约定

### 请求模式

所有 IPC 通信使用 `ipcRenderer.invoke()` / `ipcMain.handle()` 模式（异步双向）。

### 错误处理

所有接口统一返回格式：

```javascript
// 成功
{ success: true, data: ... }

// 失败
{ success: false, error: "错误描述" }
```

### 命名规范

- 通道名: `kebab-case`（如 `get-users`）
- 参数: `camelCase`
- 返回值: `camelCase`

---

## 用户管理 (UserManager)

### `get-users`

获取所有用户列表。

| 参数 | 类型 | 说明 |
|------|------|------|
| 无 | — | — |

**返回**: `User[]`

```javascript
[
  {
    id: "uuid-xxxx",
    name: "Alice",
    email: "alice@example.com",
    avatar: "/path/to/avatar.png",
    createdAt: 1714012800000,
    updatedAt: 1714012800000,
    isActive: true
  }
]
```

---

### `save-user`

保存用户（新建或更新）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user | `object` | ✅ | 用户对象 |
| user.id | `string` | ❌ | 用户 ID（更新时必填） |
| user.name | `string` | ✅ | 用户名 |
| user.email | `string` | ❌ | 邮箱 |
| user.avatar | `string` | ❌ | 头像路径 |

**返回**: `User`（含生成的 ID 和时间戳）

---

### `delete-user`

删除指定用户。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | `string` | ✅ | 用户 ID |

**返回**: `User[]`（删除后的用户列表）

---

## 会话管理 (SessionManager)

### `create-user-session`

为用户创建独立会话。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | `string` | ✅ | 用户 ID |

**返回**: `{ success: boolean }`

**说明**: 使用 `session.fromPartition(`persist:user-${userId}`)` 创建隔离会话。重复创建会覆盖原有会话。

---

### `get-user-session`

获取用户会话信息。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | `string` | ✅ | 用户 ID |

**返回**: `{ success: boolean, sessionId?: string }`

---

### `activate-user`

激活用户（标记为活跃状态）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | `string` | ✅ | 用户 ID |

**返回**: `{ success: boolean }`

---

### `deactivate-user`

停用用户。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | `string` | ✅ | 用户 ID |

**返回**: `{ success: boolean }`

---

## 文件管理 (FileManager)

### `get-files`

获取目录下的文件列表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dirPath | `string` | ✅ | 目录路径 |

**返回**: `FileItem[]`

```javascript
[
  {
    name: "document.txt",
    path: "/home/user/document.txt",
    size: 1024,
    isDirectory: false,
    extension: ".txt",
    modifiedAt: 1714012800000
  }
]
```

**安全**: 会验证路径合法性，防止路径遍历。

---

### `create-file`

创建文件。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filePath | `string` | ✅ | 文件路径 |
| content | `string` | ❌ | 文件内容（默认空） |

**返回**: `{ success: boolean, error?: string }`

---

### `create-directory`

创建目录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dirPath | `string` | ✅ | 目录路径 |

**返回**: `{ success: boolean, error?: string }`

---

### `delete-file`

删除文件或目录（递归）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filePath | `string` | ✅ | 文件/目录路径 |

**返回**: `{ success: boolean, error?: string }`

**安全**: 删除前检查文件是否存在。

---

### `rename-file`

重命名文件或目录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPath | `string` | ✅ | 原路径 |
| newPath | `string` | ✅ | 新路径 |

**返回**: `{ success: boolean, error?: string }`

---

### `copy-file`

复制文件或目录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourcePath | `string` | ✅ | 源路径 |
| destPath | `string` | ✅ | 目标路径 |

**返回**: `{ success: boolean, error?: string }`

---

### `move-file`

移动文件或目录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourcePath | `string` | ✅ | 源路径 |
| destPath | `string` | ✅ | 目标路径 |

**返回**: `{ success: boolean, error?: string }`

---

### `read-file`

读取文件内容。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filePath | `string` | ✅ | 文件路径 |

**返回**: `{ success: boolean, content?: string, error?: string }`

---

### `write-file`

写入文件内容。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filePath | `string` | ✅ | 文件路径 |
| content | `string` | ✅ | 内容 |

**返回**: `{ success: boolean, error?: string }`

---

## 下载管理 (DownloadManager)

### `add-download`

添加下载任务。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | `string` | ✅ | 下载 URL |
| savePath | `string` | ✅ | 保存目录 |

**返回**: `DownloadTask`

```javascript
{
  id: "uuid-xxxx",
  url: "https://example.com/file.zip",
  savePath: "/downloads/file.zip",
  fileName: "file.zip",
  fileSize: 10485760,
  downloadedSize: 0,
  status: "pending",
  createdAt: 1714012800000,
  completedAt: null
}
```

---

### `pause-download`

暂停下载任务。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | `string` | ✅ | 任务 ID |

**返回**: `{ success: boolean, error?: string }`

---

### `resume-download`

恢复下载任务。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | `string` | ✅ | 任务 ID |

**返回**: `{ success: boolean, error?: string }`

---

### `cancel-download`

取消下载任务。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | `string` | ✅ | 任务 ID |

**返回**: `{ success: boolean, error?: string }`

---

### `get-downloads`

获取所有下载任务。

| 参数 | 类型 | 说明 |
|------|------|------|
| 无 | — | — |

**返回**: `DownloadTask[]`

---

### 事件推送（主进程 → 渲染进程）

#### `download-progress`

下载进度更新。

```javascript
{
  taskId: "uuid-xxxx",
  downloadedSize: 5242880,
  fileSize: 10485760,
  progress: 50,
  speed: 1048576  // bytes/s
}
```

#### `download-completed`

下载完成。

```javascript
{
  taskId: "uuid-xxxx",
  path: "/downloads/file.zip"
}
```

---

## 书签管理 (BookmarkManager)

### `get-bookmarks`

获取所有书签。

**返回**: `Bookmark[]`

```javascript
[
  {
    id: "uuid-xxxx",
    userId: "user-xxxx",
    title: "GitHub",
    url: "https://github.com",
    favicon: "https://github.com/favicon.ico",
    createdAt: 1714012800000
  }
]
```

---

### `save-bookmark`

保存书签。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bookmark | `object` | ✅ | 书签对象 |
| bookmark.userId | `string` | ✅ | 用户 ID |
| bookmark.title | `string` | ✅ | 标题 |
| bookmark.url | `string` | ✅ | URL |
| bookmark.favicon | `string` | ❌ | 图标 URL |

**返回**: `Bookmark`

---

### `delete-bookmark`

删除书签。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bookmarkId | `string` | ✅ | 书签 ID |

**返回**: `Bookmark[]`（删除后的列表）

---

## 历史记录 (HistoryManager)

### `get-history`

获取浏览历史。

**返回**: `HistoryEntry[]`

```javascript
[
  {
    id: "uuid-xxxx",
    userId: "user-xxxx",
    title: "Example Page",
    url: "https://example.com",
    visitedAt: 1714012800000
  }
]
```

---

### `add-history`

添加历史记录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| entry | `object` | ✅ | 历史条目 |
| entry.userId | `string` | ✅ | 用户 ID |
| entry.title | `string` | ✅ | 页面标题 |
| entry.url | `string` | ✅ | URL |

**返回**: `{ success: boolean }`

**说明**: 最多保留 100 条记录，超出自动删除最旧的。

---

### `clear-history`

清空历史记录。

| 参数 | 类型 | 说明 |
|------|------|------|
| 无 | — | — |

**返回**: `{ success: boolean }`

---

## 脚本管理 (ScriptManager)

### `get-scripts`

获取所有脚本。

**返回**: `Script[]`

```javascript
[
  {
    id: "uuid-xxxx",
    userId: "user-xxxx",
    name: "Auto Login",
    url: "https://greasyfork.org/scripts/xxx.user.js",
    code: "// ==UserScript==...",
    enabled: true,
    createdAt: 1714012800000,
    updatedAt: 1714012800000
  }
]
```

---

### `save-script`

保存脚本。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| script | `object` | ✅ | 脚本对象 |
| script.userId | `string` | ✅ | 用户 ID |
| script.name | `string` | ✅ | 脚本名称 |
| script.url | `string` | ❌ | 脚本 URL |
| script.code | `string` | ❌ | 脚本代码 |
| script.enabled | `boolean` | ❌ | 是否启用（默认 false） |

**返回**: `Script`

---

### `delete-script`

删除脚本。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scriptId | `string` | ✅ | 脚本 ID |

**返回**: `Script[]`（删除后的列表）

---

## 通知系统

### 事件推送（主进程 → 渲染进程）

#### `notification`

通知推送。

```javascript
{
  userId: "user-xxxx",
  message: "下载完成：file.zip",
  type: "info",       // info | warning | error
  timestamp: 1714012800000
}
```

---

## Preload API 汇总

```javascript
// preload.js 通过 contextBridge 暴露的完整 API
window.electronAPI = {
  // 用户管理
  getUsers: () => ipcRenderer.invoke('get-users'),
  saveUser: (user) => ipcRenderer.invoke('save-user', user),
  deleteUser: (id) => ipcRenderer.invoke('delete-user', id),

  // 会话管理
  createSession: (userId) => ipcRenderer.invoke('create-user-session', userId),
  getSession: (userId) => ipcRenderer.invoke('get-user-session', userId),
  activateUser: (userId) => ipcRenderer.invoke('activate-user', userId),
  deactivateUser: (userId) => ipcRenderer.invoke('deactivate-user', userId),

  // 文件管理
  getFiles: (dirPath) => ipcRenderer.invoke('get-files', dirPath),
  createFile: (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  copyFile: (src, dest) => ipcRenderer.invoke('copy-file', src, dest),
  moveFile: (src, dest) => ipcRenderer.invoke('move-file', src, dest),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // 下载管理
  addDownload: (url, savePath) => ipcRenderer.invoke('add-download', url, savePath),
  pauseDownload: (taskId) => ipcRenderer.invoke('pause-download', taskId),
  resumeDownload: (taskId) => ipcRenderer.invoke('resume-download', taskId),
  cancelDownload: (taskId) => ipcRenderer.invoke('cancel-download', taskId),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),

  // 书签管理
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmark: (bookmark) => ipcRenderer.invoke('save-bookmark', bookmark),
  deleteBookmark: (id) => ipcRenderer.invoke('delete-bookmark', id),

  // 历史记录
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // 脚本管理
  getScripts: () => ipcRenderer.invoke('get-scripts'),
  saveScript: (script) => ipcRenderer.invoke('save-script', script),
  deleteScript: (id) => ipcRenderer.invoke('delete-script', id),

  // 事件监听
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', callback),
  onNotification: (callback) => ipcRenderer.on('notification', callback),
};
```
