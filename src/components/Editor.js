import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";

const Editor = ({ currentMemo, setCurrentMemo }) => {
  const textareaRef = useRef(null);

  const handleContentChange = (e) => {
    setCurrentMemo({ ...currentMemo, content: e.target.value });
  };

  return (
    <div className="editor-container">
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={currentMemo.content}
        onChange={handleContentChange}
        placeholder="在这里输入你的备忘录内容..."
      />
      <div className="editor-preview">
        <ReactMarkdown>{currentMemo.content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default Editor;