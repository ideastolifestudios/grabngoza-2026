import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Allow larger payloads (base64 images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🔒 safety check (prevents 500 crash)
    if (!req.body) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // 🚀 upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'grab-go-za',
    });

    return res.status(200).json({
      imageUrl: result.secure_url,
    });

  } catch (err: any) {
    console.error('UPLOAD ERROR:', err);

    return res.status(500).json({
      error: err?.message || 'Upload failed',
    });
  }
}