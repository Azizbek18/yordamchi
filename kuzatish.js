
const TRACK_STATUS_STEP = {
    draft: 0, published: 0, assigned: 1, on_the_way: 2, arrived: 2, started: 2, completed: 3, cancelled: 1
};

const TRACK_STATUS_LABEL = {
    published: "E'lon qilingan", assigned: "Bajaruvchi tasdiqlandi", on_the_way: "Yo'lda",
    arrived: "Manzilga yetib keldi", started: "Ish boshlandi", completed: "Yakunlandi", cancelled: "Bekor qilingan"
};

const TRACK_MARKER_PROGRESS = { assigned: 0, on_the_way: 0.45, arrived: 0.85, started: 1, completed: 1 };

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

    // ── Sarlavha ──
    document.getElementById("taskHeaderTitle").textContent =
        `#${task.id.slice(0, 8).toUpperCase()} · ${TRACK_STATUS_LABEL[task.status] || task.status}`;
    document.getElementById("taskHeaderDesc").textContent = `Vazifa: ${task.title}`;
    document.getElementById("taskPriceBadge").textContent = formatSom(task.price);

    // ── Kontragent kartasi ──
    document.getElementById("contractorName").textContent = counterpartName;
    document.getElementById("contractorAvatar").innerHTML = `${counterpartInitials}<span class="c-online"></span>`;
    document.getElementById("contractorStars").innerHTML =
        `★ ${counterpart?.rating ? Number(counterpart.rating).toFixed(1) : '—'} <span style="color:#888">(${counterpart?.reviews_count || 0} ta sharh)</span>`;
    document.getElementById("contractorStatusRow").innerHTML =
        `<span class="icon">🚚</span> Holat: ${TRACK_STATUS_LABEL[task.status] || task.status}`;

    // ── Xarita (illyustrativ, real GPS emas — holatga qarab belgi joylashuvi) ──
    const path = document.querySelector('.dashed-path');
    const marker = document.getElementById('helperMarker');
    if (path && marker) {
        const fraction = TRACK_MARKER_PROGRESS[task.status] ?? 0;
        const length = path.getTotalLength();
        const pt = path.getPointAtLength(fraction * length);
        marker.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
    }
    document.getElementById("mapMarkerInitials").textContent = myRole === 'poster' ? counterpartInitials : 'SIZ';
    document.getElementById("mapMarkerLabel").textContent = myRole === 'poster' ? counterpartName.split(' ')[0] : "Siz";
    document.getElementById("mapHomeLabel").textContent = myRole === 'poster' ? "Siz (Uy)" : "Buyurtmachi (Uy)";

    // ── Jarayon qadamlari ──
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

    // ── Jonli xabarlar (task_tracking_steps) ──
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

    // ── Chat va Qo'ng'iroq ──
    document.getElementById("btnOpenChat").addEventListener("click", () => {
        if (typeof openChatWith === "function") openChatWith(counterpartId, task.id);
    });
    document.getElementById("callModalTitle").textContent = `📞 ${counterpartName}`;
    document.getElementById("callModalPhone").textContent = counterpart?.phone || "Telefon raqami mavjud emas";

    // ── Amal tugmalari (rolga va holatga qarab) ──
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
                    window.location.reload();
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

            showToast("Ish muvaffaqiyatli qabul qilindi! To'lov ijrochiga o'tkazildi. Rahmat! 🎉");
            document.getElementById("btnCancelTask")?.remove();
            btn.textContent = "Qabul qilindi";
            setTimeout(() => { window.location.href = "baholash.html"; }, 1600);
        });
        actionSlot.appendChild(btn);
    }

    // ── Modal boshqaruvi ──
    window.openModal = id => document.getElementById(id)?.classList.add('open');
    window.closeModal = id => document.getElementById(id)?.classList.remove('open');

    document.getElementById("cancelModalText").textContent =
        `Haqiqatan ham "${task.title}" vazifasini bekor qilmoqchimisiz?`;

    window.confirmCancelTask = async function () {
        closeModal('cancelModal');
        const ok = await updateTaskStatus('cancelled');
        if (!ok) return;
        showToast("Vazifa bekor qilindi");
        setTimeout(() => {
            window.location.href = myRole === 'poster' ? 'poster.html' : 'vazifa.html';
        }, 1200);
    };

    window.confirmCall = function () {
        closeModal('callModal');
        showToast("Qo'ng'iroq ulanmoqda... 📞");
    };
});
