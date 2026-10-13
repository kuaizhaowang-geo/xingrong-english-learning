import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { cn } from '@/lib/utils';

export interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** 图标颜色，默认 text-gray-400 */
  iconClassName?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  className,
  iconClassName,
  ...props
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors',
          iconClassName,
        )}
        aria-label={visible ? '隐藏密码' : '显示密码'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export { PasswordInput };
