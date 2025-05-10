document.addEventListener('DOMContentLoaded', function() {
    console.log("퀴즈 앱 메인 스크립트 로드됨");

    const quizList = document.getElementById('quiz-list');

    // TODO: Jekyll 환경에서는 이 부분이 다르게 처리되어야 합니다.
    // 예를 들어, Jekyll 빌드 시점에 _data/quiz_manifest.json 같은 파일을 생성하고,
    // 해당 파일을 fetch하여 퀴즈 목록을 동적으로 구성할 수 있습니다.
    // 여기서는 하드코딩된 예시를 유지합니다.

    if (quizList) {
        // 예시: 만약 quizList가 비어있다면 (정적 생성된 목록이 없다면) 메시지 표시
        if (quizList.children.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = '현재 등록된 퀴즈가 없습니다.';
            quizList.appendChild(listItem);
        }
    } else {
        console.error("ID가 'quiz-list'인 요소를 찾을 수 없습니다.");
    }

    // 추가적인 전역 초기화 로직이 필요하면 여기에 작성합니다.
});
