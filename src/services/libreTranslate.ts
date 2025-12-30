// src/services/libreTranslate.ts
// PURPOSE: AI Translation service using LibreTranslate API
// ACTION: Provides free/self-hostable machine translation for bilingual editing
// MECHANISM: REST API calls to LibreTranslate (public or self-hosted)

// Public instance (rate-limited) - consider self-hosting for production
const LIBRE_TRANSLATE_URL = process.env.NEXT_PUBLIC_LIBRE_TRANSLATE_URL || 'https://libretranslate.com';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: {
    language: string;
    confidence: number;
  };
}

export interface LanguageInfo {
  code: string;
  name: string;
}

export const libreTranslate = {
  /**
   * Translate text from source to target language
   * @param text - Text to translate
   * @param source - Source language code (e.g., 'en', 'fr', 'auto')
   * @param target - Target language code (e.g., 'fr', 'de')
   */
  async translate(
    text: string,
    source: string,
    target: string
  ): Promise<TranslationResult> {
    try {
      const response = await fetch(`${LIBRE_TRANSLATE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: source === 'auto' ? undefined : source,
          target,
          format: 'text',
          api_key: process.env.LIBRE_TRANSLATE_API_KEY || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Translation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('LibreTranslate error:', error);
      throw error;
    }
  },

  /**
   * Translate multiple texts in batch (for table cells, word-by-word, etc.)
   * @param texts - Array of texts to translate
   * @param source - Source language code
   * @param target - Target language code
   */
  async translateBatch(
    texts: string[],
    source: string,
    target: string
  ): Promise<string[]> {
    // LibreTranslate doesn't have native batch, so we parallelize
    const results = await Promise.allSettled(
      texts.map(text => this.translate(text, source, target))
    );

    return results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value.translatedText;
      }
      console.warn(`Failed to translate text ${idx}:`, result.reason);
      return texts[idx]; // Return original on failure
    });
  },

  /**
   * Detect the language of a text
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }[]> {
    try {
      const response = await fetch(`${LIBRE_TRANSLATE_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          api_key: process.env.LIBRE_TRANSLATE_API_KEY || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  },

  /**
   * Get list of supported languages
   */
  async getLanguages(): Promise<LanguageInfo[]> {
    try {
      const response = await fetch(`${LIBRE_TRANSLATE_URL}/languages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      // Return common languages as fallback
      return [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'es', name: 'Spanish' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'ru', name: 'Russian' },
      ];
    }
  },
};
