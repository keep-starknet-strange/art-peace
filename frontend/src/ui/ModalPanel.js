import React, { useState, useEffect } from 'react';
import { encodeToLink } from '../utils/encodeToLink';
import './ModalPanel.css';

const ModalPanel = (props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (props.modal) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [props]);

  const clearModal = () => {
    setIsVisible(false);
    props.setModal(null);
    if (props.modal.closeAction) {
      props.modal.closeAction();
    }
  };

  const confirmModal = () => {
    props.modal.action();
    clearModal();
  };

  return (
    <div className={`modal-panel ${isVisible ? 'slide-in' : 'slide-out'}`}>
      {props.modal && (
        <div>
          <h2 className='Text__medium modal-panel__title'>
            {props.modal.title}
          </h2>
          {props.modal.text &&
            props.modal.text.split('\n').map((item, key) => {
              return (
                <p
                  key={key}
                  className='Text__small modal-panel__text'
                  dangerouslySetInnerHTML={encodeToLink(item)}
                ></p>
              );
            })}
          <div className='modal-panel__buttons'>
            <div className='Text__small Button__primary' onClick={clearModal}>
              Cancel
            </div>
            <div className='Text__small Button__primary' onClick={confirmModal}>
              {props.modal.confirm}
            </div>
          </div>
        </div>
      )}
      <p
        className='Button__close ExpandedTab__close'
        onClick={() => clearModal()}
      >
        X
      </p>
    </div>
  );
};

export default ModalPanel;
