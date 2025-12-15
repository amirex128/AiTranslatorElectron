import { net } from 'electron';

/**
 * Quick Translate Service
 * Uses Google Translate free scraping for quick translations
 */

export class QuickTranslateService {
  /**
   * Clean translation text by removing error messages and stack traces
   * @param translation - Translation text to clean
   * @returns Cleaned translation text
   */
  private cleanTranslation(translation: string): string {
    // Remove error messages and stack traces from translation
    return translation
      .replace(/Error:.*$/gm, '')
      .replace(/at eval.*$/gm, '')
      .replace(/at Generator\.next.*$/gm, '')
      .replace(/at fulfilled.*$/gm, '')
      .replace(/webpack-internal:.*$/gm, '')
      .replace(/^\s*Error:.*$/gm, '') // Error at start of line
      .replace(/\n\s*Error:.*$/gm, '') // Error after newline
      .trim();
  }

  /**
   * Translate text using Google Translate free API
   * @param text - Text to translate
   * @param direction - Translation direction: 'en-to-fa' (English to Persian) or 'fa-to-en' (Persian to English)
   * @returns Translated text
   */
  async translate(text: string, direction: 'en-to-fa' | 'fa-to-en' = 'en-to-fa'): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        // Encode text for URL
        const encodedText = encodeURIComponent(text);
        
        // Set source and target languages based on direction
        const sourceLang = direction === 'en-to-fa' ? 'en' : 'fa';
        const targetLang = direction === 'en-to-fa' ? 'fa' : 'en';
        
        // Use mobile version of Google Translate (more reliable for scraping)
        const url = `https://translate.google.com/m?sl=${sourceLang}&tl=${targetLang}&q=${encodedText}`;
        
        console.log('[QuickTranslate] Request URL:', url.replace(encodedText, '[TEXT]'));
        console.log('[QuickTranslate] Source lang:', sourceLang, 'Target lang:', targetLang);

        // Use Electron's net.request for HTTP requests in main process
        const request = net.request({
          method: 'GET',
          url: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
            'Origin': 'https://translate.google.com',
          },
        });

        const chunks: Buffer[] = [];

        request.on('response', (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP error! status: ${response.statusCode}`));
            return;
          }

          response.on('data', (chunk) => {
            chunks.push(chunk);
          });

          response.on('end', () => {
            try {
              const html = Buffer.concat(chunks).toString('utf-8');
              console.log('[QuickTranslate] Response received, direction:', direction);
              console.log('[QuickTranslate] HTML length:', html.length);

              // Try multiple patterns to extract translation from Google Translate HTML
              // Order matters - try most specific patterns first
              const patterns = [
                // Pattern 1: result-container with direct text (most common)
                /<div[^>]*class="result-container"[^>]*>([^<]+)<\/div>/i,
                // Pattern 2: t0 class with direct text (common for mobile)
                /<div[^>]*class="[^"]*t0[^"]*"[^>]*>([^<]+)<\/div>/i,
                // Pattern 3: dir="ltr" with t0 (for English results from Persian)
                /<div[^>]*dir="ltr"[^>]*class="[^"]*t0[^"]*"[^>]*>([^<]+)<\/div>/i,
                // Pattern 4: dir="rtl" with t0 (for Persian results from English)
                /<div[^>]*dir="rtl"[^>]*class="[^"]*t0[^"]*"[^>]*>([^<]+)<\/div>/i,
                // Pattern 5: data-text attribute (sometimes used)
                /data-text="([^"]+)"/i,
                // Pattern 6: result-container with nested div containing text
                /<div[^>]*class="result-container"[^>]*>[\s\S]*?<div[^>]*>([^<]+)<\/div>/i,
                // Pattern 7: Look for translation in any div after "result-container" (multiline)
                /result-container[^>]*>[\s\S]{0,500}?<div[^>]*>([^<]+)<\/div>/i,
                // Pattern 8: Look for text in divs with specific classes (broader search)
                /<div[^>]*class="[^"]*(?:result|translation|t0)[^"]*"[^>]*>([^<]+)<\/div>/i,
                // Pattern 9: Look for span with translation text
                /<span[^>]*class="[^"]*t0[^"]*"[^>]*>([^<]+)<\/span>/i,
                // Pattern 10: Look for any text after "result-container" tag
                /<div[^>]*class="result-container"[^>]*>[\s\S]*?([A-Za-z\u0600-\u06FF][^<]{3,})/i,
              ];

              let foundTranslation: string | null = null;

              for (let i = 0; i < patterns.length; i++) {
                const pattern = patterns[i];
                const match = html.match(pattern);
                
                if (match && match[1]) {
                  let translation = match[1].trim();
                  
                  // Decode HTML entities first
                  translation = this.decodeHtmlEntities(translation);
                  
                  // Clean up translation - remove HTML tags and extra whitespace
                  translation = translation.replace(/<[^>]+>/g, '').trim();
                  translation = translation.replace(/\s+/g, ' ').trim();
                  
                  // Skip if translation is empty, too short, or contains only HTML entities
                  if (translation && translation.length > 0 && 
                      translation !== '&nbsp;' && 
                      translation !== '&#39;' &&
                      translation.length >= 1) {
                    
                    // Additional validation: make sure it's not the same as input (for same language)
                    // Also check if it's not just whitespace or special characters
                    const normalizedTranslation = translation.toLowerCase().trim();
                    const normalizedInput = text.toLowerCase().trim();
                    
                    if (normalizedTranslation !== normalizedInput && 
                        normalizedTranslation.length > 0 &&
                        !/^[\s\u200C\u200D\u200E\u200F\u202A-\u202E\u2066-\u2069]*$/.test(normalizedTranslation)) {
                      console.log(`[QuickTranslate] Found translation using pattern ${i + 1}:`, translation);
                      foundTranslation = translation;
                      break; // Use first valid match
                    } else {
                      console.warn(`[QuickTranslate] Pattern ${i + 1} matched but translation is invalid:`, translation);
                    }
                  }
                }
              }

              // If pattern matching found a translation, clean it and return
              if (foundTranslation) {
                const cleanedTranslation = this.cleanTranslation(foundTranslation);
                // Only return if cleaned translation is not empty and doesn't contain error indicators
                if (cleanedTranslation && 
                    cleanedTranslation.length > 0 && 
                    !cleanedTranslation.includes('Error:') &&
                    !cleanedTranslation.includes('at eval') &&
                    !cleanedTranslation.includes('at Generator.next')) {
                  console.log(`[QuickTranslate] Returning cleaned translation:`, cleanedTranslation);
                  resolve(cleanedTranslation);
                  return;
                } else {
                  console.warn(`[QuickTranslate] Cleaned translation is invalid or contains errors:`, cleanedTranslation);
                }
              }

              // Fallback: Try to extract text from result-container area more aggressively
              const resultAreaMatch = html.match(/result-container[^>]*>([\s\S]{0,2000})/i);
              if (resultAreaMatch && resultAreaMatch[1]) {
                // Extract all text from HTML in result area
                let textContent = resultAreaMatch[1]
                  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
                  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
                  .replace(/<[^>]+>/g, ' ') // Remove HTML tags
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/\s+/g, ' ')
                  .trim();
                
                // Decode any remaining entities
                textContent = this.decodeHtmlEntities(textContent);
                
                // Find the first meaningful text that's different from input
                const words = textContent.split(/\s+/).filter(w => w.length > 0);
                for (const word of words) {
                  if (word.toLowerCase() !== text.toLowerCase() && 
                      word.length > 0 && 
                      !/^[\d\s\u200C-\u200F\u202A-\u202E\u2066-\u2069]*$/.test(word)) {
                    console.log('[QuickTranslate] Found translation from result area (word):', word);
                    resolve(word);
                    return;
                  }
                }
                
                // If we found text content but it's the same as input, try to find next different text
                if (textContent && textContent.toLowerCase() !== text.toLowerCase() && textContent.length > 0) {
                  const cleanedTextContent = this.cleanTranslation(textContent);
                  if (cleanedTextContent && 
                      cleanedTextContent.length > 0 && 
                      !cleanedTextContent.includes('Error:') &&
                      !cleanedTextContent.includes('at eval') &&
                      !cleanedTextContent.includes('at Generator.next')) {
                    console.log('[QuickTranslate] Found translation from result area (full, cleaned):', cleanedTextContent);
                    resolve(cleanedTextContent);
                    return;
                  }
                }
              }

              // Log HTML snippet for debugging (first 3000 chars)
              console.error('[QuickTranslate] Could not extract translation. URL:', url);
              console.error('[QuickTranslate] HTML snippet (first 3000 chars):', html.substring(0, 3000));
              console.error('[QuickTranslate] HTML snippet (last 1000 chars):', html.substring(Math.max(0, html.length - 1000)));
              
              reject(new Error('Could not extract translation from Google Translate response. Please try again.'));
            } catch (error) {
              console.error('[QuickTranslate] Error parsing response:', error);
              reject(error instanceof Error ? error : new Error('Failed to parse response'));
            }
          });

          response.on('error', reject);
        });

        request.on('error', reject);
        request.end();
      } catch (error) {
        console.error('[QuickTranslate] Error translating text:', error);
        reject(error instanceof Error ? error : new Error('Failed to translate text'));
      }
    });
  }

  /**
   * Decode HTML entities (works in Node.js/main process)
   */
  private decodeHtmlEntities(text: string): string {
    // Simple HTML entity decoding for common entities
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    // Decode numeric entities (&#123;)
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      return String.fromCharCode(parseInt(num, 10));
    });

    // Decode hex entities (&#x1F;)
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
  }
}

export const quickTranslateService = new QuickTranslateService();

