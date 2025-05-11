document.addEventListener('DOMContentLoaded', function() {
    console.log("히스토리 스크립트 로드됨");

    const userIdInput = document.getElementById('userIdHistory');
    const loadHistoryButton = document.getElementById('loadHistory');
    const historyListEl = document.getElementById('quiz-history-list');
    const historyDetailEl = document.getElementById('quiz-history-detail');

    if (loadHistoryButton) {
        loadHistoryButton.addEventListener('click', function() {
            const userId = userIdInput ? userIdInput.value.trim() : null;
            if (!userId) {
                alert("사용자 ID를 입력해주세요.");
                if (userIdInput) userIdInput.focus();
                if (historyListEl) historyListEl.innerHTML = '';
                if (historyDetailEl) historyDetailEl.innerHTML = '';
                return;
            }
            loadUserHistory(userId);
        });
    }

    async function loadUserHistory(userId) {
        if (!historyListEl || !historyDetailEl) {
            console.error("히스토리 표시를 위한 DOM 요소를 찾을 수 없습니다.");
            return;
        }
        historyListEl.innerHTML = '<li>기록을 불러오는 중...</li>';
        historyDetailEl.innerHTML = '';

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
            
            const userHistory = JSON.parse(responseText);

            if (!Array.isArray(userHistory) || userHistory.length === 0) {
                historyListEl.innerHTML = '<p>아직 응시한 퀴즈 기록이 없습니다. <a href="../">퀴즈 목록</a>에서 퀴즈를 선택해 진행해 봅시다.</p>';
                return;
            }

            // 시간 역순으로 정렬 (최신 기록이 가장 위로)
            userHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // 퀴즈 제목별로 그룹화
            const groupedByQuiz = userHistory.reduce((acc, record) => {
                const title = record.quiz_title || record.quiz_id || '알 수 없는 퀴즈';
                if (!acc[title]) {
                    acc[title] = [];
                }
                acc[title].push(record);
                return acc;
            }, {});

            historyListEl.innerHTML = ''; // 로딩 메시지 제거

            for (const quizTitle in groupedByQuiz) {
                const groupContainer = document.createElement('div');
                groupContainer.classList.add('history-quiz-group');
                
                const groupTitleEl = document.createElement('h3');
                groupTitleEl.classList.add('history-group-title');
                groupTitleEl.textContent = quizTitle;
                groupContainer.appendChild(groupTitleEl);

                const attemptListUl = document.createElement('ul');
                attemptListUl.classList.add('history-attempt-list');

                groupedByQuiz[quizTitle].forEach(record => {
                    const attemptItemLi = document.createElement('li');
                    attemptItemLi.classList.add('history-attempt-item');
                    
                    const attemptDate = new Date(record.timestamp).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    const attemptScore = record.score.toFixed(1);

                    attemptItemLi.innerHTML = `
                        <span class="attempt-date">${attemptDate}</span> - 
                        <span class="attempt-score">점수: ${attemptScore}점</span>
                    `;
                    attemptItemLi.addEventListener('click', () => displayHistoryDetail(record));
                    attemptListUl.appendChild(attemptItemLi);
                });
                groupContainer.appendChild(attemptListUl);
                historyListEl.appendChild(groupContainer);
            }

        } catch (error) {
            console.error("서버에서 히스토리 로드 중 오류 발생:", error);
            historyListEl.innerHTML = `<p style="color:red;">기록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        }
    }

    function displayHistoryDetail(record) {
        if (!historyDetailEl) return;

        const quizTitleForDisplay = record.quiz_title || record.quiz_id || "해당 퀴즈";
        historyDetailEl.innerHTML = `
            <h3>"${quizTitleForDisplay}" 상세 기록</h3>
            <p><strong>응시 일시:</strong> ${new Date(record.timestamp).toLocaleString('ko-KR')}</p>
            <p><strong>점수:</strong> ${record.score.toFixed(1)}점</p>
            <h4>답변 상세:</h4>
        `;
        
        const incorrectIds = record.incorrect_question_ids || [];

        if (record.answers_details && Array.isArray(record.answers_details) && record.answers_details.length > 0) {
            record.answers_details.forEach((ans, index) => {
                const card = document.createElement('div');
                card.classList.add('result-card');
                card.classList.add(ans.isCorrect ? 'correct' : 'incorrect');
                if (!ans.isCorrect && incorrectIds.includes(ans.questionId)) {
                    card.classList.add('highlight-incorrect'); // 틀린 문제 강조 클래스 (CSS에서 정의 필요)
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
                    <div class="result-card-status">${ans.isCorrect ? '정답 👍' : '오답 👎'}</div>
                `;
                historyDetailEl.appendChild(card); 
            });
        } else {
            const p = document.createElement('p');
            p.textContent = '상세 답변 기록이 없습니다.';
            historyDetailEl.appendChild(p);
        }

        if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
            setTimeout(() => {
                MathJax.typesetPromise(historyDetailEl.querySelectorAll('.result-card')).catch((err) => console.error('MathJax typesetPromise failed for history details:', err));
            }, 0);
        }
    }
});
