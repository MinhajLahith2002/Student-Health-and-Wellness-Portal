/**
 * `mongodb+srv://` URIs must not contain `:` in any host segment (MongoDB driver rule).
 * Atlas hostnames must not use an explicit :port; ports may appear as `host:27017`,
 * `h1:27017,h2:27017`, or `host%3A27017` in malformed .env values.
 */

function stripSrvHostSegment(raw) {
  let h = raw.trim();
  if (!h) return h;

  // URL-encoded trailing :port (e.g. ...net%3A27017)
  if (/%3a\d+$/i.test(h)) {
    h = h.replace(/%3a\d+$/i, '');
  }

  try {
    const decoded = decodeURIComponent(h);
    if (decoded !== h) {
      h = decoded;
    }
  } catch {
    // keep h
  }

  // [::1]:27017
  if (h.startsWith('[')) {
    const close = h.indexOf(']');
    if (close !== -1) {
      const after = h.slice(close + 1);
      if (/^:\d+$/.test(after)) {
        return h.slice(0, close + 1);
      }
    }
    return h;
  }

  return h.replace(/:\d+$/, '');
}

function normalizeMongoUri(uri) {
  if (uri == null || typeof uri !== 'string') return uri;

  let s = uri.trim().replace(/^\uFEFF/, '');
  const schemeMatch = s.match(/^mongodb\+srv:\/\//i);
  if (!schemeMatch) {
    return uri;
  }

  // Canonicalize scheme so downstream parsers see lowercase mongodb+srv://
  s = `mongodb+srv://${s.slice(schemeMatch[0].length)}`;

  const at = s.indexOf('@');
  let prefix;
  let hostListChunk;
  let suffix;

  if (at === -1) {
    prefix = 'mongodb+srv://';
    const afterScheme = s.slice('mongodb+srv://'.length);
    const delim = afterScheme.search(/[/\?#]/);
    if (delim === -1) {
      hostListChunk = afterScheme;
      suffix = '';
    } else {
      hostListChunk = afterScheme.slice(0, delim);
      suffix = afterScheme.slice(delim);
    }
  } else {
    prefix = s.slice(0, at + 1);
    const afterAt = s.slice(at + 1);
    const delim = afterAt.search(/[/\?#]/);
    if (delim === -1) {
      hostListChunk = afterAt;
      suffix = '';
    } else {
      hostListChunk = afterAt.slice(0, delim);
      suffix = afterAt.slice(delim);
    }
  }

  const hosts = hostListChunk
    .split(',')
    .map(stripSrvHostSegment)
    .join(',');

  return prefix + hosts + suffix;
}

/**
 * First non-empty Mongo connection string from env (common naming variants).
 */
function resolveMongoUriFromEnv() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    process.env.DATABASE_URL,
    process.env.MONGODB_URL,
  ].filter(Boolean);

  const raw = candidates[0];
  return raw ? raw.trim().replace(/^\uFEFF/, '') : raw;
}

export default { normalizeMongoUri, resolveMongoUriFromEnv };
