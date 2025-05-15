document.addEventListener('DOMContentLoaded', function() {
    console.log("퀴즈 플레이어 스크립트 로드됨");

    const quizTitleEl = document.getElementById('quiz-title');
    const quizContentEl = document.getElementById('quiz-content');
    const submitButton = document.getElementById('submit-quiz');
    const quizResultEl = document.getElementById('quiz-result');
    
    // 시간/타이머 위젯 요소
    const timerWidgetEl = document.getElementById('quiz-timer-widget');
    const currentTimeDisplayEl = document.getElementById('current-time-display');
    const elapsedTimeDisplayEl = document.getElementById('quiz-elapsed-time-display');
    const toggleTimerVisibilityButton = document.getElementById('toggle-timer-visibility');

    let currentQuizData = null;
    let userAnswers = {};
    let quizStartTime = null;
    let elapsedTimeInterval = null;
    let currentTimeInterval = null;
    let timerVisible = localStorage.getItem('quizTimerVisible') === 'false' ? false : true; // 기본값 true

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
            
            let tempCurrentQuizData = []; // Initialize as empty array
            let actualQuizTitle = id; // Default title to quizId

            if (typeof rawQuizData === 'object' && rawQuizData !== null) {
                if (typeof rawQuizData.title === 'string' && Array.isArray(rawQuizData.quizzes)) {
                    // New format: { title: "...", quizzes: [...] }
                    actualQuizTitle = rawQuizData.title;
                    tempCurrentQuizData = rawQuizData.quizzes;
                    console.log("New quiz format detected (object with title and quizzes array).");
                } else if (Array.isArray(rawQuizData) && rawQuizData.length > 0 && rawQuizData[0] && typeof rawQuizData[0].title === 'string') {
                    // Old format: [ {title: "..."}, {question...}, ... ]
                    actualQuizTitle = rawQuizData[0].title;
                    tempCurrentQuizData = rawQuizData.slice(1);
                    console.log("Old quiz format detected (array with title object as first element).");
                } else if (Array.isArray(rawQuizData)) {
                    // Fallback: Assume rawQuizData is directly an array of questions (no title in data)
                    tempCurrentQuizData = rawQuizData;
                    console.warn("Quiz data is an array, but no title found in the expected format. Using quiz ID as title.");
                    // actualQuizTitle remains quizId
                } else {
                    // Unrecognized format
                    console.error("Quiz data format is not recognized:", rawQuizData);
                    throw new Error(`퀴즈 데이터(${id}) 형식이 올바르지 않습니다.`);
                }
            } else {
                 console.error("Quiz data is not an object or array:", rawQuizData);
                 throw new Error(`퀴즈 데이터(${id})를 파싱할 수 없습니다.`);
            }

            if (quizTitleEl) {
                quizTitleEl.textContent = actualQuizTitle;
            }

            // Process questions
            if (!Array.isArray(tempCurrentQuizData)) {
                // This case should ideally be caught by the logic above, but as a safeguard:
                console.error("Critical error: tempCurrentQuizData is not an array before mapping. Data:", tempCurrentQuizData);
                currentQuizData = []; // Prevent .map error by ensuring currentQuizData is an array
                // Optionally, re-throw an error or display a more user-friendly message
                // throw new Error(`퀴즈 문제 데이터를 처리할 수 없습니다.`);
            } else if (typeof MathfieldElement !== 'undefined' && tempCurrentQuizData.length > 0) {
                const tempMathField = new MathfieldElement();
                currentQuizData = tempCurrentQuizData.map(q => {
                    if (q && q.type === 'short-answer' && q.isMathInput && typeof q.answer === 'string') {
                        let initialLatex = q.answer.replace(/\$/g, ''); 
                        tempMathField.value = initialLatex; 
                        return { ...q, answer: tempMathField.value }; 
                    }
                    return q;
                });
            } else if (tempCurrentQuizData.length > 0) {
                console.warn("MathLive (MathfieldElement)가 로드되지 않아 수학 문제 정답 정규화를 건너<0xC2><0xAD>뜁니다.");
                currentQuizData = tempCurrentQuizData; // Assign directly if MathLive is not available but data exists
            } else {
                // tempCurrentQuizData is an empty array (or became one due to an error)
                currentQuizData = []; // Ensure currentQuizData is an empty array
                console.log("No quiz questions found or processed.");
            }
            
            renderQuiz();
            startTimers(); // 퀴즈 데이터 로드 후 타이머 시작
            updateTimerVisibility(); 
        } catch (error) {
            console.error(error);
            if (quizContentEl) quizContentEl.innerHTML = `<p>${error.message}</p>`;
            if (submitButton) submitButton.style.display = 'none';
            if (timerWidgetEl) timerWidgetEl.style.display = 'none'; // 오류 시 타이머 숨김
        }
    }

    function renderQuiz() {
        if (!currentQuizData || currentQuizData.length === 0 || !quizContentEl) {
            if (quizContentEl) quizContentEl.innerHTML = '<p>퀴즈 문제를 불러올 수 없습니다.</p>';
            if (submitButton) submitButton.style.display = 'none';
            if (timerWidgetEl) timerWidgetEl.style.display = 'none';
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

            if (q.image) { /* ... image/video rendering ... */ }
            if (q.video) { /* ... image/video rendering ... */ }

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
        submitButton.addEventListener('click', async function() { // async 추가
            const userIdInput = document.getElementById('userIdQuiz');
            if (!userIdInput || !userIdInput.value.trim()) {
                alert("퀴즈를 제출하려면 사용자 ID를 입력해야 합니다.");
                if (userIdInput) userIdInput.focus();
                return;
            }
            const userId = userIdInput.value.trim(); // Get User ID from input field
            const userDisplayNameForResults = userId; // Use the entered ID for display

            // The supabase check and getUser call are removed as we are not using Supabase auth for this.
            // if (!supabase) {
            //     alert("인증 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.");
            //     return;
            // }
            // const { data: { user } } = await supabase.auth.getUser();
            // if (!user) {
            //     alert("퀴즈를 제출하려면 먼저 로그인해야 합니다.");
            //     return;
            // }

            const answeredQuestions = Object.keys(userAnswers).length;
            const totalQuestionsCount = currentQuizData.filter(q => q && typeof q.id !== 'undefined').length;

            if (answeredQuestions !== totalQuestionsCount) {
                const unAnsweredCount = totalQuestionsCount - answeredQuestions;
                const confirmation = confirm(`정답이 체크되지 않은 문제가 ${unAnsweredCount}개 있습니다. 이대로 제출하시겠습니까?\n(답하지 않은 문제는 오답으로 처리됩니다.)`);
                if (!confirmation) { return; }
            }

            let score = 0;
            let incorrectQuestionIds = []; // 틀린 문제 ID를 저장할 배열
            const detailedResults = currentQuizData.map(q => {
                if (!q || typeof q.id === 'undefined') return null; 
                
                const userAnswerRaw = userAnswers[q.id] || "";
                let isCorrect = false;

                if (q.type === 'short-answer' && q.isMathInput) {
                    const normalizeMathAnswer = (str) => {
                        if (typeof str !== 'string') return "";
                        return str.replace(/\$/g, '').replace(/\\left\(/g, '(').replace(/\\right\)/g, ')').replace(/\u2212/g, '-').replace(/\s/g, '').toLowerCase();
                    };
                    const normalizedUserAnswer = normalizeMathAnswer(userAnswerRaw);
                    const normalizedCorrectAnswer = normalizeMathAnswer(q.answer);
                    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
                } else {
                    isCorrect = userAnswerRaw.trim().toLowerCase() === q.answer.trim().toLowerCase();
                }

                if (isCorrect) {
                    score++;
                } else {
                    incorrectQuestionIds.push(q.id); // 틀렸으면 ID 추가
                }
                return {
                    questionId: q.id, question: q.question, userAnswer: userAnswerRaw, 
                    correctAnswer: q.answer, isCorrect: isCorrect, type: q.type, 
                    isMathInput: q.isMathInput || false 
                };
            }).filter(r => r !== null); 

            const percentageScore = totalQuestionsCount > 0 ? (score / totalQuestionsCount) * 100 : 0;

            if (quizResultEl) {
                quizResultEl.innerHTML = `
                    <h3 class="quiz-result-title">퀴즈 결과</h3>
                    <div class="score-summary">
                        <p><strong>${userDisplayNameForResults}</strong>님의 점수: 
                            <span class="score-value">${percentageScore.toFixed(1)}</span>점 
                            (<span class="score-detail">${score}/${totalQuestionsCount}</span>)
                        </p>
                    </div>
                    <h4>상세 결과:</h4>`;
                const resultCardsContainer = document.createElement('div');
                resultCardsContainer.classList.add('result-cards-container');
                detailedResults.forEach((r, index) => {
                    const card = document.createElement('div');
                    card.classList.add('result-card');
                    card.classList.add(r.isCorrect ? 'correct' : 'incorrect');
                    // 참고: incorrectQuestionIds는 이 함수의 지역 변수이므로, 
                    // highlight-incorrect 클래스 추가 로직은 여기서도 가능합니다.
                    // if (!r.isCorrect && incorrectQuestionIds.includes(r.questionId)) {
                    //     card.classList.add('highlight-incorrect');
                    // }
                
                    let displayUserAnswer = r.userAnswer || "(답변 없음)";
                    let displayCorrectAnswer = r.correctAnswer;

                    // 해설 추가 (quiz.json의 각 문제 객체에 "explanation": "해설 내용" 추가 필요)
                    let explanationHtml = '';
                    if (r.explanation) { 
                        explanationHtml = `<div class="result-card-explanation"><strong>해설:</strong> ${r.explanation}</div>`;
                    }

                    if (r.type === 'short-answer' && r.isMathInput) {
                        if (displayUserAnswer !== "(답변 없음)" && !displayUserAnswer.includes('$')) {
                            displayUserAnswer = `$${displayUserAnswer}$`;
                        }
                        if (displayCorrectAnswer && !displayCorrectAnswer.includes('$')) { 
                           displayCorrectAnswer = `$${displayCorrectAnswer}$`;
                        }
                    }

                    card.innerHTML = `
                        <div class="result-card-question"><strong>문제 ${index + 1}:</strong> ${r.question}</div>
                        <div class="result-card-user-answer"><strong>제출 답:</strong> ${displayUserAnswer}</div>
                        <div class="result-card-correct-answer"><strong>정답:</strong> ${displayCorrectAnswer}</div>
                        ${explanationHtml}
                        <div class="result-card-status">${r.isCorrect ? '정답 👍' : '오답 👎'}</div>
                    `;
                    resultCardsContainer.appendChild(card);
                });
                quizResultEl.appendChild(resultCardsContainer);
                if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
                    setTimeout(() => { MathJax.typesetPromise().catch(err => console.error('MathJax typesetPromise failed for results:', err)); }, 0);
                }
            }
            
            if (submitButton) submitButton.style.display = 'none'; 
            stopTimers(); // 퀴즈 제출 시 타이머 중지

            saveResultToLocalStorage(userId, quizId, percentageScore, detailedResults, incorrectQuestionIds); 
        });
    }

    // --- Timer Functions ---
    function updateCurrentTime() {
        if (!currentTimeDisplayEl || !timerVisible) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        currentTimeDisplayEl.textContent = `${hours}:${minutes}:${seconds}`;
    }

    function updateElapsedTime() {
        if (!elapsedTimeDisplayEl || !quizStartTime || !timerVisible) return;
        const now = new Date();
        const diff = Math.floor((now - quizStartTime) / 1000);
        const minutes = String(Math.floor(diff / 60)).padStart(2, '0');
        const seconds = String(diff % 60).padStart(2, '0');
        elapsedTimeDisplayEl.textContent = `경과 시간: ${minutes}:${seconds}`;
    }

    function startTimers() {
        quizStartTime = new Date();
        if (currentTimeInterval) clearInterval(currentTimeInterval);
        if (elapsedTimeInterval) clearInterval(elapsedTimeInterval);
        
        currentTimeInterval = setInterval(updateCurrentTime, 1000);
        elapsedTimeInterval = setInterval(updateElapsedTime, 1000);
        updateCurrentTime(); // 즉시 한번 실행
        updateElapsedTime(); // 즉시 한번 실행
    }

    function stopTimers() {
        if (currentTimeInterval) clearInterval(currentTimeInterval);
        if (elapsedTimeInterval) clearInterval(elapsedTimeInterval);
    }

    function updateTimerVisibility() {
        if (!timerWidgetEl || !toggleTimerVisibilityButton) return;
        if (timerVisible) {
            timerWidgetEl.style.display = 'block'; // 또는 'flex' 등 CSS에 맞게
            toggleTimerVisibilityButton.textContent = '시계 숨기기';
            updateCurrentTime(); // 보이게 할 때 시간 즉시 업데이트
            updateElapsedTime(); // 보이게 할 때 시간 즉시 업데이트
        } else {
            timerWidgetEl.style.display = 'none';
            toggleTimerVisibilityButton.textContent = '시계 보기'; // 버튼 텍스트는 항상 보이도록 위젯 밖에 둘 수도 있음
        }
    }

    if (toggleTimerVisibilityButton) {
        toggleTimerVisibilityButton.addEventListener('click', () => {
            timerVisible = !timerVisible;
            localStorage.setItem('quizTimerVisible', timerVisible);
            updateTimerVisibility();
        });
    }
    // --- End Timer Functions ---

    function saveResultToLocalStorage(userId, quizId, score, detailedAnswers, incorrectIds) { 
        const now = new Date();
        // timestamp는 서버에서 created_at으로 자동 생성되므로 클라이언트에서 보낼 필요 없음 (선택 사항)
        // const clientTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const resultData = {
            user_id: userId, // Supabase 테이블 컬럼명에 맞춤 (user_id)
            quiz_id: quizId, 
            quiz_title: quizTitleEl ? quizTitleEl.textContent : quizId,
            // timestamp: clientTimestamp, // 서버에서 자동 생성되므로 주석 처리 또는 제거
            score: score, 
            answers_details: detailedAnswers, // 컬럼명 answers_details로 가정
            incorrect_question_ids: incorrectIds,
            total_questions: currentQuizData.filter(q => q && typeof q.id !== 'undefined').length,
            correct_answers_count: detailedAnswers.filter(r => r.isCorrect).length
        };
        try {
            // localStorage 저장은 선택 사항. 서버 저장이 주 목적.
            console.log("[quiz_player.js] Data to be saved:", JSON.stringify(resultData, null, 2)); // 저장될 데이터 확인 로그
            saveResultToServer(resultData);
        } catch (e) {
            console.error("[quiz_player.js] Error during local processing before sending to server:", e);
            if (quizResultEl) quizResultEl.innerHTML += "<p style='color:red;'>결과를 처리하는 중 오류가 발생했습니다.</p>";
        }
    }
    loadQuizData(quizId);
});

// It seems supabase client is loaded via CDN in quiz_layout.html.
// If saveResultToServer or other parts of this script don't actually use a 'supabase' global variable
// initialized by auth.js (which was removed), then the check for 'supabase' might be irrelevant or
// should refer to how the CDN-loaded Supabase client is accessed (e.g., window.supabase).
// For now, assuming saveResultToServer is self-contained with its fetch call.
async function saveResultToServer(resultData) {
    // The check for `supabase` client instance here might be a leftover if it was previously
    // expected to be initialized by a local auth script.
    // The function proceeds to use fetch, so direct supabase client might not be needed for this specific function.
    // if (!supabase) { 
    //     console.error("Supabase client not available in saveResultToServer.");
    //     if (document.getElementById('quiz-result')) {
    //         document.getElementById('quiz-result').innerHTML += `<p style='color:orange;'>결과를 서버에 저장하는 중 시스템 오류가 발생했습니다.</p>`;
    //     }
    //     return;
    // }
    const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app";
    const functionPath = `${netlifySiteUrl}/.netlify/functions/saveQuizResult`;
    try {
        const response = await fetch(functionPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(resultData),
        });
        const responseText = await response.text();
        if (response.ok) {
            try {
                const responseData = JSON.parse(responseText);
                console.log('서버에 결과 저장 성공:', responseData);
            } catch (e) { console.error('서버 성공 응답 JSON 파싱 실패:', responseText, e); }
        } else {
            let errorDetail = response.statusText;
            try {
                const errorJson = JSON.parse(responseText);
                errorDetail = errorJson.error || errorJson.message || response.statusText;
            } catch (e) { console.error('서버 오류 응답 JSON 파싱 실패:', responseText, e); }
            console.error('서버에 결과 저장 실패:', response.status, errorDetail);
            if (document.getElementById('quiz-result')) {
                 document.getElementById('quiz-result').innerHTML += `<p style='color:orange;'>서버에 결과를 저장하는 중 문제가 발생했습니다 (${response.status}): ${errorDetail}</p>`;
            }
        }
    } catch (error) {
        console.error('서버 통신 중 네트워크 오류:', error);
        if (document.getElementById('quiz-result')) {
            document.getElementById('quiz-result').innerHTML += `<p style='color:orange;'>서버와 통신 중 네트워크 오류가 발생했습니다: ${error.message}</p>`;
        }
    }
}
