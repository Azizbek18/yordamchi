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
    const role = currentUser.role || 'helper';

    // ── Apply Role-Specific Sidebar & Labels on Load ─────────────
    initializeRoleSidebar(role);

    // ── Simulated Live Tracking Synchronization ─────────────────
    let startTime = localStorage.getItem('kuzatish_start_time_default_1');
    if (!startTime) {
        startTime = Date.now();
        localStorage.setItem('kuzatish_start_time_default_1', startTime);
    } else {
        startTime = parseInt(startTime, 10);
    }

    // Reset button for demo testing purposes
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Kuzatuvni qaytadan boshlash 🔄";
    resetBtn.style = "position:fixed; bottom:20px; left:20px; z-index:9999; padding:8px 14px; border-radius:30px; border:1px solid #e2e8f0; background:white; font-size:11.5px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.08); font-family:inherit;";
    document.body.appendChild(resetBtn);
    resetBtn.addEventListener("click", () => {
        localStorage.setItem('kuzatish_start_time_default_1', Date.now());
        window.location.reload();
    });

    const path = document.querySelector('.dashed-path');
    const marker = document.getElementById('helperMarker');
    const distText = document.querySelector('.c-meta-row');

    function animate() {
        const elapsed = Date.now() - startTime;
        let fraction = elapsed / 60000; // 60 seconds duration
        if (fraction > 1) fraction = 1;

        // 1. Move SVG Marker along path
        if (path && marker) {
            const length = path.getTotalLength();
            const pt = path.getPointAtLength(fraction * length);
            marker.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
        }

        // 2. Update distance label
        if (distText) {
            if (role === 'helper') {
                if (fraction >= 1) {
                    distText.innerHTML = '<span class="icon">📍</span> Yetib keldingiz! 🎉';
                } else {
                    const distVal = (1.2 * (1 - fraction)).toFixed(2);
                    distText.innerHTML = `<span class="icon">📍</span> Manzilgacha ${distVal} km qoldi`;
                }
            } else {
                if (fraction >= 1) {
                    distText.innerHTML = '<span class="icon">🚚</span> Jasur yetib keldi! 🎉';
                } else {
                    const distVal = (1.2 * (1 - fraction)).toFixed(2);
                    distText.innerHTML = `<span class="icon">🚚</span> Sizdan ${distVal} km uzoqlikda`;
                }
            }
        }

        // 3. Update progress steps
        const stepDots = document.querySelectorAll('.step-dot');
        const stepInfos = document.querySelectorAll('.step-info span, .step-info .sub-link');
        
        if (fraction >= 1) {
            // Jarayon davom etmoqda -> done
            if (stepDots[2]) {
                stepDots[2].className = "step-dot done";
                stepDots[2].textContent = "✓";
            }
            if (stepInfos[2]) {
                stepInfos[2].textContent = role === 'helper' ? "Manzilga yetib keldingiz" : "Jasur manzilga yetib keldi";
                stepInfos[2].className = "";
            }

            // Yakunlandi -> active
            if (stepDots[3]) {
                stepDots[3].className = "step-dot active";
                stepDots[3].textContent = "●";
            }
            if (stepInfos[3]) {
                stepInfos[3].textContent = "Tasdiqlanishi kutilmoqda";
            }
        }

        // 4. Update dynamic live log feed
        updateLiveLogs(fraction);

        // 5. If finished, handle employer completion button
        if (fraction >= 1) {
            handleCompletionActions();
        } else {
            requestAnimationFrame(animate);
        }
    }

    function updateLiveLogs(fraction) {
        const feedCard = document.querySelector('.feed-card');
        if (!feedCard) return;

        let html = '<div class="card-title">🔄 Jonli xabarlar</div>';
        
        if (fraction >= 1) {
            html += `
              <div class="feed-item">
                  <div class="feed-icon">🎉</div>
                  <div class="feed-text">
                      <h4>${role === 'helper' ? "Manzilga yetib keldingiz" : "Jasur manzilga yetib keldi"}</h4>
                      <p>Topshiriq bajarilishi boshlanishi kutilmoqda</p>
                  </div>
                  <span class="feed-time">Hozir</span>
              </div>
            `;
        }
        if (fraction >= 0.7) {
            html += `
              <div class="feed-item">
                  <div class="feed-icon">📍</div>
                  <div class="feed-text">
                      <h4>${role === 'helper' ? "Manzilga yaqinlashmoqdasiz" : "Jasur mahallangizga yaqinlashmoqda"}</h4>
                      <p>Masofa: ~300 metr</p>
                  </div>
                  <span class="feed-time">Yaqinda</span>
              </div>
            `;
        }
        if (fraction >= 0.3) {
            html += `
              <div class="feed-item">
                  <div class="feed-icon">🚴</div>
                  <div class="feed-text">
                      <h4>${role === 'helper' ? "Yo'lga chiqdingiz" : "Jasur yo'lga chiqdi"}</h4>
                      <p>Kutilayotgan yetib kelish vaqti: 10:55</p>
                  </div>
                  <span class="feed-time">10:35</span>
              </div>
            `;
        }
        html += `
          <div class="feed-item">
              <div class="feed-icon">✅</div>
              <div class="feed-text">
                  <h4>Ijrochi tasdiqlandi</h4>
                  <p>Tizim tomonidan Jasur tanlandi</p>
              </div>
              <span class="feed-time">10:30</span>
          </div>
        `;
        
        if (feedCard.innerHTML !== html) {
            feedCard.innerHTML = html;
        }
    }

    let completionActionBound = false;
    function handleCompletionActions() {
        if (completionActionBound) return;
        completionActionBound = true;

        const sidebar = document.querySelector('.contractor-card');
        if (!sidebar) return;

        // Remove cancel button
        const cancelBtn = sidebar.querySelector('.cancel-btn');
        if (cancelBtn) cancelBtn.remove();

        if (role === 'poster') {
            // Employer sees "Confirm & Pay" button
            const confirmBtn = document.createElement("button");
            confirmBtn.className = "btn-modal-primary";
            confirmBtn.id = "btnConfirmCompletion";
            confirmBtn.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>Ishni qabul qilish';
            confirmBtn.style = "background:#006653; width:100%; border-radius:12px; padding:12px; border:none; color:white; font-size:14px; font-weight:700; cursor:pointer; margin-top:12px; transition:all 0.2s; font-family:inherit;";
            
            confirmBtn.addEventListener("click", () => {
                showToast("Ish muvaffaqiyatli qabul qilindi! To'lov Jasurning hamyoniga o'tkazildi. Rahmat! 🎉");
                confirmBtn.disabled = true;
                confirmBtn.textContent = "Qabul qilindi";
                confirmBtn.style.background = "#718096";

                // Update steps to complete
                const stepDots = document.querySelectorAll('.step-dot');
                if (stepDots[3]) {
                    stepDots[3].className = "step-dot done";
                    stepDots[3].textContent = "✓";
                }
                const stepInfos = document.querySelectorAll('.step-info span');
                if (stepInfos[3]) {
                    stepInfos[3].textContent = "Muvaffaqiyatli yakunlandi";
                }

                setTimeout(() => {
                    window.location.href = "baholash.html";
                }, 1600);
            });
            sidebar.appendChild(confirmBtn);
        } else {
            // Helper sees info status
            const statusInfo = document.createElement("div");
            statusInfo.style = "background:#f0fff4; border:1px dashed #38a169; border-radius:12px; padding:10px 12px; font-size:12.5px; color:#276749; font-weight:600; margin-top:12px; text-align:center; font-family:inherit;";
            statusInfo.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Buyurtmachi ishni qabul qilishi kutilmoqda...';
            sidebar.appendChild(statusInfo);
        }
    }

    function initializeRoleSidebar(role) {
        const cAvatar = document.querySelector('.c-avatar');
        const cName = document.querySelector('.c-name');
        const cStars = document.querySelector('.c-stars');
        const cMetaRows = document.querySelectorAll('.c-meta-row');
        const noteBox = document.querySelector('.note-box');
        const callTitle = document.querySelector('#callModal h2');
        const chatHeaderName = document.querySelector('.chat-header-info h4');
        const chatHeaderStatus = document.querySelector('.chat-header-info span');
        const chatHeaderAv = document.querySelector('.chat-header-av');

        if (role === 'helper') {
            // Helper sees client (Xurmo Saidova)
            if (cAvatar) {
                cAvatar.innerHTML = 'X<span class="c-online"></span>';
                cAvatar.style.background = '#805ad5'; // Purple/Indigo for client profile
            }
            if (cName) cName.textContent = 'Xurmo Saidova';
            if (cStars) cStars.innerHTML = '★ 4.8 <span style="color:#888">(15 ta sharh)</span>';
            if (cMetaRows[0]) cMetaRows[0].innerHTML = '<span class="icon">📍</span> Yunusobod 7-mavze, 4-uy';
            if (cMetaRows[1]) cMetaRows[1].innerHTML = '<span class="icon">🛡️</span> To\'lov muzlatilgan (Xavfsiz)';
            if (noteBox) noteBox.textContent = 'Iltimos, kelishdan oldin telefon qilib yuboring, eshik qo\'ng\'irog\'i ishlamayapti.';

            if (callTitle) callTitle.textContent = '📞 Xurmo Saidova';
            const targetPhone = document.querySelector('#callModal div[style*="font-size:1.3rem"]');
            if (targetPhone) targetPhone.textContent = '+998 93 321 45 67';

            if (chatHeaderName) chatHeaderName.textContent = 'Xurmo Saidova';
            if (chatHeaderStatus) chatHeaderStatus.textContent = '🟢 Online – Buyurtmachi';
            if (chatHeaderAv) {
                chatHeaderAv.textContent = 'XS';
                chatHeaderAv.style.background = '#805ad5';
            }
            
            // Adjust tracking map labels perspective
            const homeLabel = document.querySelector('text[x="318"]');
            if (homeLabel) homeLabel.textContent = "Buyurtmachi (Uy)";
            
            const helperLabel = document.querySelector('#helperMarker text[x="20"]');
            if (helperLabel) helperLabel.textContent = "Siz (Yo'lda)";
        }
    }

    // Modal controls (preserve previous functionality)
    window.openModal = function(id) {
        document.getElementById(id).classList.add('open');
    };
    
    window.closeModal = function(id) {
        document.getElementById(id).classList.remove('open');
    };

    window.sendMsg = function() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;
        
        const chatBody = document.getElementById('chatBody');
        const msg = document.createElement('div');
        msg.className = 'chat-msg me';
        msg.textContent = text;
        chatBody.appendChild(msg);
        
        input.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;
        
        setTimeout(() => {
            showToast("Xabar yuborildi");
        }, 300);
    };

    window.confirmCancelTask = function() {
        closeModal('cancelModal');
        showToast("Vazifa bekor qilindi");
        setTimeout(() => {
            window.location.href = role === 'poster' ? 'poster.html' : 'vazifa.html';
        }, 1200);
    };

    window.confirmCall = function() {
        closeModal('callModal');
        showToast("Qo'ng'iroq ulanmoqda... 📞");
    };

    // Start simulated loop
    animate();
});
