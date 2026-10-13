import {
  MessageSquare,
  Plus,
  Trash2,
  Mic,
  Lightbulb,
  BookOpen,
  Briefcase,
  Plane,
  ShoppingBag,
  GraduationCap,
  Users,
  AlertCircle,
  MessageCircle,
  User,
  Sparkles,
  PenTool,
  Languages,
  FileText,
} from 'lucide-react';
import type { AiChatSession } from '@shared/api.interface';

// ===== 话题分类数据 =====
export const topicCategories = [
  {
    key: 'daily',
    label: '日常社交',
    icon: Users,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    topics: ['自我介绍', '日常寒暄', '朋友聚会'],
  },
  {
    key: 'school',
    label: '校园学习',
    icon: GraduationCap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    topics: ['课堂提问', '小组讨论', '考试复习'],
  },
  {
    key: 'travel',
    label: '出行旅游',
    icon: Plane,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    topics: ['旅行问路', '机场安检', '酒店入住'],
  },
  {
    key: 'life',
    label: '生活服务',
    icon: ShoppingBag,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    topics: ['餐厅点餐', '超市购物', '医院就诊'],
  },
  {
    key: 'workplace',
    label: '职场办公',
    icon: Briefcase,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    topics: ['面试问答', '会议讨论', '邮件沟通'],
  },
  {
    key: 'business',
    label: '商务贸易',
    icon: BookOpen,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    topics: ['商务谈判', '产品介绍', '客户接待'],
  },
];

// ===== 助教列表 =====
export const assistants = [
  { name: 'Lisa', accent: '美式女音', gender: 'female', flag: '🇺🇸' },
  { name: 'Jack', accent: '美式男音', gender: 'male', flag: '🇺🇸' },
  { name: 'Emma', accent: '英式女音', gender: 'female', flag: '🇬🇧' },
  { name: 'William', accent: '英式男音', gender: 'male', flag: '🇬🇧' },
];

// ===== AI 能力展示 =====
export const aiCapabilities = [
  {
    icon: AlertCircle,
    label: '实时纠错',
    desc: '即时发现语法错误并给出正确表达',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Mic,
    label: '发音测评',
    desc: '智能评估发音准确度和流利度',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Lightbulb,
    label: '表达建议',
    desc: '提供更地道、更自然的表达方式',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: MessageCircle,
    label: '话题陪练',
    desc: '多场景话题陪练，沉浸式口语练习',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
];

// ===== 快捷话题（欢迎页） =====
export const quickStartTopics = [
  { title: '自我介绍', desc: '用英语展示自己', icon: User, color: 'from-violet-500 to-indigo-600' },
  { title: '旅行问路', desc: '出国旅游必备', icon: Plane, color: 'from-blue-500 to-cyan-500' },
  { title: '餐厅点餐', desc: '轻松享受美食', icon: ShoppingBag, color: 'from-emerald-500 to-teal-500' },
  { title: '面试问答', desc: '职场英语突破', icon: Briefcase, color: 'from-purple-500 to-violet-600' },
];

// ===== 快捷问题卡片（欢迎页） =====
export const quickQuestions = [
  {
    title: '帮我润色这段话',
    desc: '让表达更地道自然',
    icon: PenTool,
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    title: '这个词怎么用在句子里',
    desc: '提供实用例句和场景',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: '用英语介绍一下我自己',
    desc: '生成个性化自我介绍',
    icon: User,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: '翻译这段文字',
    desc: '中英互译，准确流畅',
    icon: Languages,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    title: '纠正我的语法错误',
    desc: '逐句分析，详细解释',
    icon: AlertCircle,
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    title: '写一篇英语作文',
    desc: '各类主题，范文参考',
    icon: FileText,
    gradient: 'from-indigo-500 to-purple-500',
  },
];

export interface AssistantInfo {
  name: string;
  accent: string;
  gender: string;
  flag: string;
}

export interface SessionSidebarProps {
  sessions: AiChatSession[];
  currentId: string | null;
  loading: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatTime: (dateStr: string) => string;
}
