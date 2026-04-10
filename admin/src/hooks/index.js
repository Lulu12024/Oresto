import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return {
    toasts,
    removeToast,
    toast: {
      success: (title, msg) => add("success", title, msg),
      error:   (title, msg) => add("error",   title, msg),
      info:    (title, msg) => add("info",    title, msg),
      warning: (title, msg) => add("warning", title, msg),
    },
  };
}
