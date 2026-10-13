import React, { useEffect, useRef, useState } from 'react';
import { X, Heart, ChevronDown, Maximize2, BookOpen, ChevronRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useSpeech } from '@client/src/hooks/use-speech';
import type { WordItem, WordAffix } from '@shared/api.interface';
import { getAffixes } from '@client/src/api/words';

interface WordDetailModalProps {
  word: WordItem;
  open: boolean;
  onClose: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  open,
  onClose,
  favorite = false,
  onToggleFavorite,
}) => {
  const { voices, selectedVoice, setVoice, speak, speaking } = useSpeech();
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
   const [visible, setVisible] = useState(false);
   const [affixList, setAffixList] = useState<WordAffix[]>([]);
   const [showAffixPanel, setShowAffixPanel] = useState(false);
   const voiceMenuRef = useRef<HTMLDivElement>(null);

  // 动画挂载控制
  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  // ESC 关闭
   useEffect(() => {
     if (!open) return;
     const onKey = (e: KeyboardEvent): void => {
       if (e.key === 'Escape') {
         if (imageZoomed) setImageZoomed(false);
         else onClose();
       }
     };
     window.addEventListener('keydown', onKey);
     return () => window.removeEventListener('keydown', onKey);
   }, [open, onClose, imageZoomed]);

  useEffect(() => {
     if (!open) return;
     let cancelled = false;
     getAffixes()
       .then((list) => {
         if (cancelled) return;
         setAffixList(list);
       })
       .catch((err) => {
         logger.error('加载词根词缀列表失败', err);
       });
     return () => {
       cancelled = true;
     };
   }, [open]);

  // 点击外部关闭音色菜单
  useEffect(() => {
    if (!showVoiceMenu) return;
    const onClick = (e: MouseEvent): void => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setShowVoiceMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showVoiceMenu]);

  const handleSpeak = (): void => {
    if (!word.word) return;
    speak(word.word);
  };

  const handleVoiceSelect = (voiceName: string): void => {
    setVoice(voiceName);
    setShowVoiceMenu(false);
    logger.info(`切换发音音色: ${voiceName}`);
  };

  const currentVoiceLabel = (): string => {
    const v = voices.find((vo) => vo.name === selectedVoice);
    return v?.displayName || '选择音色';
  };

  // 过滤英语音色优先
  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  const displayVoices = englishVoices.length > 0 ? englishVoices : voices;

  if (!mounted) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className={`pointer-events-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>

          {/* 主体内容 */}
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* 左侧插图区 */}
            <div className="flex-shrink-0 md:w-2/5 flex flex-col items-center gap-4">
              <div
                className="relative w-full max-h-64 bg-gray-50 rounded-xl overflow-hidden cursor-zoom-in group"
                onClick={() => word.imageUrl && setImageZoomed(true)}
              >
                {word.imageUrl ? (
                  <img
                    src={word.imageUrl}
                    alt={word.word}
                    className="w-full h-64 object-contain"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-300 text-sm">
                    暂无插图
                  </div>
                )}
                {word.imageUrl && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* 发音按钮 + 音色选择 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all ${
                    speaking ? 'animate-pulse' : ''
                  }`}
                  aria-label="朗读单词"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </button>

                {/* 音色选择下拉 */}
                <div className="relative" ref={voiceMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-orange-300 hover:text-orange-500 transition-colors bg-white"
                  >
                    <span className="max-w-24 truncate">{currentVoiceLabel()}</span>
                    <ChevronDown size={14} />
                  </button>

                  {showVoiceMenu && (
                    <div className="absolute bottom-full mb-2 left-0 w-52 max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                      {displayVoices.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">
                          暂无可用音色
                        </div>
                      ) : (
                        displayVoices.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => handleVoiceSelect(v.name)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              v.name === selectedVoice
                                ? 'bg-orange-50 text-orange-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {v.displayName}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧信息区 */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* 单词 + 收藏 */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-3xl font-bold text-gray-900 truncate">
                    {word.word}
                  </h2>
                  {word.phonetic && (
                    <p className="text-lg text-gray-400 mt-1">/{word.phonetic}/</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onToggleFavorite}
                  className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                    favorite
                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                      : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                  }`}
                  aria-label={favorite ? '取消收藏' : '收藏'}
                >
                  <Heart size={22} fill={favorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* 词性标签 */}
              {word.partOfSpeech && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                    {word.partOfSpeech}
                  </span>
                  {word.level && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                      {word.level}
                    </span>
                  )}
                </div>
              )}

              {/* 中文释义 */}
              <p className="text-xl font-medium text-gray-800 leading-relaxed">
                {word.meaning}
              </p>

              {/* 例句 */}
              {word.exampleSentence && (
                <div className="mt-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-base text-gray-800 leading-relaxed">
                    {word.exampleSentence}
                  </p>
                  {word.exampleTranslation && (
                    <p className="text-sm text-gray-500 mt-2">
                      {word.exampleTranslation}
                    </p>
                  )}
                </div>
              )}

              {/* 词根词缀 / 记忆技巧 */}
               {(word.rootAffix || word.memoryTip || affixList.length > 0) && (
                 <div className="mt-1 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                   {word.rootAffix && (
                     <div className="mb-2">
                       <span className="text-xs font-semibold text-orange-600 uppercase">
                         词根词缀
                       </span>
                       <p className="text-sm text-gray-700 mt-1">{word.rootAffix}</p>
                     </div>
                   )}
                   {word.memoryTip && (
                     <div>
                       <span className="text-xs font-semibold text-orange-600 uppercase">
                         记忆技巧
                       </span>
                       <p className="text-sm text-gray-700 mt-1">{word.memoryTip}</p>
                     </div>
                   )}
                   {affixList.length > 0 && (
                     <button
                       type="button"
                       onClick={() => setShowAffixPanel(!showAffixPanel)}
                       className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 hover:bg-white text-xs font-medium text-orange-600 transition-colors"
                     >
                       <span className="flex items-center gap-1.5">
                         <BookOpen size={14} />
                         查看词根词缀知识卡片
                       </span>
                       <ChevronRight
                         size={14}
                         className={`transition-transform ${showAffixPanel ? 'rotate-90' : ''}`}
                       />
                     </button>
                   )}
                   {showAffixPanel && affixList.length > 0 && (
                     <div className="mt-3 grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                       {affixList.map((item) => (
                         <div
                           key={item.id}
                           className="p-3 bg-white rounded-lg border border-orange-100"
                         >
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-bold text-orange-600">
                               {item.affix}
                             </span>
                             <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                               {item.affixType === 'prefix' ? '前缀' : item.affixType === 'suffix' ? '后缀' : '词根'}
                             </span>
                           </div>
                           <p className="text-xs text-gray-600 mt-1">含义：{item.meaning}</p>
                           <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                             {item.description}
                           </p>
                           {item.exampleWords.length > 0 && (
                             <div className="mt-1.5 flex flex-wrap gap-1">
                               {item.exampleWords.map((w) => (
                                 <span
                                   key={w}
                                   className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                 >
                                   {w}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}

              {/* 标签 */}
              {word.tags && word.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {word.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 图片放大查看 */}
      {imageZoomed && word.imageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center cursor-zoom-out animate-fade-in"
          onClick={() => setImageZoomed(false)}
        >
          <img
            src={word.imageUrl}
            alt={word.word}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            type="button"
            onClick={() => setImageZoomed(false)}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="关闭放大"
          >
            <X size={24} />
          </button>
        </div>
      )}
    </>
  );
};

export default WordDetailModal;
