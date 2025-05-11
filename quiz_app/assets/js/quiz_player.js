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
    async function loadQuizData(id) {
        const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
        const quizDataPath = `${siteBaseUrl}/quizzes/${id}/quiz.json`;

        try {
            const response = await fetch(quizDataPath);
            if (!response.ok) {
                throw new Error(`퀴즈 데이터(${id})를 불러오는 데 실패했습니다: ${response.statusText} (경로: ${quizDataPath})`);
            }
            const rawQuizData = await response.json();
            
            let tempCurrentQuizData; 

            if (Array.isArray(rawQuizData) && rawQuizData.length > 0 && rawQuizData[0].title) {
                if (quizTitleEl) {
                    quizTitleEl.textContent = rawQuizData[0].title;
                }
                tempCurrentQuizData = rawQuizData.slice(1);
            } else {
                if (quizTitleEl) {
                    let title = id;
                    if (id === 'math101') title = "수학 101 퀴즈";
                    else if (id === 'history_basics') title = "역사 기초 퀴즈";
                    else if (id === 'algebra_quiz') title = "이차방정식과 인수분해";
                    else title = "퀴즈";
                    quizTitleEl.textContent = title;
                }
                tempCurrentQuizData = rawQuizData;
                console.warn("퀴즈 데이터에 title 정보가 없거나 형식이 올바르지 않습니다.");
            }

            // MathLive를 이용한 정답 정규화 (isMathInput 문제에 대해)
            if (typeof MathfieldElement !== 'undefined' && tempCurrentQuizData) {
                const tempMathField = new MathfieldElement();
                
                currentQuizData = tempCurrentQuizData.map(q => {
                    if (q.type === 'short-answer' && q.isMathInput && typeof q.answer === 'string') {
                        let initialLatex = q.answer.replace(/\$/g, ''); 
                        tempMathField.value = initialLatex; 
                        return { ...q, answer: tempMathField.value }; 
                    }
                    return q;
                });
            } else if (tempCurrentQuizData) {
                console.warn("MathLive (MathfieldElement)가 로드되지 않아 정답 정규화를 건너<0xC2><0xAD>뜁니다.");
                currentQuizData = tempCurrentQuizData; // 정규화 없이 그대로 사용
            } else {
                currentQuizData = []; // 데이터가 아예 없는 경우
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
        quizContentEl.innerHTML = ''; 

        currentQuizData.forEach((q, index) => {
            if (!q || typeof q.id === 'undefined') {
                console.warn('잘못된 형식의 문제 데이터가 포함되어 있습니다:', q);
                return; 
            }
            const questionItem = document.createElement('div');
            questionItem.classList.add('question-item');
            questionItem.innerHTML = `<h4>문제 ${index + 1}. ${q.question}</h4>`;

            if (q.image) {
                const img = document.createElement('img');
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
                    label.htmlFor = optionId; 
                    label.classList.add('quiz-option-label');

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.id = optionId;
                    radio.name = `question-${q.id}`;
                    radio.value = option;
                    radio.classList.add('quiz-option-radio'); 
                    radio.addEventListener('change', (e) => {
                        userAnswers[q.id] = e.target.value;
                        document.querySelectorAll(`input[name="question-${q.id}"]`).forEach(rb => {
                            rb.parentElement.classList.remove('selected');
                        });
                        if (e.target.checked) {
                            e.target.parentElement.classList.add('selected');
                        }
                    });
                    
                    label.appendChild(radio);
                    const optionText = document.createElement('span');
                    optionText.textContent = `${optIndex + 1}) ${option}`; 
                    label.appendChild(optionText);
                    optionsDiv.appendChild(label);
                });
            } else if (q.type === 'short-answer') {
                if (q.isMathInput) {
                    const mathField = document.createElement('math-field');
                    mathField.id = `math-input-${q.id}`; 
                    mathField.addEventListener('input', (e) => {
                        userAnswers[q.id] = e.target.value; 
                    });
                    optionsDiv.appendChild(mathField);
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.name = `question-${q.id}`;
                    input.classList.add('short-answer-input');
                    input.addEventListener('input', (e) => userAnswers[q.id] = e.target.value.trim());
                    optionsDiv.appendChild(input);
                }
            }
            questionItem.appendChild(optionsDiv);
            quizContentEl.appendChild(questionItem);
        });

        if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch((err) => console.error('MathJax typesetPromise failed:', err));
        }
    }

    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const userId = userIdInput ? userIdInput.value.trim() : null;
            if (!userId) {
                alert("사용자 ID를 입력해주세요.");
                if (userIdInput) userIdInput.focus();
                return;
            }

            const answeredQuestions = Object.keys(userAnswers).length;
            const totalQuestionsCount = currentQuizData.filter(q => q && typeof q.id !== 'undefined').length;

            if (answeredQuestions !== totalQuestionsCount) {
                const unAnsweredCount = totalQuestionsCount - answeredQuestions;
                const confirmation = confirm(`정답이 체크되지 않은 문제가 ${unAnsweredCount}개 있습니다. 이대로 제출하시겠습니까?\n(답하지 않은 문제는 오답으로 처리됩니다.)`);
                if (!confirmation) {
                    return; 
                }
            }

            let score = 0;
            const detailedResults = currentQuizData.map(q => {
                if (!q || typeof q.id === 'undefined') return null; 
                
                const userAnswerRaw = userAnswers[q.id] || "";
                let isCorrect = false;

                if (q.type === 'short-answer' && q.isMathInput) {
                    // 수학식 주관식: $ 제거, 유니코드 마이너스 기호 표준화, 모든 공백 제거 후 소문자 비교
                    const normalizeMathAnswer = (str) => {
                        if (typeof str !== 'string') return "";
                        return str.replace(/\$/g, '')              // $ 기호 제거
                                  .replace(/\\left\(/g, '(')       // \left(  -> (
                                  .replace(/\\right\)/g, ')')      // \right) -> )
                                  .replace(/\u2212/g, '-')         // 수학 마이너스 기호(U+2212)를 일반 하이픈(-)으로 변경
                                  .replace(/\s/g, '')              // 모든 공백 문자 제거
                                  .toLowerCase();                 // 소문자로 변경
                    };
                    const normalizedUserAnswer = normalizeMathAnswer(userAnswerRaw);
                    const normalizedCorrectAnswer = normalizeMathAnswer(q.answer); // q.answer는 loadQuizData에서 MathLive로 정규화된 값
                    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
                } else {
                    // 일반 주관식 또는 객관식: 앞뒤 공백 제거 후 소문자 비교
                    isCorrect = userAnswerRaw.trim().toLowerCase() === q.answer.trim().toLowerCase();
                }

                if (isCorrect) {
                    score++;
                }
                return {
                    questionId: q.id,
                    question: q.question,
                    userAnswer: userAnswerRaw, 
                    correctAnswer: q.answer, // MathLive로 정규화된 정답
                    isCorrect: isCorrect,
                    type: q.type, 
                    isMathInput: q.isMathInput || false 
                };
            }).filter(r => r !== null); 

            const percentageScore = totalQuestionsCount > 0 ? (score / totalQuestionsCount) * 100 : 0;

            if (quizResultEl) {
                quizResultEl.innerHTML = `
                    <h3 class="quiz-result-title">퀴즈 결과</h3>
                    <div class="score-summary">
                        <p><strong>${userId}</strong>님의 점수: 
                            <span class="score-value">${percentageScore.toFixed(1)}</span>점 
                            (<span class="score-detail">${score}/${totalQuestionsCount}</span>)
                        </p>
                    </div>
                    <h4>상세 결과:</h4>
                `;
                const resultCardsContainer = document.createElement('div');
                resultCardsContainer.classList.add('result-cards-container');

                detailedResults.forEach((r, index) => {
                    const card = document.createElement('div');
                    card.classList.add('result-card');
                    card.classList.add(r.isCorrect ? 'correct' : 'incorrect');

                    let displayUserAnswer = r.userAnswer || "(답변 없음)";
                    let displayCorrectAnswer = r.correctAnswer; // 이미 MathLive 정규화된 값

                    // 결과 표시 시 $ 추가 (MathJax 렌더링용)
                    if (r.type === 'short-answer' && r.isMathInput) {
                        if (displayUserAnswer !== "(답변 없음)" && !displayUserAnswer.includes('$')) {
                            displayUserAnswer = `$${displayUserAnswer}$`;
                        }
                        // displayCorrectAnswer는 이미 MathLive 표준 LaTeX이므로, $만 추가 (필요하다면)
                        if (displayCorrectAnswer && !displayCorrectAnswer.includes('$')) { 
                           displayCorrectAnswer = `$${displayCorrectAnswer}$`;
                        }
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

                if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
                    setTimeout(() => {
                        MathJax.typesetPromise().catch((err) => console.error('MathJax typesetPromise failed for results:', err));
                    }, 0);
                }
            }
            
            if (submitButton) submitButton.style.display = 'none'; 
            if (userIdInput) userIdInput.disabled = true; 

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
            saveResultToServer(resultData);
        } catch (e) {
            console.error("localStorage 저장 중 오류 발생:", e);
            if (quizResultEl) quizResultEl.innerHTML += "<p style='color:red;'>결과를 로컬에 저장하는 중 오류가 발생했습니다.</p>";
        }
    }
    loadQuizData(quizId);
});

async function saveResultToServer(resultData) {
    const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app"; // 실제 Netlify 사이트 URL로 변경 필요
    const functionPath = `${netlifySiteUrl}/.netlify/functions/saveQuizResult`;

    try {
        const response = await fetch(functionPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(resultData),
        });

        const responseText = await response.text(); // 먼저 텍스트로 응답을 받음

        if (response.ok) {
            try {
                const responseData = JSON.parse(responseText); // 성공 응답은 JSON으로 파싱
                console.log('서버에 결과 저장 성공:', responseData);
            } catch (e) {
                console.error('서버 성공 응답 JSON 파싱 실패:', responseText, e);
                // 성공했지만 JSON이 아닌 경우 (드묾), 일단 콘솔에 로그만 남김
            }
        } else {
            let errorDetail = response.statusText;
            try {
                const errorJson = JSON.parse(responseText); // 오류 응답도 JSON으로 파싱 시도
                errorDetail = errorJson.error || errorJson.message || response.statusText;
            } catch (e) {
                console.error('서버 오류 응답 JSON 파싱 실패:', responseText, e);
            }
            console.error('서버에 결과 저장 실패:', response.status, errorDetail);
            if (document.getElementById('quiz-result')) {
                 document.getElementById('quiz-result').innerHTML += `<p style='color:orange;'>서버에 결과를 저장하는 중 문제가 발생했습니다 (${response.status}): ${errorDetail}</p>`;
            }
        }
    } catch (error) { // 네트워크 수준의 오류 (fetch 자체가 실패)
        console.error('서버 통신 중 네트워크 오류:', error);
        if (document.getElementById('quiz-result')) {
            document.getElementById('quiz-result').innerHTML += `<p style='color:orange;'>서버와 통신 중 네트워크 오류가 발생했습니다: ${error.message}</p>`;
        }
    }
}
