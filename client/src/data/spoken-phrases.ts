// ===== Types =====
export interface SpokenPhrase {
  phrase: string;
  translation: string;
  usage: string;
  example?: string;
}

export interface PhraseCategory {
  id: string;
  name: string;
  nameEn: string;
  phrases: SpokenPhrase[];
}

// ===== Data =====
export const spokenPhraseCategories: PhraseCategory[] = [
  // 1. 问候短语 Greetings — 15
  {
    id: 'greetings',
    name: '问候短语',
    nameEn: 'Greetings',
    phrases: [
      { phrase: 'Good morning!', translation: '早上好！', usage: '早上见面时的标准问候，语气正式友好。' },
      { phrase: 'How are you doing?', translation: '你最近怎么样？', usage: '比"How are you"更口语化，熟人之间常用。', example: "Hey Tom, how are you doing these days?" },
      { phrase: 'Long time no see!', translation: '好久不见！', usage: '久别重逢时的热情问候，非常地道。' },
      { phrase: "What's up?", translation: '最近在忙什么？', usage: '非常随意的打招呼，仅限朋友之间。' },
      { phrase: "How's it going?", translation: '近来如何？', usage: '轻松随意的问候方式，相当于"怎么样啊"。' },
      { phrase: 'Good to see you!', translation: '见到你真高兴！', usage: '见到熟悉的人时表达喜悦。' },
      { phrase: 'How have you been?', translation: '你最近还好吗？', usage: '用于有一段时间没见的朋友，带有关心意味。' },
      { phrase: 'Nice to meet you!', translation: '很高兴认识你！', usage: '初次见面时的礼貌用语，正式场合通用。' },
      { phrase: 'Hi there!', translation: '嗨，你好！', usage: '轻松活泼的打招呼，语气较亲切。' },
      { phrase: 'Good afternoon!', translation: '下午好！', usage: '中午12点到傍晚6点之间的问候。' },
      { phrase: 'Good evening!', translation: '晚上好！', usage: '傍晚6点之后的正式问候。' },
      { phrase: "How's everything?", translation: '一切都好吗？', usage: '比较全面的问候，关心对方各方面情况。' },
      { phrase: "What's new?", translation: '有什么新鲜事吗？', usage: '朋友见面时主动询问近况，语气随意。' },
      { phrase: 'Hey, how are you?', translation: '嘿，你好吗？', usage: '最常用的日常问候，熟人之间使用。' },
      { phrase: "It's great to see you again!", translation: '再次见到你真是太好了！', usage: '重逢时表达愉快心情，语气较热情。' },
    ],
  },

  // 2. 告别短语 Farewells — 10
  {
    id: 'farewells',
    name: '告别短语',
    nameEn: 'Farewells',
    phrases: [
      { phrase: 'See you later!', translation: '一会儿见！', usage: '短时间内还会再见面时的道别。' },
      { phrase: 'Take care!', translation: '保重！', usage: '告别时表达关心，对朋友和长辈都适用。' },
      { phrase: 'Have a nice day!', translation: '祝你今天愉快！', usage: '白天分别时的祝福语，非常常用。' },
      { phrase: 'Good night!', translation: '晚安！', usage: '晚上道别的最后一句话，睡前也可以说。' },
      { phrase: 'See you tomorrow!', translation: '明天见！', usage: '确定第二天还会见面时使用。' },
      { phrase: 'Bye for now!', translation: '先拜拜啦！', usage: '比较随意的道别，暗示只是暂时分开。' },
      { phrase: 'Catch you later!', translation: '回头见！', usage: '非常口语化的告别，朋友之间使用。' },
      { phrase: 'Have a good one!', translation: '祝你愉快！', usage: '美式口语常用的道别祝福，轻松随意。' },
      { phrase: 'Talk to you soon!', translation: '回头再聊！', usage: '电话或网络聊天结束时常用。' },
      { phrase: "I've got to go now.", translation: '我得走了。', usage: '礼貌地告知对方自己要离开，比较正式。' },
    ],
  },

  // 3. 感谢短语 Thanks — 12
  {
    id: 'thanks',
    name: '感谢短语',
    nameEn: 'Thanks',
    phrases: [
      { phrase: 'Thank you very much!', translation: '非常感谢你！', usage: '表达真诚的谢意，语气较重。' },
      { phrase: 'Thanks a lot!', translation: '多谢了！', usage: '口语中常用的感谢，比thank you更随意。' },
      { phrase: 'I really appreciate it.', translation: '我真的很感激。', usage: '正式表达感谢，强调对方帮助的价值。', example: "Thanks for helping me move. I really appreciate it." },
      { phrase: "That's very kind of you.", translation: '你真好。', usage: '对别人的善意表示感谢和赞美。' },
      { phrase: 'Thanks anyway.', translation: '无论如何还是谢谢你。', usage: '虽然对方没能帮上忙，但仍然表示感谢。' },
      { phrase: 'You saved my day!', translation: '你真是帮了我大忙！', usage: '对方帮你解决了大麻烦时的感谢，语气夸张。' },
      { phrase: 'Much appreciated.', translation: '非常感谢。', usage: '简短正式的感谢表达，书面和口语都可用。' },
      { phrase: "I can't thank you enough.", translation: '我感激不尽。', usage: '强调感激之情难以用言语表达。' },
      { phrase: 'Cheers!', translation: '谢谢！/干杯！', usage: '英式口语中表示感谢，也可用于干杯。' },
      { phrase: 'Thanks for your help.', translation: '谢谢你的帮助。', usage: '直接明确地感谢对方的具体帮助。' },
      { phrase: 'You are the best!', translation: '你真是太好了！', usage: '用赞美的方式表达感谢，朋友间常用。' },
      { phrase: 'I owe you one.', translation: '我欠你一个人情。', usage: '朋友间表示感谢，暗示将来会回报。' },
    ],
  },

  // 4. 道歉短语 Apologies — 10
  {
    id: 'apologies',
    name: '道歉短语',
    nameEn: 'Apologies',
    phrases: [
      { phrase: "I'm sorry.", translation: '对不起。', usage: '最基本的道歉用语，通用各种场合。' },
      { phrase: 'I apologize.', translation: '我道歉。', usage: '比I\'m sorry更正式，适合正式场合。' },
      { phrase: "I'm terribly sorry.", translation: '非常抱歉。', usage: '强调歉意，语气更重。' },
      { phrase: 'Excuse me.', translation: '打扰一下。/不好意思。', usage: '轻微道歉，如从别人身边经过、打断别人等。' },
      { phrase: 'Pardon me.', translation: '请原谅。', usage: '比较正式的道歉或请求重复。' },
      { phrase: "It's my fault.", translation: '是我的错。', usage: '主动承担责任的道歉方式。' },
      { phrase: 'I feel bad about it.', translation: '我对此感到很抱歉。', usage: '表达内疚感，带有情感色彩。' },
      { phrase: 'Sorry about that.', translation: '那件事很抱歉。', usage: '对具体某件事表示歉意，比较随意。' },
      { phrase: 'I hope you can forgive me.', translation: '希望你能原谅我。', usage: '请求对方原谅，语气诚恳。' },
      { phrase: "My bad.", translation: '我的错。', usage: '非常口语化的道歉，年轻人和朋友间常用。' },
    ],
  },

  // 5. 请求短语 Requests — 12
  {
    id: 'requests',
    name: '请求短语',
    nameEn: 'Requests',
    phrases: [
      { phrase: 'Could you help me?', translation: '你能帮我一下吗？', usage: '礼貌地请求帮助，比can you更委婉。', example: "Could you help me carry this box?" },
      { phrase: 'Would you mind...?', translation: '你介意……吗？', usage: '非常礼貌的请求，后面接动名词。', example: "Would you mind closing the window?" },
      { phrase: 'Can I have...?', translation: '能给我……吗？', usage: '请求得到某物，餐厅、商店常用。' },
      { phrase: 'Please pass me...', translation: '请把……递给我。', usage: '餐桌上或办公场景请人递东西。' },
      { phrase: 'May I borrow...?', translation: '我可以借一下……吗？', usage: '礼貌地请求借用物品。' },
      { phrase: 'I was wondering if...', translation: '我想知道能不能……', usage: '非常委婉礼貌的请求，正式场合用。' },
      { phrase: 'Do you think you could...?', translation: '你觉得你能不能……？', usage: '客气地请求别人做某事。' },
      { phrase: 'Could I have a minute?', translation: '能耽误你一会儿吗？', usage: '请求对方抽出一点时间。' },
      { phrase: 'Give me a hand, will you?', translation: '帮我一把，行吗？', usage: '朋友间随意的请求帮忙。' },
      { phrase: 'Can you do me a favor?', translation: '能帮我个忙吗？', usage: '请求别人帮忙，口语常用。' },
      { phrase: 'Wait a second, please.', translation: '请稍等一下。', usage: '请求对方稍等，比较礼貌。' },
      { phrase: 'Hold on a moment.', translation: '稍等片刻。', usage: '电话中或让别人等一下时常用。' },
    ],
  },

  // 6. 同意短语 Agreement — 10
  {
    id: 'agreement',
    name: '同意短语',
    nameEn: 'Agreement',
    phrases: [
      { phrase: 'I agree.', translation: '我同意。', usage: '最直接的表示同意的说法。' },
      { phrase: 'Exactly!', translation: '完全正确！', usage: '强烈同意对方的观点。' },
      { phrase: "You're right.", translation: '你说得对。', usage: '认可对方的观点或判断。' },
      { phrase: 'I think so too.', translation: '我也这么认为。', usage: '表示自己与对方想法一致。' },
      { phrase: 'No problem!', translation: '没问题！', usage: '爽快地答应或同意请求。' },
      { phrase: 'Sure thing!', translation: '当然可以！', usage: '非常肯定地同意，语气轻松。' },
      { phrase: 'Absolutely!', translation: '绝对没错！', usage: '表示完全赞同，语气强烈。' },
      { phrase: 'That sounds great!', translation: '听起来很棒！', usage: '对建议或计划表示赞同和积极态度。' },
      { phrase: 'Count me in!', translation: '算我一个！', usage: '表示愿意参加某个活动或计划。' },
      { phrase: "I couldn't agree more.", translation: '我完全同意。', usage: '表示最大程度的赞同。' },
    ],
  },

  // 7. 反对短语 Disagreement — 8
  {
    id: 'disagreement',
    name: '反对短语',
    nameEn: 'Disagreement',
    phrases: [
      { phrase: "I don't think so.", translation: '我不这么认为。', usage: '比较委婉地表示不同意。' },
      { phrase: 'I beg to differ.', translation: '恕不能苟同。', usage: '比较正式礼貌的不同意见表达。' },
      { phrase: 'Not really.', translation: '不完全是。', usage: '委婉地否定，语气较温和。' },
      { phrase: "I'm afraid I disagree.", translation: '恐怕我不同意。', usage: '礼貌但明确地表示反对。' },
      { phrase: 'That might not be the best idea.', translation: '那可能不是最好的主意。', usage: '非常委婉地提出异议。' },
      { phrase: 'I see it differently.', translation: '我的看法不太一样。', usage: '礼貌地表达不同观点。' },
      { phrase: "I'm not sure about that.", translation: '对此我不太确定。', usage: '用不确定的方式委婉表达反对。' },
      { phrase: 'No way!', translation: '不可能！/不行！', usage: '强烈反对，语气很直接，熟人之间使用。' },
    ],
  },

  // 8. 赞美短语 Praise — 10
  {
    id: 'praise',
    name: '赞美短语',
    nameEn: 'Praise',
    phrases: [
      { phrase: 'You look great today!', translation: '你今天看起来真不错！', usage: '赞美对方的外表或精神状态。' },
      { phrase: 'Good job!', translation: '干得好！', usage: '表扬对方做得好，口语非常常用。' },
      { phrase: 'Well done!', translation: '做得好！', usage: '比good job稍正式，表扬完成得不错。' },
      { phrase: "You're amazing!", translation: '你太棒了！', usage: '表达强烈的赞美和佩服。' },
      { phrase: 'Nice work!', translation: '干得漂亮！', usage: '对工作或成果表示赞赏。' },
      { phrase: 'That was impressive!', translation: '真令人印象深刻！', usage: '对某事或某人的表现感到佩服。' },
      { phrase: 'You have a great sense of humor.', translation: '你真有幽默感。', usage: '赞美对方风趣幽默。' },
      { phrase: 'You are so talented!', translation: '你真有天赋！', usage: '赞美对方在某方面的才能。' },
      { phrase: 'I love your outfit!', translation: '我喜欢你的穿搭！', usage: '赞美对方的穿着打扮。' },
      { phrase: "You're doing fantastic!", translation: '你做得太棒了！', usage: '鼓励式的赞美，肯定对方的进展。' },
    ],
  },

  // 9. 鼓励短语 Encouragement — 10
  {
    id: 'encouragement',
    name: '鼓励短语',
    nameEn: 'Encouragement',
    phrases: [
      { phrase: 'You can do it!', translation: '你能行的！', usage: '最常用的鼓励语，给对方信心。' },
      { phrase: 'Keep going!', translation: '继续加油！', usage: '鼓励对方坚持下去不要放弃。' },
      { phrase: 'Never give up!', translation: '永远不要放弃！', usage: '鼓励对方坚持到底，语气强烈。' },
      { phrase: "Don't worry about it.", translation: '别担心。', usage: '安慰对方，减轻其焦虑。' },
      { phrase: 'Take it easy.', translation: '放松点。', usage: '让对方不要太紧张或压力太大。' },
      { phrase: 'Believe in yourself.', translation: '相信你自己。', usage: '鼓励对方建立自信。' },
      { phrase: "It's not the end of the world.", translation: '天不会塌下来。', usage: '安慰遇到挫折的人，让其看开。' },
      { phrase: 'Hang in there!', translation: '坚持住！', usage: '鼓励身处困境的人撑下去。' },
      { phrase: 'You are doing your best.', translation: '你已经尽力了。', usage: '安慰努力但结果不理想的人。' },
      { phrase: 'Everything will be fine.', translation: '一切都会好起来的。', usage: '安慰对方，传递乐观态度。' },
    ],
  },

  // 10. 建议短语 Suggestions — 12
  {
    id: 'suggestions',
    name: '建议短语',
    nameEn: 'Suggestions',
    phrases: [
      { phrase: 'Why not...?', translation: '为什么不……呢？', usage: '提出建议的轻松说法，语气不强迫。', example: "Why not take a break and have some tea?" },
      { phrase: 'How about...?', translation: '……怎么样？', usage: '提出建议或想法，征求对方意见。' },
      { phrase: 'You should...', translation: '你应该……', usage: '直接给出建议，语气较肯定。' },
      { phrase: "I suggest that you...", translation: '我建议你……', usage: '比较正式的建议表达。' },
      { phrase: 'What do you think of...?', translation: '你觉得……怎么样？', usage: '提出想法并询问对方意见。' },
      { phrase: 'Have you tried...?', translation: '你试过……吗？', usage: '委婉地建议对方尝试某种方法。' },
      { phrase: 'If I were you, I would...', translation: '如果我是你，我会……', usage: '站在对方角度给出建议，较委婉。' },
      { phrase: "Let's...", translation: '我们……吧。', usage: '提出共同行动的建议。' },
      { phrase: "You'd better...", translation: '你最好……', usage: '带有提醒意味的建议，语气较强。' },
      { phrase: 'Maybe you could...', translation: '也许你可以……', usage: '非常委婉的建议，留有余地。' },
      { phrase: 'I have a suggestion.', translation: '我有个建议。', usage: '正式地引出自己的建议。' },
      { phrase: 'Shall we...?', translation: '我们……好吗？', usage: '礼貌地提议一起做某事。' },
    ],
  },

  // 11. 询问短语 Inquiries — 10
  {
    id: 'inquiries',
    name: '询问短语',
    nameEn: 'Inquiries',
    phrases: [
      { phrase: "What's the matter?", translation: '怎么了？', usage: '关心对方，询问发生了什么事。' },
      { phrase: 'Could you tell me...?', translation: '你能告诉我……吗？', usage: '礼貌地询问信息。', example: "Could you tell me where the restroom is?" },
      { phrase: 'Do you know...?', translation: '你知道……吗？', usage: '向对方打听信息。' },
      { phrase: "What's going on?", translation: '发生什么事了？', usage: '询问正在发生的情况。' },
      { phrase: 'May I ask...?', translation: '我可以问一下……吗？', usage: '非常礼貌地提问，正式场合用。' },
      { phrase: "What do you mean?", translation: '你是什么意思？', usage: '请求对方解释清楚。' },
      { phrase: 'How does that work?', translation: '那个是怎么运作的？', usage: '询问事物的原理或操作方法。' },
      { phrase: 'Where can I find...?', translation: '我在哪里能找到……？', usage: '询问地点或位置。' },
      { phrase: "What's that for?", translation: '那是用来做什么的？', usage: '询问某物的用途。' },
      { phrase: 'When is the deadline?', translation: '截止日期是什么时候？', usage: '询问任务或工作的最后期限。' },
    ],
  },

  // 12. 情绪表达 Emotions — 12
  {
    id: 'emotions',
    name: '情绪表达',
    nameEn: 'Emotions',
    phrases: [
      { phrase: "I'm so happy!", translation: '我太开心了！', usage: '表达喜悦的心情。' },
      { phrase: "I'm really upset.", translation: '我真的很难过。', usage: '表达沮丧或心烦的情绪。' },
      { phrase: "I'm so excited!", translation: '我太激动了！', usage: '表达兴奋期待的心情。' },
      { phrase: "I'm a little nervous.", translation: '我有点紧张。', usage: '表达紧张不安的情绪。' },
      { phrase: "I'm really tired.", translation: '我真的很累。', usage: '表达疲惫的状态。' },
      { phrase: "I'm so angry right now.", translation: '我现在很生气。', usage: '表达愤怒的情绪。' },
      { phrase: "I'm surprised to hear that.", translation: '听到这个我很惊讶。', usage: '表达意外和惊讶。' },
      { phrase: "I'm a bit confused.", translation: '我有点困惑。', usage: '表达疑惑不解的心情。' },
      { phrase: "I'm really proud of you.", translation: '我真的为你感到骄傲。', usage: '表达为对方骄傲的情感。' },
      { phrase: "I feel bored.", translation: '我觉得很无聊。', usage: '表达无聊乏味的感觉。' },
      { phrase: "I'm worried about...", translation: '我担心……', usage: '表达担心忧虑的情绪。' },
      { phrase: "I'm relieved to hear that.", translation: '听到这个我就放心了。', usage: '表达松了一口气的感觉。' },
    ],
  },

  // 13. 电话用语 Phone — 10
  {
    id: 'phone',
    name: '电话用语',
    nameEn: 'Phone',
    phrases: [
      { phrase: 'Hello, this is... speaking.', translation: '你好，我是……', usage: '电话接通后表明自己身份的标准说法。' },
      { phrase: 'May I speak to...?', translation: '请让……接电话好吗？', usage: '礼貌地请求与某人通话。' },
      { phrase: 'Who is calling, please?', translation: '请问是哪位？', usage: '询问来电者是谁，礼貌用语。' },
      { phrase: "Hold on, please.", translation: '请稍等。', usage: '让对方不要挂电话，等待一下。' },
      { phrase: "I'm sorry, he's not in right now.", translation: '抱歉，他现在不在。', usage: '告知对方要找的人不在。' },
      { phrase: 'Can I take a message?', translation: '要我帮你捎个口信吗？', usage: '对方要找的人不在时询问是否留言。' },
      { phrase: 'Could you ask him to call me back?', translation: '你能让他给我回电话吗？', usage: '请对方转告回电话。' },
      { phrase: 'The line is busy.', translation: '电话占线。', usage: '表示对方正在通话中。' },
      { phrase: "Sorry, I can't hear you very well.", translation: '抱歉，我听不太清楚。', usage: '电话信号不好时使用。' },
      { phrase: "I think you've got the wrong number.", translation: '我想你打错电话了。', usage: '对方打错号码时礼貌告知。' },
    ],
  },

  // 14. 餐厅用语 Restaurant — 12
  {
    id: 'restaurant',
    name: '餐厅用语',
    nameEn: 'Restaurant',
    phrases: [
      { phrase: 'A table for two, please.', translation: '请安排两个人的座位。', usage: '进入餐厅后告诉服务员人数。' },
      { phrase: 'May I have the menu, please?', translation: '请给我菜单好吗？', usage: '入座后向服务员要菜单。' },
      { phrase: 'What do you recommend?', translation: '你有什么推荐吗？', usage: '请服务员推荐菜品。' },
      { phrase: 'I would like to order...', translation: '我想点……', usage: '正式点菜时的说法。' },
      { phrase: 'Could I have a glass of water?', translation: '能给我一杯水吗？', usage: '点餐时要求饮品。' },
      { phrase: 'This is delicious!', translation: '太好吃了！', usage: '赞美食物美味。' },
      { phrase: 'Check, please.', translation: '请结账。', usage: '用餐结束后要求买单。' },
      { phrase: 'Can I have the bill?', translation: '能给我账单吗？', usage: '英式说法，请求结账。' },
      { phrase: "It's on me.", translation: '这顿我请。', usage: '表示自己请客。' },
      { phrase: 'Let\'s split the bill.', translation: '我们分摊吧。', usage: '提议AA制付账。' },
      { phrase: 'Could you pack this up?', translation: '能把这个打包吗？', usage: '要求打包剩余食物。' },
      { phrase: 'The food was wonderful. Thank you!', translation: '食物很棒，谢谢！', usage: '离开时对服务和食物表示满意。' },
    ],
  },

  // 15. 购物用语 Shopping — 10
  {
    id: 'shopping',
    name: '购物用语',
    nameEn: 'Shopping',
    phrases: [
      { phrase: "I'm just looking.", translation: '我只是随便看看。', usage: '店员上前询问时礼貌回应。' },
      { phrase: 'Do you have this in a smaller size?', translation: '这个有小一号的吗？', usage: '询问衣服是否有其他尺码。', example: "Excuse me, do you have this in a smaller size?" },
      { phrase: 'How much is this?', translation: '这个多少钱？', usage: '询问价格的基本说法。' },
      { phrase: "That's too expensive.", translation: '太贵了。', usage: '觉得价格偏高时的表达。' },
      { phrase: 'Can I try it on?', translation: '我能试穿一下吗？', usage: '购买衣物时询问是否可以试穿。' },
      { phrase: 'Where is the fitting room?', translation: '试衣间在哪里？', usage: '询问试衣间的位置。' },
      { phrase: 'I\'ll take it.', translation: '我要买这个。', usage: '决定购买时的说法。' },
      { phrase: 'Do you accept credit cards?', translation: '你们接受信用卡吗？', usage: '询问付款方式。' },
      { phrase: 'Can I get a discount?', translation: '能便宜一点吗？', usage: '询问是否有折扣或讲价。' },
      { phrase: 'Can I have a receipt, please?', translation: '请给我收据好吗？', usage: '付款后索要收据。' },
    ],
  },
];

// ===== Computed =====
export const totalPhrases: number = spokenPhraseCategories.reduce(
  (sum: number, cat: PhraseCategory) => sum + cat.phrases.length,
  0
);

export const totalCategories: number = spokenPhraseCategories.length;
