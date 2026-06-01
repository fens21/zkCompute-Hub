app.post('/api/uploadProof', async (req, res) => {
  try {
    const jobId = req.query.jobId;
    const worker = req.query.worker;
    if (!jobId || !worker) return res.status(400).json({ error: 'Missing params' });
    const buffers = [];
    req.on('data', chunk => buffers.push(chunk));
    req.on('end', async () => {
      const fileBuffer = Buffer.concat(buffers);
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      const ext = (req.headers['x-filename']?.split('.').pop() || 'bin');
      const filename = `proof-${jobId}-${worker.toLowerCase()}.${ext}`;
      const uploadRes = await axios({
        method: 'POST',
        url: `${SUPABASE_URL}/storage/v1/object/avatars/${filename}`,
        data: fileBuffer,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
      });
      if (!uploadRes.ok && uploadRes.status !== 200 && uploadRes.status !== 201) {
        return res.status(500).json({ error: 'Upload failed' });
      }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proofs/${filename}`;
      res.json({ url: publicUrl });
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});
