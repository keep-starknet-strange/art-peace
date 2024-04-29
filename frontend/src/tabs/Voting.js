import React, { useState, useEffect } from 'react'
import BasicTab from './BasicTab.js';
import { getVotableColors } from "../services/apiService.js"
import './Voting.css';

const Voting = props => {

  // TODO: Push to API & only allow one vote per user
  const [userVote, setUserVote] = useState(-1);

  // VotableColor API
  const [votableColorApiState, setVotableColorApiState] = useState({
    loading:null,
    error:"",
    data:null
  })
  useEffect(() => {
    const fetchVotableColoers = async () => {
      try {
        setVotableColorApiState(prevState => ({ ...prevState, loading: true }));
        const result = await getVotableColors()
        // Sort by votes
        result.sort((a, b) => b.votes - a.votes);
        setVotableColorApiState(prevState => ({ ...prevState, data: result, loading:false }));
      } catch (error) {
        // Handle or log the error as needed
        setVotableColorApiState(prevState => ({ ...prevState, error, loading:false }));
        console.error('Error fetching votable colors:', error);
      }
    };
    fetchVotableColoers();
  }, []);

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
        {votableColorApiState.data && votableColorApiState.data.length ? votableColorApiState.data.map((color, index) => (
          <div key={index} className="Voting__colors__item">
            <div className="Voting__colors__item__vote" onClick={() => {
              if (userVote === index) {
                return;
              }
              setUserVote(index);
            }}>
              {userVote === index && <div className="Voting__colors__item__vote__selected">X</div>}
            </div>
            <div className="Voting__colors__item__color" style={{backgroundColor: `#${color.hex}FF`}}></div>
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
