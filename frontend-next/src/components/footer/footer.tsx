import { useEffect, useState } from "react";
import { GameController } from "./controller";
import { playSoftClick2 } from "../utils/sounds";

export const Footer = (props: any) => {
  const [enableController, setEnableController] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", () => {
      setIsMobile(window.innerWidth < 600);
    });
  }, []);
  return (
    <div className="fixed bottom-0 left-0 flex flex-col align-center justify-center w-full pointer-events-none">
      {enableController && (
      <GameController {...props} />
      )}
        {isMobile ? (
          <div className="flex justify-center items-center w-full px-2 pb-2 sm:pb-4 Footer__mobile">
            <div className="flex justify-around items-center w-full max-w-lg gap-1">
              {props.tabs.slice(1).map((name: string, index: number) => (
                <button
                  key={index}
                  className={
                    `Button__primary Text__small sm:Text__large flex-1 min-w-0` +
                    (props.activeTab === name ? " TabsFooter__tab--active" : "")
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
          </div>
        ) : (
          <div className="flex justify-around align-center w-[min(100rem,100vw)] mx-auto my-[1rem] mt-0">
          {props.tabs.map((name: string, index: number) => (
            <button
              key={index}
              className={
                `Button__primary Text__large` +
                (props.activeTab === name ? " TabsFooter__tab--active" : "")
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
