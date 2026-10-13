import type { FC } from 'react';
import { SCENE_MAP } from './index';

const KEYWORD_RULES: { keywords: string[]; scene: string; priority: number }[] = [
  { keywords: ['panda', 'pandas', 'bamboo'], scene: 'panda', priority: 100 },
  { keywords: ['dog', 'dogs', 'puppy', 'puppies', 'bone'], scene: 'dog', priority: 100 },
  { keywords: ['cat', 'cats', 'kitten', 'kittens', 'yarn'], scene: 'cat', priority: 100 },
  { keywords: ['bird', 'birds', 'fly', 'feather', 'wing'], scene: 'bird', priority: 90 },
  { keywords: ['fish', 'fishes', 'swim', 'water', 'sea', 'ocean'], scene: 'fish', priority: 90 },
  { keywords: ['apple', 'apples', 'fruit', 'fruits'], scene: 'apple', priority: 95 },
  { keywords: ['banana', 'bananas'], scene: 'banana', priority: 95 },
  { keywords: ['food', 'eat', 'rice', 'noodle', 'bread', 'cake', 'pizza', 'hamburger', 'burger', 'sandwich'], scene: 'food', priority: 85 },
  { keywords: ['color', 'colors', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'], scene: 'colors', priority: 80 },
  { keywords: ['number', 'numbers', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'count'], scene: 'numbers', priority: 80 },
  { keywords: ['head', 'hand', 'eye', 'eyes', 'nose', 'ear', 'ears', 'mouth', 'face', 'foot', 'feet', 'finger', 'toe', 'body'], scene: 'body', priority: 85 },
  { keywords: ['hello', 'hi', 'goodbye', 'bye', 'thank', 'thanks', 'sorry', 'please', 'meet', 'greet'], scene: 'hello', priority: 90 },
  { keywords: ['birthday', 'cake', 'gift', 'present', 'party', 'celebrate'], scene: 'birthday', priority: 90 },
  { keywords: ['school', 'teacher', 'student', 'students', 'class', 'classroom', 'lesson', 'homework', 'book', 'books'], scene: 'classroom', priority: 95 },
  { keywords: ['read', 'reading', 'library', 'story', 'book'], scene: 'library', priority: 80 },
  { keywords: ['park', 'play', 'playground', 'swing', 'slide', 'kite', 'run', 'garden'], scene: 'park', priority: 85 },
  { keywords: ['sing', 'song', 'music', 'dance', 'piano', 'guitar'], scene: 'music', priority: 85 },
  { keywords: ['sport', 'sports', 'run', 'running', 'ball', 'soccer', 'football', 'basketball', 'race'], scene: 'sports', priority: 85 },
  { keywords: ['family', 'mom', 'mother', 'dad', 'father', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'sister', 'brother', 'baby', 'home', 'house'], scene: 'family', priority: 95 },
  { keywords: ['weather', 'sun', 'sunny', 'rain', 'rainy', 'cloud', 'cloudy', 'wind', 'windy', 'snow', 'snowy'], scene: 'weather', priority: 80 },
  { keywords: ['learn', 'study', 'pen', 'pencil', 'desk', 'study', 'english', 'word', 'words', 'write', 'writing'], scene: 'study', priority: 70 },
];

export function matchScene(sentence: string): string {
  const lower = sentence.toLowerCase();
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/);

  let bestScene = 'study';
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (words.includes(kw)) {
        score += rule.priority;
      } else if (lower.includes(kw)) {
        score += rule.priority * 0.6;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestScene = rule.scene;
    }
  }

  return bestScene;
}

export function getSceneComponent(sentence: string): FC {
  const sceneKey = matchScene(sentence);
  return SCENE_MAP[sceneKey] || SCENE_MAP.study;
}

export function getSceneComponentByKey(key: string): FC {
  return SCENE_MAP[key] || SCENE_MAP.study;
}
