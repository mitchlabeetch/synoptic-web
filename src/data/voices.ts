// src/data/voices.ts
// PURPOSE: Centralized mapping of language codes to Edge TTS Neural Voices
// ACTION: Provides voice selection for audiobook generation and in-app pronunciation
// MECHANISM: Maps ISO language codes to Microsoft Neural Voice IDs for high-quality synthesis

export interface VoiceOption {
  id: string;           // The Edge TTS ID (e.g., 'fr-FR-VivienneNeural')
  name: string;         // Human readable (e.g., 'Vivienne')
  gender: 'Female' | 'Male';
  lang: string;         // ISO code matches languages.ts
  region?: string;      // Optional region specifier
}

// ═══════════════════════════════════════════
// EDGE TTS NEURAL VOICES (CURATED LIST)
// High-quality voices mapped to all supported languages
// ═══════════════════════════════════════════

export const EDGE_VOICES: Record<string, VoiceOption[]> = {
  // ─────────────────────────────────────────
  // ROMANCE LANGUAGES
  // ─────────────────────────────────────────
  'fr': [
    { id: 'fr-FR-VivienneMultilingualNeural', name: 'Vivienne', gender: 'Female', lang: 'fr', region: 'France' },
    { id: 'fr-FR-HenriNeural', name: 'Henri', gender: 'Male', lang: 'fr', region: 'France' },
    { id: 'fr-FR-DeniseNeural', name: 'Denise', gender: 'Female', lang: 'fr', region: 'France' },
    { id: 'fr-CA-SylvieNeural', name: 'Sylvie (QC)', gender: 'Female', lang: 'fr', region: 'Canada' },
  ],
  'es': [
    { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Female', lang: 'es', region: 'Spain' },
    { id: 'es-ES-AlvaroNeural', name: 'Alvaro', gender: 'Male', lang: 'es', region: 'Spain' },
    { id: 'es-MX-DaliaNeural', name: 'Dalia (MX)', gender: 'Female', lang: 'es', region: 'Mexico' },
    { id: 'es-MX-JorgeNeural', name: 'Jorge (MX)', gender: 'Male', lang: 'es', region: 'Mexico' },
  ],
  'it': [
    { id: 'it-IT-ElsaNeural', name: 'Elsa', gender: 'Female', lang: 'it' },
    { id: 'it-IT-DiegoNeural', name: 'Diego', gender: 'Male', lang: 'it' },
    { id: 'it-IT-IsabellaNeural', name: 'Isabella', gender: 'Female', lang: 'it' },
  ],
  'pt': [
    { id: 'pt-PT-RaquelNeural', name: 'Raquel', gender: 'Female', lang: 'pt', region: 'Portugal' },
    { id: 'pt-PT-DuarteNeural', name: 'Duarte', gender: 'Male', lang: 'pt', region: 'Portugal' },
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (BR)', gender: 'Female', lang: 'pt', region: 'Brazil' },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (BR)', gender: 'Male', lang: 'pt', region: 'Brazil' },
  ],
  'ro': [
    { id: 'ro-RO-AlinaNeural', name: 'Alina', gender: 'Female', lang: 'ro' },
    { id: 'ro-RO-EmilNeural', name: 'Emil', gender: 'Male', lang: 'ro' },
  ],
  'ca': [
    { id: 'ca-ES-JoanaNeural', name: 'Joana', gender: 'Female', lang: 'ca' },
    { id: 'ca-ES-EnricNeural', name: 'Enric', gender: 'Male', lang: 'ca' },
  ],

  // ─────────────────────────────────────────
  // GERMANIC LANGUAGES
  // ─────────────────────────────────────────
  'en': [
    { id: 'en-US-AriaNeural', name: 'Aria (US)', gender: 'Female', lang: 'en', region: 'USA' },
    { id: 'en-US-GuyNeural', name: 'Guy (US)', gender: 'Male', lang: 'en', region: 'USA' },
    { id: 'en-US-JennyNeural', name: 'Jenny (US)', gender: 'Female', lang: 'en', region: 'USA' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', gender: 'Female', lang: 'en', region: 'UK' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', gender: 'Male', lang: 'en', region: 'UK' },
    { id: 'en-AU-NatashaNeural', name: 'Natasha (AU)', gender: 'Female', lang: 'en', region: 'Australia' },
  ],
  'de': [
    { id: 'de-DE-KatjaNeural', name: 'Katja', gender: 'Female', lang: 'de', region: 'Germany' },
    { id: 'de-DE-ConradNeural', name: 'Conrad', gender: 'Male', lang: 'de', region: 'Germany' },
    { id: 'de-AT-IngridNeural', name: 'Ingrid (AT)', gender: 'Female', lang: 'de', region: 'Austria' },
    { id: 'de-CH-LeniNeural', name: 'Leni (CH)', gender: 'Female', lang: 'de', region: 'Switzerland' },
  ],
  'nl': [
    { id: 'nl-NL-ColetteNeural', name: 'Colette', gender: 'Female', lang: 'nl' },
    { id: 'nl-NL-MaartenNeural', name: 'Maarten', gender: 'Male', lang: 'nl' },
  ],
  'fi': [
    { id: 'fi-FI-NooraNeural', name: 'Noora', gender: 'Female', lang: 'fi' },
    { id: 'fi-FI-HarriNeural', name: 'Harri', gender: 'Male', lang: 'fi' },
  ],
  'sv': [
    { id: 'sv-SE-SofieNeural', name: 'Sofie', gender: 'Female', lang: 'sv' },
    { id: 'sv-SE-MattiasNeural', name: 'Mattias', gender: 'Male', lang: 'sv' },
  ],
  'da': [
    { id: 'da-DK-ChristelNeural', name: 'Christel', gender: 'Female', lang: 'da' },
    { id: 'da-DK-JeppeNeural', name: 'Jeppe', gender: 'Male', lang: 'da' },
  ],
  'no': [
    { id: 'nb-NO-PernilleNeural', name: 'Pernille', gender: 'Female', lang: 'no' },
    { id: 'nb-NO-FinnNeural', name: 'Finn', gender: 'Male', lang: 'no' },
  ],

  // ─────────────────────────────────────────
  // SLAVIC LANGUAGES
  // ─────────────────────────────────────────
  'ru': [
    { id: 'ru-RU-SvetlanaNeural', name: 'Svetlana', gender: 'Female', lang: 'ru' },
    { id: 'ru-RU-DmitryNeural', name: 'Dmitry', gender: 'Male', lang: 'ru' },
  ],
  'hu': [
    { id: 'hu-HU-NoemiNeural', name: 'Noémi', gender: 'Female', lang: 'hu' },
    { id: 'hu-HU-TamasNeural', name: 'Tamás', gender: 'Male', lang: 'hu' },
  ],
  'pl': [
    { id: 'pl-PL-AgnieszkaNeural', name: 'Agnieszka', gender: 'Female', lang: 'pl' },
    { id: 'pl-PL-MarekNeural', name: 'Marek', gender: 'Male', lang: 'pl' },
  ],
  'cs': [
    { id: 'cs-CZ-VlastaNeural', name: 'Vlasta', gender: 'Female', lang: 'cs' },
    { id: 'cs-CZ-AntoninNeural', name: 'Antonín', gender: 'Male', lang: 'cs' },
  ],
  'uk': [
    { id: 'uk-UA-PolinaNeural', name: 'Polina', gender: 'Female', lang: 'uk' },
    { id: 'uk-UA-OstapNeural', name: 'Ostap', gender: 'Male', lang: 'uk' },
  ],

  // ─────────────────────────────────────────
  // SEMITIC & RTL LANGUAGES
  // ─────────────────────────────────────────
  'ar': [
    { id: 'ar-SA-ZariyahNeural', name: 'Zariyah', gender: 'Female', lang: 'ar', region: 'Saudi Arabia' },
    { id: 'ar-SA-HamedNeural', name: 'Hamed', gender: 'Male', lang: 'ar', region: 'Saudi Arabia' },
    { id: 'ar-EG-SalmaNeural', name: 'Salma (EG)', gender: 'Female', lang: 'ar', region: 'Egypt' },
  ],
  'he': [
    { id: 'he-IL-HilaNeural', name: 'Hila', gender: 'Female', lang: 'he' },
    { id: 'he-IL-AvriNeural', name: 'Avri', gender: 'Male', lang: 'he' },
  ],
  'fa': [
    { id: 'fa-IR-DilaraNeural', name: 'Dilara', gender: 'Female', lang: 'fa' },
    { id: 'fa-IR-FaridNeural', name: 'Farid', gender: 'Male', lang: 'fa' },
  ],

  // ─────────────────────────────────────────
  // CJK LANGUAGES
  // ─────────────────────────────────────────
  'zh': [
    { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao', gender: 'Female', lang: 'zh', region: 'Mainland' },
    { id: 'zh-CN-YunxiNeural', name: 'Yunxi', gender: 'Male', lang: 'zh', region: 'Mainland' },
    { id: 'zh-CN-XiaoyiNeural', name: 'Xiaoyi', gender: 'Female', lang: 'zh', region: 'Mainland' },
  ],
  'zh-TW': [
    { id: 'zh-TW-HsiaoChenNeural', name: 'HsiaoChen', gender: 'Female', lang: 'zh-TW', region: 'Taiwan' },
    { id: 'zh-TW-YunJheNeural', name: 'YunJhe', gender: 'Male', lang: 'zh-TW', region: 'Taiwan' },
  ],
  'ja': [
    { id: 'ja-JP-NanamiNeural', name: 'Nanami', gender: 'Female', lang: 'ja' },
    { id: 'ja-JP-KeitaNeural', name: 'Keita', gender: 'Male', lang: 'ja' },
    { id: 'ja-JP-AoiNeural', name: 'Aoi', gender: 'Female', lang: 'ja' },
  ],
  'ko': [
    { id: 'ko-KR-SunHiNeural', name: 'SunHi', gender: 'Female', lang: 'ko' },
    { id: 'ko-KR-InJoonNeural', name: 'InJoon', gender: 'Male', lang: 'ko' },
  ],

  // ─────────────────────────────────────────
  // OTHER MAJOR LANGUAGES
  // ─────────────────────────────────────────
  'el': [
    { id: 'el-GR-AthinaNeural', name: 'Athina', gender: 'Female', lang: 'el' },
    { id: 'el-GR-NestorasNeural', name: 'Nestoras', gender: 'Male', lang: 'el' },
  ],
  'tr': [
    { id: 'tr-TR-EmelNeural', name: 'Emel', gender: 'Female', lang: 'tr' },
    { id: 'tr-TR-AhmetNeural', name: 'Ahmet', gender: 'Male', lang: 'tr' },
  ],
  'hi': [
    { id: 'hi-IN-SwaraNeural', name: 'Swara', gender: 'Female', lang: 'hi' },
    { id: 'hi-IN-MadhurNeural', name: 'Madhur', gender: 'Male', lang: 'hi' },
  ],
  'vi': [
    { id: 'vi-VN-HoaiMyNeural', name: 'HoaiMy', gender: 'Female', lang: 'vi' },
    { id: 'vi-VN-NamMinhNeural', name: 'NamMinh', gender: 'Male', lang: 'vi' },
  ],
  'th': [
    { id: 'th-TH-PremwadeeNeural', name: 'Premwadee', gender: 'Female', lang: 'th' },
    { id: 'th-TH-NiwatNeural', name: 'Niwat', gender: 'Male', lang: 'th' },
  ],
  'id': [
    { id: 'id-ID-GadisNeural', name: 'Gadis', gender: 'Female', lang: 'id' },
    { id: 'id-ID-ArdiNeural', name: 'Ardi', gender: 'Male', lang: 'id' },
  ],

  // ─────────────────────────────────────────
  // CLASSICAL LANGUAGES (Fallback to closest modern)
  // ─────────────────────────────────────────
  'la': [
    // Latin uses Italian voices as closest living descendant
    { id: 'it-IT-DiegoNeural', name: 'Diego (Classical)', gender: 'Male', lang: 'la' },
    { id: 'it-IT-ElsaNeural', name: 'Elsa (Classical)', gender: 'Female', lang: 'la' },
  ],
  'grc': [
    // Ancient Greek uses Modern Greek voices
    { id: 'el-GR-NestorasNeural', name: 'Nestoras (Attic)', gender: 'Male', lang: 'grc' },
    { id: 'el-GR-AthinaNeural', name: 'Athina (Attic)', gender: 'Female', lang: 'grc' },
  ],
};

// ═══════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════

/**
 * Get available voices for a given language code.
 * Falls back to English if the language isn't directly supported.
 */
export const getVoicesForLang = (langCode: string): VoiceOption[] => {
  // Direct match
  if (EDGE_VOICES[langCode]) {
    return EDGE_VOICES[langCode];
  }
  
  // Try root language code (e.g., 'es-MX' -> 'es')
  const root = langCode.split('-')[0];
  if (EDGE_VOICES[root]) {
    return EDGE_VOICES[root];
  }
  
  // Fallback to English
  return EDGE_VOICES['en'];
};

/**
 * Get the default voice for a language (first in the list).
 */
export const getDefaultVoice = (langCode: string): VoiceOption | undefined => {
  const voices = getVoicesForLang(langCode);
  return voices[0];
};

/**
 * Validate if a voice ID exists in our allowlist.
 */
export const isValidVoiceId = (voiceId: string): boolean => {
  const allVoices = Object.values(EDGE_VOICES).flat();
  return allVoices.some(v => v.id === voiceId);
};

/**
 * Extract locale from voice ID (e.g., 'fr-FR-VivienneNeural' -> 'fr-FR')
 */
export const getLocaleFromVoiceId = (voiceId: string): string => {
  const parts = voiceId.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return 'en-US';
};
