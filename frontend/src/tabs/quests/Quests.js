import React, { useState, useEffect } from "react";
import "./Quests.css";
import BasicTab from "../BasicTab.js";
import QuestItem from "./QuestItem.js";

const Quests = (props) => {
  const [dailyQuests, setDailyQuests] = useState([]);
  const [mainQuests, setMainQuests] = useState([]);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        // Fetching daily quests from backend
        const dailyResponse = await fetch('http://localhost:8080/getDailyQuests');
        const dailyData = await dailyResponse.json();
        setDailyQuests(dailyData);

        // Fetching main quests from backend
        const mainResponse = await fetch('http://localhost:8080/getMainQuests');
        const mainData = await mainResponse.json();
        setMainQuests(mainData);
      } catch (error) {
        console.error('Failed to fetch quests', error);
      }
    };

    fetchQuests();
  }, []);
  // TODO: Main quests should be scrollable
  // TODO: Main quests should be moved to the bottom on complete
  // TODO: Pull quests from backend
  // TODO: Links in descriptions



  const localDailyQuests = [
    {
      title: "Place 10 pixels",
      description: "Add 10 pixels on the canvas",
      reward: "3",
      status: "completed",
    },
    {
      title: "Build a template",
      description: "Create a template for the community to use",
      reward: "3",
      status: "claim",
    },
    {
      title: "Deploy a Memecoin",
      description: "Create an Unruggable memecoin",
      reward: "10",
      status: "completed",
    },
  ];

  const localMainQuests = [
    {
      title: "Tweet #art/peace",
      description: "Tweet about art/peace using the hashtag & addr",
      reward: "10",
      status: "incomplete",
    },
    {
      title: "Place 100 pixels",
      description: "Add 100 pixels on the canvas",
      reward: "10",
      status: "completed",
    },
    {
      title: "Mint an art/peace NFT",
      description: "Mint an NFT using the art/peace theme",
      reward: "5",
      status: "incomplete",
    },
  ];

  const sortByCompleted = (arr) => {
    if (!arr) return [];
    const newArray = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].status == "completed") {
        newArray.push(arr[i]);
      } else {
        newArray.unshift(arr[i]);
      }
    }
    return newArray;
  };

  // TODO: Icons for each tab?
  return (
    <BasicTab title="Quests">
      <div style={{ height: "70vh", overflowY: "scroll" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 className="Quests__item__header">Dailys</h2>
          <p style={{ fontSize: "1rem", marginLeft: "1rem" }}>XX:XX:XX</p>
        </div>
        {sortByCompleted(dailyQuests).map((quest, index) => (
          <QuestItem
            key={index}
            title={quest.title}
            description={quest.description}
            reward={quest.reward}
            status={quest.status}
          />
        ))}
        {sortByCompleted(localDailyQuests).map((quest, index) => (
          <QuestItem
            key={index}
            title={quest.title}
            description={quest.description}
            reward={quest.reward}
            status={quest.status}
          />
        ))}

        <h2 className="Quests__item__header">Main</h2>
        {sortByCompleted(mainQuests).map((quest, index) => (
          <QuestItem
            key={index}
            title={quest.title}
            description={quest.description}
            reward={quest.reward}
            status={quest.status}
          />
        ))}
        {sortByCompleted(localMainQuests).map((quest, index) => (
          <QuestItem
            key={index}
            title={quest.title}
            description={quest.description}
            reward={quest.reward}
            status={quest.status}
          />
        ))}
      </div>
    </BasicTab>
  );
};

export default Quests;
