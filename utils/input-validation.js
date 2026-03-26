function isCombiningMark(char) {
  const code = char.codePointAt(0);
  return (
    (code >= 0x0300 && code <= 0x036f) ||
    (code >= 0x1ab0 && code <= 0x1aff) ||
    (code >= 0x1dc0 && code <= 0x1dff) ||
    (code >= 0x20d0 && code <= 0x20ff) ||
    (code >= 0xfe20 && code <= 0xfe2f)
  );
}

function hasExcessiveCombiningMarks(text) {
  let markCount = 0;
  let markRun = 0;
  let maxMarkRun = 0;
  let totalChars = 0;

  for (const char of text) {
    totalChars += 1;
    if (isCombiningMark(char)) {
      markCount += 1;
      markRun += 1;
      if (markRun > maxMarkRun) maxMarkRun = markRun;
    } else {
      markRun = 0;
    }
  }

  if (markCount === 0) return false;
  const baseChars = Math.max(1, totalChars - markCount);

  return maxMarkRun >= 4 || markCount >= 16 || (markCount / baseChars) > 0.35;
}

function hasSuspiciousBlockGlyphFlood(text) {
  const blockLikeChars = text.match(/[█▓▒░■▇▆▅▄▃▂▁▮▯]/g) || [];
  return blockLikeChars.length >= 12;
}

function hasLongRepeatedCharRun(text) {
  return /(.)\1{20,}/u.test(text);
}

function validateUserText(value, options = {}) {
  const {
    fieldLabel = 'Text',
    minLength = 3,
    maxLength = 500
  } = options;

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldLabel} musi byt text.` };
  }

  const normalized = value.trim();
  if (normalized.length < minLength) {
    return { valid: false, error: `${fieldLabel} musi mit alespon ${minLength} znaky.` };
  }
  if (normalized.length > maxLength) {
    return { valid: false, error: `${fieldLabel} je prilis dlouhy (max ${maxLength} znaku).` };
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    return { valid: false, error: `${fieldLabel} obsahuje nepovolene ridici znaky.` };
  }

  if (/<\/?[a-z][^>]*>/i.test(normalized)) {
    return { valid: false, error: `${fieldLabel} nesmi obsahovat HTML.` };
  }

  if (/(https?:\/\/|www\.)/i.test(normalized)) {
    return { valid: false, error: `${fieldLabel} nesmi obsahovat odkazy.` };
  }

  if (hasExcessiveCombiningMarks(normalized) || hasSuspiciousBlockGlyphFlood(normalized) || hasLongRepeatedCharRun(normalized)) {
    return { valid: false, error: `${fieldLabel} obsahuje spam nebo necitelne znaky.` };
  }

  return { valid: true, value: normalized };
}

export {
  validateUserText
};
