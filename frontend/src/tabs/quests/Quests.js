import React, { useState, useEffect } from 'react';
import './Quests.css';
import BasicTab from '../BasicTab.js';
import QuestItem from './QuestItem.js';
import { backendUrl } from '../../utils/Consts.js';

const Quests = (props) => {
  const [todaysQuests, setTodaysQuests] = useState([]);
  const [mainQuests, setMainQuests] = useState([]);

  // TODO: Links in descriptions
  // TODO: remove local quests
  const createArgs = (labels, placeholders, types) => {
    const args = [];
    for (let i = 0; i < labels.length; i++) {
      args.push({
        label: labels[i],
        placeholder: placeholders[i],
        inputType: types[i]
      });
    }
    return args;
  };

  const localDailyQuests = [
    {
      title: 'Place 10 pixels',
      description:
        'Add 10 pixels on the canvas [art/peace theme](https://www.google.com/)',
      reward: '3',
      status: 'completed'
    },
    {
      name: 'Build a template',
      description: 'Create a template for the community to use',
      reward: '3',
      status: 'claim'
    },
    {
      name: 'Deploy a Memecoin',
      description: 'Create an Unruggable memecoin',
      reward: '10',
      status: 'incomplete',
      args: createArgs(['MemeCoin Address'], ['0x1234'], ['address'])
    }
  ];

  const localMainQuests = [
    {
      name: 'Tweet #art/peace',
      description: 'Tweet about art/peace using the hashtag & addr',
      reward: '10',
      status: 'incomplete',
      args: createArgs(
        ['Twitter Handle', 'Address', 'test'],
        ['@test', '0x1234', 'asdioj'],
        ['twitter', 'address', 'text']
      )
    },
    {
      name: 'Place 100 pixels',
      description: 'Add 100 pixels on the canvas',
      reward: '10',
      status: 'completed'
    },
    {
      name: 'Mint art/peace NFT',
      description: 'Mint an NFT using the art/peace theme',
      reward: '5',
      status: 'incomplete'
    }
  ];

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        // Fetching daily quests from backend
        const getTodaysQuestsEndpoint =
          backendUrl + `/get-todays-user-quests?address=${props.queryAddress}`;
        const dailyResponse = await fetch(getTodaysQuestsEndpoint);
        let dailyData = await dailyResponse.json();
        dailyData = dailyData.data;
        if (!dailyData) {
          dailyData = localDailyQuests;
        }
        setTodaysQuests(sortByCompleted(dailyData));

        // Fetching main quests from backend
        const getMainQuestsEndpoint =
          backendUrl + `/get-main-user-quests?address=${props.queryAddress}`;
        const mainResponse = await fetch(getMainQuestsEndpoint);
        let mainData = await mainResponse.json();
        mainData = mainData.data;
        if (!mainData) {
          // TODO: remove this & use []
          mainData = localMainQuests;
        }
        setMainQuests(sortByCompleted(mainData));
      } catch (error) {
        console.error('Failed to fetch quests', error);
      }
    };

    fetchQuests();
  }, []);

  const sortByCompleted = (arr) => {
    // Sort by quest_id & completed; ie quest_id and completed at the end
    if (!arr) return [];
    arr.sort((a, b) => a.questId - b.questId);
    const completed = arr.filter((quest) => quest.completed);
    const incomplete = arr.filter((quest) => !quest.completed);
    return incomplete.concat(completed);
  };

  const markCompleted = (questId) => {
    let questReward = 0;
    const newQuests = todaysQuests.map((quest) => {
      if (quest.questId === questId) {
        questReward = quest.reward;
        return { ...quest, completed: true };
      }
      return quest;
    });
    setTodaysQuests(newQuests);
    props.setExtraPixels(props.extraPixels + questReward);
  };

  return (
    <BasicTab title='Quests' setActiveTab={props.setActiveTab}>
      <div className='Quests'>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 className='Text__large Heading__sub Quests__header'>Dailys</h2>
          <p className='Text__small Quests__timer'>{props.timeLeftInDay}</p>
        </div>
        {todaysQuests.map((quest, index) => (
          <QuestItem
            key={index}
            questId={quest.questId}
            title={quest.name}
            description={quest.description}
            reward={quest.reward}
            status={quest.completed ? 'completed' : 'incomplete'}
            args={quest.args}
            markCompleted={markCompleted}
            address={props.address}
            artPeaceContract={props.artPeaceContract}
          />
        ))}

        <h2 className='Text__large Heading__sub Quests__header'>Main</h2>
        {mainQuests.map((quest, index) => (
          <QuestItem
            key={index}
            questId={quest.questId}
            title={quest.name}
            description={quest.description}
            reward={quest.reward}
            status={quest.completed ? 'completed' : 'incomplete'}
            args={quest.args}
            markCompleted={markCompleted}
            address={props.address}
            artPeaceContract={props.artPeaceContract}
          />
        ))}
      </div>
    </BasicTab>
  );
};

export default Quests;
