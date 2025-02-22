import { useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { AccountTab } from './account';
import { LeaderboardTab } from './leaderboard';
import { StencilsTab } from './stencils';
import { WorldsTab } from './worlds';
import { StencilCreationTab } from './stencil-creation';
import { WorldCreationTab } from './world-creation';
import { PixelInfoTab } from './pixel';
import { StagingPixelsTab } from './staging';

export const TabPanel = (props: any) => {
  const nodeRef = useRef(null);
  const pixelInfoNodeRef = useRef(null);
  const stagingPixelsNodeRef = useRef(null);
  const stencilCreationNodeRef = useRef(null);
  const worldCreationNodeRef = useRef(null);
  return (
    <div className="fixed z-[100] right-0 top-0 w-[calc(100%-1rem)] sm:w-[max(40rem,70%)] md:w-[max(40rem,45%)] lg:w-[max(40rem,30%)] xl:w-[max(40rem,25%)] m-[0.5rem] p-0 flex flex-col align-center justify-center">
      <CSSTransition
        nodeRef={pixelInfoNodeRef}
        in={props.pixelSelectedMode}
        timeout={150}
        classNames="list-transition"
        unmountOnExit
        appear
      >
        <PixelInfoTab
          x={props.selectedPixelX}
          y={props.selectedPixelY}
          width={props.width}
          worldId={props.worldId}
          worldName={props.activeWorld ? props.activeWorld.name : ""}
          clearPixelSelection={props.clearPixelSelection}
        />
      </CSSTransition>
      <CSSTransition
        nodeRef={stencilCreationNodeRef}
        in={props.stencilCreationMode}
        timeout={150}
        classNames="list-transition"
        unmountOnExit
        appear
      >
        <StencilCreationTab
          x={props.selectedPixelX}
          y={props.selectedPixelY}
          canvasWidth={props.width}
          worldId={props.worldId}
          worldName={props.activeWorld ? props.activeWorld.name : ""}
          endStencilCreation={props.endStencilCreation}
          stencilImage={props.stencilImage}
          stencilPosition={props.stencilPosition}
          stencilCreationSelected={props.stencilCreationSelected}
          setActiveTab={props.setActiveTab}
          stencilColorIds={props.stencilColorIds}
          setOpenedStencil={props.setOpenedStencil}
        />
      </CSSTransition>
      <CSSTransition
        nodeRef={worldCreationNodeRef}
        in={props.worldCreationMode}
        timeout={150}
        classNames="list-transition"
        unmountOnExit
        appear
      >
        <WorldCreationTab
          endWorldCreation={props.endWorldCreation}
        />
      </CSSTransition>
      <CSSTransition
        nodeRef={stagingPixelsNodeRef}
        in={props.stagingPixels.length > 0 && props.activeTab === "Stencils"}
        timeout={150}
        classNames="list-transition"
        unmountOnExit
        appear
      >
        <StagingPixelsTab
          stagingPixels={props.stagingPixels}
          setStagingPixels={props.setStagingPixels}
          worldColors={props.colors}
          commitStagingPixels={props.commitStagingPixels}
        />
      </CSSTransition>
      <div className="relative w-full h-full mb-[0.5rem]">
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={props.activeTab}
            nodeRef={nodeRef}
            timeout={150}
            classNames="list-transition"
            unmountOnExit
            appear
          >
            <div ref={nodeRef}>
              {props.activeTab === "Worlds" && <WorldsTab {...props} />}
              {props.activeTab === "Stencils" && <StencilsTab {...props} />}
              {props.activeTab === "Rankings" && <LeaderboardTab {...props} />}
              {props.activeTab === "Account" && <AccountTab {...props} />}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
      <CSSTransition
        nodeRef={stagingPixelsNodeRef}
        in={props.stagingPixels.length > 0 && props.activeTab !== "Stencils"}
        timeout={150}
        classNames="list-transition"
        unmountOnExit
        appear
      >
        <StagingPixelsTab
          stagingPixels={props.stagingPixels}
          setStagingPixels={props.setStagingPixels}
          worldColors={props.colors}
          commitStagingPixels={props.commitStagingPixels}
        />
      </CSSTransition>
    </div>
  );
}
