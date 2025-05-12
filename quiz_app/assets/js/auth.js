// Supabase 클라이언트 초기화
// 이 값들은 실제 운영 시에는 직접 코드에 넣기보다, 
// Jekyll의 _config.yml이나 다른 안전한 방식으로 관리하고 템플릿 변수로 주입하는 것이 좋습니다.
// 하지만 GitHub Pages에서는 JavaScript에서 직접 사용해야 하므로, 일단 여기에 명시합니다.
// (주의: anon key는 공개되어도 괜찮지만, service_role key는 절대 노출되면 안 됩니다.)

const SUPABASE_URL = 'https://bibzmyuipvijimliqgbg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYnpteXVpcHZpamltbGlxZ2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MjU5NjEsImV4cCI6MjA2MjUwMTk2MX0.JLq0RAJX9qwyky2qw0OGebrSJVFXhjcfd9uIrkC5IYc';

let supabase = null;
if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized.");
} else {
    console.error("Supabase client library not found. Make sure it's loaded before auth.js");
}

const authStatusContainer = document.getElementById('auth-status-container');

async function signInWithGitHub() {
    if (!supabase) return console.error('Supabase client not initialized.');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: window.location.origin + '/quiz_app/' // 인증 후 돌아올 기본 페이지 (퀴즈 목록)
        }
    });
    if (error) {
        console.error('Error signing in with GitHub:', error);
        alert(`GitHub 로그인 오류: ${error.message}`);
    } else {
        // 성공 시 Supabase가 GitHub 인증 페이지로 리다이렉트합니다.
        console.log('Redirecting to GitHub for authentication...');
    }
}

async function signOut() {
    if (!supabase) return console.error('Supabase client not initialized.');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        alert(`로그아웃 오류: ${error.message}`);
    } else {
        // 성공 시 onAuthStateChange가 트리거되어 UI가 업데이트됩니다.
        console.log('User signed out.');
        // 필요시 명시적으로 페이지 새로고침 또는 리다이렉트
        // window.location.reload(); 
    }
}

function updateAuthUI(user) {
    if (!authStatusContainer) return;

    if (user) {
        // 로그인 상태 UI
        const userEmail = user.email || '사용자';
        const userDisplayName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail;
        
        authStatusContainer.innerHTML = `
            <span style="margin-right: 10px;">환영합니다, ${userDisplayName}님!</span>
            <button id="logout-button">로그아웃</button>
        `;
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', signOut);
        }
    } else {
        // 로그아웃 상태 UI
        authStatusContainer.innerHTML = `
            <button id="login-github-button">GitHub으로 로그인</button>
        `;
        const loginButton = document.getElementById('login-github-button');
        if (loginButton) {
            loginButton.addEventListener('click', signInWithGitHub);
        }
    }
}

// 인증 상태 변경 감지
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        const user = session ? session.user : null;
        updateAuthUI(user);

        // 로그인/로그아웃 시 특정 페이지에서 필요한 추가 작업 수행
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
            // "나의 기록" 페이지에 있다면, 사용자 상태 변경에 따라 기록 다시 로드
            if (window.location.pathname.includes('/quiz_app/history.html')) {
                if (typeof loadUserHistory === 'function') {
                    console.log('Auth state changed on history page, reloading history for user:', user ? user.id : null);
                    loadUserHistory(user ? user.id : null);
                }
            }
            // 퀴즈 풀기 페이지에 있다면, 로그인 상태에 따라 UI 업데이트 (예: 비로그인 시 문제 숨기기 등)
            if (window.location.pathname.includes('/quiz_app/take.html')) {
                const quizContentEl = document.getElementById('quiz-content');
                const submitButton = document.getElementById('submit-quiz');
                if (!user) {
                    if (quizContentEl) quizContentEl.innerHTML = '<p>퀴즈를 보려면 먼저 <a href="#" onclick="signInWithGitHub(); return false;">로그인</a>해주세요.</p>';
                    if (submitButton) submitButton.style.display = 'none';
                } else {
                    // 이미 loadQuizData가 호출될 것이므로, 여기서는 특별한 처리가 필요 없을 수 있음.
                    // 단, 로그인 후 바로 퀴즈를 로드해야 한다면 여기서 loadQuizData 호출 고려.
                    // 현재는 quiz_player.js의 DOMContentLoaded에서 loadQuizData를 호출함.
                    if (submitButton) submitButton.style.display = 'inline-block';
                }
            }
        }
    });
}

// 초기 UI 업데이트 (페이지 로드 시 현재 로그인 상태 확인)
async function checkInitialAuth() {
    if (!supabase) return;
    const { data: { user } , error } = await supabase.auth.getUser();
    if (error && error.message !== 'No active session') { // "No active session"은 정상적인 비로그인 상태
        console.error("Error getting initial user state:", error);
    }
    updateAuthUI(user);
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM 로드 후 authStatusContainer가 확실히 존재하므로 여기서 초기 UI 업데이트 호출
    // 하지만 supabase 클라이언트가 비동기적으로 로드될 수 있으므로, 
    // supabase 초기화 확인 후 checkInitialAuth를 호출하는 것이 더 안전합니다.
    // 현재는 supabase 초기화가 동기적으로 시도되므로 바로 호출해도 괜찮을 수 있습니다.
    
    // 페이지 로드 시 초기 인증 상태 확인 및 UI 업데이트는 onAuthStateChange가 INITIAL_SESSION 이벤트를 통해 처리하므로,
    // checkInitialAuth를 명시적으로 여기서 또 호출할 필요는 없을 수 있습니다. 
    // 단, onAuthStateChange가 INITIAL_SESSION을 놓치는 경우를 대비해 두거나,
    // 또는 onAuthStateChange 핸들러가 DOMContentLoaded 이후에 설정될 경우를 대비해 checkInitialAuth를 유지할 수 있습니다.
    // 여기서는 onAuthStateChange가 INITIAL_SESSION을 잘 처리한다고 가정하고,
    // DOMContentLoaded 시점에는 authStatusContainer가 확실히 존재하므로 updateAuthUI(null)로 초기화만 합니다.
    if (authStatusContainer) {
        updateAuthUI(null); // 기본적으로 로그아웃 상태 UI로 시작
    }
    // 실제 초기 상태 로드는 onAuthStateChange의 INITIAL_SESSION 이벤트에 의존
    // 만약 INITIAL_SESSION 이벤트가 불안정하다면 checkInitialAuth()를 여기서 호출하는 것이 더 안전합니다.
    // 안전하게 가기 위해 checkInitialAuth() 호출을 유지하겠습니다.
    if (supabase) {
        checkInitialAuth();
    } else {
        setTimeout(() => {
            if (supabase) {
                checkInitialAuth();
            } else {
                console.error("Supabase client still not available after delay for checkInitialAuth.");
                if (authStatusContainer) authStatusContainer.innerHTML = '<span style="color:red;">인증 모듈 로드 실패</span>';
            }
        }, 500);
    }
});
