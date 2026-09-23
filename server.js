const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve your custom login screen (index.html, style.css)
app.use(express.static(__dirname));

// Advanced rewriting proxy endpoint
app.use('/proxy/:target*', (req, res, next) => {
    let targetUrl = req.params.target + (req.params[0] || '') + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        secure: false,
        pathRewrite: (path, req) => '', // Strips the /proxy prefix safely
        onProxyReq: (proxyReq, req, res) => {
            // Disguise the traffic completely as a normal desktop user
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            proxyReq.setHeader('Referer', targetUrl);
            proxyReq.setHeader('Origin', targetUrl);
        },
        onProxyRes: (proxyRes, req, res) => {
    // Strip security blockades completely
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['content-security-policy-report-only'];
    
    // Force cross-origin resources to authorize loading into the iframe container
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
}

            }
        },
        onError: (err, req, res) => {
            res.status(500).send('Unblocker Error: This website layout is too complex for a standard relay.');
        }
    });

    proxy(req, res, next);
});

app.listen(PORT, () => {
    console.log(`🔥 Advanced Unblocker running on port ${PORT}`);
});
