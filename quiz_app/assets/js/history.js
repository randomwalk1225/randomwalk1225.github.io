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

        const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
        const functionPath = `${siteBaseUrl}/.netlify/functions/getUserHistory?userId=${encodeURIComponent(userId)}`;

        try {
            const response = await fetch(functionPath);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`서버에서 기록을 불러오는 데 실패했습니다: ${errorData.error || response.statusText}`);
            }
            
            const userHistory = await response.json();

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
                // record 객체는 FaunaDB에서 온 data 객체 그 자체입니다.
                button.textContent = `${record.quizTitle || record.quizId} - ${new Date(record.timestamp).toLocaleString('ko-KR')} (점수: ${record.score.toFixed(1)})`;
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
            <h3>"${record.quizTitle || record.quizId}" 상세 기록</h3>
            <p><strong>응시 일시:</strong> ${new Date(record.timestamp).toLocaleString('ko-KR')}</p>
            <p><strong>점수:</strong> ${record.score.toFixed(1)}점</p>
            <h4>답변 상세:</h4>
        `;

        const ul = document.createElement('ul');
        record.answers.forEach(ans => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>문제:</strong> ${ans.question}<br>
                <strong>제출 답:</strong> ${ans.userAnswer}<br>
                <strong>정답:</strong> ${ans.correctAnswer}<br>
                <strong>결과:</strong> <span style="color:${ans.isCorrect ? 'green' : 'red'};">${ans.isCorrect ? '정답' : '오답'}</span>
            `;
            ul.appendChild(li);
        });
        historyDetailEl.appendChild(ul);
    }
});
