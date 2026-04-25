const { ipcMain } = require('electron');

const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');

let _store = null;
function getStore() {
  if (!_store) {
    const Store = require('electron-store');
    _store = new Store({ name: 'bookmarks' });
  }
  return _store;
}

/**
 * 书签管理 IPC Handler
 */
function registerBookmarkHandlers() {
  // 获取所有书签
  ipcMain.handle('get-bookmarks', async () => {
    try {
      return getStore().get('bookmarks', []);
    } catch (error) {
      log.error('获取书签失败:', error);
      return [];
    }
  });

  // 保存书签
  ipcMain.handle('save-bookmark', async (event, bookmark) => {
    try {
      const bookmarks = getStore().get('bookmarks', []);
      const now = Date.now();

      if (bookmark.id) {
        // 更新
        const index = bookmarks.findIndex((b) => b.id === bookmark.id);
        if (index !== -1) {
          bookmarks[index] = { ...bookmarks[index], ...bookmark };
          log.info(`更新书签: ${bookmark.id}`);
        }
      } else {
        // 新建
        const newBookmark = {
          id: uuidv4(),
          userId: bookmark.userId,
          title: bookmark.title,
          url: bookmark.url,
          favicon: bookmark.favicon || '',
          createdAt: now,
        };
        bookmarks.push(newBookmark);
        log.info(`新建书签: ${newBookmark.title}`);
      }

      getStore().set('bookmarks', bookmarks);
      return bookmark.id
        ? bookmarks.find((b) => b.id === bookmark.id)
        : bookmarks[bookmarks.length - 1];
    } catch (error) {
      log.error('保存书签失败:', error);
      return null;
    }
  });

  // 删除书签
  ipcMain.handle('delete-bookmark', async (event, bookmarkId) => {
    try {
      let bookmarks = getStore().get('bookmarks', []);
      bookmarks = bookmarks.filter((b) => b.id !== bookmarkId);
      getStore().set('bookmarks', bookmarks);
      log.info(`删除书签: ${bookmarkId}`);
      return bookmarks;
    } catch (error) {
      log.error('删除书签失败:', error);
      return getStore().get('bookmarks', []);
    }
  });
}

module.exports = { registerBookmarkHandlers };
