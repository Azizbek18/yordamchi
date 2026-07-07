
function showNotifToast(text, type = "success") {
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

const NOTIF_TYPE_META = {
    offer: { icon: 'fa-handshake', badge: 'bg-teal', actionLabel: "Ko'rish", actionClass: 'btn-filled', hrefBase: 'topshiriq.html?id=' },
    status: { icon: 'fa-circle-check', badge: 'bg-green', actionLabel: 'Tafsilotlar', actionClass: 'btn-light-gray', hrefBase: 'topshiriq.html?id=' },
    chat: { icon: 'fa-comment-dots', badge: 'bg-teal', actionLabel: "Suhbatga o'tish", actionClass: 'btn-light-teal', href: 'chatlar.html' },
    system: { icon: 'fa-shield-halved', badge: 'bg-light-red', actionLabel: "Batafsil", actionClass: 'btn-red' }
};

function formatNotifTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function groupNotificationsByDay(items) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Bugun: [], Kecha: [], Oldinroq: [] };
    items.forEach(n => {
        const created = new Date(n.created_at);
        const createdDay = new Date(created);
        createdDay.setHours(0, 0, 0, 0);

        if (createdDay.getTime() === today.getTime()) groups.Bugun.push(n);
        else if (createdDay.getTime() === yesterday.getTime()) groups.Kecha.push(n);
        else groups.Oldinroq.push(n);
    });
    return groups;
}

function renderNotificationCard(n) {
    const meta = NOTIF_TYPE_META[n.type] || NOTIF_TYPE_META.system;
    const href = meta.href || (meta.hrefBase && n.related_id ? `${meta.hrefBase}${n.related_id}` : null);
    const hrefAttr = href ? ` data-href="${href}"` : '';
    return `
        <div class="notification-card ${n.is_read ? '' : 'unread'}" data-type="${n.type}" data-id="${n.id}">
            <div class="notif-icon-box ${meta.badge}"><i class="fa-solid ${meta.icon}"></i></div>
            <div class="notif-content">
                <div class="notif-header">
                    <h3>${escapeAttr(n.title)}</h3>
                    <span class="notif-time">${formatNotifTime(n.created_at)}</span>
                </div>
                <p class="notif-text">${escapeAttr(n.text)}</p>
                <div class="notif-actions">
                    <button class="btn-action ${meta.actionClass}" data-id="${n.id}"${hrefAttr}>${meta.actionLabel}</button>
                </div>
            </div>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", async () => {
    const wrapper = document.getElementById("notificationsWrapper");
    const tabButtons = document.querySelectorAll(".tab-btn");
    if (!wrapper) return;

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (!user || !_supabase) {
        wrapper.innerHTML = `<p class="notif-empty-state">Bildirishnomalarni ko'rish uchun tizimga kiring.</p>`;
        return;
    }

    const { data: notifications, error } = await _supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        wrapper.innerHTML = `<p class="notif-empty-state">Bildirishnomalarni yuklab bo'lmadi: ${error.message}</p>`;
        return;
    }

    if (!notifications || notifications.length === 0) {
        wrapper.innerHTML = `<p class="notif-empty-state">Hozircha bildirishnomalar yo'q.</p>`;
        return;
    }

    const groups = groupNotificationsByDay(notifications);
    wrapper.innerHTML = Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => `
            <div class="time-group">
                <h2 class="group-label">${label}</h2>
                ${items.map(renderNotificationCard).join('')}
            </div>
        `).join('');

    async function markAsRead(id) {
        const card = wrapper.querySelector(`.notification-card[data-id="${id}"]`);
        card?.classList.remove('unread');
        await _supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }

    wrapper.querySelectorAll(".notification-card").forEach(card => {
        card.addEventListener("click", () => {
            if (card.classList.contains("unread")) markAsRead(card.dataset.id);
        });
    });

    wrapper.querySelectorAll(".btn-action").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            markAsRead(btn.dataset.id);
            if (btn.dataset.href) {
                window.location.href = btn.dataset.href;
            } else {
                showNotifToast(`"${btn.textContent.trim()}" harakati bajarilmoqda...`);
            }
        });
    });

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            const filterValue = button.getAttribute("data-filter");

            wrapper.querySelectorAll(".notification-card").forEach(card => {
                const cardType = card.getAttribute("data-type");
                const isUnread = card.classList.contains("unread");
                const show = filterValue === "all"
                    || (filterValue === "unread" && isUnread)
                    || cardType === filterValue;
                card.style.display = show ? "flex" : "none";
            });

            wrapper.querySelectorAll(".time-group").forEach(group => {
                const visible = Array.from(group.querySelectorAll(".notification-card")).some(c => c.style.display !== "none");
                group.style.display = visible ? "block" : "none";
            });
        });
    });
});
