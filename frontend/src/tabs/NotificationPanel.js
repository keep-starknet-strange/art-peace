import React, { useState, useEffect } from 'react';
import './NotificationPanel.css';

const NotificationPanel = ({ message, onClose, animationDuration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, animationDuration]);

  return (
    <div
      className={`notification-panel ${isVisible ? 'slide-in' : 'slide-out'}`}
    >
      <div className='notification-content'>
        {message}
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
