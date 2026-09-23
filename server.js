const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
const PORT = 3000;


// 1. Serve your frontend files (index.html, style.css)
app.use(express.static(__dirname));

// 2. Native Unblocking Engine (Zero Middleware)
app.get('/proxy/*', (req, res) => {
    // Safely extract the target URL from the path
    let targetUrl = req.params[0] + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');

    if (!targetUrl) {
        return res.status(400).send('Please enter a valid website address.');
    }

    // Auto-attach HTTPS if missing
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const urlObj = new URL(targetUrl);
        const clientModule = urlObj.protocol === 'https:' ? https : http;

        // Clone the original request headers but update the Host
        const headers = { ...req.headers };
        headers['host'] = urlObj.host;
        // Disguise as a standard Chrome browser
        headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        const proxyReq = clientModule.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: req.method,
            headers: headers
        }, (proxyRes) => {
            // Forward status code and clone headers
            const responseHeaders = { ...proxyRes.headers };
            
            // Forcefully strip out strict security policies blocking framing layouts
            delete responseHeaders['x-frame-options'];
            delete responseHeaders['content-security-policy'];
            
            res.writeHead(proxyRes.statusCode, responseHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            res.status(502).send('Proxy Connection Error: Unable to fetch page.');
        });

        req.pipe(proxyReq);
    } catch (e) {
        res.status(400).send('Invalid URL format.');
    }
});

// Force the app to listen globally across the 0.0.0.0 network
app.listen(PORT, '0.0.0.0', () => {
    console.log('🔥 Unblocker server is running on http://0.0.0');
});

