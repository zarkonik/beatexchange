import { useState, useRef } from "react";
import { ipfsToUrl } from "../../services/pinata";
import "./AudioPlayer.css";

interface AudioPlayerProps {
  ipfsHash: string;
}

export default function AudioPlayer({ ipfsHash }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  console.log("Audio URL:", ipfsToUrl(ipfsHash));
  if (hasError) {
    return (
      <div className="audio-player">
        <p className="player-error">⚠ Could not load audio</p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      {/* Hidden HTML5 audio element */}
      <audio
        ref={audioRef}
        src={ipfsToUrl(ipfsHash)}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0);
          setIsLoading(false);
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {isLoading ? (
        <p className="player-loading">⏳ Loading audio...</p>
      ) : (
        <div className="player-controls">
          {/* Play/Pause button */}
          <button className="btn-play" onClick={togglePlay}>
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Time */}
          <span className="player-time">{formatTime(currentTime)}</span>

          {/* Seek bar */}
          <input
            className="seek-bar"
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
          />

          {/* Duration */}
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
