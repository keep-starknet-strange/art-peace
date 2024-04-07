import React, { useState, useEffect } from 'react'
import BasicTab from './BasicTab.js';
import './Voting.css';

const Voting = props => {
  // TODO: Pull from API
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#FFFFFF', '#000000'];
  let colorVotes = [100, 52, 9, 5, 3, 2, 1, 1];
  // TODO: Is this the best way to handle state?
  // TODO: Push to API & only allow one vote per user
  const [votes, setVotes] = useState(colorVotes);
  const [userVote, setUserVote] = useState(-1);
  // TODO: Pull from API
  const timeTillVote = '05:14:23';
  const [time, setTime] = useState(timeTillVote);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(time => {
        let timeSplit = time.split(':');
        let hours = parseInt(timeSplit[0]);
        let minutes = parseInt(timeSplit[1]);
        let seconds = parseInt(timeSplit[2]);
        if (seconds === 0) {
          if (minutes === 0) {
            if (hours === 0) {
              return '00:00:00';
            }
            hours--;
            minutes = 59;
            seconds = 59;
          } else {
            minutes--;
            seconds = 59;
          }
        } else {
          seconds--;
        }
        return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);

  return (
    <BasicTab title="Voting">
      <h2 className="Voting__header">Color Vote</h2>
      <p className="Voting__description">Vote for a new palette color.</p>
      <p className="Voting__description">Vote closes: {time}</p>
      <div className="Voting__colors">
        <div className="Voting__colors__item" style={{marginTop: "1.5rem"}}>
          <div style={{gridArea: "vote"}}>Vote</div>
          <div style={{gridArea: "color"}}>Color</div>
          <div style={{gridArea: "votes"}}>Count</div>
        </div>
        <div style={{height: '55vh', overflow: 'scroll'}}>
        {colors.map((color, index) => (
          <div key={index} className="Voting__colors__item">
            <div className="Voting__colors__item__vote" onClick={() => {
              if (userVote === index) {
                return;
              }
              let newVotes = [...votes];
              if (userVote !== -1) {
                newVotes[userVote]--;
              }
              setUserVote(index);
              newVotes[index]++;
              setVotes(newVotes);
            }}>
              {userVote === index && <div className="Voting__colors__item__vote__selected">X</div>}
            </div>
            <div className="Voting__colors__item__color" style={{backgroundColor: color}}></div>
            <div className="Voting__colors__item__votes">{votes[index]}</div>
          </div>
        ))}
        </div>
      </div>
    </BasicTab>
  );
}

export default Voting;
