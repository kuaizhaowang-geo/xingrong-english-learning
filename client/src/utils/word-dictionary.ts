export interface DictWordEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  examples: Array<{ en: string; zh: string }>;
  relatedWords: Array<{ word: string; meaning: string }>;
  phoneticUK?: string;
  phoneticUS?: string;
  definitions?: Array<{
    partOfSpeech: string;
    meaning: string;
    examples?: Array<{ en: string; zh: string }>;
  }>;
  collocations?: Array<{ phrase: string; meaning: string }>;
  synonyms?: string[];
  antonyms?: string[];
  related?: Array<{ word: string; meaning: string }>;
}

const DICT: Record<string, DictWordEntry> = {
  apple: {
    word: 'apple',
    phonetic: '/ˈæp.əl/',
    partOfSpeech: 'noun',
    meaning: '苹果',
    examples: [
      { en: 'I eat an apple every day.', zh: '我每天吃一个苹果。' },
      { en: 'The apple is red and sweet.', zh: '这个苹果又红又甜。' },
    ],
    relatedWords: [
      { word: 'banana', meaning: '香蕉' },
      { word: 'orange', meaning: '橙子' },
    ],
    phoneticUK: '/ˈæp.əl/',
    phoneticUS: '/ˈæp.əl/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '苹果；苹果树',
        examples: [
          { en: 'I eat an apple every day.', zh: '我每天吃一个苹果。' },
          { en: 'The apple tree is full of fruit.', zh: '苹果树上结满了果实。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'apple pie', meaning: '苹果派' },
      { phrase: 'apple juice', meaning: '苹果汁' },
      { phrase: 'green apple', meaning: '青苹果' },
      { phrase: 'apple of one\'s eye', meaning: '掌上明珠' },
    ],
    synonyms: ['fruit'],
    antonyms: [],
    related: [
      { word: 'banana', meaning: '香蕉' },
      { word: 'orange', meaning: '橙子' },
      { word: 'grape', meaning: '葡萄' },
      { word: 'pear', meaning: '梨' },
    ],
  },
  book: {
    word: 'book',
    phonetic: '/bʊk/',
    partOfSpeech: 'noun',
    meaning: '书；书本',
    examples: [
      { en: 'I have a new book.', zh: '我有一本新书。' },
      { en: 'She is reading a book.', zh: '她正在看书。' },
    ],
    relatedWords: [
      { word: 'read', meaning: '阅读' },
      { word: 'library', meaning: '图书馆' },
    ],
    phoneticUK: '/bʊk/',
    phoneticUS: '/bʊk/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '书；书籍；本子',
        examples: [
          { en: 'I have a new book.', zh: '我有一本新书。' },
          { en: 'This book is very interesting.', zh: '这本书非常有趣。' },
        ],
      },
      {
        partOfSpeech: 'verb',
        meaning: '预订；预约',
        examples: [
          { en: 'I\'d like to book a table for two.', zh: '我想预订一张两人桌。' },
          { en: 'She booked a flight to Paris.', zh: '她预订了去巴黎的航班。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'book a room', meaning: '预订房间' },
      { phrase: 'read a book', meaning: '读书' },
      { phrase: 'text book', meaning: '教科书' },
      { phrase: 'book store', meaning: '书店' },
    ],
    synonyms: ['reserve', 'novel', 'volume'],
    antonyms: ['cancel'],
    related: [
      { word: 'read', meaning: '阅读' },
      { word: 'library', meaning: '图书馆' },
      { word: 'novel', meaning: '小说' },
      { word: 'page', meaning: '页' },
    ],
  },
  cat: {
    word: 'cat',
    phonetic: '/kæt/',
    partOfSpeech: 'noun',
    meaning: '猫',
    examples: [
      { en: 'The cat is sleeping.', zh: '猫在睡觉。' },
      { en: 'I have a cute cat.', zh: '我有一只可爱的猫。' },
    ],
    relatedWords: [
      { word: 'dog', meaning: '狗' },
      { word: 'kitten', meaning: '小猫' },
    ],
    phoneticUK: '/kæt/',
    phoneticUS: '/kæt/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '猫；猫科动物',
        examples: [
          { en: 'The cat is sleeping on the sofa.', zh: '猫在沙发上睡觉。' },
          { en: 'Cats like to catch mice.', zh: '猫喜欢抓老鼠。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'cat food', meaning: '猫粮' },
      { phrase: 'pet cat', meaning: '宠物猫' },
      { phrase: 'black cat', meaning: '黑猫' },
      { phrase: 'rain cats and dogs', meaning: '倾盆大雨' },
    ],
    synonyms: ['feline', 'kitten'],
    antonyms: ['dog'],
    related: [
      { word: 'dog', meaning: '狗' },
      { word: 'kitten', meaning: '小猫' },
      { word: 'pet', meaning: '宠物' },
      { word: 'animal', meaning: '动物' },
    ],
  },
  dog: {
    word: 'dog',
    phonetic: '/dɒɡ/',
    partOfSpeech: 'noun',
    meaning: '狗',
    examples: [
      { en: 'My dog is very friendly.', zh: '我的狗很友好。' },
      { en: 'The dog is running fast.', zh: '狗跑得很快。' },
    ],
    relatedWords: [
      { word: 'cat', meaning: '猫' },
      { word: 'puppy', meaning: '小狗' },
    ],
    phoneticUK: '/dɒɡ/',
    phoneticUS: '/dɔːɡ/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '狗；犬',
        examples: [
          { en: 'My dog is very friendly.', zh: '我的狗很友好。' },
          { en: 'Dogs are man\'s best friend.', zh: '狗是人类最好的朋友。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'dog food', meaning: '狗粮' },
      { phrase: 'pet dog', meaning: '宠物狗' },
      { phrase: 'walk the dog', meaning: '遛狗' },
      { phrase: 'hot dog', meaning: '热狗' },
    ],
    synonyms: ['canine', 'puppy', 'hound'],
    antonyms: ['cat'],
    related: [
      { word: 'cat', meaning: '猫' },
      { word: 'puppy', meaning: '小狗' },
      { word: 'pet', meaning: '宠物' },
      { word: 'bark', meaning: '吠叫' },
    ],
  },
  egg: {
    word: 'egg',
    phonetic: '/eɡ/',
    partOfSpeech: 'noun',
    meaning: '鸡蛋；蛋',
    examples: [
      { en: 'I had an egg for breakfast.', zh: '我早餐吃了一个鸡蛋。' },
      { en: 'The bird lays an egg.', zh: '这只鸟下了一个蛋。' },
    ],
    relatedWords: [
      { word: 'chicken', meaning: '鸡' },
      { word: 'breakfast', meaning: '早餐' },
    ],
  },
  fish: {
    word: 'fish',
    phonetic: '/fɪʃ/',
    partOfSpeech: 'noun',
    meaning: '鱼',
    examples: [
      { en: 'There are many fish in the river.', zh: '河里有很多鱼。' },
      { en: 'I like to eat fish.', zh: '我喜欢吃鱼。' },
    ],
    relatedWords: [
      { word: 'water', meaning: '水' },
      { word: 'swim', meaning: '游泳' },
    ],
  },
  good: {
    word: 'good',
    phonetic: '/ɡʊd/',
    partOfSpeech: 'adjective',
    meaning: '好的；优良的',
    examples: [
      { en: 'You are a good student.', zh: '你是一个好学生。' },
      { en: 'Have a good day!', zh: '祝你有美好的一天！' },
    ],
    relatedWords: [
      { word: 'great', meaning: '很棒的' },
      { word: 'bad', meaning: '坏的' },
    ],
    phoneticUK: '/ɡʊd/',
    phoneticUS: '/ɡʊd/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '好的；优良的；令人愉快的',
        examples: [
          { en: 'You are a good student.', zh: '你是一个好学生。' },
          { en: 'The food is really good.', zh: '这食物真的很好吃。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '好处；善行；利益',
        examples: [
          { en: 'Exercise does you good.', zh: '锻炼对你有好处。' },
          { en: 'He did a lot of good in the community.', zh: '他在社区做了很多善事。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'good morning', meaning: '早上好' },
      { phrase: 'good at', meaning: '擅长' },
      { phrase: 'good luck', meaning: '好运' },
      { phrase: 'do good', meaning: '做好事' },
    ],
    synonyms: ['great', 'excellent', 'nice', 'fine'],
    antonyms: ['bad', 'poor', 'terrible'],
    related: [
      { word: 'great', meaning: '很棒的' },
      { word: 'bad', meaning: '坏的' },
      { word: 'better', meaning: '更好的' },
      { word: 'best', meaning: '最好的' },
    ],
  },
  happy: {
    word: 'happy',
    phonetic: '/ˈhæp.i/',
    partOfSpeech: 'adjective',
    meaning: '快乐的；高兴的',
    examples: [
      { en: 'I am very happy today.', zh: '我今天非常开心。' },
      { en: 'Happy birthday to you!', zh: '祝你生日快乐！' },
    ],
    relatedWords: [
      { word: 'sad', meaning: '伤心的' },
      { word: 'glad', meaning: '高兴的' },
    ],
    phoneticUK: '/ˈhæp.i/',
    phoneticUS: '/ˈhæp.i/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '快乐的；高兴的；幸福的',
        examples: [
          { en: 'I am very happy today.', zh: '我今天非常开心。' },
          { en: 'She looks so happy with her new job.', zh: '她对新工作看起来很满意。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'happy birthday', meaning: '生日快乐' },
      { phrase: 'happy ending', meaning: '圆满结局' },
      { phrase: 'be happy with', meaning: '对…感到满意' },
      { phrase: 'happy hour', meaning: '欢乐时光' },
    ],
    synonyms: ['glad', 'joyful', 'cheerful', 'delighted'],
    antonyms: ['sad', 'unhappy', 'miserable'],
    related: [
      { word: 'sad', meaning: '伤心的' },
      { word: 'glad', meaning: '高兴的' },
      { word: 'happiness', meaning: '幸福' },
      { word: 'smile', meaning: '微笑' },
    ],
  },
  home: {
    word: 'home',
    phonetic: '/həʊm/',
    partOfSpeech: 'noun',
    meaning: '家；家庭',
    examples: [
      { en: 'I go home at five o\'clock.', zh: '我五点钟回家。' },
      { en: 'Home is where the heart is.', zh: '心在哪里，家就在哪里。' },
    ],
    relatedWords: [
      { word: 'house', meaning: '房子' },
      { word: 'family', meaning: '家庭' },
    ],
    phoneticUK: '/həʊm/',
    phoneticUS: '/hoʊm/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '家；家庭；家乡',
        examples: [
          { en: 'I go home at five o\'clock.', zh: '我五点钟回家。' },
          { en: 'There is no place like home.', zh: '没有地方比得上家。' },
        ],
      },
      {
        partOfSpeech: 'adjective',
        meaning: '家庭的；家用的；主场的',
        examples: [
          { en: 'The home team won the game.', zh: '主队赢得了比赛。' },
        ],
      },
      {
        partOfSpeech: 'adverb',
        meaning: '在家；回家',
        examples: [
          { en: 'Let\'s go home.', zh: '我们回家吧。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'go home', meaning: '回家' },
      { phrase: 'at home', meaning: '在家' },
      { phrase: 'home town', meaning: '家乡' },
      { phrase: 'home work', meaning: '家庭作业' },
    ],
    synonyms: ['house', 'residence', 'dwelling'],
    antonyms: ['away', 'abroad'],
    related: [
      { word: 'house', meaning: '房子' },
      { word: 'family', meaning: '家庭' },
      { word: 'room', meaning: '房间' },
      { word: 'building', meaning: '建筑' },
    ],
  },
  ice: {
    word: 'ice',
    phonetic: '/aɪs/',
    partOfSpeech: 'noun',
    meaning: '冰；冰块',
    examples: [
      { en: 'The ice is very cold.', zh: '冰非常冷。' },
      { en: 'I like ice cream.', zh: '我喜欢冰淇淋。' },
    ],
    relatedWords: [
      { word: 'cold', meaning: '冷的' },
      { word: 'water', meaning: '水' },
    ],
  },
  jump: {
    word: 'jump',
    phonetic: '/dʒʌmp/',
    partOfSpeech: 'verb',
    meaning: '跳；跳跃',
    examples: [
      { en: 'The rabbit can jump high.', zh: '兔子能跳得很高。' },
      { en: 'Don\'t jump on the bed.', zh: '不要在床上跳。' },
    ],
    relatedWords: [
      { word: 'run', meaning: '跑' },
      { word: 'leap', meaning: '跳跃' },
    ],
  },
  king: {
    word: 'king',
    phonetic: '/kɪŋ/',
    partOfSpeech: 'noun',
    meaning: '国王',
    examples: [
      { en: 'The king lives in a castle.', zh: '国王住在城堡里。' },
      { en: 'Long live the king!', zh: '国王万岁！' },
    ],
    relatedWords: [
      { word: 'queen', meaning: '女王' },
      { word: 'prince', meaning: '王子' },
    ],
  },
  love: {
    word: 'love',
    phonetic: '/lʌv/',
    partOfSpeech: 'verb',
    meaning: '爱；热爱',
    examples: [
      { en: 'I love my family.', zh: '我爱我的家人。' },
      { en: 'She loves music.', zh: '她热爱音乐。' },
    ],
    relatedWords: [
      { word: 'like', meaning: '喜欢' },
      { word: 'hate', meaning: '讨厌' },
    ],
    phoneticUK: '/lʌv/',
    phoneticUS: '/lʌv/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '爱；热爱；喜欢',
        examples: [
          { en: 'I love my family.', zh: '我爱我的家人。' },
          { en: 'I love reading books.', zh: '我热爱读书。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '爱；爱情；热爱',
        examples: [
          { en: 'Love conquers all.', zh: '爱能战胜一切。' },
          { en: 'She is in love with him.', zh: '她爱上了他。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'fall in love', meaning: '坠入爱河' },
      { phrase: 'true love', meaning: '真爱' },
      { phrase: 'love story', meaning: '爱情故事' },
      { phrase: 'love life', meaning: '爱情生活' },
    ],
    synonyms: ['like', 'adore', 'cherish', 'affection'],
    antonyms: ['hate', 'dislike', 'detest'],
    related: [
      { word: 'like', meaning: '喜欢' },
      { word: 'hate', meaning: '讨厌' },
      { word: 'heart', meaning: '心' },
      { word: 'romance', meaning: '浪漫' },
    ],
  },
  mother: {
    word: 'mother',
    phonetic: '/ˈmʌð.ər/',
    partOfSpeech: 'noun',
    meaning: '母亲；妈妈',
    examples: [
      { en: 'My mother is a teacher.', zh: '我妈妈是一名老师。' },
      { en: 'I love my mother.', zh: '我爱我的妈妈。' },
    ],
    relatedWords: [
      { word: 'father', meaning: '父亲' },
      { word: 'family', meaning: '家庭' },
    ],
  },
  name: {
    word: 'name',
    phonetic: '/neɪm/',
    partOfSpeech: 'noun',
    meaning: '名字；名称',
    examples: [
      { en: 'What is your name?', zh: '你叫什么名字？' },
      { en: 'My name is Tom.', zh: '我叫汤姆。' },
    ],
    relatedWords: [
      { word: 'call', meaning: '称呼' },
      { word: 'title', meaning: '标题' },
    ],
  },
  open: {
    word: 'open',
    phonetic: '/ˈəʊ.pən/',
    partOfSpeech: 'verb',
    meaning: '打开；开启',
    examples: [
      { en: 'Please open the door.', zh: '请打开门。' },
      { en: 'The shop opens at 9 a.m.', zh: '商店上午九点开门。' },
    ],
    relatedWords: [
      { word: 'close', meaning: '关闭' },
      { word: 'start', meaning: '开始' },
    ],
  },
  pen: {
    word: 'pen',
    phonetic: '/pen/',
    partOfSpeech: 'noun',
    meaning: '钢笔',
    examples: [
      { en: 'I have a blue pen.', zh: '我有一支蓝色的钢笔。' },
      { en: 'Can I use your pen?', zh: '我能用一下你的钢笔吗？' },
    ],
    relatedWords: [
      { word: 'pencil', meaning: '铅笔' },
      { word: 'write', meaning: '写' },
    ],
  },
  queen: {
    word: 'queen',
    phonetic: '/kwiːn/',
    partOfSpeech: 'noun',
    meaning: '女王；王后',
    examples: [
      { en: 'The queen is very kind.', zh: '女王非常善良。' },
      { en: 'The king and queen are happy.', zh: '国王和王后很幸福。' },
    ],
    relatedWords: [
      { word: 'king', meaning: '国王' },
      { word: 'princess', meaning: '公主' },
    ],
  },
  run: {
    word: 'run',
    phonetic: '/rʌn/',
    partOfSpeech: 'verb',
    meaning: '跑；奔跑',
    examples: [
      { en: 'I run every morning.', zh: '我每天早上跑步。' },
      { en: 'The children run in the park.', zh: '孩子们在公园里跑。' },
    ],
    relatedWords: [
      { word: 'walk', meaning: '走' },
      { word: 'jump', meaning: '跳' },
    ],
    phoneticUK: '/rʌn/',
    phoneticUS: '/rʌn/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '跑；奔跑；运行；管理',
        examples: [
          { en: 'I run every morning.', zh: '我每天早上跑步。' },
          { en: 'She runs a small business.', zh: '她经营一家小企业。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '跑步；旅程；一连串',
        examples: [
          { en: 'I went for a run this morning.', zh: '我今天早上去跑步了。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'run away', meaning: '逃跑' },
      { phrase: 'run out of', meaning: '用完；耗尽' },
      { phrase: 'go for a run', meaning: '去跑步' },
      { phrase: 'run a business', meaning: '经营生意' },
    ],
    synonyms: ['sprint', 'jog', 'dash', 'operate'],
    antonyms: ['walk', 'stop'],
    related: [
      { word: 'walk', meaning: '走' },
      { word: 'jump', meaning: '跳' },
      { word: 'fast', meaning: '快的' },
      { word: 'marathon', meaning: '马拉松' },
    ],
  },
  school: {
    word: 'school',
    phonetic: '/skuːl/',
    partOfSpeech: 'noun',
    meaning: '学校',
    examples: [
      { en: 'I go to school by bus.', zh: '我坐公交车上学。' },
      { en: 'Our school is very big.', zh: '我们的学校很大。' },
    ],
    relatedWords: [
      { word: 'teacher', meaning: '老师' },
      { word: 'student', meaning: '学生' },
    ],
    phoneticUK: '/skuːl/',
    phoneticUS: '/skuːl/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '学校；学院；学派',
        examples: [
          { en: 'I go to school by bus.', zh: '我坐公交车上学。' },
          { en: 'She is a school teacher.', zh: '她是一名学校老师。' },
        ],
      },
      {
        partOfSpeech: 'verb',
        meaning: '教育；训练',
        examples: [
          { en: 'You need to school yourself to be patient.', zh: '你需要锻炼自己有耐心。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'go to school', meaning: '去上学' },
      { phrase: 'primary school', meaning: '小学' },
      { phrase: 'high school', meaning: '高中' },
      { phrase: 'school year', meaning: '学年' },
    ],
    synonyms: ['academy', 'institute', 'college'],
    antonyms: [],
    related: [
      { word: 'teacher', meaning: '老师' },
      { word: 'student', meaning: '学生' },
      { word: 'class', meaning: '班级' },
      { word: 'classroom', meaning: '教室' },
    ],
  },
  teacher: {
    word: 'teacher',
    phonetic: '/ˈtiː.tʃər/',
    partOfSpeech: 'noun',
    meaning: '老师；教师',
    examples: [
      { en: 'My teacher is very nice.', zh: '我的老师非常好。' },
      { en: 'The teacher teaches us English.', zh: '老师教我们英语。' },
    ],
    phoneticUK: '/ˈtiː.tʃər/',
    phoneticUS: '/ˈtiː.tʃər/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '教师；老师；导师',
        examples: [
          { en: 'My teacher is very nice.', zh: '我的老师非常好。' },
          { en: 'She wants to become a teacher.', zh: '她想成为一名教师。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'English teacher', meaning: '英语老师' },
      { phrase: 'head teacher', meaning: '班主任' },
      { phrase: 'teacher training', meaning: '教师培训' },
      { phrase: 'teacher\'s day', meaning: '教师节' },
    ],
    synonyms: ['instructor', 'educator', 'tutor', 'professor'],
    antonyms: ['student', 'pupil'],
    relatedWords: [
      { word: 'student', meaning: '学生' },
      { word: 'school', meaning: '学校' },
    ],
    related: [
      { word: 'student', meaning: '学生' },
      { word: 'school', meaning: '学校' },
      { word: 'teach', meaning: '教' },
      { word: 'education', meaning: '教育' },
    ],
  },
  umbrella: {
    word: 'umbrella',
    phonetic: '/ʌmˈbrel.ə/',
    partOfSpeech: 'noun',
    meaning: '雨伞',
    examples: [
      { en: 'Take an umbrella with you.', zh: '随身带把伞。' },
      { en: 'The umbrella is red.', zh: '这把伞是红色的。' },
    ],
    relatedWords: [
      { word: 'rain', meaning: '雨' },
      { word: 'cloud', meaning: '云' },
    ],
  },
  very: {
    word: 'very',
    phonetic: '/ˈver.i/',
    partOfSpeech: 'adverb',
    meaning: '非常；很',
    examples: [
      { en: 'She is very beautiful.', zh: '她非常漂亮。' },
      { en: 'I am very happy today.', zh: '我今天非常开心。' },
    ],
    relatedWords: [
      { word: 'so', meaning: '如此' },
      { word: 'quite', meaning: '相当' },
    ],
  },
  water: {
    word: 'water',
    phonetic: '/ˈwɔː.tər/',
    partOfSpeech: 'noun',
    meaning: '水',
    examples: [
      { en: 'I drink water every day.', zh: '我每天都喝水。' },
      { en: 'The water is clean.', zh: '水很干净。' },
    ],
    relatedWords: [
      { word: 'drink', meaning: '喝' },
      { word: 'river', meaning: '河流' },
    ],
    phoneticUK: '/ˈwɔː.tər/',
    phoneticUS: '/ˈwɑː.tər/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '水；水域；雨水',
        examples: [
          { en: 'I drink water every day.', zh: '我每天都喝水。' },
          { en: 'The water in the lake is very clear.', zh: '湖里的水非常清澈。' },
        ],
      },
      {
        partOfSpeech: 'verb',
        meaning: '浇水；灌溉',
        examples: [
          { en: 'She waters the flowers every morning.', zh: '她每天早上浇花。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'drink water', meaning: '喝水' },
      { phrase: 'hot water', meaning: '热水' },
      { phrase: 'water park', meaning: '水上乐园' },
      { phrase: 'fresh water', meaning: '淡水' },
    ],
    synonyms: ['liquid', 'fluid'],
    antonyms: ['land', 'fire'],
    related: [
      { word: 'drink', meaning: '喝' },
      { word: 'river', meaning: '河流' },
      { word: 'ocean', meaning: '海洋' },
      { word: 'rain', meaning: '雨' },
    ],
  },
  yellow: {
    word: 'yellow',
    phonetic: '/ˈjel.əʊ/',
    partOfSpeech: 'adjective',
    meaning: '黄色的',
    examples: [
      { en: 'The sun is yellow.', zh: '太阳是黄色的。' },
      { en: 'I have a yellow bag.', zh: '我有一个黄色的包。' },
    ],
    relatedWords: [
      { word: 'red', meaning: '红色的' },
      { word: 'blue', meaning: '蓝色的' },
    ],
  },
  zoo: {
    word: 'zoo',
    phonetic: '/zuː/',
    partOfSpeech: 'noun',
    meaning: '动物园',
    examples: [
      { en: 'We went to the zoo yesterday.', zh: '我们昨天去了动物园。' },
      { en: 'There are many animals in the zoo.', zh: '动物园里有很多动物。' },
    ],
    relatedWords: [
      { word: 'animal', meaning: '动物' },
      { word: 'park', meaning: '公园' },
    ],
  },
  I: {
    word: 'I',
    phonetic: '/aɪ/',
    partOfSpeech: 'pronoun',
    meaning: '我',
    examples: [
      { en: 'I am a student.', zh: '我是一名学生。' },
      { en: 'I like English.', zh: '我喜欢英语。' },
    ],
    relatedWords: [
      { word: 'you', meaning: '你' },
      { word: 'me', meaning: '我（宾格）' },
    ],
  },
  you: {
    word: 'you',
    phonetic: '/juː/',
    partOfSpeech: 'pronoun',
    meaning: '你；你们',
    examples: [
      { en: 'You are my friend.', zh: '你是我的朋友。' },
      { en: 'Thank you.', zh: '谢谢你。' },
    ],
    relatedWords: [
      { word: 'I', meaning: '我' },
      { word: 'your', meaning: '你的' },
    ],
  },
  he: {
    word: 'he',
    phonetic: '/hiː/',
    partOfSpeech: 'pronoun',
    meaning: '他',
    examples: [
      { en: 'He is a doctor.', zh: '他是一名医生。' },
      { en: 'He likes playing football.', zh: '他喜欢踢足球。' },
    ],
    relatedWords: [
      { word: 'she', meaning: '她' },
      { word: 'him', meaning: '他（宾格）' },
    ],
  },
  she: {
    word: 'she',
    phonetic: '/ʃiː/',
    partOfSpeech: 'pronoun',
    meaning: '她',
    examples: [
      { en: 'She is a teacher.', zh: '她是一名老师。' },
      { en: 'She sings very well.', zh: '她唱歌很好听。' },
    ],
    relatedWords: [
      { word: 'he', meaning: '他' },
      { word: 'her', meaning: '她（宾格）' },
    ],
  },
  is: {
    word: 'is',
    phonetic: '/ɪz/',
    partOfSpeech: 'verb',
    meaning: '是（be的第三人称单数）',
    examples: [
      { en: 'She is a teacher.', zh: '她是一名老师。' },
      { en: 'It is a cat.', zh: '它是一只猫。' },
    ],
    relatedWords: [
      { word: 'am', meaning: '是' },
      { word: 'are', meaning: '是' },
    ],
  },
  am: {
    word: 'am',
    phonetic: '/æm/',
    partOfSpeech: 'verb',
    meaning: '是（be的第一人称单数）',
    examples: [
      { en: 'I am a student.', zh: '我是一名学生。' },
      { en: 'I am happy.', zh: '我很开心。' },
    ],
    relatedWords: [
      { word: 'is', meaning: '是' },
      { word: 'are', meaning: '是' },
    ],
  },
  are: {
    word: 'are',
    phonetic: '/ɑːr/',
    partOfSpeech: 'verb',
    meaning: '是（be的复数形式）',
    examples: [
      { en: 'You are my friend.', zh: '你是我的朋友。' },
      { en: 'They are students.', zh: '他们是学生。' },
    ],
    relatedWords: [
      { word: 'is', meaning: '是' },
      { word: 'am', meaning: '是' },
    ],
  },
  a: {
    word: 'a',
    phonetic: '/ə/',
    partOfSpeech: 'article',
    meaning: '一个；一（件/只/本等）',
    examples: [
      { en: 'I have a book.', zh: '我有一本书。' },
      { en: 'She is a teacher.', zh: '她是一名老师。' },
    ],
    relatedWords: [
      { word: 'an', meaning: '一个' },
      { word: 'the', meaning: '这个；那个' },
    ],
  },
  an: {
    word: 'an',
    phonetic: '/æn/',
    partOfSpeech: 'article',
    meaning: '一个（用于元音开头的单词前）',
    examples: [
      { en: 'I have an apple.', zh: '我有一个苹果。' },
      { en: 'She is an English teacher.', zh: '她是一位英语老师。' },
    ],
    relatedWords: [
      { word: 'a', meaning: '一个' },
      { word: 'the', meaning: '这个' },
    ],
  },
  the: {
    word: 'the',
    phonetic: '/ðə/',
    partOfSpeech: 'article',
    meaning: '这个；那个；这些；那些',
    examples: [
      { en: 'The book is on the table.', zh: '书在桌子上。' },
      { en: 'The sun is shining.', zh: '太阳在照耀。' },
    ],
    relatedWords: [
      { word: 'a', meaning: '一个' },
      { word: 'this', meaning: '这个' },
    ],
  },
  and: {
    word: 'and',
    phonetic: '/ænd/',
    partOfSpeech: 'conjunction',
    meaning: '和；与；而且',
    examples: [
      { en: 'You and me are friends.', zh: '你和我是朋友。' },
      { en: 'I like apples and bananas.', zh: '我喜欢苹果和香蕉。' },
    ],
    relatedWords: [
      { word: 'or', meaning: '或者' },
      { word: 'but', meaning: '但是' },
    ],
  },
  have: {
    word: 'have',
    phonetic: '/hæv/',
    partOfSpeech: 'verb',
    meaning: '有；拥有',
    examples: [
      { en: 'I have a new bag.', zh: '我有一个新书包。' },
      { en: 'We have a big house.', zh: '我们有一座大房子。' },
    ],
    relatedWords: [
      { word: 'has', meaning: '有（第三人称单数）' },
      { word: 'own', meaning: '拥有' },
    ],
    phoneticUK: '/hæv/',
    phoneticUS: '/hæv/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '有；拥有；吃；进行（助动词）',
        examples: [
          { en: 'I have a new bag.', zh: '我有一个新书包。' },
          { en: 'I have finished my homework.', zh: '我已经完成了作业。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'have to', meaning: '必须；不得不' },
      { phrase: 'have fun', meaning: '玩得开心' },
      { phrase: 'have a good time', meaning: '过得愉快' },
      { phrase: 'have lunch', meaning: '吃午饭' },
    ],
    synonyms: ['possess', 'own', 'hold'],
    antonyms: ['lack', 'need'],
    related: [
      { word: 'has', meaning: '有（第三人称单数）' },
      { word: 'own', meaning: '拥有' },
      { word: 'had', meaning: '有（过去式）' },
      { word: 'having', meaning: '有（现在分词）' },
    ],
  },
  has: {
    word: 'has',
    phonetic: '/hæz/',
    partOfSpeech: 'verb',
    meaning: '有（have的第三人称单数）',
    examples: [
      { en: 'She has a cat.', zh: '她有一只猫。' },
      { en: 'He has two brothers.', zh: '他有两个兄弟。' },
    ],
    relatedWords: [
      { word: 'have', meaning: '有' },
      { word: 'had', meaning: '有（过去式）' },
    ],
  },
  in: {
    word: 'in',
    phonetic: '/ɪn/',
    partOfSpeech: 'preposition',
    meaning: '在……里面',
    examples: [
      { en: 'The cat is in the box.', zh: '猫在盒子里。' },
      { en: 'I am in the classroom.', zh: '我在教室里。' },
    ],
    relatedWords: [
      { word: 'on', meaning: '在……上面' },
      { word: 'at', meaning: '在' },
    ],
  },
  on: {
    word: 'on',
    phonetic: '/ɒn/',
    partOfSpeech: 'preposition',
    meaning: '在……上面',
    examples: [
      { en: 'The book is on the table.', zh: '书在桌子上。' },
      { en: 'There is a picture on the wall.', zh: '墙上有一幅画。' },
    ],
    relatedWords: [
      { word: 'in', meaning: '在……里面' },
      { word: 'under', meaning: '在……下面' },
    ],
  },
  to: {
    word: 'to',
    phonetic: '/tuː/',
    partOfSpeech: 'preposition',
    meaning: '到；向；给',
    examples: [
      { en: 'I go to school every day.', zh: '我每天去上学。' },
      { en: 'Nice to meet you.', zh: '很高兴见到你。' },
    ],
    relatedWords: [
      { word: 'from', meaning: '从' },
      { word: 'for', meaning: '为了' },
    ],
  },
  of: {
    word: 'of',
    phonetic: '/ɒv/',
    partOfSpeech: 'preposition',
    meaning: '……的',
    examples: [
      { en: 'This is a picture of my family.', zh: '这是我家人的照片。' },
      { en: 'The color of the sky is blue.', zh: '天空的颜色是蓝色的。' },
    ],
    relatedWords: [
      { word: '\'s', meaning: '……的' },
      { word: 'for', meaning: '为了' },
    ],
  },
  big: {
    word: 'big',
    phonetic: '/bɪɡ/',
    partOfSpeech: 'adjective',
    meaning: '大的',
    examples: [
      { en: 'The elephant is very big.', zh: '大象非常大。' },
      { en: 'I have a big house.', zh: '我有一座大房子。' },
    ],
    relatedWords: [
      { word: 'small', meaning: '小的' },
      { word: 'large', meaning: '大的' },
    ],
    phoneticUK: '/bɪɡ/',
    phoneticUS: '/bɪɡ/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '大的；重要的；年长的',
        examples: [
          { en: 'The elephant is very big.', zh: '大象非常大。' },
          { en: 'This is a big decision.', zh: '这是一个重大的决定。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'big deal', meaning: '大事；重要的事' },
      { phrase: 'big brother', meaning: '哥哥' },
      { phrase: 'big city', meaning: '大城市' },
      { phrase: 'big fan', meaning: '超级粉丝' },
    ],
    synonyms: ['large', 'huge', 'enormous', 'giant'],
    antonyms: ['small', 'little', 'tiny'],
    related: [
      { word: 'small', meaning: '小的' },
      { word: 'large', meaning: '大的' },
      { word: 'huge', meaning: '巨大的' },
      { word: 'size', meaning: '尺寸' },
    ],
  },
  small: {
    word: 'small',
    phonetic: '/smɔːl/',
    partOfSpeech: 'adjective',
    meaning: '小的',
    examples: [
      { en: 'The mouse is very small.', zh: '老鼠非常小。' },
      { en: 'I have a small dog.', zh: '我有一只小狗。' },
    ],
    relatedWords: [
      { word: 'big', meaning: '大的' },
      { word: 'little', meaning: '小的' },
    ],
    phoneticUK: '/smɔːl/',
    phoneticUS: '/smɔːl/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '小的；少的；年幼的',
        examples: [
          { en: 'The mouse is very small.', zh: '老鼠非常小。' },
          { en: 'Only a small number of people came.', zh: '只有少数人来了。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'small town', meaning: '小镇' },
      { phrase: 'a small number of', meaning: '少量的' },
      { phrase: 'small talk', meaning: '闲聊' },
      { phrase: 'small business', meaning: '小生意' },
    ],
    synonyms: ['little', 'tiny', 'minor', 'compact'],
    antonyms: ['big', 'large', 'huge'],
    related: [
      { word: 'big', meaning: '大的' },
      { word: 'little', meaning: '小的' },
      { word: 'tiny', meaning: '微小的' },
      { word: 'size', meaning: '尺寸' },
    ],
  },
  new: {
    word: 'new',
    phonetic: '/njuː/',
    partOfSpeech: 'adjective',
    meaning: '新的',
    examples: [
      { en: 'I have a new bike.', zh: '我有一辆新自行车。' },
      { en: 'This is our new teacher.', zh: '这是我们的新老师。' },
    ],
    relatedWords: [
      { word: 'old', meaning: '旧的' },
      { word: 'fresh', meaning: '新鲜的' },
    ],
    phoneticUK: '/njuː/',
    phoneticUS: '/nuː/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '新的；新鲜的；新近的',
        examples: [
          { en: 'I have a new bike.', zh: '我有一辆新自行车。' },
          { en: 'What\'s new?', zh: '有什么新鲜事吗？' },
        ],
      },
    ],
    collocations: [
      { phrase: 'new year', meaning: '新年' },
      { phrase: 'brand new', meaning: '全新的' },
      { phrase: 'new idea', meaning: '新想法' },
      { phrase: 'new life', meaning: '新生活' },
    ],
    synonyms: ['fresh', 'novel', 'modern', 'recent'],
    antonyms: ['old', 'ancient', 'used'],
    related: [
      { word: 'old', meaning: '旧的' },
      { word: 'fresh', meaning: '新鲜的' },
      { word: 'news', meaning: '新闻' },
      { word: 'newly', meaning: '新近地' },
    ],
  },
  old: {
    word: 'old',
    phonetic: '/əʊld/',
    partOfSpeech: 'adjective',
    meaning: '旧的；年老的',
    examples: [
      { en: 'My bike is old.', zh: '我的自行车很旧。' },
      { en: 'The old man is very kind.', zh: '这位老人非常善良。' },
    ],
    relatedWords: [
      { word: 'new', meaning: '新的' },
      { word: 'young', meaning: '年轻的' },
    ],
    phoneticUK: '/əʊld/',
    phoneticUS: '/oʊld/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '旧的；年老的；古老的；…岁的',
        examples: [
          { en: 'My bike is old.', zh: '我的自行车很旧。' },
          { en: 'How old are you?', zh: '你多大了？' },
        ],
      },
    ],
    collocations: [
      { phrase: 'old man', meaning: '老人' },
      { phrase: 'old friend', meaning: '老朋友' },
      { phrase: 'get old', meaning: '变老' },
      { phrase: 'old fashioned', meaning: '老式的' },
    ],
    synonyms: ['aged', 'ancient', 'elderly', 'used'],
    antonyms: ['new', 'young', 'modern'],
    related: [
      { word: 'new', meaning: '新的' },
      { word: 'young', meaning: '年轻的' },
      { word: 'ancient', meaning: '古老的' },
      { word: 'age', meaning: '年龄' },
    ],
  },
  go: {
    word: 'go',
    phonetic: '/ɡəʊ/',
    partOfSpeech: 'verb',
    meaning: '去；走',
    examples: [
      { en: 'Let\'s go to the park.', zh: '我们去公园吧。' },
      { en: 'I go home at 5 o\'clock.', zh: '我五点钟回家。' },
    ],
    relatedWords: [
      { word: 'come', meaning: '来' },
      { word: 'walk', meaning: '走' },
    ],
    phoneticUK: '/ɡəʊ/',
    phoneticUS: '/ɡoʊ/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '去；走；进行；变成',
        examples: [
          { en: 'Let\'s go to the park.', zh: '我们去公园吧。' },
          { en: 'The milk went bad.', zh: '牛奶变质了。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '尝试；精力；一举',
        examples: [
          { en: 'Let me have a go at it.', zh: '让我试一下。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'go home', meaning: '回家' },
      { phrase: 'go to school', meaning: '去上学' },
      { phrase: 'go shopping', meaning: '去购物' },
      { phrase: 'have a go', meaning: '试一试' },
    ],
    synonyms: ['leave', 'depart', 'move', 'proceed'],
    antonyms: ['come', 'arrive', 'stay'],
    related: [
      { word: 'come', meaning: '来' },
      { word: 'walk', meaning: '走' },
      { word: 'travel', meaning: '旅行' },
      { word: 'went', meaning: '去（过去式）' },
    ],
  },
  come: {
    word: 'come',
    phonetic: '/kʌm/',
    partOfSpeech: 'verb',
    meaning: '来',
    examples: [
      { en: 'Come here, please.', zh: '请来这里。' },
      { en: 'She comes from China.', zh: '她来自中国。' },
    ],
    relatedWords: [
      { word: 'go', meaning: '去' },
      { word: 'arrive', meaning: '到达' },
    ],
    phoneticUK: '/kʌm/',
    phoneticUS: '/kʌm/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '来；来到；变得；达到',
        examples: [
          { en: 'Come here, please.', zh: '请来这里。' },
          { en: 'My dream came true.', zh: '我的梦想实现了。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'come from', meaning: '来自' },
      { phrase: 'come on', meaning: '加油；快点' },
      { phrase: 'come true', meaning: '实现' },
      { phrase: 'come back', meaning: '回来' },
    ],
    synonyms: ['arrive', 'approach', 'reach'],
    antonyms: ['go', 'leave', 'depart'],
    related: [
      { word: 'go', meaning: '去' },
      { word: 'arrive', meaning: '到达' },
      { word: 'visit', meaning: '拜访' },
      { word: 'back', meaning: '回' },
    ],
  },
  like: {
    word: 'like',
    phonetic: '/laɪk/',
    partOfSpeech: 'verb',
    meaning: '喜欢',
    examples: [
      { en: 'I like reading books.', zh: '我喜欢读书。' },
      { en: 'She likes music.', zh: '她喜欢音乐。' },
    ],
    relatedWords: [
      { word: 'love', meaning: '热爱' },
      { word: 'hate', meaning: '讨厌' },
    ],
    phoneticUK: '/laɪk/',
    phoneticUS: '/laɪk/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '喜欢；爱好；想要',
        examples: [
          { en: 'I like reading books.', zh: '我喜欢读书。' },
          { en: 'Would you like some tea?', zh: '你想要喝点茶吗？' },
        ],
      },
      {
        partOfSpeech: 'preposition',
        meaning: '像；如同；比如',
        examples: [
          { en: 'She looks like her mother.', zh: '她长得像她妈妈。' },
          { en: 'It sounds like a good idea.', zh: '听起来是个好主意。' },
        ],
      },
      {
        partOfSpeech: 'conjunction',
        meaning: '像……一样',
        examples: [
          { en: 'Do it like I do.', zh: '照我做的那样做。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'look like', meaning: '看起来像' },
      { phrase: 'feel like', meaning: '想要；感觉像' },
      { phrase: 'such like', meaning: '诸如' },
      { phrase: 'like this', meaning: '像这样' },
    ],
    synonyms: ['love', 'enjoy', 'prefer', 'similar'],
    antonyms: ['hate', 'dislike', 'unlike'],
    related: [
      { word: 'love', meaning: '热爱' },
      { word: 'hate', meaning: '讨厌' },
      { word: 'similar', meaning: '相似的' },
      { word: 'favorite', meaning: '最喜欢的' },
    ],
  },
  see: {
    word: 'see',
    phonetic: '/siː/',
    partOfSpeech: 'verb',
    meaning: '看见；看到',
    examples: [
      { en: 'I can see a bird.', zh: '我能看到一只鸟。' },
      { en: 'Nice to see you.', zh: '很高兴见到你。' },
    ],
    relatedWords: [
      { word: 'look', meaning: '看' },
      { word: 'watch', meaning: '观看' },
    ],
  },
  read: {
    word: 'read',
    phonetic: '/riːd/',
    partOfSpeech: 'verb',
    meaning: '阅读；读',
    examples: [
      { en: 'I read books every day.', zh: '我每天都读书。' },
      { en: 'She is reading a story.', zh: '她正在读一个故事。' },
    ],
    relatedWords: [
      { word: 'write', meaning: '写' },
      { word: 'book', meaning: '书' },
    ],
    phoneticUK: '/riːd/',
    phoneticUS: '/riːd/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '阅读；读；朗读；看懂',
        examples: [
          { en: 'I read books every day.', zh: '我每天都读书。' },
          { en: 'Can you read this word?', zh: '你能读出这个单词吗？' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '阅读；读物',
        examples: [
          { en: 'The book is a good read.', zh: '这本书读起来很有趣。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'read a book', meaning: '读书' },
      { phrase: 'read aloud', meaning: '朗读' },
      { phrase: 'read carefully', meaning: '仔细阅读' },
      { phrase: 'bedtime reading', meaning: '睡前阅读' },
    ],
    synonyms: ['peruse', 'scan', 'study', 'learn'],
    antonyms: ['write'],
    related: [
      { word: 'write', meaning: '写' },
      { word: 'book', meaning: '书' },
      { word: 'story', meaning: '故事' },
      { word: 'library', meaning: '图书馆' },
    ],
  },
  write: {
    word: 'write',
    phonetic: '/raɪt/',
    partOfSpeech: 'verb',
    meaning: '写；书写',
    examples: [
      { en: 'I can write my name.', zh: '我会写我的名字。' },
      { en: 'She writes a letter.', zh: '她写了一封信。' },
    ],
    relatedWords: [
      { word: 'read', meaning: '读' },
      { word: 'draw', meaning: '画' },
    ],
    phoneticUK: '/raɪt/',
    phoneticUS: '/raɪt/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '写；书写；写作；写信',
        examples: [
          { en: 'I can write my name.', zh: '我会写我的名字。' },
          { en: 'She writes for a magazine.', zh: '她为一家杂志撰稿。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'write a letter', meaning: '写信' },
      { phrase: 'write down', meaning: '写下来' },
      { phrase: 'write an email', meaning: '写邮件' },
      { phrase: 'write a story', meaning: '写故事' },
    ],
    synonyms: ['compose', 'draft', 'note', 'record'],
    antonyms: ['read', 'erase'],
    related: [
      { word: 'read', meaning: '读' },
      { word: 'draw', meaning: '画' },
      { word: 'letter', meaning: '信件' },
      { word: 'pen', meaning: '钢笔' },
    ],
  },
  play: {
    word: 'play',
    phonetic: '/pleɪ/',
    partOfSpeech: 'verb',
    meaning: '玩；玩耍；演奏',
    examples: [
      { en: 'The children play in the park.', zh: '孩子们在公园里玩。' },
      { en: 'He can play the piano.', zh: '他会弹钢琴。' },
    ],
    relatedWords: [
      { word: 'game', meaning: '游戏' },
      { word: 'sport', meaning: '运动' },
    ],
    phoneticUK: '/pleɪ/',
    phoneticUS: '/pleɪ/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '玩；玩耍；演奏；扮演',
        examples: [
          { en: 'The children play in the park.', zh: '孩子们在公园里玩。' },
          { en: 'She played the role of a princess.', zh: '她扮演公主的角色。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '游戏；剧本；戏剧',
        examples: [
          { en: 'We watched a play last night.', zh: '我们昨晚看了一出戏。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'play with', meaning: '和……一起玩' },
      { phrase: 'play football', meaning: '踢足球' },
      { phrase: 'play the piano', meaning: '弹钢琴' },
      { phrase: 'play an important role', meaning: '发挥重要作用' },
    ],
    synonyms: ['game', 'perform', 'act', 'enjoy'],
    antonyms: ['work', 'study'],
    related: [
      { word: 'game', meaning: '游戏' },
      { word: 'sport', meaning: '运动' },
      { word: 'music', meaning: '音乐' },
      { word: 'fun', meaning: '乐趣' },
    ],
  },
  eat: {
    word: 'eat',
    phonetic: '/iːt/',
    partOfSpeech: 'verb',
    meaning: '吃',
    examples: [
      { en: 'I eat breakfast at 7.', zh: '我七点吃早餐。' },
      { en: 'What do you want to eat?', zh: '你想吃什么？' },
    ],
    relatedWords: [
      { word: 'drink', meaning: '喝' },
      { word: 'food', meaning: '食物' },
    ],
    phoneticUK: '/iːt/',
    phoneticUS: '/iːt/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: '吃；吃饭；消耗',
        examples: [
          { en: 'I eat breakfast at 7.', zh: '我七点吃早餐。' },
          { en: 'Let\'s eat out tonight.', zh: '我们今晚出去吃吧。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'eat out', meaning: '出去吃饭' },
      { phrase: 'eat lunch', meaning: '吃午饭' },
      { phrase: 'eat well', meaning: '吃得好' },
      { phrase: 'eat up', meaning: '吃光' },
    ],
    synonyms: ['consume', 'dine', 'devour'],
    antonyms: ['drink', 'starve'],
    related: [
      { word: 'drink', meaning: '喝' },
      { word: 'food', meaning: '食物' },
      { word: 'breakfast', meaning: '早餐' },
      { word: 'meal', meaning: '一餐' },
    ],
  },
  drink: {
    word: 'drink',
    phonetic: '/drɪŋk/',
    partOfSpeech: 'verb',
    meaning: '喝',
    examples: [
      { en: 'I drink milk every day.', zh: '我每天都喝牛奶。' },
      { en: 'Would you like to drink some water?', zh: '你想喝点水吗？' },
    ],
    relatedWords: [
      { word: 'eat', meaning: '吃' },
      { word: 'water', meaning: '水' },
    ],
  },
  red: {
    word: 'red',
    phonetic: '/red/',
    partOfSpeech: 'adjective',
    meaning: '红色的',
    examples: [
      { en: 'The apple is red.', zh: '苹果是红色的。' },
      { en: 'I have a red bag.', zh: '我有一个红色的包。' },
    ],
    relatedWords: [
      { word: 'blue', meaning: '蓝色的' },
      { word: 'green', meaning: '绿色的' },
    ],
    phoneticUK: '/red/',
    phoneticUS: '/red/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '红色的；红肿的；涨红的',
        examples: [
          { en: 'The apple is red.', zh: '苹果是红色的。' },
          { en: 'Her eyes were red from crying.', zh: '她的眼睛哭红了。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '红色；红颜料',
        examples: [
          { en: 'Red is my favorite color.', zh: '红色是我最喜欢的颜色。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'red apple', meaning: '红苹果' },
      { phrase: 'red wine', meaning: '红酒' },
      { phrase: 'turn red', meaning: '变红' },
      { phrase: 'in the red', meaning: '亏损；负债' },
    ],
    synonyms: ['crimson', 'scarlet', 'ruby'],
    antonyms: [],
    related: [
      { word: 'blue', meaning: '蓝色的' },
      { word: 'green', meaning: '绿色的' },
      { word: 'color', meaning: '颜色' },
      { word: 'pink', meaning: '粉色的' },
    ],
  },
  blue: {
    word: 'blue',
    phonetic: '/bluː/',
    partOfSpeech: 'adjective',
    meaning: '蓝色的',
    examples: [
      { en: 'The sky is blue.', zh: '天空是蓝色的。' },
      { en: 'My pen is blue.', zh: '我的钢笔是蓝色的。' },
    ],
    relatedWords: [
      { word: 'red', meaning: '红色的' },
      { word: 'sky', meaning: '天空' },
    ],
    phoneticUK: '/bluː/',
    phoneticUS: '/bluː/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: '蓝色的；忧郁的',
        examples: [
          { en: 'The sky is blue.', zh: '天空是蓝色的。' },
          { en: 'I\'m feeling blue today.', zh: '我今天心情不好。' },
        ],
      },
      {
        partOfSpeech: 'noun',
        meaning: '蓝色；蓝颜料',
        examples: [
          { en: 'Blue is a calming color.', zh: '蓝色是一种让人平静的颜色。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'dark blue', meaning: '深蓝色' },
      { phrase: 'light blue', meaning: '浅蓝色' },
      { phrase: 'blue sky', meaning: '蓝天' },
      { phrase: 'feel blue', meaning: '感到忧郁' },
    ],
    synonyms: ['azure', 'sapphire', 'navy'],
    antonyms: [],
    related: [
      { word: 'red', meaning: '红色的' },
      { word: 'sky', meaning: '天空' },
      { word: 'green', meaning: '绿色的' },
      { word: 'color', meaning: '颜色' },
    ],
  },
  green: {
    word: 'green',
    phonetic: '/ɡriːn/',
    partOfSpeech: 'adjective',
    meaning: '绿色的',
    examples: [
      { en: 'The grass is green.', zh: '草是绿色的。' },
      { en: 'Green is my favorite color.', zh: '绿色是我最喜欢的颜色。' },
    ],
    relatedWords: [
      { word: 'red', meaning: '红色的' },
      { word: 'tree', meaning: '树' },
    ],
  },
  day: {
    word: 'day',
    phonetic: '/deɪ/',
    partOfSpeech: 'noun',
    meaning: '天；日；白天',
    examples: [
      { en: 'Have a good day!', zh: '祝你有美好的一天！' },
      { en: 'There are seven days in a week.', zh: '一周有七天。' },
    ],
    relatedWords: [
      { word: 'night', meaning: '夜晚' },
      { word: 'week', meaning: '周' },
    ],
    phoneticUK: '/deɪ/',
    phoneticUS: '/deɪ/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '天；日；白天；时期',
        examples: [
          { en: 'Have a good day!', zh: '祝你有美好的一天！' },
          { en: 'In my day, things were different.', zh: '在我那个年代，情况不一样。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'every day', meaning: '每天' },
      { phrase: 'all day', meaning: '整天' },
      { phrase: 'the other day', meaning: '前几天' },
      { phrase: 'day by day', meaning: '一天天' },
    ],
    synonyms: ['daytime', 'daily'],
    antonyms: ['night', 'evening'],
    related: [
      { word: 'night', meaning: '夜晚' },
      { word: 'week', meaning: '周' },
      { word: 'morning', meaning: '早晨' },
      { word: 'today', meaning: '今天' },
    ],
  },
  night: {
    word: 'night',
    phonetic: '/naɪt/',
    partOfSpeech: 'noun',
    meaning: '夜晚；晚上',
    examples: [
      { en: 'Good night!', zh: '晚安！' },
      { en: 'The stars shine at night.', zh: '星星在夜晚闪耀。' },
    ],
    relatedWords: [
      { word: 'day', meaning: '白天' },
      { word: 'evening', meaning: '傍晚' },
    ],
    phoneticUK: '/naɪt/',
    phoneticUS: '/naɪt/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '夜晚；晚上；夜间',
        examples: [
          { en: 'Good night!', zh: '晚安！' },
          { en: 'I study late at night.', zh: '我晚上学习到很晚。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'at night', meaning: '在晚上' },
      { phrase: 'good night', meaning: '晚安' },
      { phrase: 'last night', meaning: '昨晚' },
      { phrase: 'night sky', meaning: '夜空' },
    ],
    synonyms: ['evening', 'darkness', 'nighttime'],
    antonyms: ['day', 'daytime', 'morning'],
    related: [
      { word: 'day', meaning: '白天' },
      { word: 'evening', meaning: '傍晚' },
      { word: 'moon', meaning: '月亮' },
      { word: 'star', meaning: '星星' },
    ],
  },
  friend: {
    word: 'friend',
    phonetic: '/frend/',
    partOfSpeech: 'noun',
    meaning: '朋友',
    examples: [
      { en: 'Tom is my best friend.', zh: '汤姆是我最好的朋友。' },
      { en: 'We are good friends.', zh: '我们是好朋友。' },
    ],
    relatedWords: [
      { word: 'friendly', meaning: '友好的' },
      { word: 'family', meaning: '家人' },
    ],
    phoneticUK: '/frend/',
    phoneticUS: '/frend/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '朋友；伙伴；友人',
        examples: [
          { en: 'Tom is my best friend.', zh: '汤姆是我最好的朋友。' },
          { en: 'A friend in need is a friend indeed.', zh: '患难见真情。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'best friend', meaning: '最好的朋友' },
      { phrase: 'make friends', meaning: '交朋友' },
      { phrase: 'old friend', meaning: '老朋友' },
      { phrase: 'close friend', meaning: '亲密的朋友' },
    ],
    synonyms: ['companion', 'pal', 'buddy', 'mate'],
    antonyms: ['enemy', 'foe', 'stranger'],
    related: [
      { word: 'friendly', meaning: '友好的' },
      { word: 'family', meaning: '家人' },
      { word: 'friendship', meaning: '友谊' },
      { word: 'classmate', meaning: '同学' },
    ],
  },
  family: {
    word: 'family',
    phonetic: '/ˈfæm.əl.i/',
    partOfSpeech: 'noun',
    meaning: '家庭；家人',
    examples: [
      { en: 'I love my family.', zh: '我爱我的家人。' },
      { en: 'My family has five people.', zh: '我家有五口人。' },
    ],
    relatedWords: [
      { word: 'father', meaning: '父亲' },
      { word: 'mother', meaning: '母亲' },
    ],
    phoneticUK: '/ˈfæm.əl.i/',
    phoneticUS: '/ˈfæm.əl.i/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: '家庭；家人；家族',
        examples: [
          { en: 'I love my family.', zh: '我爱我的家人。' },
          { en: 'Family is the most important thing.', zh: '家庭是最重要的。' },
        ],
      },
      {
        partOfSpeech: 'adjective',
        meaning: '家庭的；家族的',
        examples: [
          { en: 'This is a family restaurant.', zh: '这是一家家庭餐厅。' },
        ],
      },
    ],
    collocations: [
      { phrase: 'family member', meaning: '家庭成员' },
      { phrase: 'family tree', meaning: '家谱' },
      { phrase: 'family photo', meaning: '全家福' },
      { phrase: 'family name', meaning: '姓氏' },
    ],
    synonyms: ['household', 'relatives', 'kin'],
    antonyms: ['stranger'],
    related: [
      { word: 'father', meaning: '父亲' },
      { word: 'mother', meaning: '母亲' },
      { word: 'home', meaning: '家' },
      { word: 'brother', meaning: '兄弟' },
    ],
  },
  father: {
    word: 'father',
    phonetic: '/ˈfɑː.ðər/',
    partOfSpeech: 'noun',
    meaning: '父亲；爸爸',
    examples: [
      { en: 'My father is a doctor.', zh: '我爸爸是一名医生。' },
      { en: 'Father and I often play together.', zh: '爸爸和我经常一起玩。' },
    ],
    relatedWords: [
      { word: 'mother', meaning: '母亲' },
      { word: 'dad', meaning: '爸爸（口语）' },
    ],
  },
  student: {
    word: 'student',
    phonetic: '/ˈstjuː.dənt/',
    partOfSpeech: 'noun',
    meaning: '学生',
    examples: [
      { en: 'I am a student.', zh: '我是一名学生。' },
      { en: 'There are 40 students in our class.', zh: '我们班有40名学生。' },
    ],
    relatedWords: [
      { word: 'teacher', meaning: '老师' },
      { word: 'pupil', meaning: '小学生' },
    ],
  },
  English: {
    word: 'English',
    phonetic: '/ˈɪŋ.ɡlɪʃ/',
    partOfSpeech: 'noun',
    meaning: '英语；英国人',
    examples: [
      { en: 'I learn English every day.', zh: '我每天都学英语。' },
      { en: 'English is very useful.', zh: '英语非常有用。' },
    ],
    relatedWords: [
      { word: 'Chinese', meaning: '中文' },
      { word: 'language', meaning: '语言' },
    ],
  },
  China: {
    word: 'China',
    phonetic: '/ˈtʃaɪ.nə/',
    partOfSpeech: 'noun',
    meaning: '中国',
    examples: [
      { en: 'I come from China.', zh: '我来自中国。' },
      { en: 'China is a beautiful country.', zh: '中国是一个美丽的国家。' },
    ],
    relatedWords: [
      { word: 'Chinese', meaning: '中文；中国人' },
      { word: 'Beijing', meaning: '北京' },
    ],
  },
  room: {
    word: 'room',
    phonetic: '/ruːm/',
    partOfSpeech: 'noun',
    meaning: '房间；室',
    examples: [
      { en: 'My room is very clean.', zh: '我的房间很干净。' },
      { en: 'This is my bedroom.', zh: '这是我的卧室。' },
    ],
    relatedWords: [
      { word: 'house', meaning: '房子' },
      { word: 'classroom', meaning: '教室' },
    ],
  },
  classroom: {
    word: 'classroom',
    phonetic: '/ˈklɑːs.ruːm/',
    partOfSpeech: 'noun',
    meaning: '教室',
    examples: [
      { en: 'We study in the classroom.', zh: '我们在教室里学习。' },
      { en: 'The classroom is big and bright.', zh: '教室又大又明亮。' },
    ],
    relatedWords: [
      { word: 'class', meaning: '班级' },
      { word: 'school', meaning: '学校' },
    ],
  },
  my: {
    word: 'my',
    phonetic: '/maɪ/',
    partOfSpeech: 'possessive',
    meaning: '我的',
    examples: [
      { en: 'This is my book.', zh: '这是我的书。' },
      { en: 'My name is Lily.', zh: '我的名字叫莉莉。' },
    ],
    relatedWords: [
      { word: 'your', meaning: '你的' },
      { word: 'I', meaning: '我' },
    ],
  },
  your: {
    word: 'your',
    phonetic: '/jɔːr/',
    partOfSpeech: 'possessive',
    meaning: '你的；你们的',
    examples: [
      { en: 'Is this your pen?', zh: '这是你的钢笔吗？' },
      { en: 'What\'s your name?', zh: '你叫什么名字？' },
    ],
    relatedWords: [
      { word: 'my', meaning: '我的' },
      { word: 'you', meaning: '你' },
    ],
  },
  his: {
    word: 'his',
    phonetic: '/hɪz/',
    partOfSpeech: 'possessive',
    meaning: '他的',
    examples: [
      { en: 'His bag is blue.', zh: '他的包是蓝色的。' },
      { en: 'Tom is his brother.', zh: '汤姆是他的兄弟。' },
    ],
    relatedWords: [
      { word: 'her', meaning: '她的' },
      { word: 'he', meaning: '他' },
    ],
  },
  her: {
    word: 'her',
    phonetic: '/hɜːr/',
    partOfSpeech: 'possessive',
    meaning: '她的',
    examples: [
      { en: 'Her dress is beautiful.', zh: '她的裙子很漂亮。' },
      { en: 'Lily is her sister.', zh: '莉莉是她的妹妹。' },
    ],
    relatedWords: [
      { word: 'his', meaning: '他的' },
      { word: 'she', meaning: '她' },
    ],
  },
  it: {
    word: 'it',
    phonetic: '/ɪt/',
    partOfSpeech: 'pronoun',
    meaning: '它',
    examples: [
      { en: 'It is a cat.', zh: '它是一只猫。' },
      { en: 'It is raining today.', zh: '今天在下雨。' },
    ],
    relatedWords: [
      { word: 'its', meaning: '它的' },
      { word: 'this', meaning: '这个' },
    ],
  },
  this: {
    word: 'this',
    phonetic: '/ðɪs/',
    partOfSpeech: 'pronoun',
    meaning: '这；这个',
    examples: [
      { en: 'This is my book.', zh: '这是我的书。' },
      { en: 'What is this?', zh: '这是什么？' },
    ],
    relatedWords: [
      { word: 'that', meaning: '那个' },
      { word: 'these', meaning: '这些' },
    ],
  },
  that: {
    word: 'that',
    phonetic: '/ðæt/',
    partOfSpeech: 'pronoun',
    meaning: '那；那个',
    examples: [
      { en: 'That is a bird.', zh: '那是一只鸟。' },
      { en: 'What is that?', zh: '那是什么？' },
    ],
    relatedWords: [
      { word: 'this', meaning: '这个' },
      { word: 'those', meaning: '那些' },
    ],
  },
  what: {
    word: 'what',
    phonetic: '/wɒt/',
    partOfSpeech: 'pronoun',
    meaning: '什么',
    examples: [
      { en: 'What is your name?', zh: '你叫什么名字？' },
      { en: 'What are you doing?', zh: '你在做什么？' },
    ],
    relatedWords: [
      { word: 'who', meaning: '谁' },
      { word: 'where', meaning: '哪里' },
    ],
  },
  who: {
    word: 'who',
    phonetic: '/huː/',
    partOfSpeech: 'pronoun',
    meaning: '谁',
    examples: [
      { en: 'Who is he?', zh: '他是谁？' },
      { en: 'Who is knocking at the door?', zh: '谁在敲门？' },
    ],
    relatedWords: [
      { word: 'what', meaning: '什么' },
      { word: 'whose', meaning: '谁的' },
    ],
  },
  where: {
    word: 'where',
    phonetic: '/weər/',
    partOfSpeech: 'pronoun',
    meaning: '在哪里；哪里',
    examples: [
      { en: 'Where is my book?', zh: '我的书在哪里？' },
      { en: 'Where do you live?', zh: '你住在哪里？' },
    ],
    relatedWords: [
      { word: 'what', meaning: '什么' },
      { word: 'when', meaning: '什么时候' },
    ],
  },
  how: {
    word: 'how',
    phonetic: '/haʊ/',
    partOfSpeech: 'adverb',
    meaning: '怎样；如何；多么',
    examples: [
      { en: 'How are you?', zh: '你好吗？' },
      { en: 'How old are you?', zh: '你多大了？' },
    ],
    relatedWords: [
      { word: 'what', meaning: '什么' },
      { word: 'why', meaning: '为什么' },
    ],
  },
  no: {
    word: 'no',
    phonetic: '/nəʊ/',
    partOfSpeech: 'adverb',
    meaning: '不；没有',
    examples: [
      { en: 'No, thank you.', zh: '不，谢谢你。' },
      { en: 'There is no water here.', zh: '这里没有水。' },
    ],
    relatedWords: [
      { word: 'yes', meaning: '是的' },
      { word: 'not', meaning: '不' },
    ],
  },
  yes: {
    word: 'yes',
    phonetic: '/jes/',
    partOfSpeech: 'adverb',
    meaning: '是；是的',
    examples: [
      { en: 'Yes, I do.', zh: '是的，我是。' },
      { en: 'Yes, please.', zh: '好的，麻烦了。' },
    ],
    relatedWords: [
      { word: 'no', meaning: '不' },
      { word: 'right', meaning: '对的' },
    ],
  },
  not: {
    word: 'not',
    phonetic: '/nɒt/',
    partOfSpeech: 'adverb',
    meaning: '不；没有',
    examples: [
      { en: 'I am not a teacher.', zh: '我不是老师。' },
      { en: 'She does not like fish.', zh: '她不喜欢鱼。' },
    ],
    relatedWords: [
      { word: 'no', meaning: '不' },
      { word: 'never', meaning: '从不' },
    ],
  },
  we: {
    word: 'we',
    phonetic: '/wiː/',
    partOfSpeech: 'pronoun',
    meaning: '我们',
    examples: [
      { en: 'We are good friends.', zh: '我们是好朋友。' },
      { en: 'We go to school together.', zh: '我们一起去上学。' },
    ],
    relatedWords: [
      { word: 'they', meaning: '他们' },
      { word: 'us', meaning: '我们（宾格）' },
    ],
  },
  they: {
    word: 'they',
    phonetic: '/ðeɪ/',
    partOfSpeech: 'pronoun',
    meaning: '他们；她们；它们',
    examples: [
      { en: 'They are students.', zh: '他们是学生。' },
      { en: 'They like playing football.', zh: '他们喜欢踢足球。' },
    ],
    relatedWords: [
      { word: 'we', meaning: '我们' },
      { word: 'them', meaning: '他们（宾格）' },
    ],
  },
  for: {
    word: 'for',
    phonetic: '/fɔːr/',
    partOfSpeech: 'preposition',
    meaning: '为了；给；持续',
    examples: [
      { en: 'This gift is for you.', zh: '这份礼物是给你的。' },
      { en: 'I study English for two hours.', zh: '我学了两小时英语。' },
    ],
    relatedWords: [
      { word: 'to', meaning: '到' },
      { word: 'of', meaning: '……的' },
    ],
  },
  with: {
    word: 'with',
    phonetic: '/wɪð/',
    partOfSpeech: 'preposition',
    meaning: '和……一起；用',
    examples: [
      { en: 'I play with my friend.', zh: '我和我的朋友一起玩。' },
      { en: 'Write with a pen.', zh: '用钢笔写。' },
    ],
    relatedWords: [
      { word: 'and', meaning: '和' },
      { word: 'use', meaning: '使用' },
    ],
  },
  do: {
    word: 'do',
    phonetic: '/duː/',
    partOfSpeech: 'verb',
    meaning: '做；干',
    examples: [
      { en: 'What do you do?', zh: '你是做什么的？' },
      { en: 'I do my homework every day.', zh: '我每天都做作业。' },
    ],
    relatedWords: [
      { word: 'does', meaning: '做（第三人称单数）' },
      { word: 'make', meaning: '制作' },
    ],
  },
  can: {
    word: 'can',
    phonetic: '/kæn/',
    partOfSpeech: 'auxiliary',
    meaning: '能；会；可以',
    examples: [
      { en: 'I can swim.', zh: '我会游泳。' },
      { en: 'Can you help me?', zh: '你能帮我吗？' },
    ],
    relatedWords: [
      { word: 'will', meaning: '将' },
      { word: 'may', meaning: '可以' },
    ],
  },
  will: {
    word: 'will',
    phonetic: '/wɪl/',
    partOfSpeech: 'auxiliary',
    meaning: '将；将要；愿意',
    examples: [
      { en: 'I will go to the park tomorrow.', zh: '我明天将去公园。' },
      { en: 'Will you marry me?', zh: '你愿意嫁给我吗？' },
    ],
    relatedWords: [
      { word: 'shall', meaning: '将' },
      { word: 'would', meaning: '将会' },
    ],
  },
  want: {
    word: 'want',
    phonetic: '/wɒnt/',
    partOfSpeech: 'verb',
    meaning: '想要；需要',
    examples: [
      { en: 'I want a new bike.', zh: '我想要一辆新自行车。' },
      { en: 'Do you want some water?', zh: '你想要一些水吗？' },
    ],
    relatedWords: [
      { word: 'need', meaning: '需要' },
      { word: 'like', meaning: '喜欢' },
    ],
  },
  need: {
    word: 'need',
    phonetic: '/niːd/',
    partOfSpeech: 'verb',
    meaning: '需要',
    examples: [
      { en: 'I need your help.', zh: '我需要你的帮助。' },
      { en: 'We need more time.', zh: '我们需要更多时间。' },
    ],
    relatedWords: [
      { word: 'want', meaning: '想要' },
      { word: 'must', meaning: '必须' },
    ],
  },
  time: {
    word: 'time',
    phonetic: '/taɪm/',
    partOfSpeech: 'noun',
    meaning: '时间；时候',
    examples: [
      { en: 'What time is it?', zh: '几点了？' },
      { en: 'It\'s time to go home.', zh: '该回家了。' },
    ],
    relatedWords: [
      { word: 'hour', meaning: '小时' },
      { word: 'clock', meaning: '时钟' },
    ],
  },
  morning: {
    word: 'morning',
    phonetic: '/ˈmɔː.nɪŋ/',
    partOfSpeech: 'noun',
    meaning: '早上；上午',
    examples: [
      { en: 'Good morning!', zh: '早上好！' },
      { en: 'I get up at 7 in the morning.', zh: '我早上7点起床。' },
    ],
    relatedWords: [
      { word: 'afternoon', meaning: '下午' },
      { word: 'evening', meaning: '傍晚' },
    ],
  },
  afternoon: {
    word: 'afternoon',
    phonetic: '/ˌɑːf.təˈnuːn/',
    partOfSpeech: 'noun',
    meaning: '下午',
    examples: [
      { en: 'Good afternoon!', zh: '下午好！' },
      { en: 'We have class in the afternoon.', zh: '我们下午有课。' },
    ],
    relatedWords: [
      { word: 'morning', meaning: '上午' },
      { word: 'evening', meaning: '傍晚' },
    ],
  },
  today: {
    word: 'today',
    phonetic: '/təˈdeɪ/',
    partOfSpeech: 'noun',
    meaning: '今天',
    examples: [
      { en: 'Today is Monday.', zh: '今天是星期一。' },
      { en: 'How are you today?', zh: '你今天好吗？' },
    ],
    relatedWords: [
      { word: 'tomorrow', meaning: '明天' },
      { word: 'yesterday', meaning: '昨天' },
    ],
  },
  tomorrow: {
    word: 'tomorrow',
    phonetic: '/təˈmɒr.əʊ/',
    partOfSpeech: 'noun',
    meaning: '明天',
    examples: [
      { en: 'Tomorrow is my birthday.', zh: '明天是我的生日。' },
      { en: 'See you tomorrow!', zh: '明天见！' },
    ],
    relatedWords: [
      { word: 'today', meaning: '今天' },
      { word: 'yesterday', meaning: '昨天' },
    ],
  },
  many: {
    word: 'many',
    phonetic: '/ˈmen.i/',
    partOfSpeech: 'adjective',
    meaning: '许多的；多的',
    examples: [
      { en: 'There are many books on the desk.', zh: '书桌上有很多书。' },
      { en: 'How many apples do you have?', zh: '你有多少个苹果？' },
    ],
    relatedWords: [
      { word: 'much', meaning: '许多（不可数）' },
      { word: 'few', meaning: '很少' },
    ],
  },
  some: {
    word: 'some',
    phonetic: '/sʌm/',
    partOfSpeech: 'adjective',
    meaning: '一些；若干',
    examples: [
      { en: 'I have some books.', zh: '我有一些书。' },
      { en: 'Would you like some tea?', zh: '你想喝点茶吗？' },
    ],
    relatedWords: [
      { word: 'any', meaning: '任何' },
      { word: 'many', meaning: '许多' },
    ],
  },
  nice: {
    word: 'nice',
    phonetic: '/naɪs/',
    partOfSpeech: 'adjective',
    meaning: '好的；美好的；漂亮的',
    examples: [
      { en: 'Nice to meet you.', zh: '很高兴见到你。' },
      { en: 'What a nice day!', zh: '多么美好的一天！' },
    ],
    relatedWords: [
      { word: 'good', meaning: '好的' },
      { word: 'beautiful', meaning: '美丽的' },
    ],
  },
  please: {
    word: 'please',
    phonetic: '/pliːz/',
    partOfSpeech: 'adverb',
    meaning: '请',
    examples: [
      { en: 'Sit down, please.', zh: '请坐。' },
      { en: 'Please help me.', zh: '请帮帮我。' },
    ],
    relatedWords: [
      { word: 'thank', meaning: '感谢' },
      { word: 'welcome', meaning: '欢迎' },
    ],
  },
  thanks: {
    word: 'thanks',
    phonetic: '/θæŋks/',
    partOfSpeech: 'noun',
    meaning: '感谢；谢谢',
    examples: [
      { en: 'Thanks a lot!', zh: '非常感谢！' },
      { en: 'No, thanks.', zh: '不了，谢谢。' },
    ],
    relatedWords: [
      { word: 'thank', meaning: '感谢' },
      { word: 'grateful', meaning: '感激的' },
    ],
  },
  welcome: {
    word: 'welcome',
    phonetic: '/ˈwel.kəm/',
    partOfSpeech: 'interjection',
    meaning: '欢迎；不客气',
    examples: [
      { en: 'You\'re welcome!', zh: '不客气！' },
      { en: 'Welcome to our school.', zh: '欢迎来到我们学校。' },
    ],
    relatedWords: [
      { word: 'hello', meaning: '你好' },
      { word: 'greet', meaning: '问候' },
    ],
  },
  hello: {
    word: 'hello',
    phonetic: '/həˈləʊ/',
    partOfSpeech: 'interjection',
    meaning: '你好',
    examples: [
      { en: 'Hello, everyone!', zh: '大家好！' },
      { en: 'Hello, how are you?', zh: '你好，你好吗？' },
    ],
    relatedWords: [
      { word: 'hi', meaning: '嗨' },
      { word: 'goodbye', meaning: '再见' },
    ],
  },
  goodbye: {
    word: 'goodbye',
    phonetic: '/ˌɡʊdˈbaɪ/',
    partOfSpeech: 'interjection',
    meaning: '再见',
    examples: [
      { en: 'Goodbye, see you tomorrow!', zh: '再见，明天见！' },
      { en: 'She said goodbye to her mother.', zh: '她跟妈妈说了再见。' },
    ],
    relatedWords: [
      { word: 'hello', meaning: '你好' },
      { word: 'bye', meaning: '再见（口语）' },
    ],
  },
  sorry: {
    word: 'sorry',
    phonetic: '/ˈsɒr.i/',
    partOfSpeech: 'adjective',
    meaning: '抱歉的；对不起的',
    examples: [
      { en: 'I\'m sorry for being late.', zh: '对不起，我迟到了。' },
      { en: 'Sorry, I can\'t help you.', zh: '抱歉，我帮不了你。' },
    ],
    relatedWords: [
      { word: 'excuse', meaning: '原谅' },
      { word: 'apologize', meaning: '道歉' },
    ],
  },
};

export function getDictWord(word: string): DictWordEntry | null {
  const key = word.toLowerCase();
  return DICT[key] || null;
}

export function getDictWordFull(word: string): DictWordEntry | null {
  const key = word.toLowerCase();
  const entry = DICT[key];
  if (!entry) return null;
  const full: DictWordEntry = { ...entry };
  if (!full.related && full.relatedWords) {
    full.related = full.relatedWords;
  }
  if (!full.definitions) {
    full.definitions = [
      {
        partOfSpeech: full.partOfSpeech,
        meaning: full.meaning,
        examples: full.examples,
      },
    ];
  }
  if (!full.phoneticUK) full.phoneticUK = full.phonetic;
  if (!full.phoneticUS) full.phoneticUS = full.phonetic;
  return full;
}

export function getDictSize(): number {
  return Object.keys(DICT).length;
}
