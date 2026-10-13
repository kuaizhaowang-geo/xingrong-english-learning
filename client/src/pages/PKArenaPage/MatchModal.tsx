import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Swords } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';

interface MatchModalProps {
  open: boolean;
  onClose: () => void;
  onMatched: () => void;
  onlineCount: number;
}

const MatchModal: React.FC<MatchModalProps> = ({ open, onClose, onMatched, onlineCount }) => {
  const [dots, setDots] = useState('');
  const [matched, setMatched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setDots('');
      setMatched(false);

      dotsRef.current = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);

      // 2-4秒后匹配成功
      const delay = 2000 + Math.random() * 2000;
      timerRef.current = setTimeout(() => {
        setMatched(true);
        setTimeout(() => {
          onMatched();
        }, 800);
      }, delay);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (dotsRef.current) clearInterval(dotsRef.current);
      };
    }
  }, [open, onMatched]);

  if (!open) return null;

  const handleCancel = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dotsRef.current) clearInterval(dotsRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        {matched ? (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center animate-bounce">
              <Swords className="w-10 h-10 text-white" />
            </div>
            <div className="text-xl font-bold text-gray-800 mb-1">匹配成功！</div>
            <div className="text-sm text-gray-500">即将进入对战...</div>
          </>
        ) : (
          <>
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-orange-200" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Swords className="w-10 h-10 text-orange-500" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-800 mb-2">
              寻找对手中{dots}
            </div>
            <div className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              当前在线 {onlineCount} 人
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                 <span className="text-gray-500">搜索范围</span>
                <span className="text-gray-600 font-medium">全服匹配</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                 <span className="text-gray-500">匹配模式</span>
                <span className="text-gray-600 font-medium">1v1 随机</span>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="w-full h-11"
            >
              <X size={16} />
              取消匹配
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchModal;
