const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function normalize(err) {
  if (err instanceof ApiError) return err;

  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }
  if (err.type === 'entity.too.large') {
    return new ApiError(413, 'Request body too large');
  }
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }

  const internal = new ApiError(500, 'Internal server error');
  internal.original = err;
  return internal;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const apiError = normalize(err);
  if (apiError.status >= 500) {
    console.error(apiError.original || err);
  }

  const body = { error: { status: apiError.status, message: apiError.message } };
  if (apiError.details) body.error.details = apiError.details;
  if (nodeEnv === 'development' && apiError.status >= 500 && apiError.original) {
    body.error.stack = apiError.original.stack;
  }

  res.status(apiError.status).json(body);
}

module.exports = { notFound, errorHandler };
