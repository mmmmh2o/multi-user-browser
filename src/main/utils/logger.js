const log = require('electron-log');
const path = require('path');
const { app } = require('electron');

/**
 * 日志工具配置
 */

// 配置日志文件路径
function initLogger() {
  try {
    const logPath = path.join(app.getPath('userData'), 'logs');
    log.transports.file.resolvePath = () => path.join(logPath, 'main.log');
    log.transports.file.level = 'info';
    log.transports.console.level = 'debug';

    // 日志格式
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';
    log.transports.console.format = '[{level}] {text}';

    log.info('日志系统已初始化');
  } catch (error) {
    // app 可能未就绪
    // eslint-disable-next-line no-console
    console.log('日志初始化延迟:', error.message);
  }
}

module.exports = { initLogger, log };
