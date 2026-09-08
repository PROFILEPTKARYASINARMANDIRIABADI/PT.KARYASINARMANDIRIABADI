/**
 * whatsapp-bot.js — Auto-reply WhatsApp via Meta Cloud API + Claude AI
 *
 * Fungsi:
 *  - Verifikasi webhook dari Meta
 *  - Menerima pesan masuk dari WhatsApp
 *  - Mengirim pesan ke Claude API untuk generate response
 *  - Mengirim balasan otomatis ke pengirim
 *
 * Bergantung pada environment variables:
 *  - WHATSAPP_TOKEN: Access token dari Meta
 *  - WHATSAPP_PHONE_ID: Phone Number ID
 *  - WHATSAPP_VERIFY_TOKEN: Token verifikasi webhook
 *  - ANTHROPIC_API_KEY: API key untuk Claude
 */

'use strict';

const https = require('https');
const crypto = require('crypto');

// ==================== Configuration ====================

const CONFIG = {
    whatsapp: {
        token: process.env.WHATSAPP_TOKEN || '',
        phoneId: process.env.WHATSAPP_PHONE_ID || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'ksma_webhook_2024',
        apiVersion: 'v18.0'
    },
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 1024
    }
};

// ==================== System Prompt untuk Claude ====================

const SYSTEM_PROMPT = `Anda adalah asisten virtual resmi dari PT KARYA SINAR MANDIRI ABADI (PT KSMA), sebuah perusahaan konstruksi dan infrastruktur di Indonesia.

Tugas Anda:
1. Menjawab pertanyaan tentang layanan perusahaan
2. Memberikan informasi kontak yang diperlukan
3. Membantu calon klien memahami layanan yang tersedia

Layanan PT KSMA:
- Konstruksi Gedung (komersial, industri, residensial)
- Infrastruktur (jalan, jembatan, dermaga)
- Mekanikal & Elektrikal (MEP)
- Interior & Fitout
- Engineering & Procurement
- Maintenance & Renovasi

Informasi Kontak:
- WhatsApp: +62 819-9367-9626
- Email: karyasinarmandiriabadi@outlook.co.id
- Website: https://ptksma.com

Aturan:
- Selalu sapa pengguna dengan ramah
- Gunakan Bahasa Indonesia yang sopan dan profesional
- Jawab dengan singkat dan jelas (maksimal 3-4 kalimat)
- Jika pertanyaan di luar konteks perusahaan, arahkan ke topik layanan
- Jangan memberikan informasi yang tidak pasti atau spekulatif
- Akhiri dengan ajakan untuk menghubungi jika membutuhkan informasi lebih lanjut
- Gunakan format WhatsApp yang sesuai (tanpa markdown yang kompleks)`;

// ==================== Message Store ====================

// Simpan riwayat percakapan per nomor (in-memory, akan direset saat restart)
const conversations = new Map();
const MAX_HISTORY = 10; // Maksimal 10 pesan terakhir per percakapan

// ==================== Helper Functions ====================

/**
 * Kirim HTTP request
 */
function httpRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

/**
 * Verifikasi signature webhook dari Meta
 */
function verifyWebhookSignature(body, signature) {
    if (!signature) return false;
    const expected = 'sha256=' + crypto
        .createHmac('sha256', CONFIG.whatsapp.token)
        .update(body)
        .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Kirim pesan balasan via WhatsApp Business API
 */
async function sendWhatsAppMessage(to, text) {
    if (!CONFIG.whatsapp.token || !CONFIG.whatsapp.phoneId) {
        console.error('[whatsapp-bot] WhatsApp token atau phone ID tidak dikonfigurasi');
        return false;
    }

    const url = `https://graph.facebook.com/${CONFIG.whatsapp.apiVersion}/${CONFIG.whatsapp.phoneId}/messages`;

    const payload = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { preview_url: false, body: text }
    });

    try {
        const result = await httpRequest({
            hostname: 'graph.facebook.com',
            path: `/${CONFIG.whatsapp.apiVersion}/${CONFIG.whatsapp.phoneId}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.whatsapp.token}`,
                'Content-Type': 'application/json'
            }
        }, payload);

        if (result.status === 200) {
            console.log('[whatsapp-bot] Pesan terkirim ke', to);
            return true;
        } else {
            console.error('[whatsapp-bot] Gagal kirim pesan:', result.data);
            return false;
        }
    } catch (err) {
        console.error('[whatsapp-bot] Error kirim pesan:', err.message);
        return false;
    }
}

/**
 * Panggil Claude API untuk generate response
 */
async function generateClaudeResponse(userMessage, phoneNumber) {
    if (!CONFIG.anthropic.apiKey) {
        console.error('[whatsapp-bot] Anthropic API key tidak dikonfigurasi');
        return 'Maaf, layanan auto-reply sedang tidak tersedia. Silakan hubungi kami langsung di +62 819-9367-9626.';
    }

    // Ambil riwayat percakapan
    let history = conversations.get(phoneNumber) || [];
    
    // Tambah pesan user ke history
    history.push({ role: 'user', content: userMessage });

    // Batasi history
    if (history.length > MAX_HISTORY) {
        history = history.slice(-MAX_HISTORY);
    }

    // Simpan history
    conversations.set(phoneNumber, history);

    const payload = JSON.stringify({
        model: CONFIG.anthropic.model,
        max_tokens: CONFIG.anthropic.maxTokens,
        system: SYSTEM_PROMPT,
        messages: history
    });

    try {
        const result = await httpRequest({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': CONFIG.anthropic.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            }
        }, payload);

        if (result.status === 200 && result.data.content) {
            const responseText = result.data.content[0]?.text || '';
            
            // Tambah response ke history
            history.push({ role: 'assistant', content: responseText });
            conversations.set(phoneNumber, history);
            
            console.log('[whatsapp-bot] Claude response generated untuk', phoneNumber);
            return responseText;
        } else {
            console.error('[whatsapp-bot] Claude API error:', result.data);
            return 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami di +62 819-9367-9626.';
        }
    } catch (err) {
        console.error('[whatsapp-bot] Error Claude API:', err.message);
        return 'Maaf, layanan sedang gangguan. Silakan hubungi kami di +62 819-9367-9626.';
    }
}

// ==================== Webhook Handlers ====================

/**
 * Handle GET request untuk verifikasi webhook
 */
function handleWebhookVerification(query, res) {
    const mode = query.get('hub.mode');
    const token = query.get('hub.verify_token');
    const challenge = query.get('hub.challenge');

    if (mode === 'subscribe' && token === CONFIG.whatsapp.verifyToken) {
        console.log('[whatsapp-bot] Webhook verified');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
        return true;
    } else {
        console.error('[whatsapp-bot] Webhook verification failed');
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Verification failed');
        return false;
    }
}

/**
 * Handle POST request untuk pesan masuk
 */
async function handleWebhookMessage(body, signature, res) {
    // Verifikasi signature
    if (CONFIG.whatsapp.token && !verifyWebhookSignature(body, signature)) {
        console.error('[whatsapp-bot] Invalid webhook signature');
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
    }

    // Parse body
    let data;
    try {
        data = JSON.parse(body);
    } catch (e) {
        console.error('[whatsapp-bot] Invalid JSON body');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
    }

    // Kirim response 200 dulu (agar Meta tidak retry)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));

    // Proses pesan secara async
    try {
        await processIncomingMessage(data);
    } catch (err) {
        console.error('[whatsapp-bot] Error processing message:', err.message);
    }
}

/**
 * Proses pesan masuk dari webhook
 */
async function processIncomingMessage(data) {
    // Validasi struktur data
    if (!data.entry || !data.entry[0]?.changes || !data.entry[0]?.changes[0]?.value) {
        console.log('[whatsapp-bot] Invalid webhook data structure');
        return;
    }

    const change = data.entry[0].changes[0].value;
    
    // Cek apakah ada pesan
    if (!change.messages || !change.messages[0]) {
        // Mungkin status update, abaikan
        return;
    }

    const message = change.messages[0];
    const from = message.from; // Nomor pengirim
    const msgType = message.type;
    const msgId = message.id;

    console.log('[whatsapp-bot] Pesan diterima dari:', from, 'Type:', msgType);

    // Hanya proses pesan teks
    if (msgType !== 'text') {
        console.log('[whatsapp-bot] Menolak pesan non-teks:', msgType);
        // Kirim pesan fallback untuk tipe yang didukung
        if (msgType === 'image' || msgType === 'document' || msgType === 'audio' || msgType === 'video') {
            await sendWhatsAppMessage(from, 'Maaf, saat ini saya hanya dapat memproses pesan teks. Silakan ketik pertanyaan Anda.');
        }
        return;
    }

    const userMessage = message.text?.body || '';
    if (!userMessage.trim()) {
        console.log('[whatsapp-bot] Pesan kosong, diabaikan');
        return;
    }

    console.log('[whatsapp-bot] Isi pesan:', userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''));

    // Generate response dengan Claude
    const response = await generateClaudeResponse(userMessage, from);

    // Kirim balasan
    await sendWhatsAppMessage(from, response);
}

// ==================== Exports ====================

module.exports = {
    CONFIG,
    handleWebhookVerification,
    handleWebhookMessage,
    sendWhatsAppMessage,
    generateClaudeResponse
};
