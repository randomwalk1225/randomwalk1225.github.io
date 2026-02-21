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
    const link = e.target.closest('a[href^="http"]');
    if (link && !link.href.includes(location.hostname)) {
        trackEvent('outbound_click', {
            url: link.href,
            link_text: link.textContent.trim().substring(0, 50)
        });
    }
});
