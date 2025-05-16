// netlify/functions/getQuizList.js - Simplified version
const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    // Path assuming 'quizzes' is at the project root, relative to 'netlify/functions/'
    // This path should be correct given `included_files = ["quizzes/**"]` in netlify.toml
    // makes the quizzes directory available to the function.
    const quizzesDir = path.join(__dirname, '../../quizzes');

    // Check if quizzesDir exists (basic check)
    if (!fs.existsSync(quizzesDir)) {
      console.error(`Simplified: Quizzes directory does not exist at resolved path: ${quizzesDir}. __dirname: ${__dirname}`);
      // Attempting an alternative path often seen with included_files if LAMBDA_TASK_ROOT is reliable
      const alternativeQuizzesDir = path.join(process.env.LAMBDA_TASK_ROOT || __dirname, 'quizzes');
      if (fs.existsSync(alternativeQuizzesDir)) {
         console.log(`Simplified: Found quizzes at alternative path: ${alternativeQuizzesDir}`);
         // quizzesDir = alternativeQuizzesDir; // Uncomment if you want to proceed with this path
         // For now, let's stick to the error for the primary path to see logs.
         throw new Error(`Primary quizzes directory not found: ${quizzesDir}. Alternative path ${alternativeQuizzesDir} exists but not used yet.`);
      } else {
        console.error(`Simplified: Alternative quizzes directory also not found: ${alternativeQuizzesDir}`);
        throw new Error(`Quizzes directory not found at ${quizzesDir} or ${alternativeQuizzesDir}. LAMBDA_TASK_ROOT: ${process.env.LAMBDA_TASK_ROOT}, __dirname: ${__dirname}`);
      }
    }

    const quizFolders = fs.readdirSync(quizzesDir)
      .filter(name => {
        try {
          return fs.statSync(path.join(quizzesDir, name)).isDirectory();
        } catch (statErr) {
          console.warn(`Simplified: Could not stat item ${name} in ${quizzesDir}:`, statErr.message);
          return false;
        }
      });

    if (quizFolders.length === 0) {
      console.warn(`Simplified: No quiz sub-folders found in ${quizzesDir}.`);
    }

    const quizzes = quizFolders.map(folderName => {
      const quizJsonPath = path.join(quizzesDir, folderName, 'quiz.json');
      try {
        const raw = fs.readFileSync(quizJsonPath, 'utf-8');
        const quiz = JSON.parse(raw);
        // Temporarily omitting dynamic creationDate
        return quiz; 
      } catch (mapErr) {
        console.error(`Simplified: Error processing quiz.json in folder ${folderName}:`, mapErr.message);
        return null; // Or handle more gracefully
      }
    }).filter(quiz => quiz !== null); // Filter out any nulls from errors

    // Sort by title
    quizzes.sort((a, b) => {
      const titleA = a.title || "";
      const titleB = b.title || "";
      return titleA.localeCompare(titleB);
    });

    return {
      statusCode: 200,
      body: JSON.stringify(quizzes)
    };

  } catch (err) {
    console.error("Simplified: Error in getQuizList function:", err.message);
    console.error("Simplified: Full error object:", err); // Log the full error object
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to get quiz list (simplified version).",
        details: err.message
      })
    };
  }
};
