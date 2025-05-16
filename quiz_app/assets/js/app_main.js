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
        console.log("sortAndRenderQuizzes 호출됨");
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
        console.log("renderQuizCards 호출됨. 표시할 퀴즈 개수:", quizzesToDisplay ? quizzesToDisplay.length : 0); 
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

                // Add a click listener to the titleLink itself to check the actual target
                titleLink.addEventListener('click', function(event) {
                    // Check if the click originated from an action icon or its child
                    if (event.target.closest('.action-icon')) {
                        console.log('Click on titleLink originated from an action icon, preventing navigation.');
                        event.preventDefault();
                    }
                });
                
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
                date.className = 'card-text mt-auto pt-1 text-end quiz-card-creation-date'; 
                date.innerHTML = `<em class="text-muted">${quiz.creationDate}</em>`;
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
                    console.log(`Favorite clicked for quiz ID: ${quiz.id}. Current isFavorite: ${quiz.isFavorite}`);
                    quiz.isFavorite = !quiz.isFavorite; 
                    console.log(`New isFavorite: ${quiz.isFavorite}`);
                    favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆';
                    favoriteIcon.classList.toggle('active', quiz.isFavorite);
                    favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기');
                    sortAndRenderQuizzes();
                });
                favoriteIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); favoriteIcon.click(); }});
                actionsDiv.appendChild(favoriteIcon);

                const commentsIcon = document.createElement('span');
                commentsIcon.className = 'action-icon comments-icon text-muted';
                commentsIcon.innerHTML = `💬 <span class="count">${quiz.commentsCount}</span>`;
                actionsDiv.appendChild(commentsIcon);

                const likesIcon = document.createElement('span');
                likesIcon.className = 'action-icon likes-icon text-muted';
                
                const likesCountEl = document.createElement('span'); // Create count span once
                likesCountEl.className = 'count';
                
                function updateLikesDisplay() {
                    likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ '; 
                    likesCountEl.textContent = quiz.likesCount;      
                    likesIcon.appendChild(likesCountEl); // Append count span after setting icon
                    likesIcon.classList.toggle('active', quiz.isLiked);
                    likesIcon.setAttribute('aria-label', quiz.isLiked ? `좋아요 취소 (${quiz.likesCount}개)` : `좋아요 (${quiz.likesCount}개)`);
                }
                updateLikesDisplay(); // Initial display setup

                likesIcon.style.cursor = 'pointer';
                likesIcon.setAttribute('role', 'button');
                likesIcon.setAttribute('tabindex', '0');
                
                likesIcon.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    console.log(`Like clicked for quiz ID: ${quiz.id}. Current isLiked: ${quiz.isLiked}, likesCount: ${quiz.likesCount}`);
                    
                    if (quiz.isLiked) { 
                        quiz.likesCount--;
                    } else { 
                        quiz.likesCount++;
                    }
                    quiz.isLiked = !quiz.isLiked; 
                    console.log(`New isLiked: ${quiz.isLiked}, new likesCount: ${quiz.likesCount}`);
                                        
                    updateLikesDisplay(); // Update the DOM
                    console.log(`Likes count span textContent after update: ${likesCountEl.textContent}`);
                    sortAndRenderQuizzes();
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
        renderQuizCards(masterQuizList);

        if (searchInputEl) {
            searchInputEl.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase().trim();
                const currentSearchFilteredList = masterQuizList.filter(quiz => 
                    quiz.title.toLowerCase().includes(searchTerm) ||
                    (quiz.description && quiz.description.toLowerCase().includes(searchTerm))
                );
                // When searching, we don't re-apply the favorite/like sort on top of search results for now.
                // If that's desired, the filtered list would need to be passed to sortAndRenderQuizzes,
                // or sortAndRenderQuizzes would need to accept a list to sort and render.
                renderQuizCards(currentSearchFilteredList); 
            });
        } else {
            console.error("ID가 'quiz-search-input'인 요소를 찾을 수 없습니다.");
        }
    }

    initializeQuizApp();
});
