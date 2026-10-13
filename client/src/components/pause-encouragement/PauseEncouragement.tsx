import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Coffee, Sparkles, Star, Sun, Moon, Flower2 } from 'lucide-react';

interface PauseEncouragementProps {
  visible: boolean;
  onClose: () => void;
}

const ENCOURAGE_MESSAGES = [
  {
    icon: <Heart size={32} />,
    iconColor: 'text-rose-400',
    title: '稍作休息吧~',
    content: '学习是一场马拉松，不是短跑。喝口水，伸个懒腰，再继续出发！',
  },
  {
    icon: <Coffee size={32} />,
    iconColor: 'text-amber-500',
    title: '你已经很棒了',
    content: '每一个认真的当下，都是在为未来的自己铺路。歇一下，再战！',
  },
  {
    icon: <Sparkles size={32} />,
    iconColor: 'text-purple-400',
    title: '停下来是为了走更远',
    content: '大脑需要时间消化新知识。深呼吸三下，让它们慢慢沉淀。',
  },
  {
    icon: <Star size={32} />,
    iconColor: 'text-yellow-400',
    title: '你在发光呀',
    content: '坚持学习的你，比昨天的自己又进步了一点点。为你骄傲！',
  },
  {
    icon: <Sun size={32} />,
    iconColor: 'text-orange-400',
    title: '阳光正好',
    content: '看看窗外的风景，让眼睛休息一下。回来后效率会更高哦~',
  },
  {
    icon: <Flower2 size={32} />,
    iconColor: 'text-pink-400',
    title: '慢慢来比较快',
    content: '语言学习没有捷径，但每一步都算数。你走的每一步都在靠近目标。',
  },
];

const PauseEncouragement: React.FC<PauseEncouragementProps> = ({
  visible,
  onClose,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setMsgIndex(Math.floor(Math.random() * ENCOURAGE_MESSAGES.length));
    }
  }, [visible]);

  const msg = ENCOURAGE_MESSAGES[msgIndex];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <motion.div
                className={`w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center ${msg.iconColor}`}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {msg.icon}
              </motion.div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {msg.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {msg.content}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1">
              {['💛', '💚', '💙', '💜', '🧡'].map((emoji, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-lg"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full py-2.5 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium hover:opacity-90 transition-opacity"
            >
              继续学习
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseEncouragement;
