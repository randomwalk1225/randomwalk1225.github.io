document.addEventListener('DOMContentLoaded', function() {
    console.log("퀴즈 플레이어 스크립트 로드됨");

    const quizTitleEl = document.getElementById('quiz-title');
    const quizContentEl = document.getElementById('quiz-content');
    const submitButton = document.getElementById('submit-quiz');
    const quizResultEl = document.getElementById('quiz-result');
    const userIdInput = document.getElementById('userId');

    let currentQuizData = null;
    let userAnswers = {};

    // URL에서 퀴즈 ID 가져오기
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('quiz');

    if (!quizId) {
        quizContentEl.innerHTML = '<p>오류: 퀴즈 ID가 지정되지 않았습니다.</p>';
        if (submitButton) submitButton.style.display = 'none';
        return;
    }

    // 퀴즈 데이터 로드
    // 실제 환경에서는 /quizzes/[quizId]/quiz.json 경로에서 fetch 합니다.
    // 예시를 위해 가상 데이터 사용
    async function loadQuizData(id) {
        // Jekyll에서는 상대 경로를 올바르게 처리해야 합니다.
        const siteBaseUrl = document.body.getAttribute('data-baseurl') || ''; // Jekyll의 baseurl을 가져오기 위한 방법 (레이아웃에 설정 필요)
        const quizDataPath = `${siteBaseUrl}/quizzes/${id}/quiz.json`;


        try {
            const response = await fetch(quizDataPath);
            if (!response.ok) {
                throw new Error(`퀴즈 데이터(${id})를 불러오는 데 실패했습니다: ${response.statusText} (경로: ${quizDataPath})`);
            }
            currentQuizData = await response.json();
            
            // 퀴즈 제목 설정 (quiz.json에 title 필드가 있다고 가정하거나, 폴더명 기반으로)
            // 예시: currentQuizData.title || id;
            if (quizTitleEl) {
                // quiz.json 파일 내에 title 속성이 있다면 그것을 사용, 없다면 quizId를 활용
                // 예를 들어, quiz.json 최상위에 "title": "수학 101 퀴즈" 와 같이 추가할 수 있습니다.
                // 지금은 임시로 quizId를 사용합니다.
                let title = id;
                if (id === 'math101') title = "수학 101 퀴즈";
                else if (id === 'history_basics') title = "역사 기초 퀴즈";
                quizTitleEl.textContent = title;
            }
            
            renderQuiz();

        } catch (error) {
            console.error(error);
            if (quizContentEl) quizContentEl.innerHTML = `<p>${error.message}</p>`;
            if (submitButton) submitButton.style.display = 'none';
        }
    }

    // 퀴즈 렌더링
    function renderQuiz() {
        if (!currentQuizData || !quizContentEl) return;
        quizContentEl.innerHTML = ''; // 기존 내용 초기화

        currentQuizData.forEach((q, index) => {
            const questionItem = document.createElement('div');
            questionItem.classList.add('question-item');
            questionItem.innerHTML = `
                <h4>문제 ${index + 1}. ${q.question}</h4>
            `;

            if (q.image) {
                const img = document.createElement('img');
                // q.image는 quiz.json에 정의된 {{ '/quizzes/quiz_id/assets/image.png' | relative_url }} 형태의 문자열입니다.
                // 이 문자열은 Jekyll 빌드 시 실제 경로로 변환됩니다.
                // JavaScript에서는 이 변환된 경로를 그대로 사용합니다.
                // 만약 Jekyll 빌드 없이 순수 HTML/JS로 테스트한다면, 이 경로가 올바르지 않을 수 있습니다.
                // 이 경우, quiz.json의 경로를 상대경로로 수정하거나, JS에서 baseurl을 고려하여 경로를 재조립해야 합니다.
                // 여기서는 Jekyll이 경로를 올바르게 처리해준다고 가정합니다.
                img.src = q.image; 
                img.alt = `문제 ${index + 1} 이미지`;
                questionItem.appendChild(img);
            }
            if (q.video) {
                const video = document.createElement('video');
                video.src = q.video; 
                video.controls = true;
                questionItem.appendChild(video);
            }


            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('options');

            if (q.type === 'multiple-choice') {
                q.options.forEach(option => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question-${q.id}`;
                    radio.value = option;
                    radio.addEventListener('change', (e) => userAnswers[q.id] = e.target.value);
                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(option));
                    optionsDiv.appendChild(label);
                });
            } else if (q.type === 'short-answer') {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `question-${q.id}`;
                input.addEventListener('input', (e) => userAnswers[q.id] = e.target.value.trim());
                optionsDiv.appendChild(input);
            }
            questionItem.appendChild(optionsDiv);
            quizContentEl.appendChild(questionItem);
        });
    }

    // 퀴즈 제출 처리
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const userId = userIdInput ? userIdInput.value.trim() : null;
            if (!userId) {
                alert("사용자 ID를 입력해주세요.");
                if (userIdInput) userIdInput.focus();
                return;
            }

            if (Object.keys(userAnswers).length !== currentQuizData.length) {
                alert('모든 문제에 답해주세요.');
                return;
            }

            let score = 0;
            const detailedResults = currentQuizData.map(q => {
                const userAnswer = userAnswers[q.id] || "";
                const isCorrect = userAnswer.toLowerCase() === q.answer.toLowerCase();
                if (isCorrect) {
                    score++;
                }
                return {
                    questionId: q.id,
                    question: q.question,
                    userAnswer: userAnswer,
                    correctAnswer: q.answer,
                    isCorrect: isCorrect
                };
            });

            const totalQuestions = currentQuizData.length;
            const percentageScore = (score / totalQuestions) * 100;

            if (quizResultEl) {
                quizResultEl.innerHTML = `
                    <h3>퀴즈 결과</h3>
                    <p><strong>${userId}</strong>님의 점수: ${percentageScore.toFixed(1)}점 (${score}/${totalQuestions})</p>
                    <h4>상세 결과:</h4>
                `;
                const resultList = document.createElement('ul');
                detailedResults.forEach(r => {
                    const item = document.createElement('li');
                    item.innerHTML = `<strong>문제:</strong> ${r.question}<br>
                                      <strong>제출 답:</strong> ${r.userAnswer} <br>
                                      <strong>정답:</strong> ${r.correctAnswer} <br>
                                      <strong>결과:</strong> ${r.isCorrect ? '정답' : '오답'}`;
                    item.style.color = r.isCorrect ? 'green' : 'red';
                    resultList.appendChild(item);
                });
                quizResultEl.appendChild(resultList);
            }
            
            if (submitButton) submitButton.style.display = 'none'; // 제출 후 버튼 숨김
            if (userIdInput) userIdInput.disabled = true; // ID 입력창 비활성화

            // 결과 저장 (localStorage)
            saveResultToLocalStorage(userId, quizId, percentageScore, detailedResults);
        });
    }

    function saveResultToLocalStorage(userId, quizId, score, answers) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const resultData = {
            userId: userId,
            quizId: quizId,
            quizTitle: quizTitleEl ? quizTitleEl.textContent : quizId,
            timestamp: timestamp,
            score: score,
            answers: answers
        };

        try {
            let userHistory = JSON.parse(localStorage.getItem(`quizHistory_${userId}`)) || [];
            userHistory.push(resultData);
            localStorage.setItem(`quizHistory_${userId}`, JSON.stringify(userHistory));
            console.log("결과가 localStorage에 저장되었습니다.");
            // TODO: 서버리스 함수를 통한 영구 저장 로직 추가
        } catch (e) {
            console.error("localStorage 저장 중 오류 발생:", e);
            if (quizResultEl) quizResultEl.innerHTML += "<p style='color:red;'>결과를 로컬에 저장하는 중 오류가 발생했습니다.</p>";
        }
    }

    // 초기 퀴즈 데이터 로드 실행
    loadQuizData(quizId);
});
