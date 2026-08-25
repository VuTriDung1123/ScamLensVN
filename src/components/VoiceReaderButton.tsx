"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw } from "lucide-react";

interface VoiceReaderButtonProps {
  textToRead: string;
  title?: string;
}

export default function VoiceReaderButton({ textToRead, title = "Đọc to cho người lớn tuổi" }: VoiceReaderButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !("speechSynthesis" in window)) {
      setSupported(false);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || !textToRead) return null;

  const handleToggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;

    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
      return;
    }

    synth.cancel(); // stop any active speech

    const cleanText = textToRead.replace(/[*#_`]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95; // Slightly slower, clearer for elderly
    utterance.pitch = 1.0;

    // Try to pick a Vietnamese voice if available
    const voices = synth.getVoices();
    const viVoice = voices.find((v) => v.lang.includes("vi") || v.lang.includes("VN"));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl p-1 shadow-sm">
      <button
        onClick={handleToggleSpeak}
        title={title}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
          isPlaying
            ? isPaused
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 animate-pulse"
            : "text-slate-300 hover:text-white hover:bg-slate-700/60"
        }`}
      >
        {isPlaying ? (
          isPaused ? (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Tiếp tục nghe</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Tạm dừng đọc</span>
            </>
          )
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{title}</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          onClick={handleStop}
          title="Dừng phát âm thanh"
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer"
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
