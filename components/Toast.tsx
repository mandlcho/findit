import React, { useEffect } from 'react';

type ToastType = 'error' | 'info' | 'success';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const accentStyles: Record<ToastType, string> = {
  error: 'border-l-red-400 bg-red-50/80',
  info: 'border-l-blue-400 bg-blue-50/80',
  success: 'border-l-green-400 bg-green-50/80',
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border-l-4 ${accentStyles[type]} backdrop-blur-sm`}
      >
        <span className="text-xs text-gray-800">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 text-xs"
          aria-label="close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
