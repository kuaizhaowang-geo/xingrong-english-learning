// ===== Types =====
export interface PhoneticExample {
  word: string;
  phonetic: string;
  meaning: string;
}

export type PhoneticType = 'vowel' | 'consonant';
export type VowelSubType = 'monophthong' | 'diphthong';
export type ConsonantSubType = 'voiceless' | 'voiced';
export type MouthShape =
  | 'wide'
  | 'narrow'
  | 'round'
  | 'flat'
  | 'mid'
  | 'open'
  | 'closed';

export interface PhoneticItem {
  symbol: string;
  type: PhoneticType;
  subType: VowelSubType | ConsonantSubType;
  categoryLabel: string;
  description: string;
  tips: string[];
  examples: PhoneticExample[];
  mouthShape: MouthShape;
}

// ===== Vowels (20) =====
export const vowels: PhoneticItem[] = [
  // 单元音 - 长元音
  {
    symbol: '/iː/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·长元音',
    description: '嘴角向两侧伸展，舌前部抬向硬腭，发长音"衣"。',
    tips: [
      '舌尖抵下齿，舌前部向硬腭抬起',
      '嘴角向两侧伸展呈微笑状',
      '发音要长而饱满，声带振动',
    ],
    examples: [
      { word: 'see', phonetic: '/siː/', meaning: '看见' },
      { word: 'tree', phonetic: '/triː/', meaning: '树' },
      { word: 'tea', phonetic: '/tiː/', meaning: '茶' },
      { word: 'sheep', phonetic: '/ʃiːp/', meaning: '绵羊' },
    ],
    mouthShape: 'wide',
  },
  {
    symbol: '/ɑː/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·长元音',
    description: '口张大，舌身后缩，舌后部稍抬，发长音"啊"。',
    tips: [
      '口型大张，舌身低平后缩',
      '舌尖不抵下齿，处于口腔底部',
      '发音绵长有力，声带振动',
    ],
    examples: [
      { word: 'car', phonetic: '/kɑː/', meaning: '汽车' },
      { word: 'far', phonetic: '/fɑː/', meaning: '远的' },
      { word: 'park', phonetic: '/pɑːk/', meaning: '公园' },
      { word: 'star', phonetic: '/stɑː/', meaning: '星星' },
    ],
    mouthShape: 'open',
  },
  {
    symbol: '/ɔː/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·长元音',
    description: '双唇收圆并向前突出，舌后部抬起，发长音"奥"。',
    tips: [
      '双唇收圆并向前突出',
      '舌后部向软腭抬起',
      '舌身低，发音长而饱满',
    ],
    examples: [
      { word: 'door', phonetic: '/dɔː/', meaning: '门' },
      { word: 'four', phonetic: '/fɔː/', meaning: '四' },
      { word: 'talk', phonetic: '/tɔːk/', meaning: '说话' },
      { word: 'horse', phonetic: '/hɔːs/', meaning: '马' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/uː/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·长元音',
    description: '双唇收圆突出，舌后部向软腭抬起，发长音"乌"。',
    tips: [
      '双唇收圆并向前突出',
      '舌后部向软腭高高抬起',
      '发音长而清晰，声带振动',
    ],
    examples: [
      { word: 'food', phonetic: '/fuːd/', meaning: '食物' },
      { word: 'blue', phonetic: '/bluː/', meaning: '蓝色的' },
      { word: 'school', phonetic: '/skuːl/', meaning: '学校' },
      { word: 'moon', phonetic: '/muːn/', meaning: '月亮' },
    ],
    mouthShape: 'narrow',
  },
  {
    symbol: '/ɜː/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·长元音',
    description: '舌身放平，舌中部稍抬，双唇扁平，发长音"尔"。',
    tips: [
      '舌身放平，舌中部稍抬',
      '双唇扁平放松',
      '发音长而自然，声带振动',
    ],
    examples: [
      { word: 'bird', phonetic: '/bɜːd/', meaning: '鸟' },
      { word: 'her', phonetic: '/hɜː/', meaning: '她的' },
      { word: 'turn', phonetic: '/tɜːn/', meaning: '转动' },
      { word: 'word', phonetic: '/wɜːd/', meaning: '单词' },
    ],
    mouthShape: 'flat',
  },
  // 单元音 - 短元音
  {
    symbol: '/ɪ/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '舌前部稍抬，比/iː/低且靠后，双唇微开，发短促的"衣"音。',
    tips: [
      '舌前部稍抬，位置比/iː/低',
      '双唇微开，嘴角稍向两侧舒展',
      '发音短促有力，声带振动',
    ],
    examples: [
      { word: 'sit', phonetic: '/sɪt/', meaning: '坐' },
      { word: 'big', phonetic: '/bɪɡ/', meaning: '大的' },
      { word: 'ship', phonetic: '/ʃɪp/', meaning: '船' },
      { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的' },
    ],
    mouthShape: 'mid',
  },
  {
    symbol: '/e/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '嘴巴半开，舌尖抵下齿，舌前部稍抬起，发短促的"诶"音。',
    tips: [
      '舌尖抵下齿，舌前部稍抬起',
      '嘴巴半开，上下齿间距一指宽',
      '发音短促，声带振动',
    ],
    examples: [
      { word: 'bed', phonetic: '/bed/', meaning: '床' },
      { word: 'red', phonetic: '/red/', meaning: '红色的' },
      { word: 'pen', phonetic: '/pen/', meaning: '钢笔' },
      { word: 'bread', phonetic: '/bred/', meaning: '面包' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/æ/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '嘴巴张大，舌身放平，舌尖抵下齿，双唇向两侧伸展，发短促的"啊"音。',
    tips: [
      '舌尖抵下齿，舌身低平',
      '嘴巴张大，上下齿间距两指宽',
      '双唇向两侧伸展，声带振动',
    ],
    examples: [
      { word: 'cat', phonetic: '/kæt/', meaning: '猫' },
      { word: 'bad', phonetic: '/bæd/', meaning: '坏的' },
      { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的' },
      { word: 'map', phonetic: '/mæp/', meaning: '地图' },
    ],
    mouthShape: 'open',
  },
  {
    symbol: '/ɒ/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '口张大，舌身后缩，双唇收圆，发短促的"哦"音。',
    tips: [
      '口张大，舌身后缩',
      '双唇收圆但不突出',
      '发音短促有力，声带振动',
    ],
    examples: [
      { word: 'hot', phonetic: '/hɒt/', meaning: '热的' },
      { word: 'dog', phonetic: '/dɒɡ/', meaning: '狗' },
      { word: 'box', phonetic: '/bɒks/', meaning: '盒子' },
      { word: 'watch', phonetic: '/wɒtʃ/', meaning: '手表' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/ʊ/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '舌后部抬起，比/uː/低且放松，双唇收圆，发短促的"乌"音。',
    tips: [
      '舌后部抬起，位置比/uː/低',
      '双唇收圆但不突出',
      '发音短促轻松，声带振动',
    ],
    examples: [
      { word: 'book', phonetic: '/bʊk/', meaning: '书' },
      { word: 'good', phonetic: '/ɡʊd/', meaning: '好的' },
      { word: 'put', phonetic: '/pʊt/', meaning: '放' },
      { word: 'wood', phonetic: '/wʊd/', meaning: '木头' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/ʌ/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '舌身稍向后缩，舌中部稍抬，嘴半开，发短促的"啊"音。',
    tips: [
      '舌身稍向后缩，舌中部稍抬',
      '嘴半开，双唇自然放松',
      '发音短促有力，声带振动',
    ],
    examples: [
      { word: 'cup', phonetic: '/kʌp/', meaning: '杯子' },
      { word: 'bus', phonetic: '/bʌs/', meaning: '公交车' },
      { word: 'love', phonetic: '/lʌv/', meaning: '爱' },
      { word: 'sun', phonetic: '/sʌn/', meaning: '太阳' },
    ],
    mouthShape: 'mid',
  },
  {
    symbol: '/ə/',
    type: 'vowel',
    subType: 'monophthong',
    categoryLabel: '单元音·短元音',
    description: '舌身放平，嘴自然张开，发极轻的"呃"音，是英语中最常见的弱读音。',
    tips: [
      '舌身放平，处于自然放松状态',
      '嘴自然微张，双唇放松',
      '发音轻而短，不重读，声带轻振',
    ],
    examples: [
      { word: 'about', phonetic: '/əˈbaʊt/', meaning: '关于' },
      { word: 'sister', phonetic: '/ˈsɪstə/', meaning: '姐妹' },
      { word: 'doctor', phonetic: '/ˈdɒktə/', meaning: '医生' },
      { word: 'banana', phonetic: '/bəˈnɑːnə/', meaning: '香蕉' },
    ],
    mouthShape: 'flat',
  },
  // 双元音
  {
    symbol: '/eɪ/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/e/滑向/ɪ/，嘴角向两侧展开，发"诶衣"音。',
    tips: [
      '起始口型为/e/，舌尖抵下齿',
      '舌位从半高滑向近高',
      '双唇向两侧展开，前重后轻',
    ],
    examples: [
      { word: 'day', phonetic: '/deɪ/', meaning: '白天' },
      { word: 'name', phonetic: '/neɪm/', meaning: '名字' },
      { word: 'cake', phonetic: '/keɪk/', meaning: '蛋糕' },
      { word: 'play', phonetic: '/pleɪ/', meaning: '玩' },
    ],
    mouthShape: 'wide',
  },
  {
    symbol: '/aɪ/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/a/滑向/ɪ/，口型由大到小，发"爱"音。',
    tips: [
      '起始口型大张，类似/ɑː/',
      '舌位由低向高滑动到/ɪ/',
      '口型由开到合，前重后轻',
    ],
    examples: [
      { word: 'my', phonetic: '/maɪ/', meaning: '我的' },
      { word: 'time', phonetic: '/taɪm/', meaning: '时间' },
      { word: 'like', phonetic: '/laɪk/', meaning: '喜欢' },
      { word: 'night', phonetic: '/naɪt/', meaning: '夜晚' },
    ],
    mouthShape: 'wide',
  },
  {
    symbol: '/ɔɪ/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/ɔ/滑向/ɪ/，双唇由圆到扁，发"奥衣"音。',
    tips: [
      '起始双唇收圆，舌后部抬起',
      '向/ɪ/滑动，双唇由圆变扁',
      '前重后轻，声带振动',
    ],
    examples: [
      { word: 'boy', phonetic: '/bɔɪ/', meaning: '男孩' },
      { word: 'voice', phonetic: '/vɔɪs/', meaning: '声音' },
      { word: 'toy', phonetic: '/tɔɪ/', meaning: '玩具' },
      { word: 'enjoy', phonetic: '/ɪnˈdʒɔɪ/', meaning: '享受' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/aʊ/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/a/滑向/ʊ/，口型由大到圆，发"奥屋"音。',
    tips: [
      '起始口型大张，舌身低平',
      '向/ʊ/滑动，双唇逐渐收圆',
      '口型由大到小，前重后轻',
    ],
    examples: [
      { word: 'now', phonetic: '/naʊ/', meaning: '现在' },
      { word: 'house', phonetic: '/haʊs/', meaning: '房子' },
      { word: 'cow', phonetic: '/kaʊ/', meaning: '奶牛' },
      { word: 'brown', phonetic: '/braʊn/', meaning: '棕色的' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/əʊ/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/ə/滑向/ʊ/，双唇由扁到圆，发"欧"音。',
    tips: [
      '起始舌身放平，双唇扁平',
      '向/ʊ/滑动，双唇逐渐收圆',
      '发音圆滑自然，前重后轻',
    ],
    examples: [
      { word: 'go', phonetic: '/ɡəʊ/', meaning: '去' },
      { word: 'home', phonetic: '/həʊm/', meaning: '家' },
      { word: 'nose', phonetic: '/nəʊz/', meaning: '鼻子' },
      { word: 'yellow', phonetic: '/ˈjeləʊ/', meaning: '黄色的' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/ɪə/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/ɪ/滑向/ə/，舌前部下降，发"衣尔"音。',
    tips: [
      '起始舌前部稍抬，类似/ɪ/',
      '向/ə/滑动，舌位逐渐降低',
      '双唇由稍紧变放松，前重后轻',
    ],
    examples: [
      { word: 'ear', phonetic: '/ɪə/', meaning: '耳朵' },
      { word: 'here', phonetic: '/hɪə/', meaning: '这里' },
      { word: 'dear', phonetic: '/dɪə/', meaning: '亲爱的' },
      { word: 'near', phonetic: '/nɪə/', meaning: '近的' },
    ],
    mouthShape: 'mid',
  },
  {
    symbol: '/eə/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/e/滑向/ə/，嘴由半开到张开，发"爱尔"音。',
    tips: [
      '起始舌前部半抬，类似/e/',
      '向/ə/滑动，嘴逐渐张大',
      '双唇由紧到松，前重后轻',
    ],
    examples: [
      { word: 'air', phonetic: '/eə/', meaning: '空气' },
      { word: 'care', phonetic: '/keə/', meaning: '关心' },
      { word: 'hair', phonetic: '/heə/', meaning: '头发' },
      { word: 'where', phonetic: '/weə/', meaning: '哪里' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/ʊə/',
    type: 'vowel',
    subType: 'diphthong',
    categoryLabel: '双元音',
    description: '由/ʊ/滑向/ə/，双唇由圆到扁，发"乌尔"音。',
    tips: [
      '起始舌后部抬起，双唇收圆',
      '向/ə/滑动，双唇逐渐展开',
      '舌位由高到低，前重后轻',
    ],
    examples: [
      { word: 'tour', phonetic: '/tʊə/', meaning: '旅行' },
      { word: 'pure', phonetic: '/pjʊə/', meaning: '纯净的' },
      { word: 'cure', phonetic: '/kjʊə/', meaning: '治愈' },
      { word: 'fewer', phonetic: '/ˈfjuːə/', meaning: '更少的' },
    ],
    mouthShape: 'round',
  },
];

// ===== Consonants (28) =====
export const consonants: PhoneticItem[] = [
  // 清辅音 (11)
  {
    symbol: '/p/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·爆破音',
    description: '双唇紧闭，气流冲开双唇发出爆破音，清辅音，声带不振动。',
    tips: [
      '双唇紧闭，憋住气流',
      '气流突然冲开双唇，发出爆破音',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'pen', phonetic: '/pen/', meaning: '钢笔' },
      { word: 'apple', phonetic: '/ˈæpl/', meaning: '苹果' },
      { word: 'cup', phonetic: '/kʌp/', meaning: '杯子' },
      { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的' },
    ],
    mouthShape: 'closed',
  },
  {
    symbol: '/t/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·爆破音',
    description: '舌尖抵上齿龈，气流冲开阻碍发出爆破音，清辅音。',
    tips: [
      '舌尖抵上齿龈，形成阻碍',
      '气流突然冲开阻碍，发出爆破音',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'tea', phonetic: '/tiː/', meaning: '茶' },
      { word: 'water', phonetic: '/ˈwɔːtə/', meaning: '水' },
      { word: 'cat', phonetic: '/kæt/', meaning: '猫' },
      { word: 'table', phonetic: '/ˈteɪbl/', meaning: '桌子' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/k/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·爆破音',
    description: '舌后部抵软腭，气流冲开阻碍发出爆破音，清辅音。',
    tips: [
      '舌后部抵软腭，形成阻碍',
      '气流突然冲开阻碍，发出爆破音',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'car', phonetic: '/kɑː/', meaning: '汽车' },
      { word: 'back', phonetic: '/bæk/', meaning: '后面' },
      { word: 'clock', phonetic: '/klɒk/', meaning: '时钟' },
      { word: 'school', phonetic: '/skuːl/', meaning: '学校' },
    ],
    mouthShape: 'open',
  },
  {
    symbol: '/f/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·摩擦音',
    description: '上齿轻触下唇，气流从唇齿间摩擦而出，清辅音。',
    tips: [
      '上齿轻触下唇内侧',
      '气流从唇齿间的缝隙摩擦而出',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼' },
      { word: 'coffee', phonetic: '/ˈkɒfi/', meaning: '咖啡' },
      { word: 'life', phonetic: '/laɪf/', meaning: '生活' },
      { word: 'off', phonetic: '/ɒf/', meaning: '离开' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/θ/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·摩擦音',
    description: '舌尖轻抵上齿背，气流从舌齿间摩擦而出，清辅音。',
    tips: [
      '舌尖轻抵上齿背面',
      '气流从舌齿间的窄缝摩擦而出',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'think', phonetic: '/θɪŋk/', meaning: '思考' },
      { word: 'three', phonetic: '/θriː/', meaning: '三' },
      { word: 'math', phonetic: '/mæθ/', meaning: '数学' },
      { word: 'tooth', phonetic: '/tuːθ/', meaning: '牙齿' },
    ],
    mouthShape: 'narrow',
  },
  {
    symbol: '/s/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·摩擦音',
    description: '舌尖接近上齿龈，气流从舌尖与齿龈间摩擦而出，清辅音。',
    tips: [
      '舌尖接近上齿龈，形成窄缝',
      '气流从窄缝中摩擦而出',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'sun', phonetic: '/sʌn/', meaning: '太阳' },
      { word: 'house', phonetic: '/haʊs/', meaning: '房子' },
      { word: 'miss', phonetic: '/mɪs/', meaning: '想念' },
      { word: 'school', phonetic: '/skuːl/', meaning: '学校' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/ʃ/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·摩擦音',
    description: '舌前部向硬腭抬起，双唇稍向前突出，气流摩擦而出，清辅音。',
    tips: [
      '舌前部向硬腭抬起，接近硬腭',
      '双唇稍向前突出并略收圆',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'she', phonetic: '/ʃiː/', meaning: '她' },
      { word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼' },
      { word: 'station', phonetic: '/ˈsteɪʃn/', meaning: '车站' },
      { word: 'dish', phonetic: '/dɪʃ/', meaning: '盘子' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/h/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·摩擦音',
    description: '气流从声门摩擦而出，口型随后面的元音变化，清辅音。',
    tips: [
      '气流从声门摩擦而出',
      '口型随后面的元音变化',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'hello', phonetic: '/həˈləʊ/', meaning: '你好' },
      { word: 'hat', phonetic: '/hæt/', meaning: '帽子' },
      { word: 'who', phonetic: '/huː/', meaning: '谁' },
      { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的' },
    ],
    mouthShape: 'open',
  },
  {
    symbol: '/tʃ/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·破擦音',
    description: '舌尖抵上齿龈后部，气流冲开阻碍后摩擦而出，清辅音。',
    tips: [
      '舌尖抵上齿龈后部，先形成阻碍',
      '气流冲开阻碍后摩擦而出',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'chair', phonetic: '/tʃeə/', meaning: '椅子' },
      { word: 'teacher', phonetic: '/ˈtiːtʃə/', meaning: '老师' },
      { word: 'watch', phonetic: '/wɒtʃ/', meaning: '手表' },
      { word: 'lunch', phonetic: '/lʌntʃ/', meaning: '午餐' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/tr/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·破擦音',
    description: '舌尖抵上齿龈后部，舌身呈发/r/的姿势，清辅音。',
    tips: [
      '舌尖抵上齿龈后部，做好发/r/准备',
      '气流冲开阻碍后发出类似"缺"的音',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'tree', phonetic: '/triː/', meaning: '树' },
      { word: 'try', phonetic: '/traɪ/', meaning: '尝试' },
      { word: 'country', phonetic: '/ˈkʌntri/', meaning: '国家' },
      { word: 'train', phonetic: '/treɪn/', meaning: '火车' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/ts/',
    type: 'consonant',
    subType: 'voiceless',
    categoryLabel: '清辅音·破擦音',
    description: '舌尖抵上齿龈，气流冲开后摩擦而出，清辅音，常出现在名词复数。',
    tips: [
      '舌尖抵上齿龈，先形成阻碍',
      '气流冲开后摩擦而出，类似"次"音',
      '声带不振动，是清辅音',
    ],
    examples: [
      { word: 'cats', phonetic: '/kæts/', meaning: '猫（复数）' },
      { word: 'hats', phonetic: '/hæts/', meaning: '帽子（复数）' },
      { word: 'students', phonetic: '/ˈstjuːdnts/', meaning: '学生（复数）' },
      { word: 'bikes', phonetic: '/baɪks/', meaning: '自行车（复数）' },
    ],
    mouthShape: 'flat',
  },
  // 浊辅音 (17)
  {
    symbol: '/b/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·爆破音',
    description: '双唇紧闭，气流冲开双唇发出爆破音，浊辅音，声带振动。',
    tips: [
      '双唇紧闭，憋住气流',
      '气流突然冲开双唇，发出爆破音',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'book', phonetic: '/bʊk/', meaning: '书' },
      { word: 'baby', phonetic: '/ˈbeɪbi/', meaning: '婴儿' },
      { word: 'cab', phonetic: '/kæb/', meaning: '出租车' },
      { word: 'big', phonetic: '/bɪɡ/', meaning: '大的' },
    ],
    mouthShape: 'closed',
  },
  {
    symbol: '/d/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·爆破音',
    description: '舌尖抵上齿龈，气流冲开阻碍发出爆破音，浊辅音。',
    tips: [
      '舌尖抵上齿龈，形成阻碍',
      '气流突然冲开阻碍，发出爆破音',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'dog', phonetic: '/dɒɡ/', meaning: '狗' },
      { word: 'day', phonetic: '/deɪ/', meaning: '天' },
      { word: 'bed', phonetic: '/bed/', meaning: '床' },
      { word: 'door', phonetic: '/dɔː/', meaning: '门' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/ɡ/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·爆破音',
    description: '舌后部抵软腭，气流冲开阻碍发出爆破音，浊辅音。',
    tips: [
      '舌后部抵软腭，形成阻碍',
      '气流突然冲开阻碍，发出爆破音',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'go', phonetic: '/ɡəʊ/', meaning: '去' },
      { word: 'big', phonetic: '/bɪɡ/', meaning: '大的' },
      { word: 'egg', phonetic: '/eɡ/', meaning: '鸡蛋' },
      { word: 'game', phonetic: '/ɡeɪm/', meaning: '游戏' },
    ],
    mouthShape: 'open',
  },
  {
    symbol: '/v/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·摩擦音',
    description: '上齿轻触下唇，气流从唇齿间摩擦而出，浊辅音。',
    tips: [
      '上齿轻触下唇内侧',
      '气流从唇齿间的缝隙摩擦而出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'very', phonetic: '/ˈveri/', meaning: '非常' },
      { word: 'voice', phonetic: '/vɔɪs/', meaning: '声音' },
      { word: 'love', phonetic: '/lʌv/', meaning: '爱' },
      { word: 'five', phonetic: '/faɪv/', meaning: '五' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/ð/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·摩擦音',
    description: '舌尖轻抵上齿背，气流从舌齿间摩擦而出，浊辅音。',
    tips: [
      '舌尖轻抵上齿背面',
      '气流从舌齿间的窄缝摩擦而出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'this', phonetic: '/ðɪs/', meaning: '这个' },
      { word: 'that', phonetic: '/ðæt/', meaning: '那个' },
      { word: 'mother', phonetic: '/ˈmʌðə/', meaning: '母亲' },
      { word: 'the', phonetic: '/ðə/', meaning: '这个（定冠词）' },
    ],
    mouthShape: 'narrow',
  },
  {
    symbol: '/z/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·摩擦音',
    description: '舌尖接近上齿龈，气流从舌尖与齿龈间摩擦而出，浊辅音。',
    tips: [
      '舌尖接近上齿龈，形成窄缝',
      '气流从窄缝中摩擦而出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'zoo', phonetic: '/zuː/', meaning: '动物园' },
      { word: 'rose', phonetic: '/rəʊz/', meaning: '玫瑰' },
      { word: 'is', phonetic: '/ɪz/', meaning: '是' },
      { word: 'please', phonetic: '/pliːz/', meaning: '请' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/ʒ/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·摩擦音',
    description: '舌前部向硬腭抬起，双唇稍向前突出，气流摩擦而出，浊辅音。',
    tips: [
      '舌前部向硬腭抬起，接近硬腭',
      '双唇稍向前突出并略收圆',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'vision', phonetic: '/ˈvɪʒn/', meaning: '视力' },
      { word: 'measure', phonetic: '/ˈmeʒə/', meaning: '测量' },
      { word: 'decision', phonetic: '/dɪˈsɪʒn/', meaning: '决定' },
      { word: 'leisure', phonetic: '/ˈleʒə/', meaning: '休闲' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/dʒ/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·破擦音',
    description: '舌尖抵上齿龈后部，气流冲开阻碍后摩擦而出，浊辅音。',
    tips: [
      '舌尖抵上齿龈后部，先形成阻碍',
      '气流冲开阻碍后摩擦而出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'job', phonetic: '/dʒɒb/', meaning: '工作' },
      { word: 'orange', phonetic: '/ˈɒrɪndʒ/', meaning: '橙子' },
      { word: 'age', phonetic: '/eɪdʒ/', meaning: '年龄' },
      { word: 'bridge', phonetic: '/brɪdʒ/', meaning: '桥' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/dr/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·破擦音',
    description: '舌尖抵上齿龈后部，舌身呈发/r/的姿势，浊辅音。',
    tips: [
      '舌尖抵上齿龈后部，做好发/r/准备',
      '气流冲开阻碍后发出类似"桌"的音',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'drink', phonetic: '/drɪŋk/', meaning: '喝' },
      { word: 'drive', phonetic: '/draɪv/', meaning: '驾驶' },
      { word: 'children', phonetic: '/ˈtʃɪldrən/', meaning: '孩子们' },
      { word: 'dream', phonetic: '/driːm/', meaning: '梦想' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/dz/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·破擦音',
    description: '舌尖抵上齿龈，气流冲开后摩擦而出，浊辅音，常出现在名词复数。',
    tips: [
      '舌尖抵上齿龈，先形成阻碍',
      '气流冲开后摩擦而出，类似"字"音',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'beds', phonetic: '/bedz/', meaning: '床（复数）' },
      { word: 'friends', phonetic: '/frendz/', meaning: '朋友（复数）' },
      { word: 'hands', phonetic: '/hændz/', meaning: '手（复数）' },
      { word: 'words', phonetic: '/wɜːdz/', meaning: '单词（复数）' },
    ],
    mouthShape: 'flat',
  },
  // 鼻音 (浊辅音)
  {
    symbol: '/m/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·鼻音',
    description: '双唇紧闭，气流从鼻腔送出，浊辅音。',
    tips: [
      '双唇紧闭，口腔形成阻碍',
      '气流从鼻腔送出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'mother', phonetic: '/ˈmʌðə/', meaning: '母亲' },
      { word: 'name', phonetic: '/neɪm/', meaning: '名字' },
      { word: 'swim', phonetic: '/swɪm/', meaning: '游泳' },
      { word: 'time', phonetic: '/taɪm/', meaning: '时间' },
    ],
    mouthShape: 'closed',
  },
  {
    symbol: '/n/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·鼻音',
    description: '舌尖抵上齿龈，气流从鼻腔送出，浊辅音。',
    tips: [
      '舌尖抵上齿龈，口腔形成阻碍',
      '气流从鼻腔送出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'no', phonetic: '/nəʊ/', meaning: '不' },
      { word: 'sun', phonetic: '/sʌn/', meaning: '太阳' },
      { word: 'run', phonetic: '/rʌn/', meaning: '跑' },
      { word: 'nine', phonetic: '/naɪn/', meaning: '九' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/ŋ/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·鼻音',
    description: '舌后部抵软腭，气流从鼻腔送出，浊辅音。',
    tips: [
      '舌后部抵软腭，口腔后部形成阻碍',
      '气流从鼻腔送出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'sing', phonetic: '/sɪŋ/', meaning: '唱歌' },
      { word: 'long', phonetic: '/lɒŋ/', meaning: '长的' },
      { word: 'morning', phonetic: '/ˈmɔːnɪŋ/', meaning: '早晨' },
      { word: 'king', phonetic: '/kɪŋ/', meaning: '国王' },
    ],
    mouthShape: 'open',
  },
  // 舌侧音 (浊辅音)
  {
    symbol: '/l/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·舌侧音',
    description: '舌尖抵上齿龈，气流从舌两侧送出，浊辅音。有清晰的/l/和含糊的/l/两种。',
    tips: [
      '舌尖抵上齿龈',
      '气流从舌的两侧送出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'like', phonetic: '/laɪk/', meaning: '喜欢' },
      { word: 'hello', phonetic: '/həˈləʊ/', meaning: '你好' },
      { word: 'tell', phonetic: '/tel/', meaning: '告诉' },
      { word: 'school', phonetic: '/skuːl/', meaning: '学校' },
    ],
    mouthShape: 'flat',
  },
  {
    symbol: '/r/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·卷舌音',
    description: '舌尖向上卷起，接近上齿龈后部，气流从舌面与硬腭间摩擦而出，浊辅音。',
    tips: [
      '舌尖向上卷起，接近上齿龈后部',
      '气流从舌面与硬腭间摩擦而出',
      '声带振动，是浊辅音',
    ],
    examples: [
      { word: 'red', phonetic: '/red/', meaning: '红色的' },
      { word: 'right', phonetic: '/raɪt/', meaning: '正确的' },
      { word: 'car', phonetic: '/kɑː/', meaning: '汽车' },
      { word: 'tree', phonetic: '/triː/', meaning: '树' },
    ],
    mouthShape: 'round',
  },
  // 半元音 (浊辅音)
  {
    symbol: '/w/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·半元音',
    description: '双唇收圆突出，舌后部向软腭抬起，气流摩擦而出，迅速滑向后面的元音。',
    tips: [
      '双唇收圆并向前突出',
      '舌后部向软腭抬起',
      '声带振动，迅速滑向后面的元音',
    ],
    examples: [
      { word: 'we', phonetic: '/wiː/', meaning: '我们' },
      { word: 'water', phonetic: '/ˈwɔːtə/', meaning: '水' },
      { word: 'white', phonetic: '/waɪt/', meaning: '白色的' },
      { word: 'window', phonetic: '/ˈwɪndəʊ/', meaning: '窗户' },
    ],
    mouthShape: 'round',
  },
  {
    symbol: '/j/',
    type: 'consonant',
    subType: 'voiced',
    categoryLabel: '浊辅音·半元音',
    description: '舌前部向硬腭抬起，接近/iː/的舌位，气流摩擦而出，迅速滑向后面的元音。',
    tips: [
      '舌前部向硬腭抬起，接近/iː/的舌位',
      '气流从舌面与硬腭间摩擦而出',
      '声带振动，迅速滑向后面的元音',
    ],
    examples: [
      { word: 'yes', phonetic: '/jes/', meaning: '是的' },
      { word: 'year', phonetic: '/jɪə/', meaning: '年' },
      { word: 'music', phonetic: '/ˈmjuːzɪk/', meaning: '音乐' },
      { word: 'young', phonetic: '/jʌŋ/', meaning: '年轻的' },
    ],
    mouthShape: 'wide',
  },
];

// ===== Aggregated =====
export const allPhonetics: PhoneticItem[] = [...vowels, ...consonants];

export const monophthongs: PhoneticItem[] = vowels.filter(
  (p: PhoneticItem) => p.subType === 'monophthong',
);

export const diphthongs: PhoneticItem[] = vowels.filter(
  (p: PhoneticItem) => p.subType === 'diphthong',
);

export const voiceless: PhoneticItem[] = consonants.filter(
  (p: PhoneticItem) => p.subType === 'voiceless',
);

export const voicedConsonants: PhoneticItem[] = consonants.filter(
  (p: PhoneticItem) => p.subType === 'voiced',
);

export const totalPhonetics: number = allPhonetics.length;
