export const STYLE_PRESETS: Record<string, { name: string; suffix: string }> = {
  cartoon_kids: {
    name: '儿童卡通',
    suffix:
      '儿童卡通插画风格，明亮柔和的色彩，简洁干净的背景，可爱的角色设计，适合小学生英语学习，扁平化设计，高质量插画，无文字，无字母，无符号',
  },
  watercolor: {
    name: '水彩手绘',
    suffix:
      '水彩手绘风格，柔和晕染效果，温暖色调，简洁背景，儿童绘本风格，无文字，无字母，无符号',
  },
  '3d_render': {
    name: '3D渲染',
    suffix:
      '3D卡通渲染风格，皮克斯风格，柔和光照，干净背景，可爱角色，高质量，无文字，无字母，无符号',
  },
  flat_vector: {
    name: '扁平矢量',
    suffix:
      '扁平矢量插画风格，简洁几何图形，明亮色彩，现代设计，干净背景，无文字，无字母，无符号',
  },
  pixel_art: {
    name: '像素艺术',
    suffix:
      '像素艺术风格，复古游戏画面，鲜艳色彩，简洁构图，儿童友好，无文字，无字母，无符号',
  },
};

export function buildPrompt(
  content: string,
  translation?: string,
  stylePreset = 'cartoon_kids',
  customPrompt?: string,
): string {
  const parts: string[] = [];

  if (customPrompt && customPrompt.trim()) {
    parts.push(customPrompt.trim());
  } else {
    // 内容描述
    if (translation && translation.trim()) {
      parts.push(
        `一幅描绘"${content}"（${translation.trim()}）的英语学习插图`,
      );
    } else {
      parts.push(`一幅描绘"${content}"的英语学习插图`);
    }
  }

  // 风格后缀
  const preset = STYLE_PRESETS[stylePreset] ?? STYLE_PRESETS.cartoon_kids;
  parts.push(preset.suffix);

  return parts.join('，');
}
