// src/services/library/adapters/color-names.ts
// PURPOSE: Color Names adapter for multilingual color vocabulary (🟢 Commercial Safe)
// ACTION: Provides color names in multiple languages for vocabulary learning
// MECHANISM: Static data with hex codes and translations

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

// Color data with translations
export const COLOR_DATA = [
  // Basic colors
  { hex: '#FF0000', en: 'Red', fr: 'Rouge', de: 'Rot', es: 'Rojo', it: 'Rosso', ja: '赤 (あか)', zh: '红色', ko: '빨간색' },
  { hex: '#FFA500', en: 'Orange', fr: 'Orange', de: 'Orange', es: 'Naranja', it: 'Arancione', ja: 'オレンジ', zh: '橙色', ko: '주황색' },
  { hex: '#FFFF00', en: 'Yellow', fr: 'Jaune', de: 'Gelb', es: 'Amarillo', it: 'Giallo', ja: '黄色 (きいろ)', zh: '黄色', ko: '노란색' },
  { hex: '#00FF00', en: 'Green', fr: 'Vert', de: 'Grün', es: 'Verde', it: 'Verde', ja: '緑 (みどり)', zh: '绿色', ko: '초록색' },
  { hex: '#0000FF', en: 'Blue', fr: 'Bleu', de: 'Blau', es: 'Azul', it: 'Blu', ja: '青 (あお)', zh: '蓝色', ko: '파란색' },
  { hex: '#800080', en: 'Purple', fr: 'Violet', de: 'Lila', es: 'Púrpura', it: 'Viola', ja: '紫 (むらさき)', zh: '紫色', ko: '보라색' },
  { hex: '#FFC0CB', en: 'Pink', fr: 'Rose', de: 'Rosa', es: 'Rosa', it: 'Rosa', ja: 'ピンク', zh: '粉红色', ko: '분홍색' },
  { hex: '#A52A2A', en: 'Brown', fr: 'Marron', de: 'Braun', es: 'Marrón', it: 'Marrone', ja: '茶色 (ちゃいろ)', zh: '棕色', ko: '갈색' },
  { hex: '#000000', en: 'Black', fr: 'Noir', de: 'Schwarz', es: 'Negro', it: 'Nero', ja: '黒 (くろ)', zh: '黑色', ko: '검은색' },
  { hex: '#FFFFFF', en: 'White', fr: 'Blanc', de: 'Weiß', es: 'Blanco', it: 'Bianco', ja: '白 (しろ)', zh: '白色', ko: '흰색' },
  { hex: '#808080', en: 'Gray', fr: 'Gris', de: 'Grau', es: 'Gris', it: 'Grigio', ja: '灰色 (はいいろ)', zh: '灰色', ko: '회색' },
  // Extended colors
  { hex: '#00FFFF', en: 'Cyan', fr: 'Cyan', de: 'Cyan', es: 'Cian', it: 'Ciano', ja: 'シアン', zh: '青色', ko: '청록색' },
  { hex: '#FF00FF', en: 'Magenta', fr: 'Magenta', de: 'Magenta', es: 'Magenta', it: 'Magenta', ja: 'マゼンタ', zh: '品红', ko: '자홍색' },
  { hex: '#008000', en: 'Dark Green', fr: 'Vert foncé', de: 'Dunkelgrün', es: 'Verde oscuro', it: 'Verde scuro', ja: '深緑', zh: '深绿色', ko: '진녹색' },
  { hex: '#000080', en: 'Navy', fr: 'Bleu marine', de: 'Marineblau', es: 'Azul marino', it: 'Blu navy', ja: '紺', zh: '海军蓝', ko: '남색' },
  { hex: '#FFD700', en: 'Gold', fr: 'Or', de: 'Gold', es: 'Dorado', it: 'Oro', ja: '金 (きん)', zh: '金色', ko: '금색' },
  { hex: '#C0C0C0', en: 'Silver', fr: 'Argent', de: 'Silber', es: 'Plata', it: 'Argento', ja: '銀 (ぎん)', zh: '银色', ko: '은색' },
  { hex: '#FF6347', en: 'Tomato', fr: 'Tomate', de: 'Tomatenrot', es: 'Tomate', it: 'Pomodoro', ja: 'トマト', zh: '番茄红', ko: '토마토색' },
  { hex: '#00CED1', en: 'Turquoise', fr: 'Turquoise', de: 'Türkis', es: 'Turquesa', it: 'Turchese', ja: 'ターコイズ', zh: '绿松石', ko: '청록색' },
  { hex: '#E6E6FA', en: 'Lavender', fr: 'Lavande', de: 'Lavendel', es: 'Lavanda', it: 'Lavanda', ja: 'ラベンダー', zh: '薰衣草色', ko: '라벤더색' },
  { hex: '#F5F5DC', en: 'Beige', fr: 'Beige', de: 'Beige', es: 'Beige', it: 'Beige', ja: 'ベージュ', zh: '米色', ko: '베이지색' },
  { hex: '#8B0000', en: 'Dark Red', fr: 'Rouge foncé', de: 'Dunkelrot', es: 'Rojo oscuro', it: 'Rosso scuro', ja: '暗い赤', zh: '深红色', ko: '진빨간색' },
  { hex: '#2F4F4F', en: 'Dark Slate Gray', fr: 'Gris ardoise foncé', de: 'Dunkles Schiefergrau', es: 'Gris pizarra oscuro', it: 'Grigio ardesia scuro', ja: '暗いスレートグレー', zh: '深板岩灰', ko: '어두운 슬레이트 회색' },
  { hex: '#BC8F8F', en: 'Rosy Brown', fr: 'Brun rosé', de: 'Rosiges Braun', es: 'Marrón rosado', it: 'Marrone rosato', ja: 'ロージーブラウン', zh: '玫瑰褐', ko: '장미빛 갈색' },
];

export const colorNamesAdapter: LibraryAdapter = {
  sourceId: 'color-names',
  displayName: 'Color Vocabulary',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    
    return COLOR_DATA
      .filter(color => 
        color.en.toLowerCase().includes(q) ||
        color.fr.toLowerCase().includes(q) ||
        color.hex.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map(color => ({
        id: color.hex,
        title: color.en,
        subtitle: `${color.fr} • ${color.de} • ${color.es}`,
        meta: {
          hex: color.hex,
        },
      }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, randomCount = 12 } = config;
    
    let colors: typeof COLOR_DATA = [];
    
    if (selectedId) {
      const color = COLOR_DATA.find(c => c.hex === selectedId);
      if (color) colors = [color];
    } else {
      // Random selection
      const shuffled = [...COLOR_DATA].sort(() => Math.random() - 0.5);
      colors = shuffled.slice(0, randomCount);
    }
    
    if (!colors.length) {
      colors = COLOR_DATA.slice(0, randomCount);
    }
    
    // Build lines
    const lines: IngestedLine[] = [];
    
    // Title
    lines.push({
      id: 'colors-title',
      type: 'heading',
      L1: '🎨 Color Vocabulary',
      L2: '',
    });
    
    lines.push({
      id: 'colors-subtitle',
      type: 'text',
      L1: `${colors.length} colors in 8 languages`,
      L2: '',
    });
    
    lines.push({
      id: 'colors-sep',
      type: 'separator',
      L1: '',
      L2: '',
    });
    
    // Each color
    colors.forEach((color, idx) => {
      // Color swatch (represented by hex)
      lines.push({
        id: `color-${idx}-swatch`,
        type: 'text',
        L1: `■ ${color.hex}`,
        L2: '',
        meta: {
          hex: color.hex,
          colorName: color.en,
        },
      });
      
      // English name as heading
      lines.push({
        id: `color-${idx}-en`,
        type: 'heading',
        L1: color.en,
        L2: '',
      });
      
      // European languages
      lines.push({
        id: `color-${idx}-eu`,
        type: 'text',
        L1: `🇫🇷 ${color.fr} | 🇩🇪 ${color.de} | 🇪🇸 ${color.es} | 🇮🇹 ${color.it}`,
        L2: '',
      });
      
      // Asian languages
      lines.push({
        id: `color-${idx}-asia`,
        type: 'text',
        L1: `🇯🇵 ${color.ja} | 🇨🇳 ${color.zh} | 🇰🇷 ${color.ko}`,
        L2: '',
      });
      
      // Separator
      if (idx < colors.length - 1) {
        lines.push({
          id: `color-${idx}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
      }
    });
    
    const page: IngestedPage = {
      id: 'page-colors',
      number: 1,
      title: 'Color Vocabulary',
      lines,
    };
    
    return {
      title: `Color Vocabulary (${colors.length} colors)`,
      description: 'Multilingual color names for vocabulary learning',
      sourceLang: 'en',
      layout: 'flashcard',
      pages: [page],
      meta: {
        source: 'Synoptic Color Database',
        sourceUrl: 'https://getsynoptic.com',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
        license: {
          type: 'commercial-safe',
          name: 'Public Domain',
        },
      },
    };
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const sampleColors = COLOR_DATA.slice(0, 4);
    
    return {
      title: 'Color Vocabulary',
      description: 'Multilingual color names',
      pages: [{
        id: 'preview',
        lines: sampleColors.map((color, i) => ({
          id: `preview-${i}`,
          type: 'text' as const,
          L1: `${color.en} • ${color.fr} • ${color.ja}`,
          L2: '',
          meta: {
            hex: color.hex,
          },
        })),
      }],
    };
  },
};

export default colorNamesAdapter;
