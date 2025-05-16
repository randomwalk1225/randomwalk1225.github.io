document.addEventListener('DOMContentLoaded', async function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizCardContainerEl = document.getElementById('quiz-card-container');
    const searchInputEl = document.getElementById('quiz-search-input');
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
    let masterQuizList = []; 
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
                // Initial sort by title
                quizzes.sort((a, b) => a.title.localeCompare(b.title));
            }
            return quizzes;

        } catch (error) {
            console.error("퀴즈 목록을 가져오는 중 오류 발생:", error);
            if (quizCardContainerEl) quizCardContainerEl.innerHTML = `<div class="col-12"><p class="text-danger">퀴즈 목록을 불러오는 데 실패했습니다: ${error.message}</p></div>`;
            return [];
        }
    }
    
    function sortAndRenderQuizzes() {
        // Sort by favorite, then by liked, then by title
        masterQuizList.sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) {
                return a.isFavorite ? -1 : 1;
            }
            if (a.isLiked !== b.isLiked) {
                return a.isLiked ? -1 : 1;
            }
            return a.title.localeCompare(b.title);
        });
        renderQuizCards(masterQuizList);
    }

    function renderQuizCards(quizzesToDisplay) {
        console.log("renderQuizCards called with (Bootstrap V5 - Interaction Fixes):", quizzesToDisplay); 
        if (!quizCardContainerEl) {
            console.error("ID가 'quiz-card-container'인 요소를 찾을 수 없습니다.");
            return;
        }
        quizCardContainerEl.innerHTML = ''; 

        if (quizzesToDisplay && quizzesToDisplay.length > 0) {
            quizzesToDisplay.forEach((quiz, index) => {
                const colDiv = document.createElement('div');
                colDiv.className = 'col'; 

                const card = document.createElement('div');
                card.className = 'card shadow-sm';
                card.setAttribute('role', 'article');
                
                if (quiz.coverImageUrl) {
                    const image = document.createElement('img');
                    image.src = quiz.coverImageUrl.startsWith('http') ? quiz.coverImageUrl : `${siteBaseUrl}${quiz.coverImageUrl}`;
                    image.alt = `${quiz.title} 커버 이미지`;
                    image.className = 'card-img-top';
                    image.onerror = function() {
                        image.remove();
                        const placeholder = document.createElement('div');
                        placeholder.className = `card-img-top quiz-card-image-placeholder gradient-theme-${(index % numberOfGradientThemes) + 1}`;
                        card.insertBefore(placeholder, card.firstChild); 
                    };
                    card.appendChild(image);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = `card-img-top quiz-card-image-placeholder gradient-theme-${(index % numberOfGradientThemes) + 1}`;
                    card.appendChild(placeholder);
                }

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body d-flex flex-column p-2';

                const titleLink = document.createElement('a');
                titleLink.href = `${siteBaseUrl}/quiz_app/take.html?quiz=${quiz.id}`;
                titleLink.className = 'text-decoration-none stretched-link'; 
                
                const title = document.createElement('h6'); 
                title.id = `quiz-title-${quiz.id}`;
                card.setAttribute('aria-labelledby', title.id);
                title.className = 'card-title text-dark mb-1'; 
                title.textContent = quiz.title;
                titleLink.appendChild(title);
                cardBody.appendChild(titleLink);

                if (quiz.description) {
                    const descriptionEl = document.createElement('p');
                    descriptionEl.className = 'card-text small text-muted mb-1'; 
                    descriptionEl.textContent = quiz.description;
                    cardBody.appendChild(descriptionEl);
                }

                const date = document.createElement('p');
                // Add 'text-end' for right alignment, and a custom class for specific styling
                date.className = 'card-text mt-auto pt-1 text-end quiz-card-creation-date'; 
                date.innerHTML = `<small class="text-muted">${quiz.creationDate}</small>`; // Removed "생성일: "
                cardBody.appendChild(date);
                
                card.appendChild(cardBody);

                const cardFooter = document.createElement('div');
                cardFooter.className = 'card-footer bg-white border-top-0 pt-1 pb-2 px-2'; 

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'd-flex justify-content-start align-items-center';
                actionsDiv.style.gap = '0.5rem'; 

                const favoriteIcon = document.createElement('span');
                favoriteIcon.className = 'action-icon favorite-icon text-muted';
                favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆'; 
                favoriteIcon.classList.toggle('active', quiz.isFavorite);
                favoriteIcon.style.cursor = 'pointer';
                favoriteIcon.setAttribute('role', 'button');
                favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                favoriteIcon.setAttribute('tabindex', '0');
                favoriteIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    quiz.isFavorite = !quiz.isFavorite; 
                    favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆';
                    favoriteIcon.classList.toggle('active', quiz.isFavorite);
                    favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                    sortAndRenderQuizzes(); // Re-sort and re-render
                });
                favoriteIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); favoriteIcon.click(); }});
                actionsDiv.appendChild(favoriteIcon);

                const commentsIcon = document.createElement('span');
                commentsIcon.className = 'action-icon comments-icon text-muted';
                commentsIcon.innerHTML = `💬 <span class="count">${quiz.commentsCount}</span>`;
                actionsDiv.appendChild(commentsIcon);

                const likesIcon = document.createElement('span');
                likesIcon.className = 'action-icon likes-icon text-muted';
                likesIcon.classList.toggle('active', quiz.isLiked); 
                const likesCountEl = document.createElement('span');
                likesCountEl.className = 'count';
                likesCountEl.textContent = quiz.likesCount;
                likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ '; 
                likesIcon.appendChild(likesCountEl); 
                likesIcon.style.cursor = 'pointer';
                likesIcon.setAttribute('role', 'button');
                likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                likesIcon.setAttribute('tabindex', '0');
                likesIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    
                    if (quiz.isLiked) { // If it was liked, now it's unliked
                        quiz.likesCount--;
                    } else { // If it was unliked, now it's liked
                        quiz.likesCount++;
                    }
                    quiz.isLiked = !quiz.isLiked; // Toggle the state
                                        
                    likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ '; 
                    likesCountEl.textContent = quiz.likesCount;      
                    likesIcon.appendChild(likesCountEl);              
                    likesIcon.classList.toggle('active', quiz.isLiked);
                    likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                    sortAndRenderQuizzes(); // Re-sort and re-render
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
        
        masterQuizList = await loadQuizManifest(); 
        renderQuizCards(masterQuizList); // Initial render uses the default sort (by title)

        if (searchInputEl) {
            searchInputEl.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase().trim();
                // When searching, filter from the master list which is already sorted by title
                // If we want search results to also respect favorite/like, we'd need to re-sort the filtered list.
                // For now, search overrides the favorite/like sort for simplicity of search results.
                const filteredQuizzes = masterQuizList.filter(quiz => 
                    quiz.title.toLowerCase().includes(searchTerm) ||
                    (quiz.description && quiz.description.toLowerCase().includes(searchTerm))
                );
                renderQuizCards(filteredQuizzes); // Render filtered list (does not re-sort by fav/like)
            });
        } else {
            console.error("ID가 'quiz-search-input'인 요소를 찾을 수 없습니다.");
        }
    }

    initializeQuizApp();
});
