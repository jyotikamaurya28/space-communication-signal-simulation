// Signal simulation utilities for space communication

const SPEED_OF_LIGHT = 299792.458; // km/s

export type SignalType = "sine" | "square" | "sawtooth" | "pulse";

export interface SignalParams {
  frequency: number;
  amplitude: number;
  duration: number;
  samplingRate: number;
  signalType: SignalType;
}

export interface SignalData {
  time: number[];
  values: number[];
}

/** Generate a signal based on type */
export function generateSignal(params: SignalParams): SignalData {
  const { frequency, amplitude, duration, samplingRate, signalType } = params;
  const numSamples = Math.floor(duration * samplingRate);
  const time: number[] = [];
  const values: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const t = i / samplingRate;
    time.push(t);
    const phase = frequency * t;
    let v = 0;

    switch (signalType) {
      case "sine":
        v = Math.sin(2 * Math.PI * phase);
        break;
      case "square":
        v = Math.sin(2 * Math.PI * phase) >= 0 ? 1 : -1;
        break;
      case "sawtooth":
        v = 2 * (phase - Math.floor(phase + 0.5));
        break;
      case "pulse": {
        const frac = phase - Math.floor(phase);
        v = frac < 0.2 ? 1 : 0; // 20% duty cycle
        break;
      }
    }

    values.push(amplitude * v);
  }

  return { time, values };
}

/** Compute signal delay based on distance */
export function computeDelay(distanceKm: number): number {
  return distanceKm / SPEED_OF_LIGHT;
}

/** Generate a delayed version of the signal */
export function delaySignal(signal: SignalData, delaySec: number, params: SignalParams): SignalData {
  const delayedParams = { ...params };
  const values = signal.time.map((t) => {
    const delayedT = t - delaySec;
    if (delayedT < 0) return 0;
    const phase = delayedParams.frequency * delayedT;
    switch (delayedParams.signalType) {
      case "sine": return delayedParams.amplitude * Math.sin(2 * Math.PI * phase);
      case "square": return delayedParams.amplitude * (Math.sin(2 * Math.PI * phase) >= 0 ? 1 : -1);
      case "sawtooth": return delayedParams.amplitude * 2 * (phase - Math.floor(phase + 0.5));
      case "pulse": return delayedParams.amplitude * ((phase - Math.floor(phase)) < 0.2 ? 1 : 0);
      default: return delayedParams.amplitude * Math.sin(2 * Math.PI * phase);
    }
  });

  return { time: [...signal.time], values };
}

/** Compute Doppler-shifted frequency */
export function computeDopplerFrequency(originalFreq: number, velocityKmS: number): number {
  const beta = velocityKmS / SPEED_OF_LIGHT;
  if (Math.abs(beta) >= 1) return originalFreq;
  return originalFreq * Math.sqrt((1 - beta) / (1 + beta));
}

/** Generate Doppler-shifted signal */
export function dopplerSignal(params: SignalParams, velocityKmS: number): SignalData {
  const shiftedFreq = computeDopplerFrequency(params.frequency, velocityKmS);
  return generateSignal({ ...params, frequency: shiftedFreq });
}

/** Add Gaussian noise to a signal */
export function addNoise(signal: SignalData, stdDev: number): SignalData {
  const values = signal.values.map((v) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const noise = stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return v + noise;
  });
  return { time: [...signal.time], values };
}

/** Simple moving average low-pass filter */
export function lowPassFilter(signal: SignalData, windowSize: number): SignalData {
  const half = Math.floor(windowSize / 2);
  const values = signal.values.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(signal.values.length - 1, i + half); j++) {
      sum += signal.values[j];
      count++;
    }
    return sum / count;
  });
  return { time: [...signal.time], values };
}

/** Signal attenuation using inverse square law */
export function attenuateSignal(signal: SignalData, distanceKm: number, refDistanceKm: number = 1000): SignalData {
  if (distanceKm <= 0) return signal;
  const attenuation = (refDistanceKm * refDistanceKm) / (distanceKm * distanceKm);
  const factor = Math.min(1, attenuation);
  const values = signal.values.map((v) => v * factor);
  return { time: [...signal.time], values };
}

/** Compute attenuation factor in dB */
export function attenuationDb(distanceKm: number, refDistanceKm: number = 1000): number {
  if (distanceKm <= 0) return 0;
  return 20 * Math.log10(refDistanceKm / distanceKm);
}

/** Compute Signal-to-Noise Ratio in dB */
export function computeSNR(signal: SignalData, noisy: SignalData): number {
  let signalPower = 0;
  let noisePower = 0;
  for (let i = 0; i < signal.values.length; i++) {
    signalPower += signal.values[i] * signal.values[i];
    const noise = noisy.values[i] - signal.values[i];
    noisePower += noise * noise;
  }
  if (noisePower === 0) return Infinity;
  return 10 * Math.log10(signalPower / noisePower);
}

/** Estimate Bit Error Rate from SNR (using BPSK approximation) */
export function estimateBER(snrDb: number): number {
  // BER ≈ 0.5 * erfc(sqrt(SNR_linear))
  const snrLinear = Math.pow(10, snrDb / 10);
  return 0.5 * erfc(Math.sqrt(snrLinear));
}

/** Complementary error function approximation */
function erfc(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 1 - sign * y;
}

/** Format time to readable string */
export function formatDelay(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(2)} ms`;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)} min`;
  return `${(seconds / 3600).toFixed(2)} hours`;
}

/** Downsample signal data for chart rendering */
export function downsampleForChart(signal: SignalData, maxPoints: number = 500): { time: number; value: number }[] {
  const step = Math.max(1, Math.floor(signal.time.length / maxPoints));
  const result: { time: number; value: number }[] = [];
  for (let i = 0; i < signal.time.length; i += step) {
    result.push({ time: signal.time[i], value: signal.values[i] });
  }
  return result;
}
