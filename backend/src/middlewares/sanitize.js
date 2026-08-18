import sanitizeHtml from 'sanitize-html';

const MAX_DEPTH = 6;
const MAX_STRING_LENGTH = 5000;

const cleanString = (value) => {
  let str = String(value);
  str = str.replace(/\u0000/g, '');
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
};

const sanitizeDeep = (input, depth = 0) => {
  if (depth > MAX_DEPTH) return undefined;

  if (Array.isArray(input)) {
    return input.slice(0, 100).map((item) => sanitizeDeep(item, depth + 1));
  }

  if (input && typeof input === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      if (typeof value === 'string') {
        out[key] = cleanString(value).slice(0, MAX_STRING_LENGTH);
      } else {
        out[key] = sanitizeDeep(value, depth + 1);
      }
    }
    return out;
  }

  if (typeof input === 'string') {
    return cleanString(input).slice(0, MAX_STRING_LENGTH);
  }
  return input;
};

export const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = sanitizeDeep(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitizeDeep(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitizeDeep(req.params);
  return next();
};
