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
  const isDataSame = props.data.length === props.stateValue.pageLength;
  const handleLoadmore = () => {
    const newPageLentgh = props.data
      ? props.stateValue.pageLength + 10
      : props.stateValue.pageLength;
    props.setState((item) => ({ ...item, page: 1, pageLength: newPageLentgh }));
  };

  return (
    <div className='PaginationContainer'>
      {isDataSame && (
        <button
          title='Load More'
          className='Pagination_btn'
          onClick={handleLoadmore}
        >
          Load More
        </button>
      )}
    </div>
  );
}
