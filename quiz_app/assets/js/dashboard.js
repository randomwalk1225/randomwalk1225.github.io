document.addEventListener('DOMContentLoaded', function() {
    console.log("대시보드 스크립트 로드됨");

    const avgScoreEl = document.getElementById('avg-score');
    const rankingListEl = document.getElementById('score-ranking-list');
    // const badgeDisplayEl = document.getElementById('badge-display'); // 뱃지 기능은 추후 확장

    async function loadDashboardData() {
        if (avgScoreEl) avgScoreEl.textContent = '로딩 중...';
        if (rankingListEl) rankingListEl.innerHTML = '<li>랭킹 정보를 불러오는 중...</li>';

        const siteBaseUrl = document.body.getAttribute('data-baseurl') || '';
        const functionPath = `${siteBaseUrl}/.netlify/functions/getDashboardData`;

        try {
            const response = await fetch(functionPath);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`서버에서 대시보드 데이터를 불러오는 데 실패했습니다: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();

            if (avgScoreEl) {
                avgScoreEl.textContent = data.averageScore !== undefined ? data.averageScore.toFixed(1) : 'N/A';
            }

            if (rankingListEl) {
                rankingListEl.innerHTML = ''; // 기존 목록 초기화
                if (data.ranking && data.ranking.length > 0) {
                    data.ranking.forEach((user, index) => {
                        const li = document.createElement('li');
                        let badgeHtml = '';
                        if (user.badges && user.badges.length > 0) {
                            badgeHtml = user.badges.map(b => `<span class="badge">${b}</span>`).join(' ');
                        }
                        li.innerHTML = `${index + 1}. ${user.userId} - ${user.score.toFixed(1)}점 ${badgeHtml}`;
                        rankingListEl.appendChild(li);
                    });
                } else {
                    rankingListEl.innerHTML = '<li>랭킹 데이터가 없습니다.</li>';
                }
            }
            // 추가 통계 표시 (예: 총 참여자 수)
            // if (document.getElementById('total-participants')) {
            //     document.getElementById('total-participants').textContent = data.totalParticipants || 0;
            // }
            // if (document.getElementById('total-submissions')) {
            //     document.getElementById('total-submissions').textContent = data.totalSubmissions || 0;
            // }

        } catch (error) {
            console.error("대시보드 데이터 로드 실패:", error);
            if (avgScoreEl) avgScoreEl.textContent = '오류';
            if (rankingListEl) rankingListEl.innerHTML = `<li>데이터 로드 오류: ${error.message}</li>`;
        }
    }

    loadDashboardData();
});
