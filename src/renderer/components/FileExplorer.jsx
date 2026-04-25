import React from 'react';
import { Tree } from 'antd';
import { FolderOutlined, FolderOpenOutlined, FileOutlined } from '@ant-design/icons';

/**
 * 文件目录树组件
 * 用于展示文件系统的树形结构
 */
export default function FileExplorer({ files, onSelect, selectedPath }) {
  const buildTreeData = (fileList) => {
    if (!fileList) return [];

    return fileList
      .filter((f) => f.isDirectory)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((dir) => ({
        title: dir.name,
        key: dir.path,
        icon: ({ expanded }) =>
          expanded ? <FolderOpenOutlined /> : <FolderOutlined />,
        isLeaf: false,
      }));
  };

  const treeData = buildTreeData(files);

  return (
    <Tree
      showIcon
      defaultExpandAll
      selectedKeys={selectedPath ? [selectedPath] : []}
      onSelect={(selectedKeys) => {
        if (selectedKeys.length > 0 && onSelect) {
          onSelect(selectedKeys[0]);
        }
      }}
      treeData={treeData}
      style={{ background: 'transparent' }}
    />
  );
}
