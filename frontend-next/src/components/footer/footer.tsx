import { GameController } from "./controller";

export const Footer = (props: any) => {
  return (
    <div className="absolute bottom-0 left-0 flex flex-col align-center justify-center w-full pointer-events-none">
      <GameController {...props} />
      <div className="flex justify-around align-center w-[min(100rem,100vw)] mx-auto my-[1rem] mt-0">
        {props.tabs.map((name: string, index: number) => (
          <button
            key={index}
            className={
              `Button__primary Text__large py-[0.7rem] px-[1.5rem]` +
              (props.activeTab === name ? "TabsFooter__tab--active " : " ")
            }
            onClick={() => props.setActiveTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
