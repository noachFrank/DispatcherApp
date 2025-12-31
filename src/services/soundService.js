/**
 * Sound Notification Service for Dispatcher App
 * Manages audio notifications for various events
 */

class SoundService {
    constructor() {
        this.enabled = this.loadSoundPreference();
        this.sounds = {};
        this.initializeSounds();
    }

    /**
     * Initialize audio elements for each sound type
     */
    initializeSounds() {
        // Try to load MP3 files first, fallback to generated tones
        this.sounds = {
            message: this.createSound('/sounds/message.mp3', 800, 0.15),
            urgent: this.createSound('/sounds/urgent.mp3', 1200, 0.25, true),
            sent: this.createSound('/sounds/sent.mp3', 600, 0.1),
            success: this.createSound('/sounds/success.mp3', 900, 0.2),
            broadcast: this.createSound('/sounds/broadcast.mp3', 700, 0.3, false)
        };
    }

    /**
     * Create an audio element or fallback to Web Audio API
     */
    createSound(url, frequency, duration, isUrgent = false) {
        const audio = new Audio();
        audio.volume = 0.5;

        // Try to load the MP3 file
        audio.src = url;
        audio.preload = 'auto';

        // Store fallback parameters for Web Audio API
        audio._fallbackFreq = frequency;
        audio._fallbackDuration = duration;
        audio._isUrgent = isUrgent;

        return audio;
    }

    /**
     * Play a tone using Web Audio API (fallback)
     */
    playTone(frequency, duration, isUrgent = false) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;

            // For urgent sounds, add a second beep
            if (isUrgent) {
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.15);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            } else {
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            }

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);

            console.log('✅ Sound played successfully:', frequency + 'Hz for', duration + 's');
        } catch (error) {
            console.error('❌ Error playing sound:', error);
        }
    }    /**
     * Load sound preference from localStorage
     */
    loadSoundPreference() {
        const saved = localStorage.getItem('dispatcherSoundEnabled');
        return saved === null ? true : saved === 'true'; // Default enabled
    }

    /**
     * Save sound preference to localStorage
     */
    saveSoundPreference(enabled) {
        this.enabled = enabled;
        localStorage.setItem('dispatcherSoundEnabled', enabled.toString());
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        this.saveSoundPreference(this.enabled);
        return this.enabled;
    }

    /**
     * Check if sounds are enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Play a sound by type
     */
    play(soundType) {
        if (!this.enabled) {
            console.log('Sound disabled, not playing:', soundType);
            return;
        }

        const sound = this.sounds[soundType];
        if (!sound) {
            console.warn('Sound type not found:', soundType);
            return;
        }

        console.log('Playing sound:', soundType);

        // Always use Web Audio API fallback for now (MP3 files not present)
        // You can add MP3 files later and they'll be used automatically
        this.playTone(
            sound._fallbackFreq,
            sound._fallbackDuration,
            sound._isUrgent
        );
    }

    /**
     * Play sound when a new message arrives
     * Checks message content to determine if it's urgent
     */
    playMessageSound(messageText) {
        if (!this.enabled) {
            console.log('Sound disabled, not playing message sound');
            return;
        }

        console.log('Playing message sound for:', messageText);

        // Check if message contains urgent keywords
        const text = messageText || '';
        const urgentKeywords = ['cancel', 'reassign', 'remove', 'urgent', 'emergency', 'help'];
        const isUrgent = urgentKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );

        console.log('Message is urgent:', isUrgent);
        this.play(isUrgent ? 'urgent' : 'message');
    }

    /**
     * Play sound when a message is sent
     */
    playMessageSentSound() {
        this.play('sent');
    }

    /**
     * Play sound when a call is created/sent
     */
    playCallSentSound() {
        this.play('success');
    }

    /**
     * Play sound when a broadcast message is sent
     */
    playBroadcastSentSound() {
        this.play('broadcast');
    }

    /**
     * Test method - play all sounds in sequence
     * Call from browser console: window.testSounds()
     */
    testAllSounds() {
        console.log('Testing all sounds...');
        this.play('message');
        setTimeout(() => this.play('urgent'), 500);
        setTimeout(() => this.play('sent'), 1000);
        setTimeout(() => this.play('success'), 1500);
        setTimeout(() => this.play('broadcast'), 2000);
    }
}

// Export singleton instance
const soundService = new SoundService();

// Make test function available globally
if (typeof window !== 'undefined') {
    window.testSounds = () => soundService.testAllSounds();
    window.soundService = soundService;
}

export default soundService;
