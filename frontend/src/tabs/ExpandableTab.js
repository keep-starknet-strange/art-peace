import React, { useState } from 'react';
import './ExpandableTab.css';

const ExpandableTab = props => {
  // TODO: Close pixel selection when expanded
  const [expanded, setExpanded] = useState(false);

  const MainSection = props.mainSection;
  const ExpandedSection = props.expandedSection;
  const { ...rest } = props;

  // TODO: Add close button that switches to canvas
  // TODO: Add expand/collapse feature
  // TODO: Drag to expand and hambuger menu to expand
  return (
    <div className={'ExpandableTab' + (expanded ? ' ExpandableTab--expanded' : '')}>
      <h1 className='ExpandableTab__title'>{props.title}</h1>
      <div className='ExpandableTab__content'>
        <MainSection {...rest} />
        {expanded && <ExpandedSection {...rest} />}
      </div>
      <div className='ExpandableTab__hamburger' onClick={() => setExpanded(!expanded)}></div>
    </div>
  );
}

export default ExpandableTab;
