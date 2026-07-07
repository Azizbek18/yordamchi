
const TRACK_STATUS_STEP = {
    draft: 0, published: 0, assigned: 1, on_the_way: 2, arrived: 2, started: 2, completed: 3, cancelled: 1
};

const TRACK_STATUS_LABEL = {
    published: "E'lon qilingan", assigned: "Bajaruvchi tasdiqlandi", on_the_way: "Yo'lda",
    arrived: "Manzilga yetib keldi", started: "Ish boshlandi", completed: "Yakunlandi", cancelled: "Bekor qilingan"
};

const TRACK_ACTIVE_STATUSES = ['on_the_way', 'arrived', 'started'];

// Tumanlar bo'yicha taxminiy koordinatalar (real geokodlash yo'q — aniq manzil emas, tuman markazi)
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

document.addEventListener("DOMContentLoaded", async () => {
    function showToast(text, type = "success") {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text, duration: 3000, gravity: "top", position: "right",
                style: { background: type === "success" ? "#006653" : "#e53e3e" }
            }).showToast();
        }
    }

    function formatSom(amount) {
        return Math.round(Number(amount) || 0).toLocaleString('uz-UZ') + " UZS";
    }

    function initialsOf(name) {
        return (name || '').trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase() || '?';
    }

    const loadingEl = document.getElementById("trackingLoadingState");
    const contentEl = document.getElementById("trackingContent");
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    function showEmpty(text) {
        loadingEl.textContent = text;
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';
    }

    if (!user || !_supabase) {
        showEmpty("Kuzatish uchun tizimga kiring.");
        return;
    }

    const myRole = user.role === 'employer' ? 'poster' : 'helper';
    const filterCol = myRole === 'poster' ? 'poster_id' : 'helper_id';

    const { data: activeTasks, error: taskError } = await _supabase
        .from('tasks')
        .select('*')
        .eq(filterCol, user.id)
        .in('status', ['assigned', 'on_the_way', 'arrived', 'started'])
        .order('created_at', { ascending: false })
        .limit(1);

    if (taskError) {
        showEmpty("Ma'lumotlarni yuklab bo'lmadi: " + taskError.message);
        return;
    }

    if (!activeTasks || activeTasks.length === 0) {
        showEmpty("Hozircha kuzatib boradigan faol vazifangiz yo'q.");
        return;
    }

    let task = activeTasks[0];
    const counterpartId = myRole === 'poster' ? task.helper_id : task.poster_id;

    const { data: counterpart } = await _supabase
        .from('profiles')
        .select('first_name, last_name, phone, rating, reviews_count')
        .eq('id', counterpartId)
        .maybeSingle();

    const counterpartName = [counterpart?.first_name, counterpart?.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';
    const counterpartInitials = initialsOf(counterpartName);

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    // ── Sarlavha (statik qism) ──
    document.getElementById("taskHeaderDesc").textContent = `Vazifa: ${task.title}`;
    document.getElementById("taskPriceBadge").textContent = formatSom(task.price);

    // ── Kontragent kartasi (statik qism) ──
    document.getElementById("contractorName").textContent = counterpartName;
    document.getElementById("contractorAvatar").innerHTML = `${counterpartInitials}<span class="c-online"></span>`;
    document.getElementById("contractorStars").innerHTML =
        `★ ${counterpart?.rating ? Number(counterpart.rating).toFixed(1) : '—'} <span style="color:#888">(${counterpart?.reviews_count || 0} ta sharh)</span>`;

    // ── Mijoz manzili (faqat yordamchiga ko'rsatiladi) ──
    document.getElementById("mapHeaderLabel").textContent = myRole === 'helper' ? 'Mijoz manzili' : 'Bajaruvchi joylashuvi';
    const addressRow = document.getElementById("mapAddressRow");
    if (myRole === 'helper') {
        addressRow.classList.add('visible');
        addressRow.textContent = '';
        const icon = document.createElement('i');
        icon.className = 'fas fa-location-dot';
        addressRow.appendChild(icon);
        addressRow.appendChild(document.createTextNode(' ' + [task.district, task.location].filter(Boolean).join(', ')));
    }

    // ── Jonli xarita (Leaflet) ──
    const clientCoords = getDistrictCoords(task.district || task.location);
    const initialHelperCoords = (typeof task.helper_latitude === 'number' && typeof task.helper_longitude === 'number')
        ? [task.helper_latitude, task.helper_longitude]
        : getDistrictCoords(task.district || task.location);

    let trackingMap = null, clientMarker = null, helperMarker = null, routeLine = null;

    function initTrackingMap() {
        if (typeof L === 'undefined' || !document.getElementById('trackingMap')) return;

        trackingMap = L.map('trackingMap', { zoomControl: false, scrollWheelZoom: false }).setView(clientCoords, 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 18
        }).addTo(trackingMap);

        const homeIcon = L.divIcon({
            className: '', iconSize: [34, 34], iconAnchor: [17, 17],
            html: '<div style="background:#1a6b5a;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid white;">🏠</div>'
        });
        const personIcon = L.divIcon({
            className: '', iconSize: [32, 32], iconAnchor: [16, 16],
            html: '<div style="background:#2a9078;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:white;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid white;">🚶</div>'
        });

        clientMarker = L.marker(clientCoords, { icon: homeIcon }).addTo(trackingMap)
            .bindPopup(myRole === 'poster' ? 'Siz (manzil)' : 'Mijoz manzili');
        helperMarker = L.marker(initialHelperCoords, { icon: personIcon }).addTo(trackingMap)
            .bindPopup(myRole === 'poster' ? counterpartName : 'Siz');
        routeLine = L.polyline([clientCoords, initialHelperCoords], { color: '#2a9078', weight: 3, dashArray: '6 6', opacity: 0.8 }).addTo(trackingMap);

        const group = L.featureGroup([clientMarker, helperMarker]);
        trackingMap.fitBounds(group.getBounds().pad(0.35));
        requestAnimationFrame(() => trackingMap.invalidateSize());
    }

    function moveHelperMarker(lat, lng) {
        if (!helperMarker) return;
        helperMarker.setLatLng([lat, lng]);
        if (routeLine && clientMarker) routeLine.setLatLngs([clientMarker.getLatLng(), [lat, lng]]);
        if (trackingMap) trackingMap.panTo([lat, lng]);
    }

    initTrackingMap();

    // ── Yordamchi tomonidan jonli GPS yuborish ──
    let geoWatchId = null;
    let lastGeoUpdateAt = 0;
    const GEO_UPDATE_INTERVAL_MS = 8000;

    function startSharingLocation() {
        if (!navigator.geolocation || geoWatchId !== null) return;
        geoWatchId = navigator.geolocation.watchPosition(
            async pos => {
                const { latitude, longitude } = pos.coords;
                moveHelperMarker(latitude, longitude);
                const now = Date.now();
                if (now - lastGeoUpdateAt < GEO_UPDATE_INTERVAL_MS) return;
                lastGeoUpdateAt = now;
                await _supabase.from('tasks').update({ helper_latitude: latitude, helper_longitude: longitude }).eq('id', task.id);
            },
            () => { /* GPS ruxsat berilmadi — xaritada taxminiy joylashuv qoladi */ },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    }

    function stopSharingLocation() {
        if (geoWatchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(geoWatchId);
            geoWatchId = null;
        }
    }

    if (myRole === 'helper' && TRACK_ACTIVE_STATUSES.includes(task.status)) {
        startSharingLocation();
    }

    // ── Jarayon qadamlari va holat matnlari (qayta chaqiriladigan) ──
    function renderStatusUI() {
        document.getElementById("taskHeaderTitle").textContent =
            `#${task.id.slice(0, 8).toUpperCase()} · ${TRACK_STATUS_LABEL[task.status] || task.status}`;
        document.getElementById("contractorStatusRow").innerHTML =
            `<span class="icon">🚚</span> Holat: ${TRACK_STATUS_LABEL[task.status] || task.status}`;

        const stepIndex = TRACK_STATUS_STEP[task.status] ?? 0;
        const step2Text = {
            assigned: `${counterpartName.split(' ')[0]} hali yo'lga chiqmadi`,
            on_the_way: `${counterpartName.split(' ')[0]} yo'lda…`,
            arrived: `${counterpartName.split(' ')[0]} manzilga yetib keldi`,
            started: `${counterpartName.split(' ')[0]} ishni boshladi`
        }[task.status] || '';

        const steps = [
            { title: "Vazifa e'lon qilindi", info: new Date(task.created_at).toLocaleString('uz-UZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }), done: true },
            { title: "Bajaruvchi tasdiqlandi", info: stepIndex >= 1 ? "Bajarildi" : "Kutilmoqda", done: stepIndex >= 1 },
            { title: "Jarayon davom etmoqda", info: step2Text, done: stepIndex >= 3, active: stepIndex === 2 },
            { title: "Yakunlandi", info: stepIndex >= 3 ? "Bajarildi" : "Kutilmoqda", done: stepIndex >= 3 }
        ];

        document.getElementById("stepsContainer").innerHTML = steps.map((s, i) => `
            <div class="step">
                <div class="step-dot ${s.done ? 'done' : (s.active ? 'active' : 'pending')}">${s.done ? '✓' : (s.active ? '●' : '○')}</div>
                ${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}
                <div class="step-info">
                    <h4>${s.title}</h4>
                    <span class="${s.active ? 'sub-link' : ''}">${s.info}</span>
                </div>
            </div>
        `).join('');
    }

    renderStatusUI();

    // ── Jonli xabarlar (task_tracking_steps) — qayta chaqiriladigan ──
    async function renderFeed() {
        const { data: trackingSteps } = await _supabase
            .from('task_tracking_steps')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false });

        const feedContainer = document.getElementById("feedContainer");
        const feedEntries = (trackingSteps && trackingSteps.length > 0) ? trackingSteps : [
            { title: "Vazifa e'lon qilindi", description: task.title, created_at: task.created_at }
        ];
        feedContainer.innerHTML = feedEntries.map(f => `
            <div class="feed-item">
                <div class="feed-icon">📌</div>
                <div class="feed-text">
                    <h4>${f.title}</h4>
                    <p>${f.description || ''}</p>
                </div>
                <span class="feed-time">${new Date(f.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');
    }

    await renderFeed();

    // ── Chat va Qo'ng'iroq ──
    document.getElementById("btnOpenChat").addEventListener("click", () => {
        if (typeof openChatWith === "function") openChatWith(counterpartId, task.id);
    });
    document.getElementById("callModalTitle").textContent = `📞 ${counterpartName}`;
    document.getElementById("callModalPhone").textContent = counterpart?.phone || "Telefon raqami mavjud emas";

    // ── Amal tugmalari (rolga va holatga qarab, qayta chaqiriladigan) ──
    async function updateTaskStatus(newStatus, extra = {}) {
        const { error } = await _supabase.from('tasks').update({ status: newStatus, ...extra }).eq('id', task.id);
        if (error) {
            showToast("Xatolik: " + error.message, "error");
            return false;
        }
        task = { ...task, status: newStatus, ...extra };
        await _supabase.from('task_tracking_steps').insert({
            task_id: task.id,
            status: newStatus,
            title: TRACK_STATUS_LABEL[newStatus] || newStatus
        });
        return true;
    }

    const actionSlot = document.getElementById("taskActionSlot");

    function renderActionSlot() {
        actionSlot.innerHTML = '';

        if (myRole === 'helper') {
            const nextStepByStatus = {
                assigned: { label: "Yo'lga chiqdim", next: 'on_the_way' },
                on_the_way: { label: "Yetib keldim", next: 'arrived' },
                arrived: { label: "Ishni boshladim", next: 'started' }
            };
            const step = nextStepByStatus[task.status];
            if (step) {
                const btn = document.createElement("button");
                btn.className = "btn-modal-primary";
                btn.style = "background:#006653; width:100%; border-radius:12px; padding:12px; border:none; color:white; font-size:14px; font-weight:700; cursor:pointer; margin-top:12px; font-family:inherit;";
                btn.textContent = step.label;
                btn.addEventListener("click", async () => {
                    btn.disabled = true;
                    const ok = await updateTaskStatus(step.next);
                    if (ok) {
                        showToast("Holat yangilandi: " + TRACK_STATUS_LABEL[step.next]);
                        if (TRACK_ACTIVE_STATUSES.includes(step.next)) startSharingLocation();
                        renderStatusUI();
                        renderActionSlot();
                        renderFeed();
                    } else {
                        btn.disabled = false;
                    }
                });
                actionSlot.appendChild(btn);
            } else if (task.status === 'started') {
                const info = document.createElement("div");
                info.style = "background:#f0fff4; border:1px dashed #38a169; border-radius:12px; padding:10px 12px; font-size:12.5px; color:#276749; font-weight:600; margin-top:12px; text-align:center; font-family:inherit;";
                info.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Buyurtmachi ishni qabul qilishi kutilmoqda...';
                actionSlot.appendChild(info);
            }
        } else if (myRole === 'poster' && task.status === 'started') {
            const btn = document.createElement("button");
            btn.className = "btn-modal-primary";
            btn.id = "btnConfirmCompletion";
            btn.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>Ishni qabul qilish';
            btn.style = "background:#006653; width:100%; border-radius:12px; padding:12px; border:none; color:white; font-size:14px; font-weight:700; cursor:pointer; margin-top:12px; font-family:inherit;";
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                const ok = await updateTaskStatus('completed', { completed_at: new Date().toISOString() });
                if (!ok) { btn.disabled = false; return; }

                await _supabase.from('transactions').insert({
                    user_id: task.helper_id,
                    task_id: task.id,
                    amount: task.price,
                    type: 'payment_release',
                    status: 'completed'
                });

                stopSharingLocation();
                showToast("Ish muvaffaqiyatli qabul qilindi! To'lov ijrochiga o'tkazildi. Rahmat! 🎉");
                document.getElementById("btnCancelTask")?.remove();
                btn.textContent = "Qabul qilindi";
                setTimeout(() => { window.location.href = "baholash.html"; }, 1600);
            });
            actionSlot.appendChild(btn);
        }
    }

    renderActionSlot();

    // ── Modal boshqaruvi ──
    window.openModal = id => document.getElementById(id)?.classList.add('open');
    window.closeModal = id => document.getElementById(id)?.classList.remove('open');

    document.getElementById("cancelModalText").textContent =
        `Haqiqatan ham "${task.title}" vazifasini bekor qilmoqchimisiz?`;

    window.confirmCancelTask = async function () {
        closeModal('cancelModal');
        const ok = await updateTaskStatus('cancelled');
        if (!ok) return;
        stopSharingLocation();
        showToast("Vazifa bekor qilindi");
        setTimeout(() => {
            window.location.href = myRole === 'poster' ? 'poster.html' : 'vazifa.html';
        }, 1200);
    };

    window.confirmCall = function () {
        closeModal('callModal');
        showToast("Qo'ng'iroq ulanmoqda... 📞");
    };

    // ── Real vaqtda kuzatish: qarshi tomon holati/joylashuvi o'zgarishi ──
    _supabase
        .channel(`task-tracking-${task.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `id=eq.${task.id}` }, payload => {
            const updated = payload.new || {};
            const statusChanged = updated.status && updated.status !== task.status;
            const hasLiveCoords = typeof updated.helper_latitude === 'number' && typeof updated.helper_longitude === 'number';

            task = { ...task, ...updated };

            if (hasLiveCoords) {
                moveHelperMarker(updated.helper_latitude, updated.helper_longitude);
            }

            if (statusChanged) {
                renderStatusUI();
                renderActionSlot();
                renderFeed();
                showToast("Holat yangilandi: " + (TRACK_STATUS_LABEL[updated.status] || updated.status));

                if (myRole === 'helper' && TRACK_ACTIVE_STATUSES.includes(updated.status)) {
                    startSharingLocation();
                }
                if (updated.status === 'completed' || updated.status === 'cancelled') {
                    stopSharingLocation();
                    setTimeout(() => {
                        window.location.href = myRole === 'poster' ? 'poster.html' : 'vazifa.html';
                    }, 1800);
                }
            }
        })
        .subscribe();

    window.addEventListener('beforeunload', stopSharingLocation);
});
