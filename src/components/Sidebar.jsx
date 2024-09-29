import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faExpand, faEdit, faMinus } from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({
  memos,
  currentMemo,
  setCurrentMemo,
  isMenuOpen,
  setIsMenuOpen,
  handleNewMemo,
  toggleFullscreen,
  deleteMemo
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleBackdropClick = () => {
    setIsMenuOpen(false);
    setIsEditMode(false);  // 取消编辑状态
  };

  const handleDeleteMemo = (memoId) => {
    deleteMemo(memoId);
  };

  return (
    <>
      <div 
        className={`sidebar-backdrop ${isMenuOpen ? 'active' : ''}`} 
        onClick={handleBackdropClick}
      ></div>
      <div
        className={`sidebar ${isMenuOpen ? "open" : ""}`}
      >
        <div className="sidebar-content">
          <div className="sidebar-header">
            <button onClick={toggleEditMode} className="icon-btn">
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button onClick={toggleFullscreen} className="icon-btn">
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
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMemo(memo.id);
                  }}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleNewMemo} className="new-memo-btn">
            <FontAwesomeIcon icon={faPlus} /> 新建备忘录
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
