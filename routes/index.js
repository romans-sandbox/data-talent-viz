var express = require('express');
var router = express.Router();

// get screen 1
router.get('/1', function(req, res, next) {
  res.render('1');
});

// get screen 2
router.get('/2', function(req, res, next) {
  res.render('2');
});

module.exports = router;
