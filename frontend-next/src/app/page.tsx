'use client';

import Image from 'next/image';
import { StrictMode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

import { StarknetProvider } from "../components/StarknetProvider";
import { usePreventZoom } from './window';
import { playSoftClick2, getMusicVolume } from '../components/utils/sounds';
// TODO: Proper routing here
import Canvas from "../screens/canvas";
import Teaser from "../screens/teaser";

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
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  useEffect(() => {
    const playSong = async () => {
      if (currentBackgroundSong) {
        currentBackgroundSong.pause();
      }
      const audio = new Audio(musicList[currentBackgroundSongIndex]);
      audio.loop = false;
      audio.volume = 0.25 * getMusicVolume();
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
  useEffect(() => {
    let rndIndex = Math.floor(Math.random() * musicList.length);
    while (rndIndex === currentBackgroundSongIndex) {
      rndIndex = Math.floor(Math.random() * musicList.length);
    }
    setCurrentBackgroundSongIndex(rndIndex);
  }, [isMusicMuted]);

  const [hasPlayedYet, setHasPlayedYet] = useState(false);
  useEffect(() => {
    // Change the song every 5 minutes
    const refreshInterval = hasPlayedYet ? 4 * 60 * 1000 : 3000;
    const interval = setInterval(() => {
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

  const [homeClicked, setHomeClicked] = useState(false);
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
                playSoftClick2();
                setHomeClicked(true);
                // TODO: window.location.href = '/';
              }}
            />
            <p className="text-md text-black absolute top-[45%] left-[65%]
              transform translate-x-[-50%] translate-y-[-50%] pointer-events-none
              ">3</p>
          </div>
        </div>
        <Canvas setIsMusicMuted={setIsMusicMuted} homeClicked={homeClicked} setHomeClicked={setHomeClicked} />
      </div>
    </div>
  );
}
// TODO
// <BrowserRouter>
// <Routes>
//   {hasLaunched && <Route path="/" element={<Canvas />} />}
//   {!hasLaunched && <Route path="/" element={<Teaser />} />}
// </Routes>

export default function Home() {
  return (
    <StrictMode>
      <StarknetProvider>
        <App />
      </StarknetProvider>
    </StrictMode>
  );
}
