const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET)
}

function uploadBufferToCloudinary(buffer, folder = 'sewa-bazaar-products') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result?.secure_url || '')
      }
    )

    stream.end(buffer)
  })
}

module.exports = {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
}
