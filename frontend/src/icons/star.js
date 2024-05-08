import React from 'react';

const StarIcon = ({ width, color }) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={width}
      height={width}
      viewBox='0 0 24 24'
    >
      <path
        fill={color}
        d='m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z'
      />
    </svg>
  );
};

export default StarIcon;
