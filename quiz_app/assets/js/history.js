// 전역 또는 모듈 최상위 스코프 변수
let allUserHistoryData_global = [];
let currentSortMode_global = 'byQuizTitle';
let currentlyOpenDetail_global = { triggerElement: null, detailDiv: null };

async function loadUserHistory(userId) {
    console.log('[History.js] loadUserHistory called with userId:', userId);
    const historyListEl = document.getElementById('quiz-history-list');
    const sortStatusEl = document.getElementById('history-sort-status');
    const sortToggleButton = document.getElementById('sort-toggle-button');

    if (!historyListEl || !sortStatusEl || !sortToggleButton) {
        console.error('[History.js] Required DOM elements for history not found.');
        if (historyListEl) historyListEl.innerHTML = '<p>기록을 표시하는데 필요한 페이지 구성요소를 찾을 수 없습니다.</p>';
        return;
    }

    const userIdInput = document.getElementById('userIdHistory');
    if (!userId && userIdInput) {
        userId = userIdInput.value.trim();
    }

    if (!userId) {
        historyListEl.innerHTML = '<p>사용자 ID를 입력하고 "기록 불러오기" 버튼을 클릭하세요.</p>';
        sortStatusEl.textContent = '';
        sortToggleButton.style.display = 'none';
        return;
    }

    historyListEl.innerHTML = '<li>기록을 불러오는 중...</li>';
    currentlyOpenDetail_global = { triggerElement: null, detailDiv: null }; // 상세 보기 초기화
    sortToggleButton.style.display = 'none';

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
        
        allUserHistoryData_global = JSON.parse(responseText);

        if (!Array.isArray(allUserHistoryData_global) || allUserHistoryData_global.length === 0) {
            historyListEl.innerHTML = '<p>아직 응시한 퀴즈 기록이 없습니다. <a href="../">퀴즈 목록</a>에서 퀴즈를 선택해 진행해 봅시다.</p>';
            sortToggleButton.style.display = 'none';
            sortStatusEl.textContent = '표시할 기록이 없습니다.';
            return;
        }
        
        currentSortMode_global = 'byQuizTitle'; 
        sortToggleButton.textContent = '날짜별로 정렬'; 
        sortToggleButton.style.display = 'inline-block'; 
        
        renderHistoryList(allUserHistoryData_global, currentSortMode_global);
    } catch (error) {
        console.error("서버에서 히스토리 로드 중 오류 발생:", error);
        historyListEl.innerHTML = `<p style="color:red;">기록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        sortToggleButton.style.display = 'none';
        sortStatusEl.textContent = '오류 발생';
    }
}

function renderHistoryList(historyData, sortBy) {
    const historyListEl = document.getElementById('quiz-history-list');
    const sortStatusEl = document.getElementById('history-sort-status');
    const sortToggleButton = document.getElementById('sort-toggle-button');

    if (!historyListEl || !sortStatusEl || !sortToggleButton) {
        console.error("[History.js] renderHistoryList: Required DOM elements not found.");
        return;
    }

    historyListEl.innerHTML = '';
    currentlyOpenDetail_global = { triggerElement: null, detailDiv: null }; // 상세 보기 초기화

    if (!historyData || historyData.length === 0) {
        historyListEl.innerHTML = '<p>표시할 기록이 없습니다.</p>';
        sortToggleButton.style.display = 'none';
        sortStatusEl.textContent = '표시할 기록이 없습니다.'; // 상태 메시지 업데이트
        return;
    }
    sortToggleButton.style.display = 'inline-block';

    if (sortStatusEl) {
        if (sortBy === 'byQuizTitle') {
            sortStatusEl.textContent = '퀴즈 제목별로 정렬된 기록입니다.';
        } else { 
            sortStatusEl.textContent = '날짜 순으로 정렬하였습니다.'; 
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
                attemptsContainer.appendChild(detailContentDiv); 
            });
            groupContainer.appendChild(attemptsContainer);
            historyListEl.appendChild(groupContainer);
        }
    } else { // sortBy === 'byDate'
        const attemptListUl = document.createElement('ul'); 
        attemptListUl.classList.add('history-attempt-list', 'date-sorted');
        historyData.forEach(record => {
            attemptListUl.appendChild(createFullAttemptListItem(record));
        });
        historyListEl.appendChild(attemptListUl);
    }
}

function createFullAttemptListItem(record) {
    const attemptItemLi = document.createElement('li');
    attemptItemLi.classList.add('history-attempt-item');
    
    const summaryDiv = document.createElement('div');
    summaryDiv.classList.add('attempt-summary');
    const quizTitle = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
    const attemptDate = new Date(record.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const attemptScore = record.score.toFixed(1);
    summaryDiv.innerHTML = `
        <span class="attempt-date">${attemptDate}</span>
        <span class="attempt-title-score-group"> 
            - <span class="attempt-quiz-title">${quizTitle}</span>
            (<span class="attempt-score-value">${attemptScore}</span>점)
        </span>
    `;
    
    const detailContentDiv = document.createElement('div');
    detailContentDiv.classList.add('attempt-details-content');

    summaryDiv.addEventListener('click', () => toggleDetailView(record, detailContentDiv, summaryDiv)); 
    
    attemptItemLi.appendChild(summaryDiv);
    attemptItemLi.appendChild(detailContentDiv);
    return attemptItemLi;
}

function toggleDetailView(record, detailDiv, triggerElement) {
    const isActive = triggerElement.classList.contains('active');

    // 전역 변수 currentlyOpenDetail_global 사용 (오타 수정)
    if (currentlyOpenDetail_global.triggerElement && currentlyOpenDetail_global.triggerElement !== triggerElement) {
        currentlyOpenDetail_global.detailDiv.innerHTML = '';
        currentlyOpenDetail_global.triggerElement.classList.remove('active');
        currentlyOpenDetail_global.detailDiv.classList.remove('visible'); // CSS로 제어 시
    }

    if (isActive) {
        detailDiv.innerHTML = '';
        triggerElement.classList.remove('active');
        detailDiv.classList.remove('visible');
        currentlyOpenDetail_global = { triggerElement: null, detailDiv: null };
    } else {
        displayHistoryDetailContent(record, detailDiv);
        triggerElement.classList.add('active');
        detailDiv.classList.add('visible');
        currentlyOpenDetail_global = { triggerElement: triggerElement, detailDiv: detailDiv };
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

document.addEventListener('DOMContentLoaded', function() {
    console.log("히스토리 스크립트 로드됨 (DOMContentLoaded)");
    
    const sortToggleButton_local = document.getElementById('sort-toggle-button');
    const loadHistoryButton = document.getElementById('loadHistory');
    const userIdInput = document.getElementById('userIdHistory');

    if (sortToggleButton_local) {
        sortToggleButton_local.addEventListener('click', function() {
            if (currentSortMode_global === 'byQuizTitle') {
                currentSortMode_global = 'byDate';
                sortToggleButton_local.textContent = '제목순서로 정렬'; 
            } else {
                currentSortMode_global = 'byQuizTitle';
                sortToggleButton_local.textContent = '날짜별로 정렬'; 
            }
            renderHistoryList(allUserHistoryData_global, currentSortMode_global); 
        });
    }

    if (loadHistoryButton && userIdInput) {
        loadHistoryButton.addEventListener('click', function() {
            const userId = userIdInput.value.trim();
            if (userId) {
                loadUserHistory(userId);
            } else {
                const historyListEl = document.getElementById('quiz-history-list');
                if (historyListEl) {
                    historyListEl.innerHTML = '<p>사용자 ID를 입력해주세요.</p>';
                }
            }
        });
        
        // Enter 키로도 기록 불러오기
        userIdInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // 폼 제출 방지 (만약 폼 안에 있다면)
                loadHistoryButton.click();
            }
        });
    } else {
        console.error('[History.js] Load history button or userId input not found.');
    }

    // 초기에는 아무 기록도 로드하지 않고, 사용자 입력을 기다립니다.
    const historyListEl = document.getElementById('quiz-history-list');
    const sortStatusEl = document.getElementById('history-sort-status');
    const sortToggleButton = document.getElementById('sort-toggle-button');

    if(historyListEl) historyListEl.innerHTML = '<p>사용자 ID를 입력하고 "기록 불러오기" 버튼을 클릭하세요.</p>';
    if(sortStatusEl) sortStatusEl.textContent = '';
    if(sortToggleButton) sortToggleButton.style.display = 'none';
});
