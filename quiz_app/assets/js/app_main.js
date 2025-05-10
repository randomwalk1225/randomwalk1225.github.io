document.addEventListener('DOMContentLoaded', async function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizListEl = document.getElementById('quiz-list');
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';

    async function loadQuizManifest() {
        // Jekyll 빌드 시 생성된 _data/quiz_manifest.json을 로드한다고 가정합니다.
        // 실제로는 이 파일이 /assets/quiz_manifest.json 등으로 복사되어 접근 가능해야 합니다.
        // 여기서는 Jekyll의 데이터 파일이 사이트 루트의 data/quiz_manifest.json으로 접근 가능하다고 가정합니다.
        // 또는, Jekyll Collection을 사용하여 각 퀴즈를 페이지로 만들고, 그 목록을 가져올 수도 있습니다.
        // 가장 간단한 방법은 빌드 시점에 quiz_manifest.json을 assets 폴더 같은 곳에 생성하는 것입니다.
        // 지금은 /data/quiz_manifest.json 경로를 사용하겠습니다. (실제로는 _data 폴더는 직접 접근 불가)
        // 이 부분은 Jekyll 빌드 설정에 따라 경로가 달라져야 합니다.
        // 임시로, 각 quiz.json을 직접 fetch하여 title을 가져오는 방식으로 구현합니다.
        // 이는 비효율적이지만, 별도의 manifest 파일 생성 없이 테스트 가능합니다.

        const quizIds = ['math101', 'history_basics']; // 하드코딩된 퀴즈 ID 목록
        let quizzes = [];

        for (const id of quizIds) {
            try {
                const response = await fetch(`${siteBaseUrl}/quizzes/${id}/quiz.json`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0 && data[0].title) {
                        quizzes.push({ id: id, title: data[0].title });
                    } else {
                        quizzes.push({ id: id, title: id }); // Fallback title
                    }
                } else {
                    console.warn(`퀴즈 ${id}의 manifest 정보를 가져오는데 실패했습니다.`);
                    quizzes.push({ id: id, title: id }); // Fallback title
                }
            } catch (error) {
                console.error(`퀴즈 ${id} 로드 중 오류:`, error);
                quizzes.push({ id: id, title: id }); // Fallback title
            }
        }
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
