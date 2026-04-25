/**
 * 共享数据类型定义（JSDoc）
 * 用于开发时的类型提示和文档
 */

/**
 * @typedef {Object} User
 * @property {string} id - 用户唯一 ID (UUID)
 * @property {string} name - 用户名
 * @property {string} email - 邮箱
 * @property {string} avatar - 头像路径
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 * @property {boolean} isActive - 是否活跃
 */

/**
 * @typedef {Object} Session
 * @property {string} userId - 关联用户 ID
 * @property {string} sessionId - Electron session partition
 * @property {number} createdAt - 创建时间戳
 * @property {number} lastActiveAt - 最后活跃时间戳
 */

/**
 * @typedef {Object} Bookmark
 * @property {string} id - 书签唯一 ID
 * @property {string} userId - 用户 ID
 * @property {string} title - 标题
 * @property {string} url - URL
 * @property {string} favicon - 图标 URL
 * @property {number} createdAt - 创建时间戳
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} id - 条目 ID
 * @property {string} userId - 用户 ID
 * @property {string} title - 页面标题
 * @property {string} url - URL
 * @property {number} visitedAt - 访问时间戳
 */

/**
 * @typedef {Object} DownloadTask
 * @property {string} id - 任务 ID
 * @property {string} url - 下载 URL
 * @property {string} savePath - 保存路径
 * @property {string} fileName - 文件名
 * @property {number} fileSize - 文件总大小
 * @property {number} downloadedSize - 已下载大小
 * @property {'pending'|'downloading'|'paused'|'completed'|'failed'} status - 任务状态
 * @property {number} createdAt - 创建时间戳
 * @property {number|null} completedAt - 完成时间戳
 */

/**
 * @typedef {Object} Script
 * @property {string} id - 脚本 ID
 * @property {string} userId - 用户 ID
 * @property {string} name - 脚本名称
 * @property {string} url - 脚本 URL
 * @property {string} code - 脚本代码
 * @property {boolean} enabled - 是否启用
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 */

/**
 * @typedef {Object} FileItem
 * @property {string} name - 文件名
 * @property {string} path - 完整路径
 * @property {number} size - 文件大小 (bytes)
 * @property {boolean} isDirectory - 是否为目录
 * @property {string} extension - 扩展名
 * @property {number} modifiedAt - 修改时间戳
 */

/**
 * @typedef {Object} Notification
 * @property {string} userId - 用户 ID
 * @property {string} message - 通知内容
 * @property {'info'|'warning'|'error'} type - 通知类型
 * @property {number} timestamp - 时间戳
 */

/**
 * @typedef {Object} AppConfig
 * @property {string} defaultDownloadPath - 默认下载目录
 * @property {number} maxHistoryItems - 历史记录最大条数
 * @property {boolean} autoStart - 开机自启动
 * @property {boolean} closeToTray - 关闭时最小化到托盘
 * @property {boolean} enableNotification - 启用通知
 */

module.exports = {};
