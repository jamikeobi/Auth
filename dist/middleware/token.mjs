export default function tokenMiddleware(req, res, next) {
  // Extract token from Authorization header (e.g., "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token after "Bearer"

  // Check if token is undefined or missing
  if (!token) {
    return res.status(401).json({ error: 'Forbidden' });
  }

  // Attach token to request object
  req.token = token;

  // Proceed to the next middleware or route handler
  next();
}
