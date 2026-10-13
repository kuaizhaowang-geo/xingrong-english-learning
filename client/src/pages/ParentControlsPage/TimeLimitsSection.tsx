import React from 'react';
import { Clock, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import type { ParentControls, AntiAddictionStatus, UsageReport } from '@shared/api.interface';

const AGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'child', label: '14 岁以下（儿童）' },
  { value: 'teen', label: '14-18 岁（青少年）' },
  { value: 'adult', label: '成年人（无限制）' },
];

interface TimeLimitsSectionProps {
  status: AntiAddictionStatus | null;
  controls: ParentControls | null;
  report: UsageReport | null;
  onUpdate: (patch: Partial<ParentControls>) => void;
}

const TimeLimitsSection: React.FC<TimeLimitsSectionProps> = ({
  status,
  controls,
  report,
  onUpdate,
}) => {
  return (
    <>
      {/* 使用概览 */}
      <Card className="border border-gray-100 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={18} style={{ color: '#FF6B35' }} />
            使用概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-orange-50">
              <div className="text-2xl font-bold" style={{ color: '#FF6B35' }}>
                {status?.todayTotalMinutes ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">今日已用（分钟）</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-blue-50">
              <div className="text-2xl font-bold" style={{ color: '#4361EE' }}>
                {status?.todayRemainingMinutes ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">今日剩余（分钟）</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-teal-50">
              <div className="text-2xl font-bold" style={{ color: '#2EC4B6' }}>
                {report?.totalDuration ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">本周总时长（分钟）</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 时长限制 */}
      <Card className="border border-gray-100 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <UserRound size={18} style={{ color: '#4361EE' }} />
            使用时长限制
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              年龄段设置
            </label>
            <Select
              value={controls?.ageGroup ?? 'child'}
              onValueChange={(v: string) => onUpdate({ ageGroup: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择年龄段" />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                工作日（分钟）
              </label>
              <Input
                type="number"
                min={0}
                value={controls?.dailyLimitWeekday ?? 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ dailyLimitWeekday: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                节假日（分钟）
              </label>
              <Input
                type="number"
                min={0}
                value={controls?.dailyLimitWeekend ?? 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ dailyLimitWeekend: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                单次连续（分钟）
              </label>
              <Input
                type="number"
                min={0}
                value={controls?.sessionLimit ?? 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ sessionLimit: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TimeLimitsSection;
