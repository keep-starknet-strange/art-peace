import React from 'react';

const ColoredIcon = ({ width, color, path }) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={width}
      height={width}
      viewBox='0 0 24 24'
    >
      <path fill={color} d={path} />
    </svg>
  );
};

export default ColoredIcon;
