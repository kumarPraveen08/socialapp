const { validationResult } = require("express-validator");
const { AppError } = require("./errorHandler");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new AppError(errorMessages[0], 400));
  }
  next();
};

module.exports = {
  validateRequest,
};
