/**
 * MathHub Grading System
 * - Click to grade (correct/wrong instant feedback)
 * - localStorage persistence (survives refresh, restorable)
 * - Score summary with progress bar
 * - Reset (retry) functionality
 */
const MathGrading = {
    _pageKey: null,

    init() {
        const questions = document.querySelectorAll('.quiz-question');
        if (!questions.length) return;

        this._pageKey = 'grading_' + location.pathname.replace(/[^a-z0-9]/gi, '_');

        const saved = this._load();

        questions.forEach(qEl => {
            const qId = qEl.dataset.id;
            const radios = qEl.querySelectorAll('input[type="radio"]');

            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (qEl.classList.contains('answered')) return;
                    this._gradeQuestion(qEl, radio.value);
                });
            });

            // Restore saved answers
            if (saved && saved.answers && saved.answers[qId]) {
                const savedVal = saved.answers[qId];
                const targetRadio = qEl.querySelector(`input[value="${savedVal}"]`);
                if (targetRadio) {
                    targetRadio.checked = true;
                    this._gradeQuestion(qEl, savedVal, true);
                }
            }
        });

        this._updateSummary();
    },

    _gradeQuestion(qEl, selectedValue, isRestore) {
        const correctAnswer = qEl.dataset.answer;
        const isCorrect = selectedValue === correctAnswer;
        const feedbackEl = qEl.querySelector('.quiz-feedback');
        const explanationEl = qEl.querySelector('.quiz-explanation');
        const labels = qEl.querySelectorAll('.quiz-options label');

        // Mark as answered
        qEl.classList.add('answered');
        qEl.classList.add(isCorrect ? 'answered-correct' : 'answered-wrong');

        // Disable all radios
        qEl.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);

        // Highlight selected and correct
        labels.forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio.value === selectedValue && isCorrect) {
                label.classList.add('selected-correct');
            } else if (radio.value === selectedValue && !isCorrect) {
                label.classList.add('selected-wrong');
            }
            if (radio.value === correctAnswer && !isCorrect) {
                label.classList.add('correct-answer');
            }
        });

        // Show feedback
        if (feedbackEl) {
            const circled = ['\u2460','\u2461','\u2462','\u2463','\u2464'];
            const correctNum = circled[parseInt(correctAnswer) - 1] || correctAnswer;

            if (isCorrect) {
                feedbackEl.textContent = '\u2714 \uc815\ub2f5\uc785\ub2c8\ub2e4!';
                feedbackEl.className = 'quiz-feedback show correct';
            } else {
                feedbackEl.textContent = '\u2718 \uc624\ub2f5\uc785\ub2c8\ub2e4. \uc815\ub2f5: ' + correctNum;
                feedbackEl.className = 'quiz-feedback show wrong';
            }
        }

        // Show explanation if exists
        if (explanationEl) {
            explanationEl.classList.add('show');
        }

        // Save to localStorage
        if (!isRestore) {
            this._saveAnswer(qEl.dataset.id, selectedValue);
            this._updateSummary();
        }
    },

    _saveAnswer(qId, value) {
        const data = this._load() || { answers: {}, score: { correct: 0, total: 0 }, timestamp: '' };
        data.answers[qId] = value;

        // Recalculate score
        const questions = document.querySelectorAll('.quiz-question');
        let correct = 0;
        let total = 0;
        questions.forEach(q => {
            if (q.classList.contains('answered')) {
                total++;
                if (q.classList.contains('answered-correct')) correct++;
            }
        });
        data.score = { correct, total };
        data.timestamp = new Date().toISOString();

        this._save(data);
    },

    _updateSummary() {
        const summaryEl = document.querySelector('.quiz-summary');
        if (!summaryEl) return;

        const questions = document.querySelectorAll('.quiz-question');
        const totalQuestions = questions.length;
        let answered = 0;
        let correct = 0;

        questions.forEach(q => {
            if (q.classList.contains('answered')) {
                answered++;
                if (q.classList.contains('answered-correct')) correct++;
            }
        });

        if (answered === 0) {
            summaryEl.classList.remove('show');
            return;
        }

        summaryEl.classList.add('show');

        const pct = Math.round((correct / totalQuestions) * 100);
        let barClass = 'progress-fill';
        if (pct < 40) barClass += ' low';
        else if (pct < 70) barClass += ' mid';

        summaryEl.innerHTML = `
            <div class="score-label">${answered}/${totalQuestions} \ubb38\uc81c \ud480\uc774 \uc644\ub8cc</div>
            <div class="score-display">
                <span class="score-correct">${correct}</span>
                <span class="score-total"> / ${totalQuestions}</span>
            </div>
            <div class="quiz-progress">
                <div class="${barClass}" style="width: ${pct}%"></div>
            </div>
            <div class="score-label">\uc815\ub2f5\ub960 ${pct}%</div>
            <div class="quiz-actions">
                <button class="quiz-btn quiz-btn-reset" onclick="MathGrading.reset()">\ub2e4\uc2dc \ud480\uae30</button>
                <a href="https://web-production-d0d3e.up.railway.app/" target="_blank" class="quiz-btn quiz-btn-primary">\ubb38\uc81c\uc740\ud589\uc5d0\uc11c \ub354 \ud480\uae30 \u2192</a>
            </div>
        `;
    },

    reset() {
        localStorage.removeItem(this._pageKey);

        document.querySelectorAll('.quiz-question').forEach(qEl => {
            qEl.classList.remove('answered', 'answered-correct', 'answered-wrong');
            qEl.querySelectorAll('input[type="radio"]').forEach(r => {
                r.checked = false;
                r.disabled = false;
            });
            qEl.querySelectorAll('label').forEach(l => {
                l.classList.remove('selected-correct', 'selected-wrong', 'correct-answer');
            });
            const fb = qEl.querySelector('.quiz-feedback');
            if (fb) { fb.className = 'quiz-feedback'; fb.textContent = ''; }
            const ex = qEl.querySelector('.quiz-explanation');
            if (ex) { ex.classList.remove('show'); }
        });

        const summaryEl = document.querySelector('.quiz-summary');
        if (summaryEl) { summaryEl.classList.remove('show'); summaryEl.innerHTML = ''; }
    },

    _save(data) {
        try { localStorage.setItem(this._pageKey, JSON.stringify(data)); } catch(e) {}
    },

    _load() {
        try {
            const raw = localStorage.getItem(this._pageKey);
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    }
};

document.addEventListener('DOMContentLoaded', () => MathGrading.init());
