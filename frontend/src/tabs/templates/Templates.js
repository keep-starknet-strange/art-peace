import React, { useRef, useState } from 'react';
import './Templates.css';
import EventItem from './EventItem.js';
import TemplateItem from './TemplateItem.js';
import ExpandableTab from '../ExpandableTab.js';
import { backendUrl } from '../../utils/Consts.js';
import { fetchWrapper } from '../../services/apiService.js';

const TemplatesMainSection = (props) => {
  // Each color represented as 'RRGGBB'
  const imageURL = backendUrl + '/templates/';

  const imageToPalette = (image) => {
    // Convert image pixels to be within the color palette

    // Get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;

    let imagePalleteIds = [];
    // Convert image data to color palette
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
        imagePalleteIds.push(255);
        continue;
      }
      let minDistance = 1000000;
      let minColor = props.colors[0];
      let minColorIndex = 0;
      for (let j = 0; j < props.colors.length; j++) {
        const color = props.colors[j]
          .match(/[A-Za-z0-9]{2}/g)
          .map((x) => parseInt(x, 16));
        const distance = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          minColor = color;
          minColorIndex = j;
        }
      }
      data[i] = minColor[0];
      data[i + 1] = minColor[1];
      data[i + 2] = minColor[2];
      imagePalleteIds.push(minColorIndex);
    }

    // Set image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    return [canvas.toDataURL(), imagePalleteIds];
  };

  const uploadTemplate = () => {
    // Open file upload dialog
    props.inputFile.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file === undefined) {
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      var image = new Image();
      image.src = e.target.result;

      image.onload = function () {
        var height = this.height;
        var width = this.width;
        if (height < 5 || width < 5) {
          alert(
            'Image is too small, minimum size is 5x5. Given size is ' +
              width +
              'x' +
              height
          );
          return;
        }
        if (height > 64 || width > 64) {
          alert(
            'Image is too large, maximum size is 64x64. Given size is ' +
              width +
              'x' +
              height
          );
          return;
        }
        const [paletteImage, colorIds] = imageToPalette(image);
        // TODO: Upload to backend and get template hash back
        props.setTemplateImage(paletteImage);
        props.setTemplateColorIds(colorIds);
        props.setTemplateCreationMode(true);
      };
    };
  };

  return (
    <div className='Templates__main'>
      <div className='Templates__header'>
        <h2 className='Templates__heading'>For you</h2>
        <input
          type='file'
          id='file'
          accept='.png'
          ref={props.inputFile}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div className='Templates__create' onClick={uploadTemplate}>
          Create
        </div>
      </div>
      <div className='Templates__container'>
        <h3 className='Templates__subheading'>Events</h3>
        {props.eventTemplates.map((template, index) => {
          return <EventItem key={index} template={template} />;
        })}
        {props.availableTemplates.map((template, index) => {
          let formattedhash = template.hash.replace('0x0', '0x');
          template.image = imageURL + 'template-' + formattedhash + '.png';
          return <TemplateItem key={index} template={template} />;
        })}
        <h3 className='Templates__subheading'>Mine</h3>
        {props.myTemplates.map((template, index) => {
          return <TemplateItem key={index} template={template} />;
        })}
        <h3 className='Templates__subheading'>Subscribed</h3>
        {props.subscribedTemplates.map((template, index) => {
          return <TemplateItem key={index} template={template} />;
        })}
      </div>
    </div>
  );
};

const TemplatesExpandedSection = (props) => {
  return (
    <div className='Templates__all'>
      <div className='Templates__header'>
        <h2 className='Templates__heading'>All Templates</h2>
      </div>
      <div className='Templates__all__grid'>
        {props.allTemplates.map((template, index) => {
          return <TemplateItem key={index} template={template} />;
        })}
      </div>
    </div>
  );
};

const Templates = (props) => {
  const endTime = (minutes) => {
    const now = Date.now();
    const endTime = new Date(now + minutes * 60000);
    return endTime;
  };

  const eventTemplates = [
    {
      name: 'Event Template 1',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 20,
      width: 20,
      height: 20,
      end_time: endTime(10),
      position: 0,
      reward: 100,
      reward_token: 'ETH'
    },
    {
      name: 'Event Template 2',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 12,
      width: 25,
      height: 20,
      end_time: endTime(13),
      position: 47,
      reward: 100,
      reward_token: 'STRK'
    },
    {
      name: 'Event Template 3',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 15,
      width: 20,
      height: 20,
      end_time: endTime(15),
      position: 0,
      reward: 0.01,
      reward_token: 'ETH'
    },
    {
      name: 'Event Template 4',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 10,
      width: 20,
      height: 20,
      end_time: endTime(20),
      position: 0
    }
  ];

  const myTemplates = [
    {
      name: 'My Template 1',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 20,
      width: 20,
      height: 20,
      position: 25,
      likes: 10,
      reward: 100,
      reward_token: 'ETH'
    },
    {
      name: 'My Template With long name 2',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 12,
      width: 25,
      height: 20,
      position: 47,
      likes: 20,
      reward: 0.000003,
      reward_token: 'ETH'
    },
    {
      name: 'My Template 3',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 15,
      width: 20,
      height: 20,
      position: 0,
      likes: 5,
      reward: 200,
      reward_token: 'STRK'
    },
    {
      name: 'My Template 4',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 10,
      width: 20,
      height: 20,
      position: 47,
      likes: 15,
      reward: 100,
      reward_token: 'STRK'
    }
  ];

  const subscribedTemplates = [
    {
      name: 'Subscribed Template 1',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 20,
      width: 20,
      height: 20,
      position: 0,
      likes: 12,
      creator: 'hello.stark',
      reward: 100,
      reward_token: 'ETH'
    },
    {
      name: 'Subscribed Template 2',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 12,
      width: 25,
      height: 20,
      position: 47,
      likes: 15,
      creator: '0x000000000000000000000000',
      reward: 200,
      reward_token: 'STRK'
    },
    {
      name: 'Subscribed Template 3',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 15,
      width: 20,
      height: 20,
      position: 0,
      likes: 20,
      creator: 'good.stark'
    },
    {
      name: 'Subscribed Template 4',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 10,
      width: 20,
      height: 20,
      position: 47,
      likes: 25,
      creator: 'Me'
    }
  ];

  const allTemplates = [
    {
      name: 'All Template 1',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 20,
      width: 20,
      height: 20,
      position: 0,
      likes: 12,
      creator: 'hello.stark',
      reward: 100,
      reward_token: 'STRK'
    },
    {
      name: 'All Template 2',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 12,
      width: 25,
      height: 20,
      position: 47,
      likes: 15,
      creator: '0x00000000000000000000000',
      reward: 100,
      reward_token: 'STRK'
    },
    {
      name: 'All Template 3',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 15,
      width: 20,
      height: 20,
      position: 0,
      likes: 20,
      creator: 'good.stark',
      reward: 100,
      reward_token: 'STRK'
    },
    {
      name: 'All Template 4',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 10,
      width: 20,
      height: 20,
      position: 47,
      likes: 25,
      creator: 'Me',
      reward: 0.00002100023,
      reward_token: 'ETH'
    },
    {
      name: 'All Template 5',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 20,
      width: 20,
      height: 20,
      position: 0,
      likes: 12,
      creator: 'hello.stark'
    },
    {
      name: 'All Template 6',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 12,
      width: 25,
      height: 20,
      position: 47,
      likes: 15,
      creator: 'You'
    },
    {
      name: 'All Template 7',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 15,
      width: 20,
      height: 20,
      position: 0,
      likes: 20,
      creator: 'good.stark'
    },
    {
      name: 'All Template 8',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 10,
      width: 20,
      height: 20,
      position: 47,
      likes: 25,
      creator: 'Me'
    },
    {
      name: 'All Template 9',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 20,
      width: 20,
      height: 20,
      position: 0,
      likes: 12,
      creator: 'hello.stark'
    },
    {
      name: 'All Template 10',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      users: 12,
      width: 25,
      height: 20,
      position: 47,
      likes: 15,
      creator: ';kjhdflakj'
    }
  ];

  const [setup, setSetup] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const inputFile = useRef();

  React.useEffect(() => {
    if (!setup) {
      setSetup(true);
    } else {
      return;
    }

    let getTemplatesEndpoint = 'get-templates';
    async function getTemplates() {
      const response = await fetchWrapper(getTemplatesEndpoint, {
        mode: 'cors'
      });
      if (response.data === null) {
        response.data = [];
      }
      setAvailableTemplates(response.data);
    }

    getTemplates();
  }, [setup, backendUrl]);

  return (
    <ExpandableTab
      title='Templates'
      mainSection={TemplatesMainSection}
      expandedSection={TemplatesExpandedSection}
      eventTemplates={eventTemplates}
      myTemplates={myTemplates}
      subscribedTemplates={subscribedTemplates}
      allTemplates={allTemplates}
      inputFile={inputFile}
      setTemplateImage={props.setTemplateImage}
      setTemplateCreationMode={props.setTemplateCreationMode}
      setTemplateColorIds={props.setTemplateColorIds}
      availableTemplates={availableTemplates}
      setActiveTab={props.setActiveTab}
    />
  );
};

export default Templates;
