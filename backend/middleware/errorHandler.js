// 404 handler — runs when no route matched the request.
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Centralized error handler — catches errors passed via next(err)
// as well as ones thrown inside async route handlers wrapped with asyncHandler.
function errorHandler(err, req, res, next) {
  console.error("❌", err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, error: `That ${field} is already in use.` });
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: `Invalid ${err.path}.` });
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? "Server error. Please try again later." : err.message,
  });
}

// Wraps an async route handler so rejected promises are forwarded to errorHandler
// instead of crashing the process or hanging the request.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { notFound, errorHandler, asyncHandler };
