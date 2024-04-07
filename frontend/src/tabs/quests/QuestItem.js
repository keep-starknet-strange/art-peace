import React from 'react'
import './QuestItem.css';

const QuestItem = props => {
  return (
    <div className="QuestItem">
      <div className="QuestItem__info">
        <p className="QuestItem__title">{props.title}</p>
        <p className="QuestItem__description">{props.description}</p>
      </div>
      <div className="QuestItem__progress">
        <div className={`QuestItem__progression QuestItem__progression--${props.status}`}></div>
        <div className="QuestItem__reward">+{props.reward}px</div>
      </div>
    </div>
  );
}

export default QuestItem;
