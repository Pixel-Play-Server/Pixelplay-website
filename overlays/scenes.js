(function() {
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        const get = (key, fallback = '') => params.get(key) ?? fallback;
        const getBool = (key, fallback = true) => {
            const v = params.get(key);
            if (v === null) return fallback;
            return ['1','true','yes','on'].includes(String(v).toLowerCase());
        };
        const getNum = (key, fallback) => {
            const v = Number(params.get(key));
            return Number.isFinite(v) ? v : fallback;
        };
        return { params, get, getBool, getNum };
    }

    function applyTheme(theme) {
        const t = ['minimal','neon','crt','glass','pixel'].includes(theme) ? theme : 'minimal';
        document.body.classList.add(`theme-${t}`);
        document.title = `Pixelplay · ${t}`;
        if (t === 'crt') document.body.classList.add('scanlines');
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined) el.textContent = value;
    }

    function choosing({ get, getNum }) {
        setText('brandText', get('brand', 'Joacoorandom'));
        setText('headline', get('headline', 'Escogiendo juego...'));
        setText('subline', get('subline', 'Volvemos en instantes.'));
        const list = (get('games', 'Minecraft,Valorant,Fortnite,GTA V')).split(',').map(s => s.trim()).filter(Boolean);
        const rotator = document.getElementById('rotator');
        let idx = 0;
        const intervalS = getNum('rotate_s', 3);
        function showNext() {
            if (!list.length) return;
            rotator.classList.remove('fade');
            // next frame to restart animation
            requestAnimationFrame(() => {
                rotator.textContent = list[idx % list.length];
                rotator.classList.add('fade');
                idx++;
            });
        }
        showNext();
        setInterval(showNext, Math.max(1, intervalS) * 1000);
    }

    function formatTime(total) {
        const s = Math.max(0, Math.floor(total));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
    }

    function runCountdown(targetSeconds, onTick, onEnd) {
        let remaining = targetSeconds;
        function tick() {
            onTick(remaining);
            remaining -= 1;
            if (remaining < 0) { onEnd && onEnd(); return; }
        }
        tick();
        return setInterval(tick, 1000);
    }

    function starting({ get, getNum }) {
        setText('brandText', get('brand', 'Joacoorandom'));
        setText('headline', get('headline', 'Empezando...'));
        setText('subline', get('subline', 'Prepara tus snacks.'));
        const seconds = getNum('countdown', 180);
        const timer = document.getElementById('timer');
        runCountdown(seconds, s => { timer.textContent = formatTime(s); }, () => {
            timer.textContent = '¡Listo!';
        });
    }

    function brb({ get, getNum }) {
        setText('brandText', get('brand', 'Joacoorandom'));
        setText('headline', get('headline', 'Ya volvemos'));
        setText('subline', get('subline', 'No te vayas.'));
        const seconds = getNum('countdown', 300);
        const timer = document.getElementById('timer');
        if (seconds > 0) {
            runCountdown(seconds, s => { timer.textContent = formatTime(s); }, () => { timer.textContent = '¡Volvimos!'; });
        } else {
            timer.classList.add('hidden');
        }
    }

    function offline({ get }) {
        setText('brandText', get('brand', 'Joacoorandom'));
        setText('headline', get('headline', 'Offline'));
        const next = get('next', 'Sígueme para próximos directos');
        setText('subline', next);
    }

    function ending({ get }) {
        setText('brandText', get('brand', 'Joacoorandom'));
        setText('headline', get('headline', 'Gracias por ver'));
        setText('subline', get('subline', 'Sígueme: @joacoorandom'));
    }

    function boot() {
        const { get, getBool, getNum } = getParams();
        applyTheme(get('theme', 'minimal'));
        const scene = document.body.dataset.scene;
        const tickerText = get('ticker', '');
        if (!tickerText) document.getElementById('ticker')?.classList.add('hidden');
        else document.getElementById('tickerScroll').textContent = tickerText;

        if (scene === 'choosing') choosing({ get, getNum });
        if (scene === 'starting') starting({ get, getNum });
        if (scene === 'brb') brb({ get, getNum });
        if (scene === 'offline') offline({ get, getBool });
        if (scene === 'ending') ending({ get, getBool });
    }

    document.addEventListener('DOMContentLoaded', boot);
})();


