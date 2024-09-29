import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { InfoRounded, CheckCircleRounded, WarningRounded, ErrorRounded, CloseRounded, RefreshRounded } from '@mui/icons-material';

const icons = {
  info: InfoRounded,
  success: CheckCircleRounded,
  warning: WarningRounded,
  error: ErrorRounded
};

const TOAST_DURATION = 3000;
const ANIMATION_DURATION = 500;

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

  const addToast = useCallback((message, type = 'info', duration = TOAST_DURATION, withRefresh = false) => {
    const id = Date.now();
    const newToast = { id, message, type, isClosing: false, isNew: true, withRefresh };
    setToasts(prevToasts => [newToast, ...prevToasts]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToasts(prevToasts => 
          prevToasts.map(toast => 
            toast.id === id ? { ...toast, isNew: false } : toast
          )
        );
      });
    });
    if (duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
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
        <Toast 
          key={toast.id} 
          {...toast} 
          index={index} 
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
};

const Toast = ({ id, message, type, isClosing, isNew, index, onClose, withRefresh }) => {
  const Icon = icons[type] || icons.info;

  return (
    <div 
      className={`toast ${type} ${isClosing ? 'closing' : ''} ${isNew ? 'new' : ''}`}
      style={{ '--index': index }}
    >
      <Icon className="toast-icon" />
      <span className="toast-message">{message}</span>
      {withRefresh ? (
        <button className="toast-refresh" onClick={() => window.location.reload()}>
          <RefreshRounded className="refresh-icon" />
        </button>
      ) : (
        <button className="toast-close" onClick={onClose}>
          <CloseRounded className="close-icon" />
        </button>
      )}
    </div>
  );
};

export const toast = (message, type, duration = TOAST_DURATION, withRefresh = false) => {
  if (typeof window.addToast === 'function') {
    window.addToast(message, type, duration, withRefresh);
  }
};

export default ToastContainer;