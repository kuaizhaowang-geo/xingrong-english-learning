import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Flame,
  BookOpen,
  MessageSquare,
  Star,
  Award,
  Crown,
  Zap,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { learnersApi, checkInApi, learnersStatsApi } from '@client/src/api';
import type {
  LearnerPreferences,
  CheckInRecord,
  Achievement,
} from '@shared/api.interface';
import TodayProgress from './TodayProgress';
import PlanSettings from './PlanSettings';
import WeeklyChart from './WeeklyChart';
import StreakCalendar from './StreakCalendar';
import AchievementBadges from './AchievementBadges';

const STORAGE_KEY = 'xr_learning_plan';

interface PlanSettingsData {
  wordTarget: number;
  sentenceTarget: number;
  durationTarget: number;
  startTime: string;
  endTime: string;
  reminderEnabled: boolean;
}

interface StudyRecord {
  date: string; // YYYY-MM-DD
  minutes: number;
  words: number;
  sentences: number;
}

interface AchievementData {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  progress?: string;
  gradient: string;
  icon: React.ReactNode;
}

interface LearningPlanState {
  settings: PlanSettingsData;
  records: StudyRecord[];
  totalWords: number;
  totalSentences: number;
  firstCheckIn: string | null;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  achieved: boolean;
  progress?: string;
}

const defaultSettings: PlanSettingsData = {
  wordTarget: 30,
  sentenceTarget: 15,
  durationTarget: 45,
  startTime: '08:00',
  endTime: '22:00',
  reminderEnabled: true,
};

const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getDayLabel = (dateStr: string): string => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(dateStr);
  return days[d.getDay()];
};

// Calculate streak (consecutive days of study from today backwards)
const calculateStreak = (records: StudyRecord[]): number => {
  const recordMap = new Map<string, number>();
  records.forEach((r: StudyRecord) => {
    recordMap.set(r.date, r.minutes);
  });

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr: string = formatDate(d);
    const mins: number = recordMap.get(dateStr) ?? 0;
    if (mins > 0) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
};

// Convert CheckInRecord[] to StudyRecord[] and fill gaps
const fillRecordGaps = (records: StudyRecord[]): StudyRecord[] => {
  const recordMap = new Map<string, StudyRecord>();
  records.forEach((r: StudyRecord) => {
    recordMap.set(r.date, r);
  });

  const filled: StudyRecord[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr: string = formatDate(d);
    const existing: StudyRecord | undefined = recordMap.get(dateStr);
    if (existing) {
      filled.push(existing);
    } else {
      filled.push({ date: dateStr, minutes: 0, words: 0, sentences: 0 });
    }
  }
  return filled;
};

const convertCheckInRecords = (checkIns: CheckInRecord[]): StudyRecord[] => {
  const records: StudyRecord[] = checkIns.map((c: CheckInRecord) => ({
    date: c.checkInDate,
    minutes: c.studyMinutes,
    words: c.wordsLearned,
    sentences: c.sentencesCompleted,
  }));
  return fillRecordGaps(records);
};

// Convert backend Achievement[] to frontend Badge[] with gradient + icon
const convertAchievements = (achievements: Achievement[]): Badge[] => {
  const gradientMap: Record<string, string> = {
    'first-checkin': 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    'streak-7': 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    'streak-30': 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
    'streak-100': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'words-100': 'linear-gradient(135deg, #06B6D4 0%, #06B6D4 100%)',
    'sentences-100': 'linear-gradient(135deg, #EC4899 0%, #6366F1 100%)',
  };

  const iconMap: Record<string, React.ReactNode> = {
    'first-checkin': <Zap className="w-7 h-7" />,
    'streak-7': <Flame className="w-7 h-7" />,
    'streak-30': <Award className="w-7 h-7" />,
    'streak-100': <Crown className="w-7 h-7" />,
    'words-100': <BookOpen className="w-7 h-7" />,
    'sentences-100': <MessageSquare className="w-7 h-7" />,
  };

  return achievements.map((a: Achievement) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    achieved: a.unlocked,
    progress: a.unlocked ? '已达成' : '未解锁',
    gradient:
      gradientMap[a.id] || 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
    icon: iconMap[a.id] || <Star className="w-7 h-7" />,
  }));
};

// Build default achievements locally (for fallback when backend not available)
const buildLocalAchievements = (
  streakDays: number,
  totalWords: number,
  totalSentences: number,
  firstCheckIn: string | null,
): Badge[] => {
  const list: AchievementData[] = [
    {
      id: 'first-checkin',
      name: '首次打卡',
      description: '完成第一次学习打卡',
      achieved: firstCheckIn !== null,
      progress: firstCheckIn ? '已达成' : '未开始',
      gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
      icon: <Zap className="w-7 h-7" />,
    },
    {
      id: 'streak-7',
      name: '七日坚持',
      description: '连续学习7天',
      achieved: streakDays >= 7,
      progress: `${streakDays}/7 天`,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
      icon: <Flame className="w-7 h-7" />,
    },
    {
      id: 'streak-30',
      name: '月度达人',
      description: '连续学习30天',
      achieved: streakDays >= 30,
      progress: `${streakDays}/30 天`,
      gradient: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
      icon: <Award className="w-7 h-7" />,
    },
    {
      id: 'streak-100',
      name: '百日学霸',
      description: '连续学习100天',
      achieved: streakDays >= 100,
      progress: `${streakDays}/100 天`,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      icon: <Crown className="w-7 h-7" />,
    },
    {
      id: 'words-100',
      name: '百词斩',
      description: '累计学习100个单词',
      achieved: totalWords >= 100,
      progress: `${totalWords}/100 词`,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #06B6D4 100%)',
      icon: <BookOpen className="w-7 h-7" />,
    },
    {
      id: 'sentences-100',
      name: '百句通',
      description: '累计练习100个句子',
      achieved: totalSentences >= 100,
      progress: `${totalSentences}/100 句`,
      gradient: 'linear-gradient(135deg, #EC4899 0%, #6366F1 100%)',
      icon: <MessageSquare className="w-7 h-7" />,
    },
  ];
  return list.map((a: AchievementData) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    achieved: a.achieved,
    progress: a.progress,
    gradient: a.gradient,
    icon: a.icon,
  }));
};

// Helper: check if error is 401 (unauthenticated)
const isUnauthError = (err: unknown): boolean => {
  return (err as { response?: { status?: number } })?.response?.status === 401;
};

// Read full state from localStorage (no mock seeding - empty on first load)
const readLocalState = (): LearningPlanState => {
  try {
    const saved: string | null = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as LearningPlanState;
      return {
        settings: data.settings || defaultSettings,
        records: data.records || [],
        totalWords: data.totalWords || 0,
        totalSentences: data.totalSentences || 0,
        firstCheckIn: data.firstCheckIn || null,
      };
    }
  } catch (err) {
    logger.error('读取本地学习计划失败', err as Error);
  }

  return {
    settings: defaultSettings,
    records: [],
    totalWords: 0,
    totalSentences: 0,
    firstCheckIn: null,
  };
};

const LearningPlanPage: React.FC = () => {
  const [settings, setSettings] = useState<PlanSettingsData>(defaultSettings);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [totalSentences, setTotalSentences] = useState<number>(0);
  const [firstCheckIn, setFirstCheckIn] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Badge[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Save full state to localStorage (fallback persistence)
  const saveLocalState = useCallback(
    (updates: Partial<LearningPlanState>): void => {
      try {
        const saved: string | null = localStorage.getItem(STORAGE_KEY);
        const current: LearningPlanState = saved
          ? (JSON.parse(saved) as LearningPlanState)
          : {
              settings: defaultSettings,
              records,
              totalWords,
              totalSentences,
              firstCheckIn,
            };
        const merged: LearningPlanState = { ...current, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        logger.error('保存本地学习计划失败', err as Error);
      }
    },
    [records, totalWords, totalSentences, firstCheckIn],
  );

  // Load data: backend first, fall back to localStorage
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      // Always seed from localStorage first for instant UI
      const local: LearningPlanState = readLocalState();
      setSettings(local.settings);
      setRecords(local.records);
      setTotalWords(local.totalWords);
      setTotalSentences(local.totalSentences);
      setFirstCheckIn(local.firstCheckIn);

      let hasBackend: boolean = false;

      // 1. Load learner profile (settings: durationTarget, reminderEnabled, reminderTime)
      try {
        const profile = await learnersApi.getMe();
        hasBackend = true;
        setIsLoggedIn(true);

        const prefs: LearnerPreferences | undefined = profile.preferences;
        setSettings((prev: PlanSettingsData) => {
          const next: PlanSettingsData = { ...prev };
          if (prefs?.dailyGoalMinutes !== undefined) {
            next.durationTarget = prefs.dailyGoalMinutes;
          }
          if (prefs?.reminderEnabled !== undefined) {
            next.reminderEnabled = prefs.reminderEnabled;
          }
          if (prefs?.reminderTime !== undefined) {
            next.startTime = prefs.reminderTime;
          }
          return next;
        });

        // Use totals from profile
        if (profile.totalWords !== undefined) {
          setTotalWords(profile.totalWords);
        }
        if (profile.continuousCheckInDays !== undefined) {
          // streak used for display, but we derive from records below too
        }
      } catch (err) {
        if (!isUnauthError(err)) {
          logger.error('加载学习者资料失败', err as Error);
        }
      }

      // 2. Load check-in history (records, streak, firstCheckIn, totals)
      try {
        const checkIns: CheckInRecord[] = await checkInApi.getCheckInHistory();
        hasBackend = true;
        setIsLoggedIn(true);

        const converted: StudyRecord[] = convertCheckInRecords(checkIns);
        setRecords(converted);

        // Compute totals from check-in records
        const wordsSum: number = converted.reduce(
          (sum: number, r: StudyRecord) => sum + r.words,
          0,
        );
        const sentSum: number = converted.reduce(
          (sum: number, r: StudyRecord) => sum + r.sentences,
          0,
        );
        if (wordsSum > 0) setTotalWords(wordsSum);
        if (sentSum > 0) setTotalSentences(sentSum);

        const firstDate: string | null =
          converted.find((r: StudyRecord) => r.minutes > 0)?.date || null;
        if (firstDate) setFirstCheckIn(firstDate);

        // Save to localStorage as backup
        saveLocalState({
          records: converted,
          totalWords: wordsSum,
          totalSentences: sentSum,
          firstCheckIn: firstDate,
        });
      } catch (err) {
        if (!isUnauthError(err)) {
          logger.error('加载打卡历史失败', err as Error);
        }
      }

      // 3. Load achievements
      try {
        const ach: Achievement[] = await learnersStatsApi.getAchievements();
        hasBackend = true;
        setIsLoggedIn(true);

        if (ach && ach.length > 0) {
          const badges: Badge[] = convertAchievements(ach);
          setAchievements(badges);
        } else {
          // Backend returned empty; fall back to locally computed
          const streakDays: number = calculateStreak(records);
          setAchievements(
            buildLocalAchievements(streakDays, totalWords, totalSentences, firstCheckIn),
          );
        }
      } catch (err) {
        if (!isUnauthError(err)) {
          logger.error('加载成就列表失败', err as Error);
        }
        // Fall back to locally computed
        const streakDays: number = calculateStreak(local.records);
        setAchievements(
          buildLocalAchievements(
            streakDays,
            local.totalWords,
            local.totalSentences,
            local.firstCheckIn,
          ),
        );
      }

      // If no backend data at all, ensure we have local achievements built
      if (!hasBackend && achievements.length === 0) {
        const streakDays: number = calculateStreak(local.records);
        setAchievements(
          buildLocalAchievements(
            streakDays,
            local.totalWords,
            local.totalSentences,
            local.firstCheckIn,
          ),
        );
      }

      setLoaded(true);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save settings: backend (for supported fields) + localStorage (for all)
  const saveSettings = (newSettings: PlanSettingsData): void => {
    // Optimistic update
    setSettings(newSettings);
    saveLocalState({ settings: newSettings });

    // Sync supported fields to backend if logged in
    if (isLoggedIn) {
      const prefs: LearnerPreferences = {
        dailyGoalMinutes: newSettings.durationTarget,
        reminderEnabled: newSettings.reminderEnabled,
        reminderTime: newSettings.startTime,
      };

      learnersApi
        .updateMe({ preferences: prefs })
        .catch((err: Error) => {
          logger.error('同步学习偏好到后端失败', err);
          // Already saved locally; user won't lose data
        });
    }
  };

  const todayStr: string = formatDate(new Date());
  const todayRecord: StudyRecord =
    records.find((r: StudyRecord) => r.date === todayStr) || {
      date: todayStr,
      minutes: 0,
      words: 0,
      sentences: 0,
    };

  // Weekly data (last 7 days)
  const weeklyData = records.slice(-7).map((r: StudyRecord) => ({
    day: getDayLabel(r.date),
    minutes: r.minutes,
    isToday: r.date === todayStr,
  }));

  // 30-day streak calendar data
  const calendarDays = records.map((r: StudyRecord) => ({
    date: r.date,
    minutes: r.minutes,
    isToday: r.date === todayStr,
  }));

  const streakDays: number = calculateStreak(records);

  // If achievements are empty (shouldn't happen after load, but safe-guard),
  // compute from local data
  const displayAchievements: Badge[] =
    achievements.length > 0
      ? achievements
      : buildLocalAchievements(streakDays, totalWords, totalSentences, firstCheckIn);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm" style={{ color: '#94A3B8' }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
     <div
       className="min-h-screen"
       style={{ background: '#EEF2FF' }}
     >
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-20 sm:pb-0">
        {/* Page Header */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock
              className="w-6 h-6"
              style={{
                color: '#6366F1',
                filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))',
              }}
            />
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{
                background:
                  'linear-gradient(135deg, #6366F1 0%, #2563EB 50%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              学习计划
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            科学规划，高效学习
          </p>
        </div>

        {/* Today Progress Card */}
        <TodayProgress
          todayMinutes={todayRecord.minutes}
          targetMinutes={settings.durationTarget}
        />

        {/* 无学习记录时的空状态提示 */}
        {totalWords === 0 && totalSentences === 0 && streakDays === 0 && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
               backgroundColor: 'rgba(255, 255, 255, 0.9)',
               border: '1px solid rgba(99, 102, 241, 0.12)',
            }}
          >
            <div
              className="text-4xl mb-3"
              style={{ color: '#6366F1' }}
            >
              📚
            </div>
             <h3 className="text-base font-semibold mb-1" style={{ color: '#1E293B' }}>
               还没有学习记录
            </h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              开始你的第一节课程，打卡记录从今天开始
            </p>
          </div>
        )}

        {/* Two-column layout: Settings + Weekly Chart */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <PlanSettings
            wordTarget={settings.wordTarget}
            sentenceTarget={settings.sentenceTarget}
            durationTarget={settings.durationTarget}
            startTime={settings.startTime}
            endTime={settings.endTime}
            reminderEnabled={settings.reminderEnabled}
            onWordTargetChange={(value: number) =>
              saveSettings({ ...settings, wordTarget: value })
            }
            onSentenceTargetChange={(value: number) =>
              saveSettings({ ...settings, sentenceTarget: value })
            }
            onDurationTargetChange={(value: number) =>
              saveSettings({ ...settings, durationTarget: value })
            }
            onStartTimeChange={(value: string) =>
              saveSettings({ ...settings, startTime: value })
            }
            onEndTimeChange={(value: string) =>
              saveSettings({ ...settings, endTime: value })
            }
            onReminderToggle={(enabled: boolean) =>
              saveSettings({ ...settings, reminderEnabled: enabled })
            }
          />

          <WeeklyChart data={weeklyData} />
        </div>

        {/* Streak Calendar */}
        <StreakCalendar days={calendarDays} streakDays={streakDays} />

        {/* Achievement Badges */}
        <AchievementBadges achievements={displayAchievements} />

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
};

export default LearningPlanPage;
