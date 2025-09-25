const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const CACHE_DIR = path.join(__dirname, 'cache');
const SECRET_KEY = process.env.SECRET_KEY || 'mysecret123';

(async () => {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating cache directory:', error);
    }
})();

app.get('/proxy', async (req, res) => {
    const videoUrl = req.query.url;
    const token = req.query.token;
    if (!videoUrl || !token) return res.status(400).send('Missing URL/token');
    const expectedToken = crypto.createHash('md5').update(videoUrl + SECRET_KEY).digest('hex');
    if (token !== expectedToken) return res.status(403).send('Unauthorized');
    const cacheKey = crypto.createHash('md5').update(videoUrl).digest('hex');
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.mp4`);
    try {
        const stats = await fs.stat(cachePath);
        if (stats && (Date.now() - stats.mtimeMs) < 24 * 3600 * 1000) {
            res.set('Content-Type', 'video/mp4');
            res.set('Access-Control-Allow-Origin', '*');
            return fs.createReadStream(cachePath).pipe(res);
        }
    } catch (error) {}
    try {
        const response = await axios.get(videoUrl, { responseType: 'stream' });
        res.set('Content-Type', 'video/mp4');
        res.set('Access-Control-Allow-Origin', '*');
        const writer = fs.createWriteStream(cachePath);
        response.data.pipe(writer);
        response.data.pipe(res);
        writer.on('finish', () => console.log('Cached:', cacheKey));
    } catch (error) {
        console.error('Error streaming:', error);
        res.status(500).send('Error streaming');
    }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));