import React from 'react';
import './TemplateBuilderPanel.css';
import backendConfig from "../configs/backend.config.json"

const TemplateBuilderPanel = props => {
  const [templateName, setTemplateName] = React.useState('');
  const [templateReward, setTemplateReward] = React.useState('');
  const [templateRewardToken, setTemplateRewardToken] = React.useState('');

  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port

  const createTemplate = (name, reward, rewardToken) => {
    // TODO: Name off chain?
    console.log('Creating template with name:', name, 'reward:', reward, 'rewardToken:', rewardToken);
    let addTemplateEndpoint = backendUrl + "/add-template-devnet"
    let template = new Image()
    template.src = props.templateImage
    template.onload = function() {
      let templateWidth = this.width
      let templateHeight = this.height
      let addTemplateDataEndpoint = backendUrl + "/add-template-data"
      fetch(addTemplateDataEndpoint, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
          width: templateWidth.toString(),
          height: templateHeight.toString(),
          image: props.templateColorIds.toString()
        })
      }).then(response => {
        return response.text()
      }).then(data => {
        // Load template hash from response
        let templateHash = data

        fetch(addTemplateEndpoint, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({
            name: name,
            position: props.templateImagePosition.toString(),
            width: templateWidth.toString(),
            height: templateHeight.toString(),
            hash: templateHash,
            reward: reward,
            rewardToken: rewardToken,
          })
        }).then(response => {
          return response.text()
        }).then(data => {
          console.log('Template created:', data)
        }).catch(error => {
          console.error('Error creating template:', error)
        });
      }).catch(error => {
        console.error('Error creating template data:', error)
      });
    }
  }

  return (
    <div className="TemplateBuilderPanel">
      <p className="TemplateBuilderPanel__exit" onClick={() => props.setTemplateCreationMode(false)}>X</p>
      <h2 className="TemplateBuilderPanel__title">Template Builder</h2>
      <div className="TemplateBuilderPanel__form">
        <div className="TemplateBuilderPanel__row">
          <label className="TemplateBuilderPanel__label">Name</label>
          <input className="TemplateBuilderPanel__input" type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} />
        </div>

        <div className="TemplateBuilderPanel__row">
          <label className="TemplateBuilderPanel__label">Reward</label>
          <input className="TemplateBuilderPanel__input" type="text" value={templateReward} onChange={e => setTemplateReward(e.target.value)} placeholder="Optional" />
        </div>

        <div className="TemplateBuilderPanel__row">
          <label className="TemplateBuilderPanel__label">Reward Token</label>
          <input className="TemplateBuilderPanel__input" type="text" value={templateRewardToken} onChange={e => setTemplateRewardToken(e.target.value)} placeholder="Optional" />
        </div>

        <button className="TemplateBuilderPanel__button" onClick={() => createTemplate(templateName, templateReward, templateRewardToken)}>Create</button>
      </div>
    </div>
  );
}

export default TemplateBuilderPanel;
