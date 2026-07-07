
const CATEGORY_LABELS = {
    odobsizlik: "Odobsizlik",
    tolov: "To'lov muammosi",
    firibgarlik: "Firibgarlik",
    boshqa: "Boshqa"
};

const DISPUTE_STATUS_LABELS = {
    open: "Ko'rib chiqilmoqda",
    under_review: "Tekshirilmoqda",
    resolved: "Hal qilindi",
    closed: "Yopilgan"
};

function showMuammoToast(text, type = "success") {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: { background: type === "success" ? "#006653" : "#e53e3e" }
        }).showToast();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const categoryCards = document.querySelectorAll(".category-card");
    const modTabs = document.querySelectorAll(".mod-tab");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const filePreviewContainer = document.getElementById("filePreviewContainer");
    const submitBtn = document.getElementById("submitComplaint");
    const taskSelect = document.getElementById("taskSelect");
    const reportTabPanel = document.getElementById("reportTabPanel");
    const historyTabPanel = document.getElementById("historyTabPanel");
    const historyList = document.getElementById("historyList");

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    let selectedCategory = "firibgarlik";

    // ── Kategoriya tanlash ──
    categoryCards.forEach(card => {
        card.addEventListener("click", () => {
            categoryCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            selectedCategory = card.getAttribute("data-category");
        });
    });

    // ── Fayl yuklash (faqat preview, saqlanmaydi) ──
    dropzone?.addEventListener("click", (e) => {
        if (e.target === fileInput || e.target.classList.contains("preview-item")) return;
        fileInput.click();
    });
    fileInput?.addEventListener("change", () => handleFiles(fileInput.files));
    dropzone?.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = "#f7fafc";
        dropzone.style.borderColor = "#006653";
    });
    dropzone?.addEventListener("dragleave", () => {
        dropzone.style.backgroundColor = "#ffffff";
        dropzone.style.borderColor = "#48bb78";
    });
    dropzone?.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = "#ffffff";
        dropzone.style.borderColor = "#48bb78";
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        filePreviewContainer.innerHTML = "";
        Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.classList.add("preview-item");
                    filePreviewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (!user || !_supabase) {
        if (taskSelect) taskSelect.innerHTML = `<option value="">Tizimga kiring</option>`;
        return;
    }

    // ── Foydalanuvchining vazifalarini yuklash ──
    const { data: myTasks } = await _supabase
        .from('tasks')
        .select('id, title')
        .or(`poster_id.eq.${user.id},helper_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(30);

    if (taskSelect) {
        if (myTasks && myTasks.length > 0) {
            taskSelect.innerHTML = myTasks.map(t => `<option value="${t.id}">${escapeAttr(t.title)}</option>`).join('');
        } else {
            taskSelect.innerHTML = `<option value="">Sizda vazifalar mavjud emas</option>`;
        }
    }

    // ── Shikoyatni yuborish ──
    submitBtn?.addEventListener("click", async () => {
        const taskId = taskSelect.value;
        const description = document.getElementById("complaintDesc")?.value.trim();

        if (!taskId) {
            showMuammoToast("Iltimos, vazifani tanlang", "error");
            return;
        }
        if (!description) {
            showMuammoToast("Iltimos, muammoni tasvirlab bering", "error");
            return;
        }

        submitBtn.disabled = true;
        const { error } = await _supabase.from('disputes').insert({
            task_id: taskId,
            reporter_id: user.id,
            title: CATEGORY_LABELS[selectedCategory] || selectedCategory,
            description: description
        });
        submitBtn.disabled = false;

        if (error) {
            showMuammoToast("Shikoyat yuborilmadi: " + error.message, "error");
            return;
        }

        showMuammoToast("Shikoyatingiz qabul qilindi. Tez orada ko'rib chiqamiz.");
        document.getElementById("complaintDesc").value = "";
        filePreviewContainer.innerHTML = "";
    });

    // ── Tab almashtirish ──
    async function loadHistory() {
        historyList.innerHTML = "Yuklanmoqda...";
        const { data: disputes, error } = await _supabase
            .from('disputes')
            .select('id, title, description, status, created_at')
            .eq('reporter_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            historyList.innerHTML = `<p>Tarixni yuklab bo'lmadi: ${error.message}</p>`;
            return;
        }
        if (!disputes || disputes.length === 0) {
            historyList.innerHTML = `<p>Siz hali shikoyat yubormagansiz.</p>`;
            return;
        }

        historyList.innerHTML = disputes.map(d => `
            <div class="history-item">
                <div class="history-item-header">
                    <h4>${escapeAttr(d.title)}</h4>
                    <span class="history-status ${d.status}">${DISPUTE_STATUS_LABELS[d.status] || d.status}</span>
                </div>
                <p>${escapeAttr(d.description)}</p>
                <span class="history-item-date">${new Date(d.created_at).toLocaleDateString('uz-UZ')}</span>
            </div>
        `).join('');
    }

    modTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            modTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const isHistory = tab.dataset.tab === "history";
            reportTabPanel.style.display = isHistory ? "none" : "block";
            historyTabPanel.style.display = isHistory ? "block" : "none";
            if (isHistory) loadHistory();
        });
    });
});
