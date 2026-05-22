const META_SUFFIXES = ["_other_text", "_why"];

function isMetaKey(key: string): boolean {
  return META_SUFFIXES.some((s) => key.endsWith(s));
}

export function formatAnswersForDisplay(answers: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const [key, val] of Object.entries(answers)) {
    if (isMetaKey(key)) continue;
    if (val === undefined || val === null || val === "") continue;
    if (seen.has(key)) continue;
    seen.add(key);

    let display = "";
    if (Array.isArray(val)) {
      display = val.join(", ");
    } else {
      display = String(val);
    }

    const otherText = answers[`${key}_other_text`];
    if (otherText && String(otherText).trim()) {
      display += ` — Autre : ${String(otherText).trim()}`;
    }

    const why = answers[`${key}_why`];
    if (why && String(why).trim()) {
      display += ` (Pourquoi : ${String(why).trim()})`;
    }

    rows.push({ label: key, value: display });
  }

  return rows;
}
