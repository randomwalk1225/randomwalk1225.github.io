/* ===== MathHub Textbook UX Features ===== */
/* Dark Mode | Reading Progress | Bookmarks */

(function () {
    'use strict';

    var STORAGE_PROGRESS = 'mh_progress';
    var STORAGE_BOOKMARKS = 'mh_bookmarks';
    var STORAGE_DARK = 'mh_dark';

    /* ─── Helpers ─── */
    function getStorage(key, def) {
        try { return JSON.parse(localStorage.getItem(key)) || def; }
        catch (e) { return def; }
    }
    function setStorage(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    }

    /* ─── Page identity ─── */
    var pageKey = location.pathname;
    var pageTitle = document.title.split(' | ')[0];

    /* ────────────────────────────────────────
       1. READING PROGRESS BAR
    ──────────────────────────────────────── */
    var progressBar = document.createElement('div');
    progressBar.id = 'reading-progress-bar';
    document.body.prepend(progressBar);

    var marked80 = false;
    function onScroll() {
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        var pct = docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 100;
        progressBar.style.width = pct + '%';

        // Mark as read when user reaches 80%
        if (!marked80 && pct >= 80) {
            marked80 = true;
            var progress = getStorage(STORAGE_PROGRESS, {});
            if (!progress[pageKey]) {
                progress[pageKey] = { title: pageTitle, readAt: Date.now() };
                setStorage(STORAGE_PROGRESS, progress);
            }
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Show "✓ Read" badge in the breadcrumb / header if already completed
    var progress = getStorage(STORAGE_PROGRESS, {});
    if (progress[pageKey]) {
        var h1 = document.querySelector('.blog-article h1');
        if (h1) {
            var badge = document.createElement('span');
            badge.className = 'chapter-read-badge';
            badge.textContent = '✓ Read';
            h1.appendChild(badge);
        }
    }

    /* ────────────────────────────────────────
       2. BOOKMARK BUTTONS ON HEADINGS
    ──────────────────────────────────────── */
    function slugify(text) {
        return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 60);
    }

    function getBookmarks() { return getStorage(STORAGE_BOOKMARKS, []); }
    function saveBookmarks(bms) { setStorage(STORAGE_BOOKMARKS, bms); }

    function isBookmarked(id) {
        return getBookmarks().some(function (b) { return b.id === id; });
    }

    function toggleBookmark(id, title) {
        var bms = getBookmarks();
        var idx = bms.findIndex(function (b) { return b.id === id; });
        if (idx >= 0) {
            bms.splice(idx, 1);
        } else {
            bms.unshift({ id: id, title: title, page: pageTitle, path: pageKey, addedAt: Date.now() });
        }
        saveBookmarks(bms);
        return idx < 0; // true = now bookmarked
    }

    // Inject bookmark buttons into all h2 and h3 elements
    document.querySelectorAll('.blog-article h2, .blog-article h3').forEach(function (heading) {
        // Ensure the heading has an id
        if (!heading.id) {
            heading.id = slugify(heading.textContent.trim());
        }
        var id = pageKey + '#' + heading.id;
        var btn = document.createElement('button');
        btn.className = 'bookmark-btn';
        btn.title = 'Bookmark this section';
        btn.innerHTML = isBookmarked(id) ? '🔖' : '☆';
        if (isBookmarked(id)) btn.classList.add('bookmarked');

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var nowBookmarked = toggleBookmark(id, heading.textContent.replace('☆', '').replace('🔖', '').trim());
            btn.innerHTML = nowBookmarked ? '🔖' : '☆';
            btn.classList.toggle('bookmarked', nowBookmarked);
            renderBookmarksPanel();
        });
        heading.appendChild(btn);
    });

    /* ────────────────────────────────────────
       3. UX TOOLBAR (bottom-right floating)
    ──────────────────────────────────────── */
    var toolbar = document.createElement('div');
    toolbar.className = 'ux-toolbar';

    // Dark mode button
    var darkBtn = document.createElement('button');
    darkBtn.className = 'ux-btn';
    darkBtn.id = 'dark-mode-btn';
    darkBtn.title = 'Toggle dark mode';
    darkBtn.innerHTML = '🌙';

    // Bookmarks button
    var bmBtn = document.createElement('button');
    bmBtn.className = 'ux-btn';
    bmBtn.id = 'bookmarks-btn';
    bmBtn.title = 'My bookmarks';
    bmBtn.innerHTML = '🔖';

    // Print button
    var printBtn = document.createElement('button');
    printBtn.className = 'ux-btn';
    printBtn.id = 'print-btn';
    printBtn.title = 'Print this chapter';
    printBtn.innerHTML = '🖨️';

    toolbar.appendChild(printBtn);
    toolbar.appendChild(bmBtn);
    toolbar.appendChild(darkBtn);
    document.body.appendChild(toolbar);

    /* ────────────────────────────────────────
       4. DARK MODE
    ──────────────────────────────────────── */
    var darkActive = getStorage(STORAGE_DARK, false);

    function applyDark(on) {
        document.body.classList.toggle('dark-mode', on);
        darkBtn.classList.toggle('active', on);
        darkBtn.innerHTML = on ? '☀️' : '🌙';
    }

    applyDark(darkActive);

    darkBtn.addEventListener('click', function () {
        darkActive = !darkActive;
        setStorage(STORAGE_DARK, darkActive);
        applyDark(darkActive);
    });

    /* ────────────────────────────────────────
       5. BOOKMARKS PANEL
    ──────────────────────────────────────── */
    var panel = document.createElement('div');
    panel.id = 'bookmarks-panel';
    document.body.appendChild(panel);

    function renderBookmarksPanel() {
        var bms = getBookmarks();
        var html = '<h4>📌 My Bookmarks</h4>';
        if (bms.length === 0) {
            html += '<p class="empty-msg">No bookmarks yet.<br>Click ☆ on any section heading to save it.</p>';
        } else {
            html += '<ul>';
            bms.forEach(function (b) {
                var url = b.path + (b.id.indexOf('#') >= 0 ? b.id.substring(b.id.lastIndexOf('#')) : '');
                html += '<li>' +
                    '<span class="bm-remove" data-id="' + b.id + '">✕</span>' +
                    '<a href="' + url + '">' + b.title + '</a>' +
                    '<span class="bm-source">' + b.page + '</span>' +
                    '</li>';
            });
            html += '</ul>';
        }
        panel.innerHTML = html;

        // Wire up remove buttons
        panel.querySelectorAll('.bm-remove').forEach(function (el) {
            el.addEventListener('click', function () {
                var bms2 = getBookmarks().filter(function (b) { return b.id !== el.dataset.id; });
                saveBookmarks(bms2);
                // Also update the heading button if on same page
                document.querySelectorAll('.bookmark-btn').forEach(function (btn) {
                    var heading = btn.parentElement;
                    var id = pageKey + '#' + heading.id;
                    if (id === el.dataset.id) {
                        btn.innerHTML = '☆';
                        btn.classList.remove('bookmarked');
                    }
                });
                renderBookmarksPanel();
            });
        });
    }

    var panelOpen = false;
    bmBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        panelOpen = !panelOpen;
        if (panelOpen) renderBookmarksPanel();
        panel.classList.toggle('open', panelOpen);
        bmBtn.classList.toggle('active', panelOpen);
    });

    document.addEventListener('click', function (e) {
        if (panelOpen && !panel.contains(e.target) && e.target !== bmBtn) {
            panelOpen = false;
            panel.classList.remove('open');
            bmBtn.classList.remove('active');
        }
    });

    /* ────────────────────────────────────────
       6. PRINT
    ──────────────────────────────────────── */
    printBtn.addEventListener('click', function () {
        window.print();
    });

})();
