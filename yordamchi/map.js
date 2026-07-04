
function showToast(text, type = "success") {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: type === "success" ? "#006653" : "#e53e3e",
                borderRadius: "12px",
                padding: "12px 20px"
            }
        }).showToast();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // ── Role checking ────────────────────────────────────────
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const role = currentUser.role || 'helper';

    function addNotificationForHelper(helperName, title, text) {
        const list = JSON.parse(localStorage.getItem(`notifications_${helperName}`) || '[]');
        const newNotif = {
            id: 'notif_' + Date.now(),
            title: title,
            text: text,
            time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
            type: 'tasks',
            unread: true
        };
        list.unshift(newNotif);
        localStorage.setItem(`notifications_${helperName}`, JSON.stringify(list));
    }

    // ── Apply Role Customizations BEFORE selecting cards ────
    initializeRoleSpecificUI(role);

    // ==========================================
    // 1. XARITANI INICIALIZATSIYA QILISh
    // ==========================================
    const map = L.map('main-leaflet-map', { zoomControl: false }).setView([41.31108, 69.24056], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    let currentUserMarker = null;

    const liveGpsIcon = L.divIcon({
        className: 'user-live-gps-marker',
        html: `<div class="gps-core-dot"></div><div class="gps-pulse-wave"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // ==========================================
    // 2. REAL JONLI JOYLAShUVNI ANIQLASh (GPS)
    // ==========================================
    function trackLiveLocation() {
        if (!navigator.geolocation) {
            alert("Sizning brauzeringiz GPS xizmatini qo'llab-quvvatlamaydi.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (currentUserMarker) {
                    map.removeLayer(currentUserMarker);
                }

                currentUserMarker = L.marker([lat, lng], { icon: liveGpsIcon }).addTo(map);
                currentUserMarker.bindPopup("<b>Siz shu yerdasiz!</b><br>Atrofingizdagi ma'lumotlar yuklanmoqda.").openPopup();

                map.setView([lat, lng], 15);
            },
            (error) => {
                console.warn("GPS ruxsat berilmadi yoki xatolik yuz berdi:", error.message);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }

    trackLiveLocation();

    document.getElementById("locate-me-btn").addEventListener("click", () => {
        trackLiveLocation();
    });

    document.getElementById("zoom-in-btn").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoom-out-btn").addEventListener("click", () => map.zoomOut());

    // ==========================================
    // 3. RO'YXAT KARTALARINI XARITADA PIN SIFATIDA KO'RSATISh
    // ==========================================
    const taskCards = document.querySelectorAll(".wide-task-card");
    const totalCountSpan = document.getElementById("total-tasks-count");
    let activeMarkers = [];

    function renderTaskMarkersOnMap() {
        activeMarkers.forEach(m => map.removeLayer(m));
        activeMarkers = [];

        let count = 0;

        taskCards.forEach(card => {
            if (!card.classList.contains("hidden")) {
                const lat = parseFloat(card.getAttribute("data-lat"));
                const lng = parseFloat(card.getAttribute("data-lng"));
                const title = card.querySelector("h4").textContent;
                const type = card.getAttribute("data-type");

                // Select icon emoji
                let emoji = "📍";
                if (role === 'poster') {
                    if (type === "yetkazish") emoji = "🛵";
                    else if (type === "usta") emoji = "👨‍🔧";
                    else if (type === "tozalash") emoji = "🧹";
                    else if (type === "raqamli") emoji = "💻";
                } else {
                    if (type === "yetkazish") emoji = "🏍️";
                    else if (type === "usta") emoji = "🔧";
                    else if (type === "tozalash") emoji = "🧹";
                    else if (type === "dori") emoji = "💊";
                }

                const pinIcon = L.divIcon({
                    html: `<div style="background: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid #00796b;">${emoji}</div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });

                const buttonText = role === 'poster' ? 'Taklif qilish' : 'Tanlash';
                const popupHtml = `
                    <b>${title}</b><br>
                    ${role === 'poster' ? 'Yordamchi faol' : 'Haqi ko\'rsatilgan'}<br>
                    <button class="popup-action-btn" data-title="${title}" style="background:#00796b; color:white; border:none; padding:4px 10px; border-radius:6px; margin-top:6px; cursor:pointer; font-weight:600;">${buttonText}</button>
                `;

                const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map)
                    .bindPopup(popupHtml);

                marker.on('popupopen', () => {
                    const btn = document.querySelector(".popup-action-btn");
                    if (btn) {
                        btn.addEventListener("click", () => {
                            if (role === 'poster') {
                                const helperName = btn.dataset.title.split(' ')[0] || "Abbos";
                                showToast(`${btn.dataset.title}ga topshiriq taklifi yuborildi! ✉️`);
                                addNotificationForHelper(helperName, "Ishga taklif", "Sizni xaritadagi topshiriqqa taklif qilishdi. Haq: 45,000 so'm.");
                            } else {
                                showToast("Topshiriq qabul qilish oynasi ochilmoqda...");
                            }
                            marker.closePopup();
                        });
                    }
                });

                activeMarkers.push(marker);

                card.addEventListener("click", () => {
                    map.setView([lat, lng], 16);
                    marker.openPopup();
                });

                count++;
            }
        });

        const countText = role === 'poster' ? `${count} nafar` : `${count} ta`;
        if (totalCountSpan) totalCountSpan.textContent = countText;
    }

    renderTaskMarkersOnMap();

    // ==========================================
    // 4. KATEGORIYaLAR BO'YIChA FILTRLASh LOgIKASI
    // ==========================================
    const tags = document.querySelectorAll(".tag-link");

    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            tags.forEach(t => t.classList.remove("active"));
            tag.classList.add("active");

            const selectedCat = tag.getAttribute("data-category");

            taskCards.forEach(card => {
                const cardType = card.getAttribute("data-type");
                if (selectedCat === "all" || cardType === selectedCat) {
                    card.classList.remove("hidden");
                } else {
                    card.classList.add("hidden");
                }
            });

            renderTaskMarkersOnMap();
        });
    });

    // ==========================================
    // 5. TOP BAR TUGMALARI (Qidiruv, Ovoz, Filtr va Orqaga)
    // ==========================================
    // 5a. Orqaga qaytish tugmasi
    const backBtn = document.querySelector(".top-search-overlay a");
    if (backBtn) {
        backBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = role === 'poster' ? 'poster.html' : 'vazifa.html';
        });
    }

    // 5b. Qidiruv qutisi dinamik filtratsiyasi
    const searchInput = document.getElementById("map-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            taskCards.forEach(card => {
                const title = card.querySelector("h4").textContent.toLowerCase();
                const desc = card.querySelector("p").textContent.toLowerCase();
                const matches = title.includes(query) || desc.includes(query);

                if (matches) {
                    card.classList.remove("hidden");
                } else {
                    card.classList.add("hidden");
                }
            });
            renderTaskMarkersOnMap();
        });
    }

    // 5c. Ovozli qidiruv tugmasi (Microphone)
    const micIcon = document.querySelector(".mic-icon");
    if (micIcon) {
        micIcon.style.cursor = "pointer";
        micIcon.addEventListener("click", () => {
            showToast("Ovozli qidiruv faollashtirildi... 🎙️ Gapiring");
            micIcon.style.color = "#e53e3e";
            setTimeout(() => {
                const mockVoice = role === 'poster' ? "Abbos" : "dori";
                if (searchInput) {
                    searchInput.value = mockVoice;
                    searchInput.dispatchEvent(new Event('input'));
                }
                showToast(`Tushunildi: "${mockVoice}" 🗣️`);
                micIcon.style.color = "";
            }, 1800);
        });
    }

    // 5d. Filtrlar modalini ochish
    const filterBtn = document.getElementById("filter-toggle-btn");
    if (filterBtn) {
        filterBtn.addEventListener("click", () => {
            const modalHtml = `
                <h2 style="margin:0 0 4px 0; color:#004d3f; font-size:18px; font-weight:800; text-align:left;">Saralash va Filtrlar</h2>
                <p class="modal-sub" style="margin:0 0 20px 0; color:#718096; font-size:13px; text-align:left;">Ko'rsatish parametrlarini sozlang</p>
                
                <div style="text-align:left; display:flex; flex-direction:column; gap:14px; margin-bottom:24px;">
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:12.5px; font-weight:700; color:#4a5568;">Masofa bo'yicha</label>
                        <select id="filter-distance" style="width:100%; border:1.5px solid #e2e8f0; border-radius:12px; padding:10px 14px; font-size:14px; font-family:inherit; outline:none; background:#f9fcfb;">
                            <option value="all">Barcha masofalar</option>
                            <option value="500">500m gacha yaqinlikda</option>
                            <option value="1500">1.5km gacha yaqinlikda</option>
                            <option value="3000">3km gacha yaqinlikda</option>
                        </select>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:12.5px; font-weight:700; color:#4a5568;">Saralash tartibi</label>
                        <select id="filter-sort" style="width:100%; border:1.5px solid #e2e8f0; border-radius:12px; padding:10px 14px; font-size:14px; font-family:inherit; outline:none; background:#f9fcfb;">
                            <option value="default">Odatiy tartibda</option>
                            <option value="rating">Reyting bo'yicha (eng yuqori)</option>
                            <option value="distance">Yaqinligi bo'yicha (eng yaqin)</option>
                        </select>
                    </div>
                </div>
                
                <button class="btn-modal-primary" id="btn-apply-filters" style="width:100%; padding:12px; border-radius:12px; border:none; background:#006653; color:#fff; font-size:14.5px; font-weight:600; cursor:pointer; margin-bottom:8px;"><i class="fas fa-filter" style="margin-right:8px;"></i>Filtrlarni qo'llash</button>
                <button class="btn-modal-secondary" id="btn-reset-filters" style="width:100%; padding:12px; border-radius:12px; border:1.5px solid #e2e8f0; background:#fff; color:#2d3748; font-size:14.5px; font-weight:600; cursor:pointer;">Bekor qilish</button>
            `;
            openMapModal(modalHtml);

            document.getElementById("btn-apply-filters").addEventListener("click", () => {
                showToast("Filtrlar muvaffaqiyatli qo'llanildi! 🎯");
                closeMapModal();
                
                const sortVal = document.getElementById("filter-sort").value;
                if (sortVal === "rating") {
                    const stack = document.querySelector(".tasks-scroll-area");
                    const cardsArray = Array.from(document.querySelectorAll(".wide-task-card"));
                    cardsArray.sort((a, b) => {
                        const ratingA = parseFloat(a.querySelector(".meta-data").textContent.match(/[\d.]+/)?.[0] || '0');
                        const ratingB = parseFloat(b.querySelector(".meta-data").textContent.match(/[\d.]+/)?.[0] || '0');
                        return ratingB - ratingA;
                    });
                    cardsArray.forEach(c => stack.appendChild(c));
                }
            });

            document.getElementById("btn-reset-filters").addEventListener("click", () => {
                showToast("Filtrlar tozalandi.");
                closeMapModal();
            });
        });
    }

    // Modal control functions
    function openMapModal(htmlContent) {
        let modalOverlay = document.getElementById("mapModalOverlay");
        if (!modalOverlay) {
            modalOverlay = document.createElement("div");
            modalOverlay.id = "mapModalOverlay";
            modalOverlay.style = "position:fixed; inset:0; background:rgba(15,23,30,0.55); backdrop-filter:blur(4px); z-index:11000; display:flex; align-items:center; justify-content:center; padding:20px;";
            document.body.appendChild(modalOverlay);
        }

        modalOverlay.innerHTML = `
            <div class="edit-modal" style="max-width:400px; width:100%; padding:28px 24px; border-radius:20px; background:#fff; box-shadow:0 24px 60px rgba(0,0,0,0.25); position:relative; text-align:center;">
                <button id="closeMapModalBtn" style="position:absolute; right:16px; top:16px; background:none; border:none; font-size:24px; cursor:pointer; color:#718096; line-height:1;">&times;</button>
                ${htmlContent}
            </div>
        `;

        modalOverlay.style.display = "flex";
        document.body.style.overflow = "hidden";

        document.getElementById("closeMapModalBtn").addEventListener("click", closeMapModal);
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeMapModal();
        });
    }

    function closeMapModal() {
        const modalOverlay = document.getElementById("mapModalOverlay");
        if (modalOverlay) {
            modalOverlay.style.display = "none";
        }
        document.body.style.overflow = "";
    }

    // ==========================================
    // 6. PASTKI PANEL (BOTTOM SHEET) SURILIShI
    // ==========================================
    const sheetHandle = document.getElementById("sheetHandle");
    const taskSheet = document.getElementById("taskSheet");
    let sheetOpen = true;

    if (sheetHandle && taskSheet) {
        sheetHandle.addEventListener("click", () => {
            if (sheetOpen) {
                taskSheet.style.transform = "translateY(78%)";
                sheetOpen = false;
            } else {
                taskSheet.style.transform = "translateY(0)";
                sheetOpen = true;
            }
        });
    }

    const listToggle = document.getElementById("list-toggle-alert");
    if (listToggle) {
        listToggle.addEventListener("click", (e) => {
            e.preventDefault();
            if (role === 'poster') {
                showToast("Faol yordamchilar ro'yxatiga yo'naltirilmoqda... 👥");
                setTimeout(() => {
                    window.location.href = "poster.html";
                }, 1200);
            } else {
                showToast("Topshiriqlar ro'yxatiga yo'naltirilmoqda... 📋");
                setTimeout(() => {
                    window.location.href = "vazifa.html";
                }, 1200);
            }
        });
    }

    // Bind invite or apply action listeners to card buttons
    document.querySelectorAll(".apply-task-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            if (role === 'poster') {
                const helperName = btn.dataset.helper || "Yordamchi";
                showToast(`${helperName}ga topshiriq taklifi yuborildi! ✉️`);
                addNotificationForHelper(helperName, "Ishga taklif", "Sizni xaritadagi topshiriqqa taklif qilishdi. Haq: 45,000 so'm.");
                btn.textContent = "Yuborildi";
                btn.style.background = "#718096";
                btn.disabled = true;
            } else {
                Toastify({
                    text: "Sizning so'rovingiz muvaffaqiyatli yuborildi!",
                    duration: 3000,
                    close: true,
                    gravity: "top",
                    position: "right",
                    stopOnFocus: true,
                    style: {
                        background: "linear-gradient(135deg, #00796b, #041d16)",
                        color: "#ffffff",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px rgba(0, 121, 107, 0.2)",
                        padding: "12px 24px",
                        fontSize: "14px",
                        fontWeight: "500"
                    }
                }).showToast();
            }
        });
    });

    // Helper to dynamically restructure DOM elements based on role
    function initializeRoleSpecificUI(role) {
        const backBtn = document.querySelector(".top-search-overlay a");
        if (backBtn) {
            backBtn.href = role === 'poster' ? 'poster.html' : 'vazifa.html';
        }

        if (role === 'poster') {
            document.title = "Topshiriq.uz — Atrofingizdagi yordamchilar xaritasi";

            const headerTitle = document.querySelector(".sheet-header h3");
            if (headerTitle) {
                headerTitle.innerHTML = 'Atrofingizda <span class="green-count" id="total-tasks-count">4 nafar</span> yordamchi';
            }

            const searchInput = document.getElementById("map-search-input");
            if (searchInput) {
                searchInput.placeholder = "Yordamchilarni ism bo'yicha qidirish";
            }

            const tagsContainer = document.querySelector(".map-tags-container");
            if (tagsContainer) {
                tagsContainer.innerHTML = `
                    <button class="tag-link active" data-category="all">Hammasi</button>
                    <button class="tag-link" data-category="usta"><i class="fas fa-wrench"></i> Usta / Ta'mirlash</button>
                    <button class="tag-link" data-category="yetkazish"><i class="fas fa-motorcycle"></i> Yetkazish / Kuryer</button>
                    <button class="tag-link" data-category="tozalash"><i class="fas fa-broom"></i> Tozalash</button>
                    <button class="tag-link" data-category="raqamli"><i class="fas fa-laptop-code"></i> Raqamli</button>
                `;
            }

            const scrollArea = document.querySelector(".tasks-scroll-area");
            if (scrollArea) {
                scrollArea.innerHTML = `
                    <div class="wide-task-card" data-type="usta" data-lat="41.3140" data-lng="69.2450">
                        <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80" style="width:48px; height:48px; border-radius:50%; object-fit:cover; flex-shrink:0; border: 2px solid #00796b;">
                        <div class="task-mid" style="text-align:left;">
                            <h4>Abbos (Universal usta)</h4>
                            <p>Dazmol, elektr jihozlar, kran ta'mirlash, mebel yig'ish xizmatlari.</p>
                            <span class="meta-data"><i class="fas fa-star" style="color:#d69e2e;"></i> 4.9 (124 ta baho) &bull; <i class="fas fa-location-dot"></i> Yunusobod 4-kvartal</span>
                        </div>
                        <div class="task-price-wrapper">
                            <div class="task-price-tag">Usta</div>
                            <button class="apply-task-btn btn-invite-helper" data-helper="Abbos" style="background:#00796b; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer;">Taklif</button>
                        </div>
                    </div>

                    <div class="wide-task-card" data-type="yetkazish" data-lat="41.3090" data-lng="69.2370">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" style="width:48px; height:48px; border-radius:50%; object-fit:cover; flex-shrink:0; border: 2px solid #00796b;">
                        <div class="task-mid" style="text-align:left;">
                            <h4>Zarina (Kuryer / Yetkazuvchi)</h4>
                            <p>Xaridlar, dori-darmon, oziq-ovqat va issiq ovqatlarni manzilga yetkazish.</p>
                            <span class="meta-data"><i class="fas fa-star" style="color:#d69e2e;"></i> 4.8 (89 ta baho) &bull; <i class="fas fa-location-dot"></i> Moyqo'rg'on ko'chasi</span>
                        </div>
                        <div class="task-price-wrapper">
                            <div class="task-price-tag">Yetkazish</div>
                            <button class="apply-task-btn btn-invite-helper" data-helper="Zarina" style="background:#00796b; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer;">Taklif</button>
                        </div>
                    </div>

                    <div class="wide-task-card" data-type="tozalash" data-lat="41.3230" data-lng="69.2360">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" style="width:48px; height:48px; border-radius:50%; object-fit:cover; flex-shrink:0; border: 2px solid #00796b;">
                        <div class="task-mid" style="text-align:left;">
                            <h4>Sardor (Uy ishlari va Tozalash)</h4>
                            <p>Hovli tozalash, deraza yuvish, xonadon tozalash va ko'chat ekish yordami.</p>
                            <span class="meta-data"><i class="fas fa-star" style="color:#d69e2e;"></i> 5.0 (56 ta baho) &bull; <i class="fas fa-location-dot"></i> Qorasaroy mavzesi</span>
                        </div>
                        <div class="task-price-wrapper">
                            <div class="task-price-tag">Tozalash</div>
                            <button class="apply-task-btn btn-invite-helper" data-helper="Sardor" style="background:#00796b; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer;">Taklif</button>
                        </div>
                    </div>

                    <div class="wide-task-card" data-type="raqamli" data-lat="41.3010" data-lng="69.2520">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" style="width:48px; height:48px; border-radius:50%; object-fit:cover; flex-shrink:0; border: 2px solid #00796b;">
                        <div class="task-mid" style="text-align:left;">
                            <h4>Nigora (Raqamli yordam)</h4>
                            <p>Kompyuter drayverlarini sozlash, printer ulash, hujjatlar yozish va IT maslahatlar.</p>
                            <span class="meta-data"><i class="fas fa-star" style="color:#d69e2e;"></i> 4.7 (102 ta baho) &bull; <i class="fas fa-location-dot"></i> Chilonzor 2-kvartal</span>
                        </div>
                        <div class="task-price-wrapper">
                            <div class="task-price-tag">Raqamli</div>
                            <button class="apply-task-btn btn-invite-helper" data-helper="Nigora" style="background:#00796b; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer;">Taklif</button>
                        </div>
                    </div>
                    <div class="loading-more-box">
                        <i class="fas fa-spinner fa-spin"></i> Atrofdagi boshqa yordamchilar yuklanmoqda...
                    </div>
                `;
        }
    }
}
});
