- [ ] Perbaiki `contact.js` agar tombol kirim WhatsApp berfungsi (hapus duplikasi code & pastikan handler submit konsisten)
- [ ] Tes manual: isi form di `contact.html` lalu klik "Kirim via WhatsApp" di browser/HP emulation
- [ ] Pastikan alert/success muncul dan popup WhatsApp terbuka

## WhatsApp Auto-Reply Bot Setup

- [ ] Daftar WhatsApp Business API di Meta for Developers (https://developers.facebook.com)
- [ ] Buat App baru dengan product "WhatsApp"
- [ ] Dapatkan Phone Number ID dari dashboard WhatsApp
- [ ] Generate Access Token (temporary atau permanent)
- [ ] Buat Webhook Verify Token (misal: `ksma_webhook_2024`)
- [ ] Isi semua credentials di file `.env`
- [ ] Setup webhook URL di Meta: `https://your-domain.com/api/webhook/whatsapp`
- [ ] Test verifikasi webhook dengan Meta
- [ ] Test kirim pesan WhatsApp ke nomor bisnis
- [ ] Pastikan auto-reply dari Claude berhasil dikirim
