import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';

const app = express();

const port = Number(process.env.PORT || 8080);
const bucketName = process.env.BUCKET_NAME || '';
const serviceApiKey = process.env.UPLOAD_API_KEY || '';
const allowOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const makePublic = (process.env.MAKE_PUBLIC || 'false').toLowerCase() === 'true';

const storage = new Storage();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 60 * 1024 * 1024),
  },
});

const allowedMimeByKind = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowOrigins.length === 0 || allowOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
  }),
);

app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'cloud-upload-service',
    bucketConfigured: !!bucketName,
    hasApiKeyProtection: !!serviceApiKey,
  });
});

app.post('/artifacts/upload', upload.single('file'), async (req, res) => {
  try {
    if (!bucketName) {
      return res.status(500).json({ message: 'BUCKET_NAME is not configured.' });
    }

    if (serviceApiKey) {
      const requestKey = req.header('x-upload-api-key') || '';
      if (requestKey !== serviceApiKey) {
        return res.status(401).json({ message: 'Unauthorized upload request.' });
      }
    }

    const file = req.file;
    const kind = (req.body.kind || '').toString().trim();
    const prompt = (req.body.prompt || '').toString().trim();
    const timestamp = (req.body.timestamp || new Date().toISOString()).toString();

    if (!file) {
      return res.status(400).json({ message: 'Missing file.' });
    }

    if (kind !== 'image' && kind !== 'video') {
      return res.status(400).json({ message: 'Invalid kind. Must be image or video.' });
    }

    if (!allowedMimeByKind[kind].includes(file.mimetype)) {
      return res.status(400).json({
        message: `Invalid MIME type for ${kind}: ${file.mimetype}`,
      });
    }

    const safePrompt = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'artifact';

    const extension = file.mimetype.includes('webm')
      ? 'webm'
      : file.mimetype.includes('jpeg')
        ? 'jpg'
        : file.mimetype.includes('png')
          ? 'png'
          : 'mp4';

    const objectPath = `${kind}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safePrompt}.${extension}`;
    const bucket = storage.bucket(bucketName);
    const targetFile = bucket.file(objectPath);

    await targetFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          prompt: prompt || '',
          kind,
          timestamp,
        },
      },
      resumable: false,
      validation: 'crc32c',
    });

    if (makePublic) {
      await targetFile.makePublic();
    }

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;
    let signedUrl = '';

    if (!makePublic) {
      const [url] = await targetFile.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      });
      signedUrl = url;
    }

    return res.status(200).json({
      message: 'Artifact uploaded successfully.',
      url: makePublic ? publicUrl : signedUrl,
      objectPath,
      publicUrl,
      kind,
      contentType: file.mimetype,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return res.status(500).json({ message });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.message?.includes('CORS')) {
    return res.status(403).json({ message: error.message });
  }
  return res.status(500).json({ message: error?.message || 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`cloud-upload-service running on port ${port}`);
});
