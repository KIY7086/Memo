import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faList,
  faImage,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { showToast } from "../hooks";

const Toolbar = ({ currentMemo, setCurrentMemo, handleSave }) => {
  const fileInputRef = useRef(null);

  const handleToolbarClick = (action) => {
    const textarea = document.querySelector(".editor-textarea");
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
        const textarea = document.querySelector(".editor-textarea");
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

  const ToolbarButton = ({ icon, action }) => (
    <button onClick={() => handleToolbarClick(action)} className="toolbar-btn">
      <FontAwesomeIcon icon={icon} />
    </button>
  );

  return (
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
      <button className="save-btn" onClick={handleSave}>
        <FontAwesomeIcon icon={faSave} /> &nbsp;保存
      </button>
    </div>
  );
};

export default Toolbar;