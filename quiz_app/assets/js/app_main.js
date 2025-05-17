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

                const titleLink = document.createElement('a'); // This will now be primarily for storing the href
                titleLink.href = `${siteBaseUrl}/quiz_app/take.html?quiz=${quiz.id}`;
                // titleLink.className = 'text-decoration-none stretched-link'; // REMOVED stretched-link
                titleLink.className = 'text-decoration-none'; // Keep other styles if any, or make it plain

                const title = document.createElement('h6'); 
                title.id = `quiz-title-${quiz.id}`;
                card.setAttribute('aria-labelledby', title.id);
                title.className = 'card-title mb-1'; // Removed text-dark
                title.textContent = quiz.title;
                // titleLink.appendChild(title); // Title is no longer inside the link for display
                // cardBody.appendChild(titleLink); // Link is not added to body directly for display
                cardBody.appendChild(title); // Add title directly to card body

                // Make the card itself clickable, except for action icons
                card.style.cursor = 'pointer';
                card.addEventListener('click', function(event) {
                    const closestActionIcon = event.target.closest('.action-icon');
                    if (closestActionIcon) {
                        console.log('Card click detected, target is an action icon or its child. Stopping all actions here.');
                        event.preventDefault(); // Prevent default action of any parent links
                        event.stopPropagation(); // Stop event from bubbling further
                        
                        // Manually dispatch the click to the icon itself if it wasn't the direct target
                        // This is an attempt to ensure the icon's own handler fires.
                        if (event.target !== closestActionIcon) {
                            console.log('Dispatching click to the action icon itself.');
                            closestActionIcon.click(); 
                        }
                        return; 
                    }
                    console.log('Card area clicked (not on an action icon), navigating to:', titleLink.href);
                    window.location.href = titleLink.href;
                });

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
                favoriteIcon.className = 'action-icon favorite-icon'; // text-muted will be managed dynamically
                favoriteIcon.innerHTML = quiz.isFavorite ? '★' : '☆'; 
                if (quiz.isFavorite) {
                    favoriteIcon.classList.add('active');
                } else {
                    favoriteIcon.classList.add('text-muted');
                }
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
                    if (quiz.isFavorite) {
                        favoriteIcon.classList.add('active');
                        favoriteIcon.classList.remove('text-muted');
                    } else {
                        favoriteIcon.classList.remove('active');
                        favoriteIcon.classList.add('text-muted');
                    }
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
                likesIcon.className = 'action-icon likes-icon'; // text-muted will be managed dynamically
                
                const likesCountEl = document.createElement('span'); 
                likesCountEl.className = 'count';
                
                function updateLikesDisplay() {
                    likesIcon.innerHTML = quiz.isLiked ? '♥ ' : '♡ '; 
                    likesCountEl.textContent = quiz.likesCount;      
                    likesIcon.appendChild(likesCountEl); 
                    
                    if (quiz.isLiked) {
                        likesIcon.classList.add('active');
                        likesIcon.classList.remove('text-muted');
                    } else {
                        likesIcon.classList.remove('active');
                        likesIcon.classList.add('text-muted');
                    }
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
                    // sortAndRenderQuizzes(); // REMOVED: Likes should not re-sort the list
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


        document.getElementById('quiz-sort-combo').addEventListener('change', async function() {
        const sortValue = this.value; // 예: "date_desc", "date_asc", "name_asc", "name_desc"
        let sortBy = 'date', sortOrder = 'desc'; // 기본 최신순 (내림차순)
        if (sortValue.startsWith('date')) {
            sortBy = 'date';
            sortOrder = sortValue.endsWith('asc') ? 'asc' : 'desc';
        } else if (sortValue.startsWith('name')) {
            sortBy = 'name';
            sortOrder = sortValue.endsWith('asc') ? 'asc' : 'desc';
        }
      
        // 정렬 옵션에 맞게 Netlify 함수 호출 URL 구성
        const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app";
        const functionUrl = `${netlifySiteUrl}/.netlify/functions/getQuizList?sortBy=${sortBy}&sortOrder=${sortOrder}`;
        
        try {
            const response = await fetch(functionUrl);
            if (!response.ok) {
                console.error("Error fetching sorted quiz list:", response.statusText);
                return;
            }
            const sortedQuizzes = await response.json();
            masterQuizList = sortedQuizzes;
            renderQuizCards(masterQuizList);
        } catch (err) {
            console.error("Error in sorting request:", err);
        }
    });


    




    initializeQuizApp();
});
