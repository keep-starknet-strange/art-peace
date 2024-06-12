import React from 'react';
import './ExpandableTab.css';
import '../utils/Styles.css';
import HamburgerIcon from '../resources/icons/Hamburger.png';

const ExpandableTab = (props) => {
  // TODO: Close pixel selection when expanded

  const MainSection = props.mainSection;
  const ExpandedSection = props.expandedSection;
  const { ...rest } = props;

  // Click within the tab and drag to expand
  const handleMouseDown = (_e) => {
    /*
    TODO
    if (props.canExpand === false) {
      return;
    }
    const startX = e.clientX;

    const handleMouseMove = (e) => {
      const x = e.clientX;

      if (props.expanded) {
        if (x - startX > 75) {
          props.setExpanded(false);
        }
      } else {
        if (x - startX < -75) {
          props.setExpanded(true);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    // Remove event listener when mouse is released
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleMouseMove);
    });
    */
  };

  return (
    <div
      className={
        'ExpandableTab' + (props.expanded ? ' ExpandableTab--expanded' : '')
      }
      onMouseDown={handleMouseDown}
    >
      <h1 className='Text__xlarge Heading__main ExpandableTab__title'>
        {props.title}
      </h1>
      <div className='ExpandableTab__content'>
        {(!props.expanded || (props.expanded && !props.isMobile)) && (
          <MainSection {...rest} />
        )}
        {props.expanded &&
          !props.isMobile &&
          (props.canExpand === undefined || props.canExpand) && (
            <div className='ExpandableTab__divider' />
          )}
        {props.expanded && <ExpandedSection {...rest} />}
      </div>
      {(props.canExpand === undefined || props.canExpand) && (
        <div
          className='Button__primary ExpandableTab__expand'
          onClick={() => {
            props.setExpanded(!props.expanded);
          }}
        >
          <img
            src={HamburgerIcon}
            alt='Expand'
            className='ExpandableTab__hamburger'
          />
        </div>
      )}
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
