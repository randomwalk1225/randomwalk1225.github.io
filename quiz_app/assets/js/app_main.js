document.addEventListener('DOMContentLoaded', async function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizListEl = document.getElementById('quiz-list');
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';

    async function loadQuizManifest() {
        let quizIds = [];
        try {
            // Fetch the list of quiz IDs (directory names) from the Netlify function
            // Ensure the Netlify site URL is correctly configured or use a relative path if deployed on the same site
            const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app"; // Or use siteBaseUrl if Netlify functions are on the same domain
            const functionPath = `${netlifySiteUrl}/.netlify/functions/getQuizList`;
            
            const response = await fetch(functionPath);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Netlify 함수(getQuizList) 호출 실패: ${response.status} ${response.statusText}. 응답: ${errorText}`);
            }
            // The function now returns an array of objects: [{id: "...", title: "..."}, ...]
            let quizzes = await response.json();

            if (!Array.isArray(quizzes)) {
                console.error("getQuizList 함수에서 배열을 반환하지 않았습니다:", quizzes);
                throw new Error("퀴즈 목록 형식이 잘못되었습니다.");
            }
            
            if (quizzes.length === 0) {
                console.log("사용 가능한 퀴즈가 없습니다.");
            } else {
                // Ensure each item has an id and title, default title to id if missing
                quizzes = quizzes.map(quiz => ({
                    id: quiz.id,
                    title: quiz.title || quiz.id 
                }));
                // Sort quizzes by title alphabetically for consistent ordering
                quizzes.sort((a, b) => a.title.localeCompare(b.title));
            }
            return quizzes;

        } catch (error) {
            console.error("퀴즈 목록을 가져오는 중 오류 발생:", error);
            if (quizListEl) quizListEl.innerHTML = `<li>퀴즈 목록을 불러오는 데 실패했습니다: ${error.message}</li>`;
            return []; // Return empty array on error
        }
    }

    if (quizListEl) {
        quizListEl.innerHTML = '<li>퀴즈 목록을 불러오는 중...</li>'; // 로딩 메시지
        try {
            const quizzes = await loadQuizManifest();
            quizListEl.innerHTML = ''; // 로딩 메시지 제거

            if (quizzes && quizzes.length > 0) {
                quizzes.forEach(quiz => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    // Jekyll의 relative_url 필터는 JavaScript에서 직접 사용할 수 없으므로,
                    // siteBaseUrl을 활용하여 경로를 구성합니다.
                    link.href = `${siteBaseUrl}/quiz_app/take.html?quiz=${quiz.id}`;
                    link.textContent = quiz.title;
                    listItem.appendChild(link);
                    quizListEl.appendChild(listItem);
                });
            } else {
                quizListEl.innerHTML = '<li>현재 등록된 퀴즈가 없습니다.</li>';
            }
        } catch (error) {
            console.error("퀴즈 목록 로드 실패:", error);
            quizListEl.innerHTML = '<li>퀴즈 목록을 불러오는 데 실패했습니다.</li>';
        }
    } else {
        console.error("ID가 'quiz-list'인 요소를 찾을 수 없습니다.");
    }

    // 추가적인 전역 초기화 로직이 필요하면 여기에 작성합니다.
});
