import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faExpand, faEdit, faMinus } from "@fortawesome/free-solid-svg-icons";
import FullscreenMemoList from "./FullscreenMemoList";

const Sidebar = ({
  memos,
  currentMemo,
  setCurrentMemo,
  isMenuOpen,
  setIsMenuOpen,
  handleNewMemo,
  deleteMemo,
  theme // 确保从父组件传入 theme
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const toggleFullscreen = () => {
    setIsFullscreenMode(prev => !prev); // 使用函数式更新确保状态正确更新
    setIsMenuOpen(false); // 打开全屏时关闭侧边栏
  };

  const handleBackdropClick = () => {
    setIsMenuOpen(false);
    setIsEditMode(false);
  };

  const handleDeleteMemo = (memoId) => {
    deleteMemo(memoId);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreenMode(false);
  };

  return (
    <>
      <div 
        className={`sidebar-backdrop ${isMenuOpen ? 'active' : ''}`} 
        onClick={handleBackdropClick}
      ></div>
      <div className={`sidebar ${isMenuOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <button 
              onClick={toggleEditMode} 
              className="icon-btn"
              title="编辑模式"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button 
              onClick={toggleFullscreen} 
              className="icon-btn"
              title="全屏视图"
            >
              <FontAwesomeIcon icon={faExpand} />
            </button>
          </div>
          <div className="memo-list">
            {memos.map((memo) => (
              <div
                key={memo.id}
                className={`memo-item ${memo.id === currentMemo?.id ? "active" : ""} ${isEditMode ? "edit-mode" : ""}`}
              >
                <span
                  onClick={() => {
                    if (!isEditMode) {
                      setCurrentMemo(memo);
                      localStorage.setItem("currentMemoId", memo.id.toString());
                      setIsMenuOpen(false);
                    }
                  }}
                >
                  {memo.title}
                </span>
                {isEditMode && (
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMemo(memo.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={handleNewMemo} className="new-memo-btn">
            <FontAwesomeIcon icon={faPlus} /> 新建备忘录
          </button>
        </div>
      </div>

      {/* 确保 FullscreenMemoList 接收所有必要的属性 */}
      <FullscreenMemoList
        isOpen={isFullscreenMode}
        onClose={handleCloseFullscreen}
        memos={memos}
        currentMemo={currentMemo}
        setCurrentMemo={setCurrentMemo}
        handleNewMemo={handleNewMemo}
        theme={theme}
      />
    </>
  );
};

export default Sidebar;