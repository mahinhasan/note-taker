const { validationResult, matchedData } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(chains) {
  return [
    ...chains,
    (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        const details = result.array({ onlyFirstError: true }).map((e) => ({
          field: e.path || 'body',
          location: e.location,
          message: e.msg,
        }));
        return next(ApiError.badRequest('Validation failed', details));
      }
      req.valid = {
        body: matchedData(req, { locations: ['body'], includeOptionals: false }),
        query: matchedData(req, { locations: ['query'], includeOptionals: false }),
        params: matchedData(req, { locations: ['params'], includeOptionals: false }),
      };
      return next();
    },
  ];
}

module.exports = validate;
