import React, { useEffect, useState } from 'react';
import './FactionSelector.css';
import _Info from '../../resources/icons/Info.png';
import _Template from '../../resources/icons/Template.png';

const FactionSelector = (props) => {
  //const selectFaction = () => {
  //  props.setSelectedFaction(props.id);
  //};

  const selectFaction = (e) => {
    // Ensure the user isn't clicking a hyperlink
    if (e.target.classList.contains('FactionSelector__link__icon')) {
      return;
    }
    props.selectFaction(props, props.isChain);
  };

  const [canJoin, setCanJoin] = useState(true);
  useEffect(() => {
    if (props.queryAddress === '0' || props.gameEnded) {
      setCanJoin(false);
      return;
    }
    if (props.isMember || !props.joinable) {
      setCanJoin(false);
      return;
    }
    if (props.isChain && props.userInChainFaction) {
      setCanJoin(false);
      return;
    }
    if (!props.isChain && props.userInFaction) {
      setCanJoin(false);
      return;
    }
    setCanJoin(true);
  }, [props]);

  return (
    <div className='FactionSelector__container' onClick={selectFaction}>
      <div className='FactionSelector__main'>
        <div className='FactionSelector__inner'>
          <img
            src={props.icon}
            alt={props.name}
            className='FactionSelector__icon'
          />
          <div className='FactionSelector__info'>
            <h2 className='Text__large FactionSelector__name'>{props.name}</h2>
            <p className='Text__xsmall FactionSelector__description'>
              {props.pixels > 0 ? `+${props.pixels}px | ` : ''}
              {props.members} members
            </p>
            <div className='FactionSelector__info__links'>
              {canJoin && (
                <div
                  className={`Text__xsmall Button__primary FactionItem__header__button`}
                  style={{ borderRadius: '2rem' }}
                  onClick={() => {
                    // Make the user confirm they can only join one faction
                    if (props.isChain) {
                      props.setModal({
                        title: 'Join Chain Faction',
                        text: `You can only join one Chain Faction.\nAre you sure you want to join the ${props.name} Faction`,
                        confirm: 'Join',
                        action: () => {
                          props.joinChain(props.factionId);
                        }
                      });
                      return;
                    } else {
                      props.setModal({
                        title: 'Join Faction',
                        text: `You can only join one Faction.\nAre you sure you want to join the ${props.name} Faction`,
                        confirm: 'Join',
                        action: () => {
                          props.joinFaction(props.factionId);
                        }
                      });
                      return;
                    }
                  }}
                >
                  <p style={{ padding: '0.5rem 0', margin: '0' }}>Join</p>
                </div>
              )}
              {props.telegram && (
                <a
                  className='FactionSelector__link'
                  href={props.telegram}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg'
                    alt='Telegram'
                    className='FactionSelector__link__icon'
                  />
                </a>
              )}
              {props.twitter && (
                <a
                  className='FactionSelector__link'
                  href={props.twitter}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/c/cc/X_icon.svg'
                    alt='X'
                    className='FactionSelector__link__icon'
                  />
                </a>
              )}
              {props.github && (
                <a
                  className='FactionSelector__link'
                  href={props.github}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg'
                    alt='Github'
                    className='FactionSelector__link__icon'
                  />
                </a>
              )}
              {props.site && (
                <a
                  className='FactionSelector__link'
                  style={{ border: '1px solid rgba(0, 0, 0, 0.5)' }}
                  href={props.site}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/5/58/Echo_link-blue_icon_slanted.svg'
                    alt='Hyperlink'
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '50%',
                      padding: '0.2rem'
                    }}
                    className='FactionSelector__link__icon'
                  />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactionSelector;
