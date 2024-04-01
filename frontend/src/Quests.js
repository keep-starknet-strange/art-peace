import React from 'react'
import './Quests.css';

const Quests = props => {
  return (
    <div className="Quests">
      <h1 className="Quests__item__title">Quests</h1>
      <h2 className="Quests__item__header">Dailys</h2>
        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title"></p>
          <div className="Quests__item__quest__reward__title">Reward</div>
          <div className="Quests__item__quest__progress__title">Progress</div>
        </div>

        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title">Place 10 pixels</p>
          <div className="Quests__item__quest__reward">+3px</div>
          <div className="Quests__item__quest__progress Quests__item__quest__progress--completed"></div>
        </div>

        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title">Build a template</p>
          <div className="Quests__item__quest__reward">+3px</div>
          <div className="Quests__item__quest__progress Quests__item__quest__progress--claim"></div>
        </div>

        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title">Deploy an Unruggable</p>
          <div className="Quests__item__quest__reward">+10px</div>
          <div className="Quests__item__quest__progress Quests__item__quest__progress--completed"></div>
        </div>

      <h2 className="Quests__item__header">Main</h2>
        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title">Tweet about #art/peace</p>
          <div className="Quests__item__quest__reward">+10px</div>
          <div className="Quests__item__quest__progress Quests__item__quest__progress--incomplete"></div>
        </div>

        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title">Place 100 pixels</p>
          <div className="Quests__item__quest__reward">+10px</div>
          <div className="Quests__item__quest__progress Quests__item__quest__progress--completed"></div>
        </div>

        <div className="Quests__item__quest">
          <p className="Quests__item__quest__title">Mint an art/peace NFT</p>
          <div className="Quests__item__quest__reward">+5px</div>
          <div className="Quests__item__quest__progress Quests__item__quest__progress--incomplete"></div>
        </div>
    </div>
  );
}

export default Quests;
