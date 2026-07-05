
function showToast(text, type = "success") {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: type === "success" ? "#006653" : "#e53e3e",
            }
        }).showToast();
    }
}

const POSTER_CATEGORY_EMOJI = {
    xarid: '🛒', tamirlash: '🔧', yetkazish: '🚚', tozalash: '🧹', raqamli: '💻', boshqa: '✨'
};

const POSTER_STATUS_LABEL = {
    published: "E'lon qilingan", assigned: 'Bajaruvchi tasdiqlandi', on_the_way: "Yo'lda",
    arrived: 'Manzilga yetib keldi', started: 'Ish boshlandi', completed: 'Yakunlandi', cancelled: 'Bekor qilingan'
};

const POSTER_ACTIVE_STATUSES = ['published', 'assigned', 'on_the_way', 'arrived', 'started'];

function posterFormatSom(amount) {
    return Math.round(Number(amount) || 0).toLocaleString('uz-UZ');
}

function posterTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hozirgina';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} soat oldin`;
    return `${Math.floor(hours / 24)} kun oldin`;
}

function posterInitials(name) {
    return (name || '').trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase() || '?';
}

function isTaskSchemaMismatch(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === '42703' || message.includes('column') || message.includes('schema cache');
}

document.addEventListener("DOMContentLoaded", () => {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : JSON.parse(localStorage.getItem('currentUser') || '{}');

    const greetingEl = document.getElementById("posterGreeting");
    if (greetingEl) {
        const fullName = typeof getUserFullName === "function" ? getUserFullName(user) : (user.first_name || "Foydalanuvchi");
        greetingEl.textContent = `Salom, ${fullName.split(" ")[0]}! 👋`;
    }

    // UI elements
    const taskModalOverlay = document.getElementById("taskModalOverlay");
    const openTaskModalBtn = document.getElementById("open-task-modal");
    const closeTaskModalBtn = document.getElementById("closeTaskModalBtn");
    const cancelCreateTaskBtn = document.getElementById("cancelCreateTaskBtn");
    const submitCreateTaskBtn = document.getElementById("submitCreateTaskBtn");

    const taskTitleInput = document.getElementById("taskTitle");
    const taskCategorySelect = document.getElementById("taskCategory");
    const taskDescInput = document.getElementById("taskDesc");
    const taskBudgetInput = document.getElementById("taskBudget");

    // Modal control functions
    function openTaskModal(preSelectedCategory = "") {
        clearErrors();
        taskTitleInput.value = "";
        taskDescInput.value = "";
        taskBudgetInput.value = "";

        if (preSelectedCategory) {
            taskCategorySelect.value = preSelectedCategory;
        } else {
            taskCategorySelect.value = "Boshqa";
        }

        taskModalOverlay.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function closeTaskModal() {
        taskModalOverlay.style.display = "none";
        document.body.style.overflow = "";
    }

    function clearErrors() {
        ["taskTitleError", "taskDescError", "taskBudgetError"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "";
        });
        [taskTitleInput, taskDescInput, taskBudgetInput].forEach(el => {
            if (el) el.classList.remove("input-error");
        });
    }

    // Bind modal triggers
    if (openTaskModalBtn) {
        openTaskModalBtn.addEventListener("click", () => openTaskModal());
    }
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener("click", closeTaskModal);
    }
    if (cancelCreateTaskBtn) {
        cancelCreateTaskBtn.addEventListener("click", closeTaskModal);
    }
    if (taskModalOverlay) {
        taskModalOverlay.addEventListener("click", (e) => {
            if (e.target === taskModalOverlay) closeTaskModal();
        });
    }

    // Bind Category pills click triggers (Tezkor yordam)
    const pills = document.querySelectorAll(".category-item-pill");
    pills.forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.addEventListener("click", () => {
            const categoryName = pill.querySelector("span").textContent.trim();
            // Pre-select mapped category
            let mapped = "Boshqa";
            if (categoryName === "Bozorlik") mapped = "Bozorlik";
            else if (categoryName === "Dorixona") mapped = "Dorixona";
            else if (categoryName === "Tozalash") mapped = "Tozalash";
            else if (categoryName === "Usta") mapped = "Usta";
            else if (categoryName === "Yuk tashish") mapped = "Yuk tashish";
            else if (categoryName === "Boshqa") mapped = "Boshqa";

            openTaskModal(mapped);
        });
    });

    function mapCategoryToDb(cat) {
        switch (cat) {
            case 'Bozorlik': return 'xarid';
            case 'Dorixona': return 'xarid';
            case 'Tozalash': return 'tozalash';
            case 'Usta': return 'tamirlash';
            case 'Yuk tashish': return 'yetkazish';
            default: return 'boshqa';
        }
    }

    // Task submit trigger
    if (submitCreateTaskBtn) {
        submitCreateTaskBtn.addEventListener("click", async () => {
            clearErrors();

            const title = taskTitleInput.value.trim();
            const category = taskCategorySelect.value;
            const desc = taskDescInput.value.trim();
            const budget = taskBudgetInput.value.trim();

            let valid = true;
            function setErr(id, el, msg) {
                const errEl = document.getElementById(id);
                if (errEl) errEl.textContent = msg;
                if (msg) {
                    valid = false;
                    el.classList.add("input-error");
                }
            }

            setErr("taskTitleError", taskTitleInput, !title ? "Topshiriq sarlavhasini kiriting" : "");
            setErr("taskDescError", taskDescInput, !desc ? "Tavsif yoki manzilni batafsil yozing" : "");
            setErr("taskBudgetError", taskBudgetInput, !budget ? "Taklif qilayotgan haqni kiriting" : "");

            if (!valid) return;

            // Save to Supabase tasks table
            let savedToSupabase = false;
            if (_supabase) {
                const fullTaskPayload = {
                    poster_id: user.id,
                    title: title,
                    description: desc,
                    category: mapCategoryToDb(category),
                    price: parseInt(budget, 10),
                    location: user.city || user.district || user.mahalla || "Yunusobod",
                    district: user.district || user.city || user.mahalla || "Yunusobod",
                    status: "published"
                };
                const minimalTaskPayload = {
                    title: fullTaskPayload.title,
                    description: fullTaskPayload.description,
                    category: fullTaskPayload.category,
                    price: fullTaskPayload.price,
                    location: fullTaskPayload.location,
                    distance: 0
                };

                const { error } = await _supabase.from('tasks').insert([fullTaskPayload]);
                if (!error) {
                    savedToSupabase = true;
                } else if (isTaskSchemaMismatch(error)) {
                    const fallback = await _supabase.from('tasks').insert([minimalTaskPayload]);
                    savedToSupabase = !fallback.error;
                    if (fallback.error) console.error("Supabase'ga minimal e'lon yozishda xatolik:", fallback.error);
                } else {
                    console.error("Supabase'ga e'lon yozishda xatolik:", error);
                }
            }

            if (!savedToSupabase) {
                showToast("Topshiriqni saqlab bo'lmadi. SQL jadval ustunlarini tekshiring.", "error");
                return;
            }

            showToast("Yangi topshiriq muvaffaqiyatli e'lon qilindi! 🎉");
            closeTaskModal();
            loadTasks();
        });
    }

    function getEmojiForCategory(category) {
        switch(category) {
            case 'Bozorlik': return '🛒';
            case 'Dorixona': return '💊';
            case 'Tozalash': return '🧹';
            case 'Usta': return '🔧';
            case 'Yuk tashish': return '🚚';
            default: return '✨';
        }
    }

    function renderBidRow(bid, helperProfile) {
        const helperName = [helperProfile?.first_name, helperProfile?.last_name].filter(Boolean).join(' ') || 'Yordamchi';
        return `
            <div class="helper-progress-status-box" data-bid-id="${bid.id}">
                <div class="helper-mini-meta">
                    <span style="width:24px;height:24px;border-radius:50%;background:#e6f7f2;color:#006653;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${posterInitials(helperName)}</span>
                    <span class="status-alert-txt"><strong>${helperName}</strong> — ${posterFormatSom(bid.price)} so'm taklif qildi ${helperProfile?.rating ? `(⭐ ${Number(helperProfile.rating).toFixed(1)})` : ''}</span>
                    <span class="time-elapsed-txt">${posterTimeAgo(bid.created_at)}</span>
                </div>
                ${bid.proposal ? `<p class="sub-gray" style="margin:0 0 10px;">${bid.proposal}</p>` : ''}
                <div class="task-card-actions-row">
                    <button class="btn-secondary-outline btn-reject-bid" data-bid-id="${bid.id}">Rad etish</button>
                    <button class="btn-primary-teal btn-accept-bid" data-bid-id="${bid.id}" data-helper-id="${bid.helper_id}" data-task-id="${bid.task_id}">Qabul qilish</button>
                </div>
            </div>
        `;
    }

    function renderTaskCard(t, bids, profileMap) {
        const emoji = POSTER_CATEGORY_EMOJI[t.category] || '✨';
        const header = `
            <div class="task-card-main-header">
                <div class="task-card-title-block">
                    <span class="card-emoji-icon">${emoji}</span>
                    <div>
                        <h4>${t.title}</h4>
                        <p class="sub-gray">${t.description || ''}</p>
                    </div>
                </div>
                <span class="task-card-price-tag">${posterFormatSom(t.price)} so'm</span>
            </div>
        `;

        const cancelBtn = `<button class="btn-danger-link btn-cancel-trigger" data-task-id="${t.id}" ${t.helper_id ? `data-helper-id="${t.helper_id}"` : ''}>Bekor qilish</button>`;

        let body = '';
        if (t.status === 'published') {
            const bidsHtml = bids.length > 0 ? bids.map(bid => renderBidRow(bid, profileMap[bid.helper_id])).join('') : '';
            body = `
                ${bidsHtml}
                <div class="task-card-status-footer">
                    <span class="status-pending-label"><i class="fa-regular fa-clock"></i> ${bids.length === 0 ? "Hali takliflar yo'q" : `${bids.length} ta taklif`}</span>
                    ${cancelBtn}
                </div>
            `;
        } else if (['assigned', 'on_the_way', 'arrived', 'started'].includes(t.status)) {
            const helperProfile = profileMap[t.helper_id];
            const helperName = [helperProfile?.first_name, helperProfile?.last_name].filter(Boolean).join(' ') || 'Yordamchi';
            body = `
                <div class="helper-progress-status-box">
                    <div class="helper-mini-meta">
                        <span style="width:24px;height:24px;border-radius:50%;background:#e6f7f2;color:#006653;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${posterInitials(helperName)}</span>
                        <span class="status-alert-txt"><strong>${helperName}</strong> — ${POSTER_STATUS_LABEL[t.status] || t.status}</span>
                    </div>
                </div>
                <div class="task-card-actions-row">
                    <button class="btn-secondary-outline btn-chat-trigger" data-helper-id="${t.helper_id}" data-task-id="${t.id}">Suhbat</button>
                    <a class="btn-primary-teal" style="text-decoration:none;display:inline-block;" href="kuzatish.html?id=${t.id}">Kuzatish</a>
                </div>
                <div class="task-card-status-footer">
                    <span class="status-pending-label">&nbsp;</span>
                    ${cancelBtn}
                </div>
            `;
        } else {
            body = `
                <div class="task-card-status-footer">
                    <span class="status-pending-label">${POSTER_STATUS_LABEL[t.status] || t.status}</span>
                </div>
            `;
        }

        return `<div class="client-task-card" data-task-id="${t.id}">${header}${body}</div>`;
    }

    async function loadTasks() {
        const stack = document.querySelector(".client-tasks-vertical-stack");
        const countPill = document.querySelector(".count-indicator-pill");
        if (!stack) return;

        if (!user || !_supabase) {
            stack.innerHTML = `<p class="tasks-empty-state">Topshiriqlarni ko'rish uchun tizimga kiring.</p>`;
            return;
        }

        const { data: tasks, error } = await _supabase
            .from('tasks')
            .select('*')
            .eq('poster_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            stack.innerHTML = `<p class="tasks-empty-state">Topshiriqlarni yuklab bo'lmadi: ${error.message}</p>`;
            return;
        }

        if (!tasks || tasks.length === 0) {
            stack.innerHTML = `<p class="tasks-empty-state">Hozircha topshiriq e'lon qilmadingiz.</p>`;
            if (countPill) countPill.textContent = "0 faol";
            return;
        }

        if (countPill) {
            const activeCount = tasks.filter(t => POSTER_ACTIVE_STATUSES.includes(t.status)).length;
            countPill.textContent = `${activeCount} faol`;
        }

        // Bekor qilingan topshiriqlar ro'yxatdan butunlay yashiriladi
        const visibleTasks = tasks.filter(t => t.status !== 'cancelled');
        if (visibleTasks.length === 0) {
            stack.innerHTML = `<p class="tasks-empty-state">Hozircha faol topshiriq yo'q.</p>`;
            return;
        }

        const publishedTaskIds = visibleTasks.filter(t => t.status === 'published').map(t => t.id);
        let bids = [];
        if (publishedTaskIds.length > 0) {
            const { data: bidRows } = await _supabase
                .from('task_bids')
                .select('*')
                .in('task_id', publishedTaskIds)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            bids = bidRows || [];
        }

        const helperIds = [...new Set([
            ...bids.map(b => b.helper_id),
            ...visibleTasks.filter(t => t.helper_id).map(t => t.helper_id)
        ])];

        let profileMap = {};
        if (helperIds.length > 0) {
            const { data: profiles } = await _supabase
                .from('profiles')
                .select('id, first_name, last_name, rating, reviews_count')
                .in('id', helperIds);
            (profiles || []).forEach(p => { profileMap[p.id] = p; });
        }

        stack.innerHTML = visibleTasks.map(t => renderTaskCard(t, bids.filter(b => b.task_id === t.id), profileMap)).join('');

        bindTaskCardActions();
    }

    function bindTaskCardActions() {
        // Accept bid
        document.querySelectorAll(".btn-accept-bid").forEach(btn => {
            btn.addEventListener("click", async () => {
                const bidId = btn.dataset.bidId;
                const helperId = btn.dataset.helperId;
                const taskId = btn.dataset.taskId;
                if (!confirm("Ushbu yordamchining taklifini qabul qilmoqchimisiz?")) return;

                btn.disabled = true;

                const { error: taskErr } = await _supabase.from('tasks')
                    .update({ status: 'assigned', helper_id: helperId })
                    .eq('id', taskId);
                if (taskErr) {
                    showToast(taskErr.message, "error");
                    btn.disabled = false;
                    return;
                }

                await _supabase.from('task_bids').update({ status: 'accepted' }).eq('id', bidId);
                await _supabase.from('task_bids').update({ status: 'rejected' }).eq('task_id', taskId).neq('id', bidId);

                await _supabase.from('notifications').insert({
                    user_id: helperId,
                    title: 'Taklifingiz qabul qilindi!',
                    text: "Buyurtmachi taklifingizni qabul qildi. Vazifani bajarishni boshlashingiz mumkin.",
                    type: 'offer',
                    related_id: taskId
                });

                showToast("Taklif qabul qilindi. Yordamchiga xabar berildi.");
                loadTasks();
            });
        });

        // Reject bid
        document.querySelectorAll(".btn-reject-bid").forEach(btn => {
            btn.addEventListener("click", async () => {
                const bidId = btn.dataset.bidId;
                btn.disabled = true;
                const { error } = await _supabase.from('task_bids').update({ status: 'rejected' }).eq('id', bidId);
                if (error) {
                    showToast(error.message, "error");
                    btn.disabled = false;
                    return;
                }
                showToast("Taklif rad etildi.");
                loadTasks();
            });
        });

        // Cancel task
        document.querySelectorAll(".btn-cancel-trigger").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("Ushbu topshiriqni haqiqatan ham bekor qilmoqchimisiz?")) return;
                btn.disabled = true;
                const taskId = btn.dataset.taskId;
                const helperId = btn.dataset.helperId;
                const { error } = await _supabase.from('tasks').update({ status: 'cancelled' }).eq('id', taskId);
                if (error) {
                    showToast(error.message, "error");
                    btn.disabled = false;
                    return;
                }

                await _supabase.from('task_bids').update({ status: 'rejected' }).eq('task_id', taskId).eq('status', 'pending');

                if (helperId) {
                    await _supabase.from('notifications').insert({
                        user_id: helperId,
                        title: 'Topshiriq bekor qilindi',
                        text: 'Buyurtmachi vazifani bekor qildi.',
                        type: 'status',
                        related_id: taskId
                    });
                }

                showToast("Topshiriq muvaffaqiyatli bekor qilindi.");
                loadTasks();
            });
        });

        // Chat triggers
        document.querySelectorAll(".btn-chat-trigger").forEach(btn => {
            btn.addEventListener("click", () => {
                const helperId = btn.dataset.helperId;
                const taskId = btn.dataset.taskId;
                if (helperId && typeof openChatWith === "function") {
                    openChatWith(helperId, taskId);
                } else {
                    window.location.href = "chatlar.html";
                }
            });
        });
    }

    // Sidebar quick offer buttons (paper plane icon) — invite a specific helper to chat
    const sendOfferButtons = document.querySelectorAll(".btn-circle-send-offer");
    sendOfferButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const helperRow = e.target.closest(".helper-row-item");
            const helperName = helperRow.querySelector("h5").textContent.trim();

            showToast(`${helperName}ga topshiriq taklifi yuborildi! ✉️`);

            button.innerHTML = "<i class='fas fa-check'></i>";
            button.style.background = "#00796b";
            button.style.color = "white";
        });
    });

    // Map button
    const mapBtn = document.querySelector(".btn-view-map-full");
    if (mapBtn) {
        mapBtn.addEventListener("click", () => {
            showToast("To'liq xarita rejimi yuklanmoqda...");
            setTimeout(() => {
                window.location.href = "map.html";
            }, 1000);
        });
    }

    // Initial load
    loadTasks();
});

// Global Chat function (for fallback inline call)
function openChatWithHelper(helperName) {
    showToast(`${helperName} bilan shaxsiy suhbat oynasi ochilmoqda...`);
    setTimeout(() => {
        window.location.href = "chatlar.html";
    }, 450);
}
