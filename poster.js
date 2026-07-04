
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

document.addEventListener("DOMContentLoaded", () => {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : JSON.parse(localStorage.getItem('currentUser') || '{}');

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

    // Task submit trigger
    if (submitCreateTaskBtn) {
        submitCreateTaskBtn.addEventListener("click", () => {
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

            // Save to localStorage
            const customTasks = JSON.parse(localStorage.getItem('poster_tasks_' + user.id) || '[]');
            const newTask = {
                id: 'task_' + Date.now(),
                title: title,
                description: desc,
                category: category,
                budget: parseInt(budget).toLocaleString() + " so'm",
                emoji: getEmojiForCategory(category),
                status: 'pending'
            };

            customTasks.push(newTask);
            localStorage.setItem('poster_tasks_' + user.id, JSON.stringify(customTasks));

            // Save to Supabase jobs table
            if (_supabase) {
                _supabase.from('jobs').insert([{
                    employer_id: user.id,
                    title: title,
                    description: desc,
                    category: mapCategoryToDb(category),
                    budget: parseInt(budget, 10),
                    currency: 'UZS',
                    location: user.city || user.district || user.mahalla || "Yunusobod",
                    status: "open"
                }]).then(({ error }) => {
                    if (error) {
                        console.error("Supabase'ga e'lon yozishda xatolik:", error);
                    } else {
                        console.log("E'lon Supabase'ga muvaffaqiyatli yozildi.");
                    }
                });
            }

            showToast("Yangi topshiriq muvaffaqiyatli e'lon qilindi! 🎉");
            closeTaskModal();
            renderTasks();
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

    // Dynamic tasks rendering and actions re-binding
    function renderTasks() {
        const stack = document.querySelector(".client-tasks-vertical-stack");
        if (!stack) return;

        const customTasks = JSON.parse(localStorage.getItem('poster_tasks_' + user.id) || '[]');
        
        const defaultTasksHtml = `
            <div class="client-task-card" data-task-id="default_1">
                <div class="task-card-main-header">
                    <div class="task-card-title-block">
                        <span class="card-emoji-icon">💊</span>
                        <div>
                            <h4>Dorixonadan dori</h4>
                            <p class="sub-gray">Yaqin atrofdagi OXYmed dan</p>
                        </div>
                    </div>
                    <span class="task-card-price-tag">5 000 so'm</span>
                </div>
                <div class="helper-progress-status-box">
                    <div class="helper-mini-meta">
                        <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80" alt="Jasur">
                        <span class="status-alert-txt"><strong>Jasur qabul qildi</strong> — yo'lda</span>
                        <span class="time-elapsed-txt">4 min avval</span>
                    </div>
                    <div class="custom-progress-track">
                        <div class="progress-fill-line" style="width: 70%;"></div>
                    </div>
                </div>
                <div class="task-card-actions-row">
                    <button class="btn-secondary-outline btn-chat-trigger" data-helper="Jasur">Suhbat</button>
                    <button class="btn-primary-teal btn-complete-trigger">Bajarildi deb belgilash</button>
                </div>
            </div>

            <div class="client-task-card" data-task-id="default_2">
                <div class="task-card-main-header">
                    <div class="task-card-title-block">
                        <span class="card-emoji-icon">🛒</span>
                        <div>
                            <h4>Bozordan xarid</h4>
                            <p class="sub-gray">Moy va un (5kg)</p>
                        </div>
                    </div>
                    <span class="task-card-price-tag">15 000 so'm</span>
                </div>
                <div class="task-card-status-footer">
                    <span class="status-pending-label"><i class="fa-regular fa-clock"></i> Pending — kutilmoqda</span>
                    <button class="btn-danger-link btn-cancel-trigger">Bekor qilish</button>
                </div>
            </div>
        `;

        const customTasksHtml = customTasks.map(t => `
            <div class="client-task-card" data-task-id="${t.id}">
                <div class="task-card-main-header">
                    <div class="task-card-title-block">
                        <span class="card-emoji-icon">${t.emoji}</span>
                        <div>
                            <h4>${t.title}</h4>
                            <p class="sub-gray">${t.description}</p>
                        </div>
                    </div>
                    <span class="task-card-price-tag">${t.budget}</span>
                </div>
                <div class="task-card-status-footer">
                    <span class="status-pending-label"><i class="fa-regular fa-clock"></i> Pending — kutilmoqda</span>
                    <button class="btn-danger-link btn-cancel-trigger">Bekor qilish</button>
                </div>
            </div>
        `).join('');

        stack.innerHTML = customTasksHtml + defaultTasksHtml;
        
        const countPill = document.querySelector(".count-indicator-pill");
        if (countPill) {
            const activeCount = 2 + customTasks.length;
            countPill.textContent = `${activeCount} faol`;
        }

        bindTaskCardActions();
    }

    function bindTaskCardActions() {
        // Complete triggers
        document.querySelectorAll(".btn-complete-trigger").forEach(btn => {
            btn.addEventListener("click", () => {
                const confirmed = confirm("Jasur haqiqatdan ham dorilarni yetkazib berdimi? To'lov uning hamyoniga o'tkaziladi.");
                if (confirmed) {
                    showToast("Muvaffaqiyatli bajarildi! Jasurga pul o'tkazildi. Rahmat! 🎉");
                    const taskCard = btn.closest(".client-task-card");
                    taskCard.style.opacity = "0.5";
                    btn.textContent = "Bajarildi";
                    btn.disabled = true;
                    btn.style.background = "#718096";
                }
            });
        });

        // Cancel triggers
        document.querySelectorAll(".btn-cancel-trigger").forEach(btn => {
            btn.addEventListener("click", () => {
                const confirmed = confirm("Ushbu topshiriqni haqiqatan ham bekor qilmoqchimisiz?");
                if (confirmed) {
                    const taskCard = btn.closest(".client-task-card");
                    const taskId = taskCard.dataset.taskId;
                    
                    if (taskId.startsWith("default_")) {
                        taskCard.remove();
                    } else {
                        let customTasks = JSON.parse(localStorage.getItem('poster_tasks_' + user.id) || '[]');
                        customTasks = customTasks.filter(t => t.id !== taskId);
                        localStorage.setItem('poster_tasks_' + user.id, JSON.stringify(customTasks));
                        renderTasks();
                    }
                    showToast("Topshiriq muvaffaqiyatli bekor qilindi.", "success");
                }
            });
        });

        // Chat triggers
        document.querySelectorAll(".btn-chat-trigger").forEach(btn => {
            btn.addEventListener("click", () => {
                const name = btn.dataset.helper || "Jasur";
                showToast(`${name} bilan shaxsiy suhbat oynasi ochilmoqda...`);
            });
        });
    }

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

    // Sidebar quick offer buttons (paper plane icon)
    const sendOfferButtons = document.querySelectorAll(".btn-circle-send-offer");
    sendOfferButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const helperRow = e.target.closest(".helper-row-item");
            const helperName = helperRow.querySelector("h5").textContent.trim();

            showToast(`${helperName}ga topshiriq taklifi yuborildi! ✉️`);
            addNotificationForHelper(helperName, "Ishga taklif", `Sizni yangi topshiriqqa taklif qilishdi. Haq: 30,000 so'm.`);
            
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
    renderTasks();
});

// Global Chat function (for fallback inline call)
function openChatWithHelper(helperName) {
    showToast(`${helperName} bilan shaxsiy suhbat oynasi ochilmoqda...`);
}
