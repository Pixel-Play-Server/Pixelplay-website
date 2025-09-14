(() => {
    const elements = {
        canvas: document.getElementById('bannerCanvas'),
        renderBtn: document.getElementById('renderBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        status: document.getElementById('status'),
        serverName: document.getElementById('serverName'),
        tagline: document.getElementById('tagline'),
        version: document.getElementById('version'),
        resolution: document.getElementById('resolution'),
        duration: document.getElementById('duration'),
        fps: document.getElementById('fps')
    };

    const primaryColor = '#2ecc71';
    const primaryLight = '#4be08c';
    const bgColor = '#101c14';
    const surfaceColor = 'rgba(18, 32, 24, 0.80)';
    const strokeColor = 'rgba(46,204,113,0.22)';

    let ctx = elements.canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let animationHandle = null;
    let startTimeMs = performance.now();
    let lastBlobUrl = null;

    function parseResolution(value) {
        const [w, h] = value.split('x').map(Number);
        return { width: w, height: h };
    }

    function resizeCanvas() {
        const { width, height } = parseResolution(elements.resolution.value);
        elements.canvas.width = width;
        elements.canvas.height = height;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function drawBackground(t) {
        const { width, height } = elements.canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Moving glow blobs
        const blobs = [
            { x: 0.18 + 0.02 * Math.sin(t * 0.8), y: 0.28 + 0.03 * Math.cos(t * 0.6), r: 0.36, c: primaryLight },
            { x: 0.82 + 0.03 * Math.cos(t * 0.5), y: 0.72 + 0.02 * Math.sin(t * 0.7), r: 0.42, c: '#2752c1' }
        ];
        blobs.forEach(b => {
            const cx = b.x * width;
            const cy = b.y * height;
            const radius = b.r * Math.max(width, height);
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0.0, b.c);
            grad.addColorStop(0.2, b.c + '00');
            grad.addColorStop(1.0, 'transparent');
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Subtle grid
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        const grid = Math.floor(Math.max(width, height) / 24);
        for (let x = -grid; x < width + grid; x += grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + height * 0.15, height);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawGlassPanel(t) {
        const { width, height } = elements.canvas;
        const panelWidth = Math.min(width * 0.86, 1100);
        const panelHeight = Math.min(height * 0.7, 0.7 * height);
        const x = (width - panelWidth) / 2;
        const y = (height - panelHeight) / 2;
        const radius = Math.min(16, panelHeight * 0.12);

        // Panel
        ctx.save();
        ctx.beginPath();
        roundRectPath(ctx, x, y, panelWidth, panelHeight, radius);
        ctx.fillStyle = 'rgba(18,32,24,0.55)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        // Shine sweep
        const sweepX = x + ((t * 120) % (panelWidth + 200)) - 200;
        const g = ctx.createLinearGradient(sweepX, y, sweepX + 200, y + panelHeight);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.06)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.fillRect(x, y, panelWidth, panelHeight);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        return { x, y, panelWidth, panelHeight };
    }

    function drawPills(panel, t, versionText) {
        const pad = 24;
        const baseX = panel.x + pad;
        const baseY = panel.y + panel.panelHeight - 64 - pad;
        const pills = [
            { text: `v${versionText}`, color: primaryColor },
            { text: 'Network pequeña', color: '#3fb37a' },
            { text: '24/7*', color: '#2fbf71' }
        ];
        let x = baseX;
        pills.forEach((p, i) => {
            const appear = Math.min(1, Math.max(0, (t - i * 0.15)));
            const alpha = appear * 0.95;
            const textSize = 18;
            ctx.font = `600 ${textSize}px Poppins, sans-serif`;
            const textWidth = ctx.measureText(p.text).width;
            const pillW = textWidth + 28;
            const pillH = 32;
            const y = baseY + Math.sin((t + i) * 3) * 2;
            ctx.globalAlpha = alpha;
            drawRoundedRect(x, y, pillW, pillH, 10, 'rgba(18,32,24,0.85)', strokeColor);
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, x + 14, y + 22);
            ctx.globalAlpha = 1;
            x += pillW + 10;
        });
    }

    function roundRectPath(c, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        c.moveTo(x + radius, y);
        c.arcTo(x + w, y, x + w, y + h, radius);
        c.arcTo(x + w, y + h, x, y + h, radius);
        c.arcTo(x, y + h, x, y, radius);
        c.arcTo(x, y, x + w, y, radius);
        c.closePath();
    }

    function drawRoundedRect(x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        roundRectPath(ctx, x, y, w, h, r);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }

    function drawTitle(panel, t, nameText, taglineText) {
        const titleSize = Math.max(34, Math.floor(panel.panelHeight * 0.18));
        ctx.font = `800 ${titleSize}px Poppins, sans-serif`;

        // Gradient title color
        const gx = panel.x;
        const gy = panel.y;
        const g = ctx.createLinearGradient(gx, gy, gx + panel.panelWidth, gy);
        g.addColorStop(0, '#e1f7e6');
        g.addColorStop(1, primaryLight);
        ctx.fillStyle = g;

        // Entrance from slight below
        const offset = Math.max(0, 20 - t * 20);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        const textX = panel.x + 28;
        const textY = panel.y + 60 + offset + titleSize;
        ctx.fillText(nameText, textX, textY);
        ctx.restore();

        // Tagline
        ctx.font = `500 ${Math.max(16, Math.floor(titleSize * 0.38))}px Poppins, sans-serif`;
        ctx.fillStyle = 'rgba(232, 255, 240, 0.9)';
        const appear = Math.min(1, Math.max(0, t * 1.2 - 0.2));
        ctx.globalAlpha = appear;
        ctx.fillText(taglineText, textX, textY + 26 + Math.max(0, 12 - t * 12));
        ctx.globalAlpha = 1;
    }

    function drawSparkles(panel, t) {
        const rng = mulberry32(12345);
        const count = 24;
        for (let i = 0; i < count; i++) {
            const px = panel.x + rng() * panel.panelWidth;
            const py = panel.y + rng() * panel.panelHeight;
            const pulse = (Math.sin(t * 4 + i) + 1) * 0.5;
            const size = 0.6 + pulse * 1.2;
            ctx.save();
            ctx.globalAlpha = 0.35 + pulse * 0.4;
            ctx.fillStyle = primaryLight;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function mulberry32(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function renderFrame(outputCtx, tNorm, options) {
        const name = options.serverName.trim() || 'PixelPlay.gg';
        const tagline = options.tagline.trim() || 'Network pequeña • Grande en diversión';
        const version = options.version.trim() || '1.21.1';

        // Use the main context for drawing when outputCtx === ctx
        const prevCtx = ctx;
        ctx = outputCtx;
        try {
            drawBackground(tNorm);
            const panel = drawGlassPanel(tNorm);
            drawTitle(panel, tNorm, name, tagline);
            drawPills(panel, tNorm, version);
            drawSparkles(panel, tNorm);
        } finally {
            ctx = prevCtx;
        }
    }

    function previewLoop() {
        const now = performance.now();
        const t = (now - startTimeMs) / 1000;
        const tNorm = t % Number(elements.duration.value || 6);
        renderFrame(ctx, tNorm, collectOptions());
        animationHandle = requestAnimationFrame(previewLoop);
    }

    function collectOptions() {
        return {
            serverName: elements.serverName.value,
            tagline: elements.tagline.value,
            version: elements.version.value
        };
    }

    async function ensureFontsReady() {
        if (document.fonts && document.fonts.ready) {
            try { await document.fonts.ready; } catch (_) {}
        }
    }

    async function renderGif() {
        elements.renderBtn.disabled = true;
        elements.downloadBtn.disabled = true;
        setStatus('Preparando render...', '');

        await ensureFontsReady();

        const fps = Math.max(10, Math.min(60, Number(elements.fps.value) || 30));
        const duration = Math.max(2, Math.min(12, Number(elements.duration.value) || 6));
        const totalFrames = Math.round(fps * duration);

        // Offscreen canvas for stable frames
        const off = document.createElement('canvas');
        off.width = elements.canvas.width;
        off.height = elements.canvas.height;
        const offCtx = off.getContext('2d', { willReadFrequently: false });
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';

        const gif = new GIF({
            workers: 3,
            quality: 8,
            background: bgColor,
            workerScript: 'https://unpkg.com/gif.js.optimized/dist/gif.worker.js',
            width: off.width,
            height: off.height,
            dither: 'FloydSteinberg-serpentine'
        });

        // Build frames
        for (let i = 0; i < totalFrames; i++) {
            const t = i / fps;
            renderFrame(offCtx, t, collectOptions());
            gif.addFrame(offCtx, { copy: true, delay: Math.round(1000 / fps) });
        }

        setStatus('Renderizando (0%)...', '');
        gif.on('progress', p => {
            const percent = Math.min(100, Math.max(0, Math.round(p * 100)));
            setStatus(`Renderizando (${percent}%)...`, '');
        });

        gif.on('finished', blob => {
            if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
            lastBlobUrl = URL.createObjectURL(blob);
            elements.downloadBtn.href = lastBlobUrl;
            elements.downloadBtn.download = `pixelplay-banner-${elements.canvas.width}x${elements.canvas.height}.gif`;
            elements.downloadBtn.disabled = false;
            setStatus('¡Listo! Puedes descargar el GIF.', '');
            elements.renderBtn.disabled = false;
        });

        gif.render();
    }

    function setStatus(text) {
        elements.status.textContent = text;
    }

    function attachEvents() {
        elements.renderBtn.addEventListener('click', () => {
            cancelAnimationFrame(animationHandle);
            renderGif().finally(() => {
                startTimeMs = performance.now();
                animationHandle = requestAnimationFrame(previewLoop);
            });
        });
        elements.downloadBtn.addEventListener('click', (e) => {
            if (!lastBlobUrl) e.preventDefault();
        });
        elements.resolution.addEventListener('change', () => {
            resizeCanvas();
        });
        [elements.serverName, elements.tagline, elements.version].forEach(el => {
            el.addEventListener('input', () => {
                // immediate refresh via next frame
            });
        });
        elements.duration.addEventListener('change', () => {});
        elements.fps.addEventListener('change', () => {});
        window.addEventListener('beforeunload', () => {
            if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
        });
    }

    // Initialize
    (async function init() {
        resizeCanvas();
        await ensureFontsReady();
        attachEvents();
        startTimeMs = performance.now();
        animationHandle = requestAnimationFrame(previewLoop);
    })();
})();

