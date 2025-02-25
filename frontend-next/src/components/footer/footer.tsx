import { useEffect, useState } from "react";
import { GameController } from "./controller";
import { playSoftClick2 } from "../utils/sounds";

export const Footer = (props: any) => {
  const [enableController, setEnableController] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", () => {
      setIsMobile(window.innerWidth < 600);
    });
  }, []);
  return (
    <div className="absolute bottom-0 left-0 flex flex-col align-center justify-center w-full pointer-events-none">
      {enableController && (
      <GameController {...props} />
      )}
        {isMobile ? (
          <div className="flex justify-around align-center w-[min(100rem,100vw)] mx-auto my-[1rem] mt-0">
          {props.tabs.slice(1).map((name: string, index: number) => (
            <button
              key={index}
              className={
                `Button__primary Text__large py-[0.7rem] px-[1.5rem]` +
                (props.activeTab === name ? "TabsFooter__tab--active " : " ")
              }
              onClick={() => {
                props.setActiveTab(name);
                playSoftClick2();
              }}
            >
              {name}
            </button>
          ))}
          </div>
        ) : (
          <div className="flex justify-around align-center w-[min(100rem,100vw)] mx-auto my-[1rem] mt-0">
          {props.tabs.map((name: string, index: number) => (
            <button
              key={index}
              className={
                `Button__primary Text__large py-[0.7rem] px-[1.5rem]` +
                (props.activeTab === name ? "TabsFooter__tab--active " : " ")
              }
              onClick={() => {
                props.setActiveTab(name);
                playSoftClick2();
              }}
            >
              {name}
            </button>
          ))}
          </div>
        )}
    </div>
  );
}
