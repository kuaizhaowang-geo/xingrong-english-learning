import React from 'react';
import { BookMarked } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import Image from '@client/src/components/ui/image';
import type { TextbookTreeItem } from '@shared/api.interface';

const GRADE_LABELS: Record<string, string> = {
  grade1: '一年级', grade2: '二年级', grade3: '三年级',
  grade4: '四年级', grade5: '五年级', grade6: '六年级',
  grade7: '七年级', grade8: '八年级', grade9: '九年级',
  grade10: '高一', grade11: '高二', grade12: '高三',
};

const SEMESTER_LABELS: Record<string, string> = {
  upper: '上册', lower: '下册',
};

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文', math: '数学', english: '英语',
};

interface TextbookInfoCardProps {
  textbook: TextbookTreeItem;
}

const TextbookInfoCard: React.FC<TextbookInfoCardProps> = ({ textbook }) => {
  return (
    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
      <div className="flex gap-4">
        <div className="w-24 h-32 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
          {textbook.coverImage ? (
            <Image
              src={textbook.coverImage}
              alt={textbook.title}
              width={96}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <BookMarked size={32} />
            </div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="text-slate-400">版本：</span>
            <span className="text-white">{textbook.publisher}</span>
          </div>
          <div>
            <span className="text-slate-400">学科：</span>
            <span className="text-white">
              {SUBJECT_LABELS[textbook.subject] ?? textbook.subject}
            </span>
          </div>
          <div>
            <span className="text-slate-400">年级：</span>
            <span className="text-white">
              {GRADE_LABELS[textbook.grade] ?? textbook.grade}
            </span>
          </div>
          <div>
            <span className="text-slate-400">学期：</span>
            <span className="text-white">
              {SEMESTER_LABELS[textbook.semester] ?? textbook.semester}
            </span>
          </div>
          <div>
            <span className="text-slate-400">总单元数：</span>
            <span className="text-white">{textbook.totalUnits}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">状态：</span>
            <Badge
              variant="secondary"
              className="bg-emerald-500 hover:bg-emerald-500 text-white border-0"
            >
              已发布
            </Badge>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400">简介：</span>
            <span className="text-white">
              {textbook.description || '暂无简介'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookInfoCard;
