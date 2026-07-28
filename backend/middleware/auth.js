const jwt = require("jsonwebtoken");

// Verifies the "Authorization: Bearer <token>" header and attaches
// the decoded payload (userId, role) to req.user if valid.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Session expired or invalid. Please log in again.",
    });
  }
}

module.exports = { requireAuth };
