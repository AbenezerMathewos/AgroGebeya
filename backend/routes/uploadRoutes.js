const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/uploads  (field name: "image") — farmers only
router.post('/', protect, authorize('farmer'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // Multer errors (bad file type, too large) land here instead of throwing
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file was provided' });
    }

    // Served statically from server.js as /uploads/<filename>
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

module.exports = router;