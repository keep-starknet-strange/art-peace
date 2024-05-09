import React from 'react';

const ColoredIcon = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={props.width}
      height={props.width}
      viewBox='0 0 24 24'
      style={props.style}
    >
      <path fill={props.color} d={props.path} />
    </svg>
  );
};

export default ColoredIcon;
