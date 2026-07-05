
document.addEventListener("DOMContentLoaded", () => {
    const editProfileBtn = document.querySelector(".btn-edit-profile");
    const editAvatarBtn = document.getElementById("editAvatarBtnTrigger");
    const avatarFileInput = document.getElementById("avatarFileInput");
    const skillTags = document.querySelectorAll(".skills-tags .tag");
    const dayBoxes = document.querySelectorAll(".week-calendar .day-box");

    // Avatarni (rasm yoki harflar) yagona joydan boshqarish
    function renderAvatar(user) {
        const avatarEl = document.getElementById("profileAvatar");
        if (!avatarEl) return;

        const spinner = avatarEl.querySelector(".avatar-upload-spinner");
        const spinnerHtml = spinner ? spinner.outerHTML : '<span class="avatar-upload-spinner"><i class="fa-solid fa-spinner fa-spin"></i></span>';

        if (user && user.avatar_url) {
            avatarEl.style.setProperty("background-image", `url('${user.avatar_url}')`, "important");
            avatarEl.style.setProperty("--avatar-image", `url('${user.avatar_url}')`);
            avatarEl.classList.add("has-photo");
            avatarEl.innerHTML = spinnerHtml;
        } else {
            avatarEl.style.removeProperty("background-image");
            avatarEl.style.removeProperty("--avatar-image");
            avatarEl.classList.remove("has-photo");
            avatarEl.innerHTML = getUserInitials(user) + spinnerHtml;
        }
    }
    window.renderAvatar = renderAvatar;

    // 0. Foydalanuvchi ma'lumotlari bilan profilni yangilash
    if (typeof getCurrentUser === "function") {
        const user = getCurrentUser();
        if (user) {
            const fullName = getUserFullName(user);
            const nameEl = document.getElementById("profileName");
            const navBtn = document.getElementById("navProfileBtn");
            const subtitleEl = document.getElementById("profileSubtitle");

            if (fullName && nameEl) nameEl.textContent = fullName;
            renderAvatar(user);
            if (navBtn) navBtn.innerHTML = `${getUserInitials(user)} Profil`;
            const district = user.district || '';
            if (subtitleEl && district) {
                const roleLabel = user.role === 'helper' ? "Yordamchi (Ijrochi)" : "Topshiriq beruvchi";
                subtitleEl.textContent = `${roleLabel} • ${district.charAt(0).toUpperCase() + district.slice(1)} tumani`;
            }

            // ── Dinamik Rolga oid ma'lumotlarni yuklash ───────────────────────────
            const role = user.role || 'poster';
            document.body.classList.toggle('role-employer', role !== 'helper');
            document.body.classList.toggle('role-helper', role === 'helper');
            const statNum1 = document.getElementById("stat-num-1");
            const statLabel1 = document.getElementById("stat-label-1");
            const statNum2 = document.getElementById("stat-num-2");
            const statLabel2 = document.getElementById("stat-label-2");
            const statNum3 = document.getElementById("stat-num-3");
            const statLabel3 = document.getElementById("stat-label-3");

            const metricLabel1 = document.getElementById("metric-label-1");
            const metricValue1 = document.getElementById("metric-value-1");
            const metricIcon1 = document.getElementById("metric-icon-1");
            const metricIconBox1 = document.getElementById("metric-icon-box-1");

            const metricLabel2 = document.getElementById("metric-label-2");
            const metricValue2 = document.getElementById("metric-value-2");
            const metricIcon2 = document.getElementById("metric-icon-2");
            const metricIconBox2 = document.getElementById("metric-icon-box-2");

            const interactionsTitle = document.getElementById("interactions-title");
            const interactionsList = document.getElementById("interactions-list");

            const aboutTitle = document.getElementById("about-title");
            const aboutText = document.getElementById("about-text");
            const skillsTags = document.getElementById("skills-tags");
            const rightColumnDynamicBox = document.getElementById("right-column-dynamic-box");

            if (role === 'helper') {
                // Yordamchi sozlamalari
                if (statNum1) statNum1.textContent = "67";
                if (statLabel1) statLabel1.textContent = "Ish qabul qilgan";
                if (statNum2) statNum2.innerHTML = `4.9 <i class="fa-solid fa-star icon-gold"></i>`;
                if (statLabel2) statLabel2.textContent = "Reyting";
                if (statNum3) statNum3.textContent = "2 yil";
                if (statLabel3) statLabel3.textContent = "Platformada";

                if (metricLabel1) metricLabel1.textContent = "Daromad";
                if (metricValue1) metricValue1.textContent = "4.2M so'm";
                if (metricIcon1) { metricIcon1.className = "fa-solid fa-wallet text-green"; }
                if (metricIconBox1) { metricIconBox1.className = "metric-icon-box bg-light-green"; }

                if (metricLabel2) metricLabel2.textContent = "Javob vaqti";
                if (metricValue2) metricValue2.textContent = "15 daqiqa";
                if (metricIcon2) { metricIcon2.className = "fa-regular fa-clock text-teal"; }
                if (metricIconBox2) { metricIconBox2.className = "metric-icon-box bg-light-teal"; }

                if (aboutTitle) aboutTitle.textContent = "Men haqimda";
                if (aboutText) {
                    const customAbout = localStorage.getItem('about_text_' + user.id);
                    aboutText.textContent = customAbout || "Assalomu alaykum! Ismim Jasur, 5 yillik tajribaga ega universal ustaman. Asosan elektr jihozlarini ta'mirlash, santexnika va mebel yig'ish bilan shug'ullanaman. Qo'shnilarimga yordam berishdan hamisha xursandman. Sifat va tezlik men uchun muhim.";
                }
                if (skillsTags) {
                    skillsTags.innerHTML = `
                        <span class="tag">Elektr</span>
                        <span class="tag">Santexnika</span>
                        <span class="tag">Mebel yig'ish</span>
                        <span class="tag">Maishiy texnika</span>
                    `;
                }

                if (interactionsTitle) interactionsTitle.textContent = "Kimlardan ish olgan";
                if (interactionsList) {
                    interactionsList.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f7faf9; border-radius:12px; border-left:4px solid #006653;">
                            <div>
                                <strong style="font-size:14px; color:#2d3748;">Lola opa (Chilonzor)</strong>
                                <div style="font-size:12px; color:#718096; margin-top:2px;">"Aptekadan dori olib kelish"</div>
                            </div>
                            <span style="font-size:12px; font-weight:700; color:#006653; background:#e6f7f2; padding:4px 8px; border-radius:8px;">Bajarilgan</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f7faf9; border-radius:12px; border-left:4px solid #006653;">
                            <div>
                                <strong style="font-size:14px; color:#2d3748;">Akmal aka (Yunusobod)</strong>
                                <div style="font-size:12px; color:#718096; margin-top:2px;">"Samsung muzlatgichni ta'mirlash"</div>
                            </div>
                            <span style="font-size:12px; font-weight:700; color:#006653; background:#e6f7f2; padding:4px 8px; border-radius:8px;">Bajarilgan</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f7faf9; border-radius:12px; border-left:4px solid #006653;">
                            <div>
                                <strong style="font-size:14px; color:#2d3748;">Sardor (Yakkasaroy)</strong>
                                <div style="font-size:12px; color:#718096; margin-top:2px;">"Printer drayverini sozlash"</div>
                            </div>
                            <span style="font-size:12px; font-weight:700; color:#006653; background:#e6f7f2; padding:4px 8px; border-radius:8px;">Bajarilgan</span>
                        </div>
                    `;
                }
            } else {
                // Ish beruvchi (Poster) sozlamalari
                if (statNum1) statNum1.textContent = "24";
                if (statLabel1) statLabel1.textContent = "Topshiriq bergan";
                if (statNum2) statNum2.innerHTML = `98% <i class="fa-solid fa-thumbs-up icon-blue" style="color:#2b6cb0;"></i>`;
                if (statLabel2) statLabel2.textContent = "Mijozlar roziligi";
                if (statNum3) statNum3.textContent = "1.5 yil";
                if (statLabel3) statLabel3.textContent = "Platformada";

                if (metricLabel1) metricLabel1.textContent = "Jami to'langan";
                if (metricValue1) metricValue1.textContent = "8.4M so'm";
                if (metricIcon1) { 
                    metricIcon1.className = "fa-solid fa-hand-holding-dollar"; 
                    metricIcon1.style.color = "#dd6b20";
                }
                if (metricIconBox1) { 
                    metricIconBox1.className = "metric-icon-box"; 
                    metricIconBox1.style.backgroundColor = "#fffaf0";
                }

                if (metricLabel2) metricLabel2.textContent = "Bajarilish vaqti";
                if (metricValue2) metricValue2.textContent = "2 soat (o'rtacha)";
                if (metricIcon2) { 
                    metricIcon2.className = "fa-solid fa-bolt"; 
                    metricIcon2.style.color = "#d69e2e";
                }
                if (metricIconBox2) { 
                    metricIconBox2.className = "metric-icon-box"; 
                    metricIconBox2.style.backgroundColor = "#fefcbf";
                }

                if (aboutTitle) aboutTitle.textContent = "Tavsif";
                if (aboutText) {
                    const customAbout = localStorage.getItem('about_text_' + user.id);
                    if (customAbout) {
                        aboutText.textContent = customAbout;
                        aboutText.style.fontStyle = "normal";
                        aboutText.style.color = "inherit";
                    } else {
                        aboutText.innerHTML = `<span id="about-prompt" style="color:#718096; font-style:italic; display:block; padding:12px; background:#f7faf9; border-radius:10px; border:1px dashed #cbd5e0; line-height:1.6;">
                            <i class="fa-solid fa-circle-info" style="color:#006653; margin-right:6px;"></i>
                            Tavsif kiritilmagan. Hisobingizni to'liq shakllantirish uchun profilingizni tahrirlang!
                        </span>`;
                    }
                }
                if (skillsTags) {
                    skillsTags.innerHTML = `
                        <span class="tag">Tozalash</span>
                        <span class="tag">Yetkazib berish</span>
                        <span class="tag">Xarid qilish</span>
                        <span class="tag">Ta'mirlash</span>
                    `;
                }

                if (rightColumnDynamicBox) {
                    rightColumnDynamicBox.innerHTML = `
                        <h2 class="box-title">Hamyon va Balans</h2>
                        <div class="employer-wallet-card">
                            <div class="wallet-label">Joriy hisob balansi</div>
                            <div class="wallet-balance">450,000 UZS</div>
                            <div class="wallet-footer">
                                <span>Xavfsiz tranzaksiya</span>
                                <span class="wallet-status">FAOL</span>
                            </div>
                            <div class="wallet-watermark"><i class="fa-solid fa-credit-card"></i></div>
                        </div>
                        <div class="employer-trust-list">
                            <div class="trust-row">
                                <i class="fa-solid fa-circle-check"></i>
                                <span>Karta ulangan: 8600 **** **** 4321</span>
                            </div>
                            <div class="trust-row">
                                <i class="fa-solid fa-shield-halved"></i>
                                <span>Mablag'lar kafolatlangan</span>
                            </div>
                        </div>
                    `;
                }

                if (interactionsTitle) interactionsTitle.textContent = "Topshiriqlarni bajarganlar";
                if (interactionsList) {
                    interactionsList.innerHTML = `
                        <div class="employer-history-item">
                            <div>
                                <strong>Jasur Ahmedov (Yordamchi)</strong>
                                <div>"Hovlidagi xazonlarni tozalash"</div>
                            </div>
                            <span>Yakunlangan</span>
                        </div>
                        <div class="employer-history-item">
                            <div>
                                <strong>Dilshod Karimov (Yordamchi)</strong>
                                <div>"Printer drayverini sozlash"</div>
                            </div>
                            <span>Yakunlangan</span>
                        </div>
                        <div class="employer-history-item">
                            <div>
                                <strong>Farrux M. (Yordamchi)</strong>
                                <div>"Aptekadan dori olib kelish"</div>
                            </div>
                            <span>Yakunlangan</span>
                        </div>
                    `;
                }

                // ── Dynamic Tour Trigger ─────────────────────────────
                const customAbout = localStorage.getItem('about_text_' + user.id);
                const tourDone = localStorage.getItem('poster_tour_done_' + user.id);
                if (!customAbout && !tourDone) {
                    setTimeout(() => {
                        startOnboardingTour();
                    }, 800);
                }
            }
        }
    }

    // 0.1 Tizimdan chiqish (async)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (typeof logoutUser === "function") {
                await logoutUser();
            }
        });
    }

    const profileLogoutBtn = document.getElementById("profileLogoutBtn");
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener("click", async () => {
            if (typeof logoutUser === "function") {
                await logoutUser();
                return;
            }
            if (typeof saveCurrentUser === "function") {
                saveCurrentUser(null);
            } else {
                localStorage.removeItem('currentUser');
            }
            if (typeof Toastify !== 'undefined') {
                Toastify({
                    text: "Tizimdan chiqildi. Xavfsiz sayohat! 👋",
                    duration: 1500,
                    style: { background: '#2d7dd2' }
                }).showToast();
            }
            setTimeout(() => {
                window.location.href = 'kirish.html';
            }, 1000);
        });
    }

    // 1. PROFIL TAHRIRLASH MODAL
    const editOverlay = document.getElementById("editProfileOverlay");
    const editModal = document.getElementById("editProfileModal");
    const closeEditModalBtn = document.getElementById("closeEditModalBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const saveEditBtn = document.getElementById("saveEditBtn");

    const editFirstName = document.getElementById("editFirstName");
    const editLastName = document.getElementById("editLastName");
    const editEmail = document.getElementById("editEmail");
    const editPhone = document.getElementById("editPhone");
    const editPassword = document.getElementById("editPassword");
    const editDistrict = document.getElementById("editDistrict");

    const editPasswordEyeBtn = document.getElementById("editPasswordEyeBtn");
    if (editPasswordEyeBtn && editPassword) {
        editPasswordEyeBtn.addEventListener("click", () => {
            const showing = editPassword.type === "text";
            editPassword.type = showing ? "password" : "text";
            editPasswordEyeBtn.innerHTML = showing
                ? '<i class="fa-regular fa-eye"></i>'
                : '<i class="fa-regular fa-eye-slash"></i>';
        });
    }

    if (editPhone) {
        editPhone.addEventListener("input", () => {
            editPhone.value = editPhone.value.replace(/\D/g, "");
        });
    }

    function clearEditErrors() {
        ["editFirstNameError", "editLastNameError", "editEmailError", "editPhoneError", "editDistrictError", "editPasswordError"]
            .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ""; });
        [editFirstName, editLastName, editEmail, editPhone, editDistrict, editPassword]
            .forEach(el => el && el.classList.remove("input-error"));
    }

    function openEditModal() {
        const user = getCurrentUser();
        clearEditErrors();

        if (user) {
            editFirstName.value = user.first_name || "";
            editLastName.value = user.last_name || "";
            editEmail.value = user.email || "";
            editDistrict.value = user.district || "";
            // Telefonni +998 dan keyingi qismini ko'rsatish
            const rawPhone = (user.phone || "").replace(/\D/g, "");
            editPhone.value = rawPhone.startsWith("998") ? rawPhone.slice(3) : rawPhone;
        }

        editPassword.value = "";
        editPassword.type = "password";
        if (editPasswordEyeBtn) editPasswordEyeBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';

        editOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeEditModal() {
        editOverlay.classList.remove("open");
        document.body.style.overflow = "";
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", openEditModal);
    }
    if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
    if (editOverlay) {
        editOverlay.addEventListener("click", (e) => {
            if (e.target === editOverlay) closeEditModal();
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && editOverlay.classList.contains("open")) closeEditModal();
    });

    if (saveEditBtn) {
        saveEditBtn.addEventListener("click", async () => {
            clearEditErrors();

            const firstName = editFirstName.value.trim();
            const lastName = editLastName.value.trim();
            const email = editEmail.value.trim();
            const phoneDigits = editPhone.value.replace(/\D/g, "");
            const district = editDistrict.value;

            let valid = true;
            function setErr(id, el, msg) {
                const errEl = document.getElementById(id);
                if (errEl) errEl.textContent = msg;
                if (msg) { valid = false; el.classList.add("input-error"); }
            }

            setErr("editFirstNameError", editFirstName, !firstName ? "Ismingizni kiriting" : "");
            setErr("editLastNameError", editLastName, !lastName ? "Familiyangizni kiriting" : "");
            setErr("editEmailError", editEmail,
                !email ? "Email manzilingizni kiriting" :
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email noto'g'ri formatda" : "");
            setErr("editPhoneError", editPhone, phoneDigits.length < 9 ? "Telefon raqamni to'liq kiriting" : "");
            setErr("editDistrictError", editDistrict, !district ? "Tumaningizni tanlang" : "");

            const newPassword = editPassword.value;
            setErr("editPasswordError", editPassword,
                newPassword && newPassword.length < 8 ? "Kamida 8 ta belgi kiriting" : "");

            if (!valid) return;

            const user = getCurrentUser();
            if (!user || !user.id) {
                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Foydalanuvchi topilmadi, qayta kiring.", style: { background: "#e53e3e" } }).showToast();
                }
                return;
            }

            const saveBtnText = saveEditBtn.querySelector(".save-btn-text");
            const saveBtnSpinner = saveEditBtn.querySelector(".save-btn-spinner");
            saveEditBtn.disabled = true;
            if (saveBtnText) saveBtnText.style.display = "none";
            if (saveBtnSpinner) saveBtnSpinner.style.display = "inline-block";

            const updatedFields = {
                full_name: `${firstName} ${lastName}`.trim(),
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: "+998" + phoneDigits,
                district: district,
                city: district,
            };

            if (newPassword) {
                updatedFields.password = newPassword;
            }

            try {
                if (!_supabase) {
                    const updatedUser = { ...user, ...updatedFields };
                    if (typeof saveCurrentUser === "function") {
                        saveCurrentUser(updatedUser);
                    } else {
                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    }
                    closeEditModal();
                    if (typeof Toastify !== "undefined") {
                        Toastify({ text: "Profil muvaffaqiyatli yangilandi! ✅", style: { background: "#006653" } }).showToast();
                    }
                    setTimeout(() => window.location.reload(), 900);
                    return;
                }

                if (newPassword) {
                    const { error: passwordError } = await _supabase.auth.updateUser({ password: newPassword });
                    if (passwordError) throw passwordError;
                }

                const savedProfile = typeof updateProfileSettings === "function"
                    ? await updateProfileSettings(updatedFields)
                    : { ...user, ...updatedFields };
                saveCurrentUser(savedProfile);
                closeEditModal();

                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Profil muvaffaqiyatli yangilandi! ✅", style: { background: "#006653" } }).showToast();
                }

                setTimeout(() => window.location.reload(), 900);
            } catch (err) {
                console.error(err);
                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Kutilmagan xatolik yuz berdi.", style: { background: "#e53e3e" } }).showToast();
                }
            } finally {
                saveEditBtn.disabled = false;
                if (saveBtnText) saveBtnText.style.display = "inline";
                if (saveBtnSpinner) saveBtnSpinner.style.display = "none";
            }
        });
    }

    // 2. PROFIL RASMINI O'ZGARTIRISH
    if (editAvatarBtn && avatarFileInput) {
        editAvatarBtn.addEventListener("click", () => {
            avatarFileInput.click();
        });

        avatarFileInput.addEventListener("change", async () => {
            const file = avatarFileInput.files[0];
            if (!file) return;

            // Fayl turi va hajmini tekshirish
            const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Faqat PNG, JPG yoki WEBP formatdagi rasm yuklang.", style: { background: "#e53e3e" } }).showToast();
                }
                avatarFileInput.value = "";
                return;
            }
            const maxSizeBytes = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSizeBytes) {
                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Rasm hajmi 5MB dan oshmasligi kerak.", style: { background: "#e53e3e" } }).showToast();
                }
                avatarFileInput.value = "";
                return;
            }

            const user = getCurrentUser();
            if (!user || !user.id) {
                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Foydalanuvchi topilmadi, qayta kiring.", style: { background: "#e53e3e" } }).showToast();
                }
                return;
            }

            const avatarEl = document.getElementById("profileAvatar");
            if (avatarEl) avatarEl.classList.add("uploading");

            try {
                const localAvatarUrl = await readFileAsDataUrl(file);
                const localUpdatedUser = { ...user, avatar_url: localAvatarUrl };
                if (typeof saveCurrentUser === "function") {
                    saveCurrentUser(localUpdatedUser);
                } else {
                    localStorage.setItem('currentUser', JSON.stringify(localUpdatedUser));
                }
                renderAvatar(localUpdatedUser);
                if (typeof refreshGlobalAvatars === "function") {
                    refreshGlobalAvatars(localUpdatedUser);
                }
                window.dispatchEvent(new CustomEvent("profile:updated", { detail: localUpdatedUser }));

                if (!_supabase) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const base64Url = e.target.result;
                        const updatedUser = { ...user, avatar_url: base64Url };
                        if (typeof saveCurrentUser === "function") {
                            saveCurrentUser(updatedUser);
                        } else {
                            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        }
                        renderAvatar(updatedUser);
                        if (typeof refreshGlobalAvatars === "function") {
                            refreshGlobalAvatars(updatedUser);
                        }
                        window.dispatchEvent(new CustomEvent("profile:updated", { detail: updatedUser }));
                        if (avatarEl) avatarEl.classList.remove("uploading");
                        if (typeof Toastify !== "undefined") {
                            Toastify({ text: "Profil rasmi yangilandi! ✅", style: { background: "#006653" } }).showToast();
                        }
                    };
                    reader.readAsDataURL(file);
                    return;
                }

                const fileExt = file.name.split(".").pop();
                const filePath = `${user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await _supabase
                    .storage
                    .from("avatars")
                    .upload(filePath, file, { upsert: true });

                if (uploadError) {
                    console.error("Avatar yuklashda xatolik:", uploadError);
                    if (typeof Toastify !== "undefined") {
                        Toastify({ text: "Rasm saqlandi. Supabase avatars bucket sozlanmagani uchun serverga yuklanmadi.", style: { background: "#006653" } }).showToast();
                    }
                    return;
                }

                const { data: publicUrlData } = _supabase
                    .storage
                    .from("avatars")
                    .getPublicUrl(filePath);

                const avatarUrl = publicUrlData.publicUrl;

                const { data: updatedProfile, error: updateError } = await _supabase
                    .from("profiles")
                    .update({ avatar_url: avatarUrl })
                    .eq("id", user.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Profilga avatar saqlashda xatolik:", updateError);
                    if (typeof Toastify !== "undefined") {
                        Toastify({ text: "Rasm saqlandi. Profil jadvaliga yozishda xatolik: " + updateError.message, style: { background: "#006653" } }).showToast();
                    }
                    return;
                }

                saveCurrentUser(updatedProfile);
                renderAvatar(updatedProfile);
                if (typeof refreshGlobalAvatars === "function") {
                    refreshGlobalAvatars(updatedProfile);
                }
                window.dispatchEvent(new CustomEvent("profile:updated", { detail: updatedProfile }));

                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Profil rasmi yangilandi! ✅", style: { background: "#006653" } }).showToast();
                }
            } catch (err) {
                console.error(err);
                if (typeof Toastify !== "undefined") {
                    Toastify({ text: "Kutilmagan xatolik yuz berdi.", style: { background: "#e53e3e" } }).showToast();
                }
            } finally {
                if (avatarEl) avatarEl.classList.remove("uploading");
                avatarFileInput.value = "";
            }
        });
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 3. TEGLARGA BOSILGANDA FAOL EFFEKT (Ixtiyoriy vizualizatsiya)
    skillTags.forEach(tag => {
        tag.addEventListener("click", () => {
            console.log(`Tanlangan mutaxassislik: ${tag.textContent}`);
            tag.style.backgroundColor = "#006653";
            tag.style.color = "#ffffff";
            setTimeout(() => {
                tag.style.backgroundColor = "#edf9f4";
                tag.style.color = "#006653";
            }, 600);
        });
    });

    // 4. ISH VAQTI KUNLARINING INTERAKTIVLIGI
    dayBoxes.forEach(box => {
        box.addEventListener("click", () => {
            const dayName = box.querySelector(".day-name").textContent;

            if (box.classList.contains("active")) {
                box.classList.remove("active");
                box.classList.add("disabled");
                const icon = box.querySelector("i");
                icon.className = "fa-solid fa-minus minus-icon";
                console.log(`${dayName} - dam olish kuni qilib belgilandi.`);
            } else {
                box.classList.remove("disabled");
                box.classList.add("active");
                const icon = box.querySelector("i");
                icon.className = "fa-solid fa-check check-icon";
                console.log(`${dayName} - ish kuni qilib belgilandi.`);
            }
        });
    });

    // 5. ONBOARDING TOUR LOGIC FOR NEW USERS (WITH HAND CURSOR POINTER)
    function startOnboardingTour() {
        const overlay = document.getElementById("tour-overlay");
        const tooltip = document.getElementById("tour-tooltip");
        const pointer = document.getElementById("tour-hand-pointer");
        
        if (!overlay || !tooltip || !pointer) return;
        
        let currentStep = 1;
        const steps = [
            {
                elementId: "editAvatarBtnTrigger",
                title: "1-Qadam: Profil rasmi",
                desc: "Profilingizga rasm (avatar) yuklash uchun ushbu qalam belgisini bosing.",
                posOffset: { x: 45, y: 10 }
            },
            {
                selector: ".btn-edit-profile",
                title: "2-Qadam: Ma'lumotlarni tahrirlash",
                desc: "Ism, familiya, telefon raqami, tumaningiz va Tavsifni to'ldirish uchun bu yerni bosing.",
                posOffset: { x: 70, y: 30 }
            },
            {
                elementId: "about-text",
                title: "3-Qadam: Tavsif yozing",
                desc: "Profilni tahrirlash oynasiga yangi 'Tavsif' maydoni qo'shildi. O'zingiz haqida yozib qoldiring!",
                posOffset: { x: 70, y: 25 }
            }
        ];
        
        function highlightElement(el) {
            document.querySelectorAll(".tour-highlight").forEach(item => item.classList.remove("tour-highlight"));
            if (el) el.classList.add("tour-highlight");
        }
        
        function showStep(stepIndex) {
            const step = steps[stepIndex - 1];
            const targetEl = step.selector ? document.querySelector(step.selector) : document.getElementById(step.elementId);
            
            if (!targetEl) {
                nextStep();
                return;
            }
            
            highlightElement(targetEl);
            overlay.style.display = "block";
            tooltip.style.display = "block";
            pointer.style.display = "block";
            
            const rect = targetEl.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            
            pointer.style.left = `${rect.left + scrollX + (step.posOffset ? step.posOffset.x : 20)}px`;
            pointer.style.top = `${rect.top + scrollY + (step.posOffset ? step.posOffset.y : 20)}px`;
            
            let tooltipLeft = rect.left + scrollX - 340;
            let tooltipTop = rect.top + scrollY - 20;
            
            if (tooltipLeft < 10) {
                tooltipLeft = rect.right + scrollX + 20;
            }
            if (tooltipTop + 180 > window.innerHeight + scrollY) {
                tooltipTop = window.innerHeight + scrollY - 200;
            }
            if (tooltipTop < 10) {
                tooltipTop = 10;
            }
            
            tooltip.style.left = `${tooltipLeft}px`;
            tooltip.style.top = `${tooltipTop}px`;
            
            document.getElementById("tour-step-title").textContent = step.title;
            document.getElementById("tour-step-desc").textContent = step.desc;
            
            const nextBtn = document.getElementById("tour-next-btn");
            if (stepIndex === steps.length) {
                nextBtn.textContent = "Tushunarli 🎉";
            } else {
                nextBtn.textContent = "Keyingi 👉";
            }
        }
        
        function nextStep() {
            currentStep++;
            if (currentStep <= steps.length) {
                showStep(currentStep);
            } else {
                endTour();
            }
        }
        
        function endTour() {
            document.querySelectorAll(".tour-highlight").forEach(item => item.classList.remove("tour-highlight"));
            overlay.style.display = "none";
            tooltip.style.display = "none";
            pointer.style.display = "none";
            const user = getCurrentUser();
            if (user) {
                localStorage.setItem('poster_tour_done_' + user.id, 'true');
            }
        }
        
        document.getElementById("tour-next-btn").onclick = nextStep;
        document.getElementById("tour-skip-btn").onclick = endTour;
        overlay.onclick = endTour;
        
        showStep(1);
    }
});
