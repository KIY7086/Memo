import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUndo,
  faRedo,
  faShare,
  faImage,
  faSave,
  faFileDownload,
  faFileImage,
  faCaretUp,
  faFileExport,
  faFileImport
} from "@fortawesome/free-solid-svg-icons";
import html2canvas from 'html2canvas';
import Modal from 'react-modal';
import { v4 as uuidv4 } from 'uuid';
import { saveImage, getImage } from '../utils/indexedDB';

const Toolbar = ({ currentMemo, setCurrentMemo, handleSave, isEditing, onToolbarAction, toast, canUndo, canRedo, memos, setMemos }) => {
  const fileInputRef = useRef(null);
  const importOverwriteInputRef = useRef(null);
  const importAppendInputRef = useRef(null);
  const dropdownButtonRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [tag, setTag] = useState("");
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (dropdownButtonRef.current) {
      dropdownButtonRef.current.style.transform = `rotate(${rotation}deg)`;
      dropdownButtonRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
  }, [rotation]);

  const toggleDropdown = () => {
    if (isDropdownOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsDropdownOpen(false);
        setIsClosing(false);
      }, 300);
    } else {
      setIsDropdownOpen(true);
    }
    setRotation(prevRotation => prevRotation === 0 ? 180 : 0);
  };

  const handleToolbarClick = (action) => {
    if (!isEditing && action !== "share" && action !== "exportAll" && action !== "importOverwrite" && action !== "importAppend") {
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
    } else if (action === "importOverwrite") {
      importOverwriteInputRef.current.click();
    } else if (action === "importAppend") {
      importAppendInputRef.current.click();
    } else {
      onToolbarAction(action);
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

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(memos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'memos.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setIsShareModalOpen(false);
    toast("备忘录导出成功", "success");
  };

  const handleExportImage = async () => {
    try {
      const previewElement = document.querySelector('.editor-preview');
      if (!previewElement) {
        throw new Error('Preview element not found');
      }

      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });

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
      }, 'image/png', 1);

      setIsShareModalOpen(false);
      toast("预览图片导出成功", "success");
    } catch (error) {
      console.error("Error exporting image:", error);
      toast("导出图片失败", "error");
    }
  };

  const handleImportMemos = (event, mode) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedMemos = JSON.parse(e.target.result);
          if (Array.isArray(importedMemos)) {
            if (mode === 'overwrite') {
              setMemos(importedMemos);
              toast(`成功导入并覆盖 ${importedMemos.length} 个备忘录`, "success");
            } else if (mode === 'append') {
              const newMemos = importedMemos.map(memo => ({
                ...memo,
                id: Date.now() + Math.random()
              }));
              setMemos(prevMemos => [...prevMemos, ...newMemos]);
              toast(`成功追加 ${newMemos.length} 个备忘录`, "success");
            }
            handleSave(); // 自动保存导入的备忘录
          } else {
            throw new Error('Invalid JSON format');
          }
        } catch (error) {
          console.error("Error importing memos:", error);
          toast("导入失败，请确保文件格式正确", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAddTag = () => {
    if(tag && !currentMemo.tags.includes(tag)) {
      setCurrentMemo({ ...currentMemo, tags: [...currentMemo.tags, tag] });
      setTag("");
      toast("标签添加成功", "success");
    } else {
      toast(tag ? "标签已存在" : "标签不能为空", "warning");
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
      <button
        ref={dropdownButtonRef}
        className="icon-btn"
        onClick={toggleDropdown}
      >
        <FontAwesomeIcon icon={faCaretUp} />
      </button>
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
      <div className={`toolbar-dropdown ${isDropdownOpen ? 'open' : ''} ${isClosing ? 'closing' : ''}`}>
        <div className="toolbar-tag-input">
          <input 
            type="text" 
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="输入标签"
          />
          <button onClick={handleAddTag}>添加标签</button>
        </div>
        <button onClick={() => handleToolbarClick("importOverwrite")} className="import-btn">
          <FontAwesomeIcon icon={faFileImport} />
          导入（覆盖）
        </button>
        <button onClick={() => handleToolbarClick("importAppend")} className="import-btn">
          <FontAwesomeIcon icon={faFileImport} />
          导入（追加）
        </button>
        <input
          ref={importOverwriteInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => handleImportMemos(e, 'overwrite')}
        />
        <input
          ref={importAppendInputRef}
          type="file"
          accept=".json"
          style={{ display: "none", marginRight: 0 }}
          onChange={(e) => handleImportMemos(e, 'append')}
        />
      </div>

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
              下载渲染图
            </button>
            <button onClick={handleExportJSON} className="modal-btn">
              <FontAwesomeIcon icon={faFileDownload} />
              导出全部备忘录
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Toolbar;