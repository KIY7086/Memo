import React, { useState, useCallback, useRef, useEffect } from "react";
import "./styles/variable.css";
import "./styles/animation.css";
import "./styles/style.css";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Toolbar from "./components/Toolbar";
import ToastContainer from "./components/Toast";
import { toast } from "./components/Toast";
import { useTheme, useMemoStorage } from "./hooks/index.js";
import { getImage, saveImage } from "./utils/indexedDB";
import { v4 as uuidv4 } from "uuid";

const MemoApp = () => {
  const { theme, handleThemeChange, getThemeIcon } = useTheme();
  const {
    memos,
    setMemos,
    currentMemo,
    setCurrentMemo,
    saveMemo,
    createNewMemo,
  } = useMemoStorage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);

  const [memoHistory, setMemoHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (currentMemo && isEditing) {
      setMemoHistory((prev) => [
        ...prev.slice(0, historyIndex + 1),
        currentMemo,
      ]);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [currentMemo, isEditing]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  toast("新版本可用，请刷新页面以更新", "info");
                }
              });
            });
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }

    const handleOnline = () => toast("网络连接已恢复", "success");
    const handleOffline = () => toast("您当前处于离线状态", "warning");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateThemeColor = (isDark) => {
      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDark ? "#452429" : "#faedcd");
      }
    };

    updateThemeColor(theme === "dark");
  }, [theme]);

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
    setMemoHistory([newMemo]);
    setHistoryIndex(0);
    toast("新建备忘录成功", "success");
  };

  const handleToolbarAction = useCallback(
    async (action, value) => {
      if (!isEditing && action !== "share") {
        setIsEditing(true);
        return;
      }

      const textarea = editorRef.current;
      if (!textarea && action !== "share") return;

      const start = textarea ? textarea.selectionStart : 0;
      const end = textarea ? textarea.selectionEnd : 0;
      const content = currentMemo.content;

      let newContent = content;
      let newStart = start;
      let newEnd = end;

      switch (action) {
        case "undo":
          if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            setCurrentMemo(memoHistory[historyIndex - 1]);
          }
          return;
        case "redo":
          if (historyIndex < memoHistory.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            setCurrentMemo(memoHistory[historyIndex + 1]);
          }
          return;
        case "image":
          if (value instanceof File) {
            const imageId = uuidv4();
            await saveImage(imageId, value);
            const imageMarkdown = `![${value.name}](local:${imageId})`;
            newContent =
              content.substring(0, start) +
              imageMarkdown +
              content.substring(end);
            newEnd = newStart + imageMarkdown.length;
          } else {
            newContent =
              content.substring(0, start) + value + content.substring(end);
            newEnd = newStart + value.length;
          }
          break;
        case "share":
          return;
        default:
          return;
      }

      setCurrentMemo((prevMemo) => ({ ...prevMemo, content: newContent }));

      if (textarea) {
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newStart, newEnd);
        }, 0);
      }
    },
    [isEditing, currentMemo, setCurrentMemo, memoHistory, historyIndex]
  );

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
            currentMemo={currentMemo || { content: "", tags: [] }}
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
            canUndo={historyIndex > 0}
            canRedo={historyIndex < memoHistory.length - 1}
            memos={memos}
            setMemos={setMemos}
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default MemoApp;
