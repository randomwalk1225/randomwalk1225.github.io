const fs = require('fs');
const path = require('path');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://randomwalk1225.github.io', // Adjust to your GitHub Pages URL or '*' for local testing
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event, context) => {
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
      body: 'Method Not Allowed',
    };
  }

  try {
    // Path to the quizzes directory from the function's location
    // Netlify functions are typically built into a .netlify/functions/ folder at the site root.
    // The original source is netlify/functions/getQuizList.js.
    // During build, it might be copied to .netlify/functions/netlify/functions/getQuizList.js or similar.
    // Let's assume the execution context allows access relative to the site root.
    // A common pattern is to use process.env.LAMBDA_TASK_ROOT and navigate from there,
    // or assume PWD is the site root.
    // For Netlify, functions are often placed in a 'functions' or 'netlify/functions' dir.
    // If the function is at `netlify/functions/getQuizList.js`, then `../../quizzes` would be correct.
    const quizzesDirPath = path.resolve(__dirname, '../../quizzes');
    console.log('[getQuizList] Resolved quizzesDirPath:', quizzesDirPath); // For debugging on Netlify logs

    let entries = [];
    try {
      entries = fs.readdirSync(quizzesDirPath, { withFileTypes: true });
      console.log('[getQuizList] Entries in quizzesDirPath:', entries.map(e => e.name));
    } catch (readDirError) {
      console.error('[getQuizList] Error reading quizzesDirPath:', quizzesDirPath, readDirError);
      throw readDirError; // Re-throw to be caught by the main try-catch
    }
    
    const quizList = entries
      .filter(dirent => {
        const isDir = dirent.isDirectory();
        // console.log(`[getQuizList] Checking entry: ${dirent.name}, isDirectory: ${isDir}`);
        return isDir;
      })
      .map(dirent => {
        const quizId = dirent.name;
        const quizJsonPath = path.join(quizzesDirPath, quizId, 'quiz.json');
        let quizTitle = quizId; // Default title to ID

        if (fs.existsSync(quizJsonPath)) {
          try {
            const quizJsonContent = fs.readFileSync(quizJsonPath, 'utf-8');
            const quizData = JSON.parse(quizJsonContent);
            
            // Try to get title from new format: { "title": "...", "quizzes": [...] }
            if (typeof quizData.title === 'string') {
              quizTitle = quizData.title;
            } 
            // Else, try to get title from old format: [ {"title": "..."}, ... ]
            else if (Array.isArray(quizData) && quizData.length > 0 && quizData[0] && typeof quizData[0].title === 'string') {
              quizTitle = quizData[0].title;
            }
            // console.log(`[getQuizList] Found quiz.json for ${quizId}, title: ${quizTitle}`);
          } catch (parseError) {
            console.error(`[getQuizList] Error parsing quiz.json for ${quizId}:`, parseError);
            // quizTitle remains quizId (default)
          }
        } else {
          // console.log(`[getQuizList] No quiz.json found for ${quizId}`);
        }
        return { id: quizId, title: quizTitle };
      });
    
    console.log('[getQuizList] Constructed quizList:', quizList);

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizList),
    };
  } catch (error) {
    console.error('[getQuizList] Error reading quizzes directory or processing quiz files:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to list quizzes.', details: error.message }),
    };
  }
};
