const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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
          user_id: quizResult.userId,
          quiz_id: quizResult.quizId,
          quiz_title: quizResult.quizTitle,
          score: quizResult.score,
          // total_questions, correct_answers_count는 클라이언트에서 계산해서 보내거나,
          // answers_details를 기반으로 여기서 계산할 수 있습니다.
          // 여기서는 클라이언트에서 보낸다고 가정하고, 없다면 null 또는 기본값 처리.
          total_questions: quizResult.answers ? quizResult.answers.length : 0, 
          correct_answers_count: quizResult.answers ? quizResult.answers.filter(a => a.isCorrect).length : 0,
          answers_details: quizResult.answers, // JSONB 타입으로 저장
          // created_at은 Supabase 테이블에서 default now()로 자동 생성되도록 설정하는 것이 일반적입니다.
          // 명시적으로 보내려면: created_at: new Date().toISOString() 
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
      body: JSON.stringify({ message: 'Quiz result saved successfully.', savedData: data }),
    };

  } catch (e) {
    console.error('Error processing request:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error processing request.', details: e.message }) };
  }
};
