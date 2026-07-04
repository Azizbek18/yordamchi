
document.addEventListener("DOMContentLoaded", () => {

    // Bildirishnoma tugmasi
    const notifBtn = document.querySelector(".notif-btn");
    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            Toastify({
                text: "Yangi bildirishnomalar yo'q",
                duration: 2000,
                style: { background: "#006653" }
            }).showToast();
        });
    }

    // ==========================================
    // 1. HAFTALIK DINAMIKA (LINE CHART) CONFIG
    // ==========================================
    const lineCtx = document.getElementById('weeklyDynamicsChart').getContext('2d');

    // Chiziq ostidagi maydonni silliq gradient qilish (Rasmdagidek)
    const tealGradient = lineCtx.createLinearGradient(0, 0, 0, 200);
    tealGradient.addColorStop(0, 'rgba(0, 121, 107, 0.25)');
    tealGradient.addColorStop(1, 'rgba(0, 121, 107, 0.00)');

    new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
            datasets: [{
                label: 'Faollik ko\'rsatkichi',
                data: [15, 20, 25, 28, 38, 35, 33], // Rasmdagi grafik egri chizig'iga mos qiymatlar
                borderColor: '#00796b',
                borderWidth: 3,
                fill: true,
                backgroundColor: tealGradient,
                tension: 0.4, // Chiziqni silliq yumaloq qilish (spline)
                pointRadius: 0, // Nuqtalarni ko'rsatmaslik
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Standart izohni o'chirish
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#718096', font: { size: 12 } }
                },
                y: {
                    display: false, // Rasmdagidek Y o'qi chiziqlari berkitilgan
                    grid: { display: false }
                }
            }
        }
    });


    // ==========================================
    // 2. KATEGORIYALAR (DOUGHNUT CHART) CONFIG
    // ==========================================
    const doughnutCtx = document.getElementById('categoriesDoughnutChart').getContext('2d');

    new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [40, 25, 20, 15], // Foiz yoki miqdor ulushi
                backgroundColor: [
                    '#00796b', // Tozalash (Teal)
                    '#ff9f1c', // Ta'mirlash (Orange)
                    '#2ec4b6', // Yetkazib berish (Mint)
                    '#cbd5e0'  // Boshqalar (Gray)
                ],
                borderWidth: 0, // Chegarasiz silliq halqa
                cutout: '78%'  // Rasmdagidek ichini ingichka doira qilish
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Custom legend ishlatganimiz sabab buni o'chiramiz
            }
        }
    });

});
