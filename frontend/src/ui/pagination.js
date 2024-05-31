import React from 'react';
import './pagination.css';

/**
 * PaginationView component for handling pagination controls.
 *
 * @param {Object} props - The properties object.
 * @param {number} props.pageLength - The number of data to be returned per page.
 * @param {number} props.page - The page number.
 * @param {number} props.totalPages - The total number of pages.
 * @param {number} props.currentPage - The current page.
 * @param {function} props.setState - Function to update the state.
 * @param {function} props.stateValue - The state value {pageLength and page}
 */

export function PaginationView(props) {
  const handleLoadmore = () => {
    //Add constriant so its not more than totalPages
    const nextNumber =
      props.stateValue.page !== props.totalPages
        ? props.stateValue.page + 1
        : props.totalPages;
    props.setState((item) => ({ ...item, page: nextNumber }));
  };

  return (
    <div className='PaginationContainer'>
      {props.stateValue.page !== props.totalPages && (
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
