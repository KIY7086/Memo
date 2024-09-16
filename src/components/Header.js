import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faPencil } from "@fortawesome/free-solid-svg-icons";

const Header = ({
  currentMemo,
  setCurrentMemo,
  isEditingTitle,
  setIsEditingTitle,
  handleSave,
  theme,
  handleThemeChange,
  getThemeIcon,
  setIsMenuOpen
}) => {
  const handleTitleChange = (e) => {
    const newTitle = e.target.value.trim();
    setCurrentMemo({ ...currentMemo, title: newTitle });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      handleSave();
    }
  };

  return (
    <div className="app-header">
      <div className="menu-icon" onMouseEnter={() => setIsMenuOpen(true)}>
        <FontAwesomeIcon icon={faBars} size="lg" />
      </div>
      <div className="title-wrapper">
        <div className="title-background"></div>
        {isEditingTitle ? (
          <input
            type="text"
            className="app-title-input"
            value={currentMemo.title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={() => {
              setIsEditingTitle(false);
              handleSave();
            }}
            autoFocus
          />
        ) : (
          <h1 className="app-title" onClick={() => setIsEditingTitle(true)}>
            {currentMemo.title}
            <FontAwesomeIcon icon={faPencil} className="edit-icon" />
          </h1>
        )}
      </div>
      <button
        onClick={handleThemeChange}
        className="theme-toggle-btn"
        aria-label="切换主题"
      >
        <FontAwesomeIcon icon={getThemeIcon()} />
      </button>
    </div>
  );
};

export default Header;