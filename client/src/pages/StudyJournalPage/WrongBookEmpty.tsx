import React from 'react';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@client/src/components/ui/empty';

interface WrongBookEmptyProps {
  category: 'wrong' | 'unfamiliar' | 'mastered';
  type: 'sentence' | 'word';
  icon: React.ReactNode;
}

const WrongBookEmpty: React.FC<WrongBookEmptyProps> = ({ category, type, icon }) => {
  const typeLabel = type === 'sentence' ? '句子' : '单词';

  const messages: Record<string, { title: string; desc: string; gradient: string }> = {
    wrong: {
      title: '太棒了！没有错题',
      desc: `继续保持，你的${typeLabel}掌握得非常好~`,
       gradient: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/30',
    },
    unfamiliar: {
      title: `暂无不熟悉的${typeLabel}`,
      desc: `在${type === 'sentence' ? '句子练习' : '单词训练'}中标记不熟悉的${typeLabel}会出现在这里`,
       gradient: 'from-amber-500/20 to-fuchsia-500/10 border-amber-500/30',
    },
    mastered: {
      title: `暂无已掌握的${typeLabel}`,
      desc: `将不熟悉的${typeLabel}标记为已掌握后会出现在这里`,
       gradient: 'from-cyan-500/20 to-fuchsia-500/10 border-cyan-500/30',
    },
  };

  const info = messages[category];

  return (
     <Empty className="border-0 glass-card rounded-xl">
      <EmptyContent>
        <EmptyMedia>
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${info.gradient} flex items-center justify-center border`}
          >
            {icon}
          </div>
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-lg">{info.title}</EmptyTitle>
          <EmptyDescription>{info.desc}</EmptyDescription>
        </EmptyHeader>
      </EmptyContent>
    </Empty>
  );
};

export default WrongBookEmpty;
