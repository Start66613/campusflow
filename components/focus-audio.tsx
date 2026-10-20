import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { FocusTimer } from '@/src/focus-timer';
import { useApp } from '@/src/store';

const sounds = { rain: require('../assets/audio/soft-rain.wav'), wind: require('../assets/audio/soft-breeze.wav') };
export function FocusAudio({ timer, onError }: { timer: FocusTimer | null; onError: (message: string) => void }) {
  const { data } = useApp();
  const choice = data.settings.focusSound === 'rain' || data.settings.focusSound === 'wind' ? data.settings.focusSound : 'none';
  const rawVolume = data.settings.focusVolume;
  const volume = Math.max(0, Math.min(1, typeof rawVolume === 'number' && Number.isFinite(rawVolume) ? rawVolume : 0.25));
  const player = useAudioPlayer(null, { updateInterval: 1000 });
  const sourceRef = useRef('none');
  useEffect(() => {
    let active = true;
    if (choice === 'none' || timer?.status !== 'running' || timer.phase !== 'focus') {
      player.pause();
      if (Platform.OS !== 'web') player.setActiveForLockScreen(false);
      return;
    }
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).then(() => {
      if (!active) return;
      if (sourceRef.current !== choice) { player.replace(sounds[choice]); sourceRef.current = choice; }
      player.loop = true;
      player.volume = volume;
      if (Platform.OS !== 'web') player.setActiveForLockScreen(true, { title: 'CampusFlow · 专注环境音', artist: choice === 'rain' ? '轻雨 · 合成环境音' : '微风 · 合成环境音' });
      player.play();
    }).catch(() => { if (active) onError('环境音暂时未能播放，计时不受影响'); });
    return () => { active = false; };
  }, [choice, volume, timer?.status, timer?.phase, player, onError]);
  return null;
}
