function showRegisterToast(text, type = 'info') {
    const colors = { success: '#006653', error: '#e53e3e', info: '#2d7dd2' };
    if (typeof Toastify !== 'undefined') {
        Toastify({ text, duration: 3500, style: { background: colors[type] || colors.info } }).showToast();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let selectedRole = 'employer';

    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.role-card').forEach(item => item.classList.remove('active'));
            card.classList.add('active');
            selectedRole = normalizeRole(card.dataset.role);
        });
    });

    const eyeBtn = document.getElementById('regEyeBtn');
    const passInput = document.getElementById('reg-password');
    eyeBtn?.addEventListener('click', () => {
        passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async e => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const district = document.getElementById('district').value;
        const password = passInput.value;
        const fullName = `${firstName} ${lastName}`.trim();
        let valid = true;

        function setErr(id, msg) {
            const el = document.getElementById(id);
            if (el) el.textContent = msg;
            if (msg) valid = false;
        }

        ['firstNameError', 'lastNameError', 'emailError', 'phoneError', 'districtError', 'passError']
            .forEach(id => setErr(id, ''));

        setErr('firstNameError', !firstName ? 'Ismingizni kiriting' : '');
        setErr('lastNameError', !lastName ? 'Familiyangizni kiriting' : '');
        setErr('emailError', !email ? 'Email manzilingizni kiriting' : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Email noto\'g\'ri formatda' : ''));
        setErr('phoneError', !phone ? 'Telefon raqam kiriting' : '');
        setErr('districtError', !district ? 'Tumaningizni tanlang' : '');
        setErr('passError', password.length < 8 ? 'Kamida 8 ta belgi kiriting' : '');
        if (!valid) return;

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
        }

        if (!_supabase) {
            showRegisterToast('Supabase bilan aloqa yo\'q.', 'error');
            resetButton();
            return;
        }

        const preferredLanguage = getCurrentLanguage();
        const cleanPhone = '+998' + phone.replace(/\D/g, '');
        const { data, error } = await _supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: selectedRole,
                    full_name: fullName,
                    phone: cleanPhone,
                    city: district,
                    preferred_language: preferredLanguage
                }
            }
        });

        if (error || !data?.user) {
            showRegisterToast('Xatolik: ' + (error?.message || 'Hisob yaratilmadi'), 'error');
            resetButton();
            return;
        }

        const profilePayload = {
            id: data.user.id,
            role: selectedRole,
            full_name: fullName,
            phone: cleanPhone,
            city: district,
            preferred_language: preferredLanguage
        };

        const { data: profileData, error: profileError } = await _supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' })
            .select()
            .single();

        if (profileError) {
            showRegisterToast('Profil saqlanmadi: ' + profileError.message, 'error');
            resetButton();
            return;
        }

        const profile = buildProfile(data.user, profileData);
        saveCurrentUser(profile);
        showRegisterToast('Hisob yaratildi. Xush kelibsiz!', 'success');
        setTimeout(() => {
            window.location.href = getRoleHome(profile.role);
        }, 700);

        function resetButton() {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        }
    });
});
