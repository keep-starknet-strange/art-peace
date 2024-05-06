import React from 'react';
import './TemplateBuilderPanel.css';
import { backendUrl } from '../utils/Consts.js';
import { fetchWrapper } from '../services/apiService.js';

const TemplateBuilderPanel = (props) => {
  const [templateName, setTemplateName] = React.useState('');
  const [templateReward, setTemplateReward] = React.useState('');
  const [templateRewardToken, setTemplateRewardToken] = React.useState('');

  const createTemplate = (name, reward, rewardToken) => {
    let addTemplateEndpoint = backendUrl + '/add-template-devnet';
    let template = new Image();
    template.src = props.templateImage;
    template.onload = async function () {
      let templateWidth = this.width;
      let templateHeight = this.height;
      let addTemplateDataEndpoint = 'add-template-data';
      const response = await fetchWrapper(addTemplateDataEndpoint, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
          width: templateWidth.toString(),
          height: templateHeight.toString(),
          image: props.templateColorIds.toString()
        })
      });
      if (!response.result) {
        return;
      }

      let templateHash = response.result;
      const response2 = await fetchWrapper(addTemplateEndpoint, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
          name: name,
          position: props.templateImagePosition.toString(),
          width: templateWidth.toString(),
          height: templateHeight.toString(),
          hash: templateHash,
          reward: reward,
          rewardToken: rewardToken
        })
      });

      if (!response2.result) {
        return;
      }
      console.log('Template created:', response.result);
    };
  };

  return (
    <div className='TemplateBuilderPanel'>
      <p
        className='TemplateBuilderPanel__exit'
        onClick={() => props.setTemplateCreationMode(false)}
      >
        X
      </p>
      <h2 className='TemplateBuilderPanel__title'>Template Builder</h2>
      <div className='TemplateBuilderPanel__form'>
        <div className='TemplateBuilderPanel__row'>
          <label className='TemplateBuilderPanel__label'>Name</label>
          <input
            className='TemplateBuilderPanel__input'
            type='text'
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        <div className='TemplateBuilderPanel__row'>
          <label className='TemplateBuilderPanel__label'>Reward</label>
          <input
            className='TemplateBuilderPanel__input'
            type='text'
            value={templateReward}
            onChange={(e) => setTemplateReward(e.target.value)}
            placeholder='Optional'
          />
        </div>

        <div className='TemplateBuilderPanel__row'>
          <label className='TemplateBuilderPanel__label'>Reward Token</label>
          <input
            className='TemplateBuilderPanel__input'
            type='text'
            value={templateRewardToken}
            onChange={(e) => setTemplateRewardToken(e.target.value)}
            placeholder='Optional'
          />
        </div>

        <button
          className='TemplateBuilderPanel__button'
          onClick={() =>
            createTemplate(templateName, templateReward, templateRewardToken)
          }
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default TemplateBuilderPanel;
