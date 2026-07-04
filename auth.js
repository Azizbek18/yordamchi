const SUPABASE_URL = 'https://sqfxrscrgtgkxkoxlhus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O6TfKTFOpHoyjb6Dp1vNuA_45eezuM-';

const _supabase = typeof supabase !== 'undefined'
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const ROLE = {
    employer: 'employer',
    helper: 'helper',
    poster: 'employer'
};

const ROLE_HOME = {
    employer: 'poster.html',
    helper: 'vazifa.html'
};

const PAGE_ACCESS = {
    employer: ['poster.html', 'mahallam.html', 'profil.html', 'bildirishnoma.html', 'chatlar.html', 'kuzatish.html', 'baholash.html', 'muammo.html', 'yordam.html', 'index.html'],
    helper: ['vazifa.html', 'helper.html', 'daromad.html', 'mahallam.html', 'profil.html', 'bildirishnoma.html', 'chatlar.html', 'kuzatish.html', 'baholash.html', 'muammo.html', 'yordam.html', 'index.html']
};

const I18N = {
    uz: {
        'nav.mahallam': 'Mahallam',
        'nav.jobs': 'Ishlar',
        'nav.postJob': 'E\'lon berish',
        'nav.helpers': 'Yordamchilar',
        'nav.chat': 'Chat',
        'nav.notifications': 'Bildirishnomalar',
        'nav.profile': 'Profil',
        'nav.login': 'Kirish',
        'nav.register': 'Ro\'yxatdan o\'tish',
        'nav.logout': 'Chiqish',
        'role.employer': 'Ish beruvchi',
        'role.helper': 'Yordamchi',
        'common.loading': 'Yuklanmoqda...',
        'chat.empty': 'Suhbatni tanlang',
        'chat.type': 'Xabar yozing...',
        'chat.noChats': 'Hali suhbatlar yo\'q.',
        'chat.online': 'Online'
    },
    ru: {
        'nav.mahallam': 'Махалля',
        'nav.jobs': 'Работы',
        'nav.postJob': 'Создать объявление',
        'nav.helpers': 'Помощники',
        'nav.chat': 'Чат',
        'nav.notifications': 'Уведомления',
        'nav.profile': 'Профиль',
        'nav.login': 'Войти',
        'nav.register': 'Регистрация',
        'nav.logout': 'Выйти',
        'role.employer': 'Работодатель',
        'role.helper': 'Помощник',
        'common.loading': 'Загрузка...',
        'chat.empty': 'Выберите чат',
        'chat.type': 'Напишите сообщение...',
        'chat.noChats': 'Чатов пока нет.',
        'chat.online': 'Онлайн'
    },
    en: {
        'nav.mahallam': 'Community',
        'nav.jobs': 'Jobs',
        'nav.postJob': 'Post job',
        'nav.helpers': 'Helpers',
        'nav.chat': 'Chat',
        'nav.notifications': 'Notifications',
        'nav.profile': 'Profile',
        'nav.login': 'Log in',
        'nav.register': 'Register',
        'nav.logout': 'Log out',
        'role.employer': 'Employer',
        'role.helper': 'Helper',
        'common.loading': 'Loading...',
        'chat.empty': 'Choose a chat',
        'chat.type': 'Write a message...',
        'chat.noChats': 'No chats yet.',
        'chat.online': 'Online'
    }
};

const headerLink = document.createElement('link');
headerLink.rel = 'stylesheet';
headerLink.href = 'header.css';
document.head.appendChild(headerLink);

function normalizeRole(role) {
    return ROLE[role] || ROLE.helper;
}

function t(key) {
    const lang = getCurrentLanguage();
    const globalTrans = window.translations || (typeof translations !== 'undefined' ? translations : null);
    if (globalTrans && globalTrans[lang] && globalTrans[lang][key] !== undefined) {
        return globalTrans[lang][key];
    }
    return (I18N[lang] && I18N[lang][key]) || I18N.uz[key] || key;
}

function getCurrentLanguage() {
    return localStorage.getItem('appLanguage') || localStorage.getItem('topshiriq_lang') || 'uz';
}

async function setCurrentLanguage(lang) {
    const nextLang = ['uz', 'ru', 'en'].includes(lang) ? lang : 'uz';
    localStorage.setItem('appLanguage', nextLang);
    localStorage.setItem('topshiriq_lang', nextLang);
    document.documentElement.lang = nextLang;
    applyI18n();

    const user = getCurrentUser();
    if (user && _supabase) {
        await _supabase.from('profiles').update({ preferred_language: nextLang }).eq('id', user.id);
        saveCurrentUser({ ...user, preferred_language: nextLang });
    }
}

function applyI18n(root = document) {
    const lang = getCurrentLanguage();
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}

function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentUser');
        if (!user) return null;
        const parsed = JSON.parse(user);
        return parsed ? { ...parsed, role: normalizeRole(parsed.role) } : null;
    } catch (_) {
        return null;
    }
}

function saveCurrentUser(profile) {
    if (!profile) {
        localStorage.removeItem('currentUser');
        return;
    }

    const normalized = {
        ...profile,
        role: normalizeRole(profile.role),
        preferred_language: profile.preferred_language || getCurrentLanguage()
    };
    localStorage.setItem('currentUser', JSON.stringify(normalized));
}

function getUserFullName(user) {
    if (!user) return 'Foydalanuvchi';
    if (user.full_name) return user.full_name;
    const first = user.first_name || user.firstName || '';
    const last = user.last_name || user.lastName || '';
    if (first || last) return `${first} ${last}`.trim();
    return user.email ? user.email.split('@')[0] : 'Foydalanuvchi';
}

function getUserInitials(user) {
    const name = getUserFullName(user);
    return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
}

function splitFullName(fullName = '') {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ')
    };
}

function buildProfile(authUser, profile = {}) {
    const meta = authUser?.user_metadata || {};
    const fullName = profile.full_name || meta.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return {
        id: profile.id || authUser?.id,
        email: authUser?.email || profile.email || '',
        full_name: fullName || '',
        ...splitFullName(fullName),
        phone: profile.phone || meta.phone || '',
        city: profile.city || profile.district || meta.city || '',
        district: profile.city || profile.district || meta.city || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        role: normalizeRole(profile.role || meta.role),
        notifications_enabled: profile.notifications_enabled !== false,
        preferred_language: profile.preferred_language || meta.preferred_language || getCurrentLanguage()
    };
}

async function fetchProfile(userId, authUser = null) {
    if (!_supabase || !userId) return null;
    const { data, error } = await _supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return buildProfile(authUser, data || {});
}

function getRoleHome(role) {
    return ROLE_HOME[normalizeRole(role)] || ROLE_HOME.helper;
}

function currentPageName() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

async function requireAuth(expectedRole = null) {
    let user = getCurrentUser();

    if (!user && _supabase) {
        const { data } = await _supabase.auth.getUser();
        if (data?.user) {
            user = await fetchProfile(data.user.id, data.user);
            saveCurrentUser(user);
        }
    }

    if (!user) {
        window.location.href = 'kirish.html';
        return null;
    }

    if (expectedRole && user.role !== normalizeRole(expectedRole)) {
        window.location.href = getRoleHome(user.role);
        return null;
    }

    const page = currentPageName();
    const allowed = PAGE_ACCESS[user.role] || [];
    if (page !== 'onboarding.html' && allowed.length && !allowed.includes(page)) {
        window.location.href = getRoleHome(user.role);
        return null;
    }

    return user;
}

async function logoutUser() {
    saveCurrentUser(null);
    if (_supabase) await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

async function updateProfileSettings(updates) {
    const user = getCurrentUser();
    if (!user) return null;

    const next = { ...user, ...updates };
    saveCurrentUser(next);

    if (_supabase) {
        const payload = {
            first_name: next.first_name || null,
            last_name: next.last_name || null,
            full_name: next.full_name || getUserFullName(next),
            phone: next.phone || null,
            district: next.district || next.city || null,
            address: next.address || null,
            bio: next.bio || null,
            avatar_url: next.avatar_url || null,
            notifications_enabled: next.notifications_enabled !== false,
            preferred_language: next.preferred_language || getCurrentLanguage()
        };
        await _supabase.from('profiles').update(payload).eq('id', user.id);
    }

    window.dispatchEvent(new CustomEvent('profile:updated', { detail: next }));
    return next;
}

async function openChatWith(otherUserId, jobId = null) {
    const me = getCurrentUser();
    if (!me) {
        window.location.href = 'kirish.html';
        return;
    }
    if (!otherUserId || otherUserId === me.id) return;
    sessionStorage.setItem('chatPeerId', otherUserId);
    if (jobId) sessionStorage.setItem('chatJobId', jobId);
    window.location.href = 'chatlar.html';
}

function renderUnifiedHeader(user = getCurrentUser()) {
    const existing = document.querySelector('header.navbar, body > .navbar, body > nav, header, .main-nav-header');
    if (!existing) return;

    const role = normalizeRole(user?.role);
    const initials = user ? getUserInitials(user) : '';
    const lang = getCurrentLanguage();
    const roleNav = role === 'employer'
        ? `<a href="poster.html" data-i18n="nav.postJob">${t('nav.postJob')}</a><a href="mahallam.html" data-i18n="nav.helpers">${t('nav.helpers')}</a>`
        : `<a href="vazifa.html" data-i18n="nav.jobs">${t('nav.jobs')}</a><a href="helper.html" data-i18n="role.helper">${t('role.helper')}</a>`;

    existing.className = 'navbar';
    existing.innerHTML = `
        <div class="nav-container">
            <a href="index.html" class="logo">
                <span class="logo-icon"><i class="fas fa-handshake"></i></span> Topshiriq.uz
            </a>
            <nav class="nav-menu">
                <a href="mahallam.html" data-i18n="nav.mahallam">${t('nav.mahallam')}</a>
                ${user ? roleNav : `<a href="vazifa.html" data-i18n="nav.jobs">${t('nav.jobs')}</a>`}
                <a href="chatlar.html" data-i18n="nav.chat">${t('nav.chat')}</a>
                <a href="yordam.html">Yordam</a>
            </nav>
            <div class="nav-actions">
                <select class="language-select" id="languageSelect" aria-label="Til">
                    <option value="uz" ${lang === 'uz' ? 'selected' : ''}>UZ</option>
                    <option value="ru" ${lang === 'ru' ? 'selected' : ''}>RU</option>
                    <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
                </select>
                ${user ? `
                    <a href="bildirishnoma.html" class="notification-link" aria-label="${t('nav.notifications')}"><i class="far fa-bell"></i></a>
                    <a href="profil.html" class="avatar-nav" title="${t('nav.profile')}">${initials}</a>
                    <button class="logout-btn" type="button" id="logoutBtn">${t('nav.logout')}</button>
                ` : `
                    <a href="kirish.html" class="btn-login" data-i18n="nav.login">${t('nav.login')}</a>
                    <a href="register.html" class="btn-primary" data-i18n="nav.register">${t('nav.register')}</a>
                `}
            </div>
        </div>
    `;

    const path = currentPageName();
    existing.querySelectorAll('.nav-menu a').forEach(link => {
        if (link.getAttribute('href') === path) link.classList.add('active');
    });

    existing.querySelector('#languageSelect')?.addEventListener('change', e => setCurrentLanguage(e.target.value));
    existing.querySelector('#logoutBtn')?.addEventListener('click', logoutUser);
    applyI18n(existing);
}

document.addEventListener('DOMContentLoaded', async () => {
    let user = getCurrentUser();
    const publicPages = ['index.html', 'kirish.html', 'register.html', 'yordam.html', ''];
    const page = currentPageName();

    if (!user && _supabase) {
        const { data } = await _supabase.auth.getUser();
        if (data?.user) {
            try {
                user = await fetchProfile(data.user.id, data.user);
                saveCurrentUser(user);
            } catch (err) {
                console.error('Profile fetch error:', err);
            }
        }
    }

    renderUnifiedHeader(user);
    applyI18n();

    if (!publicPages.includes(page)) {
        await requireAuth();
    }

    if (user) {
        const profileName = document.getElementById('profileName');
        if (profileName) profileName.textContent = getUserFullName(user);
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && !profileAvatar.classList.contains('has-photo')) profileAvatar.textContent = getUserInitials(user);
    }
});
