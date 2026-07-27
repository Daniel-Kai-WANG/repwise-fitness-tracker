const REST_ALERT_VOLUME = 0.035;
const REST_ALERT_VIBRATION_PATTERN = [160, 100, 160];

let audioContext: AudioContext | undefined;

function getAudioContext() {
  if (!window.AudioContext) return undefined;
  audioContext ??= new window.AudioContext();
  return audioContext;
}

function playTone(context: AudioContext, startsAt: number, frequency: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(REST_ALERT_VOLUME, startsAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.28);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + 0.3);
}

export function prepareRestAlert() {
  const context = getAudioContext();
  if (context?.state === 'suspended') void context.resume();
}

export function playRestAlert() {
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(REST_ALERT_VIBRATION_PATTERN);
  }

  const context = getAudioContext();
  if (!context) return;

  const playChime = () => {
    const startsAt = context.currentTime;
    playTone(context, startsAt, 620);
    playTone(context, startsAt + 0.34, 780);
  };

  if (context.state === 'suspended') {
    void context
      .resume()
      .then(playChime)
      .catch(() => undefined);
    return;
  }

  playChime();
}
