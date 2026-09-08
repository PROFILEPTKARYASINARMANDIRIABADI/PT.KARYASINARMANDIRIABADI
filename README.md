# PT KSMA Website

Website profil PT KARYA SINAR MANDIRI ABADI dengan fitur:
- Website company profile (Home, Services, Contact)
- Proxy PDF anti-download dengan token
- WhatsApp Auto-Reply AI (Claude)

## Fitur WhatsApp Auto-Reply

Bot WhatsApp otomatis akan membalas pesan masuk menggunakan AI Claude. Fitur ini menggunakan:
- **Meta Cloud API** - Untuk menerima dan mengirim pesan WhatsApp
- **Claude API (Anthropic)** - Untuk generate balasan otomatis

## Setup WhatsApp Bot

### 1. Daftar WhatsApp Business API

1. Buka [Meta for Developers](https://developers.facebook.com)
2. Buat App baru dengan product "WhatsApp"
3. Ikuti langkah verifikasi bisnis

### 2. Dapatkan Credentials

Dari dashboard WhatsApp Business API, dapatkan:
- **Phone Number ID** - ID nomor telepon bisnis
- **Access Token** - Token akses API (temporary atau permanent)
- **Webhook Verify Token** - Buat sendiri (misal: `ksma_webhook_2024`)

### 3. Daftar Anthropic API

1. Buka [console.anthropic.com](https://console.anthropic.com)
2. Buat akun dan dapatkan API key

### 4. Konfigurasi Environment Variables

Edit file `.env` dan isi semua credentials:

```env
# WhatsApp Business API (Meta Cloud API)
WHATSAPP_TOKEN=your_access_token_here
WHATSAPP_PHONE_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=ksma_webhook_2024

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server
PORT=3000
HOST=127.0.0.1
```

### 5. Setup Webhook di Meta

1. Buka dashboard WhatsApp Business API
2. Masuk ke menu "Configuration" > "Webhook"
3. Isi Webhook URL: `https://your-domain.com/api/webhook/whatsapp`
4. Isi Verify Token: sesuai yang di `.env` (misal: `ksma_webhook_2024`)
5. Subscribe ke events: `messages`

### 6. Jalankan Server

```bash
# Install dependencies (jika belum)
npm install

# Jalankan server
npm start
```

Server akan berjalan di `http://localhost:3000`

### 7. Test Auto-Reply

1. Kirim pesan WhatsApp ke nomor bisnis Anda
2. Bot akan otomatis membalas dengan AI Claude
3. Cek log di terminal untuk melihat proses

## Endpoint API

### WhatsApp Webhook
- `GET /api/webhook/whatsapp` - Verifikasi webhook dari Meta
- `POST /api/webhook/whatsapp` - Menerima pesan masuk

### PDF Proxy
- `GET /api/token?file=<nama.pdf>` - Dapatkan token akses PDF
- `GET /api/pdf/<nama.pdf>?t=<token>` - Akses PDF dengan token

## Struktur File

```
├── server.js          # Server Node.js utama
├── whatsapp-bot.js    # Modul WhatsApp bot + Claude AI
├── .env               # Environment variables (jangan commit!)
├── .gitignore         # Git ignore rules
├── contact.js         # Logic form kontak
├── shared.js          # Fungsi bersama (navbar, security)
├── style.css          # Style global
├── index.html         # Halaman utama
├── services.html      # Halaman layanan
├── contact.html       # Halaman kontak
└── pdf/               # Dokumen PDF (hanya view, anti-download)
```

## Keamanan

- Webhook signature diverifikasi dengan HMAC-SHA256
- Rate limiting aktif (120 requests/menit per IP)
- API key disimpan di environment variables
- File `.env` tidak di-commit ke repository
- PDF hanya bisa diakses melalui proxy dengan token

## Troubleshooting

### Webhook tidak terverifikasi
- Pastikan domain sudah HTTPS (untuk production)
- Pastikan Verify Token cocok dengan yang di `.env`
- Cek log server untuk melihat error

### Auto-reply tidak berfungsi
- Pastikan `WHATSAPP_TOKEN` dan `WHATSAPP_PHONE_ID` sudah diisi
- Pastikan `ANTHROPIC_API_KEY` sudah diisi
- Cek log server untuk melihat error API

### Rate limit error
- Default rate limit: 120 requests/menit per IP
- Untuk production, sesuaikan di `server.js` bagian `allowRequest()`

## License

UNLICENSED - Private
