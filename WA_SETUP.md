# PANDUAN SETUP WhatsApp Auto-Reply AI (Claude)

Dokumen ini menjelaskan cara mendapatkan semua credentials yang dibutuhkan agar bot WhatsApp PT KSMA berjalan.

---

## BAGIAN 1: WhatsApp Business API (dari Meta)

### Langkah 1: Daftar Meta for Developers

1. Buka **https://developers.facebook.com**
2. Klik **"Get Started"** dan login dengan akun Facebook
3. Jika belum, aktivasi akun developer:
   - Klik "Accept" pada syarat & ketentuan
   - Register akun developer (email + nomor HP untuk verifikasi)
4. Klik **"Create App"** → pilih **"Other"** → tipe **"Business"**

### Langkah 2: Buat App & Tambah Product WhatsApp

1. Nama App: **PT KSMA WhatsApp Bot**
2. Lalu di dashboard app, klik **"Add Product"**
3. Pilih **"WhatsApp"** → klik **"Set Up"**

### Langkah 3: Tambah Nomor WhatsApp Business

Terdapat 2 opsi nomor:

| Opsi | Keterangan |
|------|------------|
| **Nomor baru** | Beli nomor baru dari Meta (berbayar) |
| **Nomor existing** | Pakai nomor yang sudah ada +62 819-9367-9626 |

Untuk **nomor existing**:
1. Di menu **WhatsApp** → **"API Setup"**
2. Klik **"Add Phone Number"**
3. Masukkan nomor **6281993679626** akan dikirim kode OTP via SMS/WhatsApp
4. Masukkan kode OTP untuk verifikasi
5. Set `Display Name`: **PT KARYA SINAR MANDIRI ABADI**

### Langkah 4: Ambil 2 Credentials Penting

Setelah nomor terverifikasi, scroll ke bagian **"Getting Started"**:

#### A. **Access Token** (`WHATSAPP_TOKEN`)
- Di section "Getting Started" → **"Temporary access token"**
- Klik tombol **"Generate token"** (timeout 24 jam)
- Salin kode tersebut → simpan di `.env`
- **Penting**: Untuk production, nanti perlu token permanen (lihat Lampiran A)

#### B. **Phone Number ID** (`WHATSAPP_PHONE_ID`)
- Di section "Getting Started" → **"From"** / **"Phone number ID"**
- Salin angka Phone Number ID → simpan di `.env`

---

## BAGIAN 2: Webhook Setup

### Langkah 5: Siapkan Webhook URL

Bot butuh alamat publik yang bisa dijangkau Meta. Dapatkan HTTPS public URL:

**Opsi A (langsung buat sekarang):** Gunakan tunnel gratis bernama **ngrok**:
```bash
# Instal dari https://ngrok.com/download lalu jalankan:
ngrok http 3000
```
Anda akan mendapat URL seperti `https://xxxx-xx-xx-xxx.ngrok-free.app`
→ Contoh URL webhook: `https://xxxx.ngrok-free.app/api/webhook/whatsapp`

**Opsi B (production):** Nanti deploy ke VPS/Render/Railway, URL-nya seperti:
`https://pt-ksma.onrender.com/api/webhook/whatsapp`

### Langkah 6: Subscribe Webhook di Meta

1. Di dashboard Meta → menu **"Webhook"**
2. Klik **"Add callback URL"**
3. Isi:
   - **Callback URL**: `https://URL-ANDA/api/webhook/whatsapp`
   - **Verify Token**: `ksma_webhook_2024` *(sama dengan app.yaml)*
4. Klik **"Verify and save"**
   - *Pastikan server sedang berjalan (`npm start`)*
5. Lalu scroll ke **"Webhook fields"** → klik **"Manage"**
6. Subscribe field: **`messages`** (centang)

---

## BAGIAN 3: Anthropic (Claude) API

### Langkah 7: Daftar Anthropic & Ambil API Key

1. Buka **https://console.anthropic.com**
2. Klik **"Sign up"** → daftar dengan email/Google
3. Setelah login, isi billing di **Settings → Billing** (perlu kartu kredit)
4. Klik **API Keys** di sidebar
5. Klik **"Create Key"**
6. Nama: `pt-ksma-bot`, klik **"Create Key"**
7. **SALIN LANGSUNG** kunci yang muncul (awalan `sk-ant-...`) — hanya muncul sekali!
8. Simpan di `.env` sebagai `ANTHROPIC_API_KEY`

---

## BAGIAN 4: Isi `.env` & Jalankan

### Langkah 8: Isi File `.env`

Buka file `.env` di project dan isi:

```env
WHATSAPP_TOKEN=EAAG...token_YANG_DISALIN
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=ksma_webhook_2024
ANTHROPIC_API_KEY=sk-ant-api03-XXXX...
PORT=3000
HOST=127.0.0.1
```

### Langkah 9: Jalankan & Test

```bash
npm start
```

1. Buka `http://localhost:3000` — pastikan website tampil
2. Kirim pesan teks ke nomor WhatsApp PT KSMA: **"Halo, saya ingin tahu layanan Anda"**
3. Bot akan otomatis membalas dengan balasan dari Claude AI
4. Cek terminal untuk log: `[whatsapp-bot] Pesan diterima dari: ...`

---

## LAMPIRAN A: Membuat Token Permanen (Production)

Temporary token hanya berlaku 24 jam. Untuk permanen:

1. Buka **https://developers.facebook.com/apps/<APP_ID>/whatsapp-business/wa-settings**
   - Buka **WhatsApp → API Setup**
2. Cari **"Access Token"** section
3. Klik **"Generate token"** (temporary) lalu salin
4. Buka **https://developers.facebook.com/tools/debug/accesstoken/**
   - Masukkan token, klik "Debug"
5. Lakukan **"System User"**:
   - **Business Settings** → **System Users** → **Add System User**
   - Role: `Admin`, centang **"Manage app"**
   - Klik **"Generate token"** di system user tersebut
   - Pilih app PT KSMA WhatsApp Bot
   - **Never expires** → centang **"Yes"** untuk token permanen
6. Salin token permanen → ke `.env`

---

## LAMPIRAN B: Troubleshooting Umum

| Gejala | Kemungkinan Penyebab | Solusi |
|--------|---------------------|--------|
| Webhook tidak terverifikasi | Verify token tidak cocok | Pastikan `WHATSAPP_VERIFY_TOKEN` di `.env` = yang di Meta |
| Bot tidak membalas | `WHATSAPP_TOKEN` expired | Generate ulang token (24 jam) |
| 401 Unauthorized | Token salah / phone ID salah | Cek keduanya di dashboard Meta |
| Rate limit | Terlalu banyak request | Meta punya limit sendiri; kurangi testing berulang |
| Claude tidak merespon | API key salah / saldo kosong | Cek di console.anthropic.com |
| Gambar tidak dibalas | Bot hanya support teks | Ketik balasan teks (fitur gambar menyusul) |

---

## Ringkasan Credentials yang Dibutuhkan

| Variabel | Dapat dari | Di mana |
|----------|-----------|---------|
| `WHATSAPP_TOKEN` | Meta Developer | WhatsApp → API Setup → Generate token |
| `WHATSAPP_PHONE_ID` | Meta Developer | WhatsApp → API Setup → Phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Buat sendiri | Contoh: `ksma_webhook_2024` |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Settings → API Keys |

**Setup selesai! 🎉** Kirim pesan teks ke nomor WhatsApp bisnis Anda dan bot akan menjawab otomatis dengan AI.