// ===== Types =====
export interface PhoneticExample {
  word: string;
  phonetic: string;
  meaning: string;
}

export interface PhoneticItem {
  symbol: string;
  description: string;
  examples: PhoneticExample[];
}

export interface PhoneticCategory {
  name: string;
  items: PhoneticItem[];
}

export interface PhoneticCourse {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  learners: number;
  accent: 'british' | 'american';
}

// ===== Course Data =====
export const courses: PhoneticCourse[] = [
  {
    id: 'british',
    title: '英式音标 (RP)',
    subtitle: 'Received Pronunciation 标准发音',
    gradient: 'from-blue-500 to-indigo-600',
    learners: 12580,
    accent: 'british',
  },
  {
    id: 'american',
    title: '美式音标 (GA)',
    subtitle: 'General American 通用美音',
    gradient: 'from-orange-400 to-orange-600',
    learners: 18920,
    accent: 'american',
  },
];

// ===== Phonetic Categories =====
export const phoneticCategories: PhoneticCategory[] = [
  {
    name: '前元音',
    items: [
      {
        symbol: '/æ/',
        description: '嘴巴张大，舌身放平，舌尖抵下齿，双唇向两侧伸展，发短促的"啊"音。',
        examples: [
          { word: 'cat', phonetic: '/kæt/', meaning: '猫' },
          { word: 'bad', phonetic: '/bæd/', meaning: '坏的' },
          { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的' },
        ],
      },
      {
        symbol: '/e/',
        description: '嘴巴半开，舌尖抵下齿，舌前部稍抬起，发短促的"诶"音。',
        examples: [
          { word: 'bed', phonetic: '/bed/', meaning: '床' },
          { word: 'red', phonetic: '/red/', meaning: '红色的' },
          { word: 'pen', phonetic: '/pen/', meaning: '钢笔' },
        ],
      },
      {
        symbol: '/iː/',
        description: '嘴角向两侧伸展，舌前部抬向硬腭，发长音"衣"。',
        examples: [
          { word: 'see', phonetic: '/siː/', meaning: '看见' },
          { word: 'tree', phonetic: '/triː/', meaning: '树' },
          { word: 'tea', phonetic: '/tiː/', meaning: '茶' },
        ],
      },
      {
        symbol: '/ɪ/',
        description: '舌前部稍抬，比/iː/低且靠后，双唇微开，发短促的"衣"音。',
        examples: [
          { word: 'sit', phonetic: '/sɪt/', meaning: '坐' },
          { word: 'big', phonetic: '/bɪɡ/', meaning: '大的' },
          { word: 'ship', phonetic: '/ʃɪp/', meaning: '船' },
        ],
      },
    ],
  },
  {
    name: '中元音',
    items: [
      {
        symbol: '/ɜː/',
        description: '舌身放平，舌中部稍抬，双唇扁平，发长音"尔"。',
        examples: [
          { word: 'bird', phonetic: '/bɜːd/', meaning: '鸟' },
          { word: 'her', phonetic: '/hɜː/', meaning: '她的' },
          { word: 'turn', phonetic: '/tɜːn/', meaning: '转动' },
        ],
      },
      {
        symbol: '/ə/',
        description: '舌身放平，嘴自然张开，发极轻的"呃"音，是英语中最常见的弱读音。',
        examples: [
          { word: 'about', phonetic: '/əˈbaʊt/', meaning: '关于' },
          { word: 'sister', phonetic: '/ˈsɪstə/', meaning: '姐妹' },
          { word: 'doctor', phonetic: '/ˈdɒktə/', meaning: '医生' },
        ],
      },
      {
        symbol: '/ʌ/',
        description: '舌身稍向后缩，舌中部稍抬，嘴半开，发短促的"啊"音。',
        examples: [
          { word: 'cup', phonetic: '/kʌp/', meaning: '杯子' },
          { word: 'bus', phonetic: '/bʌs/', meaning: '公交车' },
          { word: 'love', phonetic: '/lʌv/', meaning: '爱' },
        ],
      },
    ],
  },
  {
    name: '后元音',
    items: [
      {
        symbol: '/ɑː/',
        description: '口张大，舌身后缩，舌后部稍抬，发长音"啊"。',
        examples: [
          { word: 'car', phonetic: '/kɑː/', meaning: '汽车' },
          { word: 'far', phonetic: '/fɑː/', meaning: '远的' },
          { word: 'park', phonetic: '/pɑːk/', meaning: '公园' },
        ],
      },
      {
        symbol: '/ɔː/',
        description: '双唇收圆并向前突出，舌后部抬起，发长音"奥"。',
        examples: [
          { word: 'door', phonetic: '/dɔː/', meaning: '门' },
          { word: 'four', phonetic: '/fɔː/', meaning: '四' },
          { word: 'talk', phonetic: '/tɔːk/', meaning: '说话' },
        ],
      },
      {
        symbol: '/uː/',
        description: '双唇收圆突出，舌后部向软腭抬起，发长音"乌"。',
        examples: [
          { word: 'food', phonetic: '/fuːd/', meaning: '食物' },
          { word: 'blue', phonetic: '/bluː/', meaning: '蓝色的' },
          { word: 'school', phonetic: '/skuːl/', meaning: '学校' },
        ],
      },
      {
        symbol: '/ʊ/',
        description: '舌后部抬起，比/uː/低且放松，双唇收圆，发短促的"乌"音。',
        examples: [
          { word: 'book', phonetic: '/bʊk/', meaning: '书' },
          { word: 'good', phonetic: '/ɡʊd/', meaning: '好的' },
          { word: 'put', phonetic: '/pʊt/', meaning: '放' },
        ],
      },
      {
        symbol: '/ɒ/',
        description: '口张大，舌身后缩，双唇收圆，发短促的"哦"音。',
        examples: [
          { word: 'hot', phonetic: '/hɒt/', meaning: '热的' },
          { word: 'dog', phonetic: '/dɒɡ/', meaning: '狗' },
          { word: 'box', phonetic: '/bɒks/', meaning: '盒子' },
        ],
      },
    ],
  },
  {
    name: '双元音',
    items: [
      {
        symbol: '/eɪ/',
        description: '由/e/滑向/ɪ/，嘴角向两侧展开，发"诶衣"音。',
        examples: [
          { word: 'day', phonetic: '/deɪ/', meaning: '白天' },
          { word: 'name', phonetic: '/neɪm/', meaning: '名字' },
          { word: 'cake', phonetic: '/keɪk/', meaning: '蛋糕' },
        ],
      },
      {
        symbol: '/aɪ/',
        description: '由/a/滑向/ɪ/，口型由大到小，发"爱"音。',
        examples: [
          { word: 'my', phonetic: '/maɪ/', meaning: '我的' },
          { word: 'time', phonetic: '/taɪm/', meaning: '时间' },
          { word: 'like', phonetic: '/laɪk/', meaning: '喜欢' },
        ],
      },
      {
        symbol: '/ɔɪ/',
        description: '由/ɔ/滑向/ɪ/，双唇由圆到扁，发"奥衣"音。',
        examples: [
          { word: 'boy', phonetic: '/bɔɪ/', meaning: '男孩' },
          { word: 'voice', phonetic: '/vɔɪs/', meaning: '声音' },
          { word: 'toy', phonetic: '/tɔɪ/', meaning: '玩具' },
        ],
      },
      {
        symbol: '/aʊ/',
        description: '由/a/滑向/ʊ/，口型由大到圆，发"奥屋"音。',
        examples: [
          { word: 'now', phonetic: '/naʊ/', meaning: '现在' },
          { word: 'house', phonetic: '/haʊs/', meaning: '房子' },
          { word: 'cow', phonetic: '/kaʊ/', meaning: '奶牛' },
        ],
      },
      {
        symbol: '/əʊ/',
        description: '由/ə/滑向/ʊ/，双唇由扁到圆，发"欧"音。',
        examples: [
          { word: 'go', phonetic: '/ɡəʊ/', meaning: '去' },
          { word: 'home', phonetic: '/həʊm/', meaning: '家' },
          { word: 'nose', phonetic: '/nəʊz/', meaning: '鼻子' },
        ],
      },
      {
        symbol: '/ɪə/',
        description: '由/ɪ/滑向/ə/，舌前部下降，发"衣尔"音。',
        examples: [
          { word: 'ear', phonetic: '/ɪə/', meaning: '耳朵' },
          { word: 'here', phonetic: '/hɪə/', meaning: '这里' },
          { word: 'dear', phonetic: '/dɪə/', meaning: '亲爱的' },
        ],
      },
      {
        symbol: '/eə/',
        description: '由/e/滑向/ə/，嘴由半开到张开，发"爱尔"音。',
        examples: [
          { word: 'air', phonetic: '/eə/', meaning: '空气' },
          { word: 'care', phonetic: '/keə/', meaning: '关心' },
          { word: 'hair', phonetic: '/heə/', meaning: '头发' },
        ],
      },
      {
        symbol: '/ʊə/',
        description: '由/ʊ/滑向/ə/，双唇由圆到扁，发"乌尔"音。',
        examples: [
          { word: 'tour', phonetic: '/tʊə/', meaning: '旅行' },
          { word: 'pure', phonetic: '/pjʊə/', meaning: '纯净的' },
          { word: 'cure', phonetic: '/kjʊə/', meaning: '治愈' },
        ],
      },
    ],
  },
  {
    name: '辅音（爆破音）',
    items: [
      {
        symbol: '/p/',
        description: '双唇紧闭，气流冲开双唇发出爆破音，清辅音，声带不振动。',
        examples: [
          { word: 'pen', phonetic: '/pen/', meaning: '钢笔' },
          { word: 'apple', phonetic: '/ˈæpl/', meaning: '苹果' },
          { word: 'cup', phonetic: '/kʌp/', meaning: '杯子' },
        ],
      },
      {
        symbol: '/b/',
        description: '双唇紧闭，气流冲开双唇发出爆破音，浊辅音，声带振动。',
        examples: [
          { word: 'book', phonetic: '/bʊk/', meaning: '书' },
          { word: 'baby', phonetic: '/ˈbeɪbi/', meaning: '婴儿' },
          { word: 'cab', phonetic: '/kæb/', meaning: '出租车' },
        ],
      },
      {
        symbol: '/t/',
        description: '舌尖抵上齿龈，气流冲开阻碍发出爆破音，清辅音。',
        examples: [
          { word: 'tea', phonetic: '/tiː/', meaning: '茶' },
          { word: 'water', phonetic: '/ˈwɔːtə/', meaning: '水' },
          { word: 'cat', phonetic: '/kæt/', meaning: '猫' },
        ],
      },
      {
        symbol: '/d/',
        description: '舌尖抵上齿龈，气流冲开阻碍发出爆破音，浊辅音。',
        examples: [
          { word: 'dog', phonetic: '/dɒɡ/', meaning: '狗' },
          { word: 'day', phonetic: '/deɪ/', meaning: '天' },
          { word: 'bed', phonetic: '/bed/', meaning: '床' },
        ],
      },
      {
        symbol: '/k/',
        description: '舌后部抵软腭，气流冲开阻碍发出爆破音，清辅音。',
        examples: [
          { word: 'car', phonetic: '/kɑː/', meaning: '汽车' },
          { word: 'back', phonetic: '/bæk/', meaning: '后面' },
          { word: 'clock', phonetic: '/klɒk/', meaning: '时钟' },
        ],
      },
      {
        symbol: '/ɡ/',
        description: '舌后部抵软腭，气流冲开阻碍发出爆破音，浊辅音。',
        examples: [
          { word: 'go', phonetic: '/ɡəʊ/', meaning: '去' },
          { word: 'big', phonetic: '/bɪɡ/', meaning: '大的' },
          { word: 'egg', phonetic: '/eɡ/', meaning: '鸡蛋' },
        ],
      },
    ],
  },
  {
    name: '辅音（摩擦音）',
    items: [
      {
        symbol: '/f/',
        description: '上齿轻触下唇，气流从唇齿间摩擦而出，清辅音。',
        examples: [
          { word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼' },
          { word: 'coffee', phonetic: '/ˈkɒfi/', meaning: '咖啡' },
          { word: 'life', phonetic: '/laɪf/', meaning: '生活' },
        ],
      },
      {
        symbol: '/v/',
        description: '上齿轻触下唇，气流从唇齿间摩擦而出，浊辅音。',
        examples: [
          { word: 'very', phonetic: '/ˈveri/', meaning: '非常' },
          { word: 'voice', phonetic: '/vɔɪs/', meaning: '声音' },
          { word: 'love', phonetic: '/lʌv/', meaning: '爱' },
        ],
      },
      {
        symbol: '/θ/',
        description: '舌尖轻抵上齿背，气流从舌齿间摩擦而出，清辅音。',
        examples: [
          { word: 'think', phonetic: '/θɪŋk/', meaning: '思考' },
          { word: 'three', phonetic: '/θriː/', meaning: '三' },
          { word: 'math', phonetic: '/mæθ/', meaning: '数学' },
        ],
      },
      {
        symbol: '/ð/',
        description: '舌尖轻抵上齿背，气流从舌齿间摩擦而出，浊辅音。',
        examples: [
          { word: 'this', phonetic: '/ðɪs/', meaning: '这个' },
          { word: 'that', phonetic: '/ðæt/', meaning: '那个' },
          { word: 'mother', phonetic: '/ˈmʌðə/', meaning: '母亲' },
        ],
      },
      {
        symbol: '/s/',
        description: '舌尖接近上齿龈，气流从舌尖与齿龈间摩擦而出，清辅音。',
        examples: [
          { word: 'sun', phonetic: '/sʌn/', meaning: '太阳' },
          { word: 'house', phonetic: '/haʊs/', meaning: '房子' },
          { word: 'miss', phonetic: '/mɪs/', meaning: '想念' },
        ],
      },
      {
        symbol: '/z/',
        description: '舌尖接近上齿龈，气流从舌尖与齿龈间摩擦而出，浊辅音。',
        examples: [
          { word: 'zoo', phonetic: '/zuː/', meaning: '动物园' },
          { word: 'rose', phonetic: '/rəʊz/', meaning: '玫瑰' },
          { word: 'is', phonetic: '/ɪz/', meaning: '是' },
        ],
      },
      {
        symbol: '/ʃ/',
        description: '舌前部向硬腭抬起，双唇稍向前突出，气流摩擦而出，清辅音。',
        examples: [
          { word: 'she', phonetic: '/ʃiː/', meaning: '她' },
          { word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼' },
          { word: 'station', phonetic: '/ˈsteɪʃn/', meaning: '车站' },
        ],
      },
      {
        symbol: '/ʒ/',
        description: '舌前部向硬腭抬起，双唇稍向前突出，气流摩擦而出，浊辅音。',
        examples: [
          { word: 'vision', phonetic: '/ˈvɪʒn/', meaning: '视力' },
          { word: 'measure', phonetic: '/ˈmeʒə/', meaning: '测量' },
          { word: 'decision', phonetic: '/dɪˈsɪʒn/', meaning: '决定' },
        ],
      },
      {
        symbol: '/h/',
        description: '气流从声门摩擦而出，口型随后面的元音变化，清辅音。',
        examples: [
          { word: 'hello', phonetic: '/həˈləʊ/', meaning: '你好' },
          { word: 'hat', phonetic: '/hæt/', meaning: '帽子' },
          { word: 'who', phonetic: '/huː/', meaning: '谁' },
        ],
      },
    ],
  },
  {
    name: '辅音（破擦音）',
    items: [
      {
        symbol: '/tʃ/',
        description: '舌尖抵上齿龈后部，气流冲开阻碍后摩擦而出，清辅音。',
        examples: [
          { word: 'chair', phonetic: '/tʃeə/', meaning: '椅子' },
          { word: 'teacher', phonetic: '/ˈtiːtʃə/', meaning: '老师' },
          { word: 'watch', phonetic: '/wɒtʃ/', meaning: '手表' },
        ],
      },
      {
        symbol: '/dʒ/',
        description: '舌尖抵上齿龈后部，气流冲开阻碍后摩擦而出，浊辅音。',
        examples: [
          { word: 'job', phonetic: '/dʒɒb/', meaning: '工作' },
          { word: 'orange', phonetic: '/ˈɒrɪndʒ/', meaning: '橙子' },
          { word: 'age', phonetic: '/eɪdʒ/', meaning: '年龄' },
        ],
      },
      {
        symbol: '/tr/',
        description: '舌尖抵上齿龈后部，舌身呈发/r/的姿势，清辅音。',
        examples: [
          { word: 'tree', phonetic: '/triː/', meaning: '树' },
          { word: 'try', phonetic: '/traɪ/', meaning: '尝试' },
          { word: 'country', phonetic: '/ˈkʌntri/', meaning: '国家' },
        ],
      },
      {
        symbol: '/dr/',
        description: '舌尖抵上齿龈后部，舌身呈发/r/的姿势，浊辅音。',
        examples: [
          { word: 'drink', phonetic: '/drɪŋk/', meaning: '喝' },
          { word: 'drive', phonetic: '/draɪv/', meaning: '驾驶' },
          { word: 'children', phonetic: '/ˈtʃɪldrən/', meaning: '孩子们' },
        ],
      },
      {
        symbol: '/ts/',
        description: '舌尖抵上齿龈，气流冲开后摩擦而出，清辅音，常出现在名词复数。',
        examples: [
          { word: 'cats', phonetic: '/kæts/', meaning: '猫（复数）' },
          { word: 'hats', phonetic: '/hæts/', meaning: '帽子（复数）' },
          { word: 'students', phonetic: '/ˈstjuːdnts/', meaning: '学生（复数）' },
        ],
      },
      {
        symbol: '/dz/',
        description: '舌尖抵上齿龈，气流冲开后摩擦而出，浊辅音，常出现在名词复数。',
        examples: [
          { word: 'beds', phonetic: '/bedz/', meaning: '床（复数）' },
          { word: 'friends', phonetic: '/frendz/', meaning: '朋友（复数）' },
          { word: 'hands', phonetic: '/hændz/', meaning: '手（复数）' },
        ],
      },
    ],
  },
  {
    name: '辅音（鼻音）',
    items: [
      {
        symbol: '/m/',
        description: '双唇紧闭，气流从鼻腔送出，浊辅音。',
        examples: [
          { word: 'mother', phonetic: '/ˈmʌðə/', meaning: '母亲' },
          { word: 'name', phonetic: '/neɪm/', meaning: '名字' },
          { word: 'swim', phonetic: '/swɪm/', meaning: '游泳' },
        ],
      },
      {
        symbol: '/n/',
        description: '舌尖抵上齿龈，气流从鼻腔送出，浊辅音。',
        examples: [
          { word: 'no', phonetic: '/nəʊ/', meaning: '不' },
          { word: 'sun', phonetic: '/sʌn/', meaning: '太阳' },
          { word: 'run', phonetic: '/rʌn/', meaning: '跑' },
        ],
      },
      {
        symbol: '/ŋ/',
        description: '舌后部抵软腭，气流从鼻腔送出，浊辅音。',
        examples: [
          { word: 'sing', phonetic: '/sɪŋ/', meaning: '唱歌' },
          { word: 'long', phonetic: '/lɒŋ/', meaning: '长的' },
          { word: 'morning', phonetic: '/ˈmɔːnɪŋ/', meaning: '早晨' },
        ],
      },
    ],
  },
  {
    name: '辅音（舌侧音）',
    items: [
      {
        symbol: '/l/',
        description: '舌尖抵上齿龈，气流从舌两侧送出，浊辅音。有清晰的/l/和含糊的/l/两种。',
        examples: [
          { word: 'like', phonetic: '/laɪk/', meaning: '喜欢' },
          { word: 'hello', phonetic: '/həˈləʊ/', meaning: '你好' },
          { word: 'tell', phonetic: '/tel/', meaning: '告诉' },
        ],
      },
      {
        symbol: '/r/',
        description: '舌尖向上卷起，接近上齿龈后部，气流从舌面与硬腭间摩擦而出，浊辅音。',
        examples: [
          { word: 'red', phonetic: '/red/', meaning: '红色的' },
          { word: 'right', phonetic: '/raɪt/', meaning: '正确的' },
          { word: 'car', phonetic: '/kɑː/', meaning: '汽车' },
        ],
      },
    ],
  },
  {
    name: '辅音（半元音）',
    items: [
      {
        symbol: '/w/',
        description: '双唇收圆突出，舌后部向软腭抬起，气流摩擦而出，迅速滑向后面的元音。',
        examples: [
          { word: 'we', phonetic: '/wiː/', meaning: '我们' },
          { word: 'water', phonetic: '/ˈwɔːtə/', meaning: '水' },
          { word: 'white', phonetic: '/waɪt/', meaning: '白色的' },
        ],
      },
      {
        symbol: '/j/',
        description: '舌前部向硬腭抬起，接近/iː/的舌位，气流摩擦而出，迅速滑向后面的元音。',
        examples: [
          { word: 'yes', phonetic: '/jes/', meaning: '是的' },
          { word: 'year', phonetic: '/jɪə/', meaning: '年' },
          { word: 'music', phonetic: '/ˈmjuːzɪk/', meaning: '音乐' },
        ],
      },
    ],
  },
];

// ===== Computed =====
export const totalPhonetics: number = phoneticCategories.reduce(
  (sum: number, cat: PhoneticCategory) => sum + cat.items.length,
  0,
);
