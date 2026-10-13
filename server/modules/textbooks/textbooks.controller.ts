import { Controller, Get, Param, Query, Post, Body, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { TextbooksService } from './textbooks.service';
 import type {
    Textbook,
    TextbookUnit,
    TextbookTreeItem,
    ChineseLesson,
    ChineseNewWord,
    MathTopic,
    MathPracticeItem,
    ChineseDictationItem,
    ChinesePoetry,
    ChinesePracticeRecord,
    ChinesePracticeRecordDto,
    MentalArithmeticItem,
    MathShapeListResponse,
    MathPuzzleListItem,
    ShapePuzzleItem,
    MathWordProblemItem,
    PagedResponse,
    ChineseDictationSession,
    ChineseDictationWrongWord,
    ChineseDictationResult,
    CreateChineseDictationSessionDto,
    SubmitChineseDictationWordDto,
    SubmitChineseDictationSessionDto,
  } from '@shared/api.interface';

@Controller('api/textbooks')
export class TextbooksController {
  constructor(private readonly textbooksService: TextbooksService) {}

  // ===== 静态路由（放在动态路由之前） =====

  @Get('tree')
  async getTree(
    @Query('subject') subject?: string,
  ): Promise<TextbookTreeItem[]> {
    return this.textbooksService.getTree(subject);
  }

  // ===== 语文练习 =====

  @Get('chinese/lessons')
  async getChineseLessonsList(
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('lessonType') lessonType?: string,
  ): Promise<ChineseLesson[]> {
    return this.textbooksService.getChineseLessonsList({ textbookId, unitId, lessonType });
  }

  @Get('chinese/lessons/:lessonId')
  async getChineseLesson(
    @Param('lessonId') lessonId: string,
  ): Promise<ChineseLesson> {
    return this.textbooksService.getChineseLesson(lessonId);
  }

  @Get('chinese/characters')
  async getChineseCharacters(
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('lessonId') lessonId?: string,
  ): Promise<ChineseNewWord[]> {
    return this.textbooksService.getChineseCharacters({ textbookId, unitId, lessonId });
  }

  @Get('chinese/dictation-items')
  async getChineseDictation(
    @Query('count') count?: string,
    @Query('textbookId') textbookId?: string,
  ): Promise<ChineseDictationItem[]> {
    const num = count ? parseInt(count, 10) : 10;
    return this.textbooksService.getChineseDictation({ count: num, textbookId });
  }

  @NeedLogin()
  @Get('chinese/dictation')
  async listDictationSessions(
    @Req() req: { userContext: { userId: string } },
    @Query('grade') grade?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<ChineseDictationSession>> {
    const { userId } = req.userContext;
    return this.textbooksService.listDictationSessions(userId, {
      grade,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('chinese/poetry')
  async getChinesePoetry(
    @Query('textbookId') textbookId?: string,
    @Query('grade') grade?: string,
    @Query('unitId') unitId?: string,
    @Query('limit') limit?: string,
  ): Promise<ChinesePoetry[]> {
    return this.textbooksService.getChinesePoetry({
      textbookId,
      grade,
      unitId,
      limit: limit ? Math.min(parseInt(limit, 10) || 0, 100) : undefined,
    });
  }

  // ===== 生字听写 =====

  @NeedLogin()
  @Post('chinese/dictation')
  async createDictationSession(
    @Req() req: { userContext: { userId: string } },
    @Body() dto: CreateChineseDictationSessionDto,
  ): Promise<ChineseDictationSession> {
    const { userId } = req.userContext;
    return this.textbooksService.createDictationSession(userId, dto);
  }

  @NeedLogin()
  @Post('chinese/dictation/:id/answer')
  async answerDictationWord(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() dto: SubmitChineseDictationWordDto,
  ): Promise<{ isCorrect: boolean; correctAnswer: string; character?: string; pinyin?: string }> {
    const { userId } = req.userContext;
    return this.textbooksService.answerDictationWord(userId, id, dto);
  }

  @NeedLogin()
  @Post('chinese/dictation/:id/submit')
  async submitDictationSession(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() dto: SubmitChineseDictationSessionDto,
  ): Promise<ChineseDictationResult> {
    const { userId } = req.userContext;
    return this.textbooksService.submitDictationSession(userId, id, dto);
  }

  @NeedLogin()
  @Get('chinese/dictation/:id')
  async getDictationSession(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
  ): Promise<ChineseDictationSession> {
    const { userId } = req.userContext;
    return this.textbooksService.getDictationSession(userId, id);
  }

  @NeedLogin()
  @Get('chinese/wrong-words')
  async getDictationWrongWords(
    @Req() req: { userContext: { userId: string } },
    @Query('grade') grade?: string,
    @Query('mastered') mastered?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<ChineseDictationWrongWord>> {
    const { userId } = req.userContext;
    return this.textbooksService.listDictationWrongWords(userId, {
      grade,
      mastered: mastered !== undefined ? mastered === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @NeedLogin()
  @Post('chinese/practice-records')
  async saveChinesePracticeRecord(
    @Req() req: { userContext: { userId: string } },
    @Body() dto: ChinesePracticeRecordDto,
  ): Promise<ChinesePracticeRecord> {
    const { userId } = req.userContext;
    return this.textbooksService.savePracticeRecord(userId, dto);
  }

  @Get('math/topics/:topicId')
  async getMathTopic(
    @Param('topicId') topicId: string,
  ): Promise<MathTopic & { practiceItems: MathPracticeItem[]; shapePuzzles: ShapePuzzleItem[] }> {
    return this.textbooksService.getMathTopic(topicId);
  }

  // ===== 数学练习升级功能 =====

  @Get('math/mental-arithmetic')
  async getMentalArithmetic(
    @Query('count') count?: string,
    @Query('difficulty') difficulty?: string,
    @Query('operations') operations?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
  ): Promise<MentalArithmeticItem[]> {
    return this.textbooksService.getMentalArithmetic({
      count: count ? parseInt(count, 10) : 20,
      difficulty: difficulty ? parseInt(difficulty, 10) : 1,
      operations: operations ? operations.split(',') : ['add', 'subtract'],
      textbookId,
      unitId,
    });
  }

  @Get('math/shapes')
  async getShapes(): Promise<MathShapeListResponse> {
    return this.textbooksService.getShapes();
  }

  @Get('math/word-problems')
  async getMathWordProblems(
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
  ): Promise<MathWordProblemItem[]> {
    return this.textbooksService.getMathWordProblemList({
      textbookId,
      unitId,
      difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
      limit: limit ? Math.min(parseInt(limit, 10) || 0, 100) : undefined,
    });
  }

  @Get('math/puzzles')
  async getPuzzleList(
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('difficulty') difficulty?: string,
  ): Promise<MathPuzzleListItem[]> {
    return this.textbooksService.getPuzzleList({
      textbookId,
      unitId,
      difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
    });
  }

  @Get('math/puzzles/:id')
  async getPuzzleDetail(@Param('id') id: string): Promise<ShapePuzzleItem> {
    return this.textbooksService.getPuzzleDetail(id);
  }

  // ===== 列表 & 详情 =====

  @Get()
  async getList(
    @Query('grade') grade?: string,
    @Query('subject') subject?: string,
    @Query('semester') semester?: string,
    @Query('publisher') publisher?: string,
  ): Promise<Textbook[]> {
    return this.textbooksService.getList({ grade, subject, semester, publisher });
  }

  @Get(':id')
  async getDetail(
    @Param('id') id: string,
  ): Promise<{ textbook: Textbook; units: TextbookUnit[] }> {
    return this.textbooksService.getDetail(id);
  }

  @Get(':id/units/:unitId')
  async getUnitDetail(
    @Param('id') id: string,
    @Param('unitId') unitId: string,
  ): Promise<TextbookUnit> {
    return this.textbooksService.getUnitDetail(id, unitId);
  }

  @Get(':id/units/:unitId/lessons')
  async getUnitLessons(
    @Param('id') id: string,
    @Param('unitId') unitId: string,
  ): Promise<{ chineseLessons: ChineseLesson[]; mathTopics: MathTopic[] }> {
    return this.textbooksService.getUnitLessons(id, unitId);
  }
}
