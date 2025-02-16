import { useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { AccountTab } from './account';
import { StencilsTab } from './stencils';
import { WorldsTab } from './worlds';
import { StencilCreationTab } from './stencil-creation';
import { WorldCreationTab } from './world-creation';
import { PixelInfoTab } from './pixel';

export const TabPanel = (props: any) => {
  const nodeRef = useRef(null);
  const pixelInfoNodeRef = useRef(null);
  const stencilCreationNodeRef = useRef(null);
  const worldCreationNodeRef = useRef(null);
  return (
    <div className="fixed z-[100] right-0 top-0 w-[max(25rem,30%)] m-[0.5rem] p-0 flex flex-col align-center justify-center">
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
      <div className="relative w-full h-full">
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
              {props.activeTab === "Account" && <AccountTab {...props} />}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
    </div>
  );
}
