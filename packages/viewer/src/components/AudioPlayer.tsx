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
    <div className="qti-ext-audio-player rqti:flex rqti:flex-col rqti:items-start rqti:gap-3">
      <div className="rqti:inline-flex rqti:w-fit rqti:items-center rqti:justify-center rqti:p-1" style={wrapperStyle}>
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
          className="rqti:flex rqti:h-10 rqti:w-10 rqti:shrink-0 rqti:items-center rqti:justify-center rqti:rounded-full"
          style={controlStyle}
        >
          {isPlaying ? (
            <Pause
              className="rqti:h-5 rqti:w-5"
              style={controlStyle}
              fill={theme?.questionOptionConfig?.state?.selected?.borderColor}
            />
          ) : (
            <Play
              className="rqti:h-5 rqti:w-5"
              style={controlStyle}
              fill={theme?.questionOptionConfig?.state?.selected?.borderColor}
            />
          )}
        </button>
      </div>
      {/* <div className="rqti:flex rqti:items-center rqti:gap-3">
        <div className="rqti:min-w-0 rqti:flex-1">
          <div
            className="rqti:relative rqti:h-2 rqti:w-full rqti:overflow-hidden rqti:rounded-full"
            style={progressTrackStyle}
          >
            <div
              className="rqti:absolute rqti:inset-y-0 rqti:left-0 rqti:rounded-full"
              style={{ ...progressFillStyle, width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={handleSeek}
              className="rqti:absolute rqti:inset-0 rqti:h-full rqti:w-full rqti:cursor-pointer rqti:opacity-0"
              aria-label="재생 위치"
            />
          </div>
        </div>
        <div className="rqti:flex rqti:items-center rqti:justify-between rqti:gap-2">
          {title !== null && title !== "" ? (
            <span className="rqti:min-w-0 rqti:truncate rqti:text-sm" style={textStyle}>
              {title}
            </span>
          ) : (
            <span />
          )}
          <span className="rqti:shrink-0 rqti:text-sm rqti:tabular-nums" style={textStyle}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div> */}
    </div>
  );
}

export default AudioPlayer;
