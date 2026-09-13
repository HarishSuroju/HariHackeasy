const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const store = require('../data/store');

const router = express.Router();

router.post(
  '/announcement',
  [
    body('announcement')
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Announcement must be between 1 and 500 characters'),
  ],
  validate,
  (req, res) => {
    const { announcement } = req.body;
    const state = store.setAnnouncement(announcement);
    res.json({ success: true, announcement: state.announcement, alerts: state.alerts, updatedAt: state.updatedAt });
  }
);

module.exports = router;
