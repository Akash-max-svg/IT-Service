// Central error handling middleware
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle invalid/malformed JSON in request payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Invalid JSON payload received in request body',
    });
  }

  const statusCode =
    err.statusCode || err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  console.error('API Error:', {
    message: err.message,
    status: statusCode,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
