document.addEventListener('DOMContentLoaded', function() {
    console.log("히스토리 스크립트 로드됨");

    const userIdInput = document.getElementById('userIdHistory');
    const loadHistoryButton = document.getElementById('loadHistory');
    const sortToggleButton = document.getElementById('sort-toggle-button');
    const historyListEl = document.getElementById('quiz-history-list');
    const historyDetailEl = document.getElementById('quiz-history-detail');

    let allUserHistoryData = []; // 전체 사용자 기록 저장
    let currentSortMode = 'byQuizTitle'; // 'byQuizTitle' 또는 'byDate'

    if (loadHistoryButton) {
        loadHistoryButton.addEventListener('click', function() {
            const userId = userIdInput ? userIdInput.value.trim() : null;
            if (!userId) {
                alert("사용자 ID를 입력해주세요.");
                if (userIdInput) userIdInput.focus();
                historyListEl.innerHTML = '';
                historyDetailEl.innerHTML = '';
                return;
            }
            loadUserHistory(userId);
        });
    }

    if (sortToggleButton) {
        sortToggleButton.addEventListener('click', function() {
            if (currentSortMode === 'byQuizTitle') {
                currentSortMode = 'byDate';
                sortToggleButton.textContent = '퀴즈 제목별로 정렬';
            } else {
                currentSortMode = 'byQuizTitle';
                sortToggleButton.textContent = '날짜순으로 정렬';
            }
            renderHistoryList(allUserHistoryData, currentSortMode);
        });
    }

    async function loadUserHistory(userId) {
        if (!historyListEl || !historyDetailEl) {
            console.error("히스토리 표시를 위한 DOM 요소를 찾을 수 없습니다.");
            return;
        }
        historyListEl.innerHTML = '<li>기록을 불러오는 중...</li>';
        historyDetailEl.innerHTML = '';
        sortToggleButton.style.display = 'none'; // 로딩 중에는 정렬 버튼 숨김

        const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app";
        const functionPath = `${netlifySiteUrl}/.netlify/functions/getUserHistory?userId=${encodeURIComponent(userId)}`;

        try {
            const response = await fetch(functionPath);
            const responseText = await response.text();

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorJson = JSON.parse(responseText);
                    errorDetail = errorJson.error || errorJson.message || response.statusText;
                } catch (e) {
                    console.error("Failed to parse error response as JSON:", responseText);
                }
                throw new Error(`서버에서 기록을 불러오는 데 실패했습니다 (${response.status}): ${errorDetail}`);
            }
            
            allUserHistoryData = JSON.parse(responseText);

            if (!Array.isArray(allUserHistoryData) || allUserHistoryData.length === 0) {
                historyListEl.innerHTML = '<p>아직 응시한 퀴즈 기록이 없습니다. <a href="../">퀴즈 목록</a>에서 퀴즈를 선택해 진행해 봅시다.</p>';
                sortToggleButton.style.display = 'none';
                return;
            }
            
            // 기본 정렬은 서버에서 이미 timestamp 내림차순으로 제공
            currentSortMode = 'byQuizTitle'; // 초기 정렬 모드
            sortToggleButton.textContent = '날짜순으로 정렬';
            sortToggleButton.style.display = 'inline-block'; // 기록 있으면 버튼 표시
            renderHistoryList(allUserHistoryData, currentSortMode);

        } catch (error) {
            console.error("서버에서 히스토리 로드 중 오류 발생:", error);
            historyListEl.innerHTML = `<p style="color:red;">기록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
            sortToggleButton.style.display = 'none';
        }
    }

    function renderHistoryList(historyData, sortBy) {
        historyListEl.innerHTML = '';
        historyDetailEl.innerHTML = ''; // 상세 보기 초기화

        if (!historyData || historyData.length === 0) {
            historyListEl.innerHTML = '<p>표시할 기록이 없습니다.</p>';
            sortToggleButton.style.display = 'none';
            return;
        }
        sortToggleButton.style.display = 'inline-block';


        if (sortBy === 'byQuizTitle') {
            const groupedByQuiz = historyData.reduce((acc, record) => {
                const title = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
                if (!acc[title]) {
                    acc[title] = { quiz_id: record.quiz_id, attempts: [] };
                }
                acc[title].attempts.push(record);
                return acc;
            }, {});

            // 퀴즈 제목별로 정렬 (가나다 순)
            const sortedQuizTitles = Object.keys(groupedByQuiz).sort();

            for (const quizTitle of sortedQuizTitles) {
                const groupContainer = document.createElement('div');
                groupContainer.classList.add('history-quiz-group');
                
                const groupTitleEl = document.createElement('h3');
                groupTitleEl.classList.add('history-group-title');
                groupTitleEl.textContent = quizTitle;
                groupContainer.appendChild(groupTitleEl);

                const attemptListUl = document.createElement('ul');
                attemptListUl.classList.add('history-attempt-list');

                // 각 퀴즈 그룹 내 시도들을 시간 역순으로 정렬
                groupedByQuiz[quizTitle].attempts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

                groupedByQuiz[quizTitle].attempts.forEach(record => {
                    const attemptItemLi = document.createElement('li');
                    attemptItemLi.classList.add('history-attempt-item');
                    const attemptDate = new Date(record.timestamp).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                    const attemptScore = record.score.toFixed(1);
                    attemptItemLi.innerHTML = `
                        <span class="attempt-date">${attemptDate}</span>
                        <span class="attempt-score">점수: ${attemptScore}점</span>
                    `;
                    attemptItemLi.addEventListener('click', () => displayHistoryDetail(record));
                    attemptListUl.appendChild(attemptItemLi);
                });
                groupContainer.appendChild(attemptListUl);
                historyListEl.appendChild(groupContainer);
            }
        } else { // sortBy === 'byDate'
            // 이미 서버에서 시간 역순으로 정렬된 데이터를 사용
            const attemptListUl = document.createElement('ul');
            attemptListUl.classList.add('history-attempt-list', 'date-sorted');

            historyData.forEach(record => {
                const attemptItemLi = document.createElement('li');
                attemptItemLi.classList.add('history-attempt-item');
                const quizTitle = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
                const attemptDate = new Date(record.timestamp).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                const attemptScore = record.score.toFixed(1);
                attemptItemLi.innerHTML = `
                    <span class="attempt-quiz-title">${quizTitle}</span> - 
                    <span class="attempt-date">${attemptDate}</span> - 
                    <span class="attempt-score">점수: ${attemptScore}점</span>
                `;
                attemptItemLi.addEventListener('click', () => displayHistoryDetail(record));
                attemptListUl.appendChild(attemptItemLi);
            });
            historyListEl.appendChild(attemptListUl);
        }
    }

    function displayHistoryDetail(record) {
        if (!historyDetailEl) return;
        const quizTitleForDisplay = record.quiz_title || record.quiz_id || "해당 퀴즈";
        historyDetailEl.innerHTML = `
            <h3>"${quizTitleForDisplay}" 상세 기록</h3>
            <p><strong>응시 일시:</strong> ${new Date(record.timestamp).toLocaleString('ko-KR')}</p>
            <p><strong>점수:</strong> ${record.score.toFixed(1)}점</p>
            <h4>답변 상세:</h4>`;
        
        const incorrectIds = record.incorrect_question_ids || [];

        if (record.answers_details && Array.isArray(record.answers_details) && record.answers_details.length > 0) {
            record.answers_details.forEach((ans, index) => {
                const card = document.createElement('div');
                card.classList.add('result-card');
                card.classList.add(ans.isCorrect ? 'correct' : 'incorrect');
                if (!ans.isCorrect && incorrectIds.includes(ans.questionId)) {
                    card.classList.add('highlight-incorrect');
                }
                let displayUserAnswer = ans.userAnswer || "(답변 없음)";
                let displayCorrectAnswer = ans.correctAnswer;
                if (ans.type === 'short-answer' && ans.isMathInput) {
                    if (displayUserAnswer !== "(답변 없음)" && !displayUserAnswer.includes('$')) {
                        displayUserAnswer = `$${displayUserAnswer}$`;
                    }
                    if (displayCorrectAnswer && !displayCorrectAnswer.includes('$')) { 
                       displayCorrectAnswer = `$${displayCorrectAnswer}$`;
                    }
                }
                card.innerHTML = `
                    <div class="result-card-question"><strong>문제 ${index + 1}:</strong> ${ans.question}</div>
                    <div class="result-card-user-answer"><strong>제출 답:</strong> ${displayUserAnswer}</div>
                    <div class="result-card-correct-answer"><strong>정답:</strong> ${displayCorrectAnswer}</div>
                    <div class="result-card-status">${ans.isCorrect ? '정답 👍' : '오답 👎'}</div>`;
                historyDetailEl.appendChild(card); 
            });
        } else {
            const p = document.createElement('p');
            p.textContent = '상세 답변 기록이 없습니다.';
            historyDetailEl.appendChild(p);
        }

        if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
            setTimeout(() => {
                MathJax.typesetPromise(historyDetailEl.querySelectorAll('.result-card .result-card-question, .result-card .result-card-user-answer, .result-card .result-card-correct-answer')).catch((err) => console.error('MathJax typesetPromise failed for history details:', err));
            }, 0);
        }
    }
});
