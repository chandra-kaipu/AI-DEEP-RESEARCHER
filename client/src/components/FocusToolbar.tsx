import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Waves,
  Brain,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { FocusModeState, FocusSoundType } from '../types';
import { soundscape } from '../utils/soundscape';

interface FocusToolbarProps {
  focusState: FocusModeState;
  onUpdateFocusState: (updater: (prev: FocusModeState) => FocusModeState) => void;
  onExitFocus: () => void;
}

export const FocusToolbar: React.FC<FocusToolbarProps> = ({
  focusState,
  onUpdateFocusState,
  onExitFocus,
}) => {
  // Timer countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (focusState.isActive && focusState.isRunning && focusState.remainingSeconds > 0) {
      interval = setInterval(() => {
        onUpdateFocusState((prev) => {
          if (prev.remainingSeconds <= 1) {
            // Timer expired!
            soundscape.playChime();
            const nextMode = prev.timerMode === 'work' ? 'break' : 'work';
            const nextDuration = nextMode === 'work' ? prev.workDurationMinutes * 60 : prev.breakDurationMinutes * 60;
            return {
              ...prev,
              timerMode: nextMode,
              remainingSeconds: nextDuration,
              isRunning: false,
            };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusState.isActive, focusState.isRunning, focusState.remainingSeconds, onUpdateFocusState]);

  // Keep soundscape in sync with state
  useEffect(() => {
    if (!focusState.isActive) {
      soundscape.stop();
      return;
    }

    if (focusState.soundType === 'none' || focusState.isMuted) {
      soundscape.stop();
    } else {
      soundscape.play(focusState.soundType, focusState.volume);
    }
  }, [focusState.isActive, focusState.soundType, focusState.isMuted, focusState.volume]);

  const toggleTimer = () => {
    onUpdateFocusState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    const duration =
      focusState.timerMode === 'work'
        ? focusState.workDurationMinutes * 60
        : focusState.breakDurationMinutes * 60;
    onUpdateFocusState((prev) => ({ ...prev, remainingSeconds: duration, isRunning: false }));
  };

  const switchMode = (mode: 'work' | 'break') => {
    const duration =
      mode === 'work'
        ? focusState.workDurationMinutes * 60
        : focusState.breakDurationMinutes * 60;
    onUpdateFocusState((prev) => ({
      ...prev,
      timerMode: mode,
      remainingSeconds: duration,
      isRunning: false,
    }));
  };

  const setSound = (type: FocusSoundType) => {
    onUpdateFocusState((prev) => ({
      ...prev,
      soundType: type,
      isMuted: false,
    }));
  };

  const toggleMute = () => {
    onUpdateFocusState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const changeVolume = (newVol: number) => {
    onUpdateFocusState((prev) => ({ ...prev, volume: newVol, isMuted: false }));
  };

  // Format time MM:SS
  const mins = Math.floor(focusState.remainingSeconds / 60);
  const secs = focusState.remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const soundPresets: { id: FocusSoundType; label: string; icon: any }[] = [
    { id: 'none', label: 'Silence', icon: VolumeX },
    { id: 'brown', label: 'Ocean Brown', icon: Waves },
    { id: 'pink', label: 'Rain Pink', icon: Waves },
    { id: 'white', label: 'White Static', icon: Sparkles },
    { id: 'binaural', label: '40Hz Gamma Focus', icon: Brain },
  ];

  return (
    <aside
      aria-label="Zen Focus Toolbar"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-paper-surface/95 dark:bg-[#1A2024]/95 backdrop-blur-xl border border-paper-line shadow-2xl rounded-2xl p-2.5 sm:px-5 sm:py-3 transition-all duration-300 animate-in slide-in-from-top-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Zen Status & Mode Badge */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-sm font-bold text-paper-text tracking-tight">
                Zen Focus Mode
              </span>
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-sage animate-ping" />
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-paper-text-dim">
              <button
                onClick={() => switchMode('work')}
                className={`font-medium transition-colors ${
                  focusState.timerMode === 'work' ? 'text-terracotta font-bold' : 'hover:text-paper-text'
                }`}
              >
                Deep Work (25m)
              </button>
              <span>&bull;</span>
              <button
                onClick={() => switchMode('break')}
                className={`font-medium transition-colors ${
                  focusState.timerMode === 'break' ? 'text-sage font-bold' : 'hover:text-paper-text'
                }`}
              >
                Refresh Break (5m)
              </button>
            </div>
          </div>
        </div>

        {/* Center: Pomodoro Timer Display & Controls */}
        <div className="flex items-center space-x-3 bg-paper-surface-2 px-3 py-1.5 rounded-xl border border-paper-line shadow-inner">
          <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-paper-text min-w-[70px] text-center">
            {timeFormatted}
          </span>

          <button
            onClick={toggleTimer}
            title={focusState.isRunning ? 'Pause Timer' : 'Start Focus Session'}
            className="w-8 h-8 rounded-lg bg-terracotta text-white flex items-center justify-center hover:bg-terracotta-600 transition shadow-sm"
          >
            {focusState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={resetTimer}
            title="Reset Timer"
            className="p-1.5 rounded-lg text-paper-text-dim hover:text-paper-text hover:bg-paper-surface transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Soundscape Controls & Exit Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Sound Preset Picker */}
          <div className="relative">
            <select
              value={focusState.soundType}
              onChange={(e) => setSound(e.target.value as FocusSoundType)}
              className="text-xs bg-paper-surface-2 border border-paper-line rounded-lg px-2.5 py-1.5 text-paper-text font-medium focus:outline-none focus:ring-1 focus:ring-terracotta pr-7 cursor-pointer"
            >
              {soundPresets.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Control */}
          {focusState.soundType !== 'none' && (
            <div className="hidden sm:flex items-center space-x-1.5 bg-paper-surface-2 px-2 py-1 rounded-lg border border-paper-line">
              <button
                onClick={toggleMute}
                className="text-paper-text-dim hover:text-paper-text transition"
                title={focusState.isMuted ? 'Unmute' : 'Mute'}
              >
                {focusState.isMuted || focusState.volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-terracotta" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-sage" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={focusState.isMuted ? 0 : focusState.volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-paper-line rounded-lg appearance-none cursor-pointer accent-terracotta"
              />
            </div>
          )}

          {/* Exit Focus Mode Button */}
          <button
            onClick={onExitFocus}
            title="Exit Zen Focus Mode (Esc or Alt+F)"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-paper-surface hover:bg-paper-surface-2 border border-paper-line text-xs font-semibold text-paper-text transition"
          >
            <span>Exit Zen</span>
            <span className="hidden md:inline-block text-[10px] text-paper-text-dim font-mono ml-1">
              (Alt+F)
            </span>
            <X className="w-3.5 h-3.5 ml-1 text-paper-text-dim" />
          </button>
        </div>
      </div>
    </aside>
  );
};
