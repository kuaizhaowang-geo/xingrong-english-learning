import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
}

const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-md',
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
         className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
           className={`relative w-full ${widthClass} rounded-2xl glass-card overflow-hidden`}
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] via-[#2563EB] to-[#06B6D4]" />
           <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
             <button
               type="button"
               onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
             >
              <X size={18} />
            </button>
          </div>
           <div className="px-6 py-4 max-h-[70vh] overflow-y-auto bg-transparent">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ModalShell;
