import React from 'react';
import './pagination.css';

/**
 * PaginationView component for handling pagination controls.
 * When LoadMore button is clicked 10 items is added to the pageLength.
 * @param {Object} props - The properties object.
 * @param {function} props.data - The returned data.
 * @param {function} props.setState - Function to update the state.
 * @param {function} props.stateValue - The state value {pageLength and page}
 */

export function PaginationView(props) {
  const hasMore = () => {
    return (
      props.data.length >= props.stateValue.pageLength * props.stateValue.page
    );
  };

  const handleLoadmore = () => {
    props.setState((item) => ({
      ...item,
      page: props.stateValue.page + 1,
      pageLength: props.stateValue.pageLength
    }));
  };

  return (
    <div className='PaginationContainer'>
      {hasMore() && (
        <div
          title='More'
          className='Text__medium Button__primary'
          onClick={handleLoadmore}
        >
          more...
        </div>
      )}
    </div>
  );
}
