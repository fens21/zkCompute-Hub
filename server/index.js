const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Check .env file.');
  process.exit(1);
}

app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.post('/api/uploadProof', async (req, res) => {
  try {
    const jobId = req.query.jobId;
    const worker = req.query.worker;
    if (!jobId || !worker) return res.status(400).json({ error: 'Missing params' });

    const fileBuffer = req.body;
    if (!fileBuffer || fileBuffer.length === 0) return res.status(400).json({ error: 'No file data' });

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
    });

    if (uploadRes.status !== 200 && uploadRes.status !== 201) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proofs/${filename}`;
    res.json({ url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`zkCompute Hub server running on port ${PORT}`);
});
