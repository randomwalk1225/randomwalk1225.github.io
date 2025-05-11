document.addEventListener('DOMContentLoaded', function() {
    console.log("히스토리 스크립트 로드됨");

    const userIdInput = document.getElementById('userIdHistory');
    const loadHistoryButton = document.getElementById('loadHistory');
    const sortToggleButton = document.getElementById('sort-toggle-button');
    const historyListEl = document.getElementById('quiz-history-list');
    // const historyDetailEl = document.getElementById('quiz-history-detail'); // 전역 상세 영역은 더 이상 직접 사용 안 함

    let allUserHistoryData = [];
    let currentSortMode = 'byQuizTitle';
    let currentlyOpenDetail = { listItem: null, detailDiv: null };

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
        if (currentlyOpenDetail.detailDiv) currentlyOpenDetail.detailDiv.innerHTML = ''; // 이전 상세 내용 초기화
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
        if (currentlyOpenDetail.detailDiv) currentlyOpenDetail.detailDiv.innerHTML = ''; // 이전 상세 내용 초기화
        currentlyOpenDetail = { listItem: null, detailDiv: null }; // 열린 상세 초기화

        if (!historyData || historyData.length === 0) {
            historyListEl.innerHTML = '<p>표시할 기록이 없습니다.</p>';
            if(sortToggleButton) sortToggleButton.style.display = 'none';
            return;
        }
        if(sortToggleButton) sortToggleButton.style.display = 'inline-block';

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
                const attemptListUl = document.createElement('ul');
                attemptListUl.classList.add('history-attempt-list');
                groupedByQuiz[quizTitle].attempts.forEach(record => { // 이미 날짜 역순 정렬됨
                    attemptListUl.appendChild(createAttemptListItem(record));
                });
                groupContainer.appendChild(attemptListUl);
                historyListEl.appendChild(groupContainer);
            }
        } else { // sortBy === 'byDate'
            const attemptListUl = document.createElement('ul');
            attemptListUl.classList.add('history-attempt-list', 'date-sorted');
            historyData.forEach(record => {
                attemptListUl.appendChild(createAttemptListItem(record, true)); // showQuizTitle = true
            });
            historyListEl.appendChild(attemptListUl);
        }
    }

    function createAttemptListItem(record, showQuizTitle = false) {
        const attemptItemLi = document.createElement('li');
        attemptItemLi.classList.add('history-attempt-item');
        
        const summaryDiv = document.createElement('div');
        summaryDiv.classList.add('attempt-summary');

        let summaryHTML = '';
        if (showQuizTitle) {
            const quizTitle = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
            summaryHTML += `<span class="attempt-quiz-title">${quizTitle}</span> - `;
        }
        const attemptDate = new Date(record.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const attemptScore = record.score.toFixed(1);
        summaryHTML += `
            <span class="attempt-date">${attemptDate}</span>
            <span class="attempt-score">점수: ${attemptScore}점</span>
        `;
        summaryDiv.innerHTML = summaryHTML;

        const detailContentDiv = document.createElement('div');
        detailContentDiv.classList.add('attempt-details-content');
        // detailContentDiv.style.display = 'none'; // CSS에서 기본 숨김 처리

        summaryDiv.addEventListener('click', () => toggleDetailView(record, detailContentDiv, attemptItemLi));
        
        attemptItemLi.appendChild(summaryDiv);
        attemptItemLi.appendChild(detailContentDiv);
        return attemptItemLi;
    }

    function toggleDetailView(record, detailDiv, listItem) {
        const isActive = listItem.classList.contains('active');

        // Close any currently open detail
        if (currentlyOpenDetail.listItem && currentlyOpenDetail.listItem !== listItem) {
            // currentlyOpenDetail.detailDiv.style.display = 'none'; // CSS로 처리
            currentlyOpenDetail.detailDiv.innerHTML = ''; // 내용만 비움
            currentlyOpenDetail.listItem.classList.remove('active');
        }

        if (isActive && isCurrentlyOpenItem) { // 현재 열려있는 바로 그 항목을 다시 클릭한 경우 (닫기)
            // detailDiv.style.display = 'none'; // CSS로 처리
            detailDiv.innerHTML = ''; // 내용만 비움
            listItem.classList.remove('active');
            currentlyOpenDetail = { listItem: null, detailDiv: null };
        } else { // 새 항목을 클릭했거나, 닫혀있던 항목을 클릭한 경우 (열기)
            displayHistoryDetailContent(record, detailDiv); // 상세 내용 채우기
            // detailDiv.style.display = 'block'; // CSS로 처리
            listItem.classList.add('active');
            currentlyOpenDetail = { listItem: listItem, detailDiv: detailDiv };
        }
    }

    function displayHistoryDetailContent(record, targetDiv) { // Renamed from displayHistoryDetail
        targetDiv.innerHTML = ''; // Clear previous content

        const quizTitleForDisplay = record.quiz_title || record.quiz_id || "해당 퀴즈";
        // 상세 기록 제목 및 기본 정보는 목록 아이템 클릭 시 이미 알 수 있으므로, 여기서는 답변 카드만 집중
        // targetDiv.innerHTML = ` 
        //     <h4>"${quizTitleForDisplay}" 상세 답변</h4> 
        // `; // 필요하다면 이 부분 주석 해제
        
        const incorrectIds = record.incorrect_question_ids || [];

        if (record.answers_details && Array.isArray(record.answers_details) && record.answers_details.length > 0) {
            record.answers_details.forEach((ans, index) => {
                const card = document.createElement('div');
                card.classList.add('result-card', 'history-detail-card'); // 추가 클래스로 상세 스타일링 가능
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
