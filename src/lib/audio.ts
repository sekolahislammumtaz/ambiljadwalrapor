'use client';

class BellAudioManager {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private isPlaying: boolean = false;
  private playedSlotIds: Set<string> = new Set();
  private loopInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('/bell.mp3');
        this.audio.preload = 'auto';
      } catch (e) {
        console.warn('Audio element creation failed, using Web Audio fallback', e);
      }
    }
  }

  // Interaksi pertama pengawas untuk bypass browser autoplay policy
  public unlockAudio(): boolean {
    try {
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          if (!this.audioCtx) {
            this.audioCtx = new AudioContextClass();
          }
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
        }

        if (this.audio) {
          this.audio.play().then(() => {
            this.audio?.pause();
            if (this.audio) this.audio.currentTime = 0;
          }).catch(() => {});
        }
        this.isUnlocked = true;
        return true;
      }
    } catch (e) {
      console.error('Audio unlock error:', e);
    }
    return false;
  }

  public getUnlockedStatus(): boolean {
    return this.isUnlocked;
  }

  // Sintesis nada bel sekolah yang jernih via Web Audio API (Fallback jika file mp3 diblokir)
  private playWebAudioChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;

      // Bell chime tone 1: G5 (784 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Bell chime tone 2: C6 (1046.5 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.35);
      gain2.gain.setValueAtTime(0.7, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.8);
    } catch (e) {
      console.warn('Web Audio synthesis error:', e);
    }
  }

  public playAlarm(slotId?: string): boolean {
    if (slotId && this.playedSlotIds.has(slotId)) {
      return false; // Sudah pernah dibunyikan untuk slot ini
    }

    if (slotId) {
      this.playedSlotIds.add(slotId);
    }

    this.isPlaying = true;

    // Coba putar /bell.mp3
    let mp3Played = false;
    if (this.audio) {
      try {
        this.audio.currentTime = 0;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              mp3Played = true;
            })
            .catch(() => {
              // Jika ditolak browser, fallback ke Web Audio synth
              this.playWebAudioChime();
            });
        }
      } catch (err) {
        this.playWebAudioChime();
      }
    } else {
      this.playWebAudioChime();
    }

    return true;
  }

  public stopAlarm(): void {
    this.isPlaying = false;
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (e) {}
    }
  }

  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  public hasSlotTriggered(slotId: string): boolean {
    return this.playedSlotIds.has(slotId);
  }

  public resetSlotTrigger(slotId: string): void {
    this.playedSlotIds.delete(slotId);
  }
}

export const bellManager = new BellAudioManager();
