import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faList,
  faImage,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

const Toolbar = ({ currentMemo, setCurrentMemo, handleSave, isEditing, onToolbarAction, toast }) => {
  const fileInputRef = useRef(null);

  const handleToolbarClick = (action) => {
    if (!isEditing) {
      toast("请先进入编辑模式", "warning");
      return;
    }

    if (action === "image") {
      fileInputRef.current.click();
    } else {
      onToolbarAction(action);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageMarkdown = `![${file.name}](${e.target.result})`;
        onToolbarAction("image", imageMarkdown);
        toast("图片上传成功", "success");
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
        <FontAwesomeIcon icon={faSave} />  保存
      </button>
    </div>
  );
};

export default Toolbar;
