const faunadb = require('faunadb');
const q = faunadb.query;

const FAUNA_SERVER_SECRET = process.env.FAUNA_SERVER_SECRET;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!FAUNA_SERVER_SECRET) {
    console.error("FaunaDB 서버 시크릿이 설정되지 않았습니다.");
    return { statusCode: 500, body: 'Server configuration error.' };
  }

  try {
    const client = new faunadb.Client({ secret: FAUNA_SERVER_SECRET });

    // 모든 퀴즈 결과를 가져오기 위한 인덱스 사용
    // 예: 'all_quiz_results' (values에 점수, 사용자 ID, 퀴즈 ID, 뱃지 관련 정보 포함)
    /* 예시 인덱스 생성 FQL:
       CreateIndex({
         name: "all_quiz_results_with_details",
         source: Collection("quiz_results"),
         // terms 없이 모든 문서를 대상으로 하거나, 특정 필드를 기준으로 할 수 있음
         values: [
           { field: ["data", "userId"] },
           { field: ["data", "score"] },
           { field: ["data", "quizId"] },
           // 필요하다면 다른 필드도 추가 (예: timestamp)
         ]
       })
    */
    const result = await client.query(
      q.Map(
        // q.Paginate(q.Documents(q.Collection('quiz_results'))), // 가장 간단하게 모든 문서 가져오기
        q.Paginate(q.Match(q.Index('all_quiz_results_with_details'))), // 인덱스 사용 권장
        q.Lambda(
          ["userId", "score", "quizId"], // 인덱스 values 순서에 맞게 변수명 지정
          { 
            userId: q.Var("userId"), 
            score: q.Var("score"),
            quizId: q.Var("quizId")
            // 다른 필요한 필드도 q.Var로 가져올 수 있음
          }
        )
      )
    );

    const allRecords = result.data; // [{ userId: '...', score: ..., quizId: '...' }, ...]

    if (!allRecords || allRecords.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ averageScore: 0, ranking: [], totalParticipants: 0 }),
      };
    }

    // 평균 점수 계산
    const totalScoreSum = allRecords.reduce((sum, record) => sum + record.score, 0);
    const averageScore = totalScoreSum / allRecords.length;

    // 사용자별 최고 점수 및 뱃지 계산 (dashboard.js 로직과 유사하게)
    const userStats = {};
    allRecords.forEach(record => {
      if (!userStats[record.userId]) {
        userStats[record.userId] = { highestScore: 0, badges: [] };
      }
      if (record.score > userStats[record.userId].highestScore) {
        userStats[record.userId].highestScore = record.score;
      }
      // 뱃지 로직 (예시)
      if (record.quizId === 'math101' && record.score === 100) {
        if (!userStats[record.userId].badges.includes("수학 마스터")) {
            userStats[record.userId].badges.push("수학 마스터");
        }
      }
      if (record.quizId === 'history_basics' && record.score === 100) {
        if (!userStats[record.userId].badges.includes("역사학자")) {
            userStats[record.userId].badges.push("역사학자");
        }
      }
    });
    
    const ranking = Object.entries(userStats)
      .map(([userId, data]) => ({ userId, score: data.highestScore, badges: data.badges }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // 상위 10명

    return {
      statusCode: 200,
      body: JSON.stringify({
        averageScore: parseFloat(averageScore.toFixed(1)),
        ranking: ranking,
        totalParticipants: Object.keys(userStats).length,
        totalSubmissions: allRecords.length
      }),
    };

  } catch (error) {
    console.error('FaunaDB 대시보드 데이터 조회 오류:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get dashboard data.', details: error.message, faunaError: error.description }),
    };
  }
};
