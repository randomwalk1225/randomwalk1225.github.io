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

    let currentQuizData = null; // This will store the raw bilingual data
    let processedQuizData = []; // This will store the questions in the currently selected language for rendering
    let userAnswers = {};
    let quizStartTime = null;
    let elapsedTimeInterval = null;
    let currentTimeInterval = null;
    let timerVisible = localStorage.getItem('quizTimerVisible') === 'false' ? false : true; // 기본값 true
    let currentLangMode = localStorage.getItem('quizLangMode') || 'ko'; // 'ko', 'en', 'both'

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

            // Store raw bilingual data
            currentQuizData = tempCurrentQuizData; 
            
            // Set initial language mode from localStorage
            const langRadios = document.querySelectorAll('input[name="lang-mode"]');
            const languageSelectorEl = document.getElementById('language-selector');

            // Check if any question has English content
            const hasEnglishContent = tempCurrentQuizData.some(q => q && (q.question_en || q.options_en));

            if (hasEnglishContent && languageSelectorEl) {
                languageSelectorEl.style.display = 'flex'; // Or 'block' or remove inline style to use CSS
                langRadios.forEach(radio => {
                    if (radio.value === currentLangMode) {
                        radio.checked = true;
                    }
                    radio.addEventListener('change', handleLanguageChange);
                });
            } else if (languageSelectorEl) {
                languageSelectorEl.style.display = 'none';
                currentLangMode = 'ko'; // Default to Korean if no English content or selector
                localStorage.setItem('quizLangMode', currentLangMode); // Persist this default
            }


            processAndRenderQuiz(); // Process for current language and render
            startTimers(); // 퀴즈 데이터 로드 후 타이머 시작
            updateTimerVisibility(); 
        } catch (error) {
            console.error(error);
            if (quizContentEl) quizContentEl.innerHTML = `<p>${error.message}</p>`;
            if (submitButton) submitButton.style.display = 'none';
            if (timerWidgetEl) timerWidgetEl.style.display = 'none'; // 오류 시 타이머 숨김
        }
    }
    
    function processQuizDataForLanguage(rawData, lang) {
        if (!Array.isArray(rawData)) return [];
        return rawData.map(q => {
            const processedQ = { ...q }; // Clone original question data

            if (lang === 'en') {
                processedQ.question = q.question_en || q.question; // Fallback to Korean if English not present
                if (q.options_en) {
                    processedQ.options = q.options_en;
                }
                // Answer logic might need adjustment if answers are language-dependent
                // For now, 'answer' field is assumed to be based on Korean options.
            } else if (lang === 'both') {
                const questionEnText = q.question_en || q.question; // Fallback to Korean if English Q not present
                // Question will be handled in renderQuiz for prefixing
                processedQ.question = q.question; // Store Korean
                processedQ.question_en = questionEnText; // Store English

                if (q.options && q.options_en && q.options.length === q.options_en.length) {
                    processedQ.options = q.options.map((opt_ko, i) => {
                        return `${opt_ko}<br><span class="lang-en">${q.options_en[i]}</span>`;
                    });
                } else if (q.options) { // Only Korean options
                    processedQ.options = q.options;
                } else if (q.options_en) { // Only English options (fallback)
                    processedQ.options = q.options_en.map(opt_en => `<span class="lang-en">${opt_en}</span>`);
                }
            }
            // For 'ko', no change needed as original data is Korean primary (q.question and q.options are used)
            return processedQ;
        });
    }

    function processAndRenderQuiz() {
        processedQuizData = processQuizDataForLanguage(currentQuizData, currentLangMode);
        renderQuiz();
    }
    
    function handleLanguageChange(event) {
        currentLangMode = event.target.value;
        localStorage.setItem('quizLangMode', currentLangMode);
        processAndRenderQuiz();
    }

    function renderQuiz() {
        // Now uses processedQuizData instead of currentQuizData directly
        if (!processedQuizData || processedQuizData.length === 0 || !quizContentEl) {
            if (quizContentEl) quizContentEl.innerHTML = '<p>퀴즈 문제를 불러올 수 없습니다.</p>';
            if (submitButton) submitButton.style.display = 'none';
            if (timerWidgetEl) timerWidgetEl.style.display = 'none';
            return;
        }
        quizContentEl.innerHTML = ''; 

        processedQuizData.forEach((q, index) => { // Use processedQuizData
            if (!q || typeof q.id === 'undefined') {
                console.warn('잘못된 형식의 문제 데이터가 포함되어 있습니다:', q);
                return; 
            }
            const questionItem = document.createElement('div');
            questionItem.classList.add('question-item');
            
            let questionHtml = '';
            if (currentLangMode === 'both') {
                const koQuestionText = q.question || '';
                const enQuestionText = q.question_en || q.question; // Fallback for en text
                questionHtml = `<h4><span class="question-number-prefix">문제 ${index + 1}.</span> ${koQuestionText}</h4>` +
                               `<h4 class="lang-en-question"><span class="question-number-prefix">Problem ${index + 1}.</span> ${enQuestionText}</h4>`;
            } else {
                let questionPrefixText = "문제";
                if (currentLangMode === 'en') {
                    questionPrefixText = "Problem";
                }
                // q.question is already set to the correct language string by processQuizDataForLanguage
                const currentQuestionText = q.question || '';
                questionHtml = `<h4><span class="question-number-prefix">${questionPrefixText} ${index + 1}.</span> ${currentQuestionText}</h4>`;
            }
            questionItem.innerHTML = questionHtml;

            // Render image if present
            if (q.image && typeof q.image === 'string' && q.image.trim() !== "") {
                const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
                const imgEl = document.createElement('img');
                if (q.image.startsWith('http://') || q.image.startsWith('https://')) {
                    imgEl.src = q.image;
                } else if (q.image.startsWith('/')) {
                    // 만약 siteBaseUrl이 있고 q.image가 siteBaseUrl으로 시작한다면 제거
                    if (siteBaseUrl && q.image.indexOf(siteBaseUrl) === 0) {
                        imgEl.src = q.image.substring(siteBaseUrl.length);
                    } else {
                        imgEl.src = q.image;
                    }
                } else {
                    imgEl.src = `${siteBaseUrl}/quizzes/${quizId}/${q.image}`;
                }
                imgEl.alt = `Question ${index + 1} image`;
                imgEl.style.maxWidth = '100%';
                imgEl.style.height = 'auto';
                imgEl.style.marginTop = '10px';
                imgEl.style.display = 'block';
                questionItem.appendChild(imgEl);
            }

            // Placeholder for video rendering if needed in the future
            if (q.video) { 
                // Similar logic for video if q.video contains a URL
                // const videoEl = document.createElement('video');
                // videoEl.src = q.video;
                // videoEl.controls = true;
                // videoEl.style.maxWidth = '100%';
                // videoEl.style.marginTop = '10px';
                // questionItem.appendChild(videoEl);
                console.warn(`Video rendering for question ${q.id} not yet fully implemented.`);
            }

            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('options');

            if (q.type === 'multiple-choice' && q.options) { // Ensure q.options exists
                q.options.forEach((opt, optIndex) => {
                    // opt가 객체인지 문자열인지 구분
                    const isObject = opt && typeof opt === 'object';
                    const displayText = isObject ? opt.text : opt;
                    const optionId = `q${q.id}-option${optIndex}`;
                    const optionNumber = optIndex + 1; // 번호 계산
                    const numberedDisplayText = `${optionNumber}) ${displayText}`;

                    // label 생성 및 속성 설정
                    const label = document.createElement('label');
                    label.htmlFor = optionId;
                    label.classList.add('quiz-option-label');

                    // radio 버튼 생성 및 속성 설정
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.id = optionId;
                    radio.name = `question-${q.id}`;
                    radio.value = displayText;
                    radio.classList.add('quiz-option-radio');
                    label.appendChild(radio);

                    // radio 버튼 change 이벤트 리스너 추가
                    radio.addEventListener('change', (e) => {
                      // 해당 문제의 모든 radio 선택 상태 해제
                      document.querySelectorAll(`input[name="question-${q.id}"]`)
                              .forEach(rb => {
                                  if (rb.parentElement) {
                                    rb.parentElement.classList.remove('selected');
                                  }
                              });

                      if (e.target.checked) {
                          e.target.parentElement.classList.add('selected');
                          userAnswers[q.id] = e.target.value;
                      } else {
                          delete userAnswers[q.id];
                      }
                    });


                    // 텍스트 추가 (번호가 추가된 텍스트)
                    const span = document.createElement('span');
                    span.textContent = numberedDisplayText;
                    label.appendChild(span);
                    
                    

                    // 이미지가 있을 경우, 이미지 태그 생성 및 추가
                    if (isObject && opt.image) {
                        const img = document.createElement('img');
                        img.src = opt.image;
                        img.alt = displayText;
                        img.style.maxWidth = '100%';
                        img.style.marginBottom = '0.5rem';
                        label.appendChild(img);
                    }

                   

                    // 옵션 컨테이너에 label 추가
                    optionsDiv.appendChild(label);

                    // (필요시 기존 change 및 click 이벤트 바인딩 유지)
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

            // Add click listener to the entire question item for unchecking (only for multiple-choice)
            if (q.type === 'multiple-choice') {
                questionItem.addEventListener('click', (e) => {
                    // Prevent if the click was on an input/label itself, as that has its own logic
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.parentElement.tagName === 'LABEL') {
                        return;
                    }

                    const currentlySelectedRadio = questionItem.querySelector(`input[name="question-${q.id}"]:checked`);
                    if (currentlySelectedRadio) {
                        currentlySelectedRadio.checked = false;
                        delete userAnswers[q.id];
                        if (currentlySelectedRadio.parentElement.tagName === 'LABEL') {
                            currentlySelectedRadio.parentElement.classList.remove('selected');
                        }
                         // If you need to trigger the 'change' event manually for other listeners:
                        // currentlySelectedRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
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
                    // q.answer might be undefined for math inputs that are open-ended
                    const normalizedCorrectAnswer = normalizeMathAnswer(typeof q.answer === 'string' ? q.answer : "");
                    // A question can only be correct if an answer is defined for it.
                    isCorrect = (typeof q.answer !== 'undefined') && (normalizedUserAnswer === normalizedCorrectAnswer);
                } else {
                    // For multiple-choice and non-math short-answer
                    if (typeof q.answer === 'string') { // Check if q.answer is a string
                        isCorrect = userAnswerRaw.trim().toLowerCase() === q.answer.trim().toLowerCase();
                    } else if (typeof q.answer !== 'undefined' && q.answer !== null) { // Handle if q.answer is number or other primitive
                        isCorrect = userAnswerRaw.trim().toLowerCase() === String(q.answer).toLowerCase();
                    } else {
                        // If q.answer is undefined or null (e.g., for open-ended short answers not meant for auto-grading)
                        isCorrect = false; 
                    }
                }

                if (isCorrect) {
                    score++;
                } else {
                    incorrectQuestionIds.push(q.id); // 틀렸으면 ID 추가
                }
                return {
                    questionId: q.id, question: q.question, userAnswer: userAnswerRaw, 
                    correctAnswer: q.answer, isCorrect: isCorrect, type: q.type, 
                    isMathInput: q.isMathInput || false,
                    explanation: q.explanation // Ensure explanation is carried over
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
                        ${ quizStartTime ? `<p>풀이 시간: <span class="elapsed-time-detail">${Math.floor((new Date() - quizStartTime) / 60000)}분 ${String(Math.floor(((new Date() - quizStartTime) / 1000) % 60)).padStart(2, '0')}초</span></p>` : '' }
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


// innerHTML 대신 textContent/innerText 에 바로 \n 섞인 문자열을 넣어도
// 브라우저가 줄바꿈을 알아서 처리해 줍니다.
questionItem.querySelector('h4').textContent = q.question;


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
        if (!timerWidgetEl || !toggleTimerVisibilityButton || !currentTimeDisplayEl || !elapsedTimeDisplayEl) return;

        if (timerVisible) { // Show time text
            currentTimeDisplayEl.classList.remove('timer-text-hidden');
            elapsedTimeDisplayEl.classList.remove('timer-text-hidden');
            toggleTimerVisibilityButton.textContent = '시계 숨기기';
            updateCurrentTime(); 
            updateElapsedTime(); 
        } else { // Hide time text (make it blend with background or invisible)
            currentTimeDisplayEl.classList.add('timer-text-hidden');
            elapsedTimeDisplayEl.classList.add('timer-text-hidden');
            toggleTimerVisibilityButton.textContent = '시계 보기';
        }
        // The widget itself (timerWidgetEl) always remains visible.
        timerWidgetEl.style.display = 'flex'; // Ensure it's always flex (or block)
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
        let elapsedTimeInSeconds = 0;
        if (quizStartTime) {
            elapsedTimeInSeconds = Math.floor((now - quizStartTime) / 1000);
        }

        const resultData = {
            user_id: userId,
            quiz_id: quizId,
            quiz_title: quizTitleEl ? quizTitleEl.textContent : quizId,
            score: score,
            answers_details: detailedAnswers,
            incorrect_question_ids: incorrectIds,
            total_questions: currentQuizData.filter(q => q && typeof q.id !== 'undefined').length,
            correct_answers_count: detailedAnswers.filter(r => r.isCorrect).length,
            elapsed_time_seconds: elapsedTimeInSeconds // Add elapsed time
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


