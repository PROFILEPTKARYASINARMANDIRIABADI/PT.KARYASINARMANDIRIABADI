/**
 * Contact Logic - PT KSMA
 * Kirim pesan via WhatsApp (utama) / Email.
 */

// Harus sama dengan nomor pada contact.html (wa.me)
const WHATSAPP_PHONE_NUMBER = "6281993679626";
const COMPANY_EMAIL_ADDRESS = "karyasinarmandiriabadi@outlook.co.id";

/**
 * Helper: Membangun isi pesan
 */
function buildMessageBody(name, email, message) {
    const n = (name ?? '').toString().trim();
    const e = (email ?? '').toString().trim();
    const m = (message ?? '').toString().trim();

    return `Halo PT KSMA\n\nNama: ${n}\nEmail: ${e}\n\nPesan:\n${m}`;
}

function cleanForWhatsApp(text) {
    if (text === undefined || text === null) return '';
    return String(text)
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\*/g, '')
        .trim();
}

function trimForWhatsApp(text) {
    // Tidak terlalu dipaksa batas (biar tidak kepotong), tapi tetap aman.
    const cleaned = cleanForWhatsApp(text);
    return cleaned;
}

function showSuccessNotification(method) {
    const successMessageElement = document.getElementById('successMessage');
    const successDetailElement = document.getElementById('successDetail');

    if (successDetailElement) {
        successDetailElement.innerText = method === 'whatsapp'
            ? 'Mengarahkan Anda ke WhatsApp...'
            : 'Mengarahkan ke Aplikasi Email...';
    }

    if (successMessageElement) {
        successMessageElement.classList.remove('hidden');
        setTimeout(() => {
            successMessageElement.classList.add('hidden');
        }, 5000);
    }
}

console.log('[contact] script loaded');

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const messageEl = document.getElementById('message');

    if (!contactForm || !nameEl || !emailEl || !messageEl) {
        console.log('[contact] missing form elements');
        return;
    }

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        console.log('[contact] submit click');

        const name = nameEl.value;
        const email = emailEl.value;
        const message = messageEl.value;

        const submitBtn = e.submitter;
        const submissionMethod = submitBtn && submitBtn.value ? submitBtn.value : 'whatsapp';

        const phoneDigits = String(WHATSAPP_PHONE_NUMBER).replace(/\D/g, '');
        const fullMessage = buildMessageBody(name, email, message);

        if (submissionMethod === 'whatsapp') {
            const trimmedMessage = trimForWhatsApp(fullMessage);
            const safeText = trimmedMessage || '';

            console.log('[contact] safeText len=', safeText.length);
            console.log('[contact] safeText=', safeText);

            const waUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(safeText)}`;
            console.log('[contact] waUrl=', waUrl);

            // Untuk kompatibilitas mobile & hosting (GitHub Pages), gunakan navigasi langsung saja.
            window.location.href = waUrl;
        } else {
            const subject = encodeURIComponent(`Pesan dari Website - ${name}`);
            const emailBody = encodeURIComponent(fullMessage);
            window.location.href = `mailto:${COMPANY_EMAIL_ADDRESS}?subject=${subject}&body=${emailBody}`;
        }

        showSuccessNotification(submissionMethod);
        // reset hanya setelah navigasi selesai (mengurangi risiko di beberapa browser/hosting)
        if (submissionMethod === 'whatsapp') {
            setTimeout(() => contactForm.reset(), 1000);
        } else {
            setTimeout(() => contactForm.reset(), 100);
        }
    });
});

