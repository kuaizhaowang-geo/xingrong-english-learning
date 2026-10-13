import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, and, gte, inArray, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { gameRecords } from '@server/database/schema';
import { wordItems } from '@server/database/schema';
import { chineseLessons } from '@server/database/schema';
import type {
  GameType,
  MathBattleQuestion,
  WordPKQuestion,
  PoetryChainQuestion,
  WhackMoleWord,
  WordMatchPair,
  RunnerObstacle,
  TetrisWord,
  ShootingBalloon,
  SubmitGameScoreDto,
  SubmitGameScoreResponse,
  GameRankingItem,
  GameRecord,
} from '@shared/api.interface';

type MathOp = '+' | '-' | '×' | '÷';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ========== 口算比拼 ==========

  generateMathBattle(
    difficulty: number,
    count: number,
    operations?: string,
  ): { questions: MathBattleQuestion[]; gameId: string } {
    const safeDifficulty = Math.min(5, Math.max(1, difficulty));
    const safeCount = Math.min(50, Math.max(10, count));

    const opList: MathOp[] = operations
      ? operations.split(',').map((o) => o.trim()).filter(Boolean).map((o) => {
          const map: Record<string, MathOp> = {
            add: '+', subtract: '-', multiply: '×', divide: '÷',
          };
          return map[o] ?? '+';
        })
      : ['+', '-', '×', '÷'];

    const questions: MathBattleQuestion[] = [];
    for (let i = 0; i < safeCount; i += 1) {
      const op = opList[Math.floor(Math.random() * opList.length)];
      const { question, answer } = this.generateOneMathProblem(op, safeDifficulty);
      questions.push({
        id: uuidv4(),
        question,
        answer,
      });
    }

    return { questions, gameId: uuidv4() };
  }

  private generateOneMathProblem(op: MathOp, difficulty: number): { question: string; answer: string } {
    let a = 0;
    let b = 0;
    let ans = 0;

    const maxNum = 10 * difficulty * difficulty;
    const minNum = Math.max(1, Math.floor(difficulty * 2));

    switch (op) {
      case '+': {
        a = this.randInt(minNum, maxNum);
        b = this.randInt(minNum, maxNum);
        ans = a + b;
        break;
      }
      case '-': {
        a = this.randInt(minNum, maxNum);
        b = this.randInt(minNum, a);
        ans = a - b;
        break;
      }
      case '×': {
        const mulMax = Math.min(9 + difficulty * 3, 99);
        a = this.randInt(2, mulMax);
        b = this.randInt(2, Math.min(9 + difficulty * 2, 20));
        ans = a * b;
        break;
      }
      case '÷': {
        const divMax = Math.min(9 + difficulty * 3, 99);
        b = this.randInt(2, Math.min(9 + difficulty * 2, 20));
        const quotient = this.randInt(2, divMax);
        a = b * quotient;
        ans = quotient;
        break;
      }
      default:
        a = 1; b = 1; ans = 2;
    }

    return { question: `${a} ${op} ${b} = ?`, answer: String(ans) };
  }

  private randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ========== 单词PK ==========

  async generateWordPK(
    difficulty: number,
    count: number,
  ): Promise<{ questions: WordPKQuestion[]; gameId: string }> {
    const safeCount = Math.min(30, Math.max(10, count));

    const levelMap: Record<number, string[]> = {
      1: ['beginner', 'preschool'],
      2: ['beginner', 'elementary'],
      3: ['intermediate'],
      4: ['intermediate', 'advanced'],
      5: ['advanced', 'business'],
    };
    const levels = levelMap[difficulty] || levelMap[3];

    let words: Array<{ id: string; word: string; meaning: string; phonetic: string | null }> = [];
    try {
      words = await this.db
        .select({
          id: wordItems.id,
          word: wordItems.word,
          meaning: wordItems.meaning,
          phonetic: wordItems.phonetic,
        })
        .from(wordItems)
        .where(inArray(wordItems.level, levels))
        .orderBy(sql`random()`)
        .limit(safeCount);
    } catch (err) {
      this.logger.warn(`word_items query failed: ${(err as Error).message}`);
    }

    // 保底词库（不足时补充）
    if (words.length < safeCount) {
      const fallback = this.getFallbackWords(safeCount - words.length, difficulty);
      words = [...words, ...fallback];
    }

    const questions: WordPKQuestion[] = words.slice(0, safeCount).map((w) => ({
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic ?? undefined,
    }));

    return { questions, gameId: uuidv4() };
  }

  private getFallbackWords(
    count: number,
    difficulty: number,
  ): Array<{ id: string; word: string; meaning: string; phonetic: string | null }> {
    const easyWords = [
      { word: 'apple', meaning: '苹果', phonetic: '/ˈæp.əl/' },
      { word: 'book', meaning: '书', phonetic: '/bʊk/' },
      { word: 'cat', meaning: '猫', phonetic: '/kæt/' },
      { word: 'dog', meaning: '狗', phonetic: '/dɒɡ/' },
      { word: 'egg', meaning: '鸡蛋', phonetic: '/eɡ/' },
      { word: 'fish', meaning: '鱼', phonetic: '/fɪʃ/' },
      { word: 'girl', meaning: '女孩', phonetic: '/ɡɜːl/' },
      { word: 'happy', meaning: '开心的', phonetic: '/ˈhæp.i/' },
      { word: 'ice', meaning: '冰', phonetic: '/aɪs/' },
      { word: 'jump', meaning: '跳', phonetic: '/dʒʌmp/' },
      { word: 'king', meaning: '国王', phonetic: '/kɪŋ/' },
      { word: 'love', meaning: '爱', phonetic: '/lʌv/' },
      { word: 'moon', meaning: '月亮', phonetic: '/muːn/' },
      { word: 'name', meaning: '名字', phonetic: '/neɪm/' },
      { word: 'open', meaning: '打开', phonetic: '/ˈəʊ.pən/' },
    ];
    const midWords = [
      { word: 'adventure', meaning: '冒险', phonetic: '/ədˈven.tʃər/' },
      { word: 'beautiful', meaning: '美丽的', phonetic: '/ˈbjuː.tɪ.fəl/' },
      { word: 'celebrate', meaning: '庆祝', phonetic: '/ˈsel.ə.breɪt/' },
      { word: 'dangerous', meaning: '危险的', phonetic: '/ˈdeɪn.dʒər.əs/' },
      { word: 'education', meaning: '教育', phonetic: '/ˌedʒ.uˈkeɪ.ʃən/' },
      { word: 'fantastic', meaning: '极好的', phonetic: '/fænˈtæs.tɪk/' },
      { word: 'generous', meaning: '慷慨的', phonetic: '/ˈdʒen.ər.əs/' },
      { word: 'hospital', meaning: '医院', phonetic: '/ˈhɒs.pɪ.təl/' },
      { word: 'important', meaning: '重要的', phonetic: '/ɪmˈpɔː.tənt/' },
      { word: 'journey', meaning: '旅程', phonetic: '/ˈdʒɜː.ni/' },
      { word: 'knowledge', meaning: '知识', phonetic: '/ˈnɒl.ɪdʒ/' },
      { word: 'language', meaning: '语言', phonetic: '/ˈlæŋ.ɡwɪdʒ/' },
      { word: 'mountain', meaning: '山', phonetic: '/ˈmaʊn.tɪn/' },
      { word: 'necessary', meaning: '必要的', phonetic: '/ˈnes.ə.ser.i/' },
      { word: 'opportunity', meaning: '机会', phonetic: '/ˌɒp.əˈtjuː.nə.ti/' },
    ];
    const hardWords = [
      { word: 'accommodate', meaning: '容纳，适应', phonetic: '/əˈkɒm.ə.deɪt/' },
      { word: 'bureaucracy', meaning: '官僚主义', phonetic: '/bjʊəˈrɒk.rə.si/' },
      { word: 'conscientious', meaning: '认真的，尽责的', phonetic: '/ˌkɒn.ʃiˈen.ʃəs/' },
      { word: 'deteriorate', meaning: '恶化', phonetic: '/dɪˈtɪə.ri.ə.reɪt/' },
      { word: 'entrepreneur', meaning: '企业家', phonetic: '/ˌɒn.trə.prəˈnɜːr/' },
      { word: 'fluorescent', meaning: '荧光的', phonetic: '/flʊəˈres.ənt/' },
      { word: 'guarantee', meaning: '保证', phonetic: '/ˌɡær.ənˈtiː/' },
      { word: 'hierarchy', meaning: '等级制度', phonetic: '/ˈhaɪə.rɑː.ki/' },
      { word: 'inevitable', meaning: '不可避免的', phonetic: '/ɪˈnev.ɪ.tə.bəl/' },
      { word: 'jeopardize', meaning: '危及', phonetic: '/ˈdʒep.ə.daɪz/' },
      { word: 'knowledgeable', meaning: '博学的', phonetic: '/ˈnɒl.ɪ.dʒə.bəl/' },
      { word: 'lieutenant', meaning: '中尉，副职', phonetic: '/lefˈten.ənt/' },
      { word: 'mischievous', meaning: '淘气的', phonetic: '/ˈmɪs.tʃɪ.vəs/' },
      { word: 'nostalgia', meaning: '怀旧', phonetic: '/nɒˈstæl.dʒə/' },
      { word: 'phenomenon', meaning: '现象', phonetic: '/fəˈnɒm.ɪ.nən/' },
    ];

    let pool: typeof easyWords;
    if (difficulty <= 2) pool = easyWords;
    else if (difficulty <= 3) pool = midWords;
    else pool = hardWords;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((w) => ({
      id: `fallback-${w.word}`,
      word: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic,
    }));
  }

  // ========== 古诗接龙 ==========

  async generatePoetryChain(
    difficulty: number,
    count: number,
  ): Promise<{ questions: PoetryChainQuestion[]; gameId: string }> {
    const safeCount = Math.min(20, Math.max(5, count));

    let poems: Array<{ id: string; title: string; content: string; author: string | null }> = [];
    try {
      poems = await this.db
        .select({
          id: chineseLessons.id,
          title: chineseLessons.title,
          content: chineseLessons.content,
          author: chineseLessons.author,
        })
        .from(chineseLessons)
        .where(eq(chineseLessons.lessonType, 'poetry'))
        .orderBy(sql`random()`)
        .limit(Math.ceil(safeCount / 2));
    } catch (err) {
      this.logger.warn(`chinese_lessons query failed: ${(err as Error).message}`);
    }

    const pairs: PoetryChainQuestion[] = [];

    // 从数据库古诗中抽取上下句
    for (const poem of poems) {
      const lines = this.parsePoetryLines(poem.content);
      for (let i = 0; i < lines.length - 1; i += 2) {
        if (pairs.length >= safeCount) break;
        const firstLine = lines[i];
        const secondLine = lines[i + 1] || lines[i];
        if (firstLine && secondLine && firstLine !== secondLine) {
          pairs.push({
            id: `${poem.id}-${i}`,
            firstLine,
            secondLine,
            hint: this.getFirstCharHint(secondLine, difficulty),
          });
        }
      }
    }

    // 保底古诗
    if (pairs.length < safeCount) {
      const fallback = this.getFallbackPoetry(difficulty);
      for (const p of fallback) {
        if (pairs.length >= safeCount) break;
        const exists = pairs.some((q) => q.firstLine === p.firstLine);
        if (!exists) pairs.push(p);
      }
    }

    // 随机打乱
    const shuffled = pairs.sort(() => Math.random() - 0.5).slice(0, safeCount);
    // 重新分配 id
    const questions = shuffled.map((q, idx) => ({ ...q, id: uuidv4() }));
    // 保留原 hint
    questions.forEach((q, idx) => { q.hint = shuffled[idx].hint; });

    return { questions, gameId: uuidv4() };
  }

  private parsePoetryLines(content: string): string[] {
    // 尝试 JSON 解析（content 可能是 JSON 数组字符串或纯文本）
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((l) => String(l).trim()).filter(Boolean);
      }
    } catch {
      // 不是 JSON，按纯文本处理
    }

    // 按标点分行
    const cleaned = content.replace(/\r\n/g, '\n').replace(/\s+/g, '');
    const lines = cleaned.split(/[，。！？、；：,.!?]/).filter(Boolean);
    return lines;
  }

  private getFirstCharHint(line: string, difficulty: number): string {
    const trimmed = line.trim();
    if (trimmed.length === 0) return '';
    if (difficulty <= 2) return trimmed[0];
    if (difficulty <= 4) return `${trimmed[0]}...`;
    return '...';
  }

  private getFallbackPoetry(difficulty: number): PoetryChainQuestion[] {
    const poems: Array<{ firstLine: string; secondLine: string; hintLevel: number }> = [
      // 简单（常见诗句）
      { firstLine: '床前明月光', secondLine: '疑是地上霜', hintLevel: 1 },
      { firstLine: '举头望明月', secondLine: '低头思故乡', hintLevel: 1 },
      { firstLine: '白日依山尽', secondLine: '黄河入海流', hintLevel: 1 },
      { firstLine: '欲穷千里目', secondLine: '更上一层楼', hintLevel: 1 },
      { firstLine: '春眠不觉晓', secondLine: '处处闻啼鸟', hintLevel: 1 },
      { firstLine: '夜来风雨声', secondLine: '花落知多少', hintLevel: 1 },
      { firstLine: '锄禾日当午', secondLine: '汗滴禾下土', hintLevel: 1 },
      { firstLine: '谁知盘中餐', secondLine: '粒粒皆辛苦', hintLevel: 1 },
      { firstLine: '离离原上草', secondLine: '一岁一枯荣', hintLevel: 2 },
      { firstLine: '野火烧不尽', secondLine: '春风吹又生', hintLevel: 2 },
      { firstLine: '两个黄鹂鸣翠柳', secondLine: '一行白鹭上青天', hintLevel: 2 },
      { firstLine: '窗含西岭千秋雪', secondLine: '门泊东吴万里船', hintLevel: 3 },
      { firstLine: '千山鸟飞绝', secondLine: '万径人踪灭', hintLevel: 2 },
      { firstLine: '孤舟蓑笠翁', secondLine: '独钓寒江雪', hintLevel: 3 },
      { firstLine: '日照香炉生紫烟', secondLine: '遥看瀑布挂前川', hintLevel: 3 },
      { firstLine: '飞流直下三千尺', secondLine: '疑是银河落九天', hintLevel: 3 },
      { firstLine: '朝辞白帝彩云间', secondLine: '千里江陵一日还', hintLevel: 3 },
      { firstLine: '两岸猿声啼不住', secondLine: '轻舟已过万重山', hintLevel: 4 },
      { firstLine: '故人西辞黄鹤楼', secondLine: '烟花三月下扬州', hintLevel: 4 },
      { firstLine: '孤帆远影碧空尽', secondLine: '唯见长江天际流', hintLevel: 5 },
    ];

    const filtered = poems.filter((p) => p.hintLevel <= difficulty + 1);
    const pool = filtered.length > 0 ? filtered : poems;
    return pool.map((p) => ({
      id: `fallback-${p.firstLine}`,
      firstLine: p.firstLine + '，',
      secondLine: p.secondLine,
      hint: this.getFirstCharHint(p.secondLine, difficulty),
    }));
  }

  // ========== 提交成绩 ==========

  async submitScore(
    userId: string,
    dto: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    if (!dto.gameType) {
      throw new BadRequestException('gameType 必填');
    }
    if (dto.score < 0 || dto.totalQuestions < 0 || dto.correctCount < 0) {
      throw new BadRequestException('分数/题数/正确数不能为负');
    }

    // 插入记录
    const inserted = await this.db
      .insert(gameRecords)
      .values({
        userId,
        gameType: dto.gameType,
        score: dto.score,
        totalQuestions: dto.totalQuestions,
        correctCount: dto.correctCount,
        durationSec: dto.durationSec,
        difficulty: dto.difficulty,
        details: dto.details ?? {},
      })
      .returning({ id: gameRecords.id });

    const recordId = inserted[0]?.id ?? '';

    // 计算当前排名（该游戏类型下，有多少人的最高分 > 我的最高分）
    const rank = await this.calculateRank(userId, dto.gameType, dto.score);

    // 判断是否为新的个人最高分
    const prevBest = await this.db
      .select({ maxScore: sql<number>`max(${gameRecords.score})` })
      .from(gameRecords)
      .where(and(eq(gameRecords.userId, userId), eq(gameRecords.gameType, dto.gameType)));

    const prevMax = Number(prevBest[0]?.maxScore ?? 0);
    const newBestScore = dto.score > prevMax;

    return { recordId, rank, newBestScore };
  }

  private async calculateRank(userId: string, gameType: GameType, score: number): Promise<number> {
    // 排名：每个用户取最高分，有多少用户最高分 > 我的分数，我的排名就是那个数 + 1
    const result = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(
        this.db
          .select({
            userId: gameRecords.userId,
            maxScore: sql<number>`max(${gameRecords.score})`.as('max_score'),
          })
          .from(gameRecords)
          .where(eq(gameRecords.gameType, gameType))
          .groupBy(gameRecords.userId)
          .as('user_best'),
      )
      .where(sql`max_score > ${score}`);

    return Number(result[0]?.count ?? 0) + 1;
  }

  // ========== 游戏记录 ==========

  async getRecords(
    userId: string,
    gameType: GameType | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: GameRecord[]; total: number }> {
    const conditions = [eq(gameRecords.userId, userId)];
    if (gameType) conditions.push(eq(gameRecords.gameType, gameType));

    const whereClause = and(...conditions);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(gameRecords)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    const records = await this.db
      .select()
      .from(gameRecords)
      .where(whereClause)
      .orderBy(desc(gameRecords.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: GameRecord[] = records.map((r) => ({
      id: r.id,
      userId: r.userId,
      gameType: r.gameType as GameType,
      score: r.score,
      totalQuestions: r.totalQuestions,
      correctCount: r.correctCount,
      durationSec: r.durationSec,
      difficulty: r.difficulty ?? 1,
      details: (r.details as Record<string, unknown>) ?? {},
      createdAt: r.createdAt.toISOString(),
    }));

    return { items, total };
  }

  // ========== 排行榜 ==========

  async getRanking(
    gameType: GameType,
    limit: number,
  ): Promise<GameRankingItem[]> {
    const safeLimit = Math.min(100, Math.max(3, limit));

    // 每个用户取最高分，按分数降序
    const rows = await this.db
      .select({
        userId: gameRecords.userId,
        maxScore: sql<number>`max(${gameRecords.score})`.as('max_score'),
        totalQuestions: sql<number>`max(${gameRecords.totalQuestions})`.as('total_q'),
        correctCount: sql<number>`max(${gameRecords.correctCount})`.as('correct_c'),
      })
      .from(gameRecords)
      .where(eq(gameRecords.gameType, gameType))
      .groupBy(gameRecords.userId)
      .orderBy(sql`max_score desc`)
      .limit(safeLimit);

    const result: GameRankingItem[] = rows.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      userName: '', // 前端或后续可根据 userId 补充用户名
      score: Number(row.maxScore),
      totalQuestions: Number(row.totalQuestions),
      correctCount: Number(row.correctCount),
    }));

    return result;
  }

  // ========== 单词打地鼠 ==========

  async generateWhackMole(
    difficulty: number,
    count: number,
  ): Promise<{ words: WhackMoleWord[]; targetMeaning: string; gameId: string }> {
    const wordPool = await this.getWordPool(difficulty, Math.max(count * 3, 20));
    const shuffled = wordPool.sort(() => Math.random() - 0.5).slice(0, count);
    const targetIdx = Math.floor(Math.random() * shuffled.length);
    const targetMeaning = shuffled[targetIdx].meaning;

    const words: WhackMoleWord[] = shuffled.map((w, i) => ({
      id: uuidv4(),
      word: w.word,
      meaning: w.meaning,
      isTarget: i === targetIdx,
    }));

    return { words, targetMeaning, gameId: uuidv4() };
  }

  // ========== 单词消消乐 ==========

  async generateWordMatch(
    difficulty: number,
    pairCount: number,
  ): Promise<{ pairs: WordMatchPair[]; gameId: string }> {
    const wordPool = await this.getWordPool(difficulty, Math.max(pairCount * 2, 10));
    const pairs: WordMatchPair[] = wordPool
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount)
      .map((w) => ({
        id: uuidv4(),
        word: w.word,
        meaning: w.meaning,
      }));
    return { pairs, gameId: uuidv4() };
  }

  // ========== 单词跑酷 ==========

  async generateWordRunner(
    difficulty: number,
    count: number,
  ): Promise<{ obstacles: RunnerObstacle[]; gameId: string }> {
    const wordPool = await this.getWordPool(difficulty, Math.max(count * 4, 20));
    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    const correctWords = shuffled.slice(0, count);

    const obstacles: RunnerObstacle[] = correctWords.map((w, idx) => {
      const distractors = shuffled
        .filter((_, i) => i !== idx)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((d) => d.meaning);
      const options = [...distractors, w.meaning].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(w.meaning);
      return {
        id: uuidv4(),
        word: w.word,
        correctMeaning: w.meaning,
        options,
        correctIndex,
      };
    });

    return { obstacles, gameId: uuidv4() };
  }

  // ========== 单词俄罗斯方块 ==========

  async generateWordTetris(
    difficulty: number,
    count: number,
  ): Promise<{ words: TetrisWord[]; gameId: string }> {
    const wordPool = await this.getWordPool(difficulty, Math.max(count, 10));
    const words: TetrisWord[] = wordPool
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map((w) => ({
        id: uuidv4(),
        word: w.word,
        meaning: w.meaning,
        letters: w.word.toUpperCase().split(''),
      }));
    return { words, gameId: uuidv4() };
  }

  // ========== 听力射击 ==========

  async generateWordShooting(
    difficulty: number,
    count: number,
  ): Promise<{ balloons: ShootingBalloon[]; targetWord: string; gameId: string }> {
    const wordPool = await this.getWordPool(difficulty, Math.max(count * 2, 10));
    const shuffled = wordPool.sort(() => Math.random() - 0.5).slice(0, count);
    const targetIdx = Math.floor(Math.random() * shuffled.length);
    const targetWord = shuffled[targetIdx].word;

    const balloons: ShootingBalloon[] = shuffled.map((w) => ({
      id: uuidv4(),
      word: w.word,
      meaning: w.meaning,
    }));

    return { balloons, targetWord, gameId: uuidv4() };
  }

  // ========== 通用词库获取 ==========

  private async getWordPool(
    difficulty: number,
    minCount: number,
  ): Promise<Array<{ word: string; meaning: string; phonetic?: string }>> {
    let words: Array<{ word: string; meaning: string; phonetic?: string }> = [];

    try {
      const levelMap: Record<number, string[]> = {
        1: ['beginner', 'elementary'],
        2: ['elementary', 'intermediate'],
        3: ['intermediate'],
        4: ['intermediate', 'advanced'],
        5: ['advanced'],
      };
      const levels = levelMap[difficulty] ?? ['intermediate'];
      const rows = await this.db
        .select({
          id: wordItems.id,
          word: wordItems.word,
          meaning: wordItems.meaning,
          phonetic: wordItems.phonetic,
        })
        .from(wordItems)
        .limit(Math.min(minCount * 3, 100));
      words = rows.map((r) => ({
        word: r.word,
        meaning: r.meaning,
        phonetic: r.phonetic ?? undefined,
      }));
    } catch (err) {
      this.logger.warn(`word_items query failed: ${(err as Error).message}`);
    }

    if (words.length < minCount) {
      const fallback = this.getFallbackWords(minCount - words.length, difficulty);
      words = [...words, ...fallback.map((w) => ({
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic ?? undefined,
      }))];
    }

    return words;
  }
}
