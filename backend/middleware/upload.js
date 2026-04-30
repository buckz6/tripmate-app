const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR   = path.join(__dirname, '..', 'uploads');
const MAX_SIZE     = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png'];

// Ensure uploads/ folder exists at startup
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext))
    return cb(null, true);
  cb(new Error('Only JPG and PNG images are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

module.exports = upload;
