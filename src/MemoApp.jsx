import React, { useState, useCallback, useRef, useEffect } from "react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileAlt } from "@fortawesome/free-solid-svg-icons";
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

Modal.setAppElement('#root');

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
  const [isUnsupportedDevice, setIsUnsupportedDevice] = useState(false);

  useEffect(() => {
    const checkDeviceOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsUnsupportedDevice(!(isPortrait && isMobile));
    };

    checkDeviceOrientation();
    window.addEventListener("resize", checkDeviceOrientation);
    window.addEventListener("orientationchange", checkDeviceOrientation);

    return () => {
      window.removeEventListener("resize", checkDeviceOrientation);
      window.removeEventListener("orientationchange", checkDeviceOrientation);
    };
  }, []);

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
      let refreshing = false;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("SW registered: ", registration);

            registration.update();
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    toast("请刷新页面以应用更新", "info", Infinity, true);
                  } else {
                    console.log("首次安装 Service Worker");
                  }
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
  
  const deleteMemo = useCallback((memoId) => {
      setMemos((prevMemos) => prevMemos.filter((memo) => memo.id !== memoId));
      if (currentMemo && currentMemo.id === memoId) {
        const remainingMemos = memos.filter(memo => memo.id !== memoId);
        if (remainingMemos.length > 0) {
          setCurrentMemo(remainingMemos[0]);
          localStorage.setItem("currentMemoId", remainingMemos[0].id.toString());
        } else {
          setCurrentMemo(null);
          localStorage.removeItem("currentMemoId");
        }
      }
      localStorage.setItem('memos', JSON.stringify(memos.filter(memo => memo.id !== memoId)));
      toast("备忘录已删除", "success");
    }, [memos, currentMemo, setMemos, setCurrentMemo]);

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

  if (isUnsupportedDevice) {
    return (
     <Modal
        isOpen={true}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h2 className="modal-title">设备不支持</h2>
        </div>
        <div className="modal-body">
          <FontAwesomeIcon icon={faMobileAlt} className="modal-icon" />
          <p className="modal-message">
            抱歉，此应用程序仅支持手机竖屏模式使用。
            <br />
            请使用手机并将其旋转至竖屏模式以访问应用。
          </p>
        </div>
      </Modal>
    );
  }

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
          deleteMemo={deleteMemo}
          theme={theme}
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