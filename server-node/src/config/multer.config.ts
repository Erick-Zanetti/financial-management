import multer from 'multer';

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and CSV files are allowed'));
    }
  },
});
