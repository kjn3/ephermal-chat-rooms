const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { putItem, getItem } = require('../database/dynamodb');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE_NAME || 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { email, password, nickname } = req.body;
    const existing = await getItem(USERS_TABLE, { email });
    if (existing && existing.Item) return res.status(400).json({ success: false, message: 'Email in use' });
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    const user = { email, passwordHash: hash, nickname: nickname || email.split('@')[0], createdAt: new Date().toISOString() };
    await putItem(USERS_TABLE, user);
    const token = jwt.sign({ sub: email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token,
      data: {
        token,
        user: {
          email: user.email,
          nickname: user.nickname
        }
      }
    });
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { email, password } = req.body;
    const found = await getItem(USERS_TABLE, { email });
    if (!found || !found.Item) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, found.Item.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ sub: email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token,
      data: {
        token,
        user: {
          email: found.Item.email,
          nickname: found.Item.nickname
        }
      }
    });
  }
);

// Verify token endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const { sub: email } = req.user;
    const found = await getItem(USERS_TABLE, { email });
    
    if (!found || !found.Item) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          email: found.Item.email,
          nickname: found.Item.nickname
        }
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});

// Change password endpoint
router.put('/change-password',
  authenticateToken,
  body('currentPassword').isLength({ min: 8 }),
  body('newPassword').isLength({ min: 8 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      const { sub: email } = req.user;
      
      const found = await getItem(USERS_TABLE, { email });
      if (!found || !found.Item) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, found.Item.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
      
      const salt = await bcrypt.genSalt(12);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);
      
      await putItem(USERS_TABLE, {
        ...found.Item,
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
);

module.exports = router;


