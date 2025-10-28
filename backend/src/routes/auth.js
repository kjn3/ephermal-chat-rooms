const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { putItem, getItem } = require('../database/dynamodb');

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
    res.json({ success: true, token });
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
    res.json({ success: true, token });
  }
);

module.exports = router;


