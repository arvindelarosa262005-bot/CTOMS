let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) audioCtx = new Ctor()
      else return null
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

// Call this from a user gesture (e.g. tapping "Start Camera") so mobile
// browsers unlock the AudioContext before any scan beep is needed.
export function initSound() {
  getCtx()
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) {
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + start)
    gain.gain.setValueAtTime(volume, ctx.currentTime + start)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + duration)
  } catch {
    /* ignore audio errors */
  }
}

export function playScanSuccess() {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime
  // clear, distinct double "beep"
  tone(ctx, 1200, 0, 0.09, 0.4, 'square')
  tone(ctx, 1600, 0.1, 0.12, 0.4, 'square')
}

export function playScanError() {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime
  // lower, shorter single "beep" for errors
  tone(ctx, 300, 0, 0.12, 0.35, 'square')
  tone(ctx, 220, 0.13, 0.15, 0.35, 'square')
}
