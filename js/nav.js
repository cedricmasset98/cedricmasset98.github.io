/* Menu: translucent over the dark header, white once past it; gold underline on the section being read. */
(function () {
    var header = document.querySelector('header');
    var lead = document.getElementById('lead');
    if (!header || !lead) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('#menu a[href^="#"]'));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var ticking = false;

    function update() {
        ticking = false;
        var y = window.pageYOffset || document.documentElement.scrollTop;
        var menuH = (document.getElementById('menu') || header).offsetHeight;
        header.classList.toggle('on-lead', y + menuH < lead.offsetTop + lead.offsetHeight);

        var current = -1, probe = y + window.innerHeight * 0.35;
        for (var i = 0; i < sections.length; i++) {
            if (sections[i] && sections[i].getBoundingClientRect().top + y <= probe) current = i;
        }
        if ((window.innerHeight + y) >= document.documentElement.scrollHeight - 2) current = sections.length - 1;
        if (y + menuH < lead.offsetTop + lead.offsetHeight * 0.6) current = -1;
        links.forEach(function (a, k) { a.classList.toggle('current', k === current); });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
})();
