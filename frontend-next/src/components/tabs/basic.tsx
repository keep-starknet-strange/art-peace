export const BasicTab = (props: any) => {
  return (
    <div className="relative p-[0.5rem] pt-[1rem] w-full flex flex-col justify-center align-center Gradient__standard rounded-[1rem]
      shadow-[1rem] border-[0.1rem] border-[#000000] pointer-events-auto"
        style={props.style}
      >
      <h1 className="mb-[0.5rem] Text__xlarge Heading__main">
        {props.title}
      </h1>
      {props.children}
      <p
        className="Button__close absolute top-[0.5rem] right-[0.5rem]"
        onClick={() => {
          if(props.onClose) {
            props.onClose();
          } else {
            props.setActiveTab("Canvas")
          }
        }}
      >
        X
      </p>
    </div>
  );
};
