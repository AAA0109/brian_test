const express = require('express');
const { getFilteredResponses } = require('../controllers');

const router = express.Router();

router.get('/', (req, res) => {
  res.send({ message: 'Hello world' });
});

router.get('/:formId/filteredResponses', getFilteredResponses);

module.exports = router;
