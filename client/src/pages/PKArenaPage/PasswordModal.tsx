import React, { useState } from 'react';
import { X, Hash, Eye, EyeOff } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';

interface PasswordModalProps {
  open: boolean;
  roomTitle: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ open, roomTitle, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState<boolean>(false);

  if (!open) return null;

  const handleSubmit = (): void => {
    if (!password.trim()) {
      setError('请输入房间密码');
      return;
    }
    onSubmit(password);
    setPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
       <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-bold text-white">输入房间密码</h3>
          <button
            onClick={onClose}
             className="text-gray-500 hover:text-gray-600"
           >
             <X size={20} />
           </button>
         </div>
         <div className="text-sm text-gray-500 mb-4">
           房间「{roomTitle}」需要密码才能加入
        </div>
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="请输入房间密码"
              className="w-full h-11 px-3 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors"
              aria-label={showPwd ? '隐藏密码' : '显示密码'}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div className="text-xs text-red-500 mt-1.5">{error}</div>}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            className="flex-1 bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            确认加入
          </Button>
        </div>
      </div>
    </div>
  );
};

interface JoinByCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({ open, onClose, onSubmit }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (): void => {
    if (!/^\d{6}$/.test(code)) {
      setError('请输入6位房间号');
      return;
    }
    onSubmit(code);
    setCode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
       <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-orange-500" />
            输入房号加入
          </h3>
          <button
            onClick={onClose}
             className="text-gray-500 hover:text-gray-600"
           >
             <X size={20} />
           </button>
         </div>
         <div className="text-sm text-gray-500 mb-4">
           输入6位房间号，快速加入好友房间
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(val);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="请输入6位房间号"
            className="w-full h-12 px-4 rounded-lg border-2 border-gray-200 text-lg text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            maxLength={6}
            autoFocus
          />
          {error && <div className="text-xs text-red-500 mt-1.5 text-center">{error}</div>}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            className="flex-1 bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            加入房间
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
