export function closeAudioContext(ctx: AudioContext | null | undefined): void {
  if (!ctx) return;
  try {
    if (ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
  } catch {
    // noop
  }
}

export function cancelRaf(id: number | null | undefined): void {
  if (id != null) {
    try { cancelAnimationFrame(id); } catch { /* noop */ }
  }
}

export function clearTimer(id: number | null | undefined): void {
  if (id != null) {
    try { clearInterval(id); } catch { /* noop */ }
  }
}

export function clearTimeoutTimer(id: number | null | undefined): void {
  if (id != null) {
    try { clearTimeout(id); } catch { /* noop */ }
  }
}
