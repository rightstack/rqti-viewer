"use client";

import React, { useCallback, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Theme } from "../types";

interface AudioPlayerProps {
  src: string;
  title?: string;
  theme?: Theme;
}

// function formatTime(seconds: number): string {
//   if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
//   const m = Math.floor(seconds / 60);
//   const s = Math.floor(seconds % 60);
//   return `${m}:${s.toString().padStart(2, "0")}`;
// }

export function AudioPlayer({ src, theme }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // const [currentTime, setCurrentTime] = useState(0);
  // const [duration, setDuration] = useState(0);

  // const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  // const handleTimeUpdate = useCallback(() => {
  //   const el = audioRef.current;
  //   if (el) setCurrentTime(el.currentTime);
  // }, []);

  // const handleLoadedMetadata = useCallback(() => {
  //   const el = audioRef.current;
  //   if (el) setDuration(el.duration);
  // }, []);

  // const handleEnded = useCallback(() => {
  //   setIsPlaying(false);
  //   setCurrentTime(0);
  // }, []);

  // const handleSeek = useCallback(
  //   (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const el = audioRef.current;
  //     const value = Number(e.target.value);
  //     if (el && Number.isFinite(value)) {
  //       const t = (value / 100) * duration;
  //       el.currentTime = t;
  //       setCurrentTime(t);
  //     }
  //   },
  //   [duration]
  // );

  // useEffect(() => {
  //   const el = audioRef.current;
  //   if (!el) return;
  //   el.addEventListener("timeupdate", handleTimeUpdate);
  //   el.addEventListener("loadedmetadata", handleLoadedMetadata);
  //   el.addEventListener("ended", handleEnded);
  //   return () => {
  //     el.removeEventListener("timeupdate", handleTimeUpdate);
  //     el.removeEventListener("loadedmetadata", handleLoadedMetadata);
  //     el.removeEventListener("ended", handleEnded);
  //   };
  // }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  const wrapperStyle: React.CSSProperties = {
    backgroundColor: theme?.containerConfig?.backgroundColor,
    borderColor: theme?.questionOptionConfig?.state?.selected?.borderColor,
    borderWidth: "2px",
    borderRadius: "50%",
    borderStyle: "solid",
  };

  // const progressTrackStyle: React.CSSProperties = {
  //   backgroundColor: "#dddddd",
  // };

  // const progressFillStyle: React.CSSProperties = {
  //   backgroundColor: theme?.questionOptionConfig?.state?.selected?.borderColor,
  // };

  const controlStyle: React.CSSProperties = {
    color: theme?.questionOptionConfig?.state?.selected?.borderColor,
  };

  // const textStyle: React.CSSProperties = {
  //   color: theme?.questionOptionConfig?.state?.selected?.borderColor,
  // };

  return (
    <div className="qti-ext-audio-player rtqi:flex rtqi:flex-col rtqi:items-start rtqi:gap-3">
      <div className="rtqi:inline-flex rtqi:w-fit rtqi:items-center rtqi:justify-center rtqi:p-1" style={wrapperStyle}>
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          controlsList="nodownload"
          className="qti-ext-audio"
        >
          <track kind="captions" />
        </audio>
        <button
          type="button"
          aria-label={isPlaying ? "일시정지" : "재생"}
          onClick={togglePlay}
          className="rtqi:flex rtqi:h-10 rtqi:w-10 rtqi:shrink-0 rtqi:items-center rtqi:justify-center rtqi:rounded-full"
          style={controlStyle}
        >
          {isPlaying ? (
            <Pause
              className="rtqi:h-5 rtqi:w-5"
              style={controlStyle}
              fill={theme?.questionOptionConfig?.state?.selected?.borderColor}
            />
          ) : (
            <Play
              className="rtqi:h-5 rtqi:w-5"
              style={controlStyle}
              fill={theme?.questionOptionConfig?.state?.selected?.borderColor}
            />
          )}
        </button>
      </div>
      {/* <div className="rtqi:flex rtqi:items-center rtqi:gap-3">
        <div className="rtqi:min-w-0 rtqi:flex-1">
          <div
            className="rtqi:relative rtqi:h-2 rtqi:w-full rtqi:overflow-hidden rtqi:rounded-full"
            style={progressTrackStyle}
          >
            <div
              className="rtqi:absolute rtqi:inset-y-0 rtqi:left-0 rtqi:rounded-full"
              style={{ ...progressFillStyle, width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={handleSeek}
              className="rtqi:absolute rtqi:inset-0 rtqi:h-full rtqi:w-full rtqi:cursor-pointer rtqi:opacity-0"
              aria-label="재생 위치"
            />
          </div>
        </div>
        <div className="rtqi:flex rtqi:items-center rtqi:justify-between rtqi:gap-2">
          {title !== null && title !== "" ? (
            <span className="rtqi:min-w-0 rtqi:truncate rtqi:text-sm" style={textStyle}>
              {title}
            </span>
          ) : (
            <span />
          )}
          <span className="rtqi:shrink-0 rtqi:text-sm rtqi:tabular-nums" style={textStyle}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div> */}
    </div>
  );
}

export default AudioPlayer;
