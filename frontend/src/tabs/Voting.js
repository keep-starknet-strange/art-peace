import React, { useState} from 'react'
import BasicTab from './BasicTab.js';
import './Voting.css';

const Voting = props => {

  // TODO: Push to API & only allow one vote per user
  const [userVote, setUserVote] = useState(-1);

  return (
    <BasicTab title="Voting">
      <h2 className="Voting__header">Color Vote</h2>
      <p className="Voting__description">Vote for a new palette color.</p>
      <p className="Voting__description">Vote closes: {props.timeLeftInDay}</p>
      <div className="Voting__colors">
        <div className="Voting__colors__item" style={{marginTop: "1.5rem"}}>
          <div style={{gridArea: "vote"}}>Vote</div>
          <div style={{gridArea: "color"}}>Color</div>
          <div style={{gridArea: "votes"}}>Count</div>
        </div>
        <div style={{height: '41vh', overflow: 'scroll'}}>
        {props.colorApiState.data && props.colorApiState.data.length ? props.colorApiState.data.map((color, index) => (
          <div key={index} className="Voting__colors__item">
            <div className="Voting__colors__item__vote" onClick={() => {
              if (userVote === index) {
                return;
              }
              setUserVote(index);
            }}>
              {userVote === index && <div className="Voting__colors__item__vote__selected">X</div>}
            </div>
            <div className="Voting__colors__item__color" style={{backgroundColor: color.hex}}></div>
            <div className="Voting__colors__item__votes">{color.votes}</div>
          </div>
        )):
        <div style={{padding:"14px", textAlign:"center"}}>No Color Added Yet</div>
        }
        </div>
      </div>
    </BasicTab>
  );
}

export default Voting;
