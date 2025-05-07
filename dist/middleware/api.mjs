/**
 * Middleware to validate the apiKey header in incoming requests.
 * Attaches the apiKey to req.apiKey if valid, otherwise returns a 401 error.
*/
export default function apiKeyMiddleware(req, res, next) {
  // Extract apiKey from apiKey header
  const apiKey = req.headers['apikey']; // Header names are case-insensitive in HTTP

  // Check if apiKey is undefined or missing
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing or invalid apiKey' });
  }

  // Attach apiKey to request object
  req.apiKey = apiKey;

  // Proceed to the next middleware or route handler
  next();
}