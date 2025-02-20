import { playSoftClick2 } from "../utils/sounds";

export const BasicTab = (props: any) => {
  return (
    <div className="relative p-[0.5rem] pt-[1rem] w-full flex flex-col justify-center align-center Gradient__standard rounded-[1rem]
      shadow-[1rem] border-[0.1rem] border-[#000000] pointer-events-auto"
        style={props.style}
      >
      {props.title && (
        <h1 className="mb-[0.5rem] Text__xlarge Heading__main">
          {props.title}
        </h1>
      )}
      {props.children}
      {!props.hideClose && (
        <p
          className="Button__close absolute top-[0.5rem] right-[0.5rem]"
          onClick={() => {
            playSoftClick2();
            if(props.onClose) {
              props.onClose();
            } else {
              props.setActiveTab("")
            }
          }}
        >
          X
        </p>
      )}
    </div>
  );
};
