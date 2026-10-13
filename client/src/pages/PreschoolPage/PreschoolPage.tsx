import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, X } from 'lucide-react';
import { preschoolApi } from '@client/src/api';
import type { PreschoolModule } from '@client/src/api/preschool';
import SongsView from './SongsView';
import GamesView from './GamesView';

const PreschoolPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') || 'home';

  const [modules, setModules] = useState<PreschoolModule[]>([]);
  const [stars, setStars] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    preschoolApi.getModules().then((data: PreschoolModule[]) => {
      if (mounted) {
        setModules(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const goTo = (v: string): void => {
    navigate(`/preschool?view=${v}`);
  };

  const goBack = (): void => {
    if (view === 'home') {
      navigate('/courses');
    } else {
      navigate('/preschool?view=home');
    }
  };

  const titleMap: Record<string, string> = {
    home: '学前英语',
    alphabet: '字母乐园',
    phonics: '自然拼读',
    words: '单词世界',
    sentences: '句子城堡',
    songs: '儿歌天地',
    games: '游戏乐园',
  };

  const renderContent = (): React.ReactNode => {
    if (view === 'home') {
      if (loading) {
        return (
          <div className="flex items-center justify-center h-full text-2xl text-purple-500">
            加载中...
          </div>
        );
      }
      return (
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {modules.map((m: PreschoolModule) => (
              <button
                key={m.key}
                onClick={() => goTo(m.key)}
                className={`relative overflow-hidden rounded-3xl p-6 text-left text-white shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl bg-gradient-to-br ${m.color}`}
              >
                <div className="text-5xl mb-3">{m.emoji}</div>
                <div className="text-xl font-bold">{m.title}</div>
                <div className="text-sm opacity-90 mt-1">{m.subtitle}</div>
                <div className="absolute -right-4 -bottom-4 text-7xl opacity-20">
                  {m.emoji}
                </div>
              </button>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">🎖️ 我的成就</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-3">
                <div className="text-3xl font-bold text-fuchsia-400">26</div>
                <div className="text-xs text-slate-400 mt-1">已学字母</div>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3">
                <div className="text-3xl font-bold text-cyan-400">48</div>
                <div className="text-xs text-slate-400 mt-1">已学单词</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
                <div className="text-3xl font-bold text-yellow-400">⭐{stars}</div>
                <div className="text-xs text-slate-400 mt-1">获得星星</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (view === 'alphabet') {
      navigate('/practice/sentence?preschoolModule=alphabet&mode=typing');
      return null;
    }
    if (view === 'phonics') {
      navigate('/practice/sentence?preschoolModule=phonics&mode=typing');
      return null;
    }
    if (view === 'words') {
      // 重定向到句子练习页面（复用4种模式+键盘布局）
      navigate('/practice/sentence?preschoolModule=words&preschoolCategory=animals&mode=typing');
      return null;
    }
    if (view === 'sentences') {
      // 重定向到句子练习页面（复用4种模式+键盘布局）
      navigate('/practice/sentence?preschoolModule=sentences&preschoolCategory=greetings&mode=typing');
      return null;
    }
    if (view === 'songs') return <SongsView onBack={goBack} addStar={() => setStars(s => s + 1)} />;
    if (view === 'games') return <GamesView onBack={goBack} addStar={() => setStars(s => s + 1)} />;

    return null;
  };

  return (
    <div
      className="flex flex-col w-full"
      style={{
        height: '100vh',
        background: 'linear-gradient(180deg, #FEF3C7 0%, #FCE7F3 50%, #DBEAFE 100%)',
      }}
    >
      <header className="flex items-center justify-between px-4 h-16 shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-90 transition-transform"
          aria-label="返回"
        >
          {view === 'home' ? <ArrowLeft size={20} className="text-gray-700" /> : <X size={20} className="text-gray-700" />}
        </button>

        <h1 className="text-xl font-bold text-gray-800">
          {titleMap[view] || '学前英语'}
        </h1>

        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full">
          <Star size={18} className="text-yellow-500 fill-yellow-400" />
          <span className="font-bold text-yellow-700">{stars}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default PreschoolPage;
