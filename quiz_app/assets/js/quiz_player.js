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
                    else if (id === 'algorithms_data_structures') title = "알고리즘과 자료구조";
                    else title = "퀴즈";
                    quizTitleEl.textContent = title;
                }
                tempCurrentQuizData = rawQuizData;
                console.warn("퀴즈 데이터에 title 정보가 없거나 형식이 올바르지 않습니다.");
            }

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
                currentQuizData = tempCurrentQuizData;
            } else {
                currentQuizData = [];
            }
            
            renderQuiz();
        } catch (error) {
            console.error(error);
            if (quizContentEl) quizContentEl.innerHTML = `<p>${error.message}</p>`;
            if (submitButton) submitButton.style.display = 'none';
        }
    }

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
                        <p><strong>${userId}</strong>님의 점수: 
                            <span class="score-value">${percentageScore.toFixed(1)}</span>점 
                            (<span class="score-detail">${score}/${totalQuestionsCount}</span>)
                        </p>
                    </div>
                    <h4>상세 결과:</h4>`;
                const resultCardsContainer = document.createElement('div');
                resultCardsContainer.classList.add('result-cards-container');
                detailedResults.forEach((r, index) => { /* ... card creation ... */ });
                quizResultEl.appendChild(resultCardsContainer);
                if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
                    setTimeout(() => { MathJax.typesetPromise().catch(err => console.error('MathJax typesetPromise failed for results:', err)); }, 0);
                }
            }
            
            if (submitButton) submitButton.style.display = 'none'; 
            if (userIdInput) userIdInput.disabled = true; 

            saveResultToLocalStorage(userId, quizId, percentageScore, detailedResults, incorrectQuestionIds); // incorrectQuestionIds 전달
        });
    }

    function saveResultToLocalStorage(userId, quizId, score, answers, incorrectIds) { // incorrectIds 파라미터 추가
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const resultData = {
            userId: userId, quizId: quizId, 
            quizTitle: quizTitleEl ? quizTitleEl.textContent : quizId,
            timestamp: timestamp, score: score, answers: answers,
            incorrect_question_ids: incorrectIds // 필드 추가
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
