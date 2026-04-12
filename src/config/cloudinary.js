const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'laundrica/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

// Configure storage for service item images
const serviceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'laundrica/services',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Configure storage for user profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'laundrica/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }],
  },
});

// Configure storage for design images (custom designs)
const designStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'laundrica/designs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  },
});

// Multer upload instances
const uploadProductImages = multer({ storage: productStorage });
const uploadServiceImages = multer({ storage: serviceStorage });
const uploadProfileImage = multer({ storage: profileStorage });
const uploadDesignImage = multer({ storage: designStorage });

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadServiceImages,
  uploadProfileImage,
  uploadDesignImage,
  deleteImage: async (publicId) => {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  },
  deleteMultipleImages: async (publicIds) => {
    try {
      for (const publicId of publicIds) {
        await cloudinary.uploader.destroy(publicId);
      }
      return true;
    } catch (error) {
      console.error('Cloudinary delete multiple error:', error);
      return false;
    }
  },
};