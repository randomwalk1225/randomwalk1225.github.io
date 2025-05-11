document.addEventListener('DOMContentLoaded', function() {
    console.log("히스토리 스크립트 로드됨");

    const userIdInput = document.getElementById('userIdHistory');
    const loadHistoryButton = document.getElementById('loadHistory');
    const sortToggleButton = document.getElementById('sort-toggle-button');
    const historyListEl = document.getElementById('quiz-history-list');
    const sortStatusEl = document.getElementById('history-sort-status'); // 정렬 상태 표시 요소

    let allUserHistoryData = [];
    let currentSortMode = 'byQuizTitle';
    let currentlyOpenDetail = { triggerElement: null, detailDiv: null }; // 클릭된 요소를 추적

    if (loadHistoryButton) {
        loadHistoryButton.addEventListener('click', function() {
            const userId = userIdInput ? userIdInput.value.trim() : null;
            if (!userId) {
                alert("사용자 ID를 입력해주세요.");
                if (userIdInput) userIdInput.focus();
                historyListEl.innerHTML = '';
                if (currentlyOpenDetail.detailDiv) currentlyOpenDetail.detailDiv.innerHTML = '';
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
        historyListEl.innerHTML = '<li>기록을 불러오는 중...</li>';
        if (currentlyOpenDetail.detailDiv) currentlyOpenDetail.detailDiv.innerHTML = '';
        if(sortToggleButton) sortToggleButton.style.display = 'none';

        const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app";
        const functionPath = `${netlifySiteUrl}/.netlify/functions/getUserHistory?userId=${encodeURIComponent(userId)}`;

        try {
            const response = await fetch(functionPath);
            const responseText = await response.text();
            if (!response.ok) {
                let errorDetail = response.statusText;
                try { const errorJson = JSON.parse(responseText); errorDetail = errorJson.error || errorJson.message || response.statusText; }
                catch (e) { console.error("Failed to parse error response as JSON:", responseText); }
                throw new Error(`서버에서 기록을 불러오는 데 실패했습니다 (${response.status}): ${errorDetail}`);
            }
            allUserHistoryData = JSON.parse(responseText);
            if (!Array.isArray(allUserHistoryData) || allUserHistoryData.length === 0) {
                historyListEl.innerHTML = '<p>아직 응시한 퀴즈 기록이 없습니다. <a href="../">퀴즈 목록</a>에서 퀴즈를 선택해 진행해 봅시다.</p>';
                if(sortToggleButton) sortToggleButton.style.display = 'none';
                return;
            }
            currentSortMode = 'byQuizTitle'; 
            if(sortToggleButton) {
                sortToggleButton.textContent = '날짜순으로 정렬';
                sortToggleButton.style.display = 'inline-block'; 
            }
            renderHistoryList(allUserHistoryData, currentSortMode);
        } catch (error) {
            console.error("서버에서 히스토리 로드 중 오류 발생:", error);
            historyListEl.innerHTML = `<p style="color:red;">기록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
            if(sortToggleButton) sortToggleButton.style.display = 'none';
        }
    }

    function renderHistoryList(historyData, sortBy) {
        historyListEl.innerHTML = '';
        if (currentlyOpenDetail.detailDiv) currentlyOpenDetail.detailDiv.innerHTML = '';
        currentlyOpenDetail = { triggerElement: null, detailDiv: null };

        if (!historyData || historyData.length === 0) {
            historyListEl.innerHTML = '<p>표시할 기록이 없습니다.</p>';
            if(sortToggleButton) sortToggleButton.style.display = 'none';
            return;
        }
        if(sortToggleButton) sortToggleButton.style.display = 'inline-block';

        // 현재 정렬 상태 표시 업데이트
        if (sortStatusEl) {
            if (sortBy === 'byQuizTitle') {
                sortStatusEl.textContent = '퀴즈 제목별로 정렬된 기록입니다.';
            } else { // sortBy === 'byDate'
                sortStatusEl.textContent = '최근 응시 순으로 정렬된 기록입니다.';
            }
        }

        historyData.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

        if (sortBy === 'byQuizTitle') {
            const groupedByQuiz = historyData.reduce((acc, record) => {
                const title = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
                if (!acc[title]) {
                    acc[title] = { quiz_id: record.quiz_id, attempts: [] };
                }
                acc[title].attempts.push(record);
                return acc;
            }, {});
            const sortedQuizTitles = Object.keys(groupedByQuiz).sort();

            for (const quizTitle of sortedQuizTitles) {
                const groupContainer = document.createElement('div');
                groupContainer.classList.add('history-quiz-group');
                const groupTitleEl = document.createElement('h3');
                groupTitleEl.classList.add('history-group-title');
                groupTitleEl.textContent = quizTitle;
                groupContainer.appendChild(groupTitleEl);

                const attemptsContainer = document.createElement('div');
                attemptsContainer.classList.add('inline-attempts-container');
                
                groupedByQuiz[quizTitle].attempts.forEach(record => {
                    const attemptSpan = document.createElement('span');
                    attemptSpan.classList.add('inline-attempt-summary');
                    const attemptDate = new Date(record.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                    const attemptScore = record.score.toFixed(1);
                    attemptSpan.innerHTML = `<span class="attempt-date">${attemptDate}</span> (<span class="attempt-score-value">${attemptScore}</span>점)`;
                    
                    const detailContentDiv = document.createElement('div');
                    detailContentDiv.classList.add('attempt-details-content');
                    
                    attemptSpan.addEventListener('click', () => toggleDetailView(record, detailContentDiv, attemptSpan));
                    
                    attemptsContainer.appendChild(attemptSpan);
                    attemptsContainer.appendChild(detailContentDiv); // 상세 내용은 각 span 다음에 위치
                });
                groupContainer.appendChild(attemptsContainer);
                historyListEl.appendChild(groupContainer);
            }
        } else { // sortBy === 'byDate'
            const attemptListUl = document.createElement('ul'); // 날짜순은 기존 ul > li 구조 유지
            attemptListUl.classList.add('history-attempt-list', 'date-sorted');
            historyData.forEach(record => {
                attemptListUl.appendChild(createFullAttemptListItem(record));
            });
            historyListEl.appendChild(attemptListUl);
        }
    }

    // 날짜순 정렬 시 사용 (기존 createAttemptListItem과 유사)
    function createFullAttemptListItem(record) {
        const attemptItemLi = document.createElement('li');
        attemptItemLi.classList.add('history-attempt-item');
        
        const summaryDiv = document.createElement('div');
        summaryDiv.classList.add('attempt-summary');
        const quizTitle = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
        const attemptDate = new Date(record.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const attemptScore = record.score.toFixed(1);
        summaryDiv.innerHTML = `
            <span class="attempt-quiz-title">${quizTitle}</span>
            <span class="attempt-meta">
                <span class="attempt-date">${attemptDate}</span>
                (<span class="attempt-score-value">${attemptScore}</span>점)
            </span>
        `;
        
        const detailContentDiv = document.createElement('div');
        detailContentDiv.classList.add('attempt-details-content');

        summaryDiv.addEventListener('click', () => toggleDetailView(record, detailContentDiv, summaryDiv)); // 클릭 대상을 summaryDiv로 변경
        
        attemptItemLi.appendChild(summaryDiv);
        attemptItemLi.appendChild(detailContentDiv);
        return attemptItemLi;
    }

    function toggleDetailView(record, detailDiv, triggerElement) {
        const isActive = triggerElement.classList.contains('active');

        if (currentlyOpenDetail.triggerElement && currentlyOpenDetail.triggerElement !== triggerElement) {
            currentlyOpenDetail.detailDiv.innerHTML = '';
            currentlyOpenDetail.triggerElement.classList.remove('active');
            currentlyOpenDetail.detailDiv.classList.remove('visible');
        }

        if (isActive) {
            detailDiv.innerHTML = '';
            triggerElement.classList.remove('active');
            detailDiv.classList.remove('visible');
            currentlyOpenDetail = { triggerElement: null, detailDiv: null };
        } else {
            displayHistoryDetailContent(record, detailDiv);
            triggerElement.classList.add('active');
            detailDiv.classList.add('visible');
            currentlyOpenDetail = { triggerElement: triggerElement, detailDiv: detailDiv };
        }
    }

    function displayHistoryDetailContent(record, targetDiv) {
        targetDiv.innerHTML = ''; 
        const incorrectIds = record.incorrect_question_ids || [];
        if (record.answers_details && Array.isArray(record.answers_details) && record.answers_details.length > 0) {
            record.answers_details.forEach((ans, index) => {
                const card = document.createElement('div');
                card.classList.add('result-card', 'history-detail-card');
                card.classList.add(ans.isCorrect ? 'correct' : 'incorrect');
                if (!ans.isCorrect && incorrectIds.includes(ans.questionId)) {
                    card.classList.add('highlight-incorrect');
                }
                let displayUserAnswer = ans.userAnswer || "(답변 없음)";
                let displayCorrectAnswer = ans.correctAnswer;
                if (ans.type === 'short-answer' && ans.isMathInput) {
                    if (displayUserAnswer !== "(답변 없음)" && !displayUserAnswer.includes('$')) displayUserAnswer = `$${displayUserAnswer}$`;
                    if (displayCorrectAnswer && !displayCorrectAnswer.includes('$')) displayCorrectAnswer = `$${displayCorrectAnswer}$`;
                }
                card.innerHTML = `
                    <div class="result-card-question"><strong>문제 ${index + 1}:</strong> ${ans.question}</div>
                    <div class="result-card-user-answer"><strong>제출 답:</strong> ${displayUserAnswer}</div>
                    <div class="result-card-correct-answer"><strong>정답:</strong> ${displayCorrectAnswer}</div>
                    <div class="result-card-status">${ans.isCorrect ? '정답 👍' : '오답 👎'}</div>`;
                targetDiv.appendChild(card); 
            });
        } else {
            const p = document.createElement('p');
            p.textContent = '상세 답변 기록이 없습니다.';
            targetDiv.appendChild(p);
        }
        if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
            setTimeout(() => {
                MathJax.typesetPromise(targetDiv.querySelectorAll('.result-card .result-card-question, .result-card .result-card-user-answer, .result-card .result-card-correct-answer')).catch((err) => console.error('MathJax typesetPromise failed for history details:', err));
            }, 0);
        }
    }
});
