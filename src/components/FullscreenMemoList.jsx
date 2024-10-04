import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faPlus, faBox } from '@fortawesome/free-solid-svg-icons';

const FullscreenMemoList = ({ 
  isOpen, 
  onClose, 
  memos, 
  currentMemo,
  setCurrentMemo,
  handleNewMemo,
  theme 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMemos, setFilteredMemos] = useState(memos);
  const [isVisible, setIsVisible] = useState(false);
  const searchInputRef = useRef(null);

  // 处理显示/隐藏动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      searchInputRef.current?.focus();
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // 等待动画结束
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 搜索逻辑
  useEffect(() => {
    if (searchTerm) {
      const filtered = memos.filter(memo => 
        memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMemos(filtered);
    } else {
      setFilteredMemos(memos);
    }
  }, [searchTerm, memos]);

  const handleMemoClick = (memo) => {
    setCurrentMemo(memo);
    localStorage.setItem("currentMemoId", memo.id.toString());
    onClose();
  };

  const handleAddNew = () => {
    handleNewMemo();
    onClose();
  };

  // 如果不可见则不渲染
  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={`fullscreen-overlay ${isOpen ? 'show' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="fullscreen-content">
        {/* 搜索头部 */}
        <div className="search-header">
          <div className="search-bar">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="search-icon"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索备忘录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={onClose}
              className="close-button"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* 备忘录网格 */}
        <div className="memo-grid-container">
          {filteredMemos.length > 0 ? (
            <div className="memo-grid">
              {filteredMemos.map(memo => (
                <div
                  key={memo.id}
                  className="memo-card"
                  onClick={() => handleMemoClick(memo)}
                >
                  <h3 className="memo-title">{memo.title}</h3>
                  <p className="memo-content">{memo.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FontAwesomeIcon icon={faBox} className="empty-icon" />
              <p className="empty-text">什么也木有找到</p>
              {searchTerm && (
                <p className="empty-subtext">
                  试试其他关键词？
                </p>
              )}
            </div>
          )}
        </div>

        {/* 新建按钮 */}
        <button
          className="add-button"
          onClick={handleAddNew}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );
};

export default FullscreenMemoList;