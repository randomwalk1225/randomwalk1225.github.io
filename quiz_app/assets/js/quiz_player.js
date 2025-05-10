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
            const rawQuizData = await response.json();
            
            if (Array.isArray(rawQuizData) && rawQuizData.length > 0 && rawQuizData[0].title) {
                if (quizTitleEl) {
                    quizTitleEl.textContent = rawQuizData[0].title;
                }
                currentQuizData = rawQuizData.slice(1); // 첫 번째 객체(타이틀)를 제외한 나머지가 실제 퀴즈 문제
            } else {
                // title 정보가 없거나 형식이 맞지 않는 경우, 기존 방식대로 quizId 사용 또는 에러 처리
                if (quizTitleEl) {
                    let title = id;
                    if (id === 'math101') title = "수학 101 퀴즈";
                    else if (id === 'history_basics') title = "역사 기초 퀴즈";
                    else title = "퀴즈"; // 기본값
                    quizTitleEl.textContent = title;
                }
                currentQuizData = rawQuizData; // 원본 데이터를 그대로 사용하거나, 적절히 필터링
                console.warn("퀴즈 데이터에 title 정보가 없거나 형식이 올바르지 않습니다. quiz.json의 첫 번째 객체에 { \"title\": \"퀴즈 제목\" } 형식으로 추가해주세요.");
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
        if (!currentQuizData || currentQuizData.length === 0 || !quizContentEl) {
            if (quizContentEl) quizContentEl.innerHTML = '<p>퀴즈 문제를 불러올 수 없습니다.</p>';
            if (submitButton) submitButton.style.display = 'none';
            return;
        }
        quizContentEl.innerHTML = ''; // 기존 내용 초기화

        // currentQuizData는 이제 순수 문제 객체들의 배열입니다.
        currentQuizData.forEach((q, index) => {
            if (!q || typeof q.id === 'undefined') { // title 객체가 아닌 실제 문제 객체인지 한번 더 확인
                console.warn('잘못된 형식의 문제 데이터가 포함되어 있습니다:', q);
                return; // 다음 문제로 넘어감
            }
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
                q.options.forEach((option, optIndex) => {
                    const optionId = `q${q.id}-option${optIndex}`;
                    const label = document.createElement('label');
                    label.htmlFor = optionId; // 라벨과 라디오 버튼 연결
                    label.classList.add('quiz-option-label');

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.id = optionId;
                    radio.name = `question-${q.id}`;
                    radio.value = option;
                    radio.classList.add('quiz-option-radio'); // CSS에서 숨기기 위함
                    radio.addEventListener('change', (e) => {
                        userAnswers[q.id] = e.target.value;
                        // 선택 시 시각적 피드백 업데이트
                        document.querySelectorAll(`input[name="question-${q.id}"]`).forEach(rb => {
                            rb.parentElement.classList.remove('selected');
                        });
                        if (e.target.checked) {
                            e.target.parentElement.classList.add('selected');
                        }
                    });
                    
                    label.appendChild(radio);
                    // 번호와 옵션 텍스트 추가
                    const optionText = document.createElement('span');
                    optionText.textContent = `${optIndex + 1}) ${option}`; // 번호 형식 변경
                    label.appendChild(optionText);
                    
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

        // MathJax에게 새로 추가된 콘텐츠를 다시 렌더링하도록 알림
        if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch((err) => console.error('MathJax typesetPromise failed:', err));
        }
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

            // currentQuizData는 실제 문제들만 담고 있으므로, 길이를 그대로 사용합니다.
            const answeredQuestions = Object.keys(userAnswers).length;
            const totalQuestionsCount = currentQuizData.filter(q => q && typeof q.id !== 'undefined').length;

            if (answeredQuestions !== totalQuestionsCount) {
                const unAnsweredCount = totalQuestionsCount - answeredQuestions;
                const confirmation = confirm(`정답이 체크되지 않은 문제가 ${unAnsweredCount}개 있습니다. 이대로 제출하시겠습니까?\n(답하지 않은 문제는 오답으로 처리됩니다.)`);
                if (!confirmation) {
                    return; // 제출 취소
                }
            }

            let score = 0;
            const detailedResults = currentQuizData.map(q => {
                if (!q || typeof q.id === 'undefined') return null; // 안전장치
                
                const userAnswerRaw = userAnswers[q.id] || "";
                let isCorrect = false;

                if (q.type === 'short-answer' && (q.answer.includes('$') || userAnswerRaw.includes('$'))) {
                    // 수학식 주관식의 경우 $ 제거 및 공백 정규화 후 비교
                    const normalizeAnswer = (str) => {
                        if (typeof str !== 'string') return "";
                        return str.replace(/\$/g, '').replace(/\s+/g, ' ').trim();
                    };
                    const normalizedUserAnswer = normalizeAnswer(userAnswerRaw);
                    const normalizedCorrectAnswer = normalizeAnswer(q.answer);
                    isCorrect = normalizedUserAnswer.toLowerCase() === normalizedCorrectAnswer.toLowerCase();
                } else {
                    // 일반 주관식 또는 객관식
                    isCorrect = userAnswerRaw.toLowerCase() === q.answer.toLowerCase();
                }

                if (isCorrect) {
                    score++;
                }
                return {
                    questionId: q.id,
                    question: q.question,
                    userAnswer: userAnswerRaw, // userAnswerRaw 변수 사용
                    correctAnswer: q.answer,
                    isCorrect: isCorrect,
                    type: q.type, // 문제 유형 추가
                    isMathInput: q.isMathInput || false // isMathInput 플래그 추가 (없으면 false)
                };
            }).filter(r => r !== null); // null인 경우(잘못된 문제 데이터) 제외

            const totalQuestions = currentQuizData.filter(q => q && typeof q.id !== 'undefined').length;
            const percentageScore = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

            if (quizResultEl) {
                quizResultEl.innerHTML = `
                    <h3>퀴즈 결과</h3>
                    <p><strong>${userId}</strong>님의 점수: ${percentageScore.toFixed(1)}점 (${score}/${totalQuestions})</p>
                    <h4>상세 결과:</h4>
                `;
                const resultCardsContainer = document.createElement('div');
                resultCardsContainer.classList.add('result-cards-container');

                detailedResults.forEach((r, index) => {
                    const card = document.createElement('div');
                    card.classList.add('result-card');
                    card.classList.add(r.isCorrect ? 'correct' : 'incorrect');

                    let displayUserAnswer = r.userAnswer || "(답변 없음)";
                    let displayCorrectAnswer = r.correctAnswer;

                    // isMathInput 플래그가 있고, short-answer 타입이며, $가 없는 경우 추가
                    const originalQuestion = currentQuizData.find(q => q.id === r.questionId);
                    if (originalQuestion && originalQuestion.type === 'short-answer' && originalQuestion.isMathInput) {
                        if (displayUserAnswer !== "(답변 없음)" && !displayUserAnswer.includes('$')) {
                            displayUserAnswer = `$${displayUserAnswer}$`;
                        }
                        // 정답은 quiz.json에 이미 $가 있을 것이므로, 사용자 답안 위주로 처리
                        // 만약 정답에도 $가 없을 수 있다면 아래 코드 추가
                        // if (!displayCorrectAnswer.includes('$')) {
                        //     displayCorrectAnswer = `$${displayCorrectAnswer}$`;
                        // }
                    }

                    card.innerHTML = `
                        <div class="result-card-question"><strong>문제 ${index + 1}:</strong> ${r.question}</div>
                        <div class="result-card-user-answer"><strong>제출 답:</strong> ${displayUserAnswer}</div>
                        <div class="result-card-correct-answer"><strong>정답:</strong> ${displayCorrectAnswer}</div>
                        <div class="result-card-status">${r.isCorrect ? '정답 👍' : '오답 👎'}</div>
                    `;
                    resultCardsContainer.appendChild(card);
                });
                quizResultEl.appendChild(resultCardsContainer);

                // 모든 카드가 추가된 후 MathJax를 한 번 호출 (setTimeout으로 DOM 업데이트 보장)
                if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
                    setTimeout(() => {
                        MathJax.typesetPromise(resultCardsContainer).catch((err) => console.error('MathJax typesetPromise failed for results:', err));
                    }, 0);
                }
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

            // Netlify Function 호출하여 FaunaDB에 저장
            saveResultToServer(resultData);

        } catch (e) {
            console.error("localStorage 저장 중 오류 발생:", e);
            if (quizResultEl) quizResultEl.innerHTML += "<p style='color:red;'>결과를 로컬에 저장하는 중 오류가 발생했습니다.</p>";
        }
    }

    // 초기 퀴즈 데이터 로드 실행
    loadQuizData(quizId);
});

async function saveResultToServer(resultData) {
    const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
    const functionPath = `${siteBaseUrl}/.netlify/functions/saveQuizResult`;

    try {
        const response = await fetch(functionPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultData),
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('서버에 결과 저장 성공:', responseData);
            // 필요하다면 사용자에게 성공 메시지 표시
        } else {
            const errorData = await response.json();
            console.error('서버에 결과 저장 실패:', response.status, errorData);
            // 사용자에게 오류 메시지 표시
            if (document.getElementById('quiz-result')) {
                 document.getElementById('quiz-result').innerHTML += `<p style='color:orange;'>서버에 결과를 저장하는 중 문제가 발생했습니다: ${errorData.error || response.statusText}</p>`;
            }
        }
    } catch (error) {
        console.error('서버 통신 중 네트워크 오류:', error);
        if (document.getElementById('quiz-result')) {
            document.getElementById('quiz-result').innerHTML += "<p style='color:orange;'>서버와 통신 중 네트워크 오류가 발생했습니다.</p>";
        }
    }
}
