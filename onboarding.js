
document.addEventListener('DOMContentLoaded', () => {
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

  // DOM elementlarini tanlab olish
  const mapWrap = document.getElementById('mapWrap');
  const mapBg = document.getElementById('mapBg');
  const mapPin = document.getElementById('mapPin');
  const radiusRing = document.getElementById('radiusRing');
  const crosshairBtn = document.getElementById('crosshairBtn');
  
  const addressInput = document.getElementById('addressInput');
  const clearBtn = document.getElementById('clearBtn');
  const suggestionsBox = document.getElementById('suggestions');
  
  const radiusBtns = document.querySelectorAll('.radius-btn');
  const submitBtn = document.getElementById('submitBtn');

  // Ichki o'zgaruvchilar (State)
  let currentRadiusKm = 1; // Standart radius
  let selectedLocation = { x: 50, y: 38 }; // Pin boshlang'ich koordinatalari (%)

  // 1. Soxta manzillar bazasi (Mock Data)
  const locationsMock = [
    { name: 'Yunusobod 4-mavze, Toshkent', x: 25, y: 45 },
    { name: 'Chilonzor 3-mavze, Toshkent', x: 75, y: 65 },
    { name: 'Amir Temur xiyoboni, Toshkent', x: 52, y: 35 },
    { name: 'Mustaqillik maydoni, Toshkent', x: 48, y: 50 },
    { name: 'Beruniy metrosi, Toshkent', x: 15, y: 30 },
    { name: 'Qorasuv 1-mavze, Toshkent', x: 85, y: 25 }
  ];

  // 2. Radius doirasini yangilash funksiyasi
  function updateRadiusRing() {
    // Har bir km uchun piksellardagi shartli o'lcham
    const scaleFactor = 60; 
    const size = currentRadiusKm * scaleFactor;

    radiusRing.style.width = `${size}px`;
    radiusRing.style.height = `${size}px`;
    radiusRing.style.left = `${selectedLocation.x}%`;
    radiusRing.style.top = `${selectedLocation.y}%`;
    radiusRing.classList.add('visible');
  }

  // 3. Pin (nishon) joylashuvini o'zgartirish funksiyasi
  function setPinPosition(percentX, percentY) {
    selectedLocation.x = percentX;
    selectedLocation.y = percentY;

    mapPin.style.left = `${percentX}%`;
    mapPin.style.top = `${percentY}%`;

    // Pin o'zgarganda radius aylanasi ham u bilan ko'chadi
    updateRadiusRing();
  }

  // 4. Xaritani bosganda pinni o'sha joyga ko'chirish
  mapWrap.addEventListener('click', (e) => {
    // Agar crosshair tugmasi bosilgan bo'lsa, xarita klikini chetlab o'tamiz
    if (e.target.closest('#crosshairBtn')) return;

    const rect = mapBg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Foizga o'giramiz
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    setPinPosition(percentX, percentY);
    addressInput.value = `Xarita bo'yicha belgilangan joy (${Math.round(percentX)}°, ${Math.round(percentY)}°)`;
    clearBtn.classList.add('show');
  });

  // 5. Mening joylashuvimni aniqlash (Crosshair) tugmasi
  crosshairBtn.addEventListener('click', () => {
    crosshairBtn.classList.add('spinning');
    addressInput.value = "Joylashuv aniqlanmoqda...";

    // Haqiqiy Geolocation API simulyatsiyasi (1 soniya kechikish bilan)
    setTimeout(() => {
      crosshairBtn.classList.remove('spinning');
      
      // Tasodifiy markaz atrofiga ko'chirish
      const randomX = 45 + Math.random() * 10;
      const randomY = 40 + Math.random() * 10;
      
      setPinPosition(randomX, randomY);
      addressInput.value = "Sizning joriy joylashuvingiz";
      clearBtn.classList.add('show');
    }, 1000);
  });

  // 6. Qidiruv inputi va Avtomatik takliflar (Autocomplete)
  addressInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();
    
    if (value.length > 0) {
      clearBtn.classList.add('show');
    } else {
      clearBtn.classList.remove('show');
      suggestionsBox.classList.remove('show');
      return;
    }

    // Filtrlash
    const filtered = locationsMock.filter(loc => loc.name.toLowerCase().includes(value));

    if (filtered.length > 0) {
      suggestionsBox.innerHTML = '';
      filtered.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <div class="sug-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <div class="sug-name">${loc.name}</div>
            <div class="sug-dist">Yaqin atrofda</div>
          </div>
        `;
        
        // Takliflardan birontasi bosilganda
        item.addEventListener('click', () => {
          addressInput.value = loc.name;
          setPinPosition(loc.x, loc.y);
          suggestionsBox.classList.remove('show');
        });

        suggestionsBox.appendChild(item);
      });
      suggestionsBox.classList.add('show');
    } else {
      suggestionsBox.classList.remove('show');
    }
  });

  // Matnni tozalash tugmasi
  clearBtn.addEventListener('click', () => {
    addressInput.value = '';
    clearBtn.classList.remove('show');
    suggestionsBox.classList.remove('show');
    addressInput.focus();
  });

  // Tashqariga bosganda takliflar oynasini yopish
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      suggestionsBox.classList.remove('show');
    }
  });

  // 7. Radius tugmalarini boshqarish
  radiusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Aktiv klassni almashtirish
      radiusBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Yangi radius qiymatini olish va doirani yangilash
      currentRadiusKm = parseInt(btn.getAttribute('data-km'));
      updateRadiusRing();
    });
  });

  // Boshlang'ich yuklanishda radius doirasini chizib qo'yamiz
  updateRadiusRing();

  // 8. "Davom etish" (Submit) tugmasi bosilganda loader effekti
  submitBtn.addEventListener('click', () => {
    if (!addressInput.value.trim()) {
      showToast("Iltimos, manzilingizni kiriting yoki xaritadan belgilang!", "error");
      addressInput.focus();
      return;
    }

    // Tugmani yuklanish holatiga o'tkazish
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Serverga yuborish simulyatsiyasi (1.5 soniya)
    setTimeout(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      
      showToast(`Muvaffaqiyatli saqlandi! Radius: ${currentRadiusKm} km`);

      // Joylashuv saqlangach, foydalanuvchini asosiy ilovaga yo'naltiramiz
      setTimeout(() => {
        window.location.href = "mahallam.html";
      }, 1200);
    }, 1500);
  });
});
