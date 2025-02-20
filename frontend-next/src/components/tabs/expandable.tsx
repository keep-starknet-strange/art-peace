import { playSoftClick2 } from "../utils/sounds";

export const ExpandableTab = (props: any) => {
  const MainSection = props.mainSection;
  const ExpandedSection = props.expandedSection;

  return (
    <div
      className={
        "absolute p-[0.5rem] pt-[1rem] right-0 flex flex-col justify-center align-center Gradient__standard rounded-[1rem] transition-width duration-200 ease-in-out shadow-[1rem] border-[0.1rem] border-[#000000] pointer-events-auto" + (props.expanded ? " w-[calc(100vw-1rem)] duration-300" : " w-full")
      }
    >
      <h1 className="Text__xlarge Heading__main mb-[2rem]">
        {props.title}
      </h1>
      <div className="flex flex-row w-full">
        {(!props.expanded || (props.expanded && !props.isMobile)) && (
          <MainSection {...props} />
        )}
        {props.expanded &&
          !props.isMobile &&
          (props.canExpand === undefined || props.canExpand) && (
            <div className="w-[0.5rem] bg-[rgba(0,0,0,0.2)] rounded-[0.25rem]" />
          )}
        {props.expanded && <ExpandedSection {...props} />}
      </div>
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
    </div>
  );
};
