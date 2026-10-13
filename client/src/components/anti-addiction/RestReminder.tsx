import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';

interface RestReminderProps {
  open: boolean;
  currentMinutes: number;
  onContinue: () => void;
}

const RestReminder: React.FC<RestReminderProps> = ({
  open,
  currentMinutes,
  onContinue,
}) => {
  const navigate = useNavigate();

  const handleRest = (): void => {
    onContinue();
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={onContinue}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFD166 0%, #FF6B35 100%)',
              }}
            >
              <AlertCircle size={24} className="text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              休息一下吧~
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-gray-600 pt-3">
          您已经学习了
          <span className="font-semibold text-orange-500 mx-1">
            {currentMinutes}
          </span>
          分钟，建议休息一下眼睛哦~
          <br />
          <span className="text-sm text-gray-400">
            远眺窗外 20 秒，可以有效缓解眼部疲劳 👀
          </span>
        </DialogDescription>
        <DialogFooter className="flex gap-3 sm:justify-between pt-2">
          <Button
            variant="outline"
            onClick={onContinue}
            className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            继续学习
          </Button>
          <Button
            onClick={handleRest}
            className="flex-1 text-white border-0"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
            }}
          >
            休息一下
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RestReminder;
