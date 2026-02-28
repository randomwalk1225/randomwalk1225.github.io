/**
 * MathHub Global - Common JS
 * GA4 helpers, navigation renderer
 */

// GA4 Event Helper
function trackEvent(eventName, params) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

// Track outbound link clicks
document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="http"]');
    if (link && !link.href.includes(location.hostname)) {
        trackEvent('outbound_click', {
            url: link.href,
            link_text: link.textContent.trim().substring(0, 50)
        });
    }
});

// Nav: fix active state + add sub-labels
(function() {
    var path = location.pathname;
    var labels = {
        'KR': '수능·KMO',
        'US': 'SAT·AP·AMC',
        'UK': 'A-Level·TMUA',
        'CA': 'CEMC',
        'IB': 'AA·AI',
        'Books': 'AP·IB·A-Level'
    };
    var links = document.querySelectorAll('.global-nav .nav-links a:not(.nav-cta)');
    for (var i = 0; i < links.length; i++) {
        var txt = links[i].textContent.trim();
        var href = links[i].getAttribute('href');

        // Fix active: remove all, then set based on current path
        links[i].classList.remove('active');
        var section = '/' + txt.toLowerCase() + '/';
        if (path.indexOf(section) !== -1) {
            links[i].classList.add('active');
        }

        // Add sub-labels
        if (labels[txt]) {
            var sub = document.createElement('span');
            sub.className = 'nav-sub';
            sub.textContent = labels[txt];
            links[i].innerHTML = txt + ' ';
            links[i].appendChild(sub);
        }
    }
})();
