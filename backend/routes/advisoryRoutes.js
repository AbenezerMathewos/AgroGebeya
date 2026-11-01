const express = require('express');
const router = express.Router();
const {
  getCropAdvisories,
  getAdvisoryById,
  diagnoseCropDisease,
  createCropAdvisory,
  chatWithAiAgronomist,
} = require('../controllers/advisoryController');

router.get('/', getCropAdvisories);
router.post('/', createCropAdvisory);
router.post('/diagnose', diagnoseCropDisease);
router.post('/chat', chatWithAiAgronomist);
router.get('/:id', getAdvisoryById);

module.exports = router;
