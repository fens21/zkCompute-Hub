const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Check .env file.');
  process.exit(1);
}

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['POST'],
  maxAge: 86400,
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(express.raw({ type: '*/*', limit: '10mb' }));

const VALID_WORKER_RE = /^0x[0-9a-fA-F]{40}$/;

app.post('/api/uploadProof', async (req, res) => {
  try {
    const jobId = req.query.jobId;
    const worker = req.query.worker;
    if (!jobId || !worker) return res.status(400).json({ error: 'Missing params' });
    if (!VALID_WORKER_RE.test(worker)) return res.status(400).json({ error: 'Invalid worker address' });

    const fileBuffer = req.body;
    if (!fileBuffer || fileBuffer.length === 0) return res.status(400).json({ error: 'No file data' });
    if (fileBuffer.length > 10 * 1024 * 1024) return res.status(413).json({ error: 'File too large' });

    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const ext = (req.headers['x-filename']?.split('.').pop() || 'bin');
    const filename = `proof-${jobId}-${worker.toLowerCase()}.${ext}`;

    const uploadRes = await axios({
      method: 'POST',
      url: `${SUPABASE_URL}/storage/v1/object/proofs/${filename}`,
      data: fileBuffer,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      timeout: 30000,
    });

    if (uploadRes.status !== 200 && uploadRes.status !== 201) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proofs/${filename}`;
    res.json({ url: publicUrl });
  } catch (e) {
    console.error('Upload error:', e.message);
    if (e.code === 'ECONNABORTED') return res.status(504).json({ error: 'Upload timed out' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`zkCompute Hub server running on port ${PORT}`);
});
