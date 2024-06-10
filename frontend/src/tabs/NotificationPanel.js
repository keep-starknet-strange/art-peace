// import React, { useState, useEffect } from 'react';
// import './NotificationPanel.css';

// const NotificationPanel = ({ message, onClose, animationDuration = 3000 }) => {
//   const [isVisible, setIsVisible] = useState(false);

//   useEffect(() => {
//     if (message) {
//       setIsVisible(true);
//       const timer = setTimeout(() => {
//         setIsVisible(false);
//         if (onClose) onClose();
//       }, animationDuration);
//       return () => clearTimeout(timer);
//     }
//   }, [message, onClose, animationDuration]);

//   return (
//     <div
//       className={`notification-panel ${isVisible ? 'slide-in' : 'slide-out'}`}
//     >
//       <div className='notification-content'>
//         <p>{message}</p>
//         <p
//           className='NotificationPanel__close'
//           onClick={() => {
//             setIsVisible(false);
//             if (onClose) onClose();
//           }}
//         >
//           X
//         </p>
//       </div>
//     </div>
//   );
// };

// export default NotificationPanel;
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

  const closeOverlay = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div
      className={`notification-panel ${isVisible ? 'slide-in' : 'slide-out'}`}
    >
      <div className='notification-content'>
        <p>{message}</p>
        <div
          className='TemplateOverlay__close Text__medium'
          onClick={closeOverlay}
        >
          X
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
