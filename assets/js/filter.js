/**
 * MathHub - Post Filter & Search
 * Category filtering + keyword search (extracted from original index.html)
 */
(function() {
    const categoryItems = document.querySelectorAll('.category-item');
    const postCards = document.querySelectorAll('.post-card');
    const searchInput = document.getElementById('searchInput');
    const searchResultsCount = document.getElementById('searchResultsCount');

    if (!postCards.length) return;

    let currentCategory = 'all';
    let currentSearchTerm = '';

    function filterPosts() {
        let visibleCount = 0;
        let totalMatchingCategory = 0;

        postCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const categoryMatch = currentCategory === 'all' || cardCategory === currentCategory;

            if (categoryMatch) totalMatchingCategory++;

            let searchMatch = true;
            if (currentSearchTerm) {
                const title = card.querySelector('h2').textContent.toLowerCase();
                const description = card.querySelector('.post-description').textContent.toLowerCase();
                const tags = Array.from(card.querySelectorAll('.tag'))
                    .map(tag => tag.textContent.toLowerCase()).join(' ');
                searchMatch = (title + ' ' + description + ' ' + tags).includes(currentSearchTerm);
            }

            if (categoryMatch && searchMatch) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (searchResultsCount) {
            if (currentSearchTerm) {
                searchResultsCount.textContent = visibleCount + '\uac1c\uc758 \uac8c\uc2dc\uae00\uc774 \uac80\uc0c9\ub418\uc5c8\uc2b5\ub2c8\ub2e4';
            } else if (currentCategory !== 'all') {
                searchResultsCount.textContent = totalMatchingCategory + '\uac1c\uc758 \uac8c\uc2dc\uae00';
            } else {
                searchResultsCount.textContent = '';
            }
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.toLowerCase().trim();
            filterPosts();
        });
    }

    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            currentCategory = this.getAttribute('data-category');
            categoryItems.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            filterPosts();
        });
    });

    // Auto-update category counts
    function updateCategoryCounts() {
        const categories = {};
        postCards.forEach(card => {
            const cat = card.getAttribute('data-category');
            categories[cat] = (categories[cat] || 0) + 1;
        });
        categoryItems.forEach(item => {
            const cat = item.getAttribute('data-category');
            const countEl = item.querySelector('.category-count');
            if (countEl) {
                countEl.textContent = cat === 'all' ? postCards.length : (categories[cat] || 0);
            }
        });
    }

    updateCategoryCounts();
})();
