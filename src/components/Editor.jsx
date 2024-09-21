import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const Editor = ({ currentMemo, setCurrentMemo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setCurrentMemo(prevMemo => ({ ...prevMemo, content: newContent }));
  };

  const handleContainerClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsEditing(true);
    }
  };

  const handlePreviewClick = (e) => {
    if (e.target.tagName.toLowerCase() !== 'a') {
      setIsEditing(true);
    }
  };

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="editor-container" onClick={handleContainerClick}>
      {isEditing ? (
        <textarea
          ref={editorRef}
          className="editor-content"
          value={currentMemo.content}
          onChange={handleContentChange}
          onBlur={() => setIsEditing(false)}
        />
      ) : (
        <div 
          ref={previewRef}
          className="editor-preview" 
          onClick={handlePreviewClick}
        >
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
          >
            {currentMemo.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default Editor;