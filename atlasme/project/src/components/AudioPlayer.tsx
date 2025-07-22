import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  muted: boolean;
  volume: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ muted, volume }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
      audioRef.current.volume = volume / 100;
    }
  }, [muted, volume]);

  return (
    <audio
      ref={audioRef}
      src="/muzik.mp3"
      loop
      autoPlay
      muted={muted}
      style={{ display: 'none' }}
    />
  );
};