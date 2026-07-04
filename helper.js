
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

document.addEventListener("DOMContentLoaded", () => {

    // Foydalanuvchi ismi bilan tabriklash (agar tizimga kirilgan bo'lsa)
    const welcomeHeading = document.querySelector(".welcome h3");
    if (welcomeHeading && typeof getCurrentUser === "function") {
        const user = getCurrentUser();
        if (user) {
            const name = user.first_name || user.firstName || 'do\'st';
            welcomeHeading.textContent = `Xush kelibsiz, ${name}!`;
        }
    }

    // Status o'zgartirgich (Active / Inactive)
    const statusCheckbox = document.getElementById("status-checkbox");
    const statusText = document.getElementById("status-text");

    if (statusCheckbox) {
        statusCheckbox.addEventListener("change", () => {
            if (statusCheckbox.checked) {
                statusText.textContent = "Active";
                statusText.style.color = "#00796b";
            } else {
                statusText.textContent = "Inactive";
                statusText.style.color = "#e65100";
            }
        });
    }

    // Topshiriqni qabul qilish tugmalari funksiyasi
    const acceptButtons = document.querySelectorAll(".accept-btn");

    acceptButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const card = e.target.closest(".task-card");
            const taskTitle = card.querySelector("h3").textContent;

            let confirmAction = confirm(`"${taskTitle}" topshirig'ini qabul qilmoqchimisiz?`);

            if (confirmAction) {
                showToast("Topshiriq muvaffaqiyatli qabul qilindi!");
                card.style.opacity = "0.5";
                e.target.disabled = true;
                e.target.textContent = "Qabul qilindi";
                e.target.style.background = "#757575";
            }
        });
    });

    // Tezkor topshiriqlar uchun bosish effekti
    const quickItems = document.querySelectorAll(".quick-item");
    quickItems.forEach(item => {
        item.addEventListener("click", () => {
            const title = item.querySelector("h5").textContent;
            showToast(`Tezkor topshiriq: ${title} yuklanmoqda...`, "success");
        });
    });

    // Filtr tablari (Barchasi / Yetkazib berish)
    const filterTabs = document.querySelectorAll(".filter-tabs .tab");
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            showToast(`Filtr: ${tab.textContent.trim()}`);
        });
    });

    // Saralash tugmasi
    const sortBtn = document.querySelector(".sort-btn");
    if (sortBtn) {
        sortBtn.addEventListener("click", () => {
            showToast("Saralash sozlamalari ochilmoqda...");
        });
    }

    // Hisobotni ko'rish tugmasi
    const viewReportBtn = document.querySelector(".view-report-btn");
    if (viewReportBtn) {
        viewReportBtn.addEventListener("click", () => {
            window.location.href = "daromad.html";
        });
    }

    // Barcha takliflarni ko'rish tugmasi
    const viewAllOffersBtn = document.querySelector(".view-all-offers");
    if (viewAllOffersBtn) {
        viewAllOffersBtn.addEventListener("click", () => {
            showToast("Barcha takliflar yuklanmoqda...");
        });
    }

    // Qo'ng'iroq / qidiruv ikonkalari (header)
    document.querySelectorAll(".header-actions .icon-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const icon = btn.querySelector("i");
            if (icon && icon.classList.contains("fa-bell")) {
                window.location.href = "bildirishnoma.html";
            } else {
                showToast("Qidiruv tez kunda qo'shiladi");
            }
        });
    });
});
