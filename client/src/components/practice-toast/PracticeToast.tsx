import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info';

interface PracticeToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const PracticeToast: React.FC<PracticeToastProps> = ({
  visible,
  message,
  type = 'info',
  onClose,
  duration = 2000,
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const configs: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
    success: {
      icon: <Check size={18} />,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
    },
    warning: {
      icon: <AlertCircle size={18} />,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
    },
    info: {
      icon: <Info size={18} />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
    },
  };

  const cfg = configs[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl backdrop-blur-md shadow-lg ${cfg.bg} ${cfg.border} border ${cfg.text}`}
          >
            {cfg.icon}
            <span className="font-medium text-sm whitespace-nowrap">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PracticeToast;
