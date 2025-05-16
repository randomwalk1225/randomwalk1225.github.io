document.addEventListener('DOMContentLoaded', async function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizCardContainerEl = document.getElementById('quiz-card-container');
    const searchInputEl = document.getElementById('quiz-search-input');
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
    let allQuizzes = []; // To store all fetched quizzes for searching
    const numberOfGradientThemes = 5; // Number of predefined gradient themes for placeholders

    async function loadQuizManifest() {
        try {
            const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app";
            const functionPath = `${netlifySiteUrl}/.netlify/functions/getQuizList`;
            
            const response = await fetch(functionPath);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Netlify 함수(getQuizList) 호출 실패: ${response.status} ${response.statusText}. 응답: ${errorText}`);
            }
            
            let quizzes = await response.json();

            if (!Array.isArray(quizzes)) {
                console.error("getQuizList 함수에서 배열을 반환하지 않았습니다:", quizzes);
                throw new Error("퀴즈 목록 형식이 잘못되었습니다.");
            }
            
            if (quizzes.length === 0) {
                console.log("사용 가능한 퀴즈가 없습니다.");
            } else {
                quizzes = quizzes.map(quiz => ({
                    id: quiz.id,
                    title: quiz.title || quiz.id,
                    coverImageUrl: quiz.coverImageUrl, // Can be null
                    description: quiz.description,     // Can be null
                    creationDate: quiz.creationDate || '날짜 정보 없음',
                    isFavorite: quiz.isFavorite !== undefined ? quiz.isFavorite : false,
                    commentsCount: quiz.commentsCount !== undefined ? Number(quiz.commentsCount) : 0,
                    likesCount: quiz.likesCount !== undefined ? Number(quiz.likesCount) : 0,
                    isLiked: quiz.isLiked !== undefined ? quiz.isLiked : false
                }));
                quizzes.sort((a, b) => a.title.localeCompare(b.title));
            }
            return quizzes;

        } catch (error) {
            console.error("퀴즈 목록을 가져오는 중 오류 발생:", error);
            if (quizCardContainerEl) quizCardContainerEl.innerHTML = `<p class="error-message">퀴즈 목록을 불러오는 데 실패했습니다: ${error.message}</p>`;
            return [];
        }
    }

    function renderQuizCards(quizzesToDisplay) {
        console.log("renderQuizCards called with:", quizzesToDisplay); // DEBUG LOG
        if (!quizCardContainerEl) {
            console.error("ID가 'quiz-card-container'인 요소를 찾을 수 없습니다.");
            return;
        }
        quizCardContainerEl.innerHTML = ''; 

        if (quizzesToDisplay && quizzesToDisplay.length > 0) {
            quizzesToDisplay.forEach((quiz, index) => {
                const card = document.createElement('div');
                card.className = 'quiz-card';
                card.setAttribute('role', 'article');
                card.setAttribute('aria-labelledby', `quiz-title-${quiz.id}`);

                const link = document.createElement('a');
                link.href = `${siteBaseUrl}/quiz_app/take.html?quiz=${quiz.id}`;
                link.className = 'quiz-card-link';
                link.setAttribute('aria-label', `${quiz.title} 퀴즈 풀기`);

                // 1. Create image container and its content (image or placeholder)
                const imageContainer = document.createElement('div');
                imageContainer.className = 'quiz-card-image-container';

                if (quiz.coverImageUrl) {
                    const image = document.createElement('img');
                    image.src = quiz.coverImageUrl.startsWith('http') ? quiz.coverImageUrl : `${siteBaseUrl}${quiz.coverImageUrl}`;
                    image.alt = `${quiz.title} 커버 이미지`;
                    image.className = 'quiz-card-image';
                    image.onerror = function() {
                        if (image.parentNode === imageContainer) {
                            imageContainer.removeChild(image);
                        }
                        const placeholder = document.createElement('div');
                        placeholder.className = `quiz-card-image-placeholder gradient-theme-${(index % numberOfGradientThemes) + 1}`;
                        while (imageContainer.firstChild) {
                            imageContainer.removeChild(imageContainer.firstChild);
                        }
                        imageContainer.appendChild(placeholder);
                    };
                    imageContainer.appendChild(image);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = `quiz-card-image-placeholder gradient-theme-${(index % numberOfGradientThemes) + 1}`;
                    imageContainer.appendChild(placeholder);
                }
                // Append image container to link
                link.appendChild(imageContainer);

                // 2. Create content div and its children
                const contentDiv = document.createElement('div');
                contentDiv.className = 'quiz-card-content';

                const title = document.createElement('h3');
                title.id = `quiz-title-${quiz.id}`;
                title.className = 'quiz-card-title';
                title.textContent = quiz.title;
                contentDiv.appendChild(title);

                if (quiz.description) {
                    const descriptionEl = document.createElement('p');
                    descriptionEl.className = 'quiz-card-description';
                    descriptionEl.textContent = quiz.description;
                    contentDiv.appendChild(descriptionEl);
                }

                const date = document.createElement('p');
                date.className = 'quiz-card-date';
                date.textContent = `생성일: ${quiz.creationDate}`;
                contentDiv.appendChild(date);
                // Append content div to link
                link.appendChild(contentDiv);

                // 3. Create actions div and its children
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'quiz-card-actions';

                const favoriteIcon = document.createElement('span');
                favoriteIcon.className = 'action-icon favorite-icon';
                favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆';
                favoriteIcon.setAttribute('role', 'button');
                favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                favoriteIcon.setAttribute('tabindex', '0');
                favoriteIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    quiz.isFavorite = !quiz.isFavorite;
                    favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆';
                    favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                });
                favoriteIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); favoriteIcon.click(); }});
                actionsDiv.appendChild(favoriteIcon);

                const commentsIcon = document.createElement('span');
                commentsIcon.className = 'action-icon comments-icon';
                commentsIcon.innerHTML = `💬 <span class="count">${quiz.commentsCount}</span>`;
                commentsIcon.setAttribute('aria-label', `댓글 ${quiz.commentsCount}개`);
                actionsDiv.appendChild(commentsIcon);

                const likesIcon = document.createElement('span');
                likesIcon.className = 'action-icon likes-icon';
                const likesCountEl = document.createElement('span');
                likesCountEl.className = 'count';
                likesCountEl.textContent = quiz.likesCount;
                likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ ';
                likesIcon.appendChild(likesCountEl);
                likesIcon.setAttribute('role', 'button');
                likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                likesIcon.setAttribute('tabindex', '0');
                likesIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    quiz.isLiked = !quiz.isLiked;
                    quiz.likesCount = quiz.isLiked ? quiz.likesCount + 1 : quiz.likesCount - 1;
                    if (quiz.likesCount < 0) quiz.likesCount = 0;
                    likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ ';
                    likesCountEl.textContent = quiz.likesCount;
                    likesIcon.appendChild(likesCountEl);
                    likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                });
                likesIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); likesIcon.click(); }});
                actionsDiv.appendChild(likesIcon);
                
                // Append actions div to link
                link.appendChild(actionsDiv);

                // 4. Append the fully constructed link to the card
                card.appendChild(link);
                
                // 5. Append the card to the main container
                quizCardContainerEl.appendChild(card);
            });
        } else {
            quizCardContainerEl.innerHTML = '<p>표시할 퀴즈가 없습니다.</p>';
        }
    }

    async function initializeQuizApp() {
        if (quizCardContainerEl) {
            quizCardContainerEl.innerHTML = '<p class="loading-message">퀴즈 목록을 불러오는 중...</p>';
        }
        
        allQuizzes = await loadQuizManifest();
        renderQuizCards(allQuizzes);

        if (searchInputEl) {
            searchInputEl.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase().trim();
                const filteredQuizzes = allQuizzes.filter(quiz => 
                    quiz.title.toLowerCase().includes(searchTerm) ||
                    (quiz.description && quiz.description.toLowerCase().includes(searchTerm))
                );
                renderQuizCards(filteredQuizzes);
            });
        } else {
            console.error("ID가 'quiz-search-input'인 요소를 찾을 수 없습니다.");
        }
    }

    initializeQuizApp();
});
