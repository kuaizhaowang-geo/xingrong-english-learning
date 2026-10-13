import React from 'react';
import type { ChineseCharacter } from '@shared/api.interface';

interface CharacterCardProps {
  character: ChineseCharacter;
  showHanzi?: boolean;
  size?: 'sm' | 'lg';
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  showHanzi = true,
  size = 'lg',
}) => {
  const hanziSize = size === 'lg' ? 'text-6xl' : 'text-4xl';
  const pySize = size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 w-full">
      {/* 大字 + 拼音 */}
      <div className="text-center mb-4">
        {showHanzi && (
          <div className={`${hanziSize} font-bold text-[#1A1A2E] mb-2`}>
            {character.hanzi}
          </div>
        )}
        <div className={`${pySize} font-medium text-[#FF6B35]`}>
          {character.pinyin}
        </div>
      </div>

      {/* 部首 / 笔画 / 结构 */}
      <div className="flex justify-center gap-4 text-sm text-gray-500 mb-4 flex-wrap">
        {character.radical && (
          <span>部首：<span className="text-gray-700 font-medium">{character.radical}</span></span>
        )}
        <span>笔画：<span className="text-gray-700 font-medium">{character.strokes}画</span></span>
        {character.structure && (
          <span>结构：<span className="text-gray-700 font-medium">{character.structure}</span></span>
        )}
      </div>

      {/* 组词 */}
      {character.words && character.words.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-500 mb-1.5">组词</div>
          <div className="flex flex-wrap gap-2">
            {character.words.map((word: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-[#FFF4EF] text-[#FF6B35] text-sm rounded-md"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 释义 */}
      {character.meaning && (
        <div className="mb-3">
          <div className="text-sm text-gray-500 mb-1">释义</div>
          <div className="text-sm text-gray-700 leading-relaxed">{character.meaning}</div>
        </div>
      )}

      {/* 例句 */}
      {character.examples && (
        <div>
          <div className="text-sm text-gray-500 mb-1">例句</div>
          <div className="text-sm text-gray-700 leading-relaxed italic">
            "{character.examples}"
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
