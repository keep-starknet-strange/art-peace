'use client';

import Image from 'next/image';
import { StrictMode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

import { StarknetProvider } from "../components/StarknetProvider";
import { usePreventZoom } from './window';
import { Canvas } from "../pages/canvas";
import { Teaser } from "../pages/teaser";

import logo from '../../public/logo/logo.png';

function App() {
  usePreventZoom();

  const musicList = [
    "/music/chiptune-hard-boss-mode-218071.mp3",
    "/music/pixel-dreams-259187.mp3",
    "/music/falselyclaimed-bit-beats-3-168873.mp3",
    "/music/rasta-8bit-174443.mp3",
    "/music/neon-gaming-128925.mp3",
  ];
  const [currentBackgroundSong, setCurrentBackgroundSong] = useState(null as HTMLAudioElement | null);
  const [currentBackgroundSongIndex, setCurrentBackgroundSongIndex] = useState(0);
  useEffect(() => {
    const playSong = async () => {
      if (currentBackgroundSong) {
        currentBackgroundSong.pause();
      }
      let audio = new Audio(musicList[currentBackgroundSongIndex]);
      audio.loop = false;
      audio.volume = 0.25;
      try {
        await audio.play();
        setCurrentBackgroundSong(audio);
      } catch (e) {
        console.log("Failed to play audio", e);
      }
    }

    // Play the song
    try {
      playSong();
    } catch (e) {
      console.log("Failed to play audio", e);
    }
  }, [currentBackgroundSongIndex]);
  useEffect(() => {
    if (currentBackgroundSong) {
      setHasPlayedYet(true);
    }
  }, [currentBackgroundSong]);

  const [hasPlayedYet, setHasPlayedYet] = useState(false);
  useEffect(() => {
    // Change the song every 5 minutes
    let refreshInterval = hasPlayedYet ? 4 * 60 * 1000 : 3000;
    let interval = setInterval(() => {
      console.log("Changing song");
      let rndIndex = Math.floor(Math.random() * musicList.length);
      while (rndIndex === currentBackgroundSongIndex) {
        rndIndex = Math.floor(Math.random() * musicList.length);
      }
      setCurrentBackgroundSongIndex(rndIndex);
    }, refreshInterval);
    return () => {
      clearInterval(interval);
    };
  }, [currentBackgroundSongIndex, hasPlayedYet]);

  const [hasLaunched, setHasLaunched] = useState(process.env.NEXT_PUBLIC_HAS_LAUNCHED === "true" || false);
  const [homeClickCount, setHomeClickCount] = useState(0);

  return (
    <div className="h-[100vh] w-[100vw] bg-[#fefdfb] flex flex-col align-center">
      <div className="Page__bg">
        <div className="w-[8rem] absolute top-0 left-0 m-2 cursor-pointer z-[20]">
          <div className="relative w-full h-full">
            <Image
              src={logo}
              alt="logo"
              className="w-full h-full object-contain"
              onClick={() => {
                let newCount = homeClickCount + 1;
                setHomeClickCount(newCount);
                if (newCount >= 3) {
                  setHasLaunched(true);
                }
                // TODO: window.location.href = '/';
              }}
            />
            <p className="text-md text-black absolute top-[45%] left-[65%]
              transform translate-x-[-50%] translate-y-[-50%] pointer-events-none
              ">3</p>
          </div>
        </div>
        <Routes>
          {hasLaunched && <Route path="/" element={<Canvas />} />}
          {!hasLaunched && <Route path="/" element={<Teaser />} />}
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
