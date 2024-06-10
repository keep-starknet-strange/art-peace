import React, { useState, useEffect } from 'react';
import './NotificationPanel.css';
// import '../utils/Styles.css'; // Ensure this import is correct

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
        <p>{message}</p>
        <p
          className='NotificationPanel__close'
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
        >
          X
        </p>
      </div>
    </div>
  );
};

export default NotificationPanel;
