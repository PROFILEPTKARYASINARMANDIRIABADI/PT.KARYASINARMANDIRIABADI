/**
 * server.js — Server profil perusahaan PT KSMA
 * Node.js murni (tanpa dependensi eksternal).
 *
 * Fungsi:
 *  - Menyajikan halaman statis (index/services/contact + aset).
 *  - Proxy PDF: file PDF hanya bisa dibuka lewat /api/pdf/<nama>
 *    dengan token satu kali yang diperoleh dari /api/token.
 *    Akses langsung ke folder /pdf ditolak (403).
 *  - Header keamanan (CSP, nosniff, frame-options, referrer, dll.)
 *
 * Jalankan:  node server.js   (atau npm start)
 * Buka:      http://localhost:3000
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==================== Load .env file ====================
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadEnvFile();

// ==================== WhatsApp Bot ====================
const whatsappBot = require('./whatsapp-bot');

const ROOT = __dirname;
const PDF_DIR = path.join(ROOT, 'pdf');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

/* ---------------- Token store (in-memory) ---------------- */
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam
const tokens = new Map(); // token -> { file, exp }
let rl = new Map(); // rate limit: ip -> { count, reset }

function issueToken(fileName) {
    const token = crypto.randomBytes(24).toString('hex');
    tokens.set(token, { file: fileName, exp: Date.now() + TOKEN_TTL_MS });
    return token;
}

function consumeToken(token, fileName) {
    if (!token) return false;
    const entry = tokens.get(token);
    if (!entry) return false;
    if (entry.exp < Date.now()) {
        tokens.delete(token);
        return false;
    }
    if (entry.file !== fileName) return false;
    tokens.delete(token); // one-time use
    return true;
}

setInterval(function () {
    const now = Date.now();
    for (const [k, v] of tokens) if (v.exp < now) tokens.delete(k);
    for (const [ip, r] of rl) if (r.reset < now) rl.delete(ip);
}, 60 * 1000).unref();

/* ---------------- Rate limit ---------------- */
function allowRequest(ip) {
    const now = Date.now();
    const r = rl.get(ip);
    if (!r || r.reset < now) {
        rl.set(ip, { count: 1, reset: now + 60 * 1000 });
        return true;
    }
    r.count += 1;
    return r.count <= 120;
}

/* ---------------- Security headers ---------------- */
const BASE_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Download-Options': 'noopen',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "frame-src https://www.google.com/maps",
        "connect-src 'self' https:",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'"
    ].join('; ')
};

/* Header khusus file PDF agar dokumen tidak bisa dieksekusi/unduh bebas */
function pdfHeaders(fileName) {
    return Object.assign({}, BASE_HEADERS, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + sanitizeName(fileName) + '"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Security-Policy': "default-src 'none'; object-src 'self'"
    });
}

/* ---------------- MIME + deny ---------------- */
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.pdf': 'application/pdf'
};

function safeDecode(str) {
    try {
        return decodeURIComponent(str);
    } catch (e) {
        return String(str).replace(/%/g, '');
    }
}

function sanitizeName(name) {
    return path.basename(String(name)).replace(/[^a-zA-Z0-9 ._()-]/g, '').trim();
}

const DENY_PATHS = ['/server.js', '/package.json', '/package-lock.json', '/node_modules', '/.git', '/.env'];
const DENY_PREFIX = ['/.vscode', '/pdf']; // /pdf hanya lewat proxy token

/* ---------------- Requester ---------------- */
function clientIp(req) {
    const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return fwd || req.socket.remoteAddress || 'unknown';
}

/* ---------------- Response helpers ---------------- */
function send(res, status, body, headers) {
    res.writeHead(status, Object.assign({}, headers || {}));
    res.end(body);
}

function sendJson(res, status, obj) {
    send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });
}

/* ---------------- Server ---------------- */
const server = http.createServer(function (req, res) {
    const url = new URL(req.url, 'http://' + req.headers.host);

    // Rate limit semua request
    const ip = clientIp(req);
    if (!allowRequest(ip)) {
        sendJson(res, 429, { error: 'Terlalu banyak permintaan. Coba lagi nanti.' });
        return;
    }

    // Cegah akses file sensitif server
    const p = url.pathname;
    if (DENY_PATHS.includes(p) || DENY_PREFIX.some(d => p.startsWith(d))) {
        send(res, 403, 'Forbidden');
        return;
    }

    /* ---------- API: dapatkan token PDF ---------- */
    if (p === '/api/token' && (req.method === 'GET' || req.method === 'POST')) {
        const file = sanitizeName(url.searchParams.get('file') || '');
        if (!file || !/\.pdf$/i.test(file)) {
            sendJson(res, 400, { error: 'Nama file tidak valid.' });
            return;
        }
        const filePath = path.join(PDF_DIR, file);
        if (!fs.existsSync(filePath)) {
            sendJson(res, 404, { error: 'Dokumen tidak ditemukan.' });
            return;
        }
        const token = issueToken(file);
        sendJson(res, 200, { token, expiresIn: TOKEN_TTL_MS });
        return;
    }

    /* ---------- API: proxy dokumen PDF (butuh token) ---------- */
    if (p.startsWith('/api/pdf/')) {
        const rawName = p.slice('/api/pdf/'.length);
        const decoded = safeDecode(rawName);
        const file = sanitizeName(decoded);
        if (!file || !/\.pdf$/i.test(file)) {
            send(res, 400, 'Bad request');
            return;
        }
        const token = url.searchParams.get('t') ||
            (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
            '';
        if (!consumeToken(token, file)) {
            send(res, 403, 'Akses ditolak: token tidak valid / kedaluwarsa.');
            return;
        }
        const filePath = path.join(PDF_DIR, file);
        if (!fs.existsSync(filePath)) {
            send(res, 404, 'Dokumen tidak ditemukan.');
            return;
        }
        // Blokir range request & akses sebagian untuk menyulitkan resume download
        if (req.headers.range) {
            send(res, 416, 'Range request tidak didukung.');
            return;
        }
        res.writeHead(200, pdfHeaders(file));
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    /* ---------- API: WhatsApp Webhook ---------- */
    if (p === '/api/webhook/whatsapp') {
        // GET: Verifikasi webhook dari Meta
        if (req.method === 'GET') {
            whatsappBot.handleWebhookVerification(url.searchParams, res);
            return;
        }
        
        // POST: Pesan masuk dari WhatsApp
        if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => body += chunk);
            req.on('end', async () => {
                const signature = req.headers['x-hub-signature-256'] || '';
                await whatsappBot.handleWebhookMessage(body, signature, res);
            });
            return;
        }
        
        send(res, 405, 'Method Not Allowed');
        return;
    }

    /* ---------- Statis ---------- */
    let rel = p === '/' ? '/index.html' : p;
    let filePath = path.normalize(path.join(ROOT, rel));
    if (!filePath.startsWith(ROOT)) {
        send(res, 403, 'Forbidden');
        return;
    }

    // Prefer index.html di dalam direktori
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        send(res, 404, 'Not Found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = Object.assign({}, BASE_HEADERS, {
        'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=86400'
    });
    const mimeType = MIME[ext];
    if (ext === '.html') send(res, 200, fs.readFileSync(filePath), headers);
    else {
        res.writeHead(200, Object.assign(headers, mimeType ? { 'Content-Type': mimeType } : {}));
        fs.createReadStream(filePath).pipe(res);
    }
});

server.listen(PORT, HOST, function () {
    const mode = HOST === '127.0.0.1' ? 'localhost' : HOST;
    console.log('PT KSMA server berjalan:');
    console.log('  http://' + mode + ':' + PORT);
    console.log('  Proxy PDF aktif di /api/pdf (token-gated). Akses /pdf langsung ditolak.');
});