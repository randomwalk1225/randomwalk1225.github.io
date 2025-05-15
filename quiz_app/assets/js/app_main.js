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
            quizIds = await response.json();

            if (!Array.isArray(quizIds)) {
                console.error("getQuizList 함수에서 배열을 반환하지 않았습니다:", quizIds);
                throw new Error("퀴즈 목록 형식이 잘못되었습니다.");
            }

        } catch (error) {
            console.error("퀴즈 ID 목록을 가져오는 중 오류 발생:", error);
            // Fallback or error display
            if (quizListEl) quizListEl.innerHTML = `<li>퀴즈 목록을 불러오는 데 실패했습니다: ${error.message}</li>`;
            return []; // Return empty array on error
        }

        let quizzes = [];
        if (quizIds.length === 0) {
            console.log("사용 가능한 퀴즈 ID가 없습니다.");
            // No need to fetch titles if no IDs
        } else {
            for (const id of quizIds) {
                try {
                    const quizJsonResponse = await fetch(`${siteBaseUrl}/quizzes/${id}/quiz.json`);
                    if (quizJsonResponse.ok) {
                        const data = await quizJsonResponse.json();
                        // Assuming quiz.json structure: [{ "title": "Quiz Title" }, {question_data...}]
                        // Or if quiz.json is an object with a "title" property at the root, adjust accordingly.
                        // The current quiz_player.js logic suggests the title is in data[0].title for array-based quiz.json
                        let title = id; // Default title to ID
                        if (Array.isArray(data) && data.length > 0 && data[0].title) {
                            title = data[0].title;
                        } else if (data && data.title) { // Alternative: if quiz.json is an object with a title
                             title = data.title;
                        }
                        quizzes.push({ id: id, title: title });
                    } else {
                        console.warn(`퀴즈 "${id}"의 quiz.json 파일을 가져오는데 실패했습니다. 상태: ${quizJsonResponse.status}`);
                        quizzes.push({ id: id, title: id }); // Fallback title
                    }
                } catch (error) {
                    console.error(`퀴즈 "${id}"의 quiz.json 처리 중 오류:`, error);
                    quizzes.push({ id: id, title: id }); // Fallback title
                }
            }
        }
        
        // Sort quizzes by title alphabetically for consistent ordering
        quizzes.sort((a, b) => a.title.localeCompare(b.title));
        
        return quizzes;
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
