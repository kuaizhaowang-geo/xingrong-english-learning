import React, { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { PKRoomType, PKCourseType } from '@shared/api.interface';

interface CreateRoomFormData {
  title: string;
  roomType: PKRoomType;
  courseType: PKCourseType;
  maxPlayers: number;
  isPublic: boolean;
  password: string;
  courseName: string;
  topic: string;
}

const CreateRoomModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateRoomFormData) => void;
  defaultType?: PKRoomType;
}> = ({ open, onClose, onCreate, defaultType = '1v1' }) => {
  const [title, setTitle] = useState('');
  const [roomType, setRoomType] = useState<PKRoomType>(defaultType);
  const [courseType, setCourseType] = useState<PKCourseType>('mixed');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [courseName, setCourseName] = useState('');
  const [topic, setTopic] = useState('');

  const courseOptions = [
    { value: '', label: '全部课程' },
    { value: 'daily', label: '日常实用英语' },
    { value: 'beginner', label: '零基础入门' },
    { value: 'business', label: '职场商务英语' },
    { value: 'travel', label: '旅游英语' },
    { value: 'pep3', label: '人教版PEP三年级' },
    { value: 'pep4', label: '人教版PEP四年级' },
    { value: 'pep5', label: '人教版PEP五年级' },
    { value: 'pep6', label: '人教版PEP六年级' },
  ];

  const topicOptions = [
    { value: '', label: '不限主题' },
    { value: 'vocabulary', label: '词汇挑战' },
    { value: 'grammar', label: '语法对决' },
    { value: 'listening', label: '听力风暴' },
    { value: 'reading', label: '阅读速度' },
    { value: 'comprehensive', label: '综合能力' },
  ];

  useEffect(() => {
    if (open) {
      setTitle('');
      setRoomType(defaultType);
      setCourseType('mixed');
      setMaxPlayers(defaultType === '1v1' ? 2 : 4);
      setIsPublic(true);
      setPassword('');
      setCourseName('');
      setTopic('');
    }
  }, [open, defaultType]);

  if (!open) return null;

  const handleSubmit = (): void => {
    if (!title.trim()) return;
    if (!isPublic && !password.trim()) return;
    onCreate({
      title: title.trim(),
      roomType,
      courseType,
      maxPlayers,
      isPublic,
      password: isPublic ? '' : password.trim(),
      courseName,
      topic,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
       <div className="glass-card rounded-2xl p-6 w-full max-w-md my-8">
         <h3 className="text-xl font-bold text-white mb-4">创建房间</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">
               房间名称 <span className="text-red-400">*</span>
             </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给房间起个名字"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              maxLength={30}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">房间类型</label>
            <div className="flex gap-2">
              {(['1v1', 'multi'] as PKRoomType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setRoomType(t);
                    if (t === '1v1') setMaxPlayers(2);
                  }}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                    roomType === t
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {t === '1v1' ? '双人对战' : '多人混战'}
                </button>
              ))}
            </div>
          </div>

          {roomType === 'multi' && (
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-2">
                 人数上限
               </label>
              <div className="flex gap-2">
                {[2, 4, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxPlayers(n)}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                      maxPlayers === n
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {n} 人
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">题目类型</label>
            <div className="flex gap-2">
              {([
                { key: 'words', label: '单词' },
                { key: 'sentences', label: '句子' },
                { key: 'mixed', label: '混合' },
              ] as { key: PKCourseType; label: string }[]).map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCourseType(c.key)}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                    courseType === c.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">课程选择</label>
            <select
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
               className="w-full h-10 px-3 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 bg-white/5 text-slate-200"
            >
              {courseOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Topic 主题</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
               className="w-full h-10 px-3 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 bg-white/5 text-slate-200"
            >
              {topicOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">
               房间公开性
             </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  isPublic
                    ? 'bg-green-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Unlock size={14} />
                公开房间
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  !isPublic
                    ? 'bg-gray-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Lock size={14} />
                私密房间
              </button>
            </div>
          </div>

          {!isPublic && (
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">
                 房间密码 <span className="text-red-400">*</span>
               </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置4-8位房间密码"
                maxLength={8}
                className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!title.trim() || (!isPublic && !password.trim())}
            className="flex-1 bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            创建房间
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
