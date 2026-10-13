// 星荣英语学习平台 - 前后端共享类型定义

export interface CourseItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  coverImage?: string;
  price: string;
  originalPrice?: string;
  sharedCount: number;
  level: string;
  totalLessons: number;
  totalMinutes: number;
  tags: string[];
  isFree: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  lessonOrder: number;
  durationMinutes: number;
  contentType: string;
  sentenceCount: number;
  wordCount: number;
  dictationCount: number;
}

export interface GrammarComponent {
  id: string;
  text: string;
  type: string;
}

export interface SentencePuzzle {
  id: string;
  lessonId?: string;
  courseId?: string;
  textbookId?: string;
  unitId?: string;
  sentence: string;
  translation: string;
  grammarComponents: GrammarComponent[];
  difficulty: number;
  puzzleOrder: number;
  illustrationUrl?: string;
  imageUrl?: string;
  sentenceType?: string;
  wordParses?: WordParse[];
  grammarAnalysis?: string;
}

export interface DictationItem {
  id: string;
  lessonId?: string;
  courseId?: string;
  textbookId?: string;
  unitId?: string;
  sentence: string;
  translation: string;
  hint?: string;
  difficulty: number;
  itemOrder: number;
}

export interface WordItem {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  rootAffix?: string;
  memoryTip?: string;
  level: string;
  tags: string[];
  textbookId?: string;
  unitId?: string;
  wordOrder?: number;
  imageUrl?: string;
}

export interface WordAffix {
  id: string;
  affix: string;
  affixType: string;
  meaning: string;
  exampleWords: string[];
  exampleWordsCount: number;
  description: string;
  difficultyLevel: number;
}

export interface WordAffixDetail {
  affix: WordAffix;
  words: WordItem[];
}

export interface WordNote {
  id: string;
  wordId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface WordStats {
  totalWords: number;
  mastered: number;
  learning: number;
  new_: number;
  todayReview: number;
  streakDays: number;
  todayLearned: number;
}

export interface WordWithRecord extends WordItem {
  familiarity?: number;
  ebbinghausLevel?: number;
  status?: string;
  isFavorite?: boolean;
  wrongCount?: number;
}

export interface WordFavorite {
  id: string;
  wordId: string;
  createdAt: string;
  word?: WordItem;
}

export interface Textbook {
  id: string;
  title: string;
  publisher: string;
  grade: string;
  semester: string;
  coverImage?: string;
  description?: string;
  totalUnits: number;
  sortOrder: number;
  isPublished: boolean;
}

export interface TextbookUnit {
  id: string;
  textbookId: string;
  title: string;
  topic?: string;
  unitOrder: number;
  keySentences: string[];
  keyWords: string[];
}

// ===== 教材树（全科） =====

export interface TextbookTreeItem {
  id: string;
  subject: string;
  title: string;
  publisher: string;
  grade: string;
  semester: string;
  coverImage?: string;
  description?: string;
  totalUnits: number;
  sortOrder: number;
  isPublished?: boolean;
  units?: TextbookUnit[];
}

export interface TextbookWithUnits {
  textbook: Textbook;
  units: TextbookUnit[];
}

// ===== 小学语文 =====

export interface ChineseNewWord {
  word: string;
  pinyin: string;
  radical: string;
  strokes: number;
  meaning: string;
  partOfSpeech?: string;
}

export interface ChineseWordItem {
  word: string;
  pinyin: string;
  meaning: string;
}

export interface ChineseLessonAnalysisPoint {
  point: string;
  detail: string;
}

export interface ChineseLesson {
  id: string;
  textbookId: string;
  unitId: string;
  title: string;
  lessonOrder: number;
  lessonType: string;
  content: string;
  author?: string;
  source?: string;
  newWords: ChineseNewWord[];
  wordList: ChineseWordItem[];
  analysis: ChineseLessonAnalysisPoint[];
}

// ===== 小学数学 =====

export interface MathExample {
  question: string;
  solution: string;
  answer: string;
}

export interface MathTopic {
  id: string;
  textbookId: string;
  unitId: string;
  title: string;
  topicOrder: number;
  domain: string;
  description: string;
  keyPoints: string;
  examples: MathExample[];
  practiceCount: number;
  explanation?: string;
  exampleQuestion?: string;
  exampleAnswer?: string;
  practiceItems?: MathPracticeItem[];
  shapePuzzles?: ShapePuzzleItem[];
}

export interface MathPracticeOption {
  label: string;
  text: string;
}

export interface MathPracticeItem {
  id: string;
  topicId: string;
  textbookId: string;
  unitId: string;
  question: string;
  options?: MathPracticeOption[];
  correctAnswer: string;
  solution?: string;
  difficulty: number;
  itemOrder: number;
  itemType: string;
  knowledgePoint?: string;
}

export interface MathPracticeSession {
  id: string;
  grade?: string;
  semester?: string;
  unitId?: string;
  topicId?: string;
  count: number;
  itemTypes: string[];
  difficulty?: string;
  mode: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  duration: number;
  status: 'in_progress' | 'completed';
  createdAt: string;
}

export interface MathWrongQuestion {
  id: string;
  itemId: string;
  questionText: string;
  correctAnswer: string;
  lastWrongAnswer: string;
  wrongCount: number;
  masterStatus: string;
  itemType: string;
  lastWrongAt: string;
}

export interface MathKnowledgeMastery {
  id: string;
  topicId: string;
  topicTitle?: string;
  practiceCount: number;
  correctCount: number;
  accuracy: number;
  lastPracticeTime?: string;
  masteryLevel: string;
}

export interface CreateMathPracticeSessionReqDto {
  grade?: string;
  semester?: string;
  unitId?: string;
  topicId?: string;
  count: number;
  itemTypes?: string[];
  difficulty?: string;
  mode: string;
}

export interface SubmitMathAnswerDto {
  itemId: string;
  userAnswer: string;
  timeSpent?: number;
}

export interface SubmitMathAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  solution?: string;
  session: MathPracticeSession;
}

export interface MathPracticeStats {
  totalPracticeCount: number;
  totalCorrectCount: number;
  totalWrongCount: number;
  overallAccuracy: number;
  masteredTopics: number;
  learningTopics: number;
  wrongQuestionCount: number;
}

export interface FinishMathSessionDto {
  duration: number;
}

export interface MathWordProblemItem {
  id: string;
  topicId: string;
  textbookId: string;
  unitId: string;
  question: string;
  correctAnswer: string;
  solution?: string;
  difficulty: number;
  itemOrder: number;
}

export interface ShapePuzzlePiece {
  id: string;
  shape: string;
  label: string;
  correct: boolean;
}

export interface ShapePuzzleItem {
  id: string;
  topicId: string;
  textbookId: string;
  unitId: string;
  title: string;
  puzzleOrder: number;
  puzzleType: string;
  targetShape?: string;
  pieces: ShapePuzzlePiece[];
  description?: string;
  difficulty: number;
}

// ===== 数学练习（升级功能） =====

export interface MentalArithmeticItem {
  id: string;
  question: string;
  answer: string;
  itemType: 'fillblank' | 'choice';
  options?: MathPracticeOption[];
  difficulty: number;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
}

export interface ShapeInfo {
  id: string;
  name: string;
  shapeType: '2d' | '3d';
  properties: Record<string, string | number>;
  description: string;
}

export interface MathShapeListResponse {
  shapes2d: ShapeInfo[];
  shapes3d: ShapeInfo[];
}

export interface MathPuzzleListItem {
  id: string;
  title: string;
  targetShape?: string;
  difficulty: number;
  description?: string;
}

export interface UnitLessonsResponse {
  chineseLessons: ChineseLesson[];
  mathTopics: MathTopic[];
}

// ===== 学习者 & 用户数据 =====

export interface LearnerProfile {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  level: string;
  totalStudyMinutes: number;
  totalWords: number;
  totalChineseLessons: number;
  totalMathTopics: number;
  continuousCheckInDays: number;
  totalCheckInDays: number;
  vipStatus: boolean;
  vipExpireAt?: string;
  preferences?: LearnerPreferences;
}

export interface LearnerPreferences {
  dailyGoalMinutes?: number;
  reminderEnabled?: boolean;
  reminderTime?: string;
  wordMode?: string;
  wordDisplayMode?: 'card' | 'list';
  difficultyPreference?: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  dailyNewWords?: number;
}

export interface UserCourse {
  id: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalStudyMinutes: number;
  lastStudyAt?: string;
  status: string;
  course?: CourseItem;
}

export interface UserLessonProgressItem {
  id: string;
  courseId: string;
  lessonId: string;
  status: string;
  score: number;
  studyMinutes: number;
  completedAt?: string;
}

export interface UserWordRecord {
  id: string;
  wordId: string;
  familiarity: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  ebbinghausLevel: number;
  status: string;
  word?: WordItem;
}

export type ReviewMode = 'fast' | 'full' | 'wrong';
export type ReviewResult = 'known' | 'unknown';

export interface WordRelation {
  id: string;
  wordId: string;
  relatedWordId: string;
  relationType: string;
  relatedWord?: WordItem;
  familiarity?: number;
}

export interface WordRelatedGroup {
  type: string;
  label: string;
  items: WordItem[];
}

export type WordStatsRange = 'today' | 'week' | 'month' | 'all';

export interface WordLearningStats {
  overview: {
    wordsLearned: number;
    wordsReviewed: number;
    pendingReview: number;
    accuracy: number;
    streakDays: number;
  };
  masteryDistribution: {
    level: string;
    count: number;
    percentage: number;
  }[];
  weeklyTrend: {
    date: string;
    learned: number;
    reviewed: number;
  }[];
  textbookMastery: {
    textbookId: string;
    textbookName: string;
    totalWords: number;
    masteredWords: number;
    masteryRate: number;
  }[];
  wrongWordsStats: {
    total: number;
    todayNew: number;
    topWords: WordItem[];
  };
  practiceModeStats: {
    mode: string;
    label: string;
    count: number;
    accuracy: number;
  }[];
}

export interface CheckInRecord {
  id: string;
  checkInDate: string;
  studyMinutes: number;
  wordsLearned: number;
  sentencesCompleted: number;
  chineseLessonsLearned: number;
  mathTopicsLearned: number;
}

export type JournalType = 'diary' | 'wrong-note' | 'knowledge' | 'free';

export interface JournalRichData {
  type: JournalType;
  contentHtml?: string;
  tags: string[];
  images: string[];
}

export interface StudyJournal extends JournalRichData {
  id: string;
  journalDate: string;
  content?: string;
  mood: string;
  masteryScore: number;
  highlights: string[];
}

export interface JournalCalendarDay {
  hasJournal: boolean;
  mood?: string;
  masteryScore?: number;
}

export interface JournalCalendarResponse {
  [date: string]: JournalCalendarDay;
}

export interface AiSummarizeDto {
  content: string;
}

export interface AiSummarizeResponse {
  summary: string;
}

export interface AiWrongQuestionDto {
  question: string;
  wrongAnswer?: string;
  correctAnswer?: string;
}

export interface AiWrongQuestionResponse {
  analysis: string;
  similarQuestions: string[];
}

export interface AiKnowledgeOrganizeDto {
  knowledge: string;
}

export interface AiKnowledgeOrganizeResponse {
  structured: string;
}

export type RankingType = 'studyTime' | 'wins' | 'winRate' | 'typingWpm' | 'typingAccuracy';
export type RankingPeriod = 'weekly' | 'monthly' | 'yearly';

export interface RankItem {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  /** 排序用的原始数值：学习时长(分钟) / 胜场数 / 胜率(百分比0-100) / 打字WPM / 打字准确率(0-100) */
  value: number;
  studyMinutes: number;
  wins: number;
  totalMatches: number;
  level: string;
  typingWpm?: number;
  typingAccuracy?: number;
}

export interface RankingResponse {
  items: RankItem[];
  myRank: RankItem | null;
}

export interface AICourse {
  id: string;
  title: string;
  topic: string;
  learningGoal?: string;
  level: string;
  content: AICourseContent;
  status: string;
  createdAt: string;
}

export interface AICourseContent {
  words?: AIWordItem[];
  sentences?: AISentenceItem[];
  dialogues?: AIDialogueItem[];
  grammar?: AIGrammarItem[];
  vocabulary?: string[];
}

export interface AIWordItem {
  word: string;
  meaning: string;
  phonetic?: string;
  example: string;
}

export interface AIGenerateWordItem {
  word: string;
  meaning: string;
  phonetic: string;
  example: string;
}

export interface AIGenerateSentenceItem {
  sentence: string;
  translation: string;
  grammarComponents: GrammarComponent[];
}

export interface AISentenceItem {
  sentence: string;
  translation: string;
  components: GrammarComponent[];
}

export interface AIDialogueItem {
  speaker: string;
  text: string;
  translation: string;
}

export interface AIGrammarItem {
  point: string;
  explanation: string;
  example: string;
}

// ===== 语文练习 =====

export interface ChineseDictationItem {
  character: string;
  pinyin: string;
  meaning: string;
  radical?: string;
  strokes?: number;
  words?: string[];
  example?: string;
}

// ===== 语文生字听写 Session =====

export type DictationMode =
  | 'pinyin_to_char'
  | 'char_to_pinyin'
  | 'audio_to_char'
  | 'audio_to_pinyin';

export type DictationSpeechRate = 'slow' | 'normal' | 'fast';

export interface DictationSessionWord {
  id: string;
  sessionId: string;
  wordId: string;
  word: string;
  pinyin: string;
  radical?: string;
  strokes?: number;
  meaning?: string;
  words?: string[];
  example?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  answeredAt?: string;
  wordOrder: number;
}

export interface DictationSession {
  id: string;
  userId: string;
  subject: string;
  grade?: string;
  semester?: string;
  textbookId?: string;
  unitId?: string;
  mode: DictationMode;
  speechRate: DictationSpeechRate;
  totalCount: number;
  correctCount: number;
  currentIndex: number;
  status: 'pending' | 'in_progress' | 'completed';
  words: DictationSessionWord[];
  startTime?: string;
  endTime?: string;
  durationSeconds?: number;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DictationWrongWord {
  id: string;
  userId: string;
  wordId: string;
  word: string;
  pinyin: string;
  radical?: string;
  strokes?: number;
  meaning?: string;
  words?: string[];
  example?: string;
  wrongCount: number;
  lastWrongAt: string;
  mastered: boolean;
  grade?: string;
  semester?: string;
}

export interface CreateDictationSessionDto {
  subject: string;
  grade?: string;
  semester?: string;
  textbookId?: string;
  unitId?: string;
  mode: DictationMode;
  speechRate?: DictationSpeechRate;
  count?: number | 'all';
}

export interface SubmitDictationWordDto {
  sessionId: string;
  wordId: string;
  wordOrder: number;
  userAnswer: string;
}

export interface SubmitDictationSessionDto {
  sessionId: string;
  answers: { wordOrder: number; userAnswer: string }[];
  durationSeconds: number;
}

export interface DictationResult {
  sessionId: string;
  totalCount: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  score: number;
  durationSeconds: number;
  wrongWords: DictationSessionWord[];
}

export interface ChinesePoetry {
  id: string;
  textbookId?: string;
  unitId?: string;
  title: string;
  author?: string;
  dynasty?: string;
  content: string[];
  translation?: string;
  annotation?: string;
  appreciation?: string;
  poemOrder: number;
  grade?: string;
}

export interface ChinesePracticeRecordDto {
  practiceType: string;
  lessonId?: string;
  correctCount: number;
  totalCount: number;
  duration: number;
}

export interface ChinesePracticeRecord {
  id: string;
  userId: string;
  practiceType: string;
  lessonId?: string;
  correctCount: number;
  totalCount: number;
  duration: number;
  createdAt: string;
}

// ===== 生字听写 =====

export interface ChineseCharacter {
  id: string;
  hanzi: string;
  pinyin: string;
  strokes: number;
  radical?: string;
  structure?: string;
  words: string[];
  meaning?: string;
  examples?: string;
  difficulty: string;
  grade?: string;
  unitId?: string;
}

export interface ChineseDictationSession {
  id: string;
  userId: string;
  subject: string;
  grade: string;
  semester: string;
  textbookId?: string;
  unitId?: string;
  mode: 'pinyin_to_char' | 'char_to_pinyin' | 'audio_to_char' | 'audio_to_pinyin';
  speed: 'slow' | 'normal' | 'fast';
  totalCount: number;
  correctCount?: number;
  score?: number;
  durationSeconds?: number;
  status: 'in_progress' | 'completed';
  startedAt?: string;
  submittedAt?: string;
  createdAt: string;
  words?: ChineseDictationSessionWord[];
}

export interface ChineseDictationSessionWord {
  id: string;
  sessionId: string;
  charId: string;
  character: string;
  pinyin?: string;
  wordOrder: number;
  userAnswer?: string;
  isCorrect?: boolean;
  answeredAt?: string;
  radical?: string;
  strokes?: number;
  meaning?: string;
  examples?: string;
}

export interface ChineseDictationWrongWord {
  id: string;
  userId: string;
  charId: string;
  character: string;
  pinyin?: string;
  subject: string;
  wrongCount: number;
  lastWrongAt: string;
  mastered: boolean;
  radical?: string;
  strokes?: number;
  meaning?: string;
  examples?: string;
}

export interface ChineseWrongCharacter {
  id: string;
  characterId: string;
  hanzi: string;
  pinyin?: string;
  wrongCount: number;
  masterStatus: string;
  lastWrongAt: string;
}

export interface ChineseDictationStats {
  totalSessions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  masteredCount: number;
  wrongCount: number;
}

export interface SubmitDictationAnswerDto {
  characterId: string;
  userAnswer: string;
  duration?: number;
}

export interface SubmitDictationAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  character: ChineseCharacter;
}

export interface CreateDictationSessionReqDto {
  grade: string;
  semester: string;
  textbookId?: string;
  unitId?: string;
  mode?: 'pinyin_to_char' | 'char_to_pinyin' | 'audio_to_char' | 'audio_to_pinyin';
  speed?: 'slow' | 'normal' | 'fast';
  count?: number;
  difficulty?: string;
}

export interface FinishDictationSessionDto {
  duration: number;
}

export type CreateChineseDictationSessionDto = CreateDictationSessionReqDto;

export interface SubmitChineseDictationWordDto {
  wordOrder: number;
  userAnswer: string;
}

export interface SubmitChineseDictationSessionDto {
  answers: { wordOrder: number; userAnswer: string }[];
  durationSeconds: number;
}

export interface ChineseDictationResult {
  session: ChineseDictationSession;
  words: ChineseDictationSessionWord[];
  correctCount: number;
  totalCount: number;
  score: number;
  wrongCount: number;
  durationSeconds: number;
}

// ===== 分页 & 列表响应 =====

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QuestionOption {
  label: string;
  content: string;
}

export interface Question {
  id: string;
  subject: string;
  grade: string;
  semester: string;
  textbookId?: string;
  unitId?: string;
  knowledgePoint?: string;
  questionType: string;
  difficulty: string;
  stem: string;
  options: QuestionOption[];
  answer: string;
  analysis?: string;
  source: string;
  createdAt: string;
}

export interface GenerateQuestionsDto {
  subject: string;
  grade: string;
  semester: string;
  unitId?: string;
  knowledgePoint?: string;
  questionType?: string;
  difficulty?: string;
  count?: number;
}

export interface CreateQuestionDto {
  subject: string;
  grade: string;
  semester: string;
  textbookId?: string;
  unitId?: string;
  knowledgePoint?: string;
  questionType: string;
  difficulty: string;
  stem: string;
  options?: QuestionOption[];
  answer: string;
  analysis?: string;
  source?: string;
}

export interface UpdateQuestionDto {
  subject?: string;
  grade?: string;
  semester?: string;
  textbookId?: string;
  unitId?: string;
  knowledgePoint?: string;
  questionType?: string;
  difficulty?: string;
  stem?: string;
  options?: QuestionOption[];
  answer?: string;
  analysis?: string;
  source?: string;
}

// ===== AI 出题会话 =====

export interface AIQuiz {
  id: string;
  userId: string;
  subject: string;
  grade: string;
  semester: string;
  textbookId?: string;
  unitId?: string;
  questionType: string;
  difficulty: string;
  totalCount: number;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  correctCount?: number;
  startedAt?: string;
  submittedAt?: string;
  createdAt: string;
  questions?: AIQuizQuestion[];
}

export interface AIQuizQuestion {
  id: string;
  quizId: string;
  questionId: string;
  questionOrder: number;
  userAnswer?: string;
  isCorrect?: boolean;
  answeredAt?: string;
  question?: Question;
}

export interface AIWrongQuestion {
  id: string;
  userId: string;
  questionId: string;
  subject: string;
  wrongCount: number;
  lastWrongAt: string;
  mastered: boolean;
  question?: Question;
}

export interface CreateAIQuizDto {
  subject: string;
  grade: string;
  semester: string;
  textbookId?: string;
  unitId?: string;
  knowledgePoint?: string;
  questionType?: string;
  difficulty?: string;
  count?: number;
}

export interface SubmitAIQuizAnswerDto {
  questionOrder: number;
  userAnswer: string;
}

export interface SubmitAIQuizDto {
  answers: { questionOrder: number; userAnswer: string }[];
}

export interface AIQuizResult {
  quiz: AIQuiz;
  questions: AIQuizQuestion[];
  correctCount: number;
  totalCount: number;
  score: number;
  wrongCount: number;
}

export interface CursorResponse<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

// ===== API 请求 DTO =====

export interface CreateAICourseDto {
  topic: string;
  learningGoal?: string;
  level?: string;
  title?: string;
}

export interface GenerateAICourseDto {
  topic: string;
  targetAudience: string;
  difficulty: string;
  wordCount: number;
  sentenceCount: number;
}

export interface GenerateAICourseResult {
  words: AIGenerateWordItem[];
  sentences: AIGenerateSentenceItem[];
}

export interface SaveAICourseDto {
  title: string;
  description?: string;
  coverImage?: string;
  words: AIWordItem[];
  sentences: AISentenceItem[];
  isPublished: boolean;
  topic?: string;
  targetAudience?: string;
  difficulty?: string;
}

export interface UpdateAICourseDto {
  title?: string;
  description?: string;
  coverImage?: string;
  words?: AIWordItem[];
  sentences?: AISentenceItem[];
  status?: string;
  topic?: string;
}

export type PracticeMode = 'watch-speak' | 'dictation' | 'typing' | 'shadowing';

export type MasteryStatus = 'new' | 'familiar' | 'mastered' | 'review';

export interface SubmitSentenceResultDto {
  puzzleId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  practiceMode?: PracticeMode;
  lessonId?: string;
  courseId?: string;
  textbookId?: string;
  unitId?: string;
  accuracyScore?: number;
  fluencyScore?: number;
}

export interface UpdateSentenceMasteryDto {
  puzzleId: string;
  status: MasteryStatus;
}

export interface SubmitFeedbackDto {
  puzzleId: string;
  errorType: 'content' | 'translation' | 'phonetic' | 'pronunciation' | 'partOfSpeech' | 'grammar';
  description: string;
  screenshotUrl?: string;
  sentenceText: string;
  translationText: string;
}

export interface SubmitDictationResultDto {
  dictationId: string;
  userAnswer: string;
  isCorrect: boolean;
  lessonId?: string;
  courseId?: string;
}

export interface UpdateWordRecordDto {
  wordId: string;
  isCorrect: boolean;
}

export interface CheckInDto {
  studyMinutes?: number;
  wordsLearned?: number;
  sentencesCompleted?: number;
  chineseLessonsLearned?: number;
  mathTopicsLearned?: number;
}

export interface UpdateJournalDto {
  journalDate: string;
  content?: string;
  mood?: string;
  masteryScore?: number;
  highlights?: string[];
}

export interface EnrollCourseDto {
  courseId: string;
}

export interface LearnerPracticeSettings {
  selectedVoice?: string;
  speechRate?: number;
  soundEffectsEnabled?: boolean;
  keyboardVisible?: boolean;
  fingerGuideEnabled?: boolean;
  showGrammarTags?: boolean;
  showIllustration?: boolean;
  defaultPracticeMode?: PracticeMode;
}

export interface UpdateLearnerDto {
  nickname?: string;
  avatarUrl?: string;
  preferences?: LearnerPreferences;
  practiceSettings?: LearnerPracticeSettings;
}

// ===== 课程分类 =====

export const COURSE_CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'preschool', label: '学前英语' },
  { value: 'beginner', label: '零基础' },
  { value: 'daily', label: '日常实用' },
  { value: 'comprehensive', label: '综合提升' },
  { value: 'business', label: '职场商务' },
  { value: 'travel', label: '旅行英语' },
  { value: 'exam', label: '考试冲刺' },
  { value: 'certification', label: '认证备考' },
  { value: 'culture', label: '文化兴趣' },
  { value: 'math_primary', label: '小学数学' },
  { value: 'chinese_primary', label: '小学语文' },
  { value: 'other', label: '其它' },
];

// ===== 管理后台 =====

export type AdminRole = 'super_admin' | 'editor' | 'reviewer' | 'teacher' | 'content_admin';

export type CourseSubject = 'chinese' | 'math' | 'english';

export type CourseStatus = 'draft' | 'review' | 'published' | 'offline';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  subject?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminUser;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalTextbooks: number;
  totalWords: number;
  totalSentences: number;
  todayStudyMinutes: number;
  todayActiveUsers: number;
  todayCheckIns: number;
}

export interface DailyStudyTrend {
  date: string;
  minutes: number;
  users: number;
}

export interface SubjectDistribution {
  subject: string;
  label: string;
  count: number;
}

export interface UserRegisterTrend {
  date: string;
  count: number;
}

export interface AdminRankItem {
  rank: number;
  name: string;
  minutes: number;
}

export interface RecentActivity {
  id: string;
  type: 'register' | 'study' | 'checkin';
  userName: string;
  detail: string;
  time: string;
}

// 管理端 课程

export interface AdminCourseItem {
  id: string;
  title: string;
  category: string;
  subject: string;
  status: string;
  version: number;
  grade?: string;
  editorId?: string;
  coverImage?: string;
  totalLessons: number;
  sharedCount: number;
  favoriteCount: number;
  isPublished: boolean;
  updatedAt: string;
  createdAt: string;
}

// 管理端 单词

export interface AdminWordItem {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  textbookId?: string;
  unitId?: string;
  textbookTitle?: string;
  unitTitle?: string;
  wordOrder?: number;
  imageUrl?: string;
}

// 管理端 汉字
export interface AdminChineseCharItem {
  id: string;
  character: string;
  pinyin?: string;
  radical?: string;
  strokes?: number;
  meaning?: string;
  examples?: string;
  charOrder?: number;
  structure?: string;
  words?: string[];
  difficulty?: string;
  textbookId: string;
  unitId: string;
  textbookTitle?: string;
  unitTitle?: string;
  grade?: string;
  semester?: string;
}

// 管理端 数学知识点
export interface AdminMathTopicItem {
  id: string;
  textbookId: string;
  unitId: string;
  title: string;
  topicOrder: number;
  domain: string;
  description: string;
  keyPoints: string;
  examples: Array<{ question: string; solution: string; answer: string }>;
  practiceCount: number;
  textbookTitle?: string;
  unitTitle?: string;
}

// 管理端 数学习题
export interface AdminMathPracticeItem {
  id: string;
  topicId: string;
  textbookId: string;
  unitId: string;
  question: string;
  options: Array<{ label: string; text: string }>;
  correctAnswer: string;
  solution?: string;
  difficulty: number;
  itemOrder: number;
  itemType: string;
  grade?: string;
  semester?: string;
  knowledgePoint?: string;
  topicTitle?: string;
  textbookTitle?: string;
  unitTitle?: string;
}

// 管理端 句子逐词解析

export interface WordParse {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  grammarRole: string;
}

// 管理端 句子

export interface AdminSentenceItem {
  id: string;
  sentence: string;
  translation: string;
  wordParses: WordParse[];
  sentenceAnalysis?: string;
  imageUrl?: string;
  lessonId?: string;
  courseId?: string;
  textbookId?: string;
  unitId?: string;
  textbookTitle?: string;
  unitTitle?: string;
  lessonTitle?: string;
  puzzleOrder?: number;
}

export interface AdminDictationItem {
  id: string;
  sentence: string;
  translation: string;
  hint?: string;
  difficulty: number;
  itemOrder: number;
  textbookId?: string;
  unitId?: string;
  textbookTitle?: string;
  unitTitle?: string;
}

// 管理端 用户

export interface AuditLogItem {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AdminUserManageItem {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  subject?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  nickname: string;
  phone?: string;
  role: string;
  registerTime: string;
  totalStudyMinutes: number;
  checkInDays: number;
  wrongCount: number;
  isActive: boolean;
}

export interface AdminUserDetail {
  user: AdminUserItem;
  courseProgress: Array<{ courseId: string; courseTitle: string; progress: number }>;
  wrongSentences: number;
  wrongWords: number;
  checkInRecords: Array<{ date: string; minutes: number }>;
  favorites: number;
}

export type CourseCategory = typeof COURSE_CATEGORIES[number]['value'];

// ===== AI 对话陪练 =====

export interface AiChatSession {
  id: string;
  title: string;
  topic: string;
  assistantName: string;
  assistantAccent: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  correction?: string;
  suggestion?: string;
  audioUrl?: string;
  createdAt: string;
}

export interface AiChatSessionWithMessages {
  session: AiChatSession;
  messages: AiChatMessage[];
}

export interface SendMessageResponse {
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
}

export interface CreateAiChatSessionDto {
  title: string;
  topic?: string;
  assistantName?: string;
  assistantAccent?: string;
}

export interface SendMessageDto {
  content: string;
}

// ===== 学习计划 =====

export interface LearningPlan {
  id: string;
  planType: 'sentence' | 'word';
  itemType: string;
  itemId: string;
  itemTitle: string;
  itemMeta?: Record<string, unknown>;
  totalCount: number;
  completedCount: number;
  addedAt: string;
}

export interface CreateLearningPlanDto {
  planType: 'sentence' | 'word';
  itemType: string;
  itemId: string;
  itemTitle: string;
  itemMeta?: Record<string, unknown>;
  totalCount?: number;
}

export interface UpdateLearningProgressDto {
  completedCount: number;
}

// ===== 错题本 / 掌握标注 =====

export type MasterStatus = 'unmarked' | 'mastered' | 'unfamiliar';

export interface WrongWordItem {
  id: string;
  wordId: string;
  masterStatus: MasterStatus;
  familiarity: number;
  lastReviewedAt?: string;
  word?: {
    word: string;
    phonetic?: string;
    meaning: string;
  };
}

export interface WrongSentenceItem {
  id: string;
  puzzleId: string;
  masterStatus: MasterStatus;
  isCorrect: boolean;
  attempts: number;
  sentence?: {
    sentence: string;
    translation: string;
  };
}

export interface UpdateMasterStatusDto {
  status: MasterStatus;
}

export interface BatchDeleteWordsDto {
  wordIds: string[];
}

export interface BatchDeleteSentencesDto {
  puzzleIds: string[];
}

// ===== 游戏乐园 =====

export type GameType = 'math_battle' | 'word_pk' | 'poetry_chain' | 'whack_mole' | 'word_match' | 'word_runner' | 'word_tetris' | 'word_shooting';

export interface GameRecord {
  id: string;
  userId: string;
  gameType: GameType;
  score: number;
  totalQuestions: number;
  correctCount: number;
  durationSec: number;
  difficulty: number;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface MathBattleQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface WordPKQuestion {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
}

export interface PoetryChainQuestion {
  id: string;
  firstLine: string;
  secondLine: string;
  hint: string;
}

export interface GenerateMathBattleDto {
  difficulty: number;
  count: number;
  timeLimit?: number;
  operations?: string;
}

export interface GenerateMathBattleResponse {
  questions: MathBattleQuestion[];
  gameId: string;
}

export interface GenerateWordPKDto {
  difficulty: number;
  count: number;
}

export interface GenerateWordPKResponse {
  questions: WordPKQuestion[];
  gameId: string;
}

export interface GeneratePoetryChainDto {
  difficulty: number;
  count: number;
}

export interface GeneratePoetryChainResponse {
  questions: PoetryChainQuestion[];
  gameId: string;
}

export interface SubmitGameScoreDto {
  gameType: GameType;
  score: number;
  totalQuestions: number;
  correctCount: number;
  durationSec: number;
  difficulty: number;
  details?: Record<string, unknown>;
}

export interface SubmitGameScoreResponse {
  recordId: string;
  rank: number;
  newBestScore: boolean;
}

export interface GameRankingItem {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export interface GameRecordsQuery {
  gameType?: GameType;
  page?: number;
  pageSize?: number;
}

export interface GameRankingQuery {
  gameType: GameType;
  limit?: number;
}

// ===== 英语游戏乐园（5款新游戏） =====

export interface WhackMoleWord {
  id: string;
  word: string;
  meaning: string;
  isTarget: boolean;
}

export interface GenerateWhackMoleDto {
  difficulty: number;
  count: number;
}

export interface GenerateWhackMoleResponse {
  words: WhackMoleWord[];
  targetMeaning: string;
  gameId: string;
}

export interface WordMatchPair {
  id: string;
  word: string;
  meaning: string;
}

export interface GenerateWordMatchDto {
  difficulty: number;
  pairCount: number;
}

export interface GenerateWordMatchResponse {
  pairs: WordMatchPair[];
  gameId: string;
}

export interface RunnerObstacle {
  id: string;
  word: string;
  correctMeaning: string;
  options: string[];
  correctIndex: number;
}

export interface GenerateWordRunnerDto {
  difficulty: number;
  count: number;
}

export interface GenerateWordRunnerResponse {
  obstacles: RunnerObstacle[];
  gameId: string;
}

export interface TetrisWord {
  id: string;
  word: string;
  meaning: string;
  letters: string[];
}

export interface GenerateWordTetrisDto {
  difficulty: number;
  count: number;
}

export interface GenerateWordTetrisResponse {
  words: TetrisWord[];
  gameId: string;
}

export interface ShootingBalloon {
  id: string;
  word: string;
  meaning: string;
}

export interface GenerateWordShootingDto {
  difficulty: number;
  count: number;
}

export interface GenerateWordShootingResponse {
  balloons: ShootingBalloon[];
  targetWord: string;
  gameId: string;
}

// ===== PK Arena =====

export type PKRoomType = '1v1' | 'multi';
export type PKRoomStatus = 'waiting' | 'matching' | 'playing' | 'finished';
export type PKPlayerStatus = 'waiting' | 'playing' | 'finished';
export type PKCourseType = 'words' | 'sentences' | 'mixed';
export type PKMatchResult = 'win' | 'lose' | 'draw';

export interface PKQuestionOption {
  label: string;
  text: string;
}

export interface PKQuestion {
  id: string;
  index: number;
  questionType: 'word' | 'sentence';
  prompt: string;        // 中文释义
  answer: string;        // 正确答案
  options?: PKQuestionOption[]; // 选择题选项（句子题有）
}

export interface PKPlayer {
  id: string;
  userId: string;
  nickname: string;
  score: number;
  answeredCount: number;
  correctCount: number;
  status: PKPlayerStatus;
  joinedAt: string;
}

export interface PKRoom {
  id: string;
  roomCode: string;
  roomType: PKRoomType;
  title: string;
  maxPlayers: number;
  courseType: PKCourseType;
  status: PKRoomStatus;
  creatorId: string;
  createdAt: string;
  players: PKPlayer[];
  playerCount: number;
}

export interface PKRoomDetail extends PKRoom {
  currentQuestionIndex: number;
  questions: PKQuestion[];
}

export interface PKRoomListResponse {
  items: PKRoom[];
  total: number;
}

export interface PKCreateRoomDto {
  title: string;
  roomType: PKRoomType;
  maxPlayers?: number;
  courseType: PKCourseType;
}

export interface PKAnswerDto {
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface PKAnswerResponse {
  score: number;
  answeredCount: number;
  correctCount: number;
  isFinished: boolean;
  isAllPlayersFinished?: boolean;
}

export interface PKResultItem {
  rank: number;
  userId: string;
  nickname: string;
  score: number;
  correctCount: number;
  answeredCount: number;
  result: PKMatchResult;
}

export interface PKResultResponse {
  roomId: string;
  roomType: PKRoomType;
  isFinished: boolean;
  rankings: PKResultItem[];
}

export interface PKStats {
  totalMatches: number;
  wins: number;
  winRate: number;
  currentTitle: string;
}

export interface PKMatchHistoryItem {
  id: string;
  roomId: string;
  result: PKMatchResult;
  score: number;
  opponentScore: number;
  roomType: PKRoomType;
  createdAt: string;
}

export interface PKMatchHistoryResponse {
  items: PKMatchHistoryItem[];
  total: number;
}

// ===== 家长端 / 教师端 =====

export interface ParentChildBinding {
  id: string;
  childId: string;
  childName: string;
  relation: string;
  status: string;
}

export interface AddChildDto {
  childId: string;
  childName: string;
  relation: string;
}

export interface ChildOverview {
  totalStudyMinutes: number;
  completedLessons: number;
  overallAccuracy: number;
  checkInStreak: number;
  subjectBreakdown: SubjectBreakdownItem[];
  recentWeekActivity: DailyActivityItem[];
  todayStudyMinutes: number;
}

export interface SubjectBreakdownItem {
  subject: string;
  studyMinutes: number;
  accuracy: number;
  completionRate: number;
}

export interface DailyActivityItem {
  date: string;
  minutes: number;
}

export interface ChildMistakeItem {
  id: string;
  subject: string;
  questionType: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  createdAt: string;
}

export interface ChildMistakesResponse {
  items: ChildMistakeItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    totalMistakes: number;
    weekNew: number;
    subjectStats: Array<{ subject: string; count: number; percentage: number }>;
  };
}

export interface LearningActivityItem {
  id: string;
  type: 'practice' | 'checkin' | 'game' | 'lesson' | 'exam';
  subject: string;
  title: string;
  result?: string;
  score?: number;
  createdAt: string;
}

export interface AssignedTask {
  id: string;
  taskType: 'lesson' | 'practice' | 'game' | 'reading';
  subject: string;
  title: string;
  description?: string;
  contentId?: string;
  quantity: number;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  completedAt?: string;
  result?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAssignedTaskDto {
  taskType: 'lesson' | 'practice' | 'game' | 'reading';
  subject: string;
  title: string;
  description?: string;
  contentId?: string;
  quantity?: number;
  deadline?: string;
}

export interface UpdateTaskStatusDto {
  status: string;
}

export interface ProgressCurveData {
  dailyMinutes: DailyActivityItem[];
  dailyAccuracy: Array<{ date: string; accuracy: number }>;
  period: string;
}

// ===== 学习者统计看板 =====

export interface LearnerStatsSummary {
  totalStudyMinutes: number;
  completedCourses: number;
  overallAccuracy: number;
  checkInStreak: number;
  totalCheckIns: number;
  level: number;
  expPoints: number;
  expToNextLevel: number;
  rank: string;
}

export type SubjectType = 'chinese' | 'math' | 'english';

export interface SubjectRadarSubject {
  subject: SubjectType;
  accuracy: number;
  completion: number;
  activity: number;
}

export interface SubjectRadarData {
  subjects: SubjectRadarSubject[];
}

export interface ProgressDailyData {
  date: string;
  studyMinutes: number;
  accuracy: number;
  completedCount: number;
}

export interface ProgressCurveResponse {
  dailyData: ProgressDailyData[];
}

export type MistakeCategory =
  | 'sentence'
  | 'word'
  | 'dictation'
  | 'chinese_char'
  | 'math_arithmetic'
  | 'poetry'
  | 'other';

export interface MistakeCategoryStat {
  category: MistakeCategory;
  count: number;
}

export interface RecentMistakeItem {
  id: string;
  category: MistakeCategory;
  question: string;
  correctAnswer: string;
  createdAt: string;
}

export interface MistakeStats {
  totalMistakes: number;
  byCategory: MistakeCategoryStat[];
  recentMistakes: RecentMistakeItem[];
}

export type AchievementCategory =
  | 'milestone'
  | 'check_in'
  | 'vocabulary'
  | 'courses'
  | 'math'
  | 'chinese';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: string;
}

// ===== 首页看板统计 =====

export interface TodayTopLearner {
  rank: number;
  userId: string;
  userName: string;
  minutes: number;
}

export interface LearnerCalendarDayData {
  date: string;
  checkedIn: boolean;
  minutes: number;
}

export interface LearnerDashboardStats {
  sentencesTotal: number;
  sentencesWrong: number;
  sentencesUnfamiliar: number;
  sentencesMastered: number;
  wordsTotal: number;
  wordsWrong: number;
  wordsUnfamiliar: number;
  wordsMastered: number;
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  monthStudyMinutes: number;
  currentStreak: number;
  maxStreak: number;
  totalCheckIns: number;
  todayTopLearners: TodayTopLearner[];
  calendarData: LearnerCalendarDayData[];
}

// ===== 防沉迷 =====

export interface UsageLogRecord {
  id: string;
  userId: string;
  logDate: string;
  startTime: string;
  endTime?: string;
  duration: number;
  module?: string;
}

export interface AntiAddictionStatus {
  ageGroup: 'child' | 'teen' | 'adult';
  todayTotalMinutes: number;
  todayRemainingMinutes: number;
  currentSessionMinutes: number;
  dailyLimitMinutes: number;
  sessionLimitMinutes: number;
  isNightMode: boolean;
  nightModeStart: string;
  nightModeEnd: string;
  isLocked: boolean;
  lockReason?: 'daily_limit' | 'session_limit' | 'night_mode';
  lockEndTime?: string;
  warnAtMinutes: number;
}

export interface ParentControls {
  id: string;
  userId: string;
  ageGroup: string;
  dailyLimitWeekday: number;
  dailyLimitWeekend: number;
  sessionLimit: number;
  nightModeStart: string;
  nightModeEnd: string;
  hasParentPassword: boolean;
  parentUserId?: string;
}

export interface UpsertParentControlsDto {
  ageGroup?: string;
  dailyLimitWeekday?: number;
  dailyLimitWeekend?: number;
  sessionLimit?: number;
  nightModeStart?: string;
  nightModeEnd?: string;
  oldPassword?: string;
  newPassword?: string;
  parentUserId?: string;
}

export interface UsageDailyItem {
  date: string;
  durationMinutes: number;
}

export interface UsageModuleItem {
  module: string;
  durationMinutes: number;
}

export interface UsageReport {
  id: string;
  reportType: 'weekly' | 'monthly';
  reportDate: string;
  totalDuration: number;
  dailyData: UsageDailyItem[];
  moduleData: UsageModuleItem[];
  createdAt: string;
}

export interface StartUsageSessionDto {
  module?: string;
}

export interface EndUsageSessionDto {
  sessionId: string;
}

// ===== 内容审核 =====

export interface SensitiveWord {
  id: string;
  word: string;
  category: string;
  level: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface ContentCheckResult {
  passed: boolean;
  level: 'none' | 'low' | 'medium' | 'high';
  matchedWords: Array<{ word: string; category: string; level: string }>;
  filteredText: string;
  message: string;
}

export interface AiQuestionReview {
  id: string;
  questionId?: string;
  questionType?: string;
  questionContent?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewerId?: string;
  reviewComment?: string;
  autoCheckResult?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserContentReview {
  id: string;
  contentType: string;
  contentId: string;
  contentText?: string;
  authorId?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewerId?: string;
  reviewComment?: string;
  autoCheckResult?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditStats {
  pendingCount: number;
  todayReviewed: number;
  approveRate: number;
  blockedCount: number;
}

export interface PhoneticExample {
  word: string;
  phonetic: string;
  meaning: string;
}

export interface PhoneticSentence {
  en: string;
  zh: string;
}

export interface PhoneticItem {
  id: string;
  symbol: string;
  name: string;
  type: string;
  category: string;
  pronunciationMethod: string;
  mouthShape: string;
  examples: PhoneticExample[];
  sentences: PhoneticSentence[];
  similarSounds: string[];
  sortOrder: number;
  createdAt: string;
  mouthDiagramSvg?: string;
  frontMouthDiagramSvg?: string;
  tonguePosition?: string;
  lipShape?: string;
  vocalCordVibration?: boolean;
  pronunciationType?: string;
}

export interface PhonicsProgressItem {
  id: string;
  phoneticId: string;
  learned: boolean;
  practiceCount: number;
  correctCount: number;
  lastPracticeTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhonicsProgressSummary {
  totalPhonetics: number;
  learnedCount: number;
  totalPractice: number;
  totalCorrect: number;
  accuracy: number;
}

export interface PhonicsPracticeResult {
  phoneticId: string;
  isCorrect: boolean;
}

export interface PhonicsPracticeQuestion {
  id: string;
  type: 'listen' | 'read';
  question: string;
  options: { id: string; label: string; phonetic?: string }[];
  correctId: string;
}

// ===== 成就勋章系统 =====

export interface UserLevel {
  level: number;
  levelName: string;
  minPoints: number;
  maxPoints: number;
  nextLevelPoints: number;
  currentLevelProgress: number;
}

export interface UserPoints {
  totalPoints: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  level: number;
  levelName: string;
  nextLevelPoints: number;
  currentLevelProgress: number;
  streakDays: number;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'diamond';
  category: string;
  conditionType: string;
  conditionValue: number;
  obtained: boolean;
  obtainedAt?: string;
  progress?: number;
}

export interface PointLogItem {
  id: string;
  points: number;
  reason: string;
  source: string;
  createdAt: string;
}

export interface AchievementOverview {
  points: UserPoints;
  badges: BadgeItem[];
  recentBadges: BadgeItem[];
  pointLogs: PointLogItem[];
  stats: {
    totalBadges: number;
    earnedBadges: number;
    totalPoints: number;
    rank: number;
  };
}

export interface EarnPointsResult {
  pointsEarned: number;
  totalPoints: number;
  leveledUp: boolean;
  newLevel?: number;
  newLevelName?: string;
  newBadges: BadgeItem[];
}

export interface EarnPointsDto {
  source: string;
  reason: string;
  points: number;
}

export interface DailyTasks {
  wordCount?: number;
  sentenceCount?: number;
  dictationCount?: number;
  phoneticCount?: number;
  aiQuizCount?: number;
  otherTasks?: string[];
}

export interface StudyPlanItem {
  id: string;
  planName: string;
  planType: 'daily' | 'weekly' | 'custom' | 'ai';
  startDate: string;
  endDate?: string | null;
  dailyTasks: DailyTasks;
  dailyMinutes: number;
  remindTime?: string | null;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface PlanRecordItem {
  id: string;
  planId: string;
  recordDate: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  studyMinutes: number;
  wordCompleted: number;
  sentenceCompleted: number;
  dictationCompleted: number;
  phoneticCompleted: number;
  aiQuizCompleted: number;
}

export interface PlanReminderItem {
  id: string;
  planId?: string | null;
  remindTime: string;
  enabled: boolean;
  reminderType: string;
}

export interface PlanOverview {
  currentPlan: StudyPlanItem | null;
  todayRecord: PlanRecordItem | null;
  streakDays: number;
  weeklyCompletionRate: number;
  todayTasks: {
    type: string;
    label: string;
    target: number;
    completed: number;
    icon: string;
  }[];
}

export interface PlanStatsResponse {
  dailyCompletion: { date: string; rate: number }[];
  weeklyCompletion: number;
  monthlyCompletion: number;
  totalStudyMinutes: number;
  taskDistribution: { type: string; count: number }[];
  streakDays: number;
}

export interface AiPlanRecommendation {
  planName: string;
  dailyMinutes: number;
  dailyTasks: DailyTasks;
  recommendations: string[];
  weakPoints: string[];
  expectedGoal: string;
}

export interface CreatePlanDto {
  planName: string;
  planType: 'daily' | 'weekly' | 'custom' | 'ai';
  startDate: string;
  endDate?: string;
  dailyTasks: DailyTasks;
  dailyMinutes: number;
  remindTime?: string;
}

export interface UpdateTaskProgressDto {
  taskType: string;
  count: number;
  studyMinutes?: number;
}

// ===== 学习报告 =====

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface SubjectStats {
  english: number;
  chinese: number;
  math: number;
}

export interface SubjectAccuracy {
  english: number;
  chinese: number;
  math: number;
}

export interface ModuleStats {
  words: number;
  sentences: number;
  dictation: number;
  phonetic: number;
  aiQuiz: number;
}

export interface AccuracyStats {
  overall: number;
  words: number;
  sentences: number;
  dictation: number;
  phonetic: number;
}

export interface ModeStatItem {
  count: number;
  accuracy: number;
  avgSpeed?: number;
  avgScore?: number;
}

export interface ModeStatsV2 {
  typing: ModeStatItem;
  dictation: ModeStatItem;
  shadowing: ModeStatItem;
  watchSpeak: ModeStatItem;
  aiQuiz: ModeStatItem;
  phonetic: ModeStatItem;
}

export interface ProgressItem {
  learned: number;
  total: number;
}

export interface TextbookProgress {
  grade: string;
  unit: string;
  progress: number;
}

export interface ProgressStats {
  words: ProgressItem;
  sentences: ProgressItem;
  phonetics: ProgressItem;
  textbooks: TextbookProgress[];
}

export interface WeeklyTrendPoint {
  week: string;
  duration: number;
  accuracy: number;
}

export interface ImprovementStats {
  durationChange: number;
  accuracyChange: number;
  taskChange: number;
  streakDays: number;
  longestStreak: number;
  weeklyTrend: WeeklyTrendPoint[];
}

export interface BadgeItem {
  name: string;
  icon: string;
  description: string;
}

export interface AchievementStats {
  badges: BadgeItem[];
  levelUp: boolean;
  currentLevel: number;
  prevLevel: number;
  pointsEarned: number;
  rankChange: number;
}

export interface WeakPoint {
  type: string;
  name: string;
  accuracy: number;
  suggestion: string;
}

export interface HabitsAnalysis {
  timeDistribution: {
    morning: number;
    noon: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  avgSessionDuration: number;
  mostActiveDay: string;
  continuity: number;
}

export interface DailyDataPoint {
  date: string;
  duration: number;
  accuracy: number;
}

export interface StudyReportItem {
  id: string;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  title: string;
  totalDuration: number;
  studyDays: number;
  avgDailyDuration: number;
  streakDays: number;
  completedTasks: number;
  totalAccuracy: number;
  subjectStats: SubjectStats;
  subjectAccuracy: SubjectAccuracy;
  moduleStats: ModuleStats;
  accuracyStats: AccuracyStats;
  modeStatsV2: ModeStatsV2;
  progressStats: ProgressStats;
  improvement: ImprovementStats;
  achievements: AchievementStats;
  weakPoints: WeakPoint[];
  habitsAnalysis: HabitsAnalysis;
  aiSuggestions: string[];
  dailyData: DailyDataPoint[];
  createdAt: string;
}

export interface GenerateReportDto {
  reportType: ReportType;
  startDate: string;
  endDate: string;
}

export interface ReportListResponse {
  items: StudyReportItem[];
  total: number;
}

export type WordbookSubject = 'english' | 'chinese' | 'math';
export type WordbookContentType =
  | 'word'
  | 'sentence'
  | 'character'
  | 'phrase'
  | 'formula'
  | 'question';
export type WordbookSource = 'custom' | 'textbook';
export type WordbookStudyMode =
  | 'typing'
  | 'dictation'
  | 'following'
  | 'speaking'
  | 'pinyin'
  | 'character-write'
  | 'pinyin-read'
  | 'text-read'
  | 'mental-math'
  | 'formula-memory'
  | 'knowledge-review'
  | 'choice';

export interface WordbookSourceInfo {
  textbookName?: string;
  grade?: string;
  unit?: string;
  lesson?: string;
}

export interface WordbookItemExtra {
  phonetic?: string;
  translation?: string;
  grammar?: string;
  pinyin?: string;
  strokes?: number;
  radical?: string;
  synonyms?: string[];
  antonyms?: string[];
  formula?: string;
  knowledgePoint?: string;
  solutionSteps?: string[];
  options?: string[];
}

export interface UserWordbook {
  id: string;
  name: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  description?: string;
  itemCount: number;
  studiedCount: number;
  correctRate: number;
  lastStudyTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWordbookItem {
  id: string;
  wordbookId: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  source: WordbookSource;
  sourceId?: string;
  sourceInfo?: WordbookSourceInfo;
  title?: string;
  subtitle?: string;
  content: string;
  example?: string;
  answer?: string;
  extra?: WordbookItemExtra;
  studyCount: number;
  correctCount: number;
  correctRate: number;
  lastStudyTime?: string;
  isStarred: boolean;
  createdAt: string;
}

export interface CreateWordbookDto {
  name: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  description?: string;
}

export interface UpdateWordbookDto {
  name?: string;
  description?: string;
}

export interface AddWordbookItemDto {
  subject: WordbookSubject;
  contentType: WordbookContentType;
  source?: WordbookSource;
  sourceId?: string;
  sourceInfo?: WordbookSourceInfo;
  title?: string;
  subtitle?: string;
  content: string;
  example?: string;
  answer?: string;
  extra?: WordbookItemExtra;
}

export interface AddItemsFromTextbookDto {
  source: 'textbook';
  sourceType: 'word' | 'sentence' | 'dictation';
  sourceIds: string[];
  sourceInfo?: WordbookSourceInfo;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface WordbookListResponse {
  items: UserWordbook[];
  total: number;
}

export interface WordbookItemListResponse {
  items: UserWordbookItem[];
  total: number;
}

export interface TextExtractResult {
  items: AddWordbookItemDto[];
  count: number;
}

export interface StudyRecordDto {
  itemId: string;
  correct: boolean;
  durationSeconds?: number;
}

export interface StudySessionResult {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  durationSeconds: number;
}

export type WordbookVisibility = 'private' | 'partial' | 'public';
export type WordbookStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'removed';
export type ContentRating = 'normal' | 'quality' | 'featured' | 'hot';
export type ContentReportType =
  | 'wrong_content'
  | 'inappropriate'
  | 'advertising'
  | 'copyright'
  | 'abuse'
  | 'privacy'
  | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';
export type AuditAction = 'approve' | 'reject' | 'modify' | 'remove';
export type CreditLevel = 'AAA' | 'AA' | 'A' | 'B' | 'C';

export interface WordbookShareSettings {
  visibility: WordbookVisibility;
  allowLearn: boolean;
  allowCopy: boolean;
  allowComment: boolean;
}

export interface ContentMarketItem {
  id: string;
  name: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  description?: string;
  itemCount: number;
  learnCount: number;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  rating: number;
  contentRating: ContentRating;
  creatorId: string;
  creatorName: string;
  creatorLevel: number;
  creditLevel: CreditLevel;
  approvedAt?: string;
  createdAt: string;
}

export interface ContentDetail {
  id: string;
  name: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  description?: string;
  itemCount: number;
  learnCount: number;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  rating: number;
  contentRating: ContentRating;
  visibility: WordbookVisibility;
  allowLearn: boolean;
  allowCopy: boolean;
  allowComment: boolean;
  creatorId: string;
  creatorName: string;
  creatorLevel: number;
  creditLevel: CreditLevel;
  items: UserWordbookItem[];
  isLiked: boolean;
  isFavorited: boolean;
  approvedAt?: string;
  createdAt: string;
}

export interface ContentComment {
  id: string;
  wordbookId: string;
  userId: string;
  userName: string;
  parentId?: string;
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: ContentComment[];
}

export interface ContentMarketListResponse {
  items: ContentMarketItem[];
  total: number;
}

export interface ContentCommentListResponse {
  items: ContentComment[];
  total: number;
}

export interface SubmitShareDto {
  visibility: WordbookVisibility;
  allowLearn: boolean;
  allowCopy: boolean;
  allowComment: boolean;
}

export interface ReportContentDto {
  contentType: 'wordbook' | 'comment';
  contentId: string;
  reportType: ContentReportType;
  reportReason?: string;
}

export interface CreatorStatsData {
  userId: string;
  userName: string;
  totalLearnCount: number;
  totalLikeCount: number;
  totalFavoriteCount: number;
  totalCommentCount: number;
  contentCount: number;
  approvedCount: number;
  creatorLevel: number;
  creatorPoints: number;
  creditLevel: CreditLevel;
  createdAt: string;
  updatedAt: string;
  badges: CreatorBadge[];
}

export interface CreatorBadge {
  id: string;
  userId: string;
  badgeCode: string;
  badgeName: string;
  createdAt: string;
}

export interface CreatorRankItem {
  userId: string;
  userName: string;
  creatorLevel: number;
  creatorPoints: number;
  rank: number;
}

export interface CreatorRankResponse {
  items: CreatorRankItem[];
  period: 'all' | 'week' | 'month';
}

export interface AuditWordbookItem {
  id: string;
  name: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  description?: string;
  itemCount: number;
  status: WordbookStatus;
  auditNote?: string;
  creatorId: string;
  creatorName: string;
  submittedAt?: string;
  createdAt: string;
}

export interface AuditListResponse {
  items: AuditWordbookItem[];
  total: number;
  pendingCount: number;
  todayAuditedCount: number;
  passRate: number;
}

export interface AuditActionDto {
  action: AuditAction;
  note?: string;
}

export type TypingLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

export type TypingPracticeMode = 'sentence' | 'word';

export interface TypingCourse {
  id: string;
  level: TypingLevel;
  name: string;
  description?: string;
  content: string;
  difficulty: number;
  orderIndex: number;
  unlockCondition?: string;
  createdAt: string;
  completed?: boolean;
  bestWpm?: number;
  bestAccuracy?: number;
  /** 练习模式：句子或单词专项 */
  practiceMode?: TypingPracticeMode;
  /** 单词专项的单词列表（空格分隔，取用时按空格切分） */
  wordList?: string;
  /** 分类：finger / pinyin / english / chinese */
  category: string;
}

export interface TypingRecord {
  id: string;
  userId: string;
  courseId: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  duration: number;
  errors: number;
  totalChars: number;
  correctChars: number;
  weakKeys?: string;
  practiceMode?: TypingPracticeMode;
  createdAt: string;
}

export interface TypingStats {
  id: string;
  userId: string;
  totalPracticeTime: number;
  averageWpm: number;
  averageCpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestCpm: number;
  bestAccuracy: number;
  totalPracticeCount: number;
  weakKeys?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TypingCourseListResponse {
  items: TypingCourse[];
  levels: { level: TypingLevel; label: string; count: number }[];
}

export interface TypingSubmitDto {
  courseId: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  duration: number;
  errors: number;
  totalChars: number;
  correctChars: number;
  weakKeys?: string;
  practiceMode?: TypingPracticeMode;
}

// ===== 打地鼠游戏 =====

export interface WhackAMoleLevel {
  id: number;
  name: string;
  description: string;
  keyPool: string[];
  duration: number; // 秒
  targetScore: number;
  spawnInterval: number; // 地鼠出现间隔 ms
  moleStayTime: number; // 地鼠停留时间 ms
  maxMoles: number; // 同时最多地鼠数
  starThresholds: { one: number; two: number; three: number };
  blindMode?: boolean;
}

export interface WhackAMoleRecord {
  id: string;
  userId: string;
  levelId: number;
  score: number;
  correctHits: number;
  misses: number;
  accuracy: number;
  maxCombo: number;
  stars: number;
  duration: number;
  createdAt: string;
}

export interface WhackAMoleSubmitDto {
  levelId: number;
  score: number;
  correctHits: number;
  misses: number;
  accuracy: number;
  maxCombo: number;
  stars: number;
  duration: number;
}

export interface WhackAMoleStats {
  userId: string;
  totalGames: number;
  highestScore: number;
  highestLevel: number;
  totalStars: number;
  levelRecords: {
    levelId: number;
    bestScore: number;
    stars: number;
    completed: boolean;
  }[];
}

export interface UserApiConfig {
  ttsProvider: string;
  ttsApiKey?: string;
  ttsApiSecret?: string;
  ttsEndpoint?: string;
  asrProvider: string;
  asrApiKey?: string;
  asrApiSecret?: string;
  asrEndpoint?: string;
  aiProvider: string;
  aiApiKey?: string;
  aiBaseUrl?: string;
  aiModel?: string;
  imageProvider: string;
  imageApiKey?: string;
  imageBaseUrl?: string;
}

export type ApiConfigCategory = 'tts' | 'asr' | 'ai' | 'image';

export interface ApiProviderOption {
  value: string;
  label: string;
  type: 'free' | 'paid';
  needsKey: boolean;
  needsSecret?: boolean;
  needsEndpoint?: boolean;
  needsModel?: boolean;
  description: string;
}

// ===== 复习模块 =====
export interface ReviewItem {
  id: string;
  subject: string;
  itemType: string;
  content: string;
  answer?: string;
  sourceId?: string;
  courseId?: string;
  lessonId?: string;
  markTime: string;
  reviewCount: number;
  ebbinghausLevel: number;
  nextReviewTime: string;
  status: 'pending' | 'mastered';
  lastReviewTime?: string;
}

export interface ReviewListResponse {
  items: ReviewItem[];
  total: number;
}

export interface MarkUnfamiliarDto {
  subject: string;
  itemType: string;
  content: string;
  answer?: string;
  sourceId?: string;
  courseId?: string;
  lessonId?: string;
}

export interface ReviewStats {
  total: number;
  mastered: number;
  pending: number;
  todayDue: number;
}

export interface ReviewBatchDeleteDto {
  ids: string[];
}

export interface ReviewRecordDto {
  isCorrect: boolean;
}

// ===== UGC 内容审核 =====

export type UgcContentType = 'wordbook' | 'textbook' | 'course';
export type UgcAuditStatus = 'pending' | 'approved' | 'rejected';

export interface UgcAuditItem {
  id: string;
  type: UgcContentType;
  name: string;
  authorId: string;
  authorName: string;
  subject: string;
  submitTime: string;
  status: UgcAuditStatus;
  itemCount?: number;
  description?: string;
  rejectReason?: string;
}

export interface UgcAuditDetail {
  id: string;
  type: UgcContentType;
  name: string;
  authorId: string;
  authorName: string;
  subject: string;
  description?: string;
  itemCount: number;
  submitTime: string;
  status: UgcAuditStatus;
  coverImage?: string;
  items: Array<Record<string, unknown>>;
  rejectReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface UgcAuditListResponse {
  items: UgcAuditItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UgcRejectDto {
  reason: string;
}

// ===== 内容市场 - 教材 / 课程 =====

export interface MarketTextbookItem {
  id: string;
  name: string;
  subject: WordbookSubject;
  description?: string;
  coverImage?: string;
  grade: string;
  semester: string;
  totalUnits: number;
  learnCount: number;
  favoriteCount: number;
  rating: number;
  creatorId: string;
  creatorName: string;
  creatorLevel: number;
  createdAt: string;
}

export interface MarketCourseItem {
  id: string;
  name: string;
  subject: WordbookSubject;
  description?: string;
  coverImage?: string;
  category: string;
  totalLessons: number;
  totalMinutes: number;
  learnCount: number;
  favoriteCount: number;
  rating: number;
  creatorId: string;
  creatorName: string;
  creatorLevel: number;
  price: string;
  isFree: boolean;
  createdAt: string;
}

export type MarketCategory = 'all' | 'wordbook' | 'textbook' | 'course';

// ===== UGC 待审核列表（管理端） =====

export type UgcType = 'wordbook' | 'textbook' | 'course';

export interface UgcPendingItem {
  id: string;
  type: UgcType;
  name: string;
  authorId: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface UgcPendingListResponse {
  items: UgcPendingItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UgcDetailResponse {
  type: UgcType;
  id: string;
  name: string;
  subject: string;
  description?: string;
  status: string;
  visibility: string;
  auditNote?: string;
  authorId: string;
  itemCount?: number;
  unitCount?: number;
  grade?: string;
  version?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export type IllustrationContentType = 'word' | 'sentence';
export type IllustrationStatus = 'pending_review' | 'approved' | 'rejected';
export type IllustrationTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AiIllustration {
  id: string;
  contentType: IllustrationContentType;
  contentId: string;
  contentText: string;
  translation?: string;
  imageUrl: string;
  filePath?: string;
  prompt: string;
  stylePreset: string;
  status: IllustrationStatus;
  taskId?: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiIllustrationTask {
  id: string;
  taskType: string;
  scopeType: string;
  scopeParams: {
    textbookId?: string;
    unitId?: string;
    itemIds?: string[];
    contentType: IllustrationContentType;
  };
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: IllustrationTaskStatus;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface IllustrationListResponse {
  items: AiIllustration[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IllustrationTaskListResponse {
  items: AiIllustrationTask[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IllustrationStats {
  total: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

export interface BatchGenerateRequest {
  contentType: IllustrationContentType;
  scopeType: 'textbook' | 'unit' | 'items';
  textbookId?: string;
  unitId?: string;
  itemIds?: string[];
  stylePreset?: string;
  customPrompt?: string;
  skipExisting?: boolean;
}

export interface BatchGeneratePreview {
  items: Array<{
    id: string;
    text: string;
    translation?: string;
    hasIllustration: boolean;
  }>;
  totalCount: number;
  willGenerateCount: number;
}

export interface IllustrationReviewRequest {
  ids: string[];
  action: 'approve' | 'reject';
  note?: string;
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
}

export interface AppSettingSaveRequest {
  key: string;
  value: string;
  description?: string;
}


