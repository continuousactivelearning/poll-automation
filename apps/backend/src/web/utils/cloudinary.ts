//backend/src/web/utils/cloudinary.ts
// const cloudinary=require('cloudinary').v2;
import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

// Check if Cloudinary credentials are available
const hasCloudinaryConfig = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  // Configure Cloudinary with your credentials from the .env file
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // It's good practice to enforce HTTPS
  });
  
  // Only ping if configuration is available
  cloudinary.api.ping((error: any, result: any) => {
    if (error) {
      console.error("Ping failed:", error);
    } else {
      console.log("Ping success:", result);
    }
  });
} else {
  console.warn("⚠️ Cloudinary configuration missing - image upload features will be disabled");
}
// This function takes a file buffer (from multer) and uploads it to Cloudinary as a stream
export const uploadStream = (buffer: Buffer): Promise<UploadApiResponse | UploadApiErrorResponse> => {
  return new Promise((resolve, reject) => {
    
    // Check if Cloudinary is configured
    if (!hasCloudinaryConfig) {
      reject(new Error('Cloudinary not configured - image upload unavailable'));
      return;
    }
    
    // Create an upload stream to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: 'pollgen_avatars', // Optional: saves all avatars to a specific folder in Cloudinary
        resource_type: 'auto'
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (result) {
          resolve(result); // If successful, resolve the promise with the result
        } else {
          reject(error); // If there's an error, reject the promise
        }
      }
    );

    // Use streamifier to create a readable stream from the file buffer and pipe it to Cloudinary
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
// Function to delete an image from Cloudinary using its public_id
export const deleteImage = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// Helper function to extract public_id from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      return null;
    }
    
    // Get the public_id part (skip version if present)
    let publicIdPart = urlParts.slice(uploadIndex + 1);
    
    // Remove version if it's a number (v1234567890)
    if (publicIdPart[0] && /^v\d+$/.test(publicIdPart[0])) {
      publicIdPart = publicIdPart.slice(1);
    }
    
    // Join the remaining parts and remove file extension
    const publicId = publicIdPart.join('/').replace(/\.[^/.]+$/, '');
    
    return publicId || null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
};

// import { v2 as cloudinary } from 'cloudinary';
// import { Readable } from 'stream';

// // Configure Cloudinary with your credentials
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
//   api_key: process.env.CLOUDINARY_API_KEY || '',
//   api_secret: process.env.CLOUDINARY_API_SECRET || '',
// });

// export const uploadStream = (buffer: Buffer): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream((error, result) => {
//       if (error) return reject(error);
//       resolve(result);
//     });
//     Readable.from(buffer).pipe(stream);
//   });
// };