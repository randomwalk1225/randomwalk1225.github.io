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
        historyListEl.innerHTML = '<li>기록을 불러오는 중...</li>'; // 로딩 메시지
        historyDetailEl.innerHTML = ''; // 이전 상세 정보 초기화

        const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app"; // 실제 Netlify 사이트 URL로 변경 필요
        const functionPath = `${netlifySiteUrl}/.netlify/functions/getUserHistory?userId=${encodeURIComponent(userId)}`;

        try {
            const response = await fetch(functionPath);
            const responseText = await response.text(); // 먼저 텍스트로 응답을 받음

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorJson = JSON.parse(responseText); // 텍스트를 JSON으로 파싱 시도
                    errorDetail = errorJson.error || errorJson.message || response.statusText;
                } catch (e) {
                    // JSON 파싱 실패 시, responseText 자체가 오류 메시지일 수 있음 (HTML 등)
                    console.error("Failed to parse error response as JSON:", responseText);
                }
                throw new Error(`서버에서 기록을 불러오는 데 실패했습니다 (${response.status}): ${errorDetail}`);
            }
            
            const userHistory = JSON.parse(responseText); // 성공 응답은 JSON으로 파싱

            if (!Array.isArray(userHistory) || userHistory.length === 0) {
                historyListEl.innerHTML = '<p>아직 응시한 퀴즈 기록이 없습니다.</p>';
                return;
            }

            // 시간 역순으로 정렬 (최신 기록이 위로)
            userHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            historyListEl.innerHTML = ''; // 로딩 메시지 제거
            const ul = document.createElement('ul');
            userHistory.forEach(record => {
                const li = document.createElement('li');
                const button = document.createElement('button');
                // Supabase에서 온 record 객체입니다. 필드명은 DB 컬럼명과 일치합니다.
                button.textContent = `${record.quiz_title || record.quiz_id} - ${new Date(record.timestamp).toLocaleString('ko-KR')} (점수: ${record.score.toFixed(1)})`;
                button.addEventListener('click', () => displayHistoryDetail(record));
                li.appendChild(button);
                ul.appendChild(li);
            });
            historyListEl.appendChild(ul);

        } catch (error) {
            console.error("서버에서 히스토리 로드 중 오류 발생:", error);
            historyListEl.innerHTML = `<p style="color:red;">기록을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        }
    }

    function displayHistoryDetail(record) {
        if (!historyDetailEl) return;

        historyDetailEl.innerHTML = `
            <h3>"${record.quiz_title || record.quiz_id}" 상세 기록</h3>
            <p><strong>응시 일시:</strong> ${new Date(record.timestamp).toLocaleString('ko-KR')}</p>
            <p><strong>점수:</strong> ${record.score.toFixed(1)}점</p>
            <h4>답변 상세:</h4>
        `;

        const ul = document.createElement('ul');
        // record.answers 대신 record.answers_details를 사용해야 합니다.
        if (record.answers_details && Array.isArray(record.answers_details)) {
            record.answers_details.forEach((ans, index) => { // index 추가
                const card = document.createElement('div');
                card.classList.add('result-card');
            card.classList.add(ans.isCorrect ? 'correct' : 'incorrect');
            
            let displayUserAnswer = ans.userAnswer || "(답변 없음)";
            let displayCorrectAnswer = ans.correctAnswer;

            // isMathInput 플래그가 있고, short-answer 타입이며, $가 없는 경우 추가
            // ans 객체에 type과 isMathInput이 저장되어 있다고 가정
            if (ans.type === 'short-answer' && ans.isMathInput) {
                if (displayUserAnswer !== "(답변 없음)" && !displayUserAnswer.includes('$')) {
                    displayUserAnswer = `$${displayUserAnswer}$`;
                }
                // 정답은 quiz.json에 이미 $가 있을 것이므로, 사용자 답안 위주로 처리
                // if (displayCorrectAnswer && !displayCorrectAnswer.includes('$')) { // 정답도 $가 없을 수 있다면
                //    displayCorrectAnswer = `$${displayCorrectAnswer}$`;
                // }
            }

            card.innerHTML = `
                <div class="result-card-question"><strong>문제 ${index + 1}:</strong> ${ans.question}</div>
                <div class="result-card-user-answer"><strong>제출 답:</strong> ${displayUserAnswer}</div>
                <div class="result-card-correct-answer"><strong>정답:</strong> ${displayCorrectAnswer}</div>
                <div class="result-card-status">${ans.isCorrect ? '정답 👍' : '오답 👎'}</div>
            `;
            // ul 대신 historyDetailEl에 직접 카드 추가
            historyDetailEl.appendChild(card); 
            });
        } else {
            const p = document.createElement('p');
            p.textContent = '상세 답변 기록이 없습니다.';
            historyDetailEl.appendChild(p);
        }
        // historyDetailEl.appendChild(ul); // 기존 ul 제거 (ul은 더 이상 사용되지 않음)

        // 모든 카드가 추가된 후 MathJax를 한 번 호출 (setTimeout으로 DOM 업데이트 보장)
        if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
            setTimeout(() => {
                MathJax.typesetPromise().catch((err) => console.error('MathJax typesetPromise failed for history details:', err));
            }, 0);
        }
    }
});
