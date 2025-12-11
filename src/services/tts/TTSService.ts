class TTSService {
  private audio: HTMLAudioElement | null = null;
  private currentSpeed = 1.0;

  async speak(text: string, speed: number = 1.0): Promise<void> {
    this.stop();

    this.currentSpeed = speed;
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-US&client=tw-ob&q=${encodedText}`;

    return new Promise((resolve, reject) => {
      this.audio = new Audio(ttsUrl);
      this.audio.playbackRate = speed;

      this.audio.onended = () => {
        resolve();
      };

      this.audio.onerror = (error) => {
        reject(error);
      };

      this.audio.play().catch(reject);
    });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }

  setSpeed(speed: number): void {
    this.currentSpeed = speed;
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  getProgress(): number {
    if (!this.audio) return 0;
    if (this.audio.duration === 0) return 0;
    return (this.audio.currentTime / this.audio.duration) * 100;
  }

  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}

export const ttsService = new TTSService();

