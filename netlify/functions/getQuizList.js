// netlify/functions/getQuizList.js - Basic Reconstructed Version
const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  let quizzesDir;
  const primaryPath = path.join(process.env.LAMBDA_TASK_ROOT || '.', 'quizzes');
  const fallbackPath = path.join(__dirname, '../../quizzes');

  console.log(`[getQuizList] LAMBDA_TASK_ROOT: ${process.env.LAMBDA_TASK_ROOT}`);
  console.log(`[getQuizList] __dirname: ${__dirname}`);
  console.log(`[getQuizList] Attempting primary path: ${primaryPath}`);

  if (process.env.LAMBDA_TASK_ROOT && fs.existsSync(primaryPath)) {
    quizzesDir = primaryPath;
    console.log(`[getQuizList] Using primary path: ${quizzesDir}`);
  } else {
    console.warn(`[getQuizList] Primary path ${primaryPath} not found or LAMBDA_TASK_ROOT not set. Attempting fallback path: ${fallbackPath}`);
    if (fs.existsSync(fallbackPath)) {
      quizzesDir = fallbackPath;
      console.log(`[getQuizList] Using fallback path: ${quizzesDir}`);
    } else {
      console.error(`[getQuizList] Fallback path ${fallbackPath} also not found.`);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({
          error: "Quizzes directory not found.",
          details: `Tried primary: ${primaryPath}, fallback: ${fallbackPath}`,
          debug_LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT,
          debug_dirname: __dirname
        })
      };
    }
  }

  try {
    const quizFolders = fs.readdirSync(quizzesDir)
      .filter(name => {
        try {
          return fs.statSync(path.join(quizzesDir, name)).isDirectory();
        } catch (e) {
          console.warn(`[getQuizList] Error stating file/folder ${name}: ${e.message}`);
          return false;
        }
      });

    if (quizFolders.length === 0) {
      console.warn(`[getQuizList] No quiz sub-folders found in ${quizzesDir}.`);
    }

    const quizzes = quizFolders.map(folderName => {
      const quizJsonPath = path.join(quizzesDir, folderName, 'quiz.json');
      try {
        const raw = fs.readFileSync(quizJsonPath, 'utf-8');
        const quizData = JSON.parse(raw);
        
        // Use creationDate from quiz.json if it exists, otherwise default to empty string
        const creationDate = quizData.creationDate || ""; 

        return {
          id: folderName, // Use the folder name as the quiz ID
          title: quizData.title || folderName, // Fallback title to folderName
          ...quizData, // Spread other properties from quiz.json
          creationDate // Ensure this field is part of the returned object
        };
      } catch (e) {
        console.error(`[getQuizList] Error processing ${quizJsonPath}: ${e.message}`);
        return null;
      }
    }).filter(quiz => quiz !== null);

    quizzes.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(quizzes)
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
        debug_quizzesDir: quizzesDir, // Log the quizzesDir that was attempted
        debug_LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT,
        debug_dirname: __dirname,
        debug_stack: err.stack // Include stack trace for more detailed error
      })
    };
  }
};
