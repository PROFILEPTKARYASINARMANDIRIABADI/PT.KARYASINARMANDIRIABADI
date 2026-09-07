/**
 * Services Logic - PT KSMA
 * Render otomatis kartu layanan dan manajemen modal proyek.
 */

const serviceData = [
{
        title: 'Konstruksi Pasar',
        icon: '🏢',
        desc: 'Untuk Melakukan Persiapan, Kegiatan Operasional Dan/Atau Komersial Usaha.',
        projects: [
            {
                name: 'Pembangunan Pasar Pramuka',
                location: 'Jakarta Timur',
                images: [
                    'assets/images/pembangunan ruko modern.png',
                    'assets/images/pembangunan ruko modern1.png',
                    'assets/images/pembangunan ruko modern3.jpeg',
                    'assets/images/pembangunan ruko modern4.jpeg'
                ]
            }
        ]
    },
    {
        title: 'Konstruksi Rumah Hunian',
        icon: '🏠',
        desc: 'Untuk Melakukan Persiapan,Kegiatan Operasional Dan/Atau Rumah Tinggal.',
        projects: [
            {
                name: 'Pembangunan Rumah Hunian',
                location: 'Pamulang Timur, Tanggerang Selatan',
images: ['assets/images/rumah hunian.jpeg', 'assets/images/pembangunan ruko modern2 .jpeg']
            }
        ]
    },
    {
        title: 'Konstruksi Turap',
        icon: '🧱',
        desc: 'Untuk Melakukan Persiapan,Kegiatan Turap.',
        projects: [
            {
                name: 'Pembangunan Turap',
                location: 'Jl.askar, Sawangan Baru, Depok, Jawa Barat',
images: ['assets/images/Turap1.jpeg', 'assets/images/Turap.jpeg']
            }
        ]
    },
    {
        title: 'Konstruksi Jalan',
        icon: '🛣️',
        desc: 'Untuk Melakukan Persiapan,Kegiatan Konstruksi Jalan.',
        projects: [
            {
                name: 'Pembangunan Jalan',
                location: 'Jl.Askar, Sawangan Baru, Depok, Jawa Barat',
images: ['assets/images/Jalan.jpeg', 'assets/images/Jalan1.jpeg', 'assets/images/Jalan2.jpeg']
            }
        ]
    },
    {
        title: 'Galian Dan Timbunan',
        icon: '🏔️',
        desc: 'Untuk Melakukan Persiapan, kegiatan Pemerataan Lahan.',
        projects: [
            {
                name: 'Pembangunan Galian Dan Timbunan',
                location: 'Jl.Nangka, Sawangan Baru, Depok, Jawa Barat',
images: ['assets/images/Kateenfil.jpeg', 'assets/images/Kateenfil2.jpeg', 'assets/images/Kateenfil3.jpeg']
            }
        ]
    },
    {
        title: 'Konstruksi Jaringan Irigasi & Drainase',
        icon: '💧',
        desc: 'Pembangunan infrastruktur pengairan, saluran irigasi, dan sistem drainase untuk mendukung manajemen air yang efektif.',
        projects: [
            {
                name: 'Saluran Irigasi',
                location: 'Jl.Askar, Sawangan Baru, Depok, Jawa Barat',
images: ['assets/images/Irigasi.jpeg', 'assets/images/Irigasi1.jpeg', 'assets/images/Irigasi2.jpeg', 'assets/images/Irigasi3.jpeg', 'assets/images/Irigasi4.jpeg']
            }
        ]
    },
    ];

let currentServiceIndex = null;

/**
 * Renders the service cards into the service grid.
 */
function renderServices() {
    const grid = document.getElementById('serviceGrid');
    if (!grid) return;
    grid.innerHTML = serviceData.map((item, index) => `
        <div onclick="openServiceModal(${index})" class="card-glass p-10 rounded-3xl cursor-pointer group">
            <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">${item.icon}</div>
            <h4 class="text-2xl font-bold mb-4 text-blue-900 group-hover:text-blue-600 transition">
                ${item.title}
            </h4>
            <p class="text-gray-600">${item.desc}</p>
            <p class="mt-6 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">Klik untuk lihat bukti kerja &rarr;</p>
        </div>
    `).join('');
}

function openServiceModal(index) {
    const serviceModal = document.getElementById('serviceModal');
    const modalTitleElement = document.getElementById('modalTitle');
    const projectTabsContainer = document.getElementById('projectTabs');
    const modalImageContainer = document.getElementById('modalImageContainer');

    if (!serviceModal || !modalTitleElement || !projectTabsContainer) return;

    currentServiceIndex = index;
    const service = serviceData[index];
    
    modalTitleElement.innerText = service.title;
    
    projectTabsContainer.innerHTML = service.projects.map((proj, pIndex) => `
        <button 
            onclick="selectProject(${pIndex})" 
            class="px-4 py-2 rounded-xl font-bold text-sm transition 
            ${pIndex === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}">
            ${proj.name}
        </button>
    `).join('');
    
    selectProject(0);
    
    serviceModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function selectProject(pIdx) {
    const projectTabsContainer = document.getElementById('projectTabs');
    const modalImageContainer = document.getElementById('modalImageContainer');

    if (currentServiceIndex === null || !modalImageContainer || !projectTabsContainer) return;

    const service = serviceData[currentServiceIndex];
    const project = serviceData[currentServiceIndex].projects[pIdx];
    
    // Update Active Tab UI
    Array.from(projectTabsContainer.children).forEach((tab, index) => {
        if (index === pIdx) {
            tab.classList.add('bg-blue-600', 'text-white');
            tab.classList.remove('bg-gray-100', 'text-gray-600', 'hover:bg-blue-50');
        } else {
            tab.classList.remove('bg-blue-600', 'text-white');
            tab.classList.add('bg-gray-100', 'text-gray-600', 'hover:bg-blue-50');
        }
    });

    modalImageContainer.innerHTML = project.images.map(src => `
        <img src="${src}" class="w-full h-64 object-cover rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-300 animate-content-fade">
    `).join('');
}

function closeServiceModal() {
    const serviceModal = document.getElementById('serviceModal');
    if (!serviceModal) return;
    serviceModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

// Event Listeners
window.addEventListener('DOMContentLoaded', renderServices);
window.onclick = (e) => {
    const serviceModal = document.getElementById('serviceModal');
    if (e.target === serviceModal) {
        closeServiceModal();
    }
};


