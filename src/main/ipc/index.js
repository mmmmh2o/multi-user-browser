/**
 * IPC Handler 统一注册
 * 集中管理所有 IPC 通道的注册
 */

const { registerUserHandlers } = require('./userHandlers');
const { registerSessionHandlers } = require('./sessionHandlers');
const { registerFileHandlers } = require('./fileHandlers');
const { registerDownloadHandlers } = require('./downloadHandlers');
const { registerBookmarkHandlers } = require('./bookmarkHandlers');
const { registerHistoryHandlers } = require('./historyHandlers');
const { registerScriptHandlers } = require('./scriptHandlers');
const { registerSettingsHandlers } = require('./settingsHandlers');

function registerAllHandlers() {
  registerUserHandlers();
  registerSessionHandlers();
  registerFileHandlers();
  registerDownloadHandlers();
  registerBookmarkHandlers();
  registerHistoryHandlers();
  registerScriptHandlers();
  registerSettingsHandlers();
}

module.exports = { registerAllHandlers };
