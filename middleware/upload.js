const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const allowedExt = /jpeg|jpg|png|gif|webp|mp4|webm|mov|m4v/;

function fileFilter(req, file, cb) {
  const isValid = allowedExt.test(path.extname(file.originalname).toLowerCase()) &&
    (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'));
  if (isValid) cb(null, true);
  else cb(new Error('Only image (jpg, png, gif, webp) or video (mp4, webm, mov) files are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB — video files need more headroom than images
});

module.exports = upload;
