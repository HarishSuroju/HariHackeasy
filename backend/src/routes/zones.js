const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const store = require('../data/store');

const router = express.Router();

const boolField = field => body(field).optional().toBoolean();

router.post(
  '/zones',
  [
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
    body('location').isString().trim().isLength({ min: 1, max: 200 }),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90').toFloat(),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180').toFloat(),
    body('type').optional().isString().trim().isLength({ max: 60 }),
    body('status').optional().isString().trim().isLength({ max: 60 }),
    body('capacity').optional().isString().trim().isLength({ max: 10 }),
    body('icon').optional().isString().trim().isLength({ max: 60 }),
    boolField('accessibleRoute'),
    boolField('wheelchairAccess'),
    boolField('elevator'),
    boolField('quietSpace'),
    boolField('accessibleRestroom'),
  ],
  validate,
  (req, res) => {
    const { name, type, location, status, capacity, icon, lat, lng, accessibleRoute, wheelchairAccess, elevator, quietSpace, accessibleRestroom } = req.body;
    const zone = store.addZone({
      name,
      type: type || 'Venue',
      location,
      status: status || 'Normal Traffic',
      capacity: capacity || '0%',
      icon: icon || 'fa-location-dot',
      lat,
      lng,
      accessibleRoute: Boolean(accessibleRoute),
      wheelchairAccess: Boolean(wheelchairAccess),
      elevator: Boolean(elevator),
      quietSpace: Boolean(quietSpace),
      accessibleRestroom: Boolean(accessibleRestroom),
    });
    res.json({ success: true, zones: store.getState().zones, zone });
  }
);

router.patch(
  '/zones/:id',
  [
    param('id').isInt().toInt(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('location').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('lat').optional().isFloat({ min: -90, max: 90 }).toFloat(),
    body('lng').optional().isFloat({ min: -180, max: 180 }).toFloat(),
    body('type').optional().isString().trim().isLength({ max: 60 }),
    body('status').optional().isString().trim().isLength({ max: 60 }),
    body('capacity').optional().isString().trim().isLength({ max: 10 }),
    body('icon').optional().isString().trim().isLength({ max: 60 }),
    boolField('accessibleRoute'),
    boolField('wheelchairAccess'),
    boolField('elevator'),
    boolField('quietSpace'),
    boolField('accessibleRestroom'),
  ],
  validate,
  (req, res) => {
    const zone = store.updateZone(req.params.id, req.body);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, zones: store.getState().zones });
  }
);

router.delete(
  '/zones/:id',
  [param('id').isInt().toInt()],
  validate,
  (req, res) => {
    const removed = store.removeZone(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Venue not found' });
    res.json({ success: true, zones: store.getState().zones });
  }
);

module.exports = router;
