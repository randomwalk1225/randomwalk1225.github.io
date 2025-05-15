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
    // console.log('Resolved quizzesDirPath:', quizzesDirPath); // For debugging on Netlify logs

    const entries = fs.readdirSync(quizzesDirPath, { withFileTypes: true });
    
    const quizDirectories = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => {
        // Optionally, check if a quiz.json exists in each directory
        const quizJsonPath = path.join(quizzesDirPath, name, 'quiz.json');
        return fs.existsSync(quizJsonPath);
      });

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizDirectories),
    };
  } catch (error) {
    console.error('Error reading quizzes directory:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to list quizzes.', details: error.message }),
    };
  }
};
