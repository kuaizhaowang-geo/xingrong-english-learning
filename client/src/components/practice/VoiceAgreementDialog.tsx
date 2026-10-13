import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { ShieldCheck } from 'lucide-react';

export interface VoiceAgreementDialogProps {
  open: boolean;
  onAgree: () => void;
  onDisagree: () => void;
}

const VoiceAgreementDialog: React.FC<VoiceAgreementDialogProps> = ({
  open,
  onAgree,
  onDisagree,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onDisagree();
    }}>
      <DialogContent
        className="sm:max-w-md rounded-2xl p-0 overflow-hidden"
        showCloseButton={false}
      >
        <div className="p-6">
          <DialogHeader className="text-center mb-5">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" style={{ color: '#FF6B35' }} />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              《语音数据授权使用协议》
            </DialogTitle>
          </DialogHeader>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              为了提供口语评测服务，我们需要访问您的麦克风，请您授权开启录音权限。
            </p>
            <p>
              录音数据仅用于实时发音评测，不会上传或存储到服务器，请您放心使用。
            </p>
            <p>
              您可以随时在浏览器设置或系统设置中关闭麦克风权限。
            </p>
            <p className="text-gray-500 text-xs pt-1">
              点击"同意并开始"即表示您已阅读并同意以上条款。
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-3 px-6 pb-6 pt-0">
          <button
            type="button"
            onClick={onDisagree}
            className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 flex-1 sm:flex-none"
          >
            不同意
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors flex-1 sm:flex-none"
            style={{ backgroundColor: '#FF6B35' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E85A2A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B35';
            }}
          >
            同意并开始
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAgreementDialog;
