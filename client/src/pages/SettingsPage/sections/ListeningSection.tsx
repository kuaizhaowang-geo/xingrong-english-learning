import React from 'react';
import { Headphones, Repeat, Timer, FastForward, PlayCircle } from 'lucide-react';
import { Slider } from '@client/src/components/ui/slider';
import { Switch } from '@client/src/components/ui/switch';
import { useSettingsStore } from '../store/settingsStore';

const ListeningSection: React.FC = () => {
  const { listening, setListening } = useSettingsStore();

  return (
    <div className="space-y-5">
      {/* 播放次数 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <h3 className="text-base font-semibold text-white">播放次数</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">每道听力题自动播放的次数</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() =>
              setListening({ playCount: Math.max(1, listening.playCount - 1) })
            }
             className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 transition-all hover:scale-105 hover:bg-white/10"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            −
          </button>
          <div
            className="w-24 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#818CF8',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.12)',
            }}
          >
            {listening.playCount} <span className="text-sm font-normal ml-1">次</span>
          </div>
           <button
            onClick={() =>
              setListening({ playCount: Math.min(5, listening.playCount + 1) })
            }
             className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 transition-all hover:scale-105 hover:bg-white/10"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* 播放间隔 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-5 h-5" style={{ color: '#60A5FA' }} />
          <h3 className="text-base font-semibold text-white">播放间隔</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">两次播放间隔</span>
            <span className="text-sm font-semibold" style={{ color: '#60A5FA' }}>
              {listening.playInterval} 秒
            </span>
          </div>
          <div className="px-1">
            <Slider
              value={[listening.playInterval]}
              min={1}
              max={5}
              step={1}
              onValueChange={(vals: number[]) =>
                setListening({ playInterval: vals[0] })
              }
               className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-blue-500 [&_[data-slot=slider-range]]:to-cyan-400 [&_[data-slot=slider-thumb]]:border-blue-400 [&_[data-slot=slider-thumb]]:bg-blue-900 [&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(59_130_246_0.5)]"
            />
          </div>
           <div className="flex justify-between text-xs text-slate-500">
             <span>1秒</span>
             <span>3秒</span>
             <span>5秒</span>
           </div>
        </div>
      </div>

      {/* 播放语速 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FastForward className="w-5 h-5" style={{ color: '#22D3EE' }} />
          <h3 className="text-base font-semibold text-white">播放语速</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">听力播放速度</span>
            <span className="text-sm font-semibold" style={{ color: '#06B6D4' }}>
              {listening.playRate.toFixed(1)}x
            </span>
          </div>
          <div className="px-1">
            <Slider
              value={[listening.playRate]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={(vals: number[]) =>
                setListening({ playRate: vals[0] })
              }
              className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-cyan-500 [&_[data-slot=slider-range]]:to-purple-500 [&_[data-slot=slider-thumb]]:border-cyan-400 [&_[data-slot=slider-thumb]]:bg-cyan-200 [&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(34_211_238_0.5)]"
            />
          </div>
           <div className="flex justify-between text-xs text-slate-500">
             <span>0.5x</span>
             <span>1.0x</span>
             <span>1.5x</span>
             <span>2.0x</span>
           </div>
        </div>
      </div>

      {/* 自动播放开关 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(168, 85, 247, 0.2)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.05)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#C084FC' }}
            >
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-slate-200">听力自动播放</div>
              <div className="text-xs text-slate-400 mt-0.5">
                进入题目时自动播放听力内容
              </div>
            </div>
          </div>
          <Switch
            checked={listening.autoPlay}
            onCheckedChange={(checked: boolean) =>
              setListening({ autoPlay: checked })
            }
            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-slate-700"
          />
        </div>
      </div>

      {/* 耳机提示 */}
       <div
         className="rounded-2xl p-4 border"
         style={{
           background:
             'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
           borderColor: 'rgba(34, 211, 238, 0.25)',
         }}
       >
         <div className="flex gap-3">
           <Headphones className="w-5 h-5 mt-0.5 text-cyan-400" />
           <div>
             <div className="text-sm font-medium text-slate-100">沉浸体验</div>
             <div className="text-xs text-slate-400 mt-1 leading-relaxed">
               建议使用耳机获得更佳的听力练习体验，减少环境干扰。
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningSection;
