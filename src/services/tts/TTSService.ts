class TTSService {
  private audio: HTMLAudioElement | null = null;
  private currentSpeed = 1.0;
  private speechSynthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  async speak(text: string, speed: number = 1.0): Promise<void> {
    this.stop();

    this.currentSpeed = speed;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty');
    }

    try {
      return await this.speakWithGoogleTTS(text, speed);
    } catch (error) {
      if (this.speechSynthesis) {
        return await this.speakWithWebSpeech(text, speed);
      }
      throw error;
    }
  }

  private async speakWithGoogleTTS(text: string, speed: number): Promise<void> {
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-US&client=tw-ob&q=${encodedText}`;

    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.fetchTTSAudio(ttsUrl);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch audio');
    }

    const binaryString = atob(response.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: response.mimeType || 'audio/mpeg' });
    const blobUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      this.audio = new Audio(blobUrl);
      this.audio.playbackRate = speed;

      this.audio.onloadeddata = () => {
        this.audio?.play().catch((error) => {
          URL.revokeObjectURL(blobUrl);
          reject(error);
        });
      };

      this.audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        this.audio = null;
        resolve();
      };

      this.audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        this.audio = null;
        reject(new Error('Failed to play audio'));
      };

      this.audio.play().catch(() => {
        // If play fails, wait for loadeddata event
      });
    });
  }

  private async speakWithWebSpeech(text: string, speed: number): Promise<void> {
    if (!this.speechSynthesis) {
      throw new Error('Web Speech API not available');
    }

    return new Promise((resolve, reject) => {
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = 'en-US';
      this.utterance.rate = speed;
      this.utterance.pitch = 1;
      this.utterance.volume = 1;

      this.utterance.onend = () => {
        this.utterance = null;
        resolve();
      };

      this.utterance.onerror = (error) => {
        this.utterance = null;
        reject(new Error(`Speech synthesis error: ${error.error}`));
      };

      this.speechSynthesis.speak(this.utterance);
    });
  }

  stop(): void {
    if (this.speechSynthesis && this.utterance) {
      this.speechSynthesis.cancel();
      this.utterance = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }

  setSpeed(speed: number): void {
    this.currentSpeed = speed;
    if (this.utterance) {
      this.utterance.rate = speed;
    }
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  getProgress(): number {
    if (this.utterance && this.speechSynthesis) {
      return 50;
    }
    if (!this.audio) return 0;
    if (this.audio.duration === 0 || isNaN(this.audio.duration)) return 0;
    return (this.audio.currentTime / this.audio.duration) * 100;
  }

  isPlaying(): boolean {
    if (this.speechSynthesis) {
      return this.speechSynthesis.speaking;
    }
    return this.audio !== null && !this.audio.paused;
  }
}

export const ttsService = new TTSService();

