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
      .select('user_id, score, created_at'); // created_at 추가

    if (fetchError) {
      console.error('Supabase select error for dashboard:', fetchError);
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Failed to fetch data for dashboard.', details: fetchError.message }) };
    }

    // 평균 점수 계산 로직 삭제

    const sortedResults = allResults ? [...allResults].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
    const topRankings = sortedResults.slice(0, 10).map(r => ({ 
        userId: r.user_id, 
        score: r.score,
        timestamp: r.created_at // 타임스탬프 추가
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        // averageScore 필드 삭제
        topRankings: topRankings,
        totalParticipants: allResults ? allResults.length : 0 
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
