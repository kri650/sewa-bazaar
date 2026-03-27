const multer = require('multer')

function imageOnlyFilter(_req, file, cb) {
  if (!file?.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'))
    return
  }
  cb(null, true)
}

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

module.exports = {
  productImageUpload,
}
