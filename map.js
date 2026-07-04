/* ============================================
   map.js — OPTIMISED VERSION
   - Supabase data loading
   - Marker pooling (show/hide, not destroy/recreate)
   - Debounced search
   - Event delegation (single listener on scroll area)
   - No duplicate listeners
   ============================================ */

// ── Helpers ──────────────────────────────────────────
const TASHKENT_DISTRICT_COORDS = {
    'yunusobod': [41.3551, 69.2879],
    'chilonzor': [41.2846, 69.2034],
    'shayxontohur': [41.3264, 69.2401],
    "mirzo ulug'bek": [41.3306, 69.3308],
    'mirzo ulugbek': [41.3306, 69.3308],
    'yakkasaroy': [41.2889, 69.2557],
    'uchtepa': [41.3122, 69.1858],
    'sergeli': [41.2214, 69.2350],
    'olmazor': [41.3660, 69.1980],
    'bektemir': [41.2181, 69.3630],
    'toshkent': [41.2995, 69.2401]
};

function getDistrictCoords(district) {
    const key = (district || '').toString().toLowerCase().trim();
    const base = TASHKENT_DISTRICT_COORDS[key] || TASHKENT_DISTRICT_COORDS['toshkent'];
    const jitter = () => (Math.random() - 0.5) * 0.012;
    return [base[0] + jitter(), base[1] + jitter()];
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function timeAgoText(dateStr) {
    if (!dateStr) return '';
    const then = new Date(dateStr).getTime();
    if (isNaN(then)) return '';
    const diffMin = Math.max(1, Math.round((Date.now() - then) / 60000));
    if (diffMin < 60) return `${diffMin} daqiqa oldin`;
    const diffHour = Math.round(diffMin / 60);
    if (diffHour < 24) return `${diffHour} soat oldin`;
    const diffDay = Math.round(diffHour / 24);
    return `${diffDay} kun oldin`;
}

function getCategoryVisual(cat) {
    switch (cat) {
        case 'xarid': return { emoji: '\u{1F6D2}', bg: 'bg-red', icon: 'fas fa-basket-shopping text-dark-red' };
        case 'tamirlash': return { emoji: '\u{1F527}', bg: 'bg-teal', icon: 'fas fa-wrench text-dark-teal' };
        case 'usta': return { emoji: '\u{1F527}', bg: 'bg-teal', icon: 'fas fa-wrench text-dark-teal' };
        case 'yetkazish': return { emoji: '\u{1F4CD}', bg: 'bg-orange', icon: 'fas fa-motorcycle text-dark-orange' };
        case 'tozalash': return { emoji: '\u{1F9F9}', bg: 'bg-green', icon: 'fas fa-broom text-dark-green' };
        case 'dori': return { emoji: '\u{1F48A}', bg: 'bg-red', icon: 'fas fa-pills text-dark-red' };
        case 'hujjat': return { emoji: '\u{1F4C4}', bg: 'bg-teal', icon: 'fas fa-file-invoice text-dark-teal' };
        case 'raqamli': return { emoji: '\u2728', bg: 'bg-teal', icon: 'fas fa-laptop-code text-dark-teal' };
        default: return { emoji: '\u{1F4CD}', bg: 'bg-teal', icon: 'fas fa-ellipsis text-dark-teal' };
    }
}

function showToast(text, type) {
    type = type || "success";
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

// Simple debounce utility
function debounce(fn, ms) {
    let timer = null;
    return function () {
        const args = arguments;
        const ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
}

// ── Main init ────────────────────────────────────────
(function initMapPage() {
    "use strict";

    // Role
    var currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) {}
    var role = currentUser.role || 'helper';

    // Guard: Leaflet loaded?
    if (typeof L === 'undefined') {
        showToast("Xarita tizimi yuklanmadi. Internetni tekshiring.", "error");
        return;
    }

    var hasSupabase = (typeof _supabase !== 'undefined' && _supabase);

    // DOM refs
    var scrollArea = document.querySelector(".tasks-scroll-area");
    var totalCountSpan = document.getElementById("total-tasks-count");
    var searchInput = document.getElementById("map-search-input");

    // ==========================================
    // 1. MAP INIT
    // ==========================================
    var map = L.map('main-leaflet-map', {
        zoomControl: false,
        // Performance: limit tile updates
        maxZoom: 18
    }).setView([41.31108, 69.24056], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
        // Performance: use smaller tiles on mobile / retina
        detectRetina: false
    }).addTo(map);

    // Force a resize after a tick so tiles render correctly
    requestAnimationFrame(function () { map.invalidateSize(); });

    var currentUserMarker = null;
    var accuracyCircle = null;

    // ==========================================
    // 2. GPS — Blue dot + accuracy circle (Google Maps style)
    // ==========================================
    function updateUserLocation(lat, lng, accuracy) {
        // Remove old elements
        if (currentUserMarker) map.removeLayer(currentUserMarker);
        if (accuracyCircle) map.removeLayer(accuracyCircle);

        // Accuracy circle (semi-transparent blue)
        var accRadius = Math.max(30, accuracy || 100); // meters, min 30
        accuracyCircle = L.circle([lat, lng], {
            radius: accRadius,
            color: '#4285F4',
            weight: 1,
            opacity: 0.25,
            fillColor: '#4285F4',
            fillOpacity: 0.12,
            interactive: false
        }).addTo(map);

        // Blue dot marker
        var icon = L.divIcon({
            className: 'user-live-gps-marker',
            html: '<div class="gps-core-dot"></div><div class="gps-pulse-wave"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });

        currentUserMarker = L.marker([lat, lng], {
            icon: icon,
            zIndexOffset: 1000,
            interactive: false
        }).addTo(map);
    }

    function trackLiveLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            function (pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;
                var acc = pos.coords.accuracy;
                updateUserLocation(lat, lng, acc);
                map.setView([lat, lng], 15);
            },
            function () { /* GPS denied — stay at default */ },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    trackLiveLocation();
    document.getElementById("locate-me-btn").addEventListener("click", trackLiveLocation);
    document.getElementById("zoom-in-btn").addEventListener("click", function () { map.zoomIn(); });
    document.getElementById("zoom-out-btn").addEventListener("click", function () { map.zoomOut(); });

    // ==========================================
    // 3. DATA LAYER — markers + items
    // ==========================================
    var allMarkers = [];   // { marker, cardEl, type, lat, lng, title }
    var currentItems = [];
    var activeCategory = 'all';
    var activeSearchQuery = '';

    // Create a single divIcon factory (reuse pattern, not class)
    function makePinIcon(emoji) {
        return L.divIcon({
            html: '<div style="background:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:2px solid #00796b;">' + emoji + '</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
    }

    // ==========================================
    // 4. SUPABASE FETCH
    // ==========================================
    async function fetchItems() {
        if (!hasSupabase) return [];

        if (role === 'poster') {
            var res = await _supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url, rating, district, bio')
                .eq('role', 'helper')
                .limit(30);
            if (res.error) {
                console.error("Yordamchilarni yuklashda xatolik:", res.error);
                showToast("Xatolik: " + res.error.message, "error");
                return [];
            }
            return res.data || [];
        } else {
            var res2 = await _supabase
                .from('tasks')
                .select('id, title, description, category, price, district, location, created_at, status')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(50);
            if (res2.error) {
                console.error("Topshiriqlarni yuklashda xatolik:", res2.error);
                showToast("Xatolik: " + res2.error.message, "error");
                return [];
            }
            return res2.data || [];
        }
    }

    // ==========================================
    // 5. BUILD CARD HTML
    // ==========================================
    function buildTaskCardHtml(task) {
        var vis = getCategoryVisual(task.category);
        var coords = getDistrictCoords(task.district || task.location);
        return '<div class="wide-task-card" data-type="' + escapeHtml(task.category) + '" data-lat="' + coords[0] + '" data-lng="' + coords[1] + '" data-task-id="' + task.id + '">' +
            '<div class="icon-frame ' + vis.bg + '"><i class="' + vis.icon + '"></i></div>' +
            '<div class="task-mid">' +
                '<h4>' + escapeHtml(task.title) + '</h4>' +
                '<p>' + escapeHtml(task.description || task.location || '') + '</p>' +
                '<span class="meta-data"><i class="fas fa-location-dot"></i> ' + escapeHtml(task.district || task.location || 'Toshkent') + ' &bull; <i class="far fa-clock"></i> ' + timeAgoText(task.created_at) + '</span>' +
            '</div>' +
            '<div class="task-price-wrapper">' +
                '<div class="task-price-tag">' + parseInt(task.price || 0).toLocaleString() + " so'm</div>" +
                '<button class="apply-task-btn" data-task-id="' + task.id + '">Yuborish</button>' +
            '</div>' +
        '</div>';
    }

    function buildHelperCardHtml(helper) {
        var name = (helper.first_name || '') + ' ' + (helper.last_name || '');
        name = name.trim() || 'Yordamchi';
        var rating = parseFloat(helper.rating || 5.0).toFixed(1);
        var coords = getDistrictCoords(helper.district);
        var avatarHtml;
        if (helper.avatar_url) {
            avatarHtml = '<img src="' + escapeHtml(helper.avatar_url) + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #00796b;" loading="lazy">';
        } else {
            avatarHtml = '<div style="width:48px;height:48px;border-radius:50%;background:#00796b;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;border:2px solid #00796b;">' + escapeHtml(name.charAt(0).toUpperCase()) + '</div>';
        }

        return '<div class="wide-task-card" data-type="helper" data-lat="' + coords[0] + '" data-lng="' + coords[1] + '" data-helper-id="' + helper.id + '">' +
            avatarHtml +
            '<div class="task-mid" style="text-align:left;">' +
                '<h4>' + escapeHtml(name) + '</h4>' +
                '<p>' + escapeHtml(helper.bio || "Ishonchli mahalladosh yordamchi.") + '</p>' +
                '<span class="meta-data"><i class="fas fa-star" style="color:#d69e2e;"></i> ' + rating + ' &bull; <i class="fas fa-location-dot"></i> ' + escapeHtml(helper.district || 'Toshkent') + '</span>' +
            '</div>' +
            '<div class="task-price-wrapper">' +
                '<button class="apply-task-btn btn-invite-helper" data-helper="' + escapeHtml(name) + '" data-helper-id="' + helper.id + '">Taklif</button>' +
            '</div>' +
        '</div>';
    }

    // ==========================================
    // 6. FULL RENDER (cards + markers) — called ONCE per data load
    // ==========================================
    function fullRender(items) {
        // Clear old markers from map
        allMarkers.forEach(function (m) { map.removeLayer(m.marker); });
        allMarkers = [];
        currentItems = items;

        if (!scrollArea) return;

        if (!items.length) {
            scrollArea.innerHTML = '<div class="loading-more-box"><i class="fa-regular fa-clipboard"></i> ' +
                (role === 'poster' ? "Hozircha yordamchilar topilmadi." : "Hozircha mavjud topshiriqlar yo'q.") + '</div>';
            if (totalCountSpan) totalCountSpan.textContent = role === 'poster' ? '0 nafar' : '0 ta';
            return;
        }

        // Build HTML
        scrollArea.innerHTML = items.map(function (item) {
            return role === 'poster' ? buildHelperCardHtml(item) : buildTaskCardHtml(item);
        }).join('');

        // Create markers from the newly rendered cards
        var cards = scrollArea.querySelectorAll(".wide-task-card");
        var visibleCount = 0;

        cards.forEach(function (card) {
            var lat = parseFloat(card.getAttribute("data-lat"));
            var lng = parseFloat(card.getAttribute("data-lng"));
            var title = (card.querySelector("h4") || {}).textContent || '';
            var type = card.getAttribute("data-type") || '';

            var emoji = role === 'poster' ? '\u{1F9D1}\u200D\u{1F527}' : (getCategoryVisual(type).emoji || '\u{1F4CD}');

            var marker = L.marker([lat, lng], { icon: makePinIcon(emoji) }).addTo(map);
            marker.bindPopup(
                '<b>' + escapeHtml(title) + '</b><br>' +
                (role === 'poster' ? "Yordamchi faol" : "Haq ko'rsatilgan")
            );

            allMarkers.push({
                marker: marker,
                cardEl: card,
                type: type,
                lat: lat,
                lng: lng,
                title: title
            });

            visibleCount++;
        });

        if (totalCountSpan) {
            totalCountSpan.textContent = role === 'poster' ? (visibleCount + ' nafar') : (visibleCount + ' ta');
        }

        // Apply current filter/search state
        applyVisibility();
    }

    // ==========================================
    // 7. VISIBILITY FILTER — show/hide (no destroy!)
    // ==========================================
    function applyVisibility() {
        var visibleMarkerCount = 0;
        var query = activeSearchQuery;

        allMarkers.forEach(function (entry) {
            var card = entry.cardEl;
            var marker = entry.marker;
            var matchCategory = (activeCategory === 'all') || (entry.type === activeCategory);

            var matchSearch = true;
            if (query) {
                var titleLow = entry.title.toLowerCase();
                var pText = (card.querySelector("p") || {}).textContent || '';
                var descLow = pText.toLowerCase();
                matchSearch = titleLow.indexOf(query) !== -1 || descLow.indexOf(query) !== -1;
            }

            var visible = matchCategory && matchSearch;

            // Toggle card visibility
            if (visible) {
                card.classList.remove("hidden");
                if (!map.hasLayer(marker)) marker.addTo(map);
                visibleMarkerCount++;
            } else {
                card.classList.add("hidden");
                if (map.hasLayer(marker)) map.removeLayer(marker);
            }
        });

        if (totalCountSpan) {
            totalCountSpan.textContent = role === 'poster' ? (visibleMarkerCount + ' nafar') : (visibleMarkerCount + ' ta');
        }
    }

    // ==========================================
    // 8. EVENT DELEGATION — one listener on scroll area
    // ==========================================
    if (scrollArea) {
        scrollArea.addEventListener("click", function (e) {
            // Card click (not button) — fly to marker
            var card = e.target.closest(".wide-task-card");
            if (card && !e.target.closest(".apply-task-btn")) {
                var lat = parseFloat(card.getAttribute("data-lat"));
                var lng = parseFloat(card.getAttribute("data-lng"));
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.setView([lat, lng], 16);
                    // Find matching marker and open popup
                    for (var i = 0; i < allMarkers.length; i++) {
                        if (allMarkers[i].cardEl === card) {
                            allMarkers[i].marker.openPopup();
                            break;
                        }
                    }
                }
                return;
            }

            // Apply-task button click (helper role — submit bid)
            var applyBtn = e.target.closest(".apply-task-btn:not(.btn-invite-helper)");
            if (applyBtn) {
                e.stopPropagation();
                handleHelperApply(applyBtn);
                return;
            }

            // Invite-helper button click (poster role — send notification)
            var inviteBtn = e.target.closest(".btn-invite-helper");
            if (inviteBtn) {
                e.stopPropagation();
                handlePosterInvite(inviteBtn);
                return;
            }
        });
    }

    async function handleHelperApply(btn) {
        var taskId = btn.getAttribute("data-task-id");
        if (!hasSupabase || !currentUser.id) {
            showToast("Avval tizimga kiring.", "error");
            return;
        }
        var task = currentItems.find(function (t) { return String(t.id) === String(taskId); });
        btn.disabled = true;
        btn.textContent = "...";

        var res = await _supabase.from('task_bids').insert([{
            task_id: taskId,
            helper_id: currentUser.id,
            price: task ? task.price : null,
            proposal: "Ushbu topshiriqni bajarishga tayyorman.",
            status: 'pending'
        }]);

        if (res.error) {
            showToast("Xatolik: " + res.error.message, "error");
            btn.disabled = false;
            btn.textContent = "Yuborish";
            return;
        }
        showToast("So'rovingiz muvaffaqiyatli yuborildi! ✅");
        btn.textContent = "Yuborildi";
        btn.style.background = "#718096";
    }

    async function handlePosterInvite(btn) {
        var helperId = btn.getAttribute("data-helper-id");
        var helperName = btn.getAttribute("data-helper") || "Yordamchi";

        if (!hasSupabase || !currentUser.id) {
            showToast("Avval tizimga kiring.", "error");
            return;
        }
        btn.disabled = true;
        btn.textContent = "...";

        var res = await _supabase.from('notifications').insert([{
            user_id: helperId,
            title: "Ishga taklif",
            text: (currentUser.first_name || 'Mijoz') + ' sizni topshiriqqa taklif qilmoqda.',
            type: 'offer',
            is_read: false
        }]);

        if (res.error) {
            showToast("Xatolik: " + res.error.message, "error");
            btn.disabled = false;
            btn.textContent = "Taklif";
            return;
        }
        showToast(helperName + 'ga taklif yuborildi! ✉️');
        btn.textContent = "Yuborildi";
        btn.style.background = "#718096";
    }

    // ==========================================
    // 9. CATEGORY TAGS — event delegation
    // ==========================================
    var tagsContainer = document.querySelector(".map-tags-container");
    if (tagsContainer) {
        tagsContainer.addEventListener("click", function (e) {
            var tag = e.target.closest(".tag-link");
            if (!tag) return;

            tagsContainer.querySelectorAll(".tag-link").forEach(function (t) { t.classList.remove("active"); });
            tag.classList.add("active");
            activeCategory = tag.getAttribute("data-category") || 'all';
            applyVisibility();
        });
    }

    // ==========================================
    // 10. SEARCH — debounced
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener("input", debounce(function () {
            activeSearchQuery = searchInput.value.toLowerCase().trim();
            applyVisibility();
        }, 250));
    }

    // ==========================================
    // 11. BACK BUTTON
    // ==========================================
    var backBtn = document.querySelector(".top-search-overlay a");
    if (backBtn) {
        backBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = role === 'poster' ? 'poster.html' : 'vazifa.html';
        });
    }

    // ==========================================
    // 12. MIC BUTTON (simple toast)
    // ==========================================
    var micIcon = document.querySelector(".mic-icon");
    if (micIcon) {
        micIcon.style.cursor = "pointer";
        micIcon.addEventListener("click", function () {
            showToast("Ovozli qidiruv faollashtirildi... 🎙️ Gapiring");
            micIcon.style.color = "#e53e3e";
            setTimeout(function () { micIcon.style.color = ""; }, 1800);
        });
    }

    // ==========================================
    // 13. FILTER MODAL
    // ==========================================
    var filterBtn = document.getElementById("filter-toggle-btn");
    if (filterBtn) {
        filterBtn.addEventListener("click", function () {
            var modalHtml =
                '<h2 style="margin:0 0 4px 0;color:#004d3f;font-size:18px;font-weight:800;text-align:left;">Saralash va Filtrlar</h2>' +
                '<p style="margin:0 0 20px 0;color:#718096;font-size:13px;text-align:left;">Ko\'rsatish parametrlarini sozlang</p>' +
                '<div style="text-align:left;display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">' +
                    '<div style="display:flex;flex-direction:column;gap:6px;">' +
                        '<label style="font-size:12.5px;font-weight:700;color:#4a5568;">Saralash tartibi</label>' +
                        '<select id="filter-sort" style="width:100%;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 14px;font-size:14px;font-family:inherit;outline:none;background:#f9fcfb;">' +
                            '<option value="default">Odatiy tartibda</option>' +
                            '<option value="new">Eng yangi</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<button id="btn-apply-filters" style="width:100%;padding:12px;border-radius:12px;border:none;background:#006653;color:#fff;font-size:14.5px;font-weight:600;cursor:pointer;margin-bottom:8px;"><i class="fas fa-filter" style="margin-right:8px;"></i>Filtrlarni qo\'llash</button>' +
                '<button id="btn-reset-filters" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;color:#2d3748;font-size:14.5px;font-weight:600;cursor:pointer;">Bekor qilish</button>';
            openMapModal(modalHtml);

            document.getElementById("btn-apply-filters").addEventListener("click", function () {
                showToast("Filtrlar muvaffaqiyatli qo'llanildi! 🎯");
                closeMapModal();
            });
            document.getElementById("btn-reset-filters").addEventListener("click", function () {
                showToast("Filtrlar tozalandi.");
                closeMapModal();
            });
        });
    }

    function openMapModal(htmlContent) {
        var overlay = document.getElementById("mapModalOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "mapModalOverlay";
            overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,30,0.55);backdrop-filter:blur(4px);z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;";
            document.body.appendChild(overlay);
        }
        overlay.innerHTML =
            '<div style="max-width:400px;width:100%;padding:28px 24px;border-radius:20px;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.25);position:relative;text-align:center;">' +
                '<button id="closeMapModalBtn" style="position:absolute;right:16px;top:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#718096;line-height:1;">&times;</button>' +
                htmlContent +
            '</div>';
        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";

        document.getElementById("closeMapModalBtn").addEventListener("click", closeMapModal);
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeMapModal();
        });
    }

    function closeMapModal() {
        var overlay = document.getElementById("mapModalOverlay");
        if (overlay) overlay.style.display = "none";
        document.body.style.overflow = "";
    }

    // ==========================================
    // 14. DRAGGABLE BOTTOM SHEET
    // ==========================================
    var sheetHandle = document.getElementById("sheetHandle");
    var sheetDragArea = document.getElementById("sheetDragArea");
    var taskSheet = document.getElementById("taskSheet");

    (function initDraggableSheet() {
        if (!taskSheet || !sheetDragArea) return;

        var sheetHeight = taskSheet.offsetHeight;
        var collapsedTranslate = sheetHeight - 64; // Only show ~64px of the top
        var dragStartY = 0;
        var dragStartTranslate = 0;
        var isDragging = false;
        var currentTranslate = 0; // 0 = fully open, collapsedTranslate = collapsed
        var sheetState = 'open'; // 'open' or 'collapsed'

        // Recalculate on resize
        function recalcSheetHeight() {
            sheetHeight = taskSheet.offsetHeight;
            collapsedTranslate = sheetHeight - 64;
            if (sheetState === 'collapsed') {
                taskSheet.style.transform = 'translateY(' + collapsedTranslate + 'px)';
                currentTranslate = collapsedTranslate;
            }
        }
        window.addEventListener('resize', debounce(recalcSheetHeight, 200));

        function getTranslateY() {
            var style = window.getComputedStyle(taskSheet);
            var matrix = new DOMMatrix(style.transform);
            return matrix.m42;
        }

        function snapTo(state) {
            taskSheet.classList.add('snapping');
            if (state === 'collapsed') {
                recalcSheetHeight();
                taskSheet.style.transform = 'translateY(' + collapsedTranslate + 'px)';
                currentTranslate = collapsedTranslate;
                sheetState = 'collapsed';
            } else {
                taskSheet.style.transform = 'translateY(0)';
                currentTranslate = 0;
                sheetState = 'open';
            }
            setTimeout(function () {
                taskSheet.classList.remove('snapping');
                map.invalidateSize();
            }, 360);
        }

        // --- Touch events ---
        sheetDragArea.addEventListener('touchstart', function (e) {
            isDragging = true;
            dragStartY = e.touches[0].clientY;
            dragStartTranslate = getTranslateY();
            taskSheet.classList.remove('snapping');
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
            var deltaY = e.touches[0].clientY - dragStartY;
            var newTranslate = dragStartTranslate + deltaY;
            // Clamp: can't go above 0, can't go below collapsed
            newTranslate = Math.max(0, Math.min(newTranslate, collapsedTranslate));
            taskSheet.style.transform = 'translateY(' + newTranslate + 'px)';
            currentTranslate = newTranslate;
        }, { passive: true });

        document.addEventListener('touchend', function () {
            if (!isDragging) return;
            isDragging = false;
            // Snap: if dragged more than 40% down → collapse, else → open
            var threshold = collapsedTranslate * 0.4;
            if (currentTranslate > threshold) {
                snapTo('collapsed');
            } else {
                snapTo('open');
            }
        });

        // --- Mouse events (for desktop) ---
        sheetDragArea.addEventListener('mousedown', function (e) {
            isDragging = true;
            dragStartY = e.clientY;
            dragStartTranslate = getTranslateY();
            taskSheet.classList.remove('snapping');
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            var deltaY = e.clientY - dragStartY;
            var newTranslate = dragStartTranslate + deltaY;
            newTranslate = Math.max(0, Math.min(newTranslate, collapsedTranslate));
            taskSheet.style.transform = 'translateY(' + newTranslate + 'px)';
            currentTranslate = newTranslate;
        });

        document.addEventListener('mouseup', function () {
            if (!isDragging) return;
            isDragging = false;
            var threshold = collapsedTranslate * 0.4;
            if (currentTranslate > threshold) {
                snapTo('collapsed');
            } else {
                snapTo('open');
            }
        });
    })();

    // ==========================================
    // 15. LIST TOGGLE LINK
    // ==========================================
    var listToggle = document.getElementById("list-toggle-alert");
    if (listToggle) {
        listToggle.addEventListener("click", function (e) {
            e.preventDefault();
            var target = role === 'poster' ? 'poster.html' : 'vazifa.html';
            showToast("Ro'yxat ko'rinishiga yo'naltirilmoqda...");
            setTimeout(function () { window.location.href = target; }, 900);
        });
    }

    // ==========================================
    // 16. ROLE-SPECIFIC UI
    // ==========================================
    if (role === 'poster') {
        document.title = "Topshiriq.uz — Atrofingizdagi yordamchilar xaritasi";
        var headerTitle = document.querySelector(".sheet-header h3");
        if (headerTitle) {
            headerTitle.innerHTML = 'Atrofingizda <span class="green-count" id="total-tasks-count">...</span> yordamchi';
            totalCountSpan = document.getElementById("total-tasks-count"); // re-fetch after DOM change
        }
        if (searchInput) searchInput.placeholder = "Yordamchilarni ism bo'yicha qidirish";

        if (tagsContainer) {
            tagsContainer.innerHTML = '<button class="tag-link active" data-category="all">Hammasi</button>';
        }
    }

    // ==========================================
    // 17. LOAD DATA
    // ==========================================
    async function loadAndRender() {
        if (scrollArea) {
            scrollArea.innerHTML = '<div class="loading-more-box"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';
        }
        try {
            var items = await fetchItems();
            fullRender(items);
        } catch (err) {
            console.error("loadAndRender error:", err);
            showToast("Ma'lumotlarni yuklashda xatolik yuz berdi.", "error");
            if (scrollArea) {
                scrollArea.innerHTML = '<div class="loading-more-box"><i class="fa-solid fa-triangle-exclamation"></i> Xatolik yuz berdi.</div>';
            }
        }
    }

    loadAndRender();
})();