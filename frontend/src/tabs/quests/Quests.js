import React from 'react'
import './Quests.css';
import BasicTab from '../BasicTab.js';
import QuestItem from './QuestItem.js';

const Quests = props => {
  // TODO: Main quests should be scrollable
  // TODO: Main quests should be moved to the bottom on complete
  // TODO: Pull quests from backend
  // TODO: Links in descriptions
  const dailyQuests = [
    {
      title: "Place 10 pixels",
      description: "Add 10 pixels on the canvas",
      reward: "3",
      status: "completed"
    },
    {
      title: "Build a template",
      description: "Create a template for the community to use",
      reward: "3",
      status: "claim"
    },
    {
      title: "Deploy a Memecoin",
      description: "Create an Unruggable memecoin",
      reward: "10",
      status: "completed"
    }
  ]

  const mainQuests = [
    {
      title: "Tweet #art/peace",
      description: "Tweet about art/peace using the hashtag & addr",
      reward: "10",
      status: "incomplete"
    },
    {
      title: "Place 100 pixels",
      description: "Add 100 pixels on the canvas",
      reward: "10",
      status: "completed"
    },
    {
      title: "Mint an art/peace NFT",
      description: "Mint an NFT using the art/peace theme",
      reward: "5",
      status: "incomplete"
    }
  ]

  // TODO: Icons for each tab?
  return (
    <BasicTab title="Quests">
      <div style={{height: '70vh', overflowY: 'scroll'}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <h2 className="Quests__item__header">Dailys</h2>
          <p style={{fontSize: "1rem", marginLeft: "1rem"}}>{props.timeLeftInDay}</p>
        </div>
        {dailyQuests.map((quest, index) => (
          <QuestItem key={index} title={quest.title} description={quest.description} reward={quest.reward} status={quest.status} />
        ))}
          
        <h2 className="Quests__item__header">Main</h2>
        {mainQuests.map((quest, index) => (
          <QuestItem key={index} title={quest.title} description={quest.description} reward={quest.reward} status={quest.status} />
        ))}
      </div>
    </BasicTab>
  );
}

export default Quests;
