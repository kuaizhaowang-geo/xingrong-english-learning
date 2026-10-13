// 虚拟键盘演示页 - 展示三种键盘布局、手指动画、听音引导等功能
import React, { useState, useRef } from 'react';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import type { KeyboardLayoutType } from '@client/src/components/virtual-keyboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import { Switch } from '@client/src/components/ui/switch';
import { Button } from '@client/src/components/ui/button';
import { Volume2, Zap, Eye, EyeOff, Hand } from 'lucide-react';
import { useSpeech } from '@client/src/hooks/use-speech';
import { logger } from '@lark-apaas/client-toolkit/logger';

const KeyboardDemoPage: React.FC = () => {
  const [layout, setLayout] = useState<KeyboardLayoutType>('qwerty');
  const [value, setValue] = useState<string>('');
  const [showFingerGuide, setShowFingerGuide] = useState<boolean>(false);
  const [showFingerLabels, setShowFingerLabels] = useState<boolean>(true);
  const [fingerSpeed, setFingerSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const { speak } = useSpeech();

  const demoWordRef = useRef<HTMLInputElement>(null);

  // 演示听音引导：播放一个单词，依次高亮按键
  const playTypingGuide = async () => {
    const word = demoWordRef.current?.value.trim() || 'hello';
    const chars = word.toLowerCase().split('');

    // 先播放单词发音
    speak(word, { lang: 'en-US' });

    // 依次高亮每个字母
    const delay = fingerSpeed === 'slow' ? 800 : fingerSpeed === 'fast' ? 300 : 500;
    for (let i = 0; i < chars.length; i++) {
      setHighlightKey(chars[i]);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
    setHighlightKey(null);
  };

  const handleSubmit = () => {
    // 回车提交：清空或其他操作
    logger.info('Submit:', String(value));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          🎹 沉浸式虚拟键盘系统
        </h1>
        <p className="text-sm text-slate-400">
          三套键盘布局 · 标准指法引导 · 手指动画 · 物理键盘同步
        </p>
      </div>

      {/* 键盘类型切换 */}
      <Tabs
        defaultValue="qwerty"
        onValueChange={(v) => {
          setLayout(v as KeyboardLayoutType);
          setValue('');
        }}
        className="w-full"
      >
        <div className="glass-card p-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="qwerty">英文 QWERTY</TabsTrigger>
            <TabsTrigger value="pinyin">拼音键盘</TabsTrigger>
            <TabsTrigger value="number">数字键盘</TabsTrigger>
          </TabsList>

          <TabsContent value="qwerty">
            <p className="text-sm text-slate-400 mt-3">
              全英文键盘布局，适合英语单词拼写、句子输入练习
            </p>
          </TabsContent>
          <TabsContent value="pinyin">
            <p className="text-sm text-slate-400 mt-3">
              拼音专用键盘，声母/韵母/声调分区，适合语文拼音输入
            </p>
          </TabsContent>
          <TabsContent value="number">
            <p className="text-sm text-slate-400 mt-3">
              大按键数字键盘，适合数学口算快速输入
            </p>
          </TabsContent>
        </div>
      </Tabs>

      {/* 控制选项 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚙️ 设置选项</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 手指引导开关 */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3">
              <Hand size={20} className="text-orange-400" />
              <div>
                <div className="text-sm font-medium text-white">指法引导动画</div>
                <div className="text-xs text-slate-400">显示虚拟手指移动和按下动画</div>
              </div>
            </div>
            <Switch
              checked={showFingerGuide}
              onCheckedChange={setShowFingerGuide}
            />
          </div>

          {/* 手指标签开关 */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3">
              {showFingerLabels
                ? <Eye size={20} className="text-blue-400" />
                : <EyeOff size={20} className="text-slate-500" />
              }
              <div>
                <div className="text-sm font-medium text-white">手指名称标签</div>
                <div className="text-xs text-slate-400">在按键右下角显示负责手指</div>
              </div>
            </div>
            <Switch
              checked={showFingerLabels}
              onCheckedChange={setShowFingerLabels}
            />
          </div>

          {/* 动画速度 */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-yellow-400" />
              <div>
                <div className="text-sm font-medium text-white">动画速度</div>
                <div className="text-xs text-slate-400">手指移动和按键动画速度</div>
              </div>
            </div>
            <div className="flex gap-1">
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <Button
                  key={speed}
                  size="sm"
                  variant={fingerSpeed === speed ? 'default' : 'outline'}
                  onClick={() => setFingerSpeed(speed)}
                  className="text-xs h-7 px-3"
                >
                  {speed === 'slow' ? '慢' : speed === 'normal' ? '中' : '快'}
                </Button>
              ))}
            </div>
          </div>

          {/* 听音引导演示 */}
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Volume2 size={20} className="text-orange-400" />
              <div>
                <div className="text-sm font-medium text-white">听音打字引导</div>
                <div className="text-xs text-slate-400">播放单词并依次高亮对应键位</div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                ref={demoWordRef}
                type="text"
                defaultValue="hello"
                placeholder="输入单词..."
                className="flex-1 h-9 px-3 rounded-lg border border-white/15 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/50"
                disabled={layout !== 'qwerty'}
              />
              <Button
                size="sm"
                onClick={playTypingGuide}
                className="bg-orange-500 hover:bg-orange-600 h-9"
                disabled={layout !== 'qwerty'}
              >
                <Volume2 size={16} className="mr-1" />
                播放
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 输入显示 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">📝 输入内容</h3>
        <div className="min-h-[60px] p-4 bg-white/5 rounded-xl text-xl font-mono text-white border border-white/15">
          {value || <span className="text-slate-500">开始输入...</span>}
          <span className="animate-pulse text-orange-500 ml-1">|</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setValue('')}
          >
            清空
          </Button>
          <span className="text-xs text-slate-500 ml-auto self-center">
            也可以使用物理键盘输入
          </span>
        </div>
      </div>

      {/* 虚拟键盘 */}
      <div className="glass-card p-6 flex justify-center overflow-x-auto">
        <VirtualKeyboard
          layout={layout}
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          showFingerGuide={showFingerGuide}
          fingerSpeed={fingerSpeed}
          showFingerLabels={showFingerLabels}
          highlightKey={highlightKey}
          colorScheme={layout === 'pinyin' ? 'pinyin' : layout === 'number' ? 'number' : 'default'}
        />
      </div>

      {/* 指法分区说明 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🖐️ 指法分区</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { name: '左小指', color: '#9333EA', keys: '` 1 Q A Z' },
            { name: '左无名指', color: '#2563EB', keys: '2 W S X' },
            { name: '左中指', color: '#059669', keys: '3 E D C' },
            { name: '左食指', color: '#F97316', keys: '4 5 R T F G V B' },
            { name: '右食指', color: '#EA580C', keys: '6 7 Y U H J N M' },
            { name: '右中指', color: '#0D9488', keys: '8 I K ,' },
            { name: '右无名指', color: '#2563EB', keys: '9 O L .' },
            { name: '右小指', color: '#6366F1', keys: '0 P ; \' [ ] \\ - = Enter ⌫' },
            { name: '拇指', color: '#6B7280', keys: '空格' },
          ].map((item) => (
            <div key={item.name} className="p-3 rounded-xl border border-white/10 bg-white/5">
              <div
                className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: item.color }}
              >
                {item.name.slice(-1)}
              </div>
              <div className="text-sm font-medium text-white">{item.name}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono break-all">
                {item.keys}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardDemoPage;
