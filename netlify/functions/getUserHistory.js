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

  const userId = event.queryStringParameters.userId;

  if (!userId) {
    return { statusCode: 400, body: 'Missing userId query parameter' };
  }

  try {
    const client = new faunadb.Client({ secret: FAUNA_SERVER_SECRET });

    // 'quiz_results_by_userId' 인덱스를 사용하여 특정 사용자의 결과 조회
    // 이 인덱스는 FaunaDB에서 미리 생성해야 합니다.
    // terms: 인덱싱할 필드 (여기서는 data.userId)
    // values: 인덱스에 포함될 추가 데이터 (여기서는 전체 문서의 ref와 data)
    /* 예시 인덱스 생성 FQL (FaunaDB Shell에서 실행):
       CreateIndex({
         name: "quiz_results_by_userId",
         source: Collection("quiz_results"),
         terms: [{ field: ["data", "userId"] }],
         values: [{ field: ["ref"] }, { field: ["data"] }]
       })
    */
    const result = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('quiz_results_by_userId'), userId)),
        q.Lambda(x => q.Select(["data"], q.Get(q.Select(["ref"], x)))) // ref 대신 value의 data 필드를 직접 가져오도록 수정
                                                                    // 또는 q.Lambda(x => q.Select(["data"], q.Get(x))) 만약 인덱스가 ref만 반환한다면
                                                                    // 만약 인덱스 values에 { field: ["data"] } 만 있다면 q.Lambda(x => x)
      )
    );
    
    // result.data는 배열이며, 각 요소가 { data: quizResult } 형태일 수 있으므로, 실제 quizResult만 추출
    // 위 FQL 수정으로 인해 result.data는 이미 quizResult 객체들의 배열이 됩니다.

    return {
      statusCode: 200,
      body: JSON.stringify(result.data), // result.data가 이미 원하는 데이터 배열
    };
  } catch (error) {
    console.error('FaunaDB 조회 오류:', error);
    // FaunaDB의 인덱스 관련 오류는 error.description에 상세 내용이 있을 수 있습니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get user history.', details: error.message, faunaError: error.description }),
    };
  }
};
