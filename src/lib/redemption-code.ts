const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Code unique type SCANO-X7K2M9 (6 caractères) dérivé du quiz et du timestamp. */
export function generateRedemptionCode(quizId: string, timestamp = Date.now()): string {
  const seed = `${quizId}-${timestamp}`;
  let h1 = 0;
  let h2 = 5381;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = (h1 << 5) - h1 + c;
    h2 = (h2 << 5) + h2 + c;
  }
  let body = "";
  let state = Math.abs(h1 ^ h2) || 1;
  for (let i = 0; i < 6; i++) {
    state = (state * 1103515245 + 12345 + seed.charCodeAt(i % seed.length)) >>> 0;
    body += CODE_CHARS[state % CODE_CHARS.length];
  }
  return `SCANO-${body}`;
}
