
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
    // Navbardagi avatar bosh harflarini joriy foydalanuvchiga moslash
    const navAvatar = document.getElementById("navAvatar");
    if (navAvatar && typeof getCurrentUser === "function") {
        const user = getCurrentUser();
        if (user) navAvatar.textContent = getUserInitials(user);
    }

    const btnWithdraw = document.querySelector(".btn-withdraw");
    const btnCopy = document.getElementById("btn-copy");
    const btnSeeAll = document.getElementById("btn-see-all");
    const linkSupport = document.getElementById("link-support");
    const chartBars = document.querySelectorAll(".chart-bar");

    // 1. PUL YECHIB OLISH TUGMASI (CLICK EFFEKTI)
    if (btnWithdraw) {
        btnWithdraw.addEventListener("click", () => {
            showToast("Pul yechish so'rovi qabul qilindi.");
        });
    }

    // 2. REFERAL PROMO KODINI NUSXALASH
    if (btnCopy) {
        btnCopy.addEventListener("click", () => {
            const refCodeText = document.getElementById("ref-code").innerText;

            navigator.clipboard.writeText(refCodeText).then(() => {
                showToast("Referal kod nusxalandi!");
            }).catch(err => {
                console.error("Nusxalashda xatolik yuz berdi: ", err);
            });
        });
    }

    // 3. HAFTALIK DIAGRAMMA USTUNLARINI FAOLLASHTIRISH (INTERAKTIV)
    chartBars.forEach(bar => {
        bar.addEventListener("click", () => {
            // Avval barcha ustunlardan faollikni olib tashlash
            chartBars.forEach(b => b.classList.remove("active"));
            // Bosilgan ustunga "active" klassini qo'shish
            bar.classList.add("active");
        });
    });

    // 4. TRANZAKSIYALAR TARIXI: HAMMASINI KO'RISH TUGMASI
    if (btnSeeAll) {
        btnSeeAll.addEventListener("click", () => {
            showToast("Tarix sahifasiga yo'naltirilmoqda...");
        });
    }

    // 5. YORDAM XIZMATI LINKI
    if (linkSupport) {
        linkSupport.addEventListener("click", (e) => {
            e.preventDefault(); // Sahifa yuqoriga sakrab ketishini oldini oladi
            showToast("Yordam xizmati yuklanmoqda...");
        });
    }
});
