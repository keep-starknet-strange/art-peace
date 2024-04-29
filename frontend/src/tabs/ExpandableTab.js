import React, { useState } from 'react';
import './ExpandableTab.css';
import '../utils/Styles.css';

const ExpandableTab = (props) => {
  // TODO: Close pixel selection when expanded
  const [expanded, setExpanded] = useState(false);

  const MainSection = props.mainSection;
  const ExpandedSection = props.expandedSection;
  const { ...rest } = props;

  // Click within the tab and drag to expand
  const handleMouseDown = (e) => {
    const startX = e.clientX;

    const handleMouseMove = (e) => {
      const x = e.clientX;

      if (expanded) {
        if (x - startX > 75) {
          setExpanded(false);
        }
      } else {
        if (x - startX < -75) {
          setExpanded(true);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    // Remove event listener when mouse is released
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleMouseMove);
    });
  };

  return (
    <div
      className={'ExpandableTab' + (expanded ? ' ExpandableTab--expanded' : '')}
      onMouseDown={handleMouseDown}
    >
      <h1 className='Text__xlarge Heading__main ExpandableTab__title'>
        {props.title}
      </h1>
      <div className='ExpandableTab__content'>
        <MainSection {...rest} />
        {expanded && <ExpandedSection {...rest} />}
      </div>
      <div
        className='Button__primary ExpandableTab__expand'
        onClick={() => setExpanded(!expanded)}
      >
        <p>{expanded ? '>' : '<'}</p>
      </div>
      <p
        className='Button__close ExpandedTab__close'
        onClick={() => props.setActiveTab('Canvas')}
      >
        X
      </p>
    </div>
  );
};

export default ExpandableTab;
