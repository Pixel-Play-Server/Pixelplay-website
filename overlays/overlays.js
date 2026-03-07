(function() {
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        const get = (key, fallback = '') => params.get(key) ?? fallback;
        const getBool = (key, fallback = true) => {
            const v = params.get(key);
            if (v === null) return fallback;
            return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
        };
        return { params, get, getBool };
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined) el.textContent = value;
    }

    function toggle(id, show) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('hidden', !show);
    }

    function applyTheme(theme) {
        const t = ['minimal', 'neon', 'crt', 'glass', 'pixel'].includes(theme) ? theme : 'minimal';
        document.body.classList.add(`theme-${t}`);
        document.title = `Pixelplay Overlay · ${t}`;
    }

    function boot() {
        const { get, getBool } = getParams();

        // Theme
        applyTheme(get('theme', 'minimal'));

        // Textos
        setText('brandText', get('brand', 'Joacoorandom'));
        setText('statusText', get('status', 'EN VIVO'));
        setText('ltTitle', get('title', ''));
        setText('ltSubtitle', get('subtitle', ''));
        setText('ltSocials', get('socials', ''));
        setText('chatHeaderText', get('chat_title', 'CHAT'));
        setText('webcamLabel', get('cam_label', 'WEBCAM'));
        setText('tickerScroll', get('ticker', 'Síguenos: pixelplay.gg | Twitter: @pixelplay'));

        // Visibilidad
        toggle('topbar', getBool('show_topbar', true));
        toggle('lowerThird', getBool('show_lower_third', false));
        toggle('chat', getBool('show_chat', false));
        toggle('webcam', getBool('show_cam', false));
        toggle('ticker', getBool('show_ticker', false));

        // Tamaños y posiciones opcionales
        const ltX = get('lt_x');
        const ltY = get('lt_y');
        const ltW = get('lt_w');
        if (ltX) document.getElementById('lowerThird').style.left = ltX;
        if (ltY) document.getElementById('lowerThird').style.bottom = ltY;
        if (ltW) document.getElementById('lowerThird').style.maxWidth = ltW;

        const camW = get('cam_w');
        const camH = get('cam_h');
        if (camW) document.getElementById('webcam').style.width = camW;
        if (camH) document.getElementById('webcam').style.height = camH;
    }

    document.addEventListener('DOMContentLoaded', boot);
})();


