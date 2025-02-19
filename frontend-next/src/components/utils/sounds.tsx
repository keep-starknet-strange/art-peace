'use client';

// Import from browser storage
export let soundEffectVolume = typeof window !== "undefined" && window.localStorage.getItem("artPeaceSoundEffectVolume") ? parseFloat(window.localStorage.getItem("artPeaceSoundEffectVolume") as unknown as any) : 1;
export const setSoundEffectVolume = (volume: number) => {
  soundEffectVolume = volume;
  window.localStorage.setItem("artPeaceSoundEffectVolume", volume.toString());
}
export const getSoundEffectVolume = () => soundEffectVolume;

export let musicVolume = typeof window !== "undefined" && window.localStorage.getItem("artPeaceMusicVolume") ? parseFloat(window.localStorage.getItem("artPeaceMusicVolume") as unknown as any) : 1;
export const setMusicVolume = (volume: number) => {
  musicVolume = volume;
  window.localStorage.setItem("artPeaceMusicVolume", volume.toString());
}
export const getMusicVolume = () => musicVolume;

const softClick = typeof Audio !== "undefined" ? new Audio("/sounds/soft-click.wav") : null;
export const playSoftClick = () => {
  if (!softClick) return;
  softClick.currentTime = 0;
  softClick.volume = 0.5 * soundEffectVolume;
  softClick.playbackRate = Math.random() * 0.5 + 0.75;
  softClick.play();
}

const softClick2 = typeof Audio !== "undefined" ? new Audio("/sounds/soft-click-2.wav") : null;
export const playSoftClick2 = () => {
  if (!softClick2) return;
  softClick2.currentTime = 0;
  softClick2.volume = 0.6 * soundEffectVolume;
  softClick2.playbackRate = Math.random() * 0.5 + 0.75;
  softClick2.play();
}

const pixelPlaced = typeof Audio !== "undefined" ? new Audio("/sounds/click.wav") : null;
export const playPixelPlaced = () => {
  if (!pixelPlaced) return;
  pixelPlaced.currentTime = 0;
  pixelPlaced.volume = 0.3 * soundEffectVolume;
  pixelPlaced.playbackRate = Math.random() * 0.5 + 0.75;
  pixelPlaced.play();
}

const pixelPlaced2 = typeof Audio !== "undefined" ? new Audio("/sounds/click-2.wav") : null;
export const playPixelPlaced2 = () => {
  if (!pixelPlaced2) return;
  pixelPlaced2.currentTime = 0;
  pixelPlaced2.volume = 0.3 * soundEffectVolume;
  pixelPlaced2.playbackRate = Math.random() * 0.5 + 0.75;
  pixelPlaced2.play();
}

const shutter = typeof Audio !== "undefined" ? new Audio("/sounds/shutter.wav") : null;
export const playShutter = () => {
  if (!shutter) return;
  shutter.currentTime = 0;
  shutter.volume = 0.5 * soundEffectVolume;
  shutter.playbackRate = Math.random() * 0.5 + 0.75;
  shutter.play();
}

const notification = typeof Audio !== "undefined" ? new Audio("/sounds/notif.wav") : null;
const notifDelay = 1000;
let lastNotif = 0;
export const playNotification = () => {
  if (!notification) return;
  if (Date.now() - lastNotif < notifDelay) return;
  lastNotif = Date.now();
  notification.currentTime = 0;
  notification.volume = 0.15 * soundEffectVolume;
  notification.playbackRate = Math.random() * 0.5 + 0.75;
  notification.play();
}
