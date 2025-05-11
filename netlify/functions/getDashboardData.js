const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://randomwalk1225.github.io', // 실제 GitHub Pages URL로 변경 필요 시
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

exports.handler = async (event, context) => {
  // Preflight OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: CORS_HEADERS,
      body: 'Method Not Allowed' 
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Service Key is missing in environment variables.');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 모든 퀴즈 결과 데이터 가져오기
    const { data: allResults, error: fetchError } = await supabase
      .from('quiz_results')
      .select('user_id, score'); // 평균 및 랭킹 계산에 필요한 컬럼만 선택

    if (fetchError) {
      console.error('Supabase select error for dashboard:', fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch data for dashboard.', details: fetchError.message }) };
    }

    let averageScore = 0;
    if (allResults && allResults.length > 0) {
      const totalScore = allResults.reduce((sum, result) => sum + (result.score || 0), 0);
      averageScore = totalScore / allResults.length;
    }

    // 사용자별 총점 또는 평균 점수를 기준으로 랭킹 계산 (여기서는 개별 최고 점수 기준)
    // 좀 더 복잡한 랭킹 (예: 사용자별 평균 최고점)은 SQL 쿼리나 추가 로직 필요
    const sortedResults = allResults ? [...allResults].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
    const topRankings = sortedResults.slice(0, 10).map(r => ({ userId: r.user_id, score: r.score })); // 상위 10명으로 변경

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        averageScore: parseFloat(averageScore.toFixed(1)),
        topRankings: topRankings,
        totalParticipants: allResults ? allResults.length : 0 // 총 참여 횟수 (또는 고유 사용자 수로 변경 가능)
      }),
    };

  } catch (e) {
    console.error('Error processing dashboard request:', e);
    return { 
      statusCode: 500, 
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Error processing dashboard request.', details: e.message }) 
    };
  }
};
