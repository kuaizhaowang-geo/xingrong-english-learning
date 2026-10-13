import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Play, Pause, Music, Volume2, VolumeX,
  Repeat, RotateCcw, Mic, Music2, Radio, SkipBack, SkipForward,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { preschoolApi } from '@client/src/api';
import type { PreschoolSong, PreschoolSongDetail } from '@client/src/api/preschool';
import { getSongAudio } from './songAudioResources';

interface SongsViewProps {
  onBack: () => void;
  addStar: () => void;
}

const formatTime = (sec: number): string => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

type PlayMode = 'song' | 'songLyrics' | 'follow';

const PLAY_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

const SongsView: React.FC<SongsViewProps> = ({ onBack, addStar }) => {
  const [songs, setSongs] = useState<PreschoolSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<PreschoolSongDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.7);
  const [speedIdx, setSpeedIdx] = useState<number>(2);
  const [loop, setLoop] = useState<boolean>(false);
  const [mode, setMode] = useState<PlayMode>('songLyrics');
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [showActions, setShowActions] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [loadingAudio, setLoadingAudio] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const ttsLineIdxRef = useRef<number>(0);

  const lyrics = selectedSong?.lyrics ?? [];
  const songAudio = selectedSong ? getSongAudio(selectedSong.title) : null;
  const mp3Url = selectedSong?.audioUrl || (songAudio?.type === 'mp3' ? songAudio.url : undefined);
  const isTtsOnly = !mp3Url;

  useEffect(() => {
    let mounted = true;
    preschoolApi.getSongs().then((data: PreschoolSong[]) => {
      if (mounted) {
        setSongs(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = PLAY_SPEEDS[speedIdx];
    }
  }, [speedIdx]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  const loadSong = (id: string): void => {
    setLoading(true);
    stopAll();
    preschoolApi.getSong(id).then((data: PreschoolSongDetail) => {
      setSelectedSong(data);
      setCurrentLine(0);
      setCurrentTime(0);
      setDuration(0);
      setLoadError(false);
      setLoading(false);
      if (lyricsContainerRef.current) {
        lyricsContainerRef.current.scrollTop = 0;
      }
    }).catch(() => setLoading(false));
  };

  const stopAll = (): void => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {
        // ignore
      }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const playMp3 = (): void => {
    if (!audioRef.current || !mp3Url) return;
    setLoadError(false);
    setLoadingAudio(true);
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      addStar();
      setLoadingAudio(false);
    }).catch((err) => {
      logger.error('audio play error: ' + String(err));
      setLoadError(true);
      setLoadingAudio(false);
      setIsPlaying(false);
    });
  };

  const playTtsLine = (idx: number): void => {
    if (!selectedSong || idx >= selectedSong.lyrics.length) {
      setIsPlaying(false);
      return;
    }
    ttsLineIdxRef.current = idx;
    setCurrentLine(idx);
    const line = selectedSong.lyrics[idx];
    try {
      const utter = new SpeechSynthesisUtterance(line.en);
      utter.lang = 'en-US';
      utter.rate = Math.max(0.4, PLAY_SPEEDS[speedIdx] * 0.85);
      utter.pitch = 1.15;
      utter.onend = () => {
        if (ttsLineIdxRef.current !== idx) return; // cancelled or jumped
        setTimeout(() => {
          const next = idx + 1;
          if (next >= selectedSong.lyrics.length) {
            if (loop) {
              playTtsLine(0);
            } else {
              setIsPlaying(false);
            }
          } else {
            playTtsLine(next);
          }
        }, 600);
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      logger.error('tts play error: ' + String(e));
    }
  };

  const handlePlay = (): void => {
    if (!selectedSong) return;
    if (isPlaying) {
      stopAll();
    } else {
      if (isTtsOnly) {
        playTtsLine(currentLine);
        setIsPlaying(true);
        addStar();
      } else {
        playMp3();
      }
    }
  };

  const handleTimeUpdate = (): void => {
    if (!audioRef.current) return;
    const ct = audioRef.current.currentTime;
    setCurrentTime(ct);
    if (lyrics.length === 0) return;
    let idx = 0;
    const hasTimestamp = typeof (lyrics[0] as any).timestamp === 'number';
    if (hasTimestamp) {
      for (let i = 0; i < lyrics.length; i++) {
        const ts = (lyrics[i] as any).timestamp ?? 0;
        if (ct >= ts) idx = i;
        else break;
      }
    } else if (duration > 0) {
      idx = Math.min(lyrics.length - 1, Math.floor((lyrics.length * ct) / duration));
    }
    if (idx !== currentLine) {
      setCurrentLine(idx);
      scrollToLine(idx);
    }
  };

  const scrollToLine = (idx: number): void => {
    const container = lyricsContainerRef.current;
    if (!container) return;
    const lineEl = container.querySelector<HTMLElement>(`[data-line-idx="${idx}"]`);
    if (!lineEl) return;
    const containerTop = container.scrollTop;
    const containerH = container.clientHeight;
    const lineTop = lineEl.offsetTop;
    const lineH = lineEl.offsetHeight;
    const target = lineTop - containerH / 2 + lineH / 2;
    container.scrollTo({ top: target, behavior: 'smooth' });
  };

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleError = (): void => {
    setLoadError(true);
    setLoadingAudio(false);
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = Number(e.target.value);
    if (isTtsOnly) {
      // TTS: jump to line
      if (lyrics.length > 0) {
        const idx = Math.min(lyrics.length - 1, Math.floor((lyrics.length * v) / Math.max(1, ttsEstimatedDuration())));
        jumpToLine(idx);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = v;
    }
  };

  const ttsEstimatedDuration = (): number => {
    return Math.max(1, lyrics.length * 2.5 / PLAY_SPEEDS[speedIdx]);
  };

  const hasKtvTimestamps = (): boolean => {
    return lyrics.length > 0 && typeof (lyrics[0] as any).timestamp === 'number';
  };

  const jumpToLine = (idx: number): void => {
    if (!selectedSong) return;
    if (isTtsOnly) {
      window.speechSynthesis.cancel();
      ttsLineIdxRef.current = idx;
      setCurrentLine(idx);
      if (isPlaying) {
        playTtsLine(idx);
      } else {
        // preview the line
        try {
          const utter = new SpeechSynthesisUtterance(selectedSong.lyrics[idx].en);
          utter.lang = 'en-US';
          utter.rate = Math.max(0.4, PLAY_SPEEDS[speedIdx] * 0.85);
          utter.pitch = 1.15;
          window.speechSynthesis.speak(utter);
        } catch (e) {
          // ignore
        }
      }
    } else if (audioRef.current && (duration > 0 || hasKtvTimestamps())) {
      const ts = (lyrics[idx] as any)?.timestamp;
      const t = typeof ts === 'number' ? ts : (idx / lyrics.length) * duration;
      audioRef.current.currentTime = t;
      setCurrentLine(idx);
      scrollToLine(idx);
    }
  };

  const handleLineClick = (idx: number): void => {
    jumpToLine(idx);
  };

  const handleSpeedChange = (): void => {
    const nextIdx = (speedIdx + 1) % PLAY_SPEEDS.length;
    setSpeedIdx(nextIdx);
  };

  const handlePrev = (): void => {
    if (isTtsOnly) {
      const newIdx = Math.max(0, currentLine - 1);
      jumpToLine(newIdx);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const handleNext = (): void => {
    if (isTtsOnly) {
      const newIdx = Math.min(lyrics.length - 1, currentLine + 1);
      jumpToLine(newIdx);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
    }
  };

  const handleModeChange = (m: PlayMode): void => {
    setMode(m);
  };

  const handleBack = (): void => {
    stopAll();
    setSelectedSong(null);
  };

  const handleRetry = (): void => {
    setLoadError(false);
    if (audioRef.current && mp3Url) {
      audioRef.current.load();
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handleEnded = (): void => {
    if (!loop) {
      setIsPlaying(false);
      setCurrentLine(0);
    }
  };

  const totalDisplayDuration = isTtsOnly ? ttsEstimatedDuration() : duration;

  if (loading) {
    return <div className="flex items-center justify-center h-full text-2xl text-purple-500">加载中...</div>;
  }

  if (selectedSong) {
    return (
      <div className="p-3 sm:p-4 space-y-3 flex flex-col h-full max-h-screen overflow-hidden">
        {mp3Url && (
          <audio
            ref={audioRef}
            src={mp3Url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={handleError}
            onPlay={() => { setIsPlaying(true); setLoadError(false); setLoadingAudio(false); }}
            onPause={() => setIsPlaying(false)}
            preload="metadata"
          />
        )}

        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-purple-600 font-bold text-sm"
        >
          <ArrowLeft size={18} /> 返回列表
        </button>

        <div className={`rounded-2xl p-4 sm:p-5 text-white shadow-lg text-center shrink-0 ${
          isTtsOnly
            ? 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400'
            : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
        }`}>
          <Music size={36} className="mx-auto mb-1" />
          <h2 className="text-lg font-bold leading-tight">{selectedSong.title}</h2>
          <p className="text-white/80 text-sm mt-0.5">{selectedSong.titleCn}</p>
          <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {isTtsOnly ? (
              <><Radio size={12} /> TTS朗读版</>
            ) : (
              <><Music2 size={12} /> 真人演唱</>
            )}
          </div>
        </div>

        {loadError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-sm text-red-300">
             <AlertCircle size={18} className="text-red-400 shrink-0" />
             <div className="flex-1 min-w-0">
               <div className="font-bold">音频加载失败</div>
               <div className="text-xs text-red-400">网络问题导致无法播放，已自动降级为朗读模式</div>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
            >
              <RefreshCw size={14} /> 重试
            </button>
          </div>
        )}

         <div className="bg-white/10 rounded-2xl p-3 sm:p-4 shadow-md space-y-2 shrink-0">
          <div className="flex items-center gap-2">
             <span className="text-xs text-slate-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0.1, totalDisplayDuration)}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-purple-500 h-2 cursor-pointer"
            />
             <span className="text-xs text-slate-400 w-10 text-left">
              {formatTime(totalDisplayDuration)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setVolume((v) => (v > 0 ? 0 : 0.7))}
              className="text-purple-500 p-1.5"
              aria-label="音量"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 sm:w-20 accent-purple-500"
            />

            <button
              onClick={handleSpeedChange}
               className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold border border-purple-500/30"
            >
              {PLAY_SPEEDS[speedIdx]}x
            </button>

            <button
              onClick={() => setLoop((l) => !l)}
               className={`p-1.5 rounded-lg ${loop ? 'text-orange-400 bg-orange-500/20' : 'text-slate-500'}`}
              aria-label="循环"
            >
              <Repeat size={18} />
            </button>

            <button
              onClick={() => setShowActions((s) => !s)}
               className={`p-1.5 rounded-lg ${showActions ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-500'}`}
              aria-label="动作提示"
            >
              <RotateCcw size={18} />
            </button>
          </div>

           <div className="flex gap-1 bg-purple-500/10 rounded-xl p-1">
            {([
              { key: 'song', label: '听歌', icon: Music2 },
              { key: 'songLyrics', label: '边听边看', icon: Music },
              { key: 'follow', label: '跟唱', icon: Mic },
            ] as { key: PlayMode; label: string; icon: React.ComponentType<{ size: number }> }[]).map((m) => (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                   mode === m.key ? 'bg-purple-500 text-white shadow' : 'text-purple-300'
                }`}
              >
                <m.icon size={14} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

         <div ref={lyricsContainerRef} className="flex-1 bg-white/5 rounded-2xl p-3 shadow-md overflow-y-auto min-h-0 scroll-smooth">
          <div className="space-y-3 py-4">
            {selectedSong.lyrics.map((line, idx: number) => {
              const isCurrent = currentLine === idx && isPlaying;
              const isPast = idx < currentLine;
              const isFuture = idx > currentLine;
              return (
                <div
                  key={idx}
                  data-line-idx={idx}
                  onClick={() => handleLineClick(idx)}
                  className={`py-3 px-2 rounded-xl transition-all duration-500 cursor-pointer text-center ${
                     isCurrent
                       ? 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 scale-105 shadow-lg shadow-orange-500/20'
                      : isPast
                        ? 'opacity-60'
                        : 'opacity-35'
                  }`}
                >
                  <div className={`text-lg font-bold transition-all duration-300 ${
                       isCurrent
                         ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251_146_60_0.5)]'
                         : isPast
                           ? 'text-slate-300'
                           : 'text-slate-500'
                  }`}>
                    {line.en}
                  </div>
                  <div className={`text-xs mt-1 transition-all duration-300 ${
                     isCurrent ? 'text-orange-400' : isPast ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {line.cn}
                  </div>
                  {line.highlight && line.highlight.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
                      {line.highlight.map((w: string, hi: number) => (
                        <span key={hi} className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                           isCurrent
                             ? 'bg-orange-500/30 text-orange-200'
                             : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 shrink-0">
          <button
            onClick={handlePrev}
             className="w-12 h-12 rounded-full bg-white/10 text-purple-400 flex items-center justify-center shadow-md active:scale-90 transition-transform border border-white/10"
            aria-label="上一句/后退5秒"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={handlePlay}
            disabled={loadingAudio}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform ${
              isPlaying || loadingAudio
                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white'
                 : 'bg-white/10 text-purple-400 border border-white/10'
            } ${loadingAudio ? 'opacity-60' : ''}`}
          >
            {loadingAudio ? <RefreshCw size={24} className="animate-spin" /> :
              isPlaying ? <Pause size={30} /> : <Play size={30} className="ml-1" />}
          </button>
          <button
            onClick={handleNext}
             className="w-12 h-12 rounded-full bg-white/10 text-purple-400 flex items-center justify-center shadow-md active:scale-90 transition-transform border border-white/10"
            aria-label="下一句/快进5秒"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {showActions && selectedSong.actions && selectedSong.actions.length > 0 && (
           <div className="bg-yellow-500/10 rounded-xl p-3 shrink-0 border border-yellow-500/20">
             <h4 className="font-bold text-yellow-300 text-sm mb-1">🎭 动作提示</h4>
             <ul className="text-xs text-yellow-200/80 space-y-0.5">
              {selectedSong.actions.map((a: string, idx: number) => (
                <li key={idx}>• {a}</li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'follow' && isPlaying && (
           <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-3 text-center shrink-0 border border-emerald-500/20">
             <Mic size={20} className="mx-auto text-emerald-400 mb-1" />
             <p className="text-xs text-emerald-300 font-bold">跟着音乐一起唱吧！🎤</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {songs.map((song: PreschoolSong, idx: number) => {
          const hasRealAudio = !!song.audioUrl;
          return (
            <button
              key={song.id}
              onClick={() => loadSong(song.id)}
               className="w-full flex items-center gap-3 glass-card p-4 shadow-md active:scale-95 transition-transform text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="font-bold text-white truncate">{song.title}</div>
                 <div className="text-sm text-slate-400 truncate">{song.titleCn}</div>
                <div className="flex flex-wrap gap-1 mt-1 items-center">
                  {hasRealAudio ? (
                     <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-500/30">
                      🎵 真人演唱
                    </span>
                  ) : (
                     <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-500/30">
                      🎙 TTS朗读
                    </span>
                  )}
                  {song.keyWords && song.keyWords.slice(0, 2).map((kw: string, ki: number) => (
                     <span key={ki} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs border border-purple-500/30">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
               <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0 border border-purple-500/30">
                <Play size={16} className="ml-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SongsView;
