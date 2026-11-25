import {SpriteConfig} from './utils/helper';

/**
 * Configuration for India Atlas.
 */
export const CONFIG = {
  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },
  title: {
    value: 'India Atlas',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Theme & Palette (Strict 3-Color Minimalist Light Theme)
  backgroundColor: {
    value: '#F6F4EF',
    type: 'color',
    label: 'Light Base Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#1E7F74',
    type: 'color',
    label: 'Signature Mineral Teal Accent',
    group: 'THEME',
  },
  inkColor: {
    value: '#1E293B',
    type: 'color',
    label: 'Deep Charcoal Slate Ink',
    group: 'THEME',
  },
  borderStrokeColor: {
    value: 'rgba(30, 41, 59, 0.24)',
    type: 'color',
    label: 'State Border Stroke Color',
    group: 'THEME',
  },
  fontFamily: {
    value: '"Plus Jakarta Sans", "DM Sans", system-ui, sans-serif',
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio
  defaultMusicVolume: {
    value: 0.2,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Quiz Rules & Estimation Mechanics
  minQuestionsPerQuiz: {
    value: 5,
    type: 'number',
    label: 'Min Questions Per Quiz',
    group: 'Rules',
  },
  maxQuestionsPerQuiz: {
    value: 10,
    type: 'number',
    label: 'Max Questions Per Quiz',
    group: 'Rules',
  },
  maxDistanceKm: {
    value: 6000,
    type: 'number',
    label: 'Max Slider Distance (km)',
    group: 'Rules',
  },
  defaultGuessKm: {
    value: 1500,
    type: 'number',
    label: 'Default Slider Distance (km)',
    group: 'Rules',
  },
  perfectAccuracyThreshold: {
    value: 90,
    type: 'number',
    label: '1000-Pt Accuracy Threshold (%)',
    group: 'Rules',
  },
  maxQuestionRating: {
    value: 1000,
    type: 'number',
    label: 'Max Rating Per Question',
    group: 'Rules',
  },
  keyboardStepKm: {
    value: 10,
    type: 'number',
    label: 'Arrow Key Step (km)',
    group: 'Rules',
  },
  keyboardShiftStepKm: {
    value: 100,
    type: 'number',
    label: 'Shift+Arrow Key Step (km)',
    group: 'Rules',
  },
  revealAnimationDuration: {
    value: 0.55,
    type: 'number',
    label: 'Line Reveal Duration (s)',
    group: 'Visuals',
  },

  // Asset Dimensions & Aspect Ratios (from read_assets_metadata)
  assetAtlasBackdropAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Atlas Backdrop Aspect Ratio',
    group: 'ASSETS',
  },
  assetAtlasBackdropWidth: {
    value: 1376,
    type: 'number',
    label: 'Atlas Backdrop Width',
    group: 'ASSETS',
  },
  assetAtlasBackdropHeight: {
    value: 768,
    type: 'number',
    label: 'Atlas Backdrop Height',
    group: 'ASSETS',
  },
  assetCityPinAspectRatio: {
    value: 394 / 618,
    type: 'number',
    label: 'City Pin Aspect Ratio',
    group: 'ASSETS',
  },
  assetCityPinWidth: {
    value: 30,
    type: 'number',
    label: 'City Pin Draw Width',
    group: 'ASSETS',
  },
  assetCityPinHeight: {
    value: 30 / (394 / 618),
    type: 'number',
    label: 'City Pin Draw Height',
    group: 'ASSETS',
  },
  assetCompassRoseAspectRatio: {
    value: 588 / 588,
    type: 'number',
    label: 'Compass Rose Aspect Ratio',
    group: 'ASSETS',
  },
  assetCompassRoseWidth: {
    value: 84,
    type: 'number',
    label: 'Compass Rose Draw Width',
    group: 'ASSETS',
  },
  assetCompassRoseHeight: {
    value: 84,
    type: 'number',
    label: 'Compass Rose Draw Height',
    group: 'ASSETS',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

/**
 * Optional presets
 */
export const PRESETS = {};

export const THEME = {
  // Core 3 Colors
  alabaster: '#F6F4EF',
  cardBg: '#FAF9F6',
  whiteCard: '#FFFFFF',
  neighborTerrain: '#EAE6DC',
  ink: '#1E293B',
  teal: '#1E7F74',
  mintTint: '#E0F0EE',

  // Derived Tints & Opacities (exclusively from the 3 core colors)
  stateFills: ['#FAF9F6', '#FFFFFF', '#F7F5F0', '#FCFBF8', '#F4F1EA'],
  stateStroke: 'rgba(30, 41, 59, 0.24)',
  neighborStroke: 'rgba(30, 41, 59, 0.16)',
  neighborLabel: 'rgba(30, 41, 59, 0.55)',
  sovereignBorder: 'rgba(30, 41, 59, 0.72)',
  sovereignShadow: 'rgba(30, 41, 59, 0.08)',
  graticuleStroke: 'rgba(30, 41, 59, 0.05)',
  graticuleLabel: 'rgba(30, 41, 59, 0.36)',
  waterLabel: 'rgba(30, 41, 59, 0.22)',
  cityDot: 'rgba(30, 41, 59, 0.55)',
  cityDotSecondary: 'rgba(30, 41, 59, 0.32)',
  cityRing: 'rgba(30, 41, 59, 0.14)',
  cityHover: '#1E7F74',
  tealWash: 'rgba(30, 127, 116, 0.12)',
  tealGlow: 'rgba(30, 127, 116, 0.22)',
  fontDisplay: '"Plus Jakarta Sans", "DM Sans", system-ui, sans-serif',
  fontMono: '"DM Sans", "Plus Jakarta Sans", system-ui, sans-serif',
};
