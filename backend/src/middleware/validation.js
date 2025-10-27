const { body, validationResult } = require('express-validator');

const validateRoomData = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be between 1 and 50 characters'),
  
  body('password')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Password must be between 4 and 20 characters'),
  
  body('maxUsers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max users must be between 2 and 100'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateJoinData = [
  body('nickname')
    .isLength({ min: 1, max: 20 })
    .withMessage('Nickname must be between 1 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Nickname can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Password must be between 4 and 20 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateRoomData,
  validateJoinData
};
