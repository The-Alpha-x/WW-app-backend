export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed", errors: err.errors });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists" });
  }
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    message: status >= 500 ? "Internal server error" : err.message
  });
}
