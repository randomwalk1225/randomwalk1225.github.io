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
      .select('user_id, score, created_at, total_questions, correct_answers_count'); // total_questions, correct_answers_count 추가

    if (fetchError) {
      console.error('Supabase select error for dashboard:', fetchError);
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Failed to fetch data for dashboard.', details: fetchError.message }) };
    }

    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;

    if (allResults && allResults.length > 0) {
      allResults.forEach(r => {
        totalQuestionsAnswered += r.total_questions || 0;
        totalCorrectAnswers += r.correct_answers_count || 0;
      });
    }

    const sortedResults = allResults ? [...allResults].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
    const topRankings = sortedResults.slice(0, 10).map(r => ({ 
        userId: r.user_id, 
        score: r.score,
        timestamp: r.created_at 
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        topRankings: topRankings,
        totalAttempts: allResults ? allResults.length : 0, // 기존 totalParticipants를 totalAttempts로 명칭 변경 고려 또는 유지
        totalQuestionsAnswered: totalQuestionsAnswered,
        totalCorrectAnswers: totalCorrectAnswers
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
