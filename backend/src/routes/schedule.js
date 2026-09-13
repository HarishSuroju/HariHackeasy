const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const store = require('../data/store');

const router = express.Router();

const textField = (field, opts = {}) =>
  body(field)
    .optional(opts.optional || false)
    .isString()
    .trim()
    .isLength({ min: opts.min ?? 1, max: opts.max ?? 200 })
    .withMessage(`${field} must be between ${opts.min ?? 1} and ${opts.max ?? 200} characters`);

router.post(
  '/schedule',
  [
    textField('title'),
    textField('time'),
    textField('location'),
    textField('category', { optional: true }),
    textField('speaker', { optional: true }),
  ],
  validate,
  (req, res) => {
    const { title, time, location, category, speaker } = req.body;
    const newSession = store.addSession({
      title,
      time,
      location,
      category: category || 'General',
      speaker: speaker || 'TBA',
    });
    res.json({ success: true, schedule: store.getState().schedule, session: newSession });
  }
);

router.patch(
  '/schedule/:id',
  [
    param('id').isInt().withMessage('id must be an integer').toInt(),
    textField('title', { optional: true }),
    textField('time', { optional: true }),
    textField('location', { optional: true }),
    textField('category', { optional: true }),
    textField('speaker', { optional: true }),
  ],
  validate,
  (req, res) => {
    const session = store.updateSession(req.params.id, req.body);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, schedule: store.getState().schedule });
  }
);

router.delete(
  '/schedule/:id',
  [param('id').isInt().withMessage('id must be an integer').toInt()],
  validate,
  (req, res) => {
    const removed = store.removeSession(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, schedule: store.getState().schedule });
  }
);

module.exports = router;
