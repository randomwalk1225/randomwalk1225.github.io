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
    const userId = event.queryStringParameters.userId;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId query parameter is required.' }) };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Service Key is missing in environment variables.');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Supabase 'quiz_results' 테이블에서 특정 user_id의 데이터 조회
    // timestamp 기준으로 내림차순 정렬 (최신 기록이 위로)
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*') // 모든 컬럼 선택
      .eq('user_id', userId) // user_id가 일치하는 데이터
      .order('created_at', { ascending: false }); // 생성 시간 기준 내림차순

    if (error) {
      console.error('Supabase select error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch quiz history from database.', details: error.message }) };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data || []), // 데이터가 없을 경우 빈 배열 반환
    };

  } catch (e) {
    console.error('Error processing request:', e);
    return { 
      statusCode: 500, 
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Error processing request.', details: e.message }) 
    };
  }
};
