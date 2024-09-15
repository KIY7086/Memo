import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faList,
  faImage,
  faSave,
  faBars,
  faPlus,
  faPencil,
  faSun,
  faMoon,
  faCog,
  faFileImport,
  faFileExport,
  faAdjust,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";

const MemoApp = () => {
  const [memos, setMemos] = useState([]);
  const [currentMemo, setCurrentMemo] = useState({
    id: null,
    title: "",
    content: "",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "auto"
  );

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const sidebarRef = useRef(null);

  const applyTheme = useCallback((selectedTheme) => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const themeToApply =
      selectedTheme === "auto"
        ? prefersDarkMode
          ? "dark"
          : "light"
        : selectedTheme;
    document.documentElement.setAttribute("data-theme", themeToApply);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => theme === "auto" && applyTheme("auto");
    mediaQuery.addListener(handleChange);

    return () => mediaQuery.removeListener(handleChange);
  }, [theme, applyTheme]);

  useEffect(() => {
    const savedMemos = JSON.parse(localStorage.getItem("memos") || "[]");
    const savedCurrentMemoId = localStorage.getItem("currentMemoId");

    if (savedMemos.length > 0) {
      setMemos(savedMemos);
      const lastMemo =
        savedMemos.find((memo) => memo.id === parseInt(savedCurrentMemoId)) ||
        savedMemos[0];
      setCurrentMemo(lastMemo);
    } else {
      const initialMemo = {
        id: Date.now(),
        title: "新建备忘录",
        content: "这是一个新的备忘录",
      };
      setMemos([initialMemo]);
      setCurrentMemo(initialMemo);
    }

    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".menu-icon")
      ) {
        setIsMenuOpen(false);
      }
      if (!event.target.closest(".app-title") && isEditingTitle) {
        setIsEditingTitle(false);
        handleSave();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isEditingTitle]);

  const showToast = (message, type = "info") => {
    toast.dismiss();

    const root = document.documentElement;
    const headerBg = getComputedStyle(root)
      .getPropertyValue("--header-bg")
      .trim();

    const toastOptions = {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      style: {
        backgroundColor: headerBg,
        color: getComputedStyle(root).getPropertyValue("--text-color").trim(),
      },
      className: "Toastify__toast--animate",
    };

    switch (type) {
      case "success":
        toast.success(message, toastOptions);
        break;
      case "error":
        toast.error(message, toastOptions);
        break;
      case "warning":
        toast.warn(message, toastOptions);
        break;
      default:
        toast.info(message, toastOptions);
        break;
    }
  };

  const handleToolbarClick = (action) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentMemo.content.substring(start, end);

    if (!selectedText && action !== "image") {
      showToast("请先选择文本", "warning");
      return;
    }

    let newText = "";
    switch (action) {
      case "bold":
        newText = `**${selectedText}**`;
        break;
      case "italic":
        newText = `*${selectedText}*`;
        break;
      case "list":
        newText = `\n- ${selectedText}`;
        break;
      case "image":
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
        showToast("图片上传成功", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = useCallback(
    (memoToSave = currentMemo) => {
      const updatedMemos = memos.map((memo) =>
        memo.id === memoToSave.id ? memoToSave : memo
      );
      setMemos(updatedMemos);
      localStorage.setItem("memos", JSON.stringify(updatedMemos));
      localStorage.setItem("currentMemoId", memoToSave.id.toString());
      showToast("保存成功", "success");
    },
    [memos, currentMemo]
  );

  const handleNewMemo = () => {
    const newMemo = {
      id: Date.now(),
      title: `新建备忘录 ${memos.length + 1}`,
      content: "",
    };
    const updatedMemos = [...memos, newMemo];
    setMemos(updatedMemos);
    setCurrentMemo(newMemo);
    localStorage.setItem("memos", JSON.stringify(updatedMemos));
    localStorage.setItem("currentMemoId", newMemo.id.toString());
    showToast("新建备忘录成功", "success");
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current.focus(), 0);
  };

  const handleTitleChange = (e) => {
    setCurrentMemo({ ...currentMemo, title: e.target.value });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      handleSave();
    }
  };

  const handleThemeChange = () => {
    setTheme((prevTheme) => {
      switch (prevTheme) {
        case "light":
          return "dark";
        case "dark":
          return "auto";
        case "auto":
          return "light";
        default:
          return "light";
      }
    });
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return faSun;
      case "dark":
        return faMoon;
      case "auto":
        return faAdjust;
      default:
        return faSun;
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setMemos(importedData.memos);
          setCurrentMemo(importedData.memos[0]);
          localStorage.setItem("memos", JSON.stringify(importedData.memos));
          localStorage.setItem(
            "currentMemoId",
            importedData.memos[0].id.toString()
          );
          showToast("备忘录导入成功", "success");
        } catch (error) {
          showToast("导入失败，请确保文件格式正确", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const exportData = { memos, currentMemoId: currentMemo.id };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memos_export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("备忘录导出成功", "success");
  };

  const ToolbarButton = ({ icon, action }) => (
    <button onClick={() => handleToolbarClick(action)} className="toolbar-btn">
      <FontAwesomeIcon icon={icon} />
    </button>
  );

  return (
    <div className="app-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
      />
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
              handleSave();
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
        <div className="app-header-tools">
          <button
            onClick={handleThemeChange}
            className="theme-toggle-btn"
            aria-label="切换主题"
          >
            <FontAwesomeIcon icon={getThemeIcon()} />
          </button>
        </div>
      </div>

      <div className="content-container">
        <div
          ref={sidebarRef}
          className={`sidebar ${isMenuOpen ? "open" : ""}`}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="sidebar-content">
            <div className="memo-list">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className={`memo-item ${
                    memo.id === currentMemo.id ? "active" : ""
                  }`}
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

        <div className="main-content">
          <div className="editor-container">
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={currentMemo.content}
              onChange={(e) =>
                setCurrentMemo({ ...currentMemo, content: e.target.value })
              }
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
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </div>
            <button className="save-btn" onClick={() => handleSave()}>
              <FontAwesomeIcon icon={faSave} /> &nbsp;保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoApp;
