import React, { useState, useCallback, useRef } from "react";
import "./styles/style.css";
import "./styles/animations.css";
import "./styles/toast.css";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Toolbar from "./components/Toolbar";
import ToastContainer from './components/Toast';
import { toast } from './components/Toast';
import { useTheme, useMemoStorage } from "./hooks/index.js";

const MemoApp = () => {
  const { theme, handleThemeChange, getThemeIcon } = useTheme();
  const { memos, setMemos, currentMemo, setCurrentMemo, saveMemo, createNewMemo } = useMemoStorage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);

  const handleSave = useCallback(() => {
    if (!currentMemo.title) {
      toast("标题不能为空", "error");
      return;
    }
    setIsEditing(false);
    saveMemo(currentMemo);
    toast("保存成功", "success");
  }, [currentMemo, saveMemo]);

  const handleNewMemo = () => {
    const newMemo = createNewMemo();
    toast("新建备忘录成功", "success");
  };

  const handleToolbarAction = useCallback((action, value) => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = currentMemo.content;
    const selectedText = content.substring(start, end);

    let newContent = content;
    let newStart = start;
    let newEnd = end;

    switch (action) {
      case "bold":
        newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        newEnd = newStart + selectedText.length + 4;
        break;
      case "italic":
        newContent = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
        newEnd = newStart + selectedText.length + 2;
        break;
      case "list":
        newContent = content.substring(0, start) + `\n- ${selectedText}` + content.substring(end);
        newEnd = newStart + selectedText.length + 3;
        break;
      case "image":
        newContent = content.substring(0, start) + value + content.substring(end);
        newEnd = newStart + value.length;
        break;
      default:
        return;
    }

    setCurrentMemo(prevMemo => ({ ...prevMemo, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  }, [isEditing, currentMemo, setCurrentMemo]);

  return (
    <div className="app-container">
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
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editorRef={editorRef}
          />
          <Toolbar
            currentMemo={currentMemo}
            setCurrentMemo={setCurrentMemo}
            handleSave={handleSave}
            isEditing={isEditing}
            onToolbarAction={handleToolbarAction}
            toast={toast}
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default MemoApp;
