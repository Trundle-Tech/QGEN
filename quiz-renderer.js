/**
 * Quiz Renderer - Creates standalone HTML quiz file
 */

class QuizRenderer {
    constructor(questions) {
        this.questions = questions;
    }

    /**
     * Generate standalone HTML quiz file
     * @returns {string} Complete HTML document
     */
    render() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Quiz</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="quiz-container">
        <header class="quiz-header">
            <h1>Interactive Quiz</h1>
            <div class="quiz-progress">
                <span id="currentQuestion">1</span> / <span id="totalQuestions">${this.questions.length}</span>
            </div>
        </header>

        <main class="quiz-main">
            <div id="quizContent"></div>
        </main>

        <footer class="quiz-footer">
            <button id="prevBtn" class="btn-nav" onclick="previousQuestion()" disabled>Previous</button>
            <button id="nextBtn" class="btn-nav" onclick="nextQuestion()" disabled>Next</button>
        </footer>

        <div id="resultsModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div id="regularResults">
                    <h2>Quiz Complete!</h2>
                    <div class="score-display">
                        <div class="score-circle">
                            <svg class="progress-ring" width="150" height="150">
                                <circle class="progress-ring-bg" cx="75" cy="75" r="65" />
                                <circle class="progress-ring-fill" cx="75" cy="75" r="65" id="progressRingFill" />
                            </svg>
                            <div class="progress-ring-text">
                                <div class="score-fraction" id="scoreFraction">0/0</div>
                                <div class="score-percentage" id="scorePercentage">0%</div>
                            </div>
                        </div>
                    </div>
                    <div id="missedQuestionsList" class="missed-questions"></div>
                    <button onclick="reviewAnswers()" class="btn-primary" id="reviewBtn">Review Missed Questions</button>
                    <button onclick="retakeMissedQuestions()" class="btn-secondary" id="retakeBtn">Retake Missed Questions</button>
                </div>
                <div id="congratulationsScreen" style="display: none;">
                    <div class="congrats-icon">★</div>
                    <h2>Congratulations!</h2>
                    <p>You've achieved 100% mastery of this material!</p>
                    <div class="completion-stats">
                        <p>Total questions: <strong id="totalQuestionsCount">0</strong></p>
                        <p>Attempts to mastery: <strong id="retakeAttemptsCount">1</strong></p>
                    </div>
                    <button onclick="completeCourse()" class="btn-primary">Complete Course</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        ${this.getScript()}
    </script>
</body>
</html>`;
        return html;
    }

    /**
     * Generate CSS styles with theme colors
     * @returns {string} CSS styles
     */
    getStyles() {
        return `
        :root {
            /* shadcn/ui zinc theme variables */
            --background: 0 0% 100%;
            --foreground: 240 10% 3.9%;
            --card: 0 0% 100%;
            --card-foreground: 240 10% 3.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 240 10% 3.9%;
            --primary: 240 5.9% 10%;
            --primary-foreground: 0 0% 98%;
            --secondary: 240 4.8% 95.9%;
            --secondary-foreground: 240 5.9% 10%;
            --muted: 240 4.8% 95.9%;
            --muted-foreground: 240 3.8% 46.1%;
            --accent: 240 4.8% 95.9%;
            --accent-foreground: 240 5.9% 10%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 0 0% 98%;
            --border: 240 5.9% 90%;
            --input: 240 5.9% 90%;
            --ring: 240 5.9% 10%;
            --radius: 0.5rem;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: hsl(var(--background));
            min-height: 100vh;
            padding: 20px;
            color: hsl(var(--foreground));
        }

        .quiz-container {
            max-width: 800px;
            margin: 0 auto;
            background: hsl(var(--card));
            border-radius: calc(var(--radius) * 2);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid hsl(var(--border));
        }

        .quiz-header {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            padding: 30px;
            text-align: center;
        }

        .quiz-header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }

        .quiz-progress {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .quiz-main {
            padding: 40px;
            min-height: 400px;
        }

        .question-container {
            margin-bottom: 30px;
        }

        .question-number {
            color: hsl(var(--muted-foreground));
            font-weight: bold;
            font-size: 0.9em;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .question-text {
            font-size: 1.3em;
            margin-bottom: 25px;
            line-height: 1.5;
            color: hsl(var(--foreground));
        }

        .options-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .option {
            padding: 15px 20px;
            border: 2px solid hsl(var(--border));
            border-radius: var(--radius);
            cursor: pointer;
            transition: all 0.2s ease;
            background: hsl(var(--card));
            color: hsl(var(--card-foreground));
        }

        .option:hover {
            border-color: hsl(var(--ring));
            background: hsl(var(--accent));
        }

        .option.selected {
            border-color: hsl(var(--ring));
            background: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
        }

        .option.correct {
            border-color: #10b981;
            background: #d1fae5;
        }

        .option.incorrect {
            border-color: hsl(var(--destructive));
            background: hsl(var(--destructive) / 0.1);
        }

        .option.disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }

        .feedback {
            margin-top: 20px;
            padding: 15px;
            border-radius: var(--radius);
            display: none;
        }

        .feedback.show {
            display: block;
        }

        .feedback.correct {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #10b981;
        }

        .feedback.incorrect {
            background: hsl(var(--destructive) / 0.1);
            color: hsl(var(--destructive));
            border: 1px solid hsl(var(--destructive));
        }

        .feedback-icon {
            font-size: 1.5em;
            margin-right: 10px;
        }

        .explanation {
            margin-top: 10px;
            font-style: italic;
        }

        .quiz-footer {
            padding: 20px 40px;
            background: hsl(var(--muted));
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid hsl(var(--border));
        }

        .btn-nav, .btn-submit, .btn-primary, .btn-secondary {
            padding: 12px 24px;
            font-size: 1em;
            border: none;
            border-radius: var(--radius);
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
        }

        .btn-nav {
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
        }

        .btn-nav:hover:not(:disabled) {
            background: hsl(var(--secondary) / 0.8);
        }

        .btn-nav:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-submit {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }

        .btn-submit:hover:not(:disabled) {
            background: hsl(var(--primary) / 0.9);
        }

        .btn-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-primary {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            margin: 10px;
        }

        .btn-primary:hover {
            background: hsl(var(--primary) / 0.9);
        }

        .btn-secondary {
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            margin: 10px;
        }

        .btn-secondary:hover {
            background: hsl(var(--secondary) / 0.8);
        }

        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background: hsl(var(--card));
            padding: 40px;
            border-radius: calc(var(--radius) * 2);
            text-align: center;
            max-width: 500px;
            width: 90%;
            border: 1px solid hsl(var(--border));
        }

        .score-circle {
            position: relative;
            width: 150px;
            height: 150px;
            margin: 20px auto;
        }

        .progress-ring {
            transform: rotate(-90deg);
        }

        .progress-ring-bg {
            fill: none;
            stroke: hsl(var(--muted));
            stroke-width: 8;
        }

        .progress-ring-fill {
            fill: none;
            stroke: hsl(var(--primary));
            stroke-width: 8;
            stroke-linecap: round;
            stroke-dasharray: 408.4;
            stroke-dashoffset: 408.4;
            transition: stroke-dashoffset 1s ease-in-out;
        }

        .progress-ring-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .score-fraction {
            font-size: 1.8em;
            font-weight: bold;
            color: hsl(var(--foreground));
            line-height: 1;
        }

        .score-percentage {
            font-size: 1em;
            color: hsl(var(--muted-foreground));
            margin-top: 4px;
        }

        .review-mode .option.should-be-selected {
            border-color: #10b981;
        }

        .missed-questions {
            text-align: left;
            margin: 20px 0;
            max-height: 300px;
            overflow-y: auto;
        }

        .missed-questions h3 {
            margin-bottom: 10px;
            font-size: 1.1em;
            color: hsl(var(--foreground));
        }

        .missed-question-item {
            padding: 10px;
            margin: 8px 0;
            background: hsl(var(--destructive) / 0.1);
            border-left: 4px solid hsl(var(--destructive));
            border-radius: var(--radius);
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .missed-question-item:hover {
            background: hsl(var(--destructive) / 0.15);
        }

        .missed-question-number {
            font-weight: bold;
            color: hsl(var(--destructive));
            margin-bottom: 5px;
        }

        .missed-question-text {
            font-size: 0.95em;
            color: hsl(var(--foreground));
        }

        .reference-info {
            margin-top: 25px;
            border: 1px solid hsl(var(--border));
            border-radius: var(--radius);
            overflow: hidden;
        }

        .reference-header {
            background: hsl(var(--muted));
            padding: 12px 15px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s ease;
            user-select: none;
        }

        .reference-header:hover {
            background: hsl(var(--muted) / 0.8);
        }

        .reference-header span {
            font-weight: 500;
            color: hsl(var(--foreground));
        }

        .expand-icon {
            transition: transform 0.2s ease;
            font-size: 0.9em;
        }

        .expand-icon.expanded {
            transform: rotate(180deg);
        }

        .reference-content {
            padding: 15px;
            background: hsl(var(--card));
            border-top: 1px solid hsl(var(--border));
            line-height: 1.6;
            color: hsl(var(--foreground));
            display: none;
        }

        .reference-content.show {
            display: block;
            animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
            }
            to {
                opacity: 1;
                max-height: 500px;
            }
        }

        .congrats-icon {
            font-size: 5em;
            margin-bottom: 20px;
            animation: celebrate 0.6s ease-out;
        }

        @keyframes celebrate {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        #congratulationsScreen {
            text-align: center;
            padding: 20px;
        }

        #congratulationsScreen h2 {
            font-size: 2em;
            margin-bottom: 15px;
            color: hsl(var(--foreground));
        }

        #congratulationsScreen p {
            font-size: 1.1em;
            margin-bottom: 20px;
            color: hsl(var(--muted-foreground));
        }

        .completion-stats {
            background: hsl(var(--muted));
            padding: 20px;
            border-radius: var(--radius);
            margin: 20px 0;
        }

        .completion-stats p {
            margin: 10px 0;
            font-size: 1em;
            color: hsl(var(--foreground));
        }

        .completion-stats strong {
            color: hsl(var(--primary));
            font-size: 1.2em;
        }

        @media (max-width: 640px) {
            .quiz-main {
                padding: 20px;
            }

            .quiz-footer {
                padding: 15px 20px;
                flex-wrap: wrap;
                gap: 10px;
            }

            .btn-submit {
                order: -1;
                width: 100%;
            }
        }
        `;
    }

    /**
     * Generate JavaScript for quiz functionality
     * @returns {string} JavaScript code
     */
    getScript() {
        return `
        let questions = ${JSON.stringify(this.questions, null, 2)};
        let originalQuestions = JSON.parse(JSON.stringify(questions));
        let currentQuestionIndex = 0;
        let userAnswers = [];
        let isAnswered = false;
        let reviewMode = false;
        let missedQuestionIndices = [];
        let isRetakeMode = false;
        let retakeAttempt = 1;
        const totalOriginalQuestions = questions.length;

        // Initialize quiz
        document.addEventListener('DOMContentLoaded', () => {
            renderQuestion();
        });

        function renderQuestion() {
            const question = questions[currentQuestionIndex];
            const container = document.getElementById('quizContent');

            let html = '<div class="question-container">';
            html += '<div class="question-number">Question ' + (currentQuestionIndex + 1) + ' of ' + questions.length + '</div>';
            html += '<div class="question-text">' + question.question + '</div>';

            html += '<div class="options-container">';
            question.options.forEach((option, index) => {
                const letter = String.fromCharCode(65 + index);
                html += '<div class="option" data-value="' + letter + '" onclick="selectOption(this)">' + option + '</div>';
            });
            html += '</div>';

            // Add reference info section (hidden by default, shown in review mode for incorrect answers)
            html += '<div class="reference-info" id="referenceInfo" style="display: none;">';
            html += '  <div class="reference-header" onclick="toggleReference()">';
            html += '    <span>View Reference Information</span>';
            html += '    <span class="expand-icon" id="expandIcon">▼</span>';
            html += '  </div>';
            html += '  <div class="reference-content" id="referenceContent"></div>';
            html += '</div>';
            html += '</div>';

            container.innerHTML = html;

            // Update progress
            document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
            document.getElementById('totalQuestions').textContent = questions.length;

            // Update navigation buttons
            updateNavigationButtons();

            // Restore previous answer if it exists
            if (userAnswers[currentQuestionIndex]) {
                if (reviewMode) {
                    restoreAnswer();
                } else {
                    // In normal mode, just restore the selection without highlighting
                    restorePreviousSelection();
                }
            }
        }

        function restorePreviousSelection() {
            const saved = userAnswers[currentQuestionIndex];
            const question = questions[currentQuestionIndex];

            saved.answer.forEach(value => {
                const option = document.querySelector('.option[data-value="' + value + '"]');
                if (option) option.classList.add('selected');
            });
            checkAnswerSelected();
        }

        function selectOption(element) {
            if (isAnswered && !reviewMode) return;

            const question = questions[currentQuestionIndex];

            if (question.type === 'multiple-select') {
                // Toggle selection for multi-select
                element.classList.toggle('selected');
            } else {
                // Single selection (single-choice and true-false)
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                element.classList.add('selected');
            }

            // Enable next button when an answer is selected
            checkAnswerSelected();
        }

        function checkAnswerSelected() {
            const hasAnswer = document.querySelectorAll('.option.selected').length > 0;
            document.getElementById('nextBtn').disabled = !hasAnswer;
        }

        function saveCurrentAnswer() {
            const question = questions[currentQuestionIndex];
            let userAnswer;
            let isCorrect = false;

            const selected = Array.from(document.querySelectorAll('.option.selected'));
            userAnswer = selected.map(el => el.dataset.value);

            if (question.type === 'single-choice') {
                isCorrect = userAnswer[0] === question.correctAnswer;
            } else {
                const correctSet = new Set(question.correctAnswers);
                const userSet = new Set(userAnswer);
                isCorrect = correctSet.size === userSet.size &&
                            [...correctSet].every(ans => userSet.has(ans));
            }

            // Store answer
            userAnswers[currentQuestionIndex] = {
                answer: userAnswer,
                correct: isCorrect,
                question: question.question
            };
        }

        function nextQuestion() {
            // Save the current answer before moving
            if (!reviewMode) {
                saveCurrentAnswer();
            }

            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                isAnswered = false;
                renderQuestion();
            } else {
                // Save the last answer before showing results
                if (!reviewMode) {
                    saveCurrentAnswer();
                }
                showResults();
            }
        }

        function previousQuestion() {
            if (currentQuestionIndex > 0) {
                // Save current answer before going back if not in review mode
                if (!reviewMode && document.querySelectorAll('.option.selected').length > 0) {
                    saveCurrentAnswer();
                }
                currentQuestionIndex--;
                isAnswered = userAnswers[currentQuestionIndex] ? true : false;
                renderQuestion();
            }
        }

        function updateNavigationButtons() {
            document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;

            // Check if an answer is selected for the current question
            if (!reviewMode) {
                checkAnswerSelected();
            } else {
                // In review mode, always enable next button
                document.getElementById('nextBtn').disabled = false;
            }
        }

        function restoreAnswer() {
            const saved = userAnswers[currentQuestionIndex];
            const question = questions[currentQuestionIndex];

            saved.answer.forEach(value => {
                const option = document.querySelector('.option[data-value="' + value + '"]');
                if (option) {
                    option.classList.add('selected');
                    // Highlight correct selections in green, incorrect in red
                    if (saved.correct) {
                        option.classList.add('correct');
                    } else {
                        option.classList.add('incorrect');
                    }
                }
            });
            document.querySelectorAll('.option').forEach(opt => opt.classList.add('disabled'));

            // Show reference info for incorrect answers
            if (!saved.correct && question.referenceInfo) {
                showReferenceInfo(question.referenceInfo);
            }

            isAnswered = true;
            updateNavigationButtons();
        }

        function showResults() {
            const correctCount = userAnswers.filter(a => a.correct).length;
            const incorrectCount = questions.length - correctCount;
            const percentage = Math.round((correctCount / questions.length) * 100);

            // Check if 100% achieved
            if (percentage === 100) {
                showCongratulations();
            } else {
                showRegularResults(correctCount, incorrectCount, percentage);
            }

            document.getElementById('resultsModal').style.display = 'flex';
        }

        function showRegularResults(correctCount, incorrectCount, percentage) {
            document.getElementById('regularResults').style.display = 'block';
            document.getElementById('congratulationsScreen').style.display = 'none';

            // Update score fraction and percentage
            document.getElementById('scoreFraction').textContent = correctCount + '/' + questions.length;
            document.getElementById('scorePercentage').textContent = percentage + '%';

            // Animate progress ring
            const circumference = 2 * Math.PI * 65;
            const offset = circumference - (percentage / 100) * circumference;
            const progressRingFill = document.getElementById('progressRingFill');

            // Reset and animate
            progressRingFill.style.strokeDashoffset = circumference;
            setTimeout(() => {
                progressRingFill.style.strokeDashoffset = offset;
            }, 100);

            // Show missed questions list
            const missedList = document.getElementById('missedQuestionsList');
            let html = '<h3>Missed Questions (' + incorrectCount + '):</h3>';
            userAnswers.forEach((answer, index) => {
                if (!answer.correct) {
                    html += '<div class="missed-question-item" onclick="jumpToQuestion(' + index + ')">';
                    html += '<div class="missed-question-number">Question ' + (index + 1) + '</div>';
                    html += '<div class="missed-question-text">' + answer.question + '</div>';
                    html += '</div>';
                }
            });
            missedList.innerHTML = html;
        }

        function showCongratulations() {
            document.getElementById('regularResults').style.display = 'none';
            document.getElementById('congratulationsScreen').style.display = 'block';

            document.getElementById('totalQuestionsCount').textContent = totalOriginalQuestions;
            document.getElementById('retakeAttemptsCount').textContent = retakeAttempt;
        }

        function jumpToQuestion(index) {
            reviewMode = true;
            currentQuestionIndex = index;
            document.getElementById('resultsModal').style.display = 'none';
            renderQuestion();
        }

        function reviewAnswers() {
            reviewMode = true;

            // Filter to only missed questions
            missedQuestionIndices = [];
            userAnswers.forEach((answer, index) => {
                if (!answer.correct) {
                    // If in retake mode, get the original index from the question
                    if (isRetakeMode && questions[index].originalIndex !== undefined) {
                        missedQuestionIndices.push(questions[index].originalIndex);
                    } else {
                        missedQuestionIndices.push(index);
                    }
                }
            });

            // Create filtered questions array with only missed questions
            const missedQuestions = missedQuestionIndices.map(originalIndex => {
                const q = JSON.parse(JSON.stringify(originalQuestions[originalIndex]));
                q.originalIndex = originalIndex;
                return q;
            });

            // Store the original user answers before filtering
            const originalUserAnswers = [...userAnswers];

            // Create filtered userAnswers array matching the missed questions
            const missedAnswers = [];
            userAnswers.forEach((answer, index) => {
                if (!answer.correct) {
                    missedAnswers.push(answer);
                }
            });

            questions = missedQuestions;
            userAnswers = missedAnswers;

            currentQuestionIndex = 0;
            document.getElementById('resultsModal').style.display = 'none';
            renderQuestion();
        }

        function retakeMissedQuestions() {
            // Get indices of missed questions from current attempt
            missedQuestionIndices = [];
            userAnswers.forEach((answer, index) => {
                if (!answer.correct) {
                    missedQuestionIndices.push(index);
                }
            });

            // If in retake mode, map back to original question indices
            if (isRetakeMode) {
                const originalIndices = missedQuestionIndices.map(index => {
                    return questions[index].originalIndex || index;
                });
                missedQuestionIndices = originalIndices;
            }

            // Create new questions array with only missed questions
            questions = missedQuestionIndices.map((originalIndex, newIndex) => {
                const q = JSON.parse(JSON.stringify(originalQuestions[originalIndex]));
                q.originalIndex = originalIndex;
                return q;
            });

            // Reset state for retake
            currentQuestionIndex = 0;
            userAnswers = [];
            isAnswered = false;
            isRetakeMode = true;
            retakeAttempt++;
            reviewMode = false;

            // Close modal and start retake
            document.getElementById('resultsModal').style.display = 'none';
            renderQuestion();
        }

        function completeCourse() {
            // Send completion messages to parent window (LMS/Rise360)
            window.parent.postMessage({ type: 'complete' }, '*');
            window.parent.postMessage({
                type: 'lesson-complete',
                status: 'completed'
            }, '*');

            // Close modal
            document.getElementById('resultsModal').style.display = 'none';

            // Show success message on page (non-blocking)
            document.querySelector('.quiz-container').innerHTML =
                '<div style="padding: 60px; text-align: center;">' +
                '<div style="font-size: 3em; margin-bottom: 20px; animation: celebrate 0.6s ease-out; font-weight: bold;">★ COMPLETE ★</div>' +
                '<h1 style="color: #10b981; margin-bottom: 20px; font-size: 2.5em;">Congratulations!</h1>' +
                '<p style="font-size: 1.3em; margin-bottom: 15px; color: hsl(var(--foreground));">You have completed the quiz with 100% mastery.</p>' +
                '<p style="font-size: 1.1em; color: hsl(var(--muted-foreground));">This lesson is now complete. You may proceed to the next lesson.</p>' +
                '</div>';
        }

        function showReferenceInfo(referenceText) {
            const refInfo = document.getElementById('referenceInfo');
            const refContent = document.getElementById('referenceContent');

            if (refInfo && refContent) {
                refContent.textContent = referenceText;
                refInfo.style.display = 'block';
            }
        }

        function toggleReference() {
            const refContent = document.getElementById('referenceContent');
            const expandIcon = document.getElementById('expandIcon');

            if (refContent && expandIcon) {
                if (refContent.classList.contains('show')) {
                    refContent.classList.remove('show');
                    expandIcon.classList.remove('expanded');
                    refContent.style.display = 'none';
                } else {
                    refContent.classList.add('show');
                    expandIcon.classList.add('expanded');
                    refContent.style.display = 'block';
                }
            }
        }
        `;
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizRenderer;
}
