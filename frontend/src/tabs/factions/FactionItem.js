import React, { useState, useEffect } from 'react';
import './FactionItem.css';

const FactionItem = (props) => {
  const baseMessages = [
    {
      id: 1,
      sender: 'user',
      text: 'Hello, how can I help you?'
    },
    {
      id: 2,
      sender: '0x0000000000000000000000000000000000000000',
      text: 'Hello, I am a bot. How can I help you?'
    },
    {
      id: 3,
      sender: 'user',
      text: 'I have a question about the faction.'
    },
    {
      id: 4,
      sender: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      text: 'Sure, what is your question?'
    }
  ];

  // TODO: load address from context
  const address = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  const [messages, setMessages] = useState(baseMessages);
  const [message, setMessage] = useState('');
  // TODO: Allow faction owner to delete and pin messages
  // TODO: Allow users to react to messages & reply to messages

  const sendMessage = () => {
    setMessages([
      ...messages,
      {
        id: messages.length + 1, // TODO
        sender: address,
        text: message
      }
    ]);
    setMessage('');
  };

  // TODO: Faction owner tabs: members, allocations, ...
  const factionsSubTabs = ['chat', 'templates'];
  const [activeTab, setActiveTab] = useState(factionsSubTabs[0]);

  // TODO: Templates from old templates tab

  // TODO: Auto-scroll to bottom of messages if at bottom and new message is added
  useEffect(() => {
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;
  }, []);

  // TODO: Faction subheading w/ links to factions: telegram, twitter, discord, ...
  return (
    <div className='FactionItem'>
      <div className='FactionItem__heading'>
        <div className='FactionItem__icon'>
          <img src={props.icon} alt={props.name} width='40' height='40' />
        </div>
        <h2 className='Text__medium FactionItem__title'>{props.name}</h2>
      </div>
      <div className='FactionItem__subheading'>
        <div className='FactionItem__links'>
          <div className='FactionItem__link'>
            <img
              src='https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg'
              alt='Telegram'
              width='30'
              height='30'
            />
          </div>
          <div className='FactionItem__link'>
            <img
              src='https://upload.wikimedia.org/wikipedia/commons/5/51/Twitter_logo.svg'
              alt='Twitter'
              width='30'
              height='30'
            />
          </div>
          <div className='FactionItem__link'>
            <img
              src='https://upload.wikimedia.org/wikipedia/commons/6/6b/Font_Awesome_5_brands_discord_color.svg'
              alt='Discord'
              width='30'
              height='30'
            />
          </div>
          <div className='FactionItem__link'>
            <img
              src='https://upload.wikimedia.org/wikipedia/commons/9/91/Font_Awesome_5_solid_link.svg'
              alt='Custom Link'
              width='30'
              height='30'
            />
          </div>
        </div>
        <div className='FactionItem__tabs'>
          {factionsSubTabs.map((tab) => (
            <div
              key={tab}
              className='Text__small Button__primary'
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>
      <div className='FactionItem__content'>
        {activeTab === 'chat' && (
          <div className='FactionItem__chat'>
            <div className='FactionItem__messages' id='messages'>
              {messages.map((message) => (
                <div key={message.id} className='FactionItem__message'>
                  <p className='Text__xsmall FactionItem__message__sender'>
                    {message.sender}
                  </p>
                  <p className='Text__small FactionItem__message__text'>
                    {message.text}
                  </p>
                </div>
              ))}
            </div>
            <div className='FactionItem__messager'>
              <input
                type='text'
                placeholder='Type a message...'
                className='Text__small Input__primary FactionItem__chat__input'
                value={message}
                required
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                className='Text__small Button__primary FactionItem__chat__button'
                onClick={() => sendMessage()}
              >
                Send
              </button>
            </div>
          </div>
        )}
        {activeTab === 'templates' && (
          <div className='FactionItem__templates'>
            <div className='FactionItem__template'>
              <h3 className='Text__small'>Template 1</h3>
              <p className='Text__small'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                eget dui ac libero varius ultricies. Donec euismod, nunc nec
                tincidunt facilisis, felis turpis.
              </p>
            </div>
            <div className='FactionItem__template'>
              <h3 className='Text__small'>Template 2</h3>
              <p className='Text__small'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                eget dui ac libero varius ultricies. Donec euismod, nunc nec
                tincidunt facilisis, felis turpis.
              </p>
            </div>
          </div>
        )}
      </div>
      <p
        className='Button__close FactionItem__close'
        onClick={() => props.clearFactionSelection()}
      >
        X
      </p>
    </div>
  );
};

export default FactionItem;
