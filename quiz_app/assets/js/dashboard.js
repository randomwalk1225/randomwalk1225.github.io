document.addEventListener('DOMContentLoaded', function() {
    console.log("대시보드 스크립트 로드됨");

    // const avgScoreEl = document.getElementById('avg-score'); // 평균 점수 요소 제거
    const rankingListEl = document.getElementById('score-ranking-list');
    const totalParticipantsEl = document.getElementById('total-participants'); // 전체 통계의 참여자 수 요소

    async function loadDashboardData() {
        // if (avgScoreEl) avgScoreEl.textContent = '로딩 중...'; // 평균 점수 로딩 메시지 제거
        if (rankingListEl) rankingListEl.innerHTML = '<li>랭킹 정보를 불러오는 중...</li>';
        if (totalParticipantsEl) totalParticipantsEl.textContent = '로딩 중...';


        const netlifySiteUrl = "https://chipper-cupcake-752544.netlify.app"; 
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
            
            const data = JSON.parse(responseText); 

            // if (avgScoreEl) { // 평균 점수 표시 로직 제거
            //     avgScoreEl.textContent = data.averageScore !== undefined ? data.averageScore.toFixed(1) : 'N/A';
            // }

            if (rankingListEl) {
                rankingListEl.innerHTML = ''; 
                if (data.topRankings && data.topRankings.length > 0) { 
                    data.topRankings.forEach((user) => { // index는 <ol>이 처리하므로 제거
                        const li = document.createElement('li');
                        const dateString = user.timestamp ? new Date(user.timestamp).toLocaleString('ko-KR', { 
                            year: 'numeric', month: '2-digit', day: '2-digit', 
                            hour: '2-digit', minute: '2-digit' 
                        }) : '날짜 정보 없음';
                        
                        li.innerHTML = `${user.userId} - ${user.score.toFixed(1)}점 <span class="ranking-timestamp">(${dateString})</span>`; 
                        rankingListEl.appendChild(li);
                    });
                } else {
                    rankingListEl.innerHTML = '<li>랭킹 데이터가 없습니다.</li>';
                }
            }
            
            if (totalParticipantsEl) { 
                totalParticipantsEl.textContent = data.totalParticipants !== undefined ? data.totalParticipants : 'N/A';
            }

        } catch (error) {
            console.error("대시보드 데이터 로드 실패:", error);
            // if (avgScoreEl) avgScoreEl.textContent = '오류'; // 평균 점수 오류 메시지 제거
            if (rankingListEl) rankingListEl.innerHTML = `<li>데이터 로드 오류: ${error.message}</li>`;
            if (totalParticipantsEl) totalParticipantsEl.textContent = '오류';
        }
    }

    loadDashboardData();
});
