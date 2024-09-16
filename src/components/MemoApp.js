import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/style.css";
import "./styles/toast.css";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Toolbar from "./components/Toolbar";
import { useTheme, useMemoStorage, showToast } from "./hooks";

const MemoApp = () => {
  const { theme, handleThemeChange, getThemeIcon } = useTheme();
  const { memos, setMemos, currentMemo, setCurrentMemo, saveMemo, createNewMemo } = useMemoStorage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleSave = useCallback(() => {
    if (!currentMemo.title) {
      showToast("标题不能为空", "error");
      return;
    }
    saveMemo(currentMemo);
    showToast("保存成功", "success");
  }, [currentMemo, saveMemo]);

  const handleNewMemo = () => {
    const newMemo = createNewMemo();
    showToast("新建备忘录成功", "success");
  };

  return (
    <div className="app-container">
      <ToastContainer
        position="top-right"
        hideProgressBar={true}
        autoClose={1}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
      />
      <Header
        currentMemo={currentMemo}
        setCurrentMemo={setCurrentMemo}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        handleSave={handleSave}
        theme={theme}
        handleThemeChange={handleThemeChange}
        getThemeIcon={getThemeIcon}
        setIsMenuOpen={setIsMenuOpen}
      />
      <div className="content-container">
        <Sidebar
          memos={memos}
          currentMemo={currentMemo}
          setCurrentMemo={setCurrentMemo}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          handleNewMemo={handleNewMemo}
        />
        <div className="main-content">
          <Editor
            currentMemo={currentMemo}
            setCurrentMemo={setCurrentMemo}
          />
          <Toolbar
            currentMemo={currentMemo}
            setCurrentMemo={setCurrentMemo}
            handleSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
};

export default MemoApp;