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
      title: 'Build a template',
      description: 'Create a template for the community to use',
      reward: '3',
      status: 'claim'
    },
    {
      title: 'Deploy a Memecoin',
      description: 'Create an Unruggable memecoin ',
      reward: '10',
      status: 'incomplete',
      args: createArgs(['MemeCoin Address'], ['0x1234'], ['address'])
    }
  ];

  const localMainQuests = [
    {
      title: 'Tweet #art/peace',
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
      title: 'Place 100 pixels',
      description: 'Add 100 pixels on the canvas',
      reward: '10',
      status: 'completed'
    },
    {
      title: 'Mint art/peace NFT',
      description: 'Mint an NFT using the art/peace theme',
      reward: '5',
      status: 'incomplete'
    }
  ];

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        // Fetching daily quests from backend
        const getDailyQuestsEndpoint = backendUrl + '/get-daily-quests';
        const dailyResponse = await fetch(getDailyQuestsEndpoint);
        let dailyData = await dailyResponse.json().data;
        if (!dailyData) {
          dailyData = [];
        }
        dailyData.push(...localDailyQuests);
        setTodaysQuests(sortByCompleted(dailyData));

        // Fetching main quests from backend
        const getMainQuestsEndpoint = backendUrl + '/get-main-quests';
        const mainResponse = await fetch(getMainQuestsEndpoint);
        let mainData = await mainResponse.json().data;
        if (!mainData) {
          mainData = [];
        }
        mainData.push(...localMainQuests);
        setMainQuests(sortByCompleted(mainData));
      } catch (error) {
        console.error('Failed to fetch quests', error);
      }
    };

    fetchQuests();
  }, []);

  const sortByCompleted = (arr) => {
    if (!arr) return [];
    const newArray = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].status == 'completed') {
        newArray.push(arr[i]);
      } else {
        newArray.unshift(arr[i]);
      }
    }
    return newArray;
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
            title={quest.title}
            description={quest.description}
            reward={quest.reward}
            status={quest.status}
            args={quest.args}
          />
        ))}

        <h2 className='Text__large Heading__sub Quests__header'>Main</h2>
        {mainQuests.map((quest, index) => (
          <QuestItem
            key={index}
            title={quest.title}
            description={quest.description}
            reward={quest.reward}
            status={quest.status}
            args={quest.args}
          />
        ))}
      </div>
    </BasicTab>
  );
};

export default Quests;
