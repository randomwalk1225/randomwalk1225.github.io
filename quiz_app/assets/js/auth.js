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
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            // 예: history 페이지에서 사용자 ID에 따라 기록 다시 로드
            if (typeof loadUserHistory === 'function' && document.getElementById('userIdHistory')) {
                 // ID 입력란이 있다면, 로그인된 사용자의 ID로 자동 조회하거나, 
                 // 로그아웃 시 목록을 비우는 등의 처리를 할 수 있습니다.
                 // 지금은 ID 입력란을 제거할 예정이므로, 로그인된 사용자의 ID로 바로 조회하도록 수정 필요.
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
    if (supabase) {
        checkInitialAuth();
    } else {
        // Supabase CDN이 아직 로드되지 않았을 수 있으므로, 약간의 지연 후 재시도
        setTimeout(() => {
            if (supabase) {
                checkInitialAuth();
            } else {
                console.error("Supabase client still not available after delay.");
                if (authStatusContainer) authStatusContainer.innerHTML = '<span style="color:red;">인증 모듈 로드 실패</span>';
            }
        }, 500);
    }
});
