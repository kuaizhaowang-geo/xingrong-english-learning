export interface SongAudio {
  title: string;
  type: 'mp3' | 'tts';
  url?: string;
  note?: string;
}

const SONG_AUDIO_MAP: Record<string, SongAudio> = {
  'ABC Song': {
    title: 'ABC Song',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/LJqvFveSQM',
  },
  'Bingo': {
    title: 'Bingo',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/VNwwtc3KJ7',
  },
  "If You're Happy and You Know It": {
    title: "If You're Happy and You Know It",
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/asuGc3BjUe',
  },
  'Twinkle Twinkle Little Star': {
    title: 'Twinkle Twinkle Little Star',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/kv8xYJpz6n',
  },
  "I'm a Little Teapot": {
    title: "I'm a Little Teapot",
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/YUujWjhdNN',
  },
  'Hickory Dickory Dock': {
    title: 'Hickory Dickory Dock',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/Um7vaLmofk',
  },
  'Mary Had a Little Lamb': {
    title: 'Mary Had a Little Lamb',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/zsdbaVy4JU',
  },
  'One Two Buckle My Shoe': {
    title: 'One Two Buckle My Shoe',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/kZhjOdr58X',
  },
  'Hush Little Baby': {
    title: 'Hush Little Baby',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/tbs0fOlInU',
  },
  'Head Shoulders Knees and Toes': {
    title: 'Head Shoulders Knees and Toes',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/y4CMPF46nB',
  },
  'Are You Sleeping': {
    title: 'Are You Sleeping',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/xCCtlfFYyO',
  },
  'Hokey Pokey': {
    title: 'Hokey Pokey',
    type: 'mp3',
    url: 'https://aka.doubaocdn.com/s/sdYUWVo0Dm',
  },
  'Old MacDonald Had a Farm': {
    title: 'Old MacDonald Had a Farm',
    type: 'tts',
    note: 'TTS朗读',
  },
  'Row Row Row Your Boat': {
    title: 'Row Row Row Your Boat',
    type: 'tts',
    note: 'TTS朗读',
  },
  'The Wheels on the Bus': {
    title: 'The Wheels on the Bus',
    type: 'tts',
    note: 'TTS朗读',
  },
  'London Bridge Is Falling Down': {
    title: 'London Bridge Is Falling Down',
    type: 'tts',
    note: 'TTS朗读',
  },
  'Rain Rain Go Away': {
    title: 'Rain Rain Go Away',
    type: 'tts',
    note: 'TTS朗读',
  },
  'Five Little Ducks': {
    title: 'Five Little Ducks',
    type: 'tts',
    note: 'TTS朗读',
  },
  'Five Little Monkeys': {
    title: 'Five Little Monkeys',
    type: 'tts',
    note: 'TTS朗读',
  },
  'This Little Piggy': {
    title: 'This Little Piggy',
    type: 'tts',
    note: 'TTS朗读',
  },
};

export const getSongAudio = (title: string): SongAudio => {
  const normalized = title.trim();
  if (SONG_AUDIO_MAP[normalized]) return SONG_AUDIO_MAP[normalized];
  const key = Object.keys(SONG_AUDIO_MAP).find(
    (k) => k.toLowerCase() === normalized.toLowerCase(),
  );
  if (key) return SONG_AUDIO_MAP[key];
  return { title: normalized, type: 'tts', note: 'TTS朗读' };
};
