import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({
  memos,
  currentMemo,
  setCurrentMemo,
  isMenuOpen,
  setIsMenuOpen,
  handleNewMemo
}) => {
  return (
    <div
      className={`sidebar ${isMenuOpen ? "open" : ""}`}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div className="sidebar-content">
        <div className="memo-list">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className={`memo-item ${memo.id === currentMemo.id ? "active" : ""}`}
              onClick={() => {
                setCurrentMemo(memo);
                localStorage.setItem("currentMemoId", memo.id.toString());
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
  );
};

export default Sidebar;