
// Kod sahifa to'liq yuklangandan keyin ishlashi uchun event tinglovchi
document.addEventListener('DOMContentLoaded', () => {

    function showToast(text, type = "success") {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: { background: type === "success" ? "#006653" : "#e53e3e" }
        }).showToast();
    }

    // 1. Xislat taglarini tanlash (Toggle active)
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
        });
    });

    // 2. Yulduzchalarni bosganda baholash tizimi
    let selectedRating = 0;
    const stars = document.querySelectorAll('#ratingStars i');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            // Bosilgan yulduzgacha bo'lganlarini faollashtirish, qolganlarini o'chirish
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
    });

    // 3. Modalni yopish tugmasi
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.location.href = 'mahallam.html';
        });
    }

    // 4. Baholashni yuborish tugmasi
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (selectedRating === 0) {
                showToast("Iltimos, avval yulduzcha bilan baho bering", "error");
                return;
            }
            showToast("Rahmat! Bahoyingiz yuborildi 🎉");
            setTimeout(() => {
                window.location.href = 'mahallam.html';
            }, 1500);
        });
    }

});
