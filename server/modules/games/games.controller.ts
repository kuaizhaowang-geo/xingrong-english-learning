import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

import { GamesService } from './games.service';
import type {
  GenerateMathBattleDto,
  GenerateMathBattleResponse,
  GenerateWordPKDto,
  GenerateWordPKResponse,
  GeneratePoetryChainDto,
  GeneratePoetryChainResponse,
  GenerateWhackMoleDto,
  GenerateWhackMoleResponse,
  GenerateWordMatchDto,
  GenerateWordMatchResponse,
  GenerateWordRunnerDto,
  GenerateWordRunnerResponse,
  GenerateWordTetrisDto,
  GenerateWordTetrisResponse,
  GenerateWordShootingDto,
  GenerateWordShootingResponse,
  SubmitGameScoreDto,
  SubmitGameScoreResponse,
  GameType,
  PagedResponse,
  GameRecord,
  GameRankingItem,
} from '@shared/api.interface';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // ====== 口算比拼 ======

  @NeedLogin()
  @Post('math-battle/generate')
  async generateMathBattle(
    @Body() body: GenerateMathBattleDto,
  ): Promise<GenerateMathBattleResponse> {
    const { difficulty = 3, count = 20, operations } = body;
    if (difficulty < 1 || difficulty > 5) {
      throw new BadRequestException('difficulty 必须在 1-5 之间');
    }
    if (count < 10 || count > 50) {
      throw new BadRequestException('count 必须在 10-50 之间');
    }
    return this.gamesService.generateMathBattle(difficulty, count, operations);
  }

  @NeedLogin()
  @Post('math-battle/submit')
  async submitMathBattle(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'math_battle' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 单词PK ======

  @NeedLogin()
  @Post('word-pk/generate')
  async generateWordPK(
    @Body() body: GenerateWordPKDto,
  ): Promise<GenerateWordPKResponse> {
    const { difficulty = 3, count = 15 } = body;
    if (difficulty < 1 || difficulty > 5) {
      throw new BadRequestException('difficulty 必须在 1-5 之间');
    }
    if (count < 10 || count > 30) {
      throw new BadRequestException('count 必须在 10-30 之间');
    }
    return this.gamesService.generateWordPK(difficulty, count);
  }

  @NeedLogin()
  @Post('word-pk/submit')
  async submitWordPK(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'word_pk' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 古诗接龙 ======

  @NeedLogin()
  @Post('poetry-chain/generate')
  async generatePoetryChain(
    @Body() body: GeneratePoetryChainDto,
  ): Promise<GeneratePoetryChainResponse> {
    const { difficulty = 3, count = 10 } = body;
    if (difficulty < 1 || difficulty > 5) {
      throw new BadRequestException('difficulty 必须在 1-5 之间');
    }
    if (count < 5 || count > 20) {
      throw new BadRequestException('count 必须在 5-20 之间');
    }
    return this.gamesService.generatePoetryChain(difficulty, count);
  }

  @NeedLogin()
  @Post('poetry-chain/submit')
  async submitPoetryChain(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'poetry_chain' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 游戏记录 ======

  @NeedLogin()
  @Get('records')
  async getRecords(
    @Req() req: { userContext: { userId: string } },
    @Query('gameType') gameType?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<PagedResponse<GameRecord>> {
    const { userId } = req.userContext;
    const parsedPage = parseInt(page, 10);
    const parsedSize = parseInt(pageSize, 10);

    const validGameType = ([
      'math_battle', 'word_pk', 'poetry_chain',
      'whack_mole', 'word_match', 'word_runner', 'word_tetris', 'word_shooting',
    ] as const).includes(
      gameType as GameType,
    )
      ? (gameType as GameType)
      : undefined;

    const { items, total } = await this.gamesService.getRecords(
      userId,
      validGameType,
      parsedPage,
      parsedSize,
    );

    return {
      items,
      total,
      page: parsedPage,
      pageSize: parsedSize,
    };
  }

  // ====== 排行榜 ======

  @NeedLogin()
  @Get('ranking')
  async getRanking(
    @Query('gameType') gameType: string,
    @Query('limit') limit = '10',
  ): Promise<{ items: GameRankingItem[] }> {
    if (!gameType) {
      throw new BadRequestException('gameType 必填');
    }
    const validTypes = [
      'math_battle', 'word_pk', 'poetry_chain',
      'whack_mole', 'word_match', 'word_runner', 'word_tetris', 'word_shooting',
    ] as const;
    if (!validTypes.includes(gameType as GameType)) {
      throw new BadRequestException('gameType 不合法');
    }
    const parsedLimit = parseInt(limit, 10);
    const items = await this.gamesService.getRanking(
      gameType as GameType,
      parsedLimit,
    );
    return { items };
  }

  // ====== 单词打地鼠 ======

  @NeedLogin()
  @Post('whack-mole/generate')
  async generateWhackMole(
    @Body() body: GenerateWhackMoleDto,
  ): Promise<GenerateWhackMoleResponse> {
    const { difficulty = 3, count = 10 } = body;
    if (difficulty < 1 || difficulty > 5) throw new BadRequestException('difficulty 1-5');
    if (count < 5 || count > 30) throw new BadRequestException('count 5-30');
    return this.gamesService.generateWhackMole(difficulty, count);
  }

  @NeedLogin()
  @Post('whack-mole/submit')
  async submitWhackMole(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'whack_mole' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 单词消消乐 ======

  @NeedLogin()
  @Post('word-match/generate')
  async generateWordMatch(
    @Body() body: GenerateWordMatchDto,
  ): Promise<GenerateWordMatchResponse> {
    const { difficulty = 3, pairCount = 6 } = body;
    if (difficulty < 1 || difficulty > 5) throw new BadRequestException('difficulty 1-5');
    if (pairCount < 4 || pairCount > 12) throw new BadRequestException('pairCount 4-12');
    return this.gamesService.generateWordMatch(difficulty, pairCount);
  }

  @NeedLogin()
  @Post('word-match/submit')
  async submitWordMatch(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'word_match' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 单词跑酷 ======

  @NeedLogin()
  @Post('word-runner/generate')
  async generateWordRunner(
    @Body() body: GenerateWordRunnerDto,
  ): Promise<GenerateWordRunnerResponse> {
    const { difficulty = 3, count = 15 } = body;
    if (difficulty < 1 || difficulty > 5) throw new BadRequestException('difficulty 1-5');
    if (count < 5 || count > 30) throw new BadRequestException('count 5-30');
    return this.gamesService.generateWordRunner(difficulty, count);
  }

  @NeedLogin()
  @Post('word-runner/submit')
  async submitWordRunner(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'word_runner' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 单词俄罗斯方块 ======

  @NeedLogin()
  @Post('word-tetris/generate')
  async generateWordTetris(
    @Body() body: GenerateWordTetrisDto,
  ): Promise<GenerateWordTetrisResponse> {
    const { difficulty = 3, count = 15 } = body;
    if (difficulty < 1 || difficulty > 5) throw new BadRequestException('difficulty 1-5');
    if (count < 5 || count > 30) throw new BadRequestException('count 5-30');
    return this.gamesService.generateWordTetris(difficulty, count);
  }

  @NeedLogin()
  @Post('word-tetris/submit')
  async submitWordTetris(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'word_tetris' };
    return this.gamesService.submitScore(userId, dto);
  }

  // ====== 听力射击 ======

  @NeedLogin()
  @Post('word-shooting/generate')
  async generateWordShooting(
    @Body() body: GenerateWordShootingDto,
  ): Promise<GenerateWordShootingResponse> {
    const { difficulty = 3, count = 10 } = body;
    if (difficulty < 1 || difficulty > 5) throw new BadRequestException('difficulty 1-5');
    if (count < 5 || count > 20) throw new BadRequestException('count 5-20');
    return this.gamesService.generateWordShooting(difficulty, count);
  }

  @NeedLogin()
  @Post('word-shooting/submit')
  async submitWordShooting(
    @Req() req: { userContext: { userId: string } },
    @Body() body: SubmitGameScoreDto,
  ): Promise<SubmitGameScoreResponse> {
    const { userId } = req.userContext;
    const dto: SubmitGameScoreDto = { ...body, gameType: 'word_shooting' };
    return this.gamesService.submitScore(userId, dto);
  }
}
