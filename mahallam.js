
// ============================================================
// TOPSHIRIQ.UZ — Mahallam sahifasi v2
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

document.addEventListener("DOMContentLoaded", () => {
    // Supabase Client
    const SUPABASE_URL = 'https://sqfxrscrgtgkxkoxlhus.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_O6TfKTFOpHoyjb6Dp1vNuA_45eezuM-';
    let _supabase = null;
    if (typeof supabase !== 'undefined') {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }


    // Podium statik HTML orqali ko'rsatiladi, JS orqali o'zgartirilmaydi

    // ── Modal infrastructure ─────────────────────────────────
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-overlay';
    modalOverlay.innerHTML = `<div id="modal-box"></div>`;
    document.body.appendChild(modalOverlay);

    const styleTag = document.createElement('style');
    styleTag.textContent = `
        #modal-overlay {
            display: none;
            position: fixed; inset: 0;
            background: rgba(4, 20, 16, 0.55);
            backdrop-filter: blur(4px);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        #modal-overlay.open { display: flex; animation: mo-fadein .18s ease; }
        @keyframes mo-fadein { from { opacity:0 } to { opacity:1 } }

        #modal-box {
            background: #fff;
            border-radius: 24px;
            padding: 36px 32px 28px;
            max-width: 480px;
            width: 100%;
            position: relative;
            box-shadow: 0 32px 80px rgba(0,77,64,.18);
            animation: mo-slideup .22s ease;
        }
        @keyframes mo-slideup { from { transform:translateY(24px);opacity:0 } to { transform:translateY(0);opacity:1 } }

        #modal-box .modal-close {
            position: absolute; top: 16px; right: 18px;
            background: none; border: none; font-size: 20px;
            color: #718096; cursor: pointer; line-height: 1;
            padding: 4px 8px; border-radius: 8px; transition: background .15s;
        }
        #modal-box .modal-close:hover { background: #e6f7f2; }

        #modal-box h2 { font-size: 20px; font-weight: 800; color: #004d3f; margin-bottom: 6px; }
        #modal-box .modal-sub { font-size: 14px; color: #718096; margin-bottom: 22px; }

        #modal-box label { font-size: 13px; font-weight: 600; color: #2d3748; display: block; margin-bottom: 6px; }
        #modal-box input, #modal-box textarea, #modal-box select {
            width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px;
            padding: 11px 14px; font-size: 14px; color: #2d3748;
            outline: none; margin-bottom: 16px; font-family: inherit;
            transition: border-color .2s; background: #f9fcfb;
        }
        #modal-box input:focus, #modal-box textarea:focus, #modal-box select:focus { border-color: #006653; }
        #modal-box textarea { resize: vertical; min-height: 90px; }
        #modal-box .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        #modal-box .btn-modal-primary {
            width: 100%; background: #006653; color: #fff;
            border: none; border-radius: 30px; padding: 14px;
            font-size: 15px; font-weight: 700; cursor: pointer;
            transition: background .2s, transform .15s; margin-top: 4px;
        }
        #modal-box .btn-modal-primary:hover { background: #004d3f; transform: translateY(-1px); }
        #modal-box .btn-modal-secondary {
            width: 100%; background: transparent; color: #718096;
            border: 1.5px solid #e2e8f0; border-radius: 30px; padding: 12px;
            font-size: 14px; font-weight: 600; cursor: pointer;
            margin-top: 10px; transition: border-color .2s;
        }
        #modal-box .btn-modal-secondary:hover { border-color: #006653; color: #006653; }

        /* Activity detail */
        #modal-box .activity-detail-row {
            display: flex; align-items: center; gap: 14px;
            padding: 12px 0; border-bottom: 1px solid #f0f5f2;
        }
        #modal-box .activity-detail-row:last-of-type { border-bottom: none; }
        #modal-box .adr-icon {
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; flex-shrink: 0;
        }
        #modal-box .adr-text { flex: 1; font-size: 13px; color: #4a5568; }
        #modal-box .adr-text strong { color: #2d3748; display: block; }
        #modal-box .adr-time { font-size: 11px; color: #a0aec0; }

        /* Map modal */
        #modal-box .map-tasks-list { max-height: 52vh; overflow-y: auto; }
        #modal-box .maptask-item {
            display: flex; align-items: center; gap: 14px;
            padding: 12px 0; border-bottom: 1px solid #f0f5f2;
        }
        #modal-box .maptask-item:last-child { border-bottom: none; }
        #modal-box .maptask-icon {
            width: 38px; height: 38px; border-radius: 12px;
            background: #e6f7f2; color: #006653;
            display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
        }
        #modal-box .maptask-info { flex: 1; }
        #modal-box .maptask-info strong { font-size: 13px; font-weight: 700; display: block; }
        #modal-box .maptask-info span { font-size: 11px; color: #718096; }
        #modal-box .maptask-price {
            font-size: 12px; font-weight: 700; color: #744210;
            background: #fbd38d; padding: 3px 9px; border-radius: 8px; white-space: nowrap;
        }
        #modal-box .maptask-offer {
            display: block; width: 100%; text-align: center;
            background: none; border: 1.5px solid #006653; color: #006653;
            border-radius: 10px; padding: 5px; font-size: 11px; font-weight: 700;
            cursor: pointer; margin-top: 5px; transition: background .15s;
        }
        #modal-box .maptask-offer:hover { background: #e6f7f2; }

        /* Rating table */
        #modal-box .rating-row {
            display: flex; align-items: center; gap: 14px;
            padding: 10px 0; border-bottom: 1px solid #f0f5f2;
        }
        #modal-box .rating-row:last-child { border-bottom: none; }
        #modal-box .rating-rank {
            width: 28px; height: 28px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 800; flex-shrink: 0;
        }
        #modal-box .rank-1 { background: #d69e2e; color: #fff; }
        #modal-box .rank-2 { background: #a0aec0; color: #fff; }
        #modal-box .rank-3 { background: #9c7a4e; color: #fff; }
        #modal-box .rank-other { background: #edf2f7; color: #4a5568; }
        #modal-box .rating-name { flex: 1; font-size: 13px; font-weight: 600; }
        #modal-box .rating-score { font-size: 12px; color: #006653; font-weight: 700; }
        #modal-box .rating-tasks { font-size: 11px; color: #a0aec0; }

        /* Success */
        #modal-box .modal-success { text-align: center; padding: 10px 0 8px; }
        #modal-box .modal-success .success-icon {
            width: 64px; height: 64px; background: #e6f7f2;
            border-radius: 50%; margin: 0 auto 16px;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; color: #006653;
        }
        #modal-box .modal-success h2 { text-align: center; }
        #modal-box .modal-success p { font-size: 14px; color: #718096; text-align: center; margin-top: 8px; }

        @media (max-width: 480px) {
            #modal-box { padding: 28px 18px 22px; }
            #modal-box .modal-row { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(styleTag);

    function openModal(html) {
        document.getElementById('modal-box').innerHTML = `
            <button class="modal-close" id="modal-close-btn">&times;</button>
            ${html}
        `;
        modalOverlay.classList.add('open');
        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
    }

    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    function showSuccess(title, desc) {
        document.getElementById('modal-box').innerHTML = `
            <button class="modal-close" id="modal-close-btn">&times;</button>
            <div class="modal-success">
                <div class="success-icon"><i class="fas fa-check"></i></div>
                <h2>${title}</h2>
                <p>${desc}</p>
            </div>
            <button class="btn-modal-primary" id="sc-btn" style="margin-top:24px">Yopish</button>
        `;
        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('sc-btn').addEventListener('click', closeModal);
    }

    // ── Data ────────────────────────────────────────────────
    const mapTasks = [
        { icon: 'fas fa-screwdriver-wrench', title: 'Kranni tuzatish', location: '7-uy yaqinida', price: '60,000 so\'m' },
        { icon: 'fas fa-cart-shopping', title: 'Oziq-ovqat yetkazish', location: '12-uy', price: '25,000 so\'m' },
        { icon: 'fas fa-broom', title: 'Hovlini supirish', location: 'Markaziy bog\'cha', price: '40,000 so\'m' },
        { icon: 'fas fa-paw', title: 'It sayr qildirish', location: '3-uy', price: '20,000 so\'m' },
        { icon: 'fas fa-laptop', title: 'Noutbuk ta\'mir', location: '15-uy', price: '90,000 so\'m' },
        { icon: 'fas fa-basket-shopping', title: 'Aptekadan dori', location: '9-uy', price: '15,000 so\'m' },
        { icon: 'fas fa-truck', title: 'Mebel ko\'chirish', location: '22-uy', price: '180,000 so\'m' },
        { icon: 'fas fa-paint-roller', title: 'Devor bo\'yash', location: '5-uy', price: '120,000 so\'m' },
        { icon: 'fas fa-wifi', title: 'Internet ulash', location: '18-uy', price: '35,000 so\'m' },
        { icon: 'fas fa-seedling', title: 'Ko\'chat ekish', location: 'Park yaqini', price: '30,000 so\'m' },
        { icon: 'fas fa-wrench', title: 'Qulf almashtirish', location: '11-uy', price: '45,000 so\'m' },
        { icon: 'fas fa-trash', title: 'Axlat olib chiqish', location: '8-uy', price: '10,000 so\'m' },
    ];



    // ── Offer modal (reusable) ───────────────────────────────
    function openOfferModal(title, location, price) {
        openModal(`
            <h2>Taklif yuborish</h2>
            <p class="modal-sub">Topshiriq bo'yicha taklifingizni yuboring</p>
            <div style="background:#f3faf7;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
                <strong style="font-size:14px;color:#2d3748;display:block;margin-bottom:3px;">${title}</strong>
                <span style="font-size:12px;color:#718096;"><i class="fas fa-location-dot" style="color:#006653;margin-right:4px;"></i>${location} &nbsp;·&nbsp; <b style="color:#744210;">${price}</b></span>
            </div>
            <label>Taklif narxingiz (so'm)</label>
            <input type="number" id="offer-price" placeholder="Masalan: 50000" min="0"/>
            <label>Xabar (ixtiyoriy)</label>
            <textarea id="offer-msg" placeholder="O'zingiz haqida qisqacha yozing..."></textarea>
            <div class="modal-row">
                <div>
                    <label>Qachon bo'sh?</label>
                    <select>
                        <option>Hozir</option>
                        <option>1 soat ichida</option>
                        <option>Bugun</option>
                        <option>Ertaga</option>
                    </select>
                </div>
                <div>
                    <label>Bajarish muddati</label>
                    <select>
                        <option>30 daqiqa</option>
                        <option>1 soat</option>
                        <option>2-3 soat</option>
                        <option>1 kun</option>
                    </select>
                </div>
            </div>
            <button class="btn-modal-primary" id="offer-submit">
                <i class="fas fa-paper-plane" style="margin-right:8px;"></i>Taklif yuborish
            </button>
            <button class="btn-modal-secondary" id="offer-cancel">Bekor qilish</button>
        `);
        document.getElementById('offer-submit').addEventListener('click', () => {
            const p = document.getElementById('offer-price').value;
            if (!p) { document.getElementById('offer-price').style.borderColor = '#e53e3e'; document.getElementById('offer-price').focus(); return; }
            showSuccess('Taklifingiz yuborildi! 🎉', 'Mijoz tez orada siz bilan bog\'lanadi.');
        });
        document.getElementById('offer-cancel').addEventListener('click', closeModal);
    }

    // ── 1. Sub-nav switching ─────────────────────────────────
    const subNavButtons = document.querySelectorAll(".sub-nav-btn");
    subNavButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            subNavButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const label = btn.textContent.trim();

            if (label.includes('Topshiriqlar')) {
                openMapTasksModal();
            } else if (label.includes('Yordamchilar')) {
                openRatingModal();
            } else if (label.includes('Reyting')) {
                openRatingModal();
            } else if (label.includes('Yangiliklar')) {
                openModal(`
                    <h2>Mahalla yangiliklari</h2>
                    <p class="modal-sub">Yunusobod, 7-mavze so'nggi voqealari</p>
                    <div style="margin-top:8px;">
                        ${[
                        { icon: 'fas fa-seedling', title: 'Ko\'kalamzorlashtirish aksiyasi', time: 'Bugun, 10:00', desc: 'Markaziy bog\'chada 50 ta yangi ko\'chat ekiladi. Hammani taklif qilamiz!', color: '#e6f7f2', icolor: '#38a169' },
                        { icon: 'fas fa-broom', title: 'Umumiy tozalik kuni', time: 'Shanba, 09:00', desc: 'Mahalla hududi birgalikda tozalanadi. Inventar tayyorlangan.', color: '#fef3e6', icolor: '#dd6b20' },
                        { icon: 'fas fa-award', title: 'Oylik reyting e\'lon qilindi', time: 'Kecha', desc: 'Malika B. bu oy ham birinchi o\'rinda. Tabriklaymiz!', color: '#fef9e6', icolor: '#d69e2e' },
                    ].map(n => `
                            <div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #f0f5f2;">
                                <div style="width:40px;height:40px;border-radius:12px;background:${n.color};color:${n.icolor};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">
                                    <i class="${n.icon}"></i>
                                </div>
                                <div>
                                    <strong style="font-size:13px;display:block;margin-bottom:2px;">${n.title}</strong>
                                    <span style="font-size:11px;color:#a0aec0;">${n.time}</span>
                                    <p style="font-size:12px;color:#718096;margin-top:4px;">${n.desc}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `);
            }
            // "Umumiy" tab — just switches visually, no modal needed
        });
    });

    // ── 2. Activity item click — batafsil modal ──────────────
    const activityData = [
        {
            icon: 'fas fa-screwdriver-wrench', iconBg: '#fef3e6', iconColor: '#dd6b20',
            title: 'Kran tuzatish topshirig\'i',
            person: 'Olimjon T.', location: '7-uy yaqinida', time: '2 daqiqa oldin',
            status: 'Bajarilmoqda', price: '60,000 so\'m',
            desc: 'Oshxona kranidan suv tomib turibdi. Usta kerak.'
        },
        {
            icon: 'fas fa-cart-shopping', iconBg: '#e6f4f0', iconColor: '#006653',
            title: 'Oziq-ovqat yetkazish',
            person: 'Yangi topshiriq', location: '12-uy', time: 'Hozirgina',
            status: 'Taklif kutilmoqda', price: '25,000 so\'m',
            desc: 'Katta yoshli qo\'shnimizga mahsulotlar olib borib berish kerak.'
        },
        {
            icon: 'fas fa-check', iconBg: '#e6f7f2', iconColor: '#38a169',
            title: 'Hovlini supirish — Yakunlandi',
            person: 'Jasur K.', location: 'Markaziy bog\'cha', time: '15 daqiqa oldin',
            status: 'Bajarildi ✓', price: '40,000 so\'m',
            desc: 'Bog\'cha hududi to\'liq tozalandi. Ijobiy baho berildi.'
        },
    ];

    document.querySelectorAll(".activity-item").forEach((item, i) => {
        item.style.cursor = 'pointer';
        item.addEventListener("click", () => {
            const d = activityData[i] || activityData[0];
            openModal(`
                <h2>${d.title}</h2>
                <p class="modal-sub">Topshiriq tafsilotlari</p>
                <div style="background:#f3faf7;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:44px;height:44px;border-radius:50%;background:${d.iconBg};color:${d.iconColor};display:flex;align-items:center;justify-content:center;font-size:18px;">
                            <i class="${d.icon}"></i>
                        </div>
                        <div>
                            <strong style="font-size:14px;">${d.person}</strong>
                            <span style="display:block;font-size:12px;color:#718096;">${d.time}</span>
                        </div>
                        <span style="margin-left:auto;font-size:12px;font-weight:700;background:#fbd38d;color:#744210;padding:4px 10px;border-radius:8px;">${d.price}</span>
                    </div>
                    <p style="font-size:13px;color:#4a5568;line-height:1.5;">${d.desc}</p>
                    <div style="display:flex;gap:20px;margin-top:12px;font-size:12px;color:#718096;">
                        <span><i class="fas fa-location-dot" style="color:#006653;margin-right:4px;"></i>${d.location}</span>
                        <span><i class="fas fa-circle-dot" style="color:#38a169;margin-right:4px;"></i>${d.status}</span>
                    </div>
                </div>
                ${d.status === 'Taklif kutilmoqda'
                    ? `<button class="btn-modal-primary" id="act-offer-btn"><i class="fas fa-paper-plane" style="margin-right:8px;"></i>Taklif berish</button>`
                    : `<button class="btn-modal-primary" id="act-close-btn">Yopish</button>`
                }
            `);
            if (d.status === 'Taklif kutilmoqda') {
                document.getElementById('act-offer-btn').addEventListener('click', () => {
                    openOfferModal(d.title, d.location, d.price);
                });
            } else {
                document.getElementById('act-close-btn')?.addEventListener('click', closeModal);
            }
        });
    });

    // ── 3. Xarita — faol topshiriqlar modal ─────────────────
    function openMapTasksModal() {
        const items = mapTasks.map(t => `
            <div class="maptask-item">
                <div class="maptask-icon"><i class="${t.icon}"></i></div>
                <div class="maptask-info">
                    <strong>${t.title}</strong>
                    <span><i class="fas fa-location-dot" style="color:#006653;margin-right:3px;"></i>${t.location}</span>
                    <button class="maptask-offer" data-title="${t.title}" data-loc="${t.location}" data-price="${t.price}">
                        Taklif berish
                    </button>
                </div>
                <span class="maptask-price">${t.price}</span>
            </div>
        `).join('');

        openModal(`
            <h2>Faol topshiriqlar</h2>
            <p class="modal-sub">Yunusobod 7-mavzedagi <strong>${mapTasks.length} ta</strong> topshiriq</p>
            <div class="map-tasks-list">${items}</div>
        `);

        document.querySelectorAll('.maptask-offer').forEach(btn => {
            btn.addEventListener('click', () => {
                openOfferModal(btn.dataset.title, btn.dataset.loc, btn.dataset.price);
            });
        });
    }

    const btnMapAction = document.querySelector(".btn-map-action");
    if (btnMapAction) {
        btnMapAction.addEventListener("click", openMapTasksModal);
    }

    // ── 4. "Hammasini ko'rish" (jonli faollik) ───────────────
    const seeAllLink = document.querySelector(".see-all");
    if (seeAllLink) {
        seeAllLink.addEventListener('click', e => {
            e.preventDefault();
            openMapTasksModal();
        });
    }

    // ── 5. To'liq reyting modal (Supabase'dan yuklash) ──
    async function openRatingModal() {
        if (!_supabase) {
            openModal(`
                <h2>Mahalla reytingi</h2>
                <p class="modal-sub">Bu oy eng faol yordamchilar</p>
                <div style="padding: 30px 0; color: #718096; font-size: 14px; font-weight: 500; text-align: center;">
                    <i class="fas fa-wifi" style="color: #cbd5e0; font-size: 28px; margin-bottom: 10px; display: block;"></i>
                    Internet aloqasi yo'q
                </div>
                <button class="btn-modal-secondary" style="margin-top:20px;" id="rating-close">Yopish</button>
            `);
            document.getElementById('rating-close')?.addEventListener('click', closeModal);
            return;
        }

        const { data: profiles, error } = await _supabase.from('profiles').select('*');

        if (error || !profiles || profiles.length === 0) {
            openModal(`
                <h2>Mahalla reytingi</h2>
                <p class="modal-sub">Bu oy eng faol yordamchilar</p>
                <div style="padding: 30px 0; color: #718096; font-size: 14px; font-weight: 500; text-align: center;">
                    <i class="fas fa-users-slash" style="color: #cbd5e0; font-size: 28px; margin-bottom: 10px; display: block;"></i>
                    Hozircha hech kim yo'q
                </div>
                <button class="btn-modal-secondary" style="margin-top:20px;" id="rating-close">Yopish</button>
            `);
        } else {
            const sorted = profiles.map((u, index) => {
                const first = u.first_name || '';
                const last = u.last_name || '';
                const name = (first || last) ? `${first} ${last}` : (u.email ? u.email.split('@')[0] : "Foydalanuvchi");
                return {
                    name: name,
                    points: u.points || (150 - index * 30 > 30 ? 150 - index * 30 : 50),
                    tasks: u.tasks || Math.floor(Math.random() * 5) + 1
                };
            }).sort((a, b) => b.points - a.points);

            const rows = sorted.map((u, i) => {
                const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
                return `
                    <div class="rating-row">
                        <div class="rating-rank ${rankClass}">${i + 1}</div>
                        <div class="rating-name">${u.name}</div>
                        <div style="text-align: right;">
                            <div class="rating-score">${u.points} ball</div>
                            <div class="rating-tasks">${u.tasks} ta topshiriq</div>
                        </div>
                    </div>
                `;
            }).join('');

            openModal(`
                <h2>Mahalla reytingi</h2>
                <p class="modal-sub">Bu oy eng faol yordamchilar</p>
                <div style="max-height: 50vh; overflow-y: auto;">
                    ${rows}
                </div>
                <button class="btn-modal-secondary" style="margin-top:20px;" id="rating-close">Yopish</button>
            `);
        }
        document.getElementById('rating-close')?.addEventListener('click', closeModal);
    }

    // --- Role checking ---
    const currentUserObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUserObj.role || 'helper';

    // --- Apply Role Customization on Load ---
    function applyRoleCustomization() {
        const heroTitle = document.querySelector('.hero-left h1');
        const heroDesc = document.querySelector('.hero-left p');
        const subNavContainer = document.querySelector('.sub-nav-container');
        const mapOverlayText = document.querySelector('.map-overlay-info h3');
        const mapOverlaySub = document.querySelector('.map-overlay-info p');
        const mapOverlayBtn = document.querySelector('.btn-map-action');
        const badgeCards = document.querySelectorAll('.info-badge-card');

        if (userRole === 'poster') {
            if (heroTitle) heroTitle.textContent = "Yunusobod, 7-mavze — Ish beruvchi markazi";
            if (heroDesc) heroDesc.textContent = "Mahallangizdagi faol yordamchilar va ularning reytinglarini kuzatib boring, ishonchli ustalar bilan bog'laning.";
            
            if (subNavContainer) {
                subNavContainer.innerHTML = `
                    <button class="sub-nav-btn active"><i class="fa-solid fa-table-columns"></i> Umumiy</button>
                    <button class="sub-nav-btn" id="btn-sub-helpers"><i class="fa-solid fa-users"></i> Yordamchilar</button>
                    <button class="sub-nav-btn" id="btn-sub-news"><i class="fa-regular fa-newspaper"></i> Yangiliklar</button>
                    <button class="sub-nav-btn" id="btn-sub-rating"><i class="fa-solid fa-award"></i> Reyting</button>
                `;
            }

            if (mapOverlayText) mapOverlayText.textContent = "42 nafar faol yordamchi";
            if (mapOverlaySub) mapOverlaySub.textContent = "Sizning hududda faol";
            if (mapOverlayBtn) mapOverlayBtn.textContent = "Yordamchilarni ko'rish";
            
            if (badgeCards && badgeCards.length > 0) {
                const firstBadge = badgeCards[0];
                const badgeInfo = firstBadge.querySelector('.badge-info');
                if (badgeInfo) {
                    badgeInfo.innerHTML = `
                        <h4>Yangi topshiriq berish</h4>
                        <p style="font-size:11px;color:#718096;margin-top:2px;">Topshiriq e'lon qiling</p>
                    `;
                    firstBadge.style.cursor = 'pointer';
                    firstBadge.onclick = () => window.location.href = 'poster.html';
                }
            }
        } else {
            if (heroTitle) heroTitle.textContent = "Yunusobod, 7-mavze — Ish oluvchilar hamjamiyati";
            if (heroDesc) heroDesc.textContent = "Mahalladagi faol topshiriqlar bilan tanishing, topshiriqlarni qabul qiling va haftalik reyting poygasida qatnashing!";
            
            if (subNavContainer) {
                subNavContainer.innerHTML = `
                    <button class="sub-nav-btn active"><i class="fa-solid fa-table-columns"></i> Umumiy</button>
                    <button class="sub-nav-btn" id="btn-sub-tasks"><i class="fa-regular fa-clipboard"></i> Topshiriqlar</button>
                    <button class="sub-nav-btn" id="btn-sub-news"><i class="fa-regular fa-newspaper"></i> Yangiliklar</button>
                    <button class="sub-nav-btn" id="btn-sub-rating"><i class="fa-solid fa-award"></i> Reyting</button>
                `;
            }

            if (mapOverlayText) mapOverlayText.textContent = "12 ta faol topshiriq";
            if (mapOverlaySub) mapOverlaySub.textContent = "Yaqiningizda bor";
            if (mapOverlayBtn) mapOverlayBtn.textContent = "Xaritani ochish";
        }

        bindSubNavClicks();
    }

    function bindSubNavClicks() {
        document.querySelectorAll(".sub-nav-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".sub-nav-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const label = btn.textContent.trim();
                if (label.includes('Topshiriqlar')) openMapTasksModal();
                else if (label.includes('Yordamchilar')) openRatingModal();
                else if (label.includes('Reyting')) openRatingModal();
                else if (label.includes('Yangiliklar')) {
                    openModal(`
                    <h2>Mahalla yangiliklari</h2>
                    <p class="modal-sub">Yunusobod, 7-mavze so'nggi voqealari</p>
                    <div style="margin-top:8px;">
                        ${[
                            { icon: 'fas fa-seedling', title: "Ko'kalamzorlashtirish aksiyasi", time: 'Bugun, 10:00', desc: "Markaziy bog'chada 50 ta yangi ko'chat ekiladi. Hammani taklif qilamiz!", color: '#e6f7f2', icolor: '#38a169' },
                            { icon: 'fas fa-broom', title: 'Umumiy tozalik kuni', time: 'Shanba, 09:00', desc: 'Mahalla hududi birgalikda tozalanadi. Inventar tayyorlangan.', color: '#fef3e6', icolor: '#dd6b20' },
                            { icon: 'fas fa-award', title: "Oylik reyting e'lon qilindi", time: 'Kecha', desc: "Malika B. bu oy ham birinchi o'rinda. Tabriklaymiz!", color: '#fef9e6', icolor: '#d69e2e' },
                        ].map(n => `
                            <div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #f0f5f2;">
                                <div style="width:40px;height:40px;border-radius:12px;background:${n.color};color:${n.icolor};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="${n.icon}"></i></div>
                                <div>
                                    <strong style="font-size:13px;display:block;margin-bottom:2px;">${n.title}</strong>
                                    <span style="font-size:11px;color:#a0aec0;">${n.time}</span>
                                    <p style="font-size:12px;color:#718096;margin-top:4px;">${n.desc}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `);
                }
            });
        });
    }

    // Hafta yulduzlari podiumini dinamik chizish (Supabase'dan)
    async function renderPodium() {
        const podiumCard = document.querySelector(".rating-podium-card");
        if (!podiumCard) return;

        let profiles = [];
        if (_supabase) {
            const { data, error } = await _supabase.from('profiles').select('*');
            if (!error && data) profiles = data;
        }

        if (profiles.length === 0) {
            podiumCard.innerHTML = `
                <h2 class="podium-title">${userRole === 'poster' ? 'Mahallaning eng faol yordamchilari' : 'Haftalik yetakchilar poygasi'}</h2>
                <div style="padding: 30px 0; color: #718096; font-size: 14px; font-weight: 500; text-align: center;">
                    <i class="fas fa-star-half-stroke" style="color: #cbd5e0; font-size: 28px; margin-bottom: 10px; display: block;"></i>
                    Hozircha hafta yulduzlari yo'q
                </div>
                <button class="btn-full-rating">To'liq reyting</button>
            `;
            podiumCard.querySelector(".btn-full-rating")?.addEventListener("click", openRatingModal);
            return;
        }

        const sorted = profiles.map((u, index) => {
            const first = u.first_name || '';
            const last = u.last_name || '';
            const name = (first || last) ? `${first} ${last.charAt(0)}.` : (u.email ? u.email.split('@')[0] : "Foydalanuvchi");
            return {
                name: name,
                initials: (first && last) ? (first.charAt(0) + last.charAt(0)).toUpperCase() : name.substring(0, 2).toUpperCase(),
                points: u.points || (150 - index * 30 > 30 ? 150 - index * 30 : 50)
            };
        }).sort((a, b) => b.points - a.points);

        const first = sorted[0];
        const second = sorted[1];
        const third = sorted[2];

        let containerHtml = '<div class="podium-container">';

        // 2-o'rin (ikkinchi)
        if (second) {
            containerHtml += `
                <div class="podium-user">
                    <div class="avatar-circle small-avatar" style="background-image: none; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:14px; background-color:#718096;">${second.initials}</div>
                    <span class="podium-name">${second.name}</span>
                    <div class="podium-bar height-2">${second.points}</div>
                </div>
            `;
        } else {
            containerHtml += `
                <div class="podium-user" style="opacity:0.3;">
                    <div class="avatar-circle small-avatar" style="background-image: none; display:flex; align-items:center; justify-content:center; color:#a0aec0; font-weight:bold; font-size:14px; background-color:#edf2f7;">?</div>
                    <span class="podium-name">-</span>
                    <div class="podium-bar height-2" style="background-color:#f7fafc; color:#cbd5e0;">0</div>
                </div>
            `;
        }

        // 1-o'rin (birinchi)
        if (first) {
            containerHtml += `
                <div class="podium-user">
                    <i class="fas fa-crown crown-icon" style="color: #d69e2e; font-size: 15px; margin-bottom: -3px;"></i>
                    <div class="avatar-circle large-avatar" style="background-image: none; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:18px; background-color:#006653;">${first.initials}</div>
                    <span class="podium-name">${first.name}</span>
                    <div class="podium-bar height-1">${first.points}</div>
                </div>
            `;
        }

        // 3-o'rin (uchunchi)
        if (third) {
            containerHtml += `
                <div class="podium-user">
                    <div class="avatar-circle small-avatar" style="background-image: none; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:14px; background-color:#9c7a4e;">${third.initials}</div>
                    <span class="podium-name">${third.name}</span>
                    <div class="podium-bar height-3">${third.points}</div>
                </div>
            `;
        } else {
            containerHtml += `
                <div class="podium-user" style="opacity:0.3;">
                    <div class="avatar-circle small-avatar" style="background-image: none; display:flex; align-items:center; justify-content:center; color:#a0aec0; font-weight:bold; font-size:14px; background-color:#edf2f7;">?</div>
                    <span class="podium-name">-</span>
                    <div class="podium-bar height-3" style="background-color:#f7fafc; color:#cbd5e0;">0</div>
                </div>
            `;
        }

        containerHtml += '</div>';

        let bottomListHtml = '';
        if (userRole === 'poster') {
            bottomListHtml = `
                <div style="margin-top:20px; display:flex; flex-direction:column; gap:10px; width:100%; border-top:1px solid #e2e8f0; padding-top:16px;">
                    <span style="font-size:12px; font-weight:700; color:#718096; text-transform:uppercase; letter-spacing:0.5px; text-align:left; margin-bottom:4px; display:block;">Tezkor aloqa va taklif:</span>
                    ${sorted.slice(0, 3).map((h, idx) => {
                        const specialties = ["Universal usta", "Kuryer / Yetkazish", "Elektrik & Santexnik"];
                        const spec = specialties[idx] || "Yordamchi";
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f7faf9; padding:10px 14px; border-radius:12px; border-left:3px solid #006653;">
                                <div style="text-align:left;">
                                    <strong style="font-size:13.5px; color:#2d3748; display:block;">${h.name}</strong>
                                    <span style="font-size:11.5px; color:#718096; display:block;">${spec} &nbsp;·&nbsp; 4.9 ★</span>
                                </div>
                                <button class="btn-invite-helper" data-name="${h.name}" data-spec="${spec}" style="background:#006653; color:#fff; border:none; border-radius:30px; padding:6px 12px; font-size:11.5px; font-weight:700; cursor:pointer; transition:all 0.15s; box-shadow:0 2px 6px rgba(0,102,83,0.15);">Taklif</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            bottomListHtml = `
                <div style="margin-top:20px; background:#f0fff4; border:1px dashed #38a169; border-radius:14px; padding:12px 16px; text-align:center; width:100%;">
                    <div style="font-size:13px; font-weight:700; color:#276749; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <i class="fa-solid fa-trophy" style="color:#d69e2e;"></i>
                        Sizning o'rningiz: #5
                    </div>
                    <p style="font-size:11.5px; color:#2f855a; margin:4px 0 0 0; line-height:1.4;">Yana <strong>10 ball</strong> to'plab top 3 talikka kiring va maxsus bonus yutib oling!</p>
                </div>
            `;
        }

        podiumCard.innerHTML = `
            <h2 class="podium-title">${userRole === 'poster' ? 'Mahallaning eng faol yordamchilari' : 'Haftalik yetakchilar poygasi'}</h2>
            ${containerHtml}
            ${bottomListHtml}
            <button class="btn-full-rating" style="margin-top:16px;">To'liq reyting</button>
        `;

        podiumCard.querySelector(".btn-full-rating")?.addEventListener("click", openRatingModal);

        // Add invitation button listeners
        podiumCard.querySelectorAll('.btn-invite-helper').forEach(btn => {
            btn.addEventListener('click', () => {
                const hName = btn.dataset.name;
                const hSpec = btn.dataset.spec;
                openModal(`
                    <h2>Ishga taklif qilish</h2>
                    <p class="modal-sub"><strong>${hName}</strong> yordamchisini topshiriqqa taklif qiling</p>
                    <div style="background:#f0f9f6; border:1px solid #c6f6d5; border-radius:14px; padding:14px; margin-bottom:20px; text-align:left;">
                        <strong style="font-size:14px; color:#2d3748; display:block;">${hName}</strong>
                        <span style="font-size:12px; color:#718096; display:block; margin-top:2px;">Kategoriya: ${hSpec}</span>
                    </div>
                    
                    <label>Sizning topshiriqlaringiz</label>
                    <select id="invite-task-select" style="width:100%; border:1.5px solid #e2e8f0; border-radius:12px; padding:11px 14px; font-size:14px; outline:none; margin-bottom:16px; font-family:inherit; background:#f9fcfb;">
                        <option value="1">Kranni tuzatish (60,000 so'm)</option>
                        <option value="2">Hovlidagi xazonlarni tozalash (40,000 so'm)</option>
                        <option value="3">Oziq-ovqat yetkazish (25,000 so'm)</option>
                    </select>
                    
                    <label>Xabar yozing (ixtiyoriy)</label>
                    <textarea placeholder="Salom, mening mahallamda topshiriq bor edi. Bajarishga yordam bera olasizmi?" style="width:100%; border:1.5px solid #e2e8f0; border-radius:12px; padding:11px 14px; font-size:14px; outline:none; margin-bottom:20px; font-family:inherit; background:#f9fcfb; resize:vertical; min-height:80px;"></textarea>
                    
                    <button class="btn-modal-primary" id="btn-submit-invite"><i class="fas fa-paper-plane" style="margin-right:8px;"></i>Taklif yuborish</button>
                    <button class="btn-modal-secondary" id="btn-cancel-invite">Bekor qilish</button>
                `);
                
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
                
                document.getElementById('btn-submit-invite').addEventListener('click', () => {
                    showSuccess("Taklif muvaffaqiyatli yuborildi! ✅", "Yordamchi taklifni qabul qilsa, sizga bildirishnoma keladi.");
                    const cleanName = hName.split(' ')[0];
                    addNotificationForHelper(cleanName, "Ishga taklif", "Sizni Yunusobod 7-mavzedagi topshiriqqa taklif qilishdi.");
                });
                document.getElementById('btn-cancel-invite').addEventListener('click', closeModal);
            });
        });
    }

    // Map button
    const mapBtn = document.querySelector(".btn-map-action");
    if (mapBtn) {
        if (userRole === 'poster') {
            mapBtn.addEventListener("click", (e) => {
                e.preventDefault();
                openRatingModal();
            });
        } else {
            mapBtn.addEventListener("click", openMapTasksModal);
        }
    }

    // See all
    document.querySelector(".see-all")?.addEventListener('click', e => { e.preventDefault(); openMapTasksModal(); });

    // Rating button
    document.querySelector(".btn-full-rating")?.addEventListener("click", openRatingModal);

    // CTA
    const btnCtaStart = document.querySelector(".btn-cta-start");
    if (btnCtaStart) {
        btnCtaStart.addEventListener("click", () => {
            openModal(`
                <h2>Vazifani boshlash</h2>
                <p class="modal-sub">Qaysi sohada yordam bera olasiz?</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
                    ${[
                    { icon: 'fas fa-screwdriver-wrench', label: 'Ta\'mirlash', color: '#fef3e6', icolor: '#dd6b20' },
                    { icon: 'fas fa-basket-shopping', label: 'Xarid & Dori', color: '#e6f7f2', icolor: '#38a169' },
                    { icon: 'fas fa-truck', label: 'Yetkazish', color: '#e6f0fe', icolor: '#4a72d1' },
                    { icon: 'fas fa-laptop-code', label: 'Raqamli', color: '#f3e5f5', icolor: '#8e24aa' },
                    { icon: 'fas fa-broom', label: 'Uy ishlari', color: '#e0f2f1', icolor: '#00695c' },
                    { icon: 'fas fa-ellipsis', label: 'Boshqa', color: '#eceff1', icolor: '#455a64' },
                ].map(c => `
                        <button class="cta-cat-btn" style="
                            background:${c.color};border:none;border-radius:14px;
                            padding:16px 10px;cursor:pointer;display:flex;flex-direction:column;
                            align-items:center;gap:8px;transition:transform .15s;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
                            <i class="${c.icon}" style="font-size:20px;color:${c.icolor};"></i>
                            <span style="font-size:12px;font-weight:700;color:#2d3748;">${c.label}</span>
                        </button>
                    `).join('')}
                </div>
                <button class="btn-modal-primary" id="cta-next">
                    <i class="fas fa-arrow-right" style="margin-right:8px;"></i>Davom etish
                </button>
            `);
            document.getElementById('cta-next').addEventListener('click', () => {
                showSuccess('Profil aktivlashtirildi! 🎉', 'Siz endi yordamchi sifatida ro\'yxatdasiz. Yangi topshiriqlar haqida bildirishnomalar olasiz.');
            });
        });
    }

    // Initial render
    applyRoleCustomization();
    renderPodium();
});






// Yo7w!-SI538#
