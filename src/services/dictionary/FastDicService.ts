import { net } from 'electron';
import { FastDicResult, FastDicMeaning, FastDicVerbForms, FastDicCollocation, FastDicIdiom, FastDicCommonQuestion } from '../../types/dictionary';

/**
 * Service for scraping dictionary data from FastDic website
 */
export class FastDicService {
  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
    };

    return text.replace(/&[#\w]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * Clean text by removing HTML tags and extra whitespace
   */
  private cleanText(text: string): string {
    if (!text) return '';
    return this.decodeHtmlEntities(text)
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract text content from HTML element using regex
   */
  private extractText(html: string, pattern: RegExp): string | null {
    const match = html.match(pattern);
    if (match && match[1]) {
      return this.cleanText(match[1]);
    }
    return null;
  }

  /**
   * Extract all matches from HTML
   */
  private extractAllMatches(html: string, pattern: RegExp): string[] {
    const matches: string[] = [];
    let match;
    // Ensure 'g' flag is present but don't duplicate it
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const globalPattern = new RegExp(pattern.source, flags);
    
    while ((match = globalPattern.exec(html)) !== null) {
      if (match[1]) {
        const cleaned = this.cleanText(match[1]);
        if (cleaned) {
          matches.push(cleaned);
        }
      }
    }
    
    return matches;
  }

  /**
   * Extract word title and pronunciation
   */
  private extractWordInfo(html: string): { word: string; pronunciation: string[] } {
    // Extract word from h1 tag - look for the main heading
    const wordMatch = html.match(/<h1[^>]*class="[^"]*result[^"]*__header[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const word = wordMatch ? this.cleanText(wordMatch[1]) : '';

    // Extract pronunciation - look for phonetic notation
    const pronunciations: string[] = [];
    
    // Pattern 1: Look for pronunciation in specific spans or divs
    const pronunciationSpans = html.match(/<span[^>]*>([\/\[][^\]]+[\/\]])<\/span>/gi);
    if (pronunciationSpans) {
      for (const span of pronunciationSpans) {
        const pron = this.cleanText(span);
        if (pron && (pron.includes('/') || pron.includes('['))) {
          pronunciations.push(pron);
        }
      }
    }

    // Pattern 2: Look for phonetic notation in brackets [phonetic]
    const bracketPronunciations = this.extractAllMatches(html, /\[([^\]]+)\]/g);
    pronunciations.push(...bracketPronunciations.filter(p => p.length > 2 && p.length < 50));

    // Pattern 3: Look for phonetic notation between slashes /phonetic/
    const slashPronunciations = this.extractAllMatches(html, /\/([^\/]+)\//g);
    pronunciations.push(...slashPronunciations.filter(p => p.length > 2 && p.length < 50));

    // Remove duplicates and clean
    const uniquePronunciations = [...new Set(pronunciations)]
      .filter(p => p && !p.match(/^\d+$/) && p.length > 1);

    return {
      word: word || '',
      pronunciation: uniquePronunciations,
    };
  }

  /**
   * Extract verb forms
   */
  private extractVerbForms(html: string): FastDicVerbForms | undefined {
    const forms: FastDicVerbForms = {};
    
    // Look for verb forms - they appear as "گذشته‌ی ساده: **word**"
    const patterns = {
      pastTense: /گذشته‌ی\s*ساده[^:]*:\s*<strong[^>]*>([^<]+)<\/strong>/i,
      pastParticiple: /شکل\s*سوم[^:]*:\s*<strong[^>]*>([^<]+)<\/strong>/i,
      thirdPersonSingular: /سوم‌شخص\s*مفرد[^:]*:\s*<strong[^>]*>([^<]+)<\/strong>/i,
      presentParticiple: /وجه\s*وصفی\s*حال[^:]*:\s*<strong[^>]*>([^<]+)<\/strong>/i,
      plural: /شکل\s*جمع[^:]*:\s*<strong[^>]*>([^<]+)<\/strong>/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = html.match(pattern);
      if (match && match[1]) {
        forms[key as keyof FastDicVerbForms] = this.cleanText(match[1]);
      }
    }

    return Object.keys(forms).length > 0 ? forms : undefined;
  }

  /**
   * Extract meanings and examples - improved version
   */
  private extractMeanings(html: string): FastDicMeaning[] {
    const meanings: FastDicMeaning[] = [];

    // Find the main content section - look for the word definition area
    // Try multiple patterns to find the content area
    let contentHtml = html;
    const contentPatterns = [
      /<section[^>]*id="word"[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*class="[^"]*result[^"]*__container[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*result[^"]*__wrapper[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*class="[^"]*fd-container[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    
    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        contentHtml = match[1];
        break;
      }
    }

    // Strategy 1: Look for structured meaning blocks
    // Pattern: "noun uncountable A1" or just "noun A1" followed by meaning and examples
    // Also look for patterns like "noun uncountable" or "verb transitive"
    const posLevelPattern = /\b(noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection|determiner|article)\s+(?:uncountable|countable|plural|transitive|intransitive|singular|plural)?\s*(A1|A2|B1|B2|C1|C2)?/gi;
    
    let match;
    const sections: Array<{ start: number; end: number; pos: string; level?: string }> = [];
    
    while ((match = posLevelPattern.exec(contentHtml)) !== null) {
      const pos = match[1].toLowerCase();
      const level = match[2] || undefined;
      const start = match.index;
      
      // Find the end of this section
      const remainingHtml = contentHtml.substring(start + match[0].length);
      const nextPosMatch = remainingHtml.search(/\b(noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection|determiner|article)\s+(?:uncountable|countable|plural|transitive|intransitive|singular)?\s*(A1|A2|B1|B2|C1|C2)?/i);
      const end = nextPosMatch > 0 ? start + match[0].length + nextPosMatch : Math.min(start + match[0].length + 3000, contentHtml.length);
      
      sections.push({ start, end, pos, level });
    }

    // Process structured sections
    if (sections.length > 0) {
      for (const sectionInfo of sections) {
        const sectionHtml = contentHtml.substring(sectionInfo.start, sectionInfo.end);
        
        // Extract meaning - look for Persian text after the POS line
        let meaning = '';
        
        // Find the POS pattern in this section to skip it
        const posMatchInSection = sectionHtml.match(/\b(noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection|determiner|article)\s+(?:uncountable|countable|plural|transitive|intransitive|singular)?\s*(A1|A2|B1|B2|C1|C2)?/i);
        const afterPosHtml = posMatchInSection 
          ? sectionHtml.substring(posMatchInSection.index! + posMatchInSection[0].length)
          : sectionHtml;
        
        // Try multiple patterns for meaning - look for the first meaningful Persian text
        const meaningPatterns = [
          // Pattern 1: Strong tag with Persian text (most common)
          /<strong[^>]*>([\u0600-\u06FF][^<]{2,200})<\/strong>/,
          // Pattern 2: Direct Persian text in tags
          />([\u0600-\u06FF][^<\n]{2,200})</,
          // Pattern 3: In paragraph or div
          /<p[^>]*>([\u0600-\u06FF][^<]{2,200})<\/p>/,
          // Pattern 4: In div with specific classes
          /<div[^>]*>([\u0600-\u06FF][^<]{2,200})<\/div>/,
        ];
        
        for (const pattern of meaningPatterns) {
          const meaningMatch = afterPosHtml.match(pattern);
          if (meaningMatch && meaningMatch[1]) {
            const candidate = this.cleanText(meaningMatch[1]);
            // Validate: should be Persian, reasonable length, not just numbers or single chars
            if (candidate && candidate.length > 2 && candidate.length < 300 && 
                /[\u0600-\u06FF]/.test(candidate) && !candidate.match(/^\d+$/) &&
                !candidate.match(/^(لینک|مشاهده|کپی|ذخیره)$/i)) {
              meaning = candidate;
              break;
            }
          }
        }
        
        // If still no meaning, try to find any Persian text block after POS
        if (!meaning) {
          const persianTextMatch = afterPosHtml.match(/([\u0600-\u06FF][\u0600-\u06FF\s،؛:]{5,200})/);
          if (persianTextMatch) {
            const candidate = this.cleanText(persianTextMatch[1]);
            if (candidate && candidate.length > 3 && candidate.length < 300) {
              meaning = candidate;
            }
          }
        }

        // Extract examples - look for English sentence + Persian translation pairs
        const examples: Array<{ english: string; persian: string }> = [];
        
        // Pattern 1: English sentence followed by Persian (most common format)
        // Look for: English text (starts with capital, contains letters) then Persian text
        const examplePattern1 = /([A-Z][A-Za-z\s,.'"!?;:()-]{10,400}?)\s*(?:<br\s*\/?>|\n|<\/p>|<\/div>|<\/li>)\s*([\u0600-\u06FF][^<\n]{5,400}?)(?:<br|<\/p>|<\/div>|<\/li>|$)/g;
        let exMatch;
        while ((exMatch = examplePattern1.exec(sectionHtml)) !== null && examples.length < 15) {
          const english = this.cleanText(exMatch[1]);
          const persian = this.cleanText(exMatch[2]);
          // Validate: both should be meaningful sentences
          if (english && persian && 
              english.length > 8 && persian.length > 5 &&
              /[A-Za-z]{3,}/.test(english) && /[\u0600-\u06FF]{3,}/.test(persian) &&
              !english.match(/^(Error|Warning|Note|Tip)/i) &&
              !persian.match(/^(لینک|مشاهده|کپی|ذخیره|تبلیغات)/i)) {
            const englishLower = english.trim().toLowerCase();
            if (!examples.some(e => e.english.trim().toLowerCase() === englishLower)) {
              examples.push({ english, persian });
            }
          }
        }

        // Pattern 2: Examples in list items (more structured)
        const listItems = sectionHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (listItems) {
          for (const item of listItems) {
            // Extract English (before Persian characters) - more flexible pattern
            const englishMatch = item.match(/([A-Z][A-Za-z\s,.'"!?;:()-]{10,400}?)(?=[\u0600-\u06FF]|<br|<p|<\/)/);
            // Extract Persian (contains Persian characters)
            const persianMatch = item.match(/([\u0600-\u06FF][^<]{5,400}?)(?:<|$)/);
            if (englishMatch && persianMatch) {
              const english = this.cleanText(englishMatch[1]);
              const persian = this.cleanText(persianMatch[1]);
              if (english && persian && 
                  english.length > 8 && persian.length > 5 &&
                  /[A-Za-z]{3,}/.test(english) && /[\u0600-\u06FF]{3,}/.test(persian) &&
                  !english.match(/^(Error|Warning|Note|Tip)/i) &&
                  !persian.match(/^(لینک|مشاهده|کپی|ذخیره|تبلیغات)/i)) {
                const englishLower = english.trim().toLowerCase();
                if (!examples.some(e => e.english.trim().toLowerCase() === englishLower)) {
                  examples.push({ english, persian });
                }
              }
            }
          }
        }

        // Pattern 3: Examples in paragraph tags or divs
        const paragraphs = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
        if (paragraphs) {
          for (const para of paragraphs) {
            const englishMatch = para.match(/([A-Z][A-Za-z\s,.'"!?;:()-]{10,400}?)(?=[\u0600-\u06FF]|$)/);
            const persianMatch = para.match(/([\u0600-\u06FF][^<]{5,400}?)(?:<|$)/);
            if (englishMatch && persianMatch) {
              const english = this.cleanText(englishMatch[1]);
              const persian = this.cleanText(persianMatch[1]);
              if (english && persian && 
                  english.length > 8 && persian.length > 5 &&
                  /[A-Za-z]{3,}/.test(english) && /[\u0600-\u06FF]{3,}/.test(persian) &&
                  !english.match(/^(Error|Warning|Note|Tip)/i) &&
                  !persian.match(/^(لینک|مشاهده|کپی|ذخیره|تبلیغات)/i)) {
                const englishLower = english.trim().toLowerCase();
                if (!examples.some(e => e.english.trim().toLowerCase() === englishLower)) {
                  examples.push({ english, persian });
                }
              }
            }
          }
        }
        
        // Pattern 4: Look for example blocks in divs with specific structure
        const exampleDivs = sectionHtml.match(/<div[^>]*class="[^"]*example[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
        if (exampleDivs) {
          for (const div of exampleDivs) {
            const englishMatch = div.match(/([A-Z][A-Za-z\s,.'"!?;:()-]{10,400}?)(?=[\u0600-\u06FF]|$)/);
            const persianMatch = div.match(/([\u0600-\u06FF][^<]{5,400}?)(?:<|$)/);
            if (englishMatch && persianMatch) {
              const english = this.cleanText(englishMatch[1]);
              const persian = this.cleanText(persianMatch[1]);
              if (english && persian && 
                  english.length > 8 && persian.length > 5 &&
                  /[A-Za-z]{3,}/.test(english) && /[\u0600-\u06FF]{3,}/.test(persian)) {
                const englishLower = english.trim().toLowerCase();
                if (!examples.some(e => e.english.trim().toLowerCase() === englishLower)) {
                  examples.push({ english, persian });
                }
              }
            }
          }
        }

        if (meaning || examples.length > 0) {
          meanings.push({
            partOfSpeech: sectionInfo.pos,
            level: sectionInfo.level,
            meaning,
            examples: examples.slice(0, 10), // Limit to 10 examples per meaning
          });
        }
      }
    }

    // Strategy 2: If no structured sections, try to extract from common patterns
    if (meanings.length === 0) {
      // Look for meaning blocks - Persian text that appears as definitions
      const meaningBlocks = contentHtml.match(/(?:<strong[^>]*>|>)([\u0600-\u06FF][^<]{3,150})(?:<\/strong>|<)/g);
      if (meaningBlocks) {
        const seenMeanings = new Set<string>();
        for (const block of meaningBlocks.slice(0, 10)) {
          const meaningText = this.cleanText(block.replace(/<[^>]+>/g, ''));
          if (meaningText && meaningText.length > 2 && meaningText.length < 200 &&
              /[\u0600-\u06FF]/.test(meaningText) && !seenMeanings.has(meaningText)) {
            seenMeanings.add(meaningText);
            meanings.push({
              partOfSpeech: '',
              meaning: meaningText,
              examples: [],
            });
          }
        }
      }
    }

    // Strategy 3: Extract examples from the entire content even if no meanings found
    if (meanings.length === 0 || meanings.some(m => m.examples.length === 0)) {
      const allExamples: Array<{ english: string; persian: string }> = [];
      
      // Look for example patterns throughout the HTML
      const globalExamplePattern = /([A-Z][A-Za-z\s,.'"!?;:()-]{15,300}?)\s*(?:<br\s*\/?>|\n|<\/p>|<\/div>)\s*([\u0600-\u06FF][^<\n]{5,300}?)(?:<br|<\/p>|<\/div>|$)/g;
      let exMatch;
      while ((exMatch = globalExamplePattern.exec(contentHtml)) !== null && allExamples.length < 20) {
        const english = this.cleanText(exMatch[1]);
        const persian = this.cleanText(exMatch[2]);
        if (english && persian && english.length > 10 && persian.length > 5 &&
            /[A-Za-z]/.test(english) && /[\u0600-\u06FF]/.test(persian)) {
          if (!allExamples.some(e => e.english.trim().toLowerCase() === english.trim().toLowerCase())) {
            allExamples.push({ english, persian });
          }
        }
      }

      // If we found examples but no meanings, create meaning entries
      if (allExamples.length > 0 && meanings.length === 0) {
        meanings.push({
          partOfSpeech: '',
          meaning: '',
          examples: allExamples.slice(0, 10),
        });
      } else if (allExamples.length > 0) {
        // Add examples to meanings that don't have any
        for (const meaning of meanings) {
          if (meaning.examples.length === 0 && allExamples.length > 0) {
            meaning.examples = allExamples.slice(0, 5);
            allExamples.splice(0, 5); // Remove used examples
          }
        }
      }
    }

    return meanings;
  }

  /**
   * Extract English-to-English definition
   */
  private extractEnglishToEnglish(html: string): string | undefined {
    // Look for section with "انگلیسی به انگلیسی" heading
    // The content usually follows in a div or section
    const sectionPattern = /انگلیسی\s*به\s*انگلیسی[\s\S]{0,500}?<div[^>]*>([\s\S]{0,2000}?)<\/div>/i;
    const match = html.match(sectionPattern);
    if (match && match[1]) {
      const content = this.cleanText(match[1]);
      if (content && content.length > 10 && content.length < 1000) {
        return content;
      }
    }
    
    // Alternative: look for English definition text
    const englishDefPattern = /<div[^>]*class="[^"]*english[^"]*"[^>]*>([\s\S]{0,2000}?)<\/div>/i;
    const englishMatch = html.match(englishDefPattern);
    if (englishMatch && englishMatch[1]) {
      const content = this.cleanText(englishMatch[1]);
      if (content && content.length > 10 && content.length < 1000 && /[A-Za-z]/.test(content)) {
        return content;
      }
    }
    
    return undefined;
  }

  /**
   * Extract synonyms and antonyms
   */
  private extractSynonymsAntonyms(html: string): { synonyms?: string[]; antonyms?: string[] } {
    const result: { synonyms?: string[]; antonyms?: string[] } = {};

    // Look for synonyms section
    const synonymsSection = html.match(/مترادف[\s\S]{0,500}?<div[^>]*>([\s\S]{0,2000}?)<\/div>/i);
    if (synonymsSection) {
      const synonyms: string[] = [];
      // Extract links or text in the synonyms section
      const synonymLinks = synonymsSection[1].match(/<a[^>]*>([^<]+)<\/a>/gi);
      const synonymSpans = synonymsSection[1].match(/<span[^>]*>([^<]+)<\/span>/gi);
      
      if (synonymLinks) {
        for (const link of synonymLinks) {
          const word = this.cleanText(link);
          if (word && word.length > 1 && word.length < 50 && /[A-Za-z]/.test(word)) {
            synonyms.push(word);
          }
        }
      }
      if (synonymSpans) {
        for (const span of synonymSpans) {
          const word = this.cleanText(span);
          if (word && word.length > 1 && word.length < 50 && /[A-Za-z]/.test(word)) {
            if (!synonyms.includes(word)) {
              synonyms.push(word);
            }
          }
        }
      }
      
      if (synonyms.length > 0) {
        result.synonyms = synonyms;
      }
    }

    // Look for antonyms section
    const antonymsSection = html.match(/متضاد[\s\S]{0,500}?<div[^>]*>([\s\S]{0,2000}?)<\/div>/i);
    if (antonymsSection) {
      const antonyms: string[] = [];
      // Extract links or text in the antonyms section
      const antonymLinks = antonymsSection[1].match(/<a[^>]*>([^<]+)<\/a>/gi);
      const antonymSpans = antonymsSection[1].match(/<span[^>]*>([^<]+)<\/span>/gi);
      
      if (antonymLinks) {
        for (const link of antonymLinks) {
          const word = this.cleanText(link);
          if (word && word.length > 1 && word.length < 50 && /[A-Za-z]/.test(word)) {
            antonyms.push(word);
          }
        }
      }
      if (antonymSpans) {
        for (const span of antonymSpans) {
          const word = this.cleanText(span);
          if (word && word.length > 1 && word.length < 50 && /[A-Za-z]/.test(word)) {
            if (!antonyms.includes(word)) {
              antonyms.push(word);
            }
          }
        }
      }
      
      if (antonyms.length > 0) {
        result.antonyms = antonyms;
      }
    }

    return result;
  }

  /**
   * Extract collocations
   */
  private extractCollocations(html: string): FastDicCollocation[] | undefined {
    const collocations: FastDicCollocation[] = [];

    // Look for collocations section
    const sectionPattern = /Collocations?[\s\S]{0,500}?<div[^>]*>([\s\S]{0,5000}?)<\/div>/i;
    const match = html.match(sectionPattern);
    if (!match) return undefined;

    const section = match[1];
    
    // Extract collocation items - usually in list format or as structured blocks
    const itemPattern = /<li[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>[\s\S]*?([\u0600-\u06FF][^<]{3,200}?)[\s\S]*?<\/li>/gi;
    let itemMatch;
    while ((itemMatch = itemPattern.exec(section)) !== null) {
      const phrase = this.cleanText(itemMatch[1]);
      const meaning = this.cleanText(itemMatch[2]);
      if (phrase && meaning && phrase.length > 1 && meaning.length > 3) {
        collocations.push({ phrase, meaning });
      }
    }

    // Alternative pattern: collocations in paragraphs or divs
    if (collocations.length === 0) {
      const collocBlocks = section.match(/<p[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>[\s\S]*?([\u0600-\u06FF][^<]{3,200}?)[\s\S]*?<\/p>/gi);
      if (collocBlocks) {
        for (const block of collocBlocks) {
          const phraseMatch = block.match(/<strong[^>]*>([^<]+)<\/strong>/);
          const meaningMatch = block.match(/([\u0600-\u06FF][^<]{3,200}?)(?:<|$)/);
          if (phraseMatch && meaningMatch) {
            const phrase = this.cleanText(phraseMatch[1]);
            const meaning = this.cleanText(meaningMatch[1]);
            if (phrase && meaning && phrase.length > 1 && meaning.length > 3) {
              collocations.push({ phrase, meaning });
            }
          }
        }
      }
    }

    return collocations.length > 0 ? collocations : undefined;
  }

  /**
   * Extract idioms
   */
  private extractIdioms(html: string): FastDicIdiom[] | undefined {
    const idioms: FastDicIdiom[] = [];

    // Look for idioms section
    const sectionPattern = /Idioms?[\s\S]{0,500}?<div[^>]*>([\s\S]{0,5000}?)<\/div>/i;
    const match = html.match(sectionPattern);
    if (!match) return undefined;

    const section = match[1];
    
    // Extract idiom items - similar to collocations
    const itemPattern = /<li[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>[\s\S]*?([\u0600-\u06FF][^<]{3,200}?)[\s\S]*?<\/li>/gi;
    let itemMatch;
    while ((itemMatch = itemPattern.exec(section)) !== null) {
      const phrase = this.cleanText(itemMatch[1]);
      const meaning = this.cleanText(itemMatch[2]);
      if (phrase && meaning && phrase.length > 1 && meaning.length > 3) {
        idioms.push({ phrase, meaning });
      }
    }

    // Alternative pattern
    if (idioms.length === 0) {
      const idiomBlocks = section.match(/<p[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>[\s\S]*?([\u0600-\u06FF][^<]{3,200}?)[\s\S]*?<\/p>/gi);
      if (idiomBlocks) {
        for (const block of idiomBlocks) {
          const phraseMatch = block.match(/<strong[^>]*>([^<]+)<\/strong>/);
          const meaningMatch = block.match(/([\u0600-\u06FF][^<]{3,200}?)(?:<|$)/);
          if (phraseMatch && meaningMatch) {
            const phrase = this.cleanText(phraseMatch[1]);
            const meaning = this.cleanText(meaningMatch[1]);
            if (phrase && meaning && phrase.length > 1 && meaning.length > 3) {
              idioms.push({ phrase, meaning });
            }
          }
        }
      }
    }

    return idioms.length > 0 ? idioms : undefined;
  }

  /**
   * Extract related words
   */
  private extractRelatedWords(html: string): string[] | undefined {
    // Look for related words section
    const sectionPattern = /لغات\s*هم‌خانواده[\s\S]{0,500}?<div[^>]*>([\s\S]{0,2000}?)<\/div>/i;
    const match = html.match(sectionPattern);
    if (!match) return undefined;

    const words: string[] = [];
    const section = match[1];
    
    // Extract words from links
    const wordLinks = section.match(/<a[^>]*>([^<]+)<\/a>/gi);
    if (wordLinks) {
      for (const link of wordLinks) {
        const word = this.cleanText(link);
        if (word && word.length > 1 && word.length < 50 && /[A-Za-z]/.test(word)) {
          if (!words.includes(word)) {
            words.push(word);
          }
        }
      }
    }
    
    // Extract words from spans
    const wordSpans = section.match(/<span[^>]*>([A-Za-z]+)<\/span>/gi);
    if (wordSpans) {
      for (const span of wordSpans) {
        const word = this.cleanText(span);
        if (word && word.length > 1 && word.length < 50 && /[A-Za-z]/.test(word)) {
          if (!words.includes(word)) {
            words.push(word);
          }
        }
      }
    }

    return words.length > 0 ? words : undefined;
  }

  /**
   * Extract common questions
   */
  private extractCommonQuestions(html: string): FastDicCommonQuestion[] | undefined {
    const questions: FastDicCommonQuestion[] = [];

    // Look for common questions section
    const sectionPattern = /سوال[‌\s]*های\s*رایج[\s\S]{0,500}?<div[^>]*>([\s\S]{0,5000}?)<\/div>/i;
    const match = html.match(sectionPattern);
    if (!match) return undefined;

    const section = match[1];
    
    // Extract Q&A pairs - usually in structured format
    // Pattern 1: Question in strong tag, answer follows
    const qaPattern1 = /<strong[^>]*>([^<]+)<\/strong>[\s\S]*?([\u0600-\u06FF][^<]{5,500}?)(?:<br|<\/p>|<\/div>|$)/gi;
    let qaMatch;
    while ((qaMatch = qaPattern1.exec(section)) !== null) {
      const question = this.cleanText(qaMatch[1]);
      const answer = this.cleanText(qaMatch[2]);
      if (question && answer && question.length > 5 && answer.length > 10) {
        questions.push({ question, answer });
      }
    }

    // Pattern 2: Questions in list items
    if (questions.length === 0) {
      const listItems = section.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (listItems) {
        for (const item of listItems) {
          const questionMatch = item.match(/<strong[^>]*>([^<]+)<\/strong>/);
          const answerMatch = item.match(/([\u0600-\u06FF][^<]{5,500}?)(?:<|$)/);
          if (questionMatch && answerMatch) {
            const question = this.cleanText(questionMatch[1]);
            const answer = this.cleanText(answerMatch[1]);
            if (question && answer && question.length > 5 && answer.length > 10) {
              questions.push({ question, answer });
            }
          }
        }
      }
    }

    return questions.length > 0 ? questions : undefined;
  }

  /**
   * Extract reference/citation
   */
  private extractReference(html: string): string | undefined {
    // Look for reference section
    const sectionPattern = /ارجاع[\s\S]{0,500}?<div[^>]*>([\s\S]{0,2000}?)<\/div>/i;
    const match = html.match(sectionPattern);
    if (match && match[1]) {
      const content = this.cleanText(match[1]);
      if (content && content.length > 10 && content.length < 500) {
        return content;
      }
    }
    return undefined;
  }

  /**
   * Fetch and parse dictionary data from FastDic
   */
  async fetchWord(word: string): Promise<FastDicResult> {
    return new Promise<FastDicResult>((resolve, reject) => {
      try {
        const encodedWord = encodeURIComponent(word.toLowerCase().trim());
        const url = `https://fastdic.com/word/${encodedWord}`;

        console.log('[FastDic] Fetching word:', word);
        console.log('[FastDic] URL:', url);

        const request = net.request({
          method: 'GET',
          url: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://fastdic.com/',
            'Origin': 'https://fastdic.com',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
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
              console.log('[FastDic] Response received, HTML length:', html.length);

              // Check if word was found - look for specific error indicators
              // Check for actual 404 page title or specific error messages
              const has404Title = /<title[^>]*>.*404.*<\/title>/i.test(html);
              const hasNotFoundMessage = /صفحه\s*پیدا\s*نشد/i.test(html);
              const hasWordNotFound = /لغت\s*یافت\s*نشد/i.test(html);
              
              // Also check if we can find the word in the page title (more reliable)
              const hasWordInTitle = new RegExp(`<title[^>]*>.*${word}.*<\/title>`, 'i').test(html);
              const hasH1WithWord = new RegExp(`<h1[^>]*>.*${word}.*<\/h1>`, 'i').test(html);
              
              // If we have clear error indicators AND no word in title/h1, it's not found
              if ((has404Title || hasNotFoundMessage || hasWordNotFound) && !hasWordInTitle && !hasH1WithWord) {
                reject(new Error(`Word "${word}" not found in FastDic`));
                return;
              }

              // Extract all data
              const wordInfo = this.extractWordInfo(html);
              const verbForms = this.extractVerbForms(html);
              const meanings = this.extractMeanings(html);
              const englishToEnglish = this.extractEnglishToEnglish(html);
              const { synonyms, antonyms } = this.extractSynonymsAntonyms(html);
              const collocations = this.extractCollocations(html);
              const idioms = this.extractIdioms(html);
              const relatedWords = this.extractRelatedWords(html);
              const commonQuestions = this.extractCommonQuestions(html);
              const reference = this.extractReference(html);

              // Ensure we have at least one meaning entry
              const finalMeanings = meanings.length > 0 ? meanings : [{ partOfSpeech: '', meaning: '', examples: [] }];

              const result: FastDicResult = {
                word: wordInfo.word || word,
                pronunciation: wordInfo.pronunciation,
                verbForms,
                meanings: finalMeanings,
                englishToEnglish,
                synonyms,
                antonyms,
                collocations,
                idioms,
                relatedWords,
                commonQuestions,
                reference,
              };

              console.log('[FastDic] Extracted data:', {
                word: result.word,
                meaningsCount: result.meanings.length,
                hasSynonyms: !!result.synonyms,
                hasAntonyms: !!result.antonyms,
                hasCollocations: !!result.collocations,
                hasIdioms: !!result.idioms,
                hasRelatedWords: !!result.relatedWords,
                hasCommonQuestions: !!result.commonQuestions,
              });

              resolve(result);
            } catch (error) {
              console.error('[FastDic] Error parsing HTML:', error);
              reject(new Error(`Failed to parse FastDic response: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          });

          response.on('error', (error) => {
            console.error('[FastDic] Response error:', error);
            reject(error);
          });
        });

        request.on('error', (error) => {
          console.error('[FastDic] Request error:', error);
          reject(error);
        });

        request.end();
      } catch (error) {
        console.error('[FastDic] Error creating request:', error);
        reject(error);
      }
    });
  }
}

export const fastDicService = new FastDicService();
