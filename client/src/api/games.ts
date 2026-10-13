import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
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
  GameRecord,
  PagedResponse,
  GameRankingItem,
} from '@shared/api.interface';

// 口算比拼
export async function generateMathBattle(
  params: GenerateMathBattleDto,
): Promise<GenerateMathBattleResponse> {
  const resp = await axiosForBackend.post('/api/games/math-battle/generate', params);
  return resp.data as GenerateMathBattleResponse;
}

export async function submitMathBattle(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/math-battle/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 单词PK
export async function generateWordPK(
  params: GenerateWordPKDto,
): Promise<GenerateWordPKResponse> {
  const resp = await axiosForBackend.post('/api/games/word-pk/generate', params);
  return resp.data as GenerateWordPKResponse;
}

export async function submitWordPK(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/word-pk/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 古诗接龙
export async function generatePoetryChain(
  params: GeneratePoetryChainDto,
): Promise<GeneratePoetryChainResponse> {
  const resp = await axiosForBackend.post('/api/games/poetry-chain/generate', params);
  return resp.data as GeneratePoetryChainResponse;
}

export async function submitPoetryChain(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/poetry-chain/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 单词打地鼠
export async function generateWhackMole(
  params: GenerateWhackMoleDto,
): Promise<GenerateWhackMoleResponse> {
  const resp = await axiosForBackend.post('/api/games/whack-mole/generate', params);
  return resp.data as GenerateWhackMoleResponse;
}

export async function submitWhackMole(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/whack-mole/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 单词消消乐
export async function generateWordMatch(
  params: GenerateWordMatchDto,
): Promise<GenerateWordMatchResponse> {
  const resp = await axiosForBackend.post('/api/games/word-match/generate', params);
  return resp.data as GenerateWordMatchResponse;
}

export async function submitWordMatch(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/word-match/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 单词跑酷
export async function generateWordRunner(
  params: GenerateWordRunnerDto,
): Promise<GenerateWordRunnerResponse> {
  const resp = await axiosForBackend.post('/api/games/word-runner/generate', params);
  return resp.data as GenerateWordRunnerResponse;
}

export async function submitWordRunner(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/word-runner/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 单词俄罗斯方块
export async function generateWordTetris(
  params: GenerateWordTetrisDto,
): Promise<GenerateWordTetrisResponse> {
  const resp = await axiosForBackend.post('/api/games/word-tetris/generate', params);
  return resp.data as GenerateWordTetrisResponse;
}

export async function submitWordTetris(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/word-tetris/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 听力射击
export async function generateWordShooting(
  params: GenerateWordShootingDto,
): Promise<GenerateWordShootingResponse> {
  const resp = await axiosForBackend.post('/api/games/word-shooting/generate', params);
  return resp.data as GenerateWordShootingResponse;
}

export async function submitWordShooting(
  body: Omit<SubmitGameScoreDto, 'gameType'>,
): Promise<SubmitGameScoreResponse> {
  const resp = await axiosForBackend.post('/api/games/word-shooting/submit', body);
  return resp.data as SubmitGameScoreResponse;
}

// 游戏记录
export async function getGameRecords(params: {
  gameType?: GameType;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<GameRecord>> {
  const resp = await axiosForBackend.get('/api/games/records', { params });
  return resp.data as PagedResponse<GameRecord>;
}

// 排行榜
export async function getGameRanking(params: {
  gameType: GameType;
  limit?: number;
}): Promise<{ items: GameRankingItem[] }> {
  const resp = await axiosForBackend.get('/api/games/ranking', { params });
  return resp.data as { items: GameRankingItem[] };
}

export { logger };
