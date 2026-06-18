/**
 * MathHub Download Gate
 * Intercepts PDF download clicks, shows ad modal with countdown, then triggers download.
 *
 * Usage: Set window.DownloadGateConfig before loading this script.
 * {
 *   enabled: true,
 *   countdownSeconds: 15,
 *   adClient: 'ca-pub-XXXXXXX',
 *   adSlot: 'XXXXXXXXXX',
 *   selectors: '.link-qp, .link-ms',
 *   lang: 'ko',
 *   cooldownMinutes: 30
 * }
 */
(function() {
    'use strict';

    var cfg = window.DownloadGateConfig;
    if (!cfg || !cfg.enabled) return;

    var COOLDOWN_KEY = 'dg_last_download';
    var isModalOpen = false;
    var countdownTimer = null;

    // --- i18n ---
    var strings = {
        ko: {
            title: '잠시 후 다운로드가 시작됩니다',
            adLabel: '광고',
            countdown: '초 후 다운로드',
            downloading: '다운로드 시작...',
            cancel: '취소'
        },
        en: {
            title: 'Your download will begin shortly',
            adLabel: 'Advertisement',
            countdown: 'seconds until download',
            downloading: 'Starting download...',
            cancel: 'Cancel'
        }
    };
    var lang = strings[cfg.lang] ? cfg.lang : 'en';
    var t = strings[lang];

    // --- Cooldown check ---
    function isInCooldown() {
        var last = sessionStorage.getItem(COOLDOWN_KEY);
        if (!last) return false;
        var elapsed = Date.now() - parseInt(last, 10);
        return elapsed < (cfg.cooldownMinutes || 30) * 60 * 1000;
    }

    function setCooldown() {
        sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    }

    // --- Modal HTML ---
    function createModal() {
        var overlay = document.createElement('div');
        overlay.id = 'download-gate-overlay';
        overlay.innerHTML =
            '<div id="download-gate-modal">' +
                '<div class="dg-header">' +
                    '<h3>' + t.title + '</h3>' +
                    '<button class="dg-close-btn" data-dg-cancel>&times;</button>' +
                '</div>' +
                '<div class="dg-ad-container">' +
                    '<div class="dg-ad-label">' + t.adLabel + '</div>' +
                    '<ins class="adsbygoogle"' +
                        ' style="display:block;width:100%;max-width:440px;height:220px"' +
                        ' data-ad-client="' + (cfg.adClient || 'ca-pub-7322143430416257') + '"' +
                        ' data-ad-slot="' + (cfg.adSlot || '') + '"' +
                        ' data-ad-format="rectangle"' +
                        ' data-full-width-responsive="false"></ins>' +
                '</div>' +
                '<div class="dg-countdown">' +
                    '<span class="dg-countdown-num" id="dg-timer">' + (cfg.countdownSeconds || 15) + '</span>' +
                    '<span class="dg-countdown-text">' + t.countdown + '</span>' +
                '</div>' +
                '<div class="dg-footer">' +
                    '<button class="dg-cancel-btn" data-dg-cancel>' + t.cancel + '</button>' +
                '</div>' +
            '</div>';
        return overlay;
    }

    // --- Core logic ---
    function showGate(downloadUrl) {
        if (isModalOpen) return;
        isModalOpen = true;

        var overlay = createModal();
        document.body.appendChild(overlay);

        // Trigger enter animation
        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        // Try to load ad
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            // Ad blocker or AdSense not loaded — graceful degradation
        }

        // Track event
        if (typeof trackEvent === 'function') {
            trackEvent('download_gate_shown', { url: downloadUrl });
        }

        // Countdown
        var remaining = cfg.countdownSeconds || 15;
        var timerEl = document.getElementById('dg-timer');
        var countdownTextEl = overlay.querySelector('.dg-countdown-text');

        countdownTimer = setInterval(function() {
            remaining--;
            if (timerEl) timerEl.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                if (timerEl) timerEl.textContent = '';
                if (countdownTextEl) countdownTextEl.textContent = t.downloading;

                // Trigger download
                setCooldown();
                triggerDownload(downloadUrl);

                // Track completion
                if (typeof trackEvent === 'function') {
                    trackEvent('download_gate_completed', { url: downloadUrl });
                }

                // Close after brief delay
                setTimeout(function() { closeGate(overlay); }, 800);
            }
        }, 1000);

        // Cancel handlers
        overlay.addEventListener('click', function(e) {
            if (e.target.hasAttribute('data-dg-cancel') || e.target === overlay) {
                e.preventDefault();
                cancelGate(overlay, downloadUrl);
            }
        });
    }

    function cancelGate(overlay, downloadUrl) {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
        if (typeof trackEvent === 'function') {
            trackEvent('download_gate_cancelled', { url: downloadUrl });
        }
        closeGate(overlay);
    }

    function closeGate(overlay) {
        isModalOpen = false;
        overlay.classList.remove('visible');
        setTimeout(function() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 250);
    }

    function triggerDownload(url) {
        // Use a temporary link to trigger download
        var a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        // For same-origin PDFs, try download attribute
        if (url.indexOf(location.origin) === 0 || url.indexOf('/') === 0) {
            a.download = '';
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // --- Event delegation ---
    document.addEventListener('click', function(e) {
        // Only left clicks
        if (e.button !== 0) return;

        var selectors = cfg.selectors || '.link-qp, .link-ms';
        var link = e.target.closest(selectors);
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href) return;

        // Only intercept PDF links
        if (href.indexOf('.pdf') === -1 && href.indexOf('.PDF') === -1) return;

        e.preventDefault();
        e.stopPropagation();

        // Skip gate if within cooldown
        if (isInCooldown()) {
            triggerDownload(href);
            return;
        }

        showGate(href);
    }, true); // Use capture to intercept before other handlers
})();
