import { AuthService } from '../app/service/auth.service.mjs';

/**
 * Middleware to validate the token in the Authorization header.
 * Attaches userId, email, and index to req.user if valid, otherwise returns a 401 error.
 */
export default async function tokenMiddleware(req, res, next) {
  // Initialize AuthService
  const authService = new AuthService();

  // Extract token from Authorization header (e.g., "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token after "Bearer"

  // Check if token is missing
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Fetch all users from auth.json
    const users = await authService.auths();

    // Step 1: Check if token matches any user's 'current' field
    let user = users.find((u) => u.current === token);

    if (user) {
      // Get the user's index in the records array
      const index = await authService.getByIndex('current', token);
      if (index === -1) {
        return res.status(500).json({ error: 'User index not found' });
      }

      // Token matches 'current', attach minimal user data with index
      req.user = user;
      req.userIndex = index;
      return next(); // Proceed to next middleware/controller
    }

    // Step 2: If no match in 'current', check session arrays for the token
    for (const u of users) {
      if (u.session && Array.isArray(u.session)) {
        const sessionWithToken = u.session.find((s) => s.token === token);
        if (sessionWithToken) {
          // Token found in session but not 'current', indicating another device logged in
          return res.status(401).json({
            error: 'Session invalid. Another device has logged in. Please log in again.',
          });
        }
      }
    }

    // Step 3: Token not found in 'current' or any session
    return res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
