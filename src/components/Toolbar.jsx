import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUndo,
  faRedo,
  faShare,
  faImage,
  faSave,
  faFileDownload,
  faFileImage,
} from "@fortawesome/free-solid-svg-icons";
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import Modal from 'react-modal';
import { v4 as uuidv4 } from 'uuid';
import { saveImage, getImage } from '../utils/indexedDB';

const Toolbar = ({ currentMemo, setCurrentMemo, handleSave, isEditing, onToolbarAction, toast, canUndo, canRedo }) => {
  const fileInputRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleToolbarClick = (action) => {
    if (!isEditing && action !== "share") {
      toast("请先进入编辑模式", "warning");
      return;
    }
    if (action === "image") {
      fileInputRef.current.click();
    } else if (action === "share") {
      setIsShareModalOpen(true);
    } else if (action === "undo" && !canUndo) {
      toast("没有可撤销的操作", "info");
    } else if (action === "redo" && !canRedo) {
      toast("没有可重做的操作", "info");
    } else {
      onToolbarAction(action);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageId = uuidv4();
      await saveImage(imageId, file);
      const imageMarkdown = `![${file.name}](local:${imageId})`;
      onToolbarAction("image", imageMarkdown);
      toast("图片上传成功", "success");
    }
  };

  const handleDownloadMarkdown = async () => {
    let content = currentMemo.content;
    const localImageRegex = /!\[([^\]]*)\]\(local:([^)]+)\)/g;
    const matches = content.matchAll(localImageRegex);

    for (const match of matches) {
      const [fullMatch, altText, imageId] = match;
      const file = await getImage(imageId);
      if (file) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        content = content.replace(fullMatch, `![${altText}](${base64})`);
      }
    }

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${currentMemo.title}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setIsShareModalOpen(false);
    toast("Markdown 文件下载成功", "success");
  };

  const handleExportImage = async () => {
    try {
      let content = currentMemo.content;
      const localImageRegex = /!\[([^\]]*)\]\(local:([^)]+)\)/g;
      const matches = content.matchAll(localImageRegex);

      for (const match of matches) {
        const [fullMatch, altText, imageId] = match;
        const file = await getImage(imageId);
        if (file) {
          const url = URL.createObjectURL(file);
          content = content.replace(fullMatch, `![${altText}](${url})`);
        }
      }

      const htmlContent = marked(content);
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.padding = '20px';
      container.style.width = '800px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const canvas = await html2canvas(container);
      document.body.removeChild(container);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentMemo.title}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      setIsShareModalOpen(false);
      toast("渲染图片下载成功", "success");
    } catch (error) {
      console.error("Error exporting image:", error);
      toast("导出图片失败", "error");
    }
  };

  const ToolbarButton = ({ icon, action, label, disabled }) => (
    <button 
      onClick={() => handleToolbarClick(action)} 
      className={`toolbar-btn ${disabled ? 'disabled' : ''}`} 
      title={label}
      disabled={disabled}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );

  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        <ToolbarButton icon={faUndo} action="undo" label="撤销" disabled={!canUndo} />
        <ToolbarButton icon={faRedo} action="redo" label="重做" disabled={!canRedo} />
        <ToolbarButton icon={faImage} action="image" label="插入图片" />
        <ToolbarButton icon={faShare} action="share" label="分享" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>
      <button className="save-btn" onClick={handleSave}>
        <FontAwesomeIcon icon={faSave} /> &nbsp; 保存
      </button>

      <Modal
        isOpen={isShareModalOpen}
        onRequestClose={() => setIsShareModalOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)'
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            background: 'none',
            maxWidth: '400px',
            width: '90%'
          }
        }}
        contentLabel="分享选项"
        closeTimeoutMS={300}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>选择分享方式</h2>
          </div>
          <div className="modal-body">
            <button onClick={handleDownloadMarkdown} className="modal-btn">
              <FontAwesomeIcon icon={faFileDownload} />
              下载 Markdown
            </button>
            <button onClick={handleExportImage} className="modal-btn">
              <FontAwesomeIcon icon={faFileImage} />
              导出渲染图
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Toolbar;
