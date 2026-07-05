
function showToast(text, type = "success") {
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

const HELPER_CATEGORY_META = {
    xarid: { tag: 'shopping', icon: 'fa-basket-shopping', label: 'Xarid' },
    tamirlash: { tag: 'urgent', icon: 'fa-wrench', label: "Ta'mirlash" },
    yetkazish: { tag: 'education', icon: 'fa-truck', label: 'Yetkazish' },
    tozalash: { tag: 'cleaning', icon: 'fa-broom', label: 'Tozalash' },
    raqamli: { tag: 'education', icon: 'fa-laptop', label: 'Raqamli yordam' },
    boshqa: { tag: 'shopping', icon: 'fa-ellipsis', label: 'Boshqa' }
};

function helperFormatSom(amount) {
    return Math.round(Number(amount) || 0).toLocaleString('uz-UZ');
}

function helperTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Hozirgina";
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} soat oldin`;
    return `${Math.floor(hours / 24)} kun oldin`;
}

function renderHelperTaskCard(t) {
    const meta = HELPER_CATEGORY_META[t.category] || HELPER_CATEGORY_META.boshqa;
    const isUrgent = meta.tag === 'urgent';
    return `
        <div class="task-card ${isUrgent ? 'border-red' : 'border-green'}" data-category="${t.category}" data-task-id="${t.id}">
            <div class="card-header">
                <span class="category-tag ${meta.tag}"><i class="fas ${meta.icon}"></i> ${meta.label}</span>
                <span class="price-tag ${isUrgent ? 'red' : 'green'}">${helperFormatSom(t.price)} so'm</span>
            </div>
            <h3>${t.title}</h3>
            <p>${t.description || ''}</p>
            <div class="card-footer">
                <span><i class="fas fa-map-marker-alt"></i> ${t.district || t.location || 'Manzil noma\'lum'}</span>
                <button class="accept-btn ${isUrgent ? '' : 'green-btn'}" data-task-id="${t.id}" data-price="${t.price || 0}" data-title="${t.title}">Qabul qilish</button>
            </div>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", async () => {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    const welcomeHeading = document.querySelector(".welcome h3");
    if (welcomeHeading && user) {
        welcomeHeading.textContent = `Xush kelibsiz, ${user.first_name || user.firstName || 'do\'st'}!`;
    }

    // ── Faollik statusi (Active/Inactive) ──
    const statusCheckbox = document.getElementById("status-checkbox");
    const statusText = document.getElementById("status-text");
    if (statusCheckbox) {
        statusCheckbox.addEventListener("change", () => {
            const label = statusCheckbox.checked ? "Active" : "Inactive";
            if (statusText) {
                statusText.textContent = label;
                statusText.style.color = statusCheckbox.checked ? "#00796b" : "#e65100";
            }
            const statActivity = document.getElementById("statActivity");
            const mStatActivity = document.getElementById("mStatActivity");
            if (statActivity) statActivity.textContent = label;
            if (mStatActivity) mStatActivity.textContent = label;
        });
    }

    const cardsGrid = document.getElementById("taskCardsGrid");

    if (!user || !_supabase) {
        if (cardsGrid) cardsGrid.innerHTML = `<p class="tasks-empty-state">Topshiriqlarni ko'rish uchun tizimga kiring.</p>`;
        return;
    }

    // ── Bugungi va shu oygi statistikalar ──
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [{ data: profileRow }, { count: doneCount }, { count: cancelledCount }, { data: myTransactions }] = await Promise.all([
        _supabase.from('profiles').select('rating, reviews_count').eq('id', user.id).maybeSingle(),
        _supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('helper_id', user.id).eq('status', 'completed'),
        _supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('helper_id', user.id).eq('status', 'cancelled'),
        _supabase.from('transactions').select('amount, created_at').eq('user_id', user.id).eq('type', 'payment_release')
    ]);

    let todayTotal = 0, monthTotal = 0, todayCompleted = 0;
    (myTransactions || []).forEach(tx => {
        const created = new Date(tx.created_at);
        if (created >= monthStart) monthTotal += Number(tx.amount);
        if (created >= todayStart) { todayTotal += Number(tx.amount); todayCompleted++; }
    });

    document.getElementById("today-earnings").textContent = helperFormatSom(todayTotal);
    document.getElementById("todayCompletedNote").textContent = `${todayCompleted} ta topshiriq bajarildi`;
    document.getElementById("mStatMonth").textContent = helperFormatSom(monthTotal) + " so'm";

    const ratingLabel = profileRow?.rating ? Number(profileRow.rating).toFixed(1) : '—';
    document.getElementById("statDone").textContent = doneCount || 0;
    document.getElementById("statCancelled").textContent = cancelledCount || 0;
    document.getElementById("statRating").innerHTML = `${ratingLabel} <i class="fas fa-star star"></i>`;
    document.getElementById("mStatDone").textContent = doneCount || 0;
    document.getElementById("mStatCancelled").textContent = cancelledCount || 0;
    document.getElementById("mStatRating").textContent = `${ratingLabel} ⭐`;

    // ── Mavjud topshiriqlar ──
    const { data: availableTasks, error } = await _supabase
        .from('tasks')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(12);

    function renderCards(tasks) {
        if (!tasks || tasks.length === 0) {
            cardsGrid.innerHTML = `<p class="tasks-empty-state">Hozircha mos topshiriqlar topilmadi.</p>`;
            return;
        }
        cardsGrid.innerHTML = tasks.map(renderHelperTaskCard).join('');

        cardsGrid.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                const { error: bidError } = await _supabase.from('task_bids').insert({
                    task_id: btn.dataset.taskId,
                    helper_id: user.id,
                    price: parseFloat(btn.dataset.price) || 0,
                    proposal: 'Topshiriqni bajarishga tayyorman',
                    status: 'pending'
                });
                if (bidError && !String(bidError.message).includes('duplicate')) {
                    showToast(bidError.message, "error");
                    btn.disabled = false;
                    return;
                }
                showToast(`"${btn.dataset.title}" uchun arizangiz yuborildi.`);
                btn.textContent = "Ariza yuborildi";
            });
        });
    }

    let allTasks = [];
    if (error) {
        cardsGrid.innerHTML = `<p class="tasks-empty-state">Topshiriqlarni yuklab bo'lmadi: ${error.message}</p>`;
    } else {
        allTasks = availableTasks || [];
        renderCards(allTasks);
    }

    // ── Filtr tablari ──
    document.querySelectorAll(".filter-tabs .tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".filter-tabs .tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const cat = tab.dataset.category;
            renderCards(cat ? allTasks.filter(t => t.category === cat) : allTasks);
        });
    });

    // ── Tezkor topshiriqlar (o'ng panel) ──
    const quickIcons = { xarid: ['fa-basket-shopping', 'orange'], tamirlash: ['fa-wrench', 'teal'], yetkazish: ['fa-motorcycle', 'orange'], tozalash: ['fa-broom', 'green'], raqamli: ['fa-laptop', 'teal'], boshqa: ['fa-ellipsis', 'green'] };
    const quickTasksContainer = document.querySelector(".quick-tasks");
    if (quickTasksContainer) {
        const quickItemsHtml = allTasks.slice(0, 3).map(t => {
            const [icon, color] = quickIcons[t.category] || quickIcons.boshqa;
            return `
                <div class="quick-item">
                    <div class="quick-icon ${color}"><i class="fas ${icon}"></i></div>
                    <div class="quick-details">
                        <h5>${t.title}</h5>
                        <p>${helperTimeAgo(t.created_at)} • ${t.district || ''}</p>
                    </div>
                    <span class="quick-price">${Math.round((t.price || 0) / 1000)}k</span>
                </div>
            `;
        }).join('') || `<p class="tasks-empty-state" style="padding:12px 0;">Hozircha yo'q</p>`;

        quickTasksContainer.querySelectorAll('.quick-item').forEach(el => el.remove());
        document.querySelector(".view-all-offers")?.insertAdjacentHTML('beforebegin', quickItemsHtml);
    }

    // ── Tugmalar ──
    document.querySelector(".view-report-btn")?.addEventListener("click", () => {
        window.location.href = "daromad.html";
    });

    document.querySelector(".view-all-offers")?.addEventListener("click", () => {
        window.location.href = "vazifa.html";
    });
});
