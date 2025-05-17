const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
  let quizzesDir;
  const primaryPath = path.join(process.env.LAMBDA_TASK_ROOT || '.', 'quizzes');
  const fallbackPath = path.join(__dirname, '../../quizzes');

  // 경로 접근 여부 확인 후 사용
  try {
    await fs.access(primaryPath);
    quizzesDir = primaryPath;
    console.log(`[getQuizList] Using primary path: ${primaryPath}`);
  } catch {
    console.warn(`[getQuizList] Primary path not accessible. Attempting fallback path: ${fallbackPath}`);
    try {
      await fs.access(fallbackPath);
      quizzesDir = fallbackPath;
      console.log(`[getQuizList] Using fallback path: ${fallbackPath}`);
    } catch (e) {
      console.error(`[getQuizList] Neither primary nor fallback path accessible: ${e.message}`);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({
          error: "Quizzes directory not found.",
          details: `Tried primary: ${primaryPath}, fallback: ${fallbackPath}`
        })
      };
    }
  }

  try {
    // 1) 디렉토리 비동기 읽기
    const names = await fs.readdir(quizzesDir);
    // 2) 폴더 필터링 및 quiz.json 읽기를 병렬 처리
    const quizzes = await Promise.all(
      names.map(async name => {
        const folderPath = path.join(quizzesDir, name);
        try {
          const stat = await fs.stat(folderPath);
          if (!stat.isDirectory()) return null;
        } catch (e) {
          console.error(`[getQuizList] Cannot stat folder: ${folderPath} - ${e.message}`);
          return null;
        }
        try {
          const quizJsonPath = path.join(folderPath, 'quiz.json');
          const raw = await fs.readFile(quizJsonPath, 'utf-8');
          const data = JSON.parse(raw);
          return { id: name, ...data, creationDate: data.creationDate || '' };
        } catch (e) {
          console.error(`[getQuizList] Error processing ${name}: ${e.message}`);
          return null;
        }
      })
    );
    // 3) null 제거 및 퀴즈 정렬
    const result = quizzes.filter(q => q !== null)
                          .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.error("[getQuizList] General error:", err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        error: "Failed to get quiz list.",
        details: err.message,
        debug_stack: err.stack
      })
    };
  }
};