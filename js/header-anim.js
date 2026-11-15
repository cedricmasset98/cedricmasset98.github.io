/* Animated header: a gold price curve drawn live on a slate background.
   The static image (images/background4.jpg, set in css/styles.css) stays as fallback. */
(function () {
    var lead = document.getElementById('lead');
    if (!lead || !window.requestAnimationFrame) return;
    var cv = document.createElement('canvas');
    cv.id = 'lead-canvas';
    cv.setAttribute('aria-hidden', 'true');
    lead.insertBefore(cv, lead.firstChild);
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W, H, N, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var INTRO = 2600, TICK = 900;

    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function gauss() { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

    var P = [], V = [], last = 100, lo, hi;
    function step() { var r = 0.0006 + 0.013 * gauss(); last *= Math.exp(r); P.push(last); V.push(Math.abs(r) * (0.6 + 0.8 * rnd())); }
    function build() {
        P = []; V = []; last = 100; seed = 7;
        for (var i = 0; i < N + 1; i++) step();
        var a = Math.floor(N * 0.35), b = Math.floor(N * 0.56);
        for (var j = a; j < N + 1; j++) P[j] *= 1 + 0.006 * (Math.min(j, b) - a) * (170 / N);
        last = P[P.length - 1];
        lo = Math.min.apply(null, P); hi = Math.max.apply(null, P);
    }
    function size() {
        W = lead.clientWidth; H = lead.clientHeight;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.max(60, Math.min(200, Math.round(W / 9)));
        if (n !== N) { N = n; build(); }
    }
    size();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });

    var t0 = performance.now(), lastTick = t0, visible = true, running = false;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(lead);
    }
    function start() { if (!running) { running = true; requestAnimationFrame(draw); } }

    function path(xs, ys, cut) { ctx.beginPath(); for (var i = 0; i < cut; i++) i ? ctx.lineTo(xs[i], ys[i]) : ctx.moveTo(xs[i], ys[i]); }

    function draw(now) {
        if (!visible) { running = false; return; }
        if (!reduce && now - t0 > INTRO && now - lastTick > TICK) { step(); P.shift(); V.shift(); lastTick = now; }
        var off = (!reduce && now - t0 > INTRO) ? Math.min(1, (now - lastTick) / TICK) : 0;
        var prog = reduce ? 1 : Math.min(1, (now - t0) / INTRO), ease = 1 - Math.pow(1 - prog, 3);
        var tlo = Math.min.apply(null, P), thi = Math.max.apply(null, P);
        lo += (tlo - lo) * 0.05; hi += (thi - hi) * 0.05;

        var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#10131b'); g.addColorStop(1, '#2e3546');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        var R = Math.max(W, H) * 0.5, rg = ctx.createRadialGradient(W / 2, H * 0.85, 0, W / 2, H * 0.85, R);
        rg.addColorStop(0, 'rgba(80,92,120,0.35)'); rg.addColorStop(1, 'rgba(80,92,120,0)');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(170,180,200,0.07)'; ctx.lineWidth = 1;
        var cols = Math.round(W / 60);
        for (var c = 0; c <= cols; c++) { var x = c * W / cols; ctx.beginPath(); ctx.moveTo(x, H * 0.5); ctx.lineTo(x, H); ctx.stroke(); }
        for (var r = 0; r <= 7; r++) { var y = H * 0.5 + r * H * 0.5 / 7; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        var dx = W / (N - 1), span = (hi - lo) || 1;
        var xs = [], ys = [];
        for (var i = 0; i < N; i++) { xs.push(i * dx - off * dx); ys.push(H * (0.955 - 0.27 * (P[i] - lo) / span)); }
        var cut = Math.max(2, Math.floor(N * ease));

        var ag = ctx.createLinearGradient(0, H * 0.65, 0, H);
        ag.addColorStop(0, 'rgba(78,88,112,0.95)'); ag.addColorStop(1, 'rgba(40,46,60,0.9)');
        ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(xs[0], H);
        for (i = 0; i < cut; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.lineTo(xs[cut - 1], H); ctx.closePath(); ctx.fill();

        var vm = Math.max.apply(null, V);
        for (i = 0; i < cut; i++) {
            var h = V[i] / vm * H * 0.1 * ease;
            ctx.fillStyle = (P[i] >= (i ? P[i - 1] : P[i])) ? 'rgba(150,162,185,0.5)' : 'rgba(95,106,128,0.5)';
            ctx.fillRect(xs[i] - dx * 0.3, H - h, dx * 0.6, h);
        }

        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(175,186,206,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (i = 29; i < cut; i++) { var s = 0; for (var q = i - 29; q <= i; q++) s += P[q]; var my = H * (0.955 - 0.27 * (s / 30 - lo) / span); i === 29 ? ctx.moveTo(xs[i], my) : ctx.lineTo(xs[i], my); }
        ctx.stroke(); ctx.setLineDash([]);

        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(240,184,90,0.25)'; ctx.lineWidth = 7; path(xs, ys, cut); ctx.stroke();
        ctx.strokeStyle = '#F0B85A'; ctx.lineWidth = 2; path(xs, ys, cut); ctx.stroke();

        var lx = xs[cut - 1], ly = ys[cut - 1];
        if (prog >= 1) { ctx.strokeStyle = 'rgba(240,184,90,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(W, ly); ctx.stroke(); }
        var pulse = reduce ? 0.5 : (Math.sin(now / 400) + 1) / 2;
        ctx.fillStyle = 'rgba(240,184,90,' + (0.15 + 0.2 * pulse) + ')'; ctx.beginPath(); ctx.arc(lx, ly, 6 + 5 * pulse, 0, 7); ctx.fill();
        ctx.fillStyle = '#fae8c4'; ctx.beginPath(); ctx.arc(lx, ly, 3, 0, 7); ctx.fill();

        if (reduce) { running = false; return; }
        requestAnimationFrame(draw);
    }
    start();
})();
