import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getImage } from '../utils/indexedDB';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const Editor = ({ currentMemo, setCurrentMemo, isEditing, setIsEditing, editorRef }) => {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    const processContent = async () => {
      if (!currentMemo?.content) {
        setProcessedContent('');
        return;
      }

      let content = currentMemo.content;
      const localImageRegex = /!\[([^\]]*)\]\(local:([^)]+)\)/g;
      const matches = content.matchAll(localImageRegex);

      for (const match of matches) {
        const [fullMatch, altText, imageId] = match;
        const file = await getImage(imageId);
        if (file) {
          const url = URL.createObjectURL(file);
          content = content.replace(fullMatch, `![${altText}](${url})`);
        }
      }

      setProcessedContent(content);
    };

    processContent();
  }, [currentMemo]);

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
  }, [isEditing, editorRef]);

  useEffect(() => {
    return () => {
      const localImageRegex = /!\[([^\]]*)\]\((blob:[^)]+)\)/g;
      const matches = processedContent.matchAll(localImageRegex);
      for (const match of matches) {
        URL.revokeObjectURL(match[2]);
      }
    };
  }, [processedContent]);

  const handleTagRemove = (tagToRemove) => {
    setCurrentMemo((prevMemo) => ({
      ...prevMemo,
      tags: prevMemo.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  return (
    <div className="editor-container" onClick={handleContainerClick}>
      <div className="tags-container">
        {currentMemo.tags.map((tag) => (
          <div key={tag} className="tag">
            #&nbsp;{tag}
            <button onClick={() => handleTagRemove(tag)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>
      {isEditing ? (
        <textarea
          ref={editorRef}
          className="editor-content"
          value={currentMemo.content}
          onChange={handleContentChange}
        />
      ) : (
        <div 
          className="editor-preview" 
          onClick={handlePreviewClick}
        >
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default Editor;
