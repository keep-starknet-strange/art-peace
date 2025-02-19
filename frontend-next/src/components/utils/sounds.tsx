// Import from browser storage
export let soundEffectVolume = localStorage.getItem("artPeaceSoundEffectVolume") ? parseFloat(localStorage.getItem("artPeaceSoundEffectVolume") as unknown as any) : 1;
export const setSoundEffectVolume = (volume: number) => {
  soundEffectVolume = volume;
  localStorage.setItem("artPeaceSoundEffectVolume", volume.toString());
}
export const getSoundEffectVolume = () => soundEffectVolume;

export let musicVolume = localStorage.getItem("artPeaceMusicVolume") ? parseFloat(localStorage.getItem("artPeaceMusicVolume") as unknown as any) : 1;
export const setMusicVolume = (volume: number) => {
  musicVolume = volume;
  localStorage.setItem("artPeaceMusicVolume", volume.toString());
}
export const getMusicVolume = () => musicVolume;

const softClick = new Audio("/sounds/soft-click.wav")
export const playSoftClick = () => {
  softClick.currentTime = 0;
  softClick.volume = 0.5 * soundEffectVolume;
  softClick.playbackRate = Math.random() * 0.5 + 0.75;
  softClick.play();
}

const softClick2 = new Audio("/sounds/soft-click-2.wav")
export const playSoftClick2 = () => {
  softClick2.currentTime = 0;
  softClick2.volume = 0.6 * soundEffectVolume;
  softClick2.playbackRate = Math.random() * 0.5 + 0.75;
  softClick2.play();
}

const pixelPlaced = new Audio("/sounds/click.wav")
export const playPixelPlaced = () => {
  pixelPlaced.currentTime = 0;
  pixelPlaced.volume = 0.3 * soundEffectVolume;
  pixelPlaced.playbackRate = Math.random() * 0.5 + 0.75;
  pixelPlaced.play();
}

const pixelPlaced2 = new Audio("/sounds/click-2.wav")
export const playPixelPlaced2 = () => {
  pixelPlaced2.currentTime = 0;
  pixelPlaced2.volume = 0.3 * soundEffectVolume;
  pixelPlaced2.playbackRate = Math.random() * 0.5 + 0.75;
  pixelPlaced2.play();
}

const shutter = new Audio("/sounds/shutter.wav")
export const playShutter = () => {
  shutter.currentTime = 0;
  shutter.volume = 0.5 * soundEffectVolume;
  shutter.playbackRate = Math.random() * 0.5 + 0.75;
  shutter.play();
}

const notification = new Audio("/sounds/notif.wav")
export const playNotification = () => {
  notification.currentTime = 0;
  notification.volume = 0.15 * soundEffectVolume;
  notification.playbackRate = Math.random() * 0.5 + 0.75;
  notification.play();
}
