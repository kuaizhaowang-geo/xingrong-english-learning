import React from 'react';
import { Lightbulb, Award, AlertTriangle, CheckCircle, Star, Zap, Shield } from 'lucide-react';

interface GuideSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}

const CreationGuideTab: React.FC = () => {
  const sections: GuideSection[] = [
    {
      title: '如何成为创作者',
      icon: <Lightbulb className="w-5 h-5" />,
      color: '#FBBF24',
      items: [
        '完成创作者申请，填写真实身份信息',
        '通过创作者入门考试（满分 100，80 分及格）',
        '首次提交 1 份原创内容并通过审核',
        '信用等级达到 B 级及以上',
        '成功发布首个内容后即可解锁创作者中心',
      ],
    },
    {
      title: '积分规则说明',
      icon: <Star className="w-5 h-5" />,
      color: '#6366F1',
      items: [
        '内容被学习 1 次 = +1 积分',
        '内容被点赞 1 次 = +2 积分',
        '内容被收藏 1 次 = +5 积分',
        '内容被评论 1 次 = +3 积分',
        '优质内容标签：学习量 × 1.5 倍系数',
        '精选内容标签：学习量 × 2 倍系数',
        '热门内容标签：学习量 × 3 倍系数',
      ],
    },
    {
      title: '等级与权益',
      icon: <Award className="w-5 h-5" />,
      color: '#06B6D4',
      items: [
        'LV.1 新手创作者：基础发布权限',
        'LV.3 认证创作者：可参与创作者分成',
        'LV.5 优质创作者：内容优先推荐 + 专属客服',
        'LV.8 金牌创作者：官方合作机会 + 定制活动',
        'LV.10 顶级创作者：品牌合作 + 线下活动邀请',
      ],
    },
    {
      title: '违规说明',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: '#EF4444',
      items: [
        '抄袭/搬运他人内容：扣 50-500 积分，严重者封号',
        '内容错误率超过 20%：内容下架 + 扣 20 积分',
        '发布广告/引流信息：内容删除 + 扣 100 积分',
        '恶意刷数据：清零积分 + 封号处理',
        '涉及版权侵权：立即下架 + 追究法律责任',
        '低质灌水内容：驳回 + 扣 10 积分',
      ],
    },
    {
      title: '信用等级体系',
      icon: <Shield className="w-5 h-5" />,
      color: '#2563EB',
      items: [
        'AAA 级：最高信用，享有绿色通道和最高分成比例',
        'AA 级：优秀信用，审核优先处理',
        'A 级：良好信用，正常审核流程',
        'B 级：基础信用，需关注内容质量',
        'C 级：低信用，审核从严，部分功能受限',
      ],
    },
    {
      title: '快速提升技巧',
      icon: <Zap className="w-5 h-5" />,
      color: '#EC4899',
      items: [
        '选择热门学科和考点，精准满足用户需求',
        '内容配图、例句丰富，提升学习体验',
        '定期更新内容，保持用户关注度',
        '积极回复评论，建立创作者个人品牌',
        '参与官方活动，获取额外积分奖励',
        '邀请好友成为创作者，获得推荐奖励',
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section, idx) => (
        <div
          key={idx}
          className="rounded-xl p-5 transition-all hover:scale-[1.01]"
          style={{
            background: '#FFFFFF',
            border: `1px solid ${section.color}33`,
            boxShadow: `0 0 15px ${section.color}10`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${section.color}20`, color: section.color }}
            >
              {section.icon}
            </div>
            <h3 className="text-white font-semibold">{section.title}</h3>
          </div>
          <ul className="space-y-2">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: section.color }} />
                <span style={{ color: '#CBD5E1' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default CreationGuideTab;
