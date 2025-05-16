document.addEventListener('DOMContentLoaded', async function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizCardContainerEl = document.getElementById('quiz-card-container');
    const searchInputEl = document.getElementById('quiz-search-input');
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
    let masterQuizList = []; // Store the initially fetched and sorted list
    const numberOfGradientThemes = 5; 

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
                    coverImageUrl: quiz.coverImageUrl, 
                    description: quiz.description,     
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
            if (quizCardContainerEl) quizCardContainerEl.innerHTML = `<div class="col-12"><p class="text-danger">퀴즈 목록을 불러오는 데 실패했습니다: ${error.message}</p></div>`;
            return [];
        }
    }

    function renderQuizCards(quizzesToDisplay) {
        console.log("renderQuizCards called with (Bootstrap V3 - Fixes):", quizzesToDisplay); 
        if (!quizCardContainerEl) {
            console.error("ID가 'quiz-card-container'인 요소를 찾을 수 없습니다.");
            return;
        }
        quizCardContainerEl.innerHTML = ''; 

        if (quizzesToDisplay && quizzesToDisplay.length > 0) {
            quizzesToDisplay.forEach((quiz, index) => {
                const colDiv = document.createElement('div');
                // Bootstrap's row-cols-* classes on the parent will handle column sizing.
                // Add 'col' class to ensure it behaves as a column in the row.
                colDiv.className = 'col'; 

                const card = document.createElement('div');
                card.className = 'card h-100 shadow-sm';
                card.setAttribute('role', 'article');
                
                if (quiz.coverImageUrl) {
                    const image = document.createElement('img');
                    image.src = quiz.coverImageUrl.startsWith('http') ? quiz.coverImageUrl : `${siteBaseUrl}${quiz.coverImageUrl}`;
                    image.alt = `${quiz.title} 커버 이미지`;
                    image.className = 'card-img-top';
                    image.style.height = '180px';
                    image.style.objectFit = 'cover';
                    image.onerror = function() {
                        image.remove();
                        const placeholder = document.createElement('div');
                        placeholder.className = `card-img-top quiz-card-image-placeholder gradient-theme-${(index % numberOfGradientThemes) + 1}`;
                        placeholder.style.height = '180px'; 
                        card.insertBefore(placeholder, card.firstChild); 
                    };
                    card.appendChild(image);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = `card-img-top quiz-card-image-placeholder gradient-theme-${(index % numberOfGradientThemes) + 1}`;
                    placeholder.style.height = '180px';
                    card.appendChild(placeholder);
                }

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body d-flex flex-column';

                const titleLink = document.createElement('a');
                titleLink.href = `${siteBaseUrl}/quiz_app/take.html?quiz=${quiz.id}`;
                titleLink.className = 'text-decoration-none stretched-link'; 
                
                const title = document.createElement('h5');
                title.id = `quiz-title-${quiz.id}`;
                card.setAttribute('aria-labelledby', title.id);
                title.className = 'card-title text-dark mb-1'; 
                title.textContent = quiz.title;
                titleLink.appendChild(title);
                cardBody.appendChild(titleLink);

                if (quiz.description) {
                    const descriptionEl = document.createElement('p');
                    descriptionEl.className = 'card-text small text-muted mb-2'; 
                    descriptionEl.textContent = quiz.description;
                    cardBody.appendChild(descriptionEl);
                }

                const date = document.createElement('p');
                date.className = 'card-text mt-auto pt-2'; 
                date.innerHTML = `<small class="text-muted">생성일: ${quiz.creationDate}</small>`;
                cardBody.appendChild(date);
                
                card.appendChild(cardBody);

                const cardFooter = document.createElement('div');
                cardFooter.className = 'card-footer bg-white border-top-0 pt-0'; 

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'd-flex justify-content-start align-items-center';
                actionsDiv.style.gap = '0.75rem';

                const favoriteIcon = document.createElement('span');
                favoriteIcon.className = 'action-icon favorite-icon text-muted';
                favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆'; 
                favoriteIcon.classList.toggle('active', quiz.isFavorite); // Ensure active class is set initially
                favoriteIcon.style.cursor = 'pointer';
                favoriteIcon.setAttribute('role', 'button');
                favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                favoriteIcon.setAttribute('tabindex', '0');
                favoriteIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    quiz.isFavorite = !quiz.isFavorite; // Update the local quiz object state
                    favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆';
                    favoriteIcon.classList.toggle('active', quiz.isFavorite);
                    favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                });
                favoriteIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); favoriteIcon.click(); }});
                actionsDiv.appendChild(favoriteIcon);

                const commentsIcon = document.createElement('span');
                commentsIcon.className = 'action-icon comments-icon text-muted';
                commentsIcon.innerHTML = `💬 <span class="count">${quiz.commentsCount}</span>`;
                actionsDiv.appendChild(commentsIcon);

                const likesIcon = document.createElement('span');
                likesIcon.className = 'action-icon likes-icon text-muted';
                likesIcon.classList.toggle('active', quiz.isLiked); // Ensure active class is set initially
                const likesCountEl = document.createElement('span');
                likesCountEl.className = 'count';
                likesCountEl.textContent = quiz.likesCount;
                likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ '; 
                likesIcon.appendChild(likesCountEl); // Append count span
                likesIcon.style.cursor = 'pointer';
                likesIcon.setAttribute('role', 'button');
                likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                likesIcon.setAttribute('tabindex', '0');
                likesIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    // Update local quiz object state
                    if (quiz.isLiked) {
                        quiz.likesCount--;
                    } else {
                        quiz.likesCount++;
                    }
                    quiz.isLiked = !quiz.isLiked;
                    
                    likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ '; // Update icon
                    likesCountEl.textContent = quiz.likesCount;      // Update count text
                    likesIcon.appendChild(likesCountEl);              // Re-append count span
                    likesIcon.classList.toggle('active', quiz.isLiked);
                    likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                });
                likesIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); likesIcon.click(); }});
                actionsDiv.appendChild(likesIcon);
                
                cardFooter.appendChild(actionsDiv);
                card.appendChild(cardFooter);

                colDiv.appendChild(card);
                quizCardContainerEl.appendChild(colDiv);
            });
        } else {
            quizCardContainerEl.innerHTML = '<div class="col-12"><p>표시할 퀴즈가 없습니다.</p></div>';
        }
    }

    async function initializeQuizApp() {
        if (quizCardContainerEl) {
            quizCardContainerEl.innerHTML = '<div class="col-12"><p class="text-center">퀴즈 목록을 불러오는 중...</p></div>';
        }
        
        masterQuizList = await loadQuizManifest(); // Store in master list
        renderQuizCards(masterQuizList); // Initial render with all quizzes

        if (searchInputEl) {
            searchInputEl.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase().trim();
                const filteredQuizzes = masterQuizList.filter(quiz => // Filter from master list
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
