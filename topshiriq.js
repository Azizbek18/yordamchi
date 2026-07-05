const TOPSHIRIQ_CATEGORY_META = {
    xarid: { label: '🛒 Xarid', color: '#d97706', bg: '#fef3c7' },
    tamirlash: { label: "🔧 Ta'mirlash", color: '#dc2626', bg: '#fee2e2' },
    yetkazish: { label: '🚚 Yetkazish', color: '#1d4ed8', bg: '#dbeafe' },
    tozalash: { label: '🧹 Tozalash', color: '#15803d', bg: '#dcfce7' },
    raqamli: { label: '💻 Raqamli yordam', color: '#6d28d9', bg: '#ede9fe' },
    boshqa: { label: '📦 Boshqa', color: '#374151', bg: '#f3f4f6' }
};

document.addEventListener("DOMContentLoaded", async () => {
    function showToast(text, type = "success") {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text, duration: 3000, gravity: "top", position: "right",
                style: { background: type === "success" ? "#006653" : "#e53e3e" }
            }).showToast();
        }
    }

    function initialsOf(name) {
        return (name || '').trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase() || '?';
    }

    const loadingEl = document.getElementById("detailsLoadingState");
    const contentEl = document.getElementById("detailsContent");

    function showEmpty(text) {
        loadingEl.textContent = text;
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';
    }

    const taskId = new URLSearchParams(window.location.search).get('id');
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (!user || !_supabase) {
        showEmpty("Ma'lumotlarni ko'rish uchun tizimga kiring.");
        return;
    }

    if (!taskId) {
        showEmpty("Topshiriq topilmadi.");
        return;
    }

    const { data: task, error: taskError } = await _supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

    if (taskError || !task) {
        showEmpty("Topshiriqni yuklab bo'lmadi.");
        return;
    }

    const { data: poster } = await _supabase
        .from('profiles')
        .select('first_name, last_name, phone, rating, reviews_count')
        .eq('id', task.poster_id)
        .maybeSingle();

    const posterName = [poster?.first_name, poster?.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    document.getElementById("taskTitle").innerHTML = `${task.title} <span class="icon">📋</span>`;
    document.getElementById("taskPriceBadge").textContent =
        `${Math.round(Number(task.price) || 0).toLocaleString('uz-UZ')} UZS`;
    document.getElementById("taskDescription").textContent = task.description || '';
    document.getElementById("taskLocationChip").textContent = `📍 ${task.district || task.location || "Manzil ko'rsatilmagan"}`;

    const catMeta = TOPSHIRIQ_CATEGORY_META[task.category] || TOPSHIRIQ_CATEGORY_META.boshqa;
    const categoryChip = document.getElementById("taskCategoryChip");
    categoryChip.textContent = catMeta.label;
    categoryChip.style.background = catMeta.bg;
    categoryChip.style.color = catMeta.color;

    document.getElementById("posterAvatar").textContent = initialsOf(posterName);
    document.getElementById("posterName").textContent = posterName;
    document.getElementById("posterMeta").innerHTML =
        `⭐ ${poster?.rating ? Number(poster.rating).toFixed(1) : '—'} <span style="color:#888">(${poster?.reviews_count || 0} ta sharh)</span>`;

    document.getElementById("btnOpenChat").addEventListener("click", () => {
        if (typeof openChatWith === "function") openChatWith(task.poster_id, task.id);
    });

    const priceInput = document.getElementById("offerPriceInput");
    const messageInput = document.getElementById("offerMessageInput");
    const sendBtn = document.getElementById("btnSendOffer");

    const BID_STATUS_LABEL = { pending: 'Yuborilgan ✓', accepted: 'Qabul qilingan ✅', rejected: 'Rad etilgan' };

    function applySentState(bid) {
        priceInput.value = bid.price;
        priceInput.disabled = true;
        messageInput.value = bid.proposal || '';
        messageInput.disabled = true;
        sendBtn.textContent = BID_STATUS_LABEL[bid.status] || 'Yuborilgan ✓';
        sendBtn.disabled = true;
    }

    const { data: existingBid } = await _supabase
        .from('task_bids')
        .select('*')
        .eq('task_id', task.id)
        .eq('helper_id', user.id)
        .maybeSingle();

    if (existingBid) {
        applySentState(existingBid);
    } else {
        priceInput.value = task.price || 0;

        sendBtn.addEventListener("click", async () => {
            if (user.role !== 'helper') {
                showToast('Bu amal faqat Yordamchi roli uchun.', 'error');
                return;
            }

            sendBtn.disabled = true;
            const bidPayload = {
                task_id: task.id,
                helper_id: user.id,
                price: parseFloat(priceInput.value) || 0,
                proposal: messageInput.value.trim() || 'Topshiriqni bajarishga tayyorman',
                status: 'pending'
            };
            const { error } = await _supabase.from('task_bids').insert(bidPayload);

            if (error && !String(error.message).includes('duplicate')) {
                showToast(error.message, 'error');
                sendBtn.disabled = false;
                return;
            }

            const helperName = typeof getUserFullName === "function"
                ? getUserFullName(user)
                : [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Yordamchi';

            const offeredPrice = Math.round(bidPayload.price).toLocaleString('uz-UZ');
            await _supabase.from('notifications').insert({
                user_id: task.poster_id,
                title: 'Yangi taklif!',
                text: `${helperName} "${task.title}" vazifasi uchun ${offeredPrice} so'mga taklif yubordi.`,
                type: 'offer',
                related_id: task.id
            });

            showToast("Taklifingiz yuborildi! ✅");
            applySentState({ ...bidPayload });
        });
    }
});
