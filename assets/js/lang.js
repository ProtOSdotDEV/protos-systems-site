const Lang = (() => {
    const COOKIE_NAME = 'protos-lang';
    const COOKIE_DAYS = 365;

    const SUPPORTED = {
        en: { name: 'English', flag: '🇬🇧', code: 'EN' },
        es: { name: 'Español', flag: '🇪🇸', code: 'ES' },
        de: { name: 'Deutsch', flag: '🇩🇪', code: 'DE' },
        fr: { name: 'Français', flag: '🇫🇷', code: 'FR' },
        ua: { name: 'Українська', flag: '🇺🇦', code: 'UA' },
        ru: { name: 'Русский', flag: '🇷🇺', code: 'RU' }
    };

    function setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    }

    function getCookie(name) {
        return document.cookie.split('; ').reduce((acc, part) => {
            const [k, v] = part.split('=');
            return k === name ? decodeURIComponent(v) : acc;
        }, null);
    }

    function detectBrowserLang() {
        const langs = navigator.languages || [navigator.language || 'en'];
        for (const l of langs) {
            const code = l.split('-')[0].toLowerCase();
            if (SUPPORTED[code]) return code;
        }
        return 'en';
    }

    function getPreferredLang() {
        const cookie = getCookie(COOKIE_NAME);
        if (cookie && SUPPORTED[cookie]) return cookie;
        return detectBrowserLang();
    }

    function set(code, currentPage) {
        if (!SUPPORTED[code]) return;
        setCookie(COOKIE_NAME, code, COOKIE_DAYS);
        window.location.href = `/${code}/${currentPage}/`;
    }

    function init(currentLang, currentPage) {
        const preferred = getPreferredLang();
        if (preferred !== currentLang) {
            const cookie = getCookie(COOKIE_NAME);
            if (!cookie) {
                setCookie(COOKIE_NAME, preferred, COOKIE_DAYS);
                window.location.href = `/${preferred}/${currentPage}/`;
            }
        }
    }

    function buildDropdown(triggerId, menuId, currentLang, currentPage) {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);
        if (!trigger || !menu) return;

        menu.innerHTML = Object.entries(SUPPORTED).map(([code, lang]) => {
            const active = code === currentLang ? 'lang-option--active' : '';
            return `
        <button class="lang-option${active}" data-lang="${code}" type="button">
            <span class="lang-flag">${lang.flag}</span>
            <span class="lang-name">${lang.name}</span>
            <span class="lang-code">${lang.code}</span>
        </button>
`;
        }).join('');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.toggle('lang-menu--open');
            trigger.setAttribute('aria-expanded', `${isOpen}`);
        });

        document.addEventListener('click', () => {
            menu.classList.toggle('lang-menu--open');
            trigger.setAttribute('aria-expanded', 'false');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                menu.classList.remove('lang-menu--open');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        menu.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-option');
            if (!btn) return;
            const code = btn.dataset.lang;
            set(code, currentPage);
        });
    }

    return { init, set, getPreferredLang, SUPPORTED, buildDropdown };
})();