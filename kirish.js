function showToast(text, type = 'info') {
    const colors = { success: '#006653', error: '#e53e3e', info: '#2d7dd2' };
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text,
            duration: 3200,
            gravity: 'top',
            position: 'center',
            style: { background: colors[type] || colors.info, borderRadius: '12px' }
        }).showToast();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const eyeBtn = document.getElementById('eyeBtn');
    const passwordInput = document.getElementById('password');
    const btnLoader = document.getElementById('btnLoader');
    const btnText = document.querySelector('.btn-text');
    let selectedRole = 'employer';

    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            roleCards.forEach(item => item.classList.remove('active'));
            card.classList.add('active');
            selectedRole = normalizeRole(card.dataset.role);
        });
    });

    const requestedRole = new URLSearchParams(window.location.search).get('role');
    if (requestedRole) {
        selectedRole = normalizeRole(requestedRole);
        roleCards.forEach(card => card.classList.toggle('active', normalizeRole(card.dataset.role) === selectedRole));
    }

    eyeBtn?.addEventListener('click', () => {
        const isHidden = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
    });

    document.querySelector('.forgot-link')?.addEventListener('click', e => {
        e.preventDefault();
        showToast('Parolni tiklash uchun Supabase email recovery sozlamasini yoqing.', 'info');
    });

    document.querySelector('.sms-card')?.addEventListener('click', e => {
        e.preventDefault();
        showToast('SMS kod bilan kirish tez kunda qo\'shiladi.', 'info');
    });

    loginForm?.addEventListener('submit', async e => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const emailErr = document.getElementById('emailError');
        const passErr = document.getElementById('passError');

        if (emailErr) emailErr.textContent = '';
        if (passErr) passErr.textContent = '';

        if (!email) {
            if (emailErr) emailErr.textContent = 'Email manzilingizni kiriting';
            return;
        }
        if (!password) {
            if (passErr) passErr.textContent = 'Parolni kiriting';
            return;
        }
        if (!_supabase) {
            showToast('Supabase bilan aloqa yo\'q.', 'error');
            return;
        }

        setLoading(true);

        let profile = null;
        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

        if (!error && data?.user) {
            try {
                profile = await fetchProfile(data.user.id, data.user);
            } catch (err) {
                setLoading(false);
                showToast('Profilni yuklab bo\'lmadi: ' + err.message, 'error');
                return;
            }
        }

        const errCode = error?.code || error?.error_code || '';
        if (error && errCode !== 'invalid_credentials') {
            setLoading(false);
            const friendly = {
                email_not_confirmed: 'Emailingiz hali tasdiqlanmagan. Pochtangizga (spam papkasini ham tekshiring) yuborilgan havolani bosing.',
                over_email_send_rate_limit: 'Juda ko\'p urinish qilindi. Bir necha daqiqadan so\'ng qayta urinib ko\'ring.',
                user_banned: 'Bu hisob bloklangan.'
            };

            if (errCode === 'email_not_confirmed' && emailErr) {
                emailErr.innerHTML = `${friendly[errCode]} <a href="#" id="resendConfirmLink" style="text-decoration:underline;">Qayta yuborish</a>`;
                document.getElementById('resendConfirmLink')?.addEventListener('click', async ev => {
                    ev.preventDefault();
                    const { error: resendError } = await _supabase.auth.resend({ type: 'signup', email });
                    showToast(resendError ? resendError.message : 'Tasdiqlash xati qayta yuborildi.', resendError ? 'error' : 'success');
                });
            } else if (emailErr) {
                emailErr.textContent = friendly[errCode] || '';
            }

            showToast(friendly[errCode] || error.message, 'error');
            return;
        }

        if (!profile) {
            const { data: profileRow, error: profileError } = await _supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .maybeSingle();

            if (profileError) {
                setLoading(false);
                showToast('Profilni tekshirib bo\'lmadi: ' + profileError.message, 'error');
                return;
            }

            if (profileRow) {
                const fullName = profileRow.full_name || [profileRow.first_name, profileRow.last_name].filter(Boolean).join(' ');
                const { data: signupData, error: signupError } = await _supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: normalizeRole(profileRow.role),
                            first_name: profileRow.first_name || '',
                            last_name: profileRow.last_name || '',
                            full_name: fullName,
                            phone: profileRow.phone || '',
                            district: profileRow.district || profileRow.city || '',
                            preferred_language: profileRow.preferred_language || getCurrentLanguage()
                        }
                    }
                });

                if (signupError) {
                    setLoading(false);
                    showToast('Bu profil Supabase Auth bilan bog\'lanmagan. Iltimos, parolni tiklang yoki qayta ro\'yxatdan o\'ting.', 'error');
                    return;
                }

                if (signupData?.user?.identities?.length === 0) {
                    // Supabase returns a userless "success" instead of an error when the email
                    // is already registered (anti-enumeration) -- treat it as wrong credentials.
                    setLoading(false);
                    if (emailErr) emailErr.textContent = 'Email yoki parol noto\'g\'ri';
                    return;
                }

                if (!signupData?.session) {
                    setLoading(false);
                    showToast('Auth hisob yaratildi. Email tasdiqlash yoqilgan bo\'lsa, emailingizni tasdiqlab qayta kiring.', 'info');
                    return;
                }

                profile = buildProfile(signupData.user, profileRow);
            }
        }

        setLoading(false);

        if (!profile) {
            if (emailErr) emailErr.textContent = 'Email yoki parol noto\'g\'ri';
            return;
        }

        if (profile.role !== selectedRole) {
            await _supabase.auth.signOut();
            saveCurrentUser(null);
            showToast('Tanlangan rol bu hisob profiliga mos emas.', 'error');
            return;
        }

        saveCurrentUser(profile);
        localStorage.setItem('appLanguage', profile.preferred_language || getCurrentLanguage());
        showToast(`Xush kelibsiz, ${getUserFullName(profile)}!`, 'success');
        setTimeout(() => {
            window.location.href = getRoleHome(profile.role);
        }, 600);
    });

    function setLoading(on) {
        if (btnLoader) btnLoader.style.display = on ? 'block' : 'none';
        if (btnText) btnText.style.opacity = on ? '0.5' : '1';
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = on;
    }
});
