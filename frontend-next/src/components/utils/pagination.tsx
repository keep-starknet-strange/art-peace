export function PaginationView(props: any) {
  const hasMore = () => {
    if (!props.data || !props.data.length) {
      return false;
    }
    return (
      props.data.length >= props.stateValue.pageLength * props.stateValue.page
    );
  };

  const handleLoadmore = () => {
    props.setState((item: any) => ({
      ...item,
      page: props.stateValue.page + 1,
      pageLength: props.stateValue.pageLength
    }));
  };

  return (
    <div className="flex flex-row justify-center items-center user-select-none pt-[1rem] w-full">
      {hasMore() && (
        <div
          title="More"
          className="Text__medium Button__primary"
          onClick={handleLoadmore}
        >
          more...
        </div>
      )}
    </div>
  );
}

