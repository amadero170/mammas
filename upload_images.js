const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImages() {
  const imagesToUpload = [
    {
      path: './public/Imágenes/home_image.jpg',
      id: 'mammas_home_image',
    },
    {
      path: './public/Imágenes/contacto_image.jpg',
      id: 'mammas_contacto_image',
    }
  ];

  for (const image of imagesToUpload) {
    try {
      console.log(`Uploading ${image.path}...`);
      const result = await cloudinary.uploader.upload(image.path, {
        public_id: image.id,
        folder: 'mammas-assets',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });
      console.log(`Success! URL for ${image.id}: ${result.secure_url}`);
    } catch (error) {
      console.error(`Error uploading ${image.path}:`, error);
    }
  }
}

uploadImages();
