import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { QuestionsService } from './questions.service';
import type {
  Question,
  PagedResponse,
  CreateQuestionDto,
  UpdateQuestionDto,
  GenerateQuestionsDto,
  AIQuiz,
  AIQuizResult,
  AIWrongQuestion,
  CreateAIQuizDto,
  SubmitAIQuizAnswerDto,
  SubmitAIQuizDto,
} from '@shared/api.interface';

@Controller('api/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async listQuestions(
    @Query('subject') subject?: string,
    @Query('grade') grade?: string,
    @Query('semester') semester?: string,
    @Query('unitId') unitId?: string,
    @Query('knowledgePoint') knowledgePoint?: string,
    @Query('questionType') questionType?: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<Question>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    return this.questionsService.listQuestions({
      subject,
      grade,
      semester,
      unitId,
      knowledgePoint,
      questionType,
      difficulty,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }

  @NeedLogin()
  @Post('generate')
  async generateQuestions(
    @Req() req: Request,
    @Body() dto: GenerateQuestionsDto,
  ): Promise<Question[]> {
    const { userId } = req.userContext;
    return this.questionsService.generateQuestions(userId, dto);
  }

  @NeedLogin()
  @Post()
  async createQuestion(
    @Req() req: Request,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.createQuestion(dto);
  }

  // ===== AI 出题会话（静态路由必须放在动态 :id 之前）=====

  @NeedLogin()
  @Post('ai-quizzes')
  async createAIQuiz(
    @Req() req: Request,
    @Body() dto: CreateAIQuizDto,
  ): Promise<AIQuiz> {
    const { userId } = req.userContext;
    return this.questionsService.createAIQuiz(userId, dto);
  }

  @NeedLogin()
  @Get('ai-quizzes')
  async listAIQuizzes(
    @Req() req: Request,
    @Query('subject') subject?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<AIQuiz>> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    return this.questionsService.listAIQuizzes({
      userId,
      subject,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }

  @NeedLogin()
  @Get('ai-quizzes/:id')
  async getAIQuiz(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AIQuiz> {
    const { userId } = req.userContext;
    return this.questionsService.getAIQuiz(userId, id);
  }

  @NeedLogin()
  @Post('ai-quizzes/:id/answer')
  async answerAIQuiz(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SubmitAIQuizAnswerDto,
  ): Promise<{ isCorrect: boolean; correctAnswer: string; analysis?: string }> {
    const { userId } = req.userContext;
    return this.questionsService.answerAIQuizQuestion(userId, id, dto);
  }

  @NeedLogin()
  @Post('ai-quizzes/:id/submit')
  async submitAIQuiz(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SubmitAIQuizDto,
  ): Promise<AIQuizResult> {
    const { userId } = req.userContext;
    return this.questionsService.submitAIQuiz(userId, id, dto);
  }

  @NeedLogin()
  @Get('ai-wrong-questions')
  async listAIWrongQuestions(
    @Req() req: Request,
    @Query('subject') subject?: string,
    @Query('mastered') mastered?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<AIWrongQuestion>> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    const masteredBool =
      mastered === undefined ? undefined : mastered === 'true';
    return this.questionsService.listAIWrongQuestions({
      userId,
      subject,
      mastered: masteredBool,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }

  // ===== 单题 CRUD（动态 :id 路由必须放在最后）=====

  @Get(':id')
  async getQuestion(@Param('id') id: string): Promise<Question> {
    return this.questionsService.getQuestion(id);
  }

  @NeedLogin()
  @Patch(':id')
  async updateQuestion(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.updateQuestion(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async deleteQuestion(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.questionsService.deleteQuestion(id);
    return { success: true };
  }
}
