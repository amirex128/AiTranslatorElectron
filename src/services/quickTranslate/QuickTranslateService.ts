import { net } from 'electron';

/**
 * Quick Translate Service
 * Uses Google Translate free scraping for quick translations
 */

export class QuickTranslateService {
  /**
   * Translate English text to Persian using Google Translate free API
   * @param text - English text to translate
   * @returns Translated Persian text
   */
  async translate(text: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        // Encode text for URL
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.google.com/m?sl=en&tl=fa&q=${encodedText}`;

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

              // Parse HTML to extract translation
              // Google Translate mobile page structure: <div class="result-container">...</div>
              const translationMatch = html.match(/<div class="result-container"[^>]*>([^<]+)<\/div>/i);
              
              if (translationMatch && translationMatch[1]) {
                // Decode HTML entities and clean up
                const translation = this.decodeHtmlEntities(translationMatch[1].trim());
                resolve(translation);
                return;
              }

              // Alternative pattern: look for translation in result-container or t0
              const altMatch = html.match(/class="t0">([^<]+)<\/div>/i);
              if (altMatch && altMatch[1]) {
                const translation = this.decodeHtmlEntities(altMatch[1].trim());
                resolve(translation);
                return;
              }

              // Another pattern: look for data-text attribute
              const dataTextMatch = html.match(/data-text="([^"]+)"/i);
              if (dataTextMatch && dataTextMatch[1]) {
                const translation = this.decodeHtmlEntities(dataTextMatch[1].trim());
                resolve(translation);
                return;
              }

              reject(new Error('Could not extract translation from Google Translate response'));
            } catch (error) {
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

