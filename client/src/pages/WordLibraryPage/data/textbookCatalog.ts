// 教材目录数据 - 内置教材库
// 包含学段、版本、单词数量等信息

export type SchoolStage =
  | 'primary'
  | 'junior'
  | 'senior'
  | 'university'
  | 'study_abroad'
  | 'other'
  | 'study_card'
  | 'custom';

export const SCHOOL_STAGE_LIST: Array<{ key: SchoolStage; label: string }> = [
  { key: 'primary', label: '小学' },
  { key: 'junior', label: '初中' },
  { key: 'senior', label: '高中' },
  { key: 'university', label: '大学' },
  { key: 'study_abroad', label: '留学' },
  { key: 'other', label: '其他' },
  { key: 'study_card', label: '学习卡分享' },
  { key: 'custom', label: '自定义' },
];

// 25+ 教材版本
export const PUBLISHER_LIST: string[] = [
  '人教版（PEP）',
  '人教版（一年级起点）',
  '人教版（精通版）',
  '译林版',
  '外研社',
  '北师大版',
  '北京版',
  '沪教版',
  '鲁科版五四学制',
  '牛津上海版',
  '冀教版（三年级起点）',
  '重庆大学版',
  '粤教沪外教版',
  '闽教版',
  '鲁教版',
  '湘少版',
  '科普版',
  '教科版（广州）',
  '陕旅版',
  '外研版（孙主编）',
  '外研版（陈主编）',
  '外研版Join In',
  '沪教版（五·四学制）',
  '鲁湘版',
  '其他',
];

export interface TextbookCatalogItem {
  id: string;
  title: string;
  stage: SchoolStage;
  publisher: string;
  grade: string;
  term: string; // 上册 / 下册 / 全一册
  wordCount: number;
  unitCount: number;
  coverColor: string; // 卡片封面渐变色
}

// 生成渐变色辅助函数
const pickColor = (idx: number): string => {
  const colors = [
    'from-violet-500 to-indigo-600',
    'from-blue-500 to-cyan-500',
    'from-fuchsia-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-sky-500 to-blue-600',
    'from-purple-500 to-fuchsia-600',
  ];
  return colors[idx % colors.length];
};

// 小学 - 人教版（PEP）3-6年级上下册 共8本（核心数据）
const primaryPEP: TextbookCatalogItem[] = [
  { id: 'pep-3a', title: '(新课标) 三年级上册', stage: 'primary', publisher: '人教版（PEP）', grade: '三年级', term: '上册', wordCount: 107, unitCount: 6, coverColor: pickColor(0) },
  { id: 'pep-3b', title: '(新课标) 三年级下册', stage: 'primary', publisher: '人教版（PEP）', grade: '三年级', term: '下册', wordCount: 98, unitCount: 6, coverColor: pickColor(1) },
  { id: 'pep-4a', title: '(新课标) 四年级上册', stage: 'primary', publisher: '人教版（PEP）', grade: '四年级', term: '上册', wordCount: 112, unitCount: 6, coverColor: pickColor(2) },
  { id: 'pep-4b', title: '(新课标) 四年级下册', stage: 'primary', publisher: '人教版（PEP）', grade: '四年级', term: '下册', wordCount: 105, unitCount: 6, coverColor: pickColor(3) },
  { id: 'pep-5a', title: '(新课标) 五年级上册', stage: 'primary', publisher: '人教版（PEP）', grade: '五年级', term: '上册', wordCount: 118, unitCount: 6, coverColor: pickColor(4) },
  { id: 'pep-5b', title: '(新课标) 五年级下册', stage: 'primary', publisher: '人教版（PEP）', grade: '五年级', term: '下册', wordCount: 110, unitCount: 6, coverColor: pickColor(5) },
  { id: 'pep-6a', title: '(新课标) 六年级上册', stage: 'primary', publisher: '人教版（PEP）', grade: '六年级', term: '上册', wordCount: 120, unitCount: 6, coverColor: pickColor(6) },
  { id: 'pep-6b', title: '(新课标) 六年级下册', stage: 'primary', publisher: '人教版（PEP）', grade: '六年级', term: '下册', wordCount: 86, unitCount: 4, coverColor: pickColor(7) },
];

// 小学 - 人教版（一年级起点）
const primaryRenjiao1: TextbookCatalogItem[] = [
  { id: 'rj1-1a', title: '一年级上册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '一年级', term: '上册', wordCount: 65, unitCount: 6, coverColor: pickColor(0) },
  { id: 'rj1-1b', title: '一年级下册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '一年级', term: '下册', wordCount: 72, unitCount: 6, coverColor: pickColor(1) },
  { id: 'rj1-2a', title: '二年级上册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '二年级', term: '上册', wordCount: 85, unitCount: 6, coverColor: pickColor(2) },
  { id: 'rj1-2b', title: '二年级下册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '二年级', term: '下册', wordCount: 90, unitCount: 6, coverColor: pickColor(3) },
  { id: 'rj1-3a', title: '三年级上册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '三年级', term: '上册', wordCount: 102, unitCount: 6, coverColor: pickColor(4) },
  { id: 'rj1-3b', title: '三年级下册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '三年级', term: '下册', wordCount: 95, unitCount: 6, coverColor: pickColor(5) },
  { id: 'rj1-4a', title: '四年级上册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '四年级', term: '上册', wordCount: 108, unitCount: 6, coverColor: pickColor(6) },
  { id: 'rj1-4b', title: '四年级下册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '四年级', term: '下册', wordCount: 100, unitCount: 6, coverColor: pickColor(7) },
  { id: 'rj1-5a', title: '五年级上册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '五年级', term: '上册', wordCount: 115, unitCount: 6, coverColor: pickColor(0) },
  { id: 'rj1-5b', title: '五年级下册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '五年级', term: '下册', wordCount: 108, unitCount: 6, coverColor: pickColor(1) },
  { id: 'rj1-6a', title: '六年级上册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '六年级', term: '上册', wordCount: 122, unitCount: 6, coverColor: pickColor(2) },
  { id: 'rj1-6b', title: '六年级下册', stage: 'primary', publisher: '人教版（一年级起点）', grade: '六年级', term: '下册', wordCount: 92, unitCount: 4, coverColor: pickColor(3) },
];

// 小学 - 人教版（精通版）
const primaryJingtong: TextbookCatalogItem[] = [
  { id: 'jt-3a', title: '精通版三年级上册', stage: 'primary', publisher: '人教版（精通版）', grade: '三年级', term: '上册', wordCount: 88, unitCount: 6, coverColor: pickColor(4) },
  { id: 'jt-3b', title: '精通版三年级下册', stage: 'primary', publisher: '人教版（精通版）', grade: '三年级', term: '下册', wordCount: 82, unitCount: 6, coverColor: pickColor(5) },
  { id: 'jt-4a', title: '精通版四年级上册', stage: 'primary', publisher: '人教版（精通版）', grade: '四年级', term: '上册', wordCount: 95, unitCount: 6, coverColor: pickColor(6) },
  { id: 'jt-4b', title: '精通版四年级下册', stage: 'primary', publisher: '人教版（精通版）', grade: '四年级', term: '下册', wordCount: 90, unitCount: 6, coverColor: pickColor(7) },
  { id: 'jt-5a', title: '精通版五年级上册', stage: 'primary', publisher: '人教版（精通版）', grade: '五年级', term: '上册', wordCount: 105, unitCount: 6, coverColor: pickColor(0) },
  { id: 'jt-5b', title: '精通版五年级下册', stage: 'primary', publisher: '人教版（精通版）', grade: '五年级', term: '下册', wordCount: 100, unitCount: 6, coverColor: pickColor(1) },
  { id: 'jt-6a', title: '精通版六年级上册', stage: 'primary', publisher: '人教版（精通版）', grade: '六年级', term: '上册', wordCount: 112, unitCount: 6, coverColor: pickColor(2) },
  { id: 'jt-6b', title: '精通版六年级下册', stage: 'primary', publisher: '人教版（精通版）', grade: '六年级', term: '下册', wordCount: 78, unitCount: 4, coverColor: pickColor(3) },
];

// 小学 - 译林版
const primaryYilin: TextbookCatalogItem[] = [
  { id: 'yl-3a', title: '译林版三年级上册', stage: 'primary', publisher: '译林版', grade: '三年级', term: '上册', wordCount: 92, unitCount: 8, coverColor: pickColor(4) },
  { id: 'yl-3b', title: '译林版三年级下册', stage: 'primary', publisher: '译林版', grade: '三年级', term: '下册', wordCount: 88, unitCount: 8, coverColor: pickColor(5) },
  { id: 'yl-4a', title: '译林版四年级上册', stage: 'primary', publisher: '译林版', grade: '四年级', term: '上册', wordCount: 100, unitCount: 8, coverColor: pickColor(6) },
  { id: 'yl-4b', title: '译林版四年级下册', stage: 'primary', publisher: '译林版', grade: '四年级', term: '下册', wordCount: 95, unitCount: 8, coverColor: pickColor(7) },
  { id: 'yl-5a', title: '译林版五年级上册', stage: 'primary', publisher: '译林版', grade: '五年级', term: '上册', wordCount: 110, unitCount: 8, coverColor: pickColor(0) },
  { id: 'yl-5b', title: '译林版五年级下册', stage: 'primary', publisher: '译林版', grade: '五年级', term: '下册', wordCount: 105, unitCount: 8, coverColor: pickColor(1) },
  { id: 'yl-6a', title: '译林版六年级上册', stage: 'primary', publisher: '译林版', grade: '六年级', term: '上册', wordCount: 118, unitCount: 8, coverColor: pickColor(2) },
  { id: 'yl-6b', title: '译林版六年级下册', stage: 'primary', publisher: '译林版', grade: '六年级', term: '下册', wordCount: 85, unitCount: 6, coverColor: pickColor(3) },
];

// 小学 - 外研社
const primaryWaiyanshe: TextbookCatalogItem[] = [
  { id: 'wys-3a', title: '外研社三年级上册', stage: 'primary', publisher: '外研社', grade: '三年级', term: '上册', wordCount: 90, unitCount: 7, coverColor: pickColor(4) },
  { id: 'wys-3b', title: '外研社三年级下册', stage: 'primary', publisher: '外研社', grade: '三年级', term: '下册', wordCount: 85, unitCount: 7, coverColor: pickColor(5) },
  { id: 'wys-4a', title: '外研社四年级上册', stage: 'primary', publisher: '外研社', grade: '四年级', term: '上册', wordCount: 98, unitCount: 7, coverColor: pickColor(6) },
  { id: 'wys-4b', title: '外研社四年级下册', stage: 'primary', publisher: '外研社', grade: '四年级', term: '下册', wordCount: 93, unitCount: 7, coverColor: pickColor(7) },
  { id: 'wys-5a', title: '外研社五年级上册', stage: 'primary', publisher: '外研社', grade: '五年级', term: '上册', wordCount: 108, unitCount: 7, coverColor: pickColor(0) },
  { id: 'wys-5b', title: '外研社五年级下册', stage: 'primary', publisher: '外研社', grade: '五年级', term: '下册', wordCount: 102, unitCount: 7, coverColor: pickColor(1) },
  { id: 'wys-6a', title: '外研社六年级上册', stage: 'primary', publisher: '外研社', grade: '六年级', term: '上册', wordCount: 115, unitCount: 7, coverColor: pickColor(2) },
  { id: 'wys-6b', title: '外研社六年级下册', stage: 'primary', publisher: '外研社', grade: '六年级', term: '下册', wordCount: 82, unitCount: 5, coverColor: pickColor(3) },
];

// 小学 - 其他版本（各1-2本占位）
const primaryOthers: TextbookCatalogItem[] = [
  { id: 'bsd-5a', title: '北师大版五年级上册', stage: 'primary', publisher: '北师大版', grade: '五年级', term: '上册', wordCount: 102, unitCount: 6, coverColor: pickColor(4) },
  { id: 'bsd-6a', title: '北师大版六年级上册', stage: 'primary', publisher: '北师大版', grade: '六年级', term: '上册', wordCount: 110, unitCount: 6, coverColor: pickColor(5) },
  { id: 'bj-4a', title: '北京版四年级上册', stage: 'primary', publisher: '北京版', grade: '四年级', term: '上册', wordCount: 95, unitCount: 6, coverColor: pickColor(6) },
  { id: 'hj-5a', title: '沪教版五年级上册', stage: 'primary', publisher: '沪教版', grade: '五年级', term: '上册', wordCount: 100, unitCount: 6, coverColor: pickColor(7) },
  { id: 'lk-4a', title: '鲁科版五四学制四年级上册', stage: 'primary', publisher: '鲁科版五四学制', grade: '四年级', term: '上册', wordCount: 88, unitCount: 6, coverColor: pickColor(0) },
  { id: 'nj-5a', title: '牛津上海版五年级上册', stage: 'primary', publisher: '牛津上海版', grade: '五年级', term: '上册', wordCount: 95, unitCount: 6, coverColor: pickColor(1) },
  { id: 'jj-4a', title: '冀教版三年级起点四年级上册', stage: 'primary', publisher: '冀教版（三年级起点）', grade: '四年级', term: '上册', wordCount: 92, unitCount: 6, coverColor: pickColor(2) },
  { id: 'cqu-5a', title: '重庆大学版五年级上册', stage: 'primary', publisher: '重庆大学版', grade: '五年级', term: '上册', wordCount: 90, unitCount: 6, coverColor: pickColor(3) },
  { id: 'yjhw-4a', title: '粤教沪外教版四年级上册', stage: 'primary', publisher: '粤教沪外教版', grade: '四年级', term: '上册', wordCount: 88, unitCount: 6, coverColor: pickColor(4) },
  { id: 'mj-5a', title: '闽教版五年级上册', stage: 'primary', publisher: '闽教版', grade: '五年级', term: '上册', wordCount: 92, unitCount: 6, coverColor: pickColor(5) },
  { id: 'lj-6a', title: '鲁教版六年级上册', stage: 'primary', publisher: '鲁教版', grade: '六年级', term: '上册', wordCount: 105, unitCount: 6, coverColor: pickColor(6) },
  { id: 'xs-4a', title: '湘少版四年级上册', stage: 'primary', publisher: '湘少版', grade: '四年级', term: '上册', wordCount: 90, unitCount: 6, coverColor: pickColor(7) },
  { id: 'kp-5a', title: '科普版五年级上册', stage: 'primary', publisher: '科普版', grade: '五年级', term: '上册', wordCount: 85, unitCount: 6, coverColor: pickColor(0) },
  { id: 'jk-4a', title: '教科版（广州）四年级上册', stage: 'primary', publisher: '教科版（广州）', grade: '四年级', term: '上册', wordCount: 92, unitCount: 6, coverColor: pickColor(1) },
  { id: 'sl-5a', title: '陕旅版五年级上册', stage: 'primary', publisher: '陕旅版', grade: '五年级', term: '上册', wordCount: 88, unitCount: 6, coverColor: pickColor(2) },
  { id: 'wys-sun-4a', title: '外研版（孙主编）四年级上册', stage: 'primary', publisher: '外研版（孙主编）', grade: '四年级', term: '上册', wordCount: 95, unitCount: 6, coverColor: pickColor(3) },
  { id: 'wys-chen-5a', title: '外研版（陈主编）五年级上册', stage: 'primary', publisher: '外研版（陈主编）', grade: '五年级', term: '上册', wordCount: 92, unitCount: 6, coverColor: pickColor(4) },
  { id: 'wys-join-4a', title: '外研版Join In四年级上册', stage: 'primary', publisher: '外研版Join In', grade: '四年级', term: '上册', wordCount: 90, unitCount: 6, coverColor: pickColor(5) },
  { id: 'hj-54-5a', title: '沪教版（五·四学制）五年级上册', stage: 'primary', publisher: '沪教版（五·四学制）', grade: '五年级', term: '上册', wordCount: 93, unitCount: 6, coverColor: pickColor(6) },
  { id: 'lx-4a', title: '鲁湘版四年级上册', stage: 'primary', publisher: '鲁湘版', grade: '四年级', term: '上册', wordCount: 85, unitCount: 6, coverColor: pickColor(7) },
];

// 初中教材（占位数据）
const juniorBooks: TextbookCatalogItem[] = [
  { id: 'pep-j7a', title: '人教版七年级上册', stage: 'junior', publisher: '人教版（PEP）', grade: '七年级', term: '上册', wordCount: 380, unitCount: 10, coverColor: pickColor(0) },
  { id: 'pep-j7b', title: '人教版七年级下册', stage: 'junior', publisher: '人教版（PEP）', grade: '七年级', term: '下册', wordCount: 420, unitCount: 12, coverColor: pickColor(1) },
  { id: 'pep-j8a', title: '人教版八年级上册', stage: 'junior', publisher: '人教版（PEP）', grade: '八年级', term: '上册', wordCount: 450, unitCount: 10, coverColor: pickColor(2) },
  { id: 'pep-j8b', title: '人教版八年级下册', stage: 'junior', publisher: '人教版（PEP）', grade: '八年级', term: '下册', wordCount: 480, unitCount: 10, coverColor: pickColor(3) },
  { id: 'pep-j9a', title: '人教版九年级全一册', stage: 'junior', publisher: '人教版（PEP）', grade: '九年级', term: '全一册', wordCount: 520, unitCount: 14, coverColor: pickColor(4) },
  { id: 'yl-j7a', title: '译林版七年级上册', stage: 'junior', publisher: '译林版', grade: '七年级', term: '上册', wordCount: 360, unitCount: 8, coverColor: pickColor(5) },
  { id: 'wys-j7a', title: '外研社七年级上册', stage: 'junior', publisher: '外研社', grade: '七年级', term: '上册', wordCount: 370, unitCount: 10, coverColor: pickColor(6) },
  { id: 'bsd-j7a', title: '北师大版七年级上册', stage: 'junior', publisher: '北师大版', grade: '七年级', term: '上册', wordCount: 350, unitCount: 8, coverColor: pickColor(7) },
];

// 高中教材（占位数据）
const seniorBooks: TextbookCatalogItem[] = [
  { id: 'pep-s1a', title: '人教版必修第一册', stage: 'senior', publisher: '人教版（PEP）', grade: '高一', term: '上册', wordCount: 420, unitCount: 5, coverColor: pickColor(0) },
  { id: 'pep-s1b', title: '人教版必修第二册', stage: 'senior', publisher: '人教版（PEP）', grade: '高一', term: '下册', wordCount: 450, unitCount: 5, coverColor: pickColor(1) },
  { id: 'pep-s2a', title: '人教版必修第三册', stage: 'senior', publisher: '人教版（PEP）', grade: '高二', term: '上册', wordCount: 480, unitCount: 5, coverColor: pickColor(2) },
  { id: 'pep-s2b', title: '人教版选择性必修一', stage: 'senior', publisher: '人教版（PEP）', grade: '高二', term: '下册', wordCount: 500, unitCount: 5, coverColor: pickColor(3) },
  { id: 'pep-s3', title: '人教版选择性必修二', stage: 'senior', publisher: '人教版（PEP）', grade: '高三', term: '全一册', wordCount: 480, unitCount: 5, coverColor: pickColor(4) },
  { id: 'wys-s1a', title: '外研社必修第一册', stage: 'senior', publisher: '外研社', grade: '高一', term: '上册', wordCount: 400, unitCount: 6, coverColor: pickColor(5) },
  { id: 'yl-s1a', title: '译林版必修第一册', stage: 'senior', publisher: '译林版', grade: '高一', term: '上册', wordCount: 410, unitCount: 5, coverColor: pickColor(6) },
];

// 大学教材（占位数据）
const universityBooks: TextbookCatalogItem[] = [
  { id: 'uni-cet4', title: '大学英语四级核心词汇', stage: 'university', publisher: '其他', grade: '大学', term: '全一册', wordCount: 2500, unitCount: 30, coverColor: pickColor(0) },
  { id: 'uni-cet6', title: '大学英语六级核心词汇', stage: 'university', publisher: '其他', grade: '大学', term: '全一册', wordCount: 3000, unitCount: 30, coverColor: pickColor(1) },
  { id: 'uni-college1', title: '新视野大学英语1', stage: 'university', publisher: '其他', grade: '大一', term: '上册', wordCount: 800, unitCount: 10, coverColor: pickColor(2) },
  { id: 'uni-college2', title: '新视野大学英语2', stage: 'university', publisher: '其他', grade: '大一', term: '下册', wordCount: 850, unitCount: 10, coverColor: pickColor(3) },
];

// 留学词汇（占位数据）
const studyAbroadBooks: TextbookCatalogItem[] = [
  { id: 'sa-ielts', title: '雅思核心词汇', stage: 'study_abroad', publisher: '其他', grade: '留学', term: '全一册', wordCount: 3500, unitCount: 30, coverColor: pickColor(4) },
  { id: 'sa-toefl', title: '托福核心词汇', stage: 'study_abroad', publisher: '其他', grade: '留学', term: '全一册', wordCount: 3800, unitCount: 30, coverColor: pickColor(5) },
  { id: 'sa-gre', title: 'GRE核心词汇', stage: 'study_abroad', publisher: '其他', grade: '留学', term: '全一册', wordCount: 4000, unitCount: 30, coverColor: pickColor(6) },
];

// 其他/自定义
const otherBooks: TextbookCatalogItem[] = [
  { id: 'other-ket', title: 'KET核心词汇', stage: 'other', publisher: '其他', grade: '通用', term: '全一册', wordCount: 1500, unitCount: 20, coverColor: pickColor(7) },
  { id: 'other-pet', title: 'PET核心词汇', stage: 'other', publisher: '其他', grade: '通用', term: '全一册', wordCount: 2000, unitCount: 20, coverColor: pickColor(0) },
  { id: 'other-daily', title: '日常英语2000词', stage: 'other', publisher: '其他', grade: '通用', term: '全一册', wordCount: 2000, unitCount: 20, coverColor: pickColor(1) },
  { id: 'custom-1', title: '我的自定义词书', stage: 'custom', publisher: '其他', grade: '自定义', term: '全一册', wordCount: 0, unitCount: 0, coverColor: pickColor(2) },
];

// 学习卡分享（占位数据）
const studyCardBooks: TextbookCatalogItem[] = [
  { id: 'card-1', title: '高频核心词卡 · 初级', stage: 'study_card', publisher: '其他', grade: '分享卡', term: '全一册', wordCount: 200, unitCount: 10, coverColor: pickColor(3) },
  { id: 'card-2', title: '高频核心词卡 · 中级', stage: 'study_card', publisher: '其他', grade: '分享卡', term: '全一册', wordCount: 350, unitCount: 15, coverColor: pickColor(4) },
  { id: 'card-3', title: '高频核心词卡 · 高级', stage: 'study_card', publisher: '其他', grade: '分享卡', term: '全一册', wordCount: 500, unitCount: 20, coverColor: pickColor(5) },
  { id: 'card-4', title: '场景对话词卡', stage: 'study_card', publisher: '其他', grade: '分享卡', term: '全一册', wordCount: 180, unitCount: 12, coverColor: pickColor(6) },
];

export const TEXTBOOK_CATALOG: TextbookCatalogItem[] = [
  ...primaryPEP,
  ...primaryRenjiao1,
  ...primaryJingtong,
  ...primaryYilin,
  ...primaryWaiyanshe,
  ...primaryOthers,
  ...juniorBooks,
  ...seniorBooks,
  ...universityBooks,
  ...studyAbroadBooks,
  ...otherBooks,
  ...studyCardBooks,
];

// 根据学段获取可用的版本列表
export function getPublishersByStage(stage: SchoolStage): string[] {
  const publishers = new Set<string>();
  TEXTBOOK_CATALOG.forEach((tb) => {
    if (tb.stage === stage) publishers.add(tb.publisher);
  });
  // 按 PUBLISHER_LIST 顺序排序
  return PUBLISHER_LIST.filter((p) => publishers.has(p));
}
