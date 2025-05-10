document.addEventListener('DOMContentLoaded', function() {
    console.log("대시보드 스크립트 로드됨");

    const avgScoreEl = document.getElementById('avg-score');
    const rankingListEl = document.getElementById('score-ranking-list');
    // const badgeDisplayEl = document.getElementById('badge-display'); // 뱃지 기능은 추후 확장

    function loadDashboardData() {
        let allUserHistories = [];
        let totalScores = 0;
        let totalEntries = 0;
        const userScores = {}; // 사용자별 최고 점수 및 총점/횟수 저장

        // localStorage에서 모든 quizHistory_userId 형태의 키를 가져옴
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('quizHistory_')) {
                try {
                    const history = JSON.parse(localStorage.getItem(key));
                    if (Array.isArray(history)) {
                        allUserHistories.push(...history); // 모든 기록을 하나로 합침
                        
                        // 사용자별 통계 계산
                        const userId = history.length > 0 ? history[0].userId : key.replace('quizHistory_', '');
                        if (!userScores[userId]) {
                            userScores[userId] = { highestScore: 0, totalScore: 0, count: 0, badges: [] };
                        }
                        history.forEach(record => {
                            userScores[userId].totalScore += record.score;
                            userScores[userId].count++;
                            if (record.score > userScores[userId].highestScore) {
                                userScores[userId].highestScore = record.score;
                            }
                            // 뱃지 로직 (예시: 특정 퀴즈 만점)
                            if (record.quizId === 'math101' && record.score === 100) {
                                if (!userScores[userId].badges.includes("수학 마스터")) {
                                    userScores[userId].badges.push("수학 마스터");
                                }
                            }
                             if (record.quizId === 'history_basics' && record.score === 100) {
                                if (!userScores[userId].badges.includes("역사학자")) {
                                    userScores[userId].badges.push("역사학자");
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error(`localStorage에서 ${key} 파싱 중 오류:`, e);
                }
            }
        }

        if (allUserHistories.length === 0) {
            if (avgScoreEl) avgScoreEl.textContent = 'N/A';
            if (rankingListEl) rankingListEl.innerHTML = '<li>데이터가 없습니다.</li>';
            return;
        }

        allUserHistories.forEach(record => {
            totalScores += record.score;
            totalEntries++;
        });

        const averageScore = totalEntries > 0 ? (totalScores / totalEntries) : 0;
        if (avgScoreEl) avgScoreEl.textContent = averageScore.toFixed(1);

        // 랭킹 생성 (최고 점수 기준)
        const rankedUsers = Object.entries(userScores)
            .map(([userId, data]) => ({ userId, score: data.highestScore, badges: data.badges }))
            .sort((a, b) => b.score - a.score); // 점수 내림차순

        if (rankingListEl) {
            rankingListEl.innerHTML = ''; // 기존 목록 초기화
            rankedUsers.slice(0, 10).forEach((user, index) => { // 상위 10명만 표시
                const li = document.createElement('li');
                let badgeHtml = '';
                if(user.badges && user.badges.length > 0) {
                    badgeHtml = user.badges.map(b => `<span class="badge">${b}</span>`).join(' ');
                }
                li.innerHTML = `${index + 1}. ${user.userId} - ${user.score.toFixed(1)}점 ${badgeHtml}`;
                rankingListEl.appendChild(li);
            });
        }
        
        // TODO: 서버리스 함수를 사용할 경우, API 호출로 데이터를 가져오도록 수정
    }

    loadDashboardData();
});
