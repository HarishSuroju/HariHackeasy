const express = require('express');
const store = require('../data/store');

const router = express.Router();

router.get('/state', (req, res) => {
  res.json(store.getState());
});

module.exports = router;
