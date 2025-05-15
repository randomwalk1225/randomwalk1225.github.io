const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://randomwalk1225.github.io', // 실제 GitHub Pages URL로 변경 필요 시
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // 허용할 HTTP 메소드
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

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: CORS_HEADERS, // 모든 응답에 CORS 헤더 포함
      body: 'Method Not Allowed' 
    };
  }

  try {
    const quizResult = JSON.parse(event.body);
    
    // Supabase 클라이언트 초기화
    // Netlify 환경 변수에서 Supabase URL과 Service Role Key를 가져옵니다.
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Service Key is missing in environment variables.');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Supabase 'quiz_results' 테이블에 데이터 삽입
    // 테이블명과 컬럼명은 Supabase 프로젝트에서 생성한 것과 일치해야 합니다.
    const { data, error } = await supabase
      .from('quiz_results') // 테이블명
      .insert([
        { 
          user_id: quizResult.user_id, 
          quiz_id: quizResult.quiz_id, // Use quiz_id from client
          quiz_title: quizResult.quiz_title, // Use quiz_title from client
          score: quizResult.score,
          total_questions: quizResult.total_questions, // Use total_questions from client
          correct_answers_count: quizResult.correct_answers_count, // Use correct_answers_count from client
          answers_details: quizResult.answers_details, // Use answers_details from client
          incorrect_question_ids: quizResult.incorrect_question_ids,
          elapsed_time_seconds: quizResult.elapsed_time_seconds // Add elapsed_time_seconds
        }
      ])
      .select(); // 삽입된 데이터를 반환받기 위해 .select() 추가 (선택 사항)

    if (error) {
      console.error('Supabase insert error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save quiz result to database.', details: error.message }) };
    }

    console.log('Quiz result saved to Supabase:', data);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Quiz result saved successfully.', savedData: data }),
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
