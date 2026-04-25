import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import UserManager from './pages/UserManager';
import Browser from './pages/Browser';
import FileManager from './pages/FileManager';
import DownloadManager from './pages/DownloadManager';
import ScriptManager from './pages/ScriptManager';
import Settings from './pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/browser" replace />} />
          <Route path="users" element={<UserManager />} />
          <Route path="browser" element={<Browser />} />
          <Route path="files" element={<FileManager />} />
          <Route path="downloads" element={<DownloadManager />} />
          <Route path="scripts" element={<ScriptManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
