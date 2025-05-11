document.addEventListener('DOMContentLoaded', function() {
    console.log("대시보드 스크립트 로드됨");

    const avgScoreEl = document.getElementById('avg-score');
    const rankingListEl = document.getElementById('score-ranking-list');
    // const badgeDisplayEl = document.getElementById('badge-display'); // 뱃지 기능은 추후 확장

    async function loadDashboardData() {
        if (avgScoreEl) avgScoreEl.textContent = '로딩 중...';
        if (rankingListEl) rankingListEl.innerHTML = '<li>랭킹 정보를 불러오는 중...</li>';

        const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app"; // 실제 Netlify 사이트 URL로 변경 필요
        const functionPath = `${netlifySiteUrl}/.netlify/functions/getDashboardData`;

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
                throw new Error(`서버에서 대시보드 데이터를 불러오는 데 실패했습니다 (${response.status}): ${errorDetail}`);
            }
            
            const data = JSON.parse(responseText); // 성공 응답은 JSON으로 파싱

            if (avgScoreEl) {
                avgScoreEl.textContent = data.averageScore !== undefined ? data.averageScore.toFixed(1) : 'N/A';
            }

            if (rankingListEl) {
                rankingListEl.innerHTML = ''; // 기존 목록 초기화
                if (data.topRankings && data.topRankings.length > 0) { // 변경: data.ranking -> data.topRankings
                    data.topRankings.forEach((user, index) => {
                        const li = document.createElement('li');
                        // 뱃지 기능은 현재 getDashboardData에서 반환하지 않으므로 일단 제거
                        // let badgeHtml = '';
                        // if (user.badges && user.badges.length > 0) {
                        //     badgeHtml = user.badges.map(b => `<span class="badge">${b}</span>`).join(' ');
                        // }
                        // <ol>이 자동으로 번호를 매기므로, JS에서 `${index + 1}. ` 부분 제거
                        li.innerHTML = `${user.userId} - ${user.score.toFixed(1)}점`; 
                        rankingListEl.appendChild(li);
                    });
                } else {
                    rankingListEl.innerHTML = '<li>랭킹 데이터가 없습니다.</li>';
                }
            }
            
            const totalParticipantsEl = document.getElementById('total-participants'); // ID 일치 확인
            if (totalParticipantsEl) { // totalParticipantsEl이 실제로 존재하는지 확인
                totalParticipantsEl.textContent = data.totalParticipants !== undefined ? data.totalParticipants : 'N/A';
            }

        } catch (error) {
            console.error("대시보드 데이터 로드 실패:", error);
            if (avgScoreEl) avgScoreEl.textContent = '오류';
            if (rankingListEl) rankingListEl.innerHTML = `<li>데이터 로드 오류: ${error.message}</li>`;
        }
    }

    loadDashboardData();
});
