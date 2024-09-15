import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBold, faItalic, faList, faImage, faSave, faBars, 
  faPlus, faPencil, faSun, faMoon, faAdjust 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import './style.css';

const MemoApp = () => {
  const [memos, setMemos] = useState([]);
  const [currentMemo, setCurrentMemo] = useState({ id: null, title: '', content: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const sidebarRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // 保存主题到 localStorage
    localStorage.setItem('theme', theme);
    
    // 动态加载主题 CSS
    const link = document.createElement('link');
    link.href = `/themes/${theme}.css`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [theme]);

  const handleThemeChange = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // 刷新页面以应用新主题
      window.location.reload();
      return newTheme;
    });
  };

  // 从 localStorage 中加载备忘录和上一次编辑的备忘录
  useEffect(() => {
    const savedMemos = JSON.parse(localStorage.getItem('memos'));
    const savedCurrentMemoId = localStorage.getItem('currentMemoId');

    if (savedMemos && savedMemos.length > 0) {
      setMemos(savedMemos);
      const lastMemo = savedMemos.find((memo) => memo.id === parseInt(savedCurrentMemoId));
      if (lastMemo) {
        setCurrentMemo(lastMemo);
      } else {
        setCurrentMemo(savedMemos[0]);
      }
    } else {
      const initialMemo = { id: Date.now(), title: '新建备忘录', content: '这是一个新的备忘录' };
      setMemos([initialMemo]);
      setCurrentMemo(initialMemo);
    }

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest('.menu-icon')) {
        setIsMenuOpen(false);
      }
      if (!event.target.closest('.app-title') && isEditingTitle) {
        setIsEditingTitle(false);
        handleSave();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isEditingTitle]);

  // 设置不同模式下的 Toast 样式
  const showToast = (message, type = 'info') => {
    const toastBackgroundColor = theme === 'dark' ? '#3a3a37' : '#e6e4dd';
    
    Swal.mixin({
      toast: true,
      position: 'top-right',
      showConfirmButton: false,
      timer: 3000,
      background: toastBackgroundColor,
      customClass: {
        popup: 'colored-toast'
      }
    }).fire({
      icon: type,
      title: message
    });
  };

  const handleToolbarClick = (action) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentMemo.content.substring(start, end);
  
    let newText = '';
    switch (action) {
      case 'bold':
        if (!selectedText) {
          showToast('你没有选择任何文本', 'warning');
          return;
        }
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        if (!selectedText) {
          showToast('你没有选择任何文本', 'warning');
          return;
        }
        newText = `*${selectedText}*`;
        break;
      case 'list':
        if (!selectedText) {
          showToast('你没有选择任何文本', 'warning');
          return;
        }
        newText = `\n- ${selectedText}`;
        break;
      case 'image':
        fileInputRef.current.click();
        return;
      default:
        return;
    }
  
    const updatedContent =
      currentMemo.content.substring(0, start) +
      newText +
      currentMemo.content.substring(end);
  
    setCurrentMemo({ ...currentMemo, content: updatedContent });
    textarea.focus();
    textarea.setSelectionRange(start + newText.length, start + newText.length);
  };  

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageMarkdown = `![${file.name}](${e.target.result})`;
        const textarea = textareaRef.current;
        const cursorPosition = textarea.selectionStart;
        const updatedContent =
          currentMemo.content.substring(0, cursorPosition) +
          imageMarkdown +
          currentMemo.content.substring(cursorPosition);
        setCurrentMemo({ ...currentMemo, content: updatedContent });
        showToast('图片上传成功', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (memoToSave = currentMemo) => {
    const updatedMemos = memos.map((memo) =>
      memo.id === memoToSave.id ? memoToSave : memo
    );
    setMemos(updatedMemos);
    localStorage.setItem('memos', JSON.stringify(updatedMemos));
    localStorage.setItem('currentMemoId', memoToSave.id); // 保存当前 memo 的 id
    showToast('保存成功', 'success');
  };

  const handleNewMemo = () => {
    const newMemo = {
      id: Date.now(),
      title: `新建备忘录 ${memos.length + 1}`,
      content: '',
    };
    const updatedMemos = [...memos, newMemo];
    setMemos(updatedMemos);
    setCurrentMemo(newMemo);
    localStorage.setItem('memos', JSON.stringify(updatedMemos));
    localStorage.setItem('currentMemoId', newMemo.id); // 保存当前 memo 的 id
    showToast('新建备忘录成功', 'success');
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current.focus(), 0);
  };

  const handleTitleChange = (e) => {
    setCurrentMemo({ ...currentMemo, title: e.target.value });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
      handleSave();
    }
  };

  const ToolbarButton = ({ icon, action }) => (
    <button onClick={() => handleToolbarClick(action)} className="toolbar-btn">
      <FontAwesomeIcon icon={icon} />
    </button>
  );

  return (
    <div className="app-container">
      <div className="app-header">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            className="app-title-input"
            value={currentMemo.title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={() => {
              setIsEditingTitle(false);
            }}
          />
        ) : (
          <h1 className="app-title" onClick={handleTitleClick}>
            {currentMemo.title}
            <FontAwesomeIcon icon={faPencil} className="edit-icon" />
          </h1>
        )}
        <div className="menu-icon" onMouseEnter={() => setIsMenuOpen(true)}>
          <FontAwesomeIcon icon={faBars} size="lg" />
        </div>
        <button
          onClick={handleThemeChange}
          className="theme-toggle-btn"
          aria-label="切换主题"
        >
          <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
        </button>
      </div>

      <div className="content-container">
        <div 
          ref={sidebarRef}
          className={`sidebar ${isMenuOpen ? 'open' : ''}`}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="sidebar-content">
            <div className="memo-list">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className={`memo-item ${memo.id === currentMemo.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentMemo(memo); // 切换到点击的 memo
                    localStorage.setItem('currentMemoId', memo.id); // 更新当前 memo 的 id
                    setIsMenuOpen(false);
                  }}
                >
                  {memo.title}
                </div>
              ))}
            </div>
            <button onClick={handleNewMemo} className="new-memo-btn">
              <FontAwesomeIcon icon={faPlus} /> 新建备忘录
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="editor-container">
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={currentMemo.content}
              onChange={(e) => setCurrentMemo({ ...currentMemo, content: e.target.value })}
              placeholder="在这里输入你的备忘录内容..."
            />
            <div className="editor-preview">
              <ReactMarkdown>{currentMemo.content}</ReactMarkdown>
            </div>
          </div>

          <div className="toolbar">
            <div className="toolbar-buttons">
              <ToolbarButton icon={faBold} action="bold" />
              <ToolbarButton icon={faItalic} action="italic" />
              <ToolbarButton icon={faList} action="list" />
              <ToolbarButton icon={faImage} action="image" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
            <button
              className="save-btn"
              onClick={() => handleSave()}
            >
              <FontAwesomeIcon icon={faSave} /> &nbsp;保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoApp;