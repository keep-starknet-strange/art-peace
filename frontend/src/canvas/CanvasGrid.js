import React, { useState, useEffect } from 'react';
import CanvasContainer from './CanvasContainer';
import { fetchWrapper } from '../services/apiService';
import './CanvasGrid.css';

const CanvasGrid = (props) => {
  const [canvases, setCanvases] = useState([]);

  useEffect(() => {
    const fetchCanvases = async () => {
      const response = await fetchWrapper('get-all-canvases');
      if (response.data) {
        setCanvases(JSON.parse(response.data));
      }

      console.log('response: ', response);
    };

    fetchCanvases();
  }, []);

  return (
    <div className='canvas-grid'>
      {canvases.map((canvas) => (
        <div key={canvas.canvasId} className='canvas-grid-item'>
          <h3 className='canvas-title'>{canvas.name}</h3>
          <CanvasContainer
            width={canvas.width}
            height={canvas.height}
            canvasRef={React.createRef()}
            extraPixelsCanvasRef={React.createRef()}
            colors={props.colors}
            openedWorldId={canvas.canvasId}
            activeWorld={canvas}
          />
        </div>
      ))}
    </div>
  );
};

export default CanvasGrid;
