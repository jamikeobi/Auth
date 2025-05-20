import { AuthService } from '../app/service/auth.service.mjs';

/**
 * Middleware to validate the apiKey header in incoming requests.
 * Attaches the apiKey, user email, and user index to req.api if valid, otherwise returns a 401 error.
 */
export default async function apiKeyMiddleware(req, res, next) {
  // Initialize AuthService
  const authService = new AuthService();

  // Extract apiKey from apikey header (case-insensitive)
  const apiKey = req.headers['apikey'];

  // Check if apiKey is missing
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing apiKey' });
  }

  try {
    // Check if any user has the provided apiKey
    const user = await authService.getBy('apikey', apiKey);

    // If no user found with the apiKey, return 401
    if (!user) {
      return res.status(401).json({ error: 'Invalid apiKey' });
    }

    // Get the user's index in the records array
    const index = await authService.getByIndex('apikey', apiKey);
    if (index === -1) {
      return res.status(500).json({ error: 'User index not found' });
    }

    // Attach apiKey, email, and index to request object
    req.api = {
      apiKey,
      email: user.email,
      id: user.id,
      index,
      user
    };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
