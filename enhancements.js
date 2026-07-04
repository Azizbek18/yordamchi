/* ============================================
   YANGI MO'JIZA — Enhancements JS
   Premium interactions: scroll-reveal, ripple,
   counters, magnetic buttons, stagger, etc.
   Non-destructive — wraps around existing code.

   ⚠️ PERFORMANCE: Skip heavy effects on map page
   ============================================ */
(function () {
    'use strict';

    // ── Skip heavy effects on map.html ────────────
    // The map page uses Leaflet which has its own
    // rendering pipeline. IntersectionObserver,
    // magnetic buttons, tilt effects, and page
    // transitions conflict with map performance.
    var isMapPage = /map\.html$/i.test(window.location.pathname);
    if (isMapPage) {
        // Only load keyboard focus (lightweight)
        (function initKeyboardFocus() {
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
                    document.body.classList.add('xm-keyboard');
                }
            });
            document.addEventListener('mousedown', function () {
                document.body.classList.remove('xm-keyboard');
            });
        })();
        return; // ← Exit early, skip everything else
    }

    /* ---------- 1. SCROLL-REVEAL via IntersectionObserver ---------- */
    function initScrollReveal() {
        var targets = document.querySelectorAll(
            '.task-card, .category-item, .safety-item, .step-card, ' +
            '.metric-item, .stat-users, .stat-meta, .hero-text, .hero-preview, ' +
            '.section-header, .footer-about, .footer-links, .footer-bottom, ' +
            '.card, .stat-card, .info-card, .listing-card, .helper-card, ' +
            '.baholash-card, .kuzatish-card, .poster-card, .daromad-card, ' +
            '.chat-item, .muammo-card, .natija-card, .onboarding-card, ' +
            '.bildirishnoma-card, .profile-card, .notification-item'
        );

        targets.forEach(function (el, idx) {
            el.setAttribute('data-reveal', 'fade');
            var parent = el.parentElement;
            if (parent) {
                var siblings = Array.from(parent.children).filter(function (c) { return c.hasAttribute('data-reveal'); });
                var localIdx = siblings.indexOf(el);
                el.style.setProperty('--xm-reveal-delay', (localIdx * 60) + 'ms');
            }
        });

        if (!('IntersectionObserver' in window)) {
            targets.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        targets.forEach(function (el) { observer.observe(el); });
    }

    /* ---------- 2. NAVBAR SCROLL STATE ---------- */
    function initNavbarScroll() {
        var nav = document.querySelector('.navbar, .header, .topbar, .app-header');
        if (!nav) return;
        var update = function () {
            if (window.scrollY > 8) {
                nav.classList.add('is-scrolled');
            } else {
                nav.classList.remove('is-scrolled');
            }
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ---------- 3. RIPPLE EFFECT on buttons & links ---------- */
    function initRipple() {
        var selectors = '.btn-primary, .btn-action-link, .btn-dark, .btn-outline, .btn-login, .see-all';
        document.addEventListener('pointerdown', function (e) {
            var btn = e.target.closest(selectors);
            if (!btn) return;
            var rect = btn.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            btn.style.setProperty('--xm-ripple-x', x + '%');
            btn.style.setProperty('--xm-ripple-y', y + '%');
        });
    }

    /* ---------- 4. COUNT-UP ANIMATION for stats ---------- */
    function animateCounter(el) {
        var text = el.textContent.trim();
        var match = text.match(/^([\D]*)([\d.,]+)([\D]*)$/);
        if (!match) return;

        var prefix = match[1] || '';
        var numStr = match[2];
        var suffix = match[3] || '';
        var hasComma = numStr.indexOf(',') !== -1;
        var hasDot = numStr.indexOf('.') !== -1;
        var raw = numStr.replace(/,/g, '');
        var target = parseFloat(raw);
        if (isNaN(target)) return;

        var decimals = hasDot ? (numStr.split('.')[1] || '').length : 0;
        var duration = 1400;
        var startTime = performance.now();

        function frame(now) {
            var t = Math.min((now - startTime) / duration, 1);
            var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            var current = target * eased;
            var displayValue;
            if (decimals > 0) {
                displayValue = current.toFixed(decimals);
            } else {
                displayValue = Math.round(current).toString();
            }
            if (hasComma) {
                displayValue = displayValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            el.textContent = prefix + displayValue + suffix;
            if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function initCounters() {
        var selectors = '.metric-item h3, .stat-meta h4, .stat-value, [data-counter]';
        var counters = document.querySelectorAll(selectors);
        if (!counters.length) return;

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCounter);
            return;
        }

        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function (c) { obs.observe(c); });
    }

    /* ---------- 5. MAGNETIC BUTTONS (subtle hover follow) ---------- */
    function initMagnetic() {
        if (window.matchMedia('(hover: none)').matches) return;
        var selectors = '.btn-primary, .btn-dark, .logo-icon, .avatar-nav';
        document.querySelectorAll(selectors).forEach(function (el) {
            el.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
            el.addEventListener('mousemove', function (e) {
                var rect = el.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                var strength = 0.2;
                el.style.transform = 'translate(' + (x * strength) + 'px, ' + (y * strength) + 'px)';
            });
            el.addEventListener('mouseleave', function () {
                el.style.transform = '';
            });
        });
    }

    /* ---------- 6. SMOOTH PAGE FADE-OUT on internal navigation ---------- */
    function initPageTransitions() {
        document.addEventListener('click', function (e) {
            var link = e.target.closest('a');
            if (!link) return;
            var href = link.getAttribute('href');
            if (!href) return;
            if (link.target === '_blank') return;
            if (href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
            if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
                try {
                    var url = new URL(href);
                    if (url.origin !== window.location.origin) return;
                } catch (_) { return; }
            }
            if (href.endsWith('.html') || href === '/' || href === '' || href.indexOf('./') === 0 || href.indexOf('../') === 0) {
                e.preventDefault();
                document.body.style.transition = 'opacity 0.18s ease';
                document.body.style.opacity = '0';
                setTimeout(function () {
                    window.location.href = link.href;
                }, 180);
            }
        });
    }

    /* ---------- 7. SUBTLE 3D TILT on premium cards ---------- */
    function initTilt() {
        if (window.matchMedia('(hover: none)').matches) return;
        var selectors = '.phone-mockup, .task-card, .safety-item, .listing-card, .helper-card';
        document.querySelectorAll(selectors).forEach(function (el) {
            var raf = null;
            el.addEventListener('mousemove', function (e) {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(function () {
                    var rect = el.getBoundingClientRect();
                    var x = (e.clientX - rect.left) / rect.width - 0.5;
                    var y = (e.clientY - rect.top) / rect.height - 0.5;
                    var rotY = x * 4;
                    var rotX = -y * 4;
                    el.style.transform = 'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateY(-4px)';
                });
            });
            el.addEventListener('mouseleave', function () {
                if (raf) cancelAnimationFrame(raf);
                el.style.transform = '';
            });
        });
    }

    /* ---------- 8. AUTO-HIDE shimmer placeholders ---------- */
    function initShimmer() {
        var shimmers = document.querySelectorAll('.xm-shimmer');
        shimmers.forEach(function (s) {
            setTimeout(function () { s.classList.remove('xm-shimmer'); }, 2500);
        });
    }

    /* ---------- 9. KEYBOARD ENHANCEMENT: focus rings ---------- */
    function initKeyboardFocus() {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
                document.body.classList.add('xm-keyboard');
            }
        });
        document.addEventListener('mousedown', function () {
            document.body.classList.remove('xm-keyboard');
        });
    }

    /* ---------- 10. INIT ALL ---------- */
    function init() {
        try {
            initScrollReveal();
            initNavbarScroll();
            initRipple();
            initCounters();
            initMagnetic();
            initPageTransitions();
            initTilt();
            initShimmer();
            initKeyboardFocus();
        } catch (err) {
            console.warn('[enhancements] init error:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();