import { v2 as Cloudinary } from 'cloudinary';
import config from '@app/config';

Cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export { Cloudinary as cloudinary };