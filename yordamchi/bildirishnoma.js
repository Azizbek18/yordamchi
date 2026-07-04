
document.addEventListener("DOMContentLoaded", () => {
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

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const helperName = currentUser.first_name || "Abbos"; // Default to Abbos for mock/preview purposes

    // ── Load Custom Helper Notifications ───────────────────────
    const customNotifs = JSON.parse(localStorage.getItem(`notifications_${helperName}`) || '[]');
    const wrapper = document.querySelector(".notifications-wrapper");

    if (wrapper && customNotifs.length > 0) {
        let bugunGroup = wrapper.querySelector(".time-group");
        if (!bugunGroup) {
            bugunGroup = document.createElement("div");
            bugunGroup.className = "time-group";
            bugunGroup.innerHTML = `<h2 class="group-label">Bugun</h2>`;
            wrapper.insertBefore(bugunGroup, wrapper.firstChild);
        }

        // Render prepended custom notification cards
        customNotifs.forEach(n => {
            const card = document.createElement("div");
            card.className = `notification-card ${n.unread ? 'unread' : ''}`;
            card.setAttribute("data-type", n.type);
            card.setAttribute("data-id", n.id);
            card.innerHTML = `
                <div class="notif-icon-box bg-teal"><i class="fa-regular fa-bell"></i></div>
                <div class="notif-content">
                    <div class="notif-header">
                        <h3>${n.title}</h3>
                        <span class="notif-time">${n.time}</span>
                    </div>
                    <p class="notif-text">${n.text}</p>
                    <div class="notif-actions">
                        <button class="btn-action btn-filled btn-accept-offer" data-id="${n.id}">Qabul qilish</button>
                        <button class="btn-action btn-outlined btn-decline-offer" data-id="${n.id}">Rad etish</button>
                    </div>
                </div>
            `;
            bugunGroup.insertBefore(card, bugunGroup.children[1]);
        });
    }

    // ── Filter Notifications ─────────────────────────────────
    const tabButtons = document.querySelectorAll(".tab-btn");
    const notifCards = document.querySelectorAll(".notification-card");
    const loadMoreBtn = document.querySelector(".btn-load-more");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const filterValue = button.getAttribute("data-filter");

            document.querySelectorAll(".notification-card").forEach(card => {
                const cardType = card.getAttribute("data-type");
                const isUnread = card.classList.contains("unread");

                if (filterValue === "all") {
                    card.style.display = "flex";
                } else if (filterValue === "unread") {
                    if (isUnread) card.style.display = "flex";
                    else card.style.display = "none";
                } else {
                    if (cardType === filterValue) card.style.display = "flex";
                    else card.style.display = "none";
                }
            });

            document.querySelectorAll(".time-group").forEach(group => {
                const visibleCards = group.querySelectorAll(".notification-card[style*='display: flex'], .notification-card:not([style*='display: none'])");
                if (visibleCards.length === 0) {
                    group.style.display = "none";
                } else {
                    group.style.display = "block";
                }
            });
        });
    });

    // ── Bind Custom Invitation Buttons ───────────────────────
    document.querySelectorAll(".btn-accept-offer").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            showToast("Taklif qabul qilindi! Buyurtmachi bilan suhbat ochildi. ✅");
            const card = btn.closest(".notification-card");
            card.style.opacity = "0.6";
            btn.disabled = true;
            btn.textContent = "Qabul qilindi";
            card.querySelector(".btn-decline-offer")?.remove();
            
            // Mark read in local storage
            markAsRead(btn.dataset.id);
        });
    });

    document.querySelectorAll(".btn-decline-offer").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            showToast("Taklif rad etildi.");
            const card = btn.closest(".notification-card");
            card.style.opacity = "0.5";
            btn.disabled = true;
            btn.textContent = "Rad etildi";
            card.querySelector(".btn-accept-offer")?.remove();
            
            // Mark read in local storage
            markAsRead(btn.dataset.id);
        });
    });

    function markAsRead(id) {
        let list = JSON.parse(localStorage.getItem(`notifications_${helperName}`) || '[]');
        list = list.map(n => n.id === id ? { ...n, unread: false } : n);
        localStorage.setItem(`notifications_${helperName}`, JSON.stringify(list));
    }

    // ── Bind Default Notification Card Actions ───────────────
    notifCards.forEach(card => {
        const actionButtons = card.querySelectorAll(".btn-action:not(.btn-accept-offer):not(.btn-decline-offer)");

        actionButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const actionText = btn.textContent.trim();

                if (actionText === "Yashirish") {
                    card.style.opacity = "0";
                    setTimeout(() => card.remove(), 300);
                } else {
                    showToast(`"${actionText}" harakati bajarilmoqda...`);

                    if (card.classList.contains("unread")) {
                        card.classList.remove("unread");
                    }
                }
            });
        });

        card.addEventListener("click", () => {
            if (card.classList.contains("unread")) {
                card.classList.remove("unread");
                
                const customId = card.getAttribute("data-id");
                if (customId) {
                    markAsRead(customId);
                }
            }
        });
    });

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            showToast("Arxivdagi eski bildirishnomalar yuklanmoqda...");
        });
    }
});
