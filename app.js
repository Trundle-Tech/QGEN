/**
 * Main Application Controller
 */

// Global state
let parser = null;
let generator = null;
let parsedData = null;
let generatedQuestions = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const questionCount = document.getElementById('questionCount');

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Question count slider
    questionCount.addEventListener('input', (e) => {
        document.getElementById('questionCountValue').textContent = e.target.value;
    });

    // Toggle buttons for question types
    const toggleButtons = document.querySelectorAll('.toggle-button');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
        });
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

/**
 * Process uploaded file
 */
async function handleFile(file) {
    // Validate file type
    if (!file.name.endsWith('.xlf')) {
        showError('Please upload a valid .xlf file');
        return;
    }

    try {
        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';

        // Parse file
        parser = new XLFParser();
        parsedData = await parser.parse(file);

        console.log('Parsed data:', parsedData);

        // Show config section
        document.getElementById('configSection').style.display = 'block';

    } catch (error) {
        console.error('Parse error:', error);
        showError('Failed to parse XLF file: ' + error.message);
        resetUpload();
    }
}

/**
 * Generate quiz
 */
async function generateQuiz() {
    if (!parsedData) {
        showError('Please upload a file first');
        return;
    }

    // Get configuration
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const selectedTypes = getSelectedQuestionTypes();

    if (selectedTypes.length === 0) {
        showError('Please select at least one question type');
        return;
    }

    // Show loading
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

    try {
        // Get content as text
        const content = parser.getAllContentAsText();

        // Generate questions in batches of 10
        generator = new QuizGenerator();
        generatedQuestions = [];

        const batchSize = 10;
        const numBatches = Math.ceil(questionCount / batchSize);

        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(batchSize, questionCount - (batch * batchSize));
            const questionsGenerated = batch * batchSize;

            // Update progress
            updateProgress(questionsGenerated, questionCount, `Generating questions ${questionsGenerated + 1}-${questionsGenerated + currentBatchSize}...`);

            // Generate batch
            const batchQuestions = await generator.generateQuestions(content, currentBatchSize, selectedTypes);

            // Add to accumulated questions
            generatedQuestions.push(...batchQuestions);

            // Update progress after batch completes
            updateProgress(generatedQuestions.length, questionCount, `Generated ${generatedQuestions.length} of ${questionCount} questions`);

            // Update preview with all questions so far
            renderQuestionPreview(generatedQuestions);
        }

        console.log('All questions generated:', generatedQuestions);

        // Show success
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';

        // Display question count
        document.getElementById('questionCountDisplay').textContent = generatedQuestions.length;

        // Final preview render
        renderQuestionPreview(generatedQuestions);

        // Setup download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = downloadQuiz;

        // Setup edit button
        const editBtn = document.getElementById('editBtn');
        editBtn.onclick = () => {
            alert('Question editing feature coming soon!');
        };

    } catch (error) {
        console.error('Generation error:', error);
        document.getElementById('loadingIndicator').style.display = 'none';
        showError('Failed to generate quiz: ' + error.message);
    }
}

/**
 * Get selected question types
 */
function getSelectedQuestionTypes() {
    const activeButtons = document.querySelectorAll('.toggle-button.active');
    return Array.from(activeButtons).map(btn => btn.dataset.type);
}

/**
 * Update progress indicator
 */
function updateProgress(current, total, message) {
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = message || `Generating questions ${current}/${total}...`;
    }
}

/**
 * Download generated quiz
 */
function downloadQuiz() {
    if (!generatedQuestions) {
        showError('No quiz to download');
        return;
    }

    try {
        // Create renderer
        const renderer = new QuizRenderer(generatedQuestions);
        const html = renderer.render();

        // Create blob and download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz_' + new Date().getTime() + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Download error:', error);
        showError('Failed to download quiz: ' + error.message);
    }
}

/**
 * Show error message
 */
function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    resultsSection.style.display = 'block';
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;

    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide error message
 */
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
}

/**
 * Reset upload section
 */
function resetUpload() {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('configSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';

    parser = null;
    parsedData = null;
    generatedQuestions = null;
}

/**
 * Render question preview
 */
function renderQuestionPreview(questions) {
    const container = document.getElementById('questionsList');
    container.innerHTML = '';

    questions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';

        // Question type badge
        const typeBadge = document.createElement('div');
        typeBadge.className = `type-badge type-${question.type}`;
        typeBadge.textContent = getQuestionTypeLabel(question.type);

        // Question number and text
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header';
        questionHeader.innerHTML = `<strong>Question ${index + 1}:</strong> ${question.question}`;

        // Options list
        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        if (question.options) {
            question.options.forEach((option, optIndex) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-preview';

                // Check if this option is correct
                const letter = String.fromCharCode(65 + optIndex);
                const isCorrect = question.correctAnswer === letter ||
                                  (question.correctAnswers && question.correctAnswers.includes(letter));

                if (isCorrect) {
                    optionDiv.classList.add('correct-option');
                }

                optionDiv.textContent = option;
                optionsList.appendChild(optionDiv);
            });
        }

        // Explanation preview
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation-preview';
        explanationDiv.innerHTML = `<strong>Explanation:</strong> ${question.explanation || 'N/A'}`;

        // Assemble card
        questionCard.appendChild(typeBadge);
        questionCard.appendChild(questionHeader);
        questionCard.appendChild(optionsList);
        questionCard.appendChild(explanationDiv);

        container.appendChild(questionCard);
    });
}

/**
 * Get human-readable question type label
 */
function getQuestionTypeLabel(type) {
    const labels = {
        'single-choice': 'Single Choice',
        'multiple-select': 'Multiple Select',
        'true-false': 'True/False'
    };
    return labels[type] || type;
}

/**
 * Reset everything
 */
function resetAll() {
    resetUpload();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
