// faunadb 드라이버 로드
const faunadb = require('faunadb');
const q = faunadb.query;

// Netlify 환경 변수에서 FaunaDB 서버 키를 가져옵니다.
// Netlify UI에서 FAUNA_SERVER_SECRET 이름으로 키를 설정해야 합니다.
const FAUNA_SERVER_SECRET = process.env.FAUNA_SERVER_SECRET;

exports.handler = async (event, context) => {
  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!FAUNA_SERVER_SECRET) {
    console.error("FaunaDB 서버 시크릿이 설정되지 않았습니다.");
    return { statusCode: 500, body: 'Server configuration error.' };
  }

  try {
    // 요청 본문에서 퀴즈 결과 데이터 파싱
    const quizResult = JSON.parse(event.body);

    // FaunaDB 클라이언트 초기화
    const client = new faunadb.Client({ secret: FAUNA_SERVER_SECRET });

    // 'quiz_results' 컬렉션에 데이터 생성
    // 컬렉션 이름은 FaunaDB 대시보드에서 생성한 이름과 일치해야 합니다.
    const result = await client.query(
      q.Create(
        q.Collection('quiz_results'), // 컬렉션 이름
        { data: quizResult }
      )
    );

    console.log('FaunaDB 저장 성공:', result);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Quiz result saved successfully', id: result.ref.id }),
    };
  } catch (error) {
    console.error('FaunaDB 저장 오류:', error);
    // 실제 운영 환경에서는 오류 메시지를 더 상세하게 로깅하거나, 사용자에게 친화적인 메시지를 반환해야 합니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save quiz result.', details: error.message }),
    };
  }
};
