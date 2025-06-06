const ALLOWED_DOMAINS = ['http://localhost:4200', 'https://auth.searchforcleaner.com'];

export default async function authMiddleware(req, res, next) {
  let origin = req.get('origin');

  // Fallback to Referer header if Origin is undefined
  if (!origin) {
    const referer = req.get('referer');
    if (referer) {
      try {
        // Extract protocol and host from Referer (e.g., https://localhost:4200/path -> https://localhost:4200)
        const match = referer.match(/^(https?:\/\/[^/]+)/);
        if (match) {
          origin = match[1]; // Capture protocol and host (e.g., https://localhost:4200)
        } else {
          return res.status(403).json({ error: 'Forbidden: Invalid Referer header' });
        }
      } catch (error) {
        console.error('Referer parsing error:', error);
        return res.status(403).json({ error: 'Forbidden: Invalid or missing origin' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden: Origin or Referer header missing' });
    }
  }

  // Allow requests from explicitly permitted domains
  if (ALLOWED_DOMAINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
  }

  // Check if user exists (set by tokenMiddleware)
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No user data available' });
  }

  try {
    // Check if the origin is in the user's API array
    const isValidOrigin = req.user.api && Array.isArray(req.user.api) &&
      req.user.api.some(api => api.websiteUrl === origin);

    if (!isValidOrigin) {
      return res.status(403).json({ error: 'Forbidden: Origin not allowed' });
    }

    // Set CORS headers for valid origins
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
