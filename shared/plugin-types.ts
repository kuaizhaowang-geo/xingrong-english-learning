// ---- plugin:generate_custom_english_learning_course_1 ----
// ============================================================
// 插件 generate_custom_english_learning_course_1 (生成定制化英语学习课程内容) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface GenerateCustomEnglishLearningCourseOneInput {
  /** 学习者的英语水平，例如入门、中级、高级等 */
  level: string;
  /** 英语学习课程的主题 */
  topic: string;
  /** 本次学习的目标，例如掌握日常交流用语、备考雅思等 */
  learning_objective: string;
}

/**
 * capabilityClient.load('generate_custom_english_learning_course_1').callStream<GenerateCustomEnglishLearningCourseOneOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 GenerateCustomEnglishLearningCourseOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export interface GenerateCustomEnglishLearningCourseOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:generate_custom_english_learning_course_1 ----

// ---- plugin:english_conversation_tutor_1 ----
// ============================================================
// 插件 english_conversation_tutor_1 (英语对话陪练助手) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface EnglishConversationTutorOneInput {
  /** 之前的对话历史上下文 */
  conversation_history?: string;
  /** 用户输入的对话内容（支持中文或英文） */
  user_input: string;
  /** 对话主题（如日常社交、校园、旅游、职场等） */
  topic?: string;
}

/**
 * capabilityClient.load('english_conversation_tutor_1').callStream<EnglishConversationTutorOneOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 EnglishConversationTutorOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export interface EnglishConversationTutorOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:english_conversation_tutor_1 ----

// ---- plugin:generate_english_word_structure_info_1 ----
// ============================================================
// 插件 generate_english_word_structure_info_1 (英文单词结构化信息生成) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface GenerateEnglishWordStructureInfoOneInput {
  /** 需要查询的英文单词 */
  english_word: string;
}

/**
 * capabilityClient.load('generate_english_word_structure_info_1').call<GenerateEnglishWordStructureInfoOneOutput>('textToJson', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { word, phonetic, meanings, ... } = result;
 * 返回值形如：
 *   {"word":"示例文本","phonetic":{},"meanings":[],"examples":[],"synonyms":[],"antonyms":[]}
 */
export interface GenerateEnglishWordStructureInfoOneOutput {
  /** 英文单词本身 */
  word: string;
  /** 音标信息，schema: {uk: string(英式音标), us: string(美式音标)} */
  phonetic: Record<string, unknown>;
  /** 词义列表，items schema: {partOfSpeech: string(词性，如n./v./adj./adv.等), definitions: array(释义列表，每个释义为字符串)} */
  meanings: unknown[];
  /** 例句列表，items schema: {sentence: string(英文例句), translation: string(中文翻译)} */
  examples: unknown[];
  /** 近义词列表，每个元素为英文单词字符串 */
  synonyms: unknown[];
  /** 反义词列表，每个元素为英文单词字符串 */
  antonyms: unknown[];
}
// ---- end:generate_english_word_structure_info_1 ----