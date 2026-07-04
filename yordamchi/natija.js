
// ============================================================
// TOPSHIRIQ.UZ — Qidiruv natijalari sahifasi
// (Eslatma: avval bu yerda mavjud bo'lmagan supabase.js fayliga
// import qilingan edi — bu butun skriptni ishlamay qo'ygan edi.
// Endi bu sahifa sodda lokal ma'lumotlar bilan ishlaydi.)
// ============================================================

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

// Vazifalar haqida lokal ma'lumotlar (HTML ichidagi kartalarga mos)
const tasks = {
    task1: {
        type: 'Xarid', typeClass: 'type-xarid',
        title: "Dorixonadan Dori olib kelish",
        desc: "\"Oxy\" dorixonasidan retsept bo'yicha antibiotik va vitaminlar sotib olib, Yunusobod 4-mavzega yetkazib berish kerak.",
        price: "45,000 so'm", dist: "2.4 km uzoqlikda"
    },
    task2: {
        type: 'Tezkor', typeClass: 'type-tezkor',
        title: "Glavaptikadan Dori qidirish",
        desc: "Shahar bo'ylab topilishi qiyin bo'lgan dori vositasini topish va manzilingizga olib kelib berish kerak.",
        price: "60,000 so'm", dist: "0.8 km uzoqlikda"
    },
    task3: {
        type: 'Xarid', typeClass: 'type-xarid',
        title: "Yurak uchun Dori sotib olish",
        desc: "Keksa inson uchun kerakli dori-darmonlarni xarid qilish va xonadoniga eltib berish.",
        price: "30,000 so'm", dist: "Bugun e'lon qilingan"
    }
};

function openTaskModal(id) {
    const t = tasks[id];
    if (!t) return;
    document.getElementById('modalTypeChip').textContent = t.type;
    document.getElementById('modalTypeChip').className = 'task-detail-type ' + t.typeClass;
    document.getElementById('modalTitle').textContent = t.title;
    document.getElementById('modalDesc').textContent = t.desc;
    document.getElementById('modalPrice').textContent = t.price;
    document.getElementById('modalDist').textContent = t.dist;
    openModal('taskDetailModal');
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); });
});

function sendMsg2() {
    const input = document.getElementById('chatInput2');
    const text = input.value.trim();
    if (!text) return;
    const body = document.getElementById('chatBody2');
    const msg = document.createElement('div');
    msg.className = 'chat-msg me';
    msg.textContent = text;
    body.appendChild(msg);
    input.value = '';
    body.scrollTop = body.scrollHeight;
}

document.querySelectorAll('.page-btn:not(.active):not(.arrow)').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// "Filtrlarni tozalash" tugmasi
const filterClearBtn = document.querySelector('.filter-clear');
if (filterClearBtn) {
    filterClearBtn.addEventListener('click', () => {
        document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('.active-filters .filter-chip').forEach(chip => chip.remove());
    });
}

// "Ha, yuborish" (taklifni tasdiqlash) tugmasi
const btnConfirmTask = document.getElementById('btnConfirmTask');
if (btnConfirmTask) {
    btnConfirmTask.addEventListener('click', () => {
        closeModal('confirmModal');
        showToast("Taklifingiz mijozga yuborildi! Javobni kuting. ✅");
    });
}
