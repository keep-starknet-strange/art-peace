'use client';

import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from 'react-router';

import { StarknetProvider } from "../components/StarknetProvider";
import { usePreventZoom } from './window';
import { Canvas } from "../pages/canvas";

function App() {
  usePreventZoom();

  return (
    <div className="h-[100vh] w-[100vw] bg-[#fefdfb] flex flex-col align-center">
      <div className="Page__bg">
        <Routes>
          <Route path="/" element={<Canvas />} />
        </Routes>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <StrictMode>
      <BrowserRouter>
        <StarknetProvider>
          <App />
        </StarknetProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
