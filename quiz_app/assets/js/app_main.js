document.addEventListener('DOMContentLoaded', async function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizCardContainerEl = document.getElementById('quiz-card-container');
    const searchInputEl = document.getElementById('quiz-search-input');
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
    let allQuizzes = []; // To store all fetched quizzes for searching

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
                // Ensure each item has the necessary fields
                quizzes = quizzes.map(quiz => ({
                    id: quiz.id,
                    title: quiz.title || quiz.id,
                    imageUrl: quiz.imageUrl || `${siteBaseUrl}/quiz_app/assets/images/default_quiz_thumbnail.png`,
                    creationDate: quiz.creationDate || '날짜 정보 없음',
                    commentsCount: quiz.commentsCount !== undefined ? quiz.commentsCount : 0,
                    isFavorite: quiz.isFavorite !== undefined ? quiz.isFavorite : false
                }));
                // Sort quizzes by title alphabetically for consistent ordering
                quizzes.sort((a, b) => a.title.localeCompare(b.title));
            }
            return quizzes;

        } catch (error) {
            console.error("퀴즈 목록을 가져오는 중 오류 발생:", error);
            if (quizCardContainerEl) quizCardContainerEl.innerHTML = `<p class="error-message">퀴즈 목록을 불러오는 데 실패했습니다: ${error.message}</p>`;
            return []; // Return empty array on error
        }
    }

    function renderQuizCards(quizzesToDisplay) {
        if (!quizCardContainerEl) {
            console.error("ID가 'quiz-card-container'인 요소를 찾을 수 없습니다.");
            return;
        }
        quizCardContainerEl.innerHTML = ''; // Clear previous cards

        if (quizzesToDisplay && quizzesToDisplay.length > 0) {
            quizzesToDisplay.forEach(quiz => {
                const card = document.createElement('div');
                card.className = 'quiz-card';
                card.setAttribute('role', 'article');
                card.setAttribute('aria-labelledby', `quiz-title-${quiz.id}`);

                const link = document.createElement('a');
                link.href = `${siteBaseUrl}/quiz_app/take.html?quiz=${quiz.id}`;
                link.className = 'quiz-card-link';
                link.setAttribute('aria-label', `${quiz.title} 퀴즈 풀기`);

                const image = document.createElement('img');
                image.src = quiz.imageUrl.startsWith('http') ? quiz.imageUrl : `${siteBaseUrl}${quiz.imageUrl}`;
                image.alt = `${quiz.title} 대표 이미지`;
                image.className = 'quiz-card-image';
                // Add error handling for images
                image.onerror = function() {
                    this.onerror=null; // Prevents infinite loop if default also fails
                    this.src=`${siteBaseUrl}/quiz_app/assets/images/default_quiz_thumbnail.png`;
                    this.alt = '기본 퀴즈 이미지';
                };

                const title = document.createElement('h3');
                title.id = `quiz-title-${quiz.id}`;
                title.className = 'quiz-card-title';
                title.textContent = quiz.title;

                const date = document.createElement('p');
                date.className = 'quiz-card-date';
                date.textContent = `생성일: ${quiz.creationDate}`;
                
                const footer = document.createElement('div');
                footer.className = 'quiz-card-footer';

                const favoriteIcon = document.createElement('span');
                favoriteIcon.className = 'quiz-card-icon favorite-icon';
                favoriteIcon.innerHTML = quiz.isFavorite ? '❤️' : '🤍'; // Simple heart icons
                favoriteIcon.setAttribute('role', 'button');
                favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가');
                favoriteIcon.setAttribute('tabindex', '0');
                // Basic favorite toggle functionality (visual only for now)
                favoriteIcon.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent link navigation
                    e.stopPropagation(); // Stop event from bubbling to the card link
                    quiz.isFavorite = !quiz.isFavorite;
                    favoriteIcon.innerHTML = quiz.isFavorite ? '❤️' : '🤍';
                    favoriteIcon.setAttribute('aria-label', quiz.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가');
                    // Here you would typically also update the backend/localStorage
                    console.log(`Quiz ${quiz.id} favorite status: ${quiz.isFavorite}`);
                });
                favoriteIcon.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        favoriteIcon.click();
                    }
                });


                const commentsIcon = document.createElement('span');
                commentsIcon.className = 'quiz-card-icon comments-icon';
                commentsIcon.innerHTML = `💬 ${quiz.commentsCount}`; // Speech bubble icon
                commentsIcon.setAttribute('aria-label', `댓글 ${quiz.commentsCount}개`);


                footer.appendChild(favoriteIcon);
                footer.appendChild(commentsIcon);

                link.appendChild(image);
                link.appendChild(title);
                link.appendChild(date);
                link.appendChild(footer);
                card.appendChild(link);
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
                    quiz.title.toLowerCase().includes(searchTerm)
                );
                renderQuizCards(filteredQuizzes);
            });
        } else {
            console.error("ID가 'quiz-search-input'인 요소를 찾을 수 없습니다.");
        }
    }

    initializeQuizApp();

    // 추가적인 전역 초기화 로직이 필요하면 여기에 작성합니다.
});
