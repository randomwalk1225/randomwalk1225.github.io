const fs = require('fs');
const path = require('path');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://randomwalk1225.github.io', // Adjust to your GitHub Pages URL or '*' for local testing
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

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
    const quizzesDirPath = path.resolve(__dirname, '../../quizzes');
    // console.log('[getQuizList] Resolved quizzesDirPath:', quizzesDirPath);

    let entries = [];
    try {
      entries = fs.readdirSync(quizzesDirPath, { withFileTypes: true });
      // console.log('[getQuizList] Entries in quizzesDirPath:', entries.map(e => e.name));
    } catch (readDirError) {
      console.error('[getQuizList] Error reading quizzesDirPath:', quizzesDirPath, readDirError);
      throw readDirError;
    }
    
    const quizList = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const quizId = dirent.name;
        const quizJsonPath = path.join(quizzesDirPath, quizId, 'quiz.json');
        
        // Defaults
        let quizTitle = quizId;
        let coverImageUrl = null; // Default to null, frontend will handle placeholder
        let description = null;   // Default to null, frontend will not display if null
        let creationDate = null;
        let isFavorite = false;
        let commentsCount = 0;
        let likesCount = 0;
        let isLiked = false;

        // Attempt to parse date from quizId (e.g., quizName-YYYYMMDD or YYYYMMDD)
        const dateMatch = quizId.match(/(\d{4})(\d{2})(\d{2})$/);
        if (dateMatch) {
          creationDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        if (fs.existsSync(quizJsonPath)) {
          try {
            let quizJsonContent = fs.readFileSync(quizJsonPath, 'utf-8');
            const frontMatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
            const cleanedJsonContent = quizJsonContent.replace(frontMatterPattern, '');
            const quizData = JSON.parse(cleanedJsonContent);

            // Extract Title
            if (quizData && typeof quizData.title === 'string' && quizData.title.trim() !== '') {
              quizTitle = quizData.title.trim();
            } else if (Array.isArray(quizData) && quizData.length > 0 && quizData[0] && typeof quizData[0].title === 'string' && quizData[0].title.trim() !== '') {
              quizTitle = quizData[0].title.trim(); // Fallback for old format
            }

            // Extract Cover Image URL
            if (quizData && typeof quizData.coverImageUrl === 'string' && quizData.coverImageUrl.trim() !== '') {
              coverImageUrl = quizData.coverImageUrl.trim();
              // Ensure it starts with a slash if it's meant to be from root and not an absolute URL
              if (!coverImageUrl.startsWith('/') && !coverImageUrl.startsWith('http')) {
                  coverImageUrl = '/' + coverImageUrl;
              }
            }
            
            // Extract Description
            if (quizData && typeof quizData.description === 'string' && quizData.description.trim() !== '') {
              description = quizData.description.trim();
            }

            // Extract Interaction Fields
            if (quizData && quizData.isFavorite !== undefined) isFavorite = quizData.isFavorite;
            if (quizData && quizData.commentsCount !== undefined) commentsCount = Number(quizData.commentsCount);
            if (quizData && quizData.likesCount !== undefined) likesCount = Number(quizData.likesCount);
            if (quizData && quizData.isLiked !== undefined) isLiked = quizData.isLiked;
            
            // Fallback for creationDate if not parsed from quizId
            if (!creationDate) {
              try {
                const stats = fs.statSync(quizJsonPath);
                creationDate = formatDate(stats.mtime); // Use last modified time
              } catch (statError) {
                // console.error(`[getQuizList] Error getting file stats for ${quizJsonPath}:`, statError);
                creationDate = 'N/A'; // Fallback if stat fails
              }
            }

          } catch (parseError) {
            console.error(`[getQuizList] Error parsing quiz.json for ${quizId}:`, parseError);
            if (!creationDate) creationDate = 'N/A'; // Ensure creationDate has a fallback
          }
        } else {
          // console.log(`[getQuizList] No quiz.json found for ${quizId}, using defaults.`);
          if (!creationDate) creationDate = 'N/A'; // Ensure creationDate has a fallback
        }
        
        return { 
          id: String(quizId), 
          title: String(quizTitle),
          coverImageUrl: coverImageUrl, // Can be null
          description: description,     // Can be null
          creationDate: String(creationDate),
          isFavorite: isFavorite,
          commentsCount: commentsCount,
          likesCount: likesCount,
          isLiked: isLiked
        };
      });
    
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizList),
    };
  } catch (error) {
    console.error('[getQuizList] Error processing quizzes:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to list quizzes.', details: error.message }),
    };
  }
};
