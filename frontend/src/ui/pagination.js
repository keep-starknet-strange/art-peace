import React from 'react';
import { ChevronLeft, ChevronRight } from '../icons/svgs';
const data = [10, 20, 30];

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
  const handleNextPage = () => {
    //Add constriant so its not more than totalPages
    const nextNumber =
      props.stateValue.page !== props.totalPages
        ? props.stateValue.page + 1
        : props.totalPages;
    props.setState((item) => ({ ...item, page: nextNumber }));
    console.log(props.stateValue);
  };

  const handlePreviousPage = () => {
    //Add constriant so its not more than totalPages
    const prevNumber =
      props.stateValue.page !== 1 ? props.stateValue.page - 1 : 1;
    props.setState((item) => ({ ...item, page: prevNumber }));
  };

  return (
    <div className='PaginationContainer'>
      <div>
        <select
          className='Select_Input'
          style={{ height: '30px' }}
          onChange={(e) =>
            props.setState((state) => ({
              ...state,
              pageLength: e.target.value
            }))
          }
        >
          {data.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <button className='Pagination_btn' onClick={handlePreviousPage}>
          <ChevronLeft />
        </button>
        {RenderPaginationNumbers(props).map((pageItem, index) => (
          <button
            style={{ height: '30px' }}
            className={`${
              props.stateValue.page === pageItem ? 'Pagination_btn_active' : ''
            } Pagination_btn`}
            key={index}
            onClick={() => {
              props.setState((state) => ({ ...state, page: pageItem }));
            }}
            disabled={typeof pageItem === 'number' ? false : true}
          >
            {pageItem}
          </button>
        ))}
        <button className='Pagination_btn' onClick={handleNextPage}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export const RenderPaginationNumbers = (props) => {
  const paginationNumbers = [];
  const maxPagesToShow = 3;
  const ellipsis = '...';
  if (props.totalPages <= maxPagesToShow) {
    for (let i = 1; i <= props.totalPages; i++) {
      paginationNumbers.push(i);
    }
  } else {
    // Calculate the start page based on the current page
    let startPage = Math.max(1, props.stateValue.page - 1);
    // Show the next 4 numbers starting from the start page
    for (
      let i = startPage;
      i < startPage + maxPagesToShow && i <= props.totalPages;
      i++
    ) {
      paginationNumbers.push(i);
    }

    // Show ellipsis if there are more pages to the right
    if (props.totalPages > maxPagesToShow) {
      paginationNumbers.push(ellipsis);
    }
  }
  return paginationNumbers;
};
