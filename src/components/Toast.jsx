import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Info, CheckCircle, Warning, Error } from '@mui/icons-material';

const icons = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: Error
};

const TOAST_DURATION = 3000; // 3 seconds
const ANIMATION_DURATION = 500; // 0.5 seconds
const MAX_TOASTS = 5;

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => 
      prevToasts.map(toast => 
        toast.id === id ? { ...toast, isClosing: true } : toast
      )
    );

    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, ANIMATION_DURATION);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type, isClosing: false, isNew: true };
    setToasts(prevToasts => [newToast, ...prevToasts].slice(0, MAX_TOASTS));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToasts(prevToasts => 
          prevToasts.map(toast => 
            toast.id === id ? { ...toast, isNew: false } : toast
          )
        );
      });
    });

    setTimeout(() => removeToast(id), TOAST_DURATION);
  }, [removeToast]);

  useEffect(() => {
    window.addToast = addToast;
    return () => {
      delete window.addToast;
    };
  }, [addToast]);

  return ReactDOM.createPortal(
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <Toast key={toast.id} {...toast} index={index} />
      ))}
    </div>,
    document.body
  );
};

const Toast = ({ id, message, type, isClosing, isNew, index }) => {
  const Icon = icons[type] || icons.info;

  return (
    <div 
      className={`toast ${type} ${isClosing ? 'closing' : ''} ${isNew ? 'new' : ''}`}
      style={{ '--index': index }}
    >
      <Icon className="toast-icon material-symbols-rounded" />
      <span className="toast-message">{message}</span>
    </div>
  );
};

export const toast = (message, type) => {
  if (typeof window.addToast === 'function') {
    window.addToast(message, type);
  }
};

export default ToastContainer;
