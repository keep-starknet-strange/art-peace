import { useState, useEffect, useRef, createRef } from "react";

import { StencilCreationOverlay } from "./stencil-overlay";
import { playShutter } from "../utils/sounds";
import { Canva } from "./canvas";

export const CanvasController = (props: any) => {
  const baseWorldX = process.env.NEXT_PUBLIC_WORLD_X as unknown as number || 528;
  const baseWorldY = process.env.NEXT_PUBLIC_WORLD_Y as unknown as number || 396;
  const surroundingWorldX = process.env.NEXT_PUBLIC_SURROUNDING_WORLD_X as unknown as number || 256;
  const surroundingWorldY = process.env.NEXT_PUBLIC_SURROUNDING_WORLD_Y as unknown as number || 192;
  const mainCanvasRef = useRef(null as any);
  const [surroundingCanvasRefs, setSurroundingCanvasRefs] = useState([] as any[]);
  useEffect(() => {
    setSurroundingCanvasRefs(
      Array.from({ length: props.surroundingWorlds.length }, () => createRef())
    );
  }, [props.surroundingWorlds]);
  const openWorld = (world: any) => {
    playShutter();

    props.clearPixelSelection();
    props.setOpenedStencil(null);
    props.setOpenedWorldId(world.worldId);
  }
  const [selectedWorldOrigin, setSelectedWorldOrigin] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (props.openedWorldId === 0) {
      setSelectedWorldOrigin({ x: 0, y: 0 });
    } else {
      const position = getWorldPosition(
        props.surroundingWorlds.findIndex(
          (world: any) => world.worldId === props.openedWorldId
        )
      );
      setSelectedWorldOrigin(position);
    }
  }, [props.openedWorldId, props.surroundingWorlds]);

  const getWorldPosition = (index: number) => {
    // TODO: To config
    const xGap = 16;
    const yGap = 12;
    if (index === 0) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 1) {
      return {
        x: 0,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 2) {
      return {
        x: (baseWorldX + xGap) / 2,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 3) {
      return {
        x: baseWorldX + xGap,
        y: -(baseWorldY + yGap) / 2
      };
    } else if (index === 4) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: 0
      };
    } else if (index === 5) {
      return {
        x: baseWorldX + xGap,
        y: 0
      };
    } else if (index === 6) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: (baseWorldY + yGap) / 2
      };
    } else if (index === 7) {
      return {
        x: baseWorldX + xGap,
        y: (baseWorldY + yGap) / 2
      };
    } else if (index === 8) {
      return {
        x: -(baseWorldX + xGap) / 2,
        y: baseWorldY + yGap
      };
    } else if (index === 9) {
      return {
        x: 0,
        y: baseWorldY + yGap
      };
    } else if (index === 10) {
      return {
        x: (baseWorldX + xGap) / 2,
        y: baseWorldY + yGap
      };
    } else if (index === 11) {
      return {
        x: baseWorldX + xGap,
        y: baseWorldY + yGap
      };
    }
    // Circle around the center
    return {
      x: baseWorldX * 2,
      y: baseWorldY * 2
    };
  };

  // TODO: Handle window resize
  const minScale = 0.6;
  const maxScale = 40;
  const [height, setHeight] = useState(baseWorldY as number);
  useEffect(() => {
    if (!props.activeWorld) return;
    setHeight(props.activeWorld.height);
  }, [props.activeWorld]);

  const [canvasX, setCanvasX] = useState(0);
  const [canvasY, setCanvasY] = useState(0);
  const [canvasScale, setCanvasScale] = useState(1.02);
  const [titleScale, setTitleScale] = useState(1);
  const [touchInitialDistance, setInitialTouchDistance] = useState(0);
  const [touchScale, setTouchScale] = useState(0);
  const canvasControllerRef = useRef(null as any);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  const handlePointerDown = (e: any) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStartX(0);
    setDragStartY(0);
  };

  const handlePointerMove = (e: any) => {
    if (isDragging) {
      setCanvasX(canvasX + e.clientX - dragStartX);
      setCanvasY(canvasY + e.clientY - dragStartY);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    }
  };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, canvasX, canvasY]);

  const [artificialZoom, setArtificialZoom] = useState(1);
  // Zoom in/out ( into the cursor position )
  const zoom = (e: any) => {
    // Get the cursor position within the canvas ( note the canvas can go outside the viewport )
    if (!mainCanvasRef.current) return;
    const rect = mainCanvasRef.current.getBoundingClientRect();
    let cursorX = e.clientX - rect.left;
    let cursorY = e.clientY - rect.top;
    if (cursorX < -surroundingWorldX * canvasScale) {
      cursorX = -surroundingWorldX * canvasScale;
    } else if (cursorX > rect.width + surroundingWorldX * canvasScale) {
      cursorX = rect.width + surroundingWorldX * canvasScale;
    }
    if (cursorY < -surroundingWorldY * canvasScale) {
      cursorY = -surroundingWorldY * canvasScale;
    } else if (cursorY > rect.height + surroundingWorldY * canvasScale) {
      cursorY = rect.height + surroundingWorldY * canvasScale;
    }

    // Calculate new left and top position to keep cursor over the same rect pos  ition
    const direction = e.deltaY > 0 ? 1 : -1;
    const scaler = Math.log2(1 + Math.abs(e.deltaY) * 2) * direction;
    let newScale = canvasScale * (1 + scaler * -0.01);
    if (newScale < minScale) {
      newScale = minScale;
    } else if (newScale > maxScale) {
      newScale = maxScale;
    }
    const newWidth = baseWorldX * newScale * artificialZoom;
    const newHeight = baseWorldY * newScale * artificialZoom;
    const oldCursorXRelative = cursorX / rect.width;
    const oldCursorYRelative = cursorY / rect.height;
    const newCursorX = oldCursorXRelative * newWidth;
    const newCursorY = oldCursorYRelative * newHeight;
    const newPosX = canvasX - (newCursorX - cursorX);
    const newPosY = canvasY - (newCursorY - cursorY);

    setCanvasScale(newScale);
    setCanvasX(newPosX);
    setCanvasY(newPosY);

    const titleScaler = 0.95
    setTitleScale(newScale * titleScaler);
  };

  const handleTouchStart = (e: any) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setTouchScale(canvasScale);
      setInitialTouchDistance(initialDistance);
    }
  };

  const handleTouchMove = (e: any) => {
    if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const rect = mainCanvasRef.current.getBoundingClientRect();
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      let cursorX = midX - rect.left;
      let cursorY = midY - rect.top;
      if (cursorX < 0) {
        cursorX = 0;
      } else if (cursorX > rect.width) {
        cursorX = rect.width;
      }
      if (cursorY < 0) {
        cursorY = 0;
      } else if (cursorY > rect.height) {
        cursorY = rect.height;
      }

      let newScale = (distance / touchInitialDistance) * touchScale;
      if (newScale < minScale) {
        newScale = minScale;
      } else if (newScale > maxScale) {
        newScale = maxScale;
      }
      const newWidth = baseWorldX * newScale * artificialZoom;
      const newHeight = baseWorldY * newScale * artificialZoom;

      const oldCursorXRelative = cursorX / rect.width;
      const oldCursorYRelative = cursorY / rect.height;

      const newCursorX = oldCursorXRelative * newWidth;
      const newCursorY = oldCursorYRelative * newHeight;

      const newPosX = canvasX - (newCursorX - cursorX);
      const newPosY = canvasY - (newCursorY - cursorY);

      setCanvasScale(newScale);
      setCanvasX(newPosX);
      setCanvasY(newPosY);

      const titleScaler = props.width / 512;
      setTitleScale(newScale * titleScaler);
      // TODO: Make scroll acceleration based
    }
  };

  useEffect(() => {
    if (!canvasControllerRef.current) return;
    canvasControllerRef.current.addEventListener("wheel", zoom);
    canvasControllerRef.current.addEventListener("touchstart", handleTouchStart);
    canvasControllerRef.current.addEventListener("touchmove", handleTouchMove);
    return () => {
      if (!canvasControllerRef.current) return;
      canvasControllerRef.current.removeEventListener("wheel", zoom);
      canvasControllerRef.current.removeEventListener(
        "touchstart",
        handleTouchStart
      );
      canvasControllerRef.current.removeEventListener(
        "touchmove",
        handleTouchMove
      );
    };
  }, [canvasScale, canvasX, canvasY, touchInitialDistance]);

  // Init canvas transform to center of the viewport
  const [hasInit, setHasInit] = useState(false);
  useEffect(() => {
    if (!canvasControllerRef.current) return;
    if (hasInit) return;
    const containerRect = canvasControllerRef.current.getBoundingClientRect();
    const adjustX = ((canvasScale - 1) * props.width) / 2;
    const adjustY = ((canvasScale - 1) * height) / 2;
    setCanvasX(containerRect.width / 2 - adjustX);
    setCanvasY(containerRect.height / 2 - adjustY);
    setHasInit(true);
  }, [canvasControllerRef, props.width, height]);
  useEffect(() => {
    if (props.activeTab !== "Canvas") return;
    if (props.activeTab === "Canvas") props.setActiveTab("");
    if (!canvasControllerRef.current) return;
    const containerRect = canvasControllerRef.current.getBoundingClientRect();
    const resetCanvasScale = 1.02;
    const adjustX = ((resetCanvasScale - 1) * props.width) / 2;
    const adjustY = ((resetCanvasScale - 1) * height) / 2;
    setCanvasX(containerRect.width / 2 - adjustX);
    setCanvasY(containerRect.height / 2 - adjustY);
    setTitleScale(1);
    setCanvasScale(resetCanvasScale);
  }, [props.activeTab]);

  // Pixel Selection Data
  const [selectedBoxShadow, setSelectedBoxShadow] = useState("")
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState("")
  const selectPixel = (x: number, y: number) => {
    if (props.stencilCreationMode) {
      return;
    }
    // Clear selection if same pixel is clicked
    if (
      props.selectedColorId === -1 &&
      props.pixelSelectedMode &&
      props.selectedPixelX === x &&
      props.selectedPixelY === y
    ) {
      props.clearPixelSelection();
      return;
    }
    // Select pixel
    props.setSelectedPixelX(x);
    props.setSelectedPixelY(y);
    props.setPixelSelectedMode(true);
  }
  useEffect(() => {
    const base1 = 0.12;
    const minShadowScale = 0.8;
    const startVal = Math.max(minShadowScale, base1 * canvasScale);
    const endVal = startVal * 0.8;
    setSelectedBoxShadow(
      `0 0 ${startVal}px ${endVal}px ${getSelectedColorInverse()} inset`
    );

    if (props.selectedColorId === -1) {
      setSelectedBackgroundColor('rgba(255, 255, 255, 0)');
    } else {
      setSelectedBackgroundColor(`#${props.colors[props.selectedColorId]}FF`);
    }
  }, [
    canvasScale,
    props.selectedColorId,
    props.selectedPixelX,
    props.selectedPixelY,
    props.colors
  ]);
  const getCurrentCanvasRef = () => {
    let canvasRef = mainCanvasRef;
    if (props.openedWorldId !== 0) {
      canvasRef = surroundingCanvasRefs[props.surroundingWorlds.findIndex(
        (world: any) => world.worldId === props.openedWorldId
      )];
    }
    return canvasRef;
  }
  useEffect(() => {
    props.setWorldCanvasRef(getCurrentCanvasRef());
  }, [props.openedWorldId, mainCanvasRef, surroundingCanvasRefs]);
  const getSelectedColorInverse = () => {
    if (!props.pixelSelectedMode) return 'rgba(255, 255, 255, 0)';
    if (props.selectedColorId === -1) {
      const color = getCurrentCanvasRef()
        .current
        .getContext('2d')
        .getImageData(
          props.selectedPixelX,
          props.selectedPixelY,
          1,
          1
        ).data;
      return (
        '#' +
        (255 - color[0]).toString(16).padStart(2, '0') +
        (255 - color[1]).toString(16).padStart(2, '0') +
        (255 - color[2]).toString(16).padStart(2, '0') +
        color[3].toString(16).padStart(2, '0')
      );
    }

    return '#' + props.colors[props.selectedColorId] + 'FF';
  };
  useEffect(() => {
    const hoverColor = (e: any) => {
      if (props.selectedColorId === -1 ) {
        return;
      }
      if (
        !(
          e.target.classList.contains('Canva')
        )
      ) {
        return;
      }

      const canvas = getCurrentCanvasRef().current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(
        ((e.clientX - rect.left) / (rect.right - rect.left)) * props.width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) * height
      );

      // Only click pixel if it's within the canvas
      if (x < 0 || x >= props.width || y < 0 || y >= height) {
        return;
      }

      selectPixel(x, y);
    };
    window.addEventListener('mousemove', hoverColor);
    return () => {
      window.removeEventListener('mousemove', hoverColor);
    };
  }, [
    props.selectedColorId,
    props.width,
    height
  ]);

  return (
    <div
      ref={canvasControllerRef}
      className="w-[100vw] h-[100vh] overflow-hidden relative flex flex-col items-center justify-center"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <div
        className="absolute"
        style={{
          top: -baseWorldY / 2,
          left: -baseWorldX / 2,
          transform: `translate(${canvasX}px, ${canvasY}px)`
        }}
      >
        {props.pixelSelectedMode && (
          <div
            className="absolute z-10 flex flex-row items-center justify-center"
            style={{
              top: (selectedWorldOrigin.y + props.selectedPixelY) * canvasScale * artificialZoom,
              left: (selectedWorldOrigin.x + props.selectedPixelX) * canvasScale * artificialZoom
            }}
          >
            <div
              className="absolute w-[1px] h-[1px] top-0 left-0 bg-transparent pointer-events-none"
              style={{
                boxShadow: selectedBoxShadow,
                backgroundColor: selectedBackgroundColor,
                width: canvasScale * artificialZoom,
                height: canvasScale * artificialZoom
              }}
            ></div>
          </div>
        )}
        {props.stencilCreationMode && (
          <StencilCreationOverlay
            stencilImage={props.stencilImage}
            canvasWidth={props.width}
            canvasHeight={height}
            canvasScale={canvasScale}
            stencilPosition={props.stencilPosition}
            setStencilPosition={props.setStencilPosition}
            endStencilCreation={props.endStencilCreation}
            stencilCreationMode={props.stencilCreationMode}
            stencilCreationSelected={props.stencilCreationSelected}
            origin={{
              x: selectedWorldOrigin.x,
              y: selectedWorldOrigin.y
            }}
            getCanvasRef={getCurrentCanvasRef}
            worldId={props.openedWorldId}
            setStencilCreationSelected={props.setStencilCreationSelected}
            isCreationOverlay={true}
          />
        )}
        {props.openedStencil && (
          <StencilCreationOverlay
            stencilImage={props.openedStencil}
            canvasWidth={props.width}
            canvasHeight={height}
            canvasScale={canvasScale}
            stencilPosition={props.openedStencil.position}
            origin={{
              x: selectedWorldOrigin.x,
              y: selectedWorldOrigin.y
            }}
            getCanvasRef={getCurrentCanvasRef}
            worldId={props.openedWorldId}
            setOpenedStencil={props.setOpenedStencil}
            isCreationOverlay={false}
          />
        )}
        {props.surroundingWorlds &&
         props.surroundingWorlds.length > 0 &&
         props.surroundingWorlds.map((world: any, index: number) => {
           if (world === null) return null;
           const position = getWorldPosition(index);
           if (!position) return null;
            return (
              <Canva
                key={index}
                canvasRef={surroundingCanvasRefs[index]}
                width={world.width}
                height={world.height}
                worldId={world.worldId}
                style={{
                  width: world.width * canvasScale,
                  height: world.height * canvasScale,
                  position: "absolute",
                  top: position.y * canvasScale,
                  left: position.x * canvasScale,
                  cursor: "pointer",
                }}
                origin={{
                  x: position.x * canvasScale,
                  y: position.y * canvasScale,
                }}
                basePixelUp={props.basePixelUp}
                selectPixel={(x: number, y: number): boolean => {
                  if (props.openedWorldId !== world.worldId) {
                    openWorld(world);
                    return false;
                  } else {
                    selectPixel(x, y);
                    return true;
                  }
                }}
                selectedColorId={props.selectedColorId}
                setSelectedColorId={props.setSelectedColorId}
                clearPixelSelection={props.clearPixelSelection}
                setLastPlacedTime={props.setLastPlacedTime}
                className={`${props.openedWorldId === world.worldId ? "Canvas__selected" : "Canvas__surrounding"}`}
                showTitle={props.openedWorldId === world.worldId}
                titleScale={titleScale}
                title={props.openedWorldId === world.worldId && props.activeWorld ? world.name : ""}
                canvasScale={canvasScale}
                artificialZoom={artificialZoom}
                stagingPixels={props.stagingPixels}
                setStagingPixels={props.setStagingPixels}
                availablePixels={props.availablePixels}
                availablePixelsUsed={props.availablePixelsUsed}
                isActive={props.openedWorldId === world.worldId}
                gameUpdate={props.gameUpdate}
                setGameUpdate={props.setGameUpdate}
              />
            );
          }
        )}
        <Canva
          canvasRef={mainCanvasRef}
          width={baseWorldX}
          height={baseWorldY}
          worldId={0}
          style={{
            width: baseWorldX * canvasScale * artificialZoom,
            height: baseWorldY * canvasScale * artificialZoom,
          }}
          origin={{
            x: 0,
            y: 0
          }}
          basePixelUp={props.basePixelUp}
          selectPixel={(x: number, y: number): boolean => {
            if (props.openedWorldId !== 0) {
              openWorld({ worldId: 0, width: baseWorldX, height: baseWorldY });
              return false;
            } else {
              selectPixel(x, y);
              return true;
            }
          }}
          selectedColorId={props.selectedColorId}
          setSelectedColorId={props.setSelectedColorId}
          clearPixelSelection={props.clearPixelSelection}
          setLastPlacedTime={props.setLastPlacedTime}
          className={`${props.openedWorldId === 0 ? "Canvas__selected" : "Canvas__surrounding"}`}
          showTitle={props.openedWorldId === 0}
          titleScale={titleScale}
          title={props.openedWorldId === 0 && props.activeWorld ? props.activeWorld.name : ""}
          isActive={props.openedWorldId === 0}
          canvasScale={canvasScale}
          artificialZoom={artificialZoom}
          stagingPixels={props.stagingPixels}
          setStagingPixels={props.setStagingPixels}
          availablePixels={props.availablePixels}
          availablePixelsUsed={props.availablePixelsUsed}
          gameUpdate={props.gameUpdate}
          setGameUpdate={props.setGameUpdate}
        />
      </div>
    </div>
  );
}
