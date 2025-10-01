//backend/src/web/utils/cloudinary.ts
// const cloudinary=require('cloudinary').v2;
import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary with your credentials from the .env file
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // It's good practice to enforce HTTPS
});
cloudinary.api.ping((error: any, result: any) => {
  if (error) {
    console.error("Ping failed:", error);
  } else {
    console.log("Ping success:", result);
  }
});
// This function takes a file buffer (from multer) and uploads it to Cloudinary as a stream
export const uploadStream = (buffer: Buffer): Promise<UploadApiResponse | UploadApiErrorResponse> => {
  return new Promise((resolve, reject) => {
    
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