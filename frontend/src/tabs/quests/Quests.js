// TODO: Quests history
import React, { useState, useEffect } from 'react';
import './Quests.css';
import BasicTab from '../BasicTab.js';
import QuestItem from './QuestItem.js';
import { backendUrl } from '../../utils/Consts.js';

const Quests = (props) => {
  const [todaysQuests, setTodaysQuests] = useState([]);
  const [mainQuests, setMainQuests] = useState([]);

  const [todaysQuestsInfo, setTodaysQuestsInfo] = useState([]);
  const [mainQuestsInfo, setMainQuestsInfo] = useState([]);
  const [todaysQuestsStatus, setTodaysQuestsStatus] = useState([]);
  const [mainQuestsStatus, setMainQuestsStatus] = useState([]);

  useEffect(() => {
    // Combine quests with their status on questId
    const combineQuests = (quests, status) => {
      if (!quests || !status) return [];
      return quests.map((quest) => {
        const questStatus = status.find(
          (status) => status.questId === quest.questId
        );
        if (!questStatus) return quest;
        return { ...quest, ...questStatus };
      });
    };

    setTodaysQuests(combineQuests(todaysQuestsInfo, todaysQuestsStatus));
    setMainQuests(combineQuests(mainQuestsInfo, mainQuestsStatus));
  }, [todaysQuestsInfo, mainQuestsInfo, todaysQuestsStatus, mainQuestsStatus]);

  const _createArgs = (labels, placeholders, types) => {
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
          dailyData = [];
        }
        setTodaysQuestsInfo(sortByCompleted(dailyData));

        // Fetching main quests from backend
        const getMainQuestsEndpoint =
          backendUrl + `/get-main-user-quests?address=${props.queryAddress}`;
        const mainResponse = await fetch(getMainQuestsEndpoint);
        let mainData = await mainResponse.json();
        mainData = mainData.data;
        if (!mainData) {
          mainData = [];
        }
        setMainQuestsInfo(sortByCompleted(mainData));
      } catch (error) {
        console.error('Failed to fetch quests', error);
      }
    };

    const fetchQuestsStatus = async () => {
      try {
        // Fetching daily quests from backend
        const getTodaysQuestsEndpoint =
          backendUrl +
          `/get-today-quest-progress?address=${props.queryAddress}`;
        const dailyResponse = await fetch(getTodaysQuestsEndpoint);
        let dailyData = await dailyResponse.json();
        dailyData = dailyData.data;
        if (dailyData) {
          setTodaysQuestsStatus(dailyData);
        }

        // Fetching main quests from backend
        const getMainQuestsEndpoint =
          backendUrl + `/get-main-quest-progress?address=${props.queryAddress}`;
        const mainResponse = await fetch(getMainQuestsEndpoint);
        let mainData = await mainResponse.json();
        mainData = mainData.data;
        if (mainData) {
          setMainQuestsStatus(mainData);
        }
      } catch (error) {
        console.error('Failed to fetch quests', error);
      }
    };

    fetchQuests();
    fetchQuestsStatus();
  }, []);

  const sortByCompleted = (arr) => {
    // Sort by quest_id & completed; ie quest_id and completed at the end
    if (!arr) return [];
    arr.sort((a, b) => a.questId - b.questId);
    const completed = arr.filter((quest) => quest.completed);
    const incomplete = arr.filter((quest) => !quest.completed);
    return incomplete.concat(completed);
  };

  const markCompleted = (questId, questType) => {
    let questReward = 0;
    if (questType === 'daily') {
      const newQuests = todaysQuestsInfo.map((quest) => {
        if (quest.questId === questId) {
          questReward = quest.reward;
          return { ...quest, completed: true };
        }
        return quest;
      });
      setTodaysQuestsInfo(newQuests);
    } else {
      const newQuests = mainQuestsInfo.map((quest) => {
        if (quest.questId === questId) {
          questReward = quest.reward;
          return { ...quest, completed: true };
        }
        return quest;
      });
      setMainQuestsInfo(newQuests);
    }
    props.setExtraPixels(props.extraPixels + questReward);
  };

  return (
    <BasicTab title='Quests' setActiveTab={props.setActiveTab}>
      <div className='Quests'>
        {props.queryAddress === '0' && (
          <p className='Text__medium Quests__nowallet'>
            Please login with your wallet to view your quests.
          </p>
        )}
        <div
          style={{
            display: `${todaysQuests.length === 0 ? 'none' : 'flex'}`,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: '1rem'
          }}
        >
          <h2 className='Text__large Heading__sub Quests__header'>Todays</h2>
          <p
            className={`Text__small Quests__timer ${props.newDayAvailable ? 'Quests__timer--active' : ''}`}
            onClick={() => props.startNextDay()}
          >
            {props.timeLeftInDay}
          </p>
        </div>
        {todaysQuests.map((quest, index) => (
          <QuestItem
            key={index}
            queryAddress={props.queryAddress}
            questId={quest.questId}
            title={quest.name}
            description={quest.description}
            reward={quest.reward}
            status={quest.completed ? 'completed' : 'incomplete'}
            args={quest.args}
            markCompleted={markCompleted}
            address={props.address}
            artPeaceContract={props.artPeaceContract}
            progress={quest.progress}
            needed={quest.needed}
            calldata={quest.calldata}
            claimParams={quest.claimParams}
            type='daily'
            gameEnded={props.gameEnded}
          />
        ))}

        <h2 className='Text__large Heading__sub Quests__header'>Main</h2>
        {mainQuests.map((quest, index) => (
          <QuestItem
            key={index}
            queryAddress={props.queryAddress}
            questId={quest.questId}
            title={quest.name}
            description={quest.description}
            reward={quest.reward}
            status={quest.completed ? 'completed' : 'incomplete'}
            args={quest.args}
            markCompleted={markCompleted}
            address={props.address}
            artPeaceContract={props.artPeaceContract}
            progress={quest.progress}
            needed={quest.needed}
            calldata={quest.calldata}
            claimParams={quest.claimParams}
            type='main'
            gameEnded={props.gameEnded}
          />
        ))}
      </div>
    </BasicTab>
  );
};

export default Quests;
