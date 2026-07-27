import { beforeEach, describe, expect, it, vi } from 'vitest';
import { playRestAlert } from './restAlert';

const vibrate = vi.fn();
const setValueAtTime = vi.fn();
const exponentialRampToValueAtTime = vi.fn();
const start = vi.fn();
const stop = vi.fn();

class AudioContextMock {
  currentTime = 10;
  destination = {};
  state = 'running';

  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime },
      connect: vi.fn(),
      start,
      stop
    };
  }

  createGain() {
    return {
      gain: { setValueAtTime, exponentialRampToValueAtTime },
      connect: vi.fn()
    };
  }

  resume() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate
  });
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    value: AudioContextMock
  });
});

describe('rest alert', () => {
  it('uses a short vibration pattern and two gentle tones', () => {
    playRestAlert();

    expect(vibrate).toHaveBeenCalledWith([160, 100, 160]);
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);
    expect(exponentialRampToValueAtTime).toHaveBeenCalledWith(0.035, 10.025);
  });
});
