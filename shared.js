/**
 * Shared Functions - PT KSMA
 * Digunakan untuk komponen yang ada di setiap halaman (Navbar, Security, Modal)
 */

/* ===================== NAVBAR ===================== */
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('navIcon');
    if (!menu || !icon) return;
    menu.classList.toggle('hidden');
    const isHidden = menu.classList.contains('hidden');
    icon.setAttribute('d', isHidden ? 'M4 6h16M4 12h16m-7 6h7' : 'M6 18L18 6M6 6l12 12');
}

/* ===================== SECURITY ===================== */
(function initSecurity() {
    document.addEventListener('DOMContentLoaded', function () {
        document.addEventListener('contextmenu', function (e) {
            if (e.target.closest('#pdfViewer, .no-rightclick')) {
                e.preventDefault();
                return false;
            }
        });

        // Menu kontekstual pada area yang berisi iframe PDF ikut dinonaktifkan.
        // (Catatan: klik kanan yang muncul murni dari dalam plugin PDF tidak
        //  dapat dipengaruhi; pembatasan ini bersifat best-effort.)
        const legalModal = document.getElementById('legalModal');
        if (legalModal) {
            legalModal.addEventListener('contextmenu', function (e) {
                if (e.target.closest('#pdfViewer, .no-rightclick')) {
                    e.preventDefault();
                    return false;
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (
                e.ctrlKey && e.key === 'u' ||
                e.ctrlKey && e.shiftKey && e.key === 'I' ||
                e.ctrlKey && e.shiftKey && e.key === 'C' ||
                e.ctrlKey && e.shiftKey && e.key === 'J' ||
                e.ctrlKey && e.key === 's' ||
                e.key === 'F12'
            ) {
                e.preventDefault();
                return false;
            }
        });

        document.addEventListener('dragstart', function (e) {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'IFRAME') {
                e.preventDefault();
            }
        });
    });
})();

/* ===================== STATS ===================== */
const COMPANY_ESTABLISHED_DATE = '2025-06-08';
const TOTAL_PROJECTS_COMPLETED = 1;

function updateCompanyStats() {
    const experienceCountElement = document.getElementById('exp-count');
    const projectsCountElement = document.getElementById('proj-count');
    if (!experienceCountElement && !projectsCountElement) return;

    const startDate = new Date(COMPANY_ESTABLISHED_DATE);
    const today = new Date();
    const yearsExperience = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 365.25));

    if (experienceCountElement) experienceCountElement.innerText = yearsExperience;
    if (projectsCountElement) projectsCountElement.innerText = TOTAL_PROJECTS_COMPLETED;
}

/* ===================== LEGAL MODAL ===================== */
function cleanFileName(pdfSrc) {
    return String(pdfSrc || '')
        .replace(/^\.?\/?/, '')
        .replace(/\\/g, '/')
        .split('/')
        .pop();
}

/**
 * Minta token akses PDF dari proxy server (/api/token).
 * Mengembalikan null bila tidak tersedia (mis. hosting statis).
 */
async function requestPdfToken(fileName) {
    try {
        const res = await fetch('/api/token?file=' + encodeURIComponent(fileName), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data && data.token ? data.token : null;
    } catch (err) {
        return null;
    }
}

function openModal(pdfSrc, title) {
    const legalModalElement = document.getElementById('legalModal');
    const pdfViewerElement = document.getElementById('pdfViewer');
    const modalTitleElement = document.getElementById('modalTitle');
    if (!legalModalElement || !pdfViewerElement || !modalTitleElement) return;

    const fileName = cleanFileName(pdfSrc);
    const canUseProxy = (location.protocol === 'http:' || location.protocol === 'https:');

    const openViewer = function (srcUrl) {
        pdfViewerElement.src = srcUrl + '#toolbar=0&navpanes=0&scrollbar=0';
        modalTitleElement.innerText = title;
        legalModalElement.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    };

    // Membuka file langsung saat file:// (tidak ada server proxy)
    if (!canUseProxy) {
        openViewer('pdf/' + encodeURI(fileName));
        return;
    }

    requestPdfToken(fileName).then(function (token) {
        if (token) {
            openViewer('/api/pdf/' + encodeURIComponent(fileName) + '?t=' + encodeURIComponent(token));
        } else {
            // Fallback: hosting statis tanpa proxy -> langsung dari /pdf
            openViewer('pdf/' + encodeURI(fileName));
        }
    });
}

function closeModal() {
    const legalModalElement = document.getElementById('legalModal');
    const pdfViewerElement = document.getElementById('pdfViewer');
    if (!legalModalElement) return;
    legalModalElement.classList.add('hidden');
    if (pdfViewerElement) pdfViewerElement.src = '';
    document.body.classList.remove('overflow-hidden');
}

window.onclick = function (event) {
    const legalModalElement = document.getElementById('legalModal');
    if (event.target === legalModalElement) {
        closeModal();
    }
};

window.addEventListener('DOMContentLoaded', updateCompanyStats);

