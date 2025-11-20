/**
 * Quiz Generator - Uses Claude API to generate quiz questions
 */

class QuizGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiEndpoint = '/api/generate';
        this.model = 'claude-haiku-3-5';
    }

    /**
     * Generate quiz questions from content
     * @param {string} content - Extracted text content from XLF
     * @param {number} questionCount - Number of questions to generate
     * @param {Array<string>} questionTypes - Selected question types
     * @returns {Promise<Array>} Generated questions
     */
    async generateQuestions(content, questionCount, questionTypes) {
        const prompt = this.buildPrompt(content, questionCount, questionTypes);

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4096,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                // Handle timeout errors
                if (response.status === 504) {
                    throw new Error('Request timeout. The app generates 1 question at a time, but this request took too long. Try reducing total question count or check your internet connection.');
                }

                // Try to parse error response
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) {
                    // If error response isn't JSON, use statusText
                }

                throw new Error(`API Error (${response.status}): ${errorMessage}`);
            }

            // Parse successful response
            const data = await response.json();
            const responseText = data.content[0].text;

            // Parse JSON response
            return this.parseQuestions(responseText);

        } catch (error) {
            console.error('Quiz generation error:', error);
            throw error;
        }
    }

    /**
     * Build the prompt for Claude API
     * @param {string} content - Course content
     * @param {number} questionCount - Number of questions
     * @param {Array<string>} questionTypes - Question types
     * @returns {string} Formatted prompt
     */
    buildPrompt(content, questionCount, questionTypes) {
        const typesDescription = this.getTypesDescription(questionTypes);

        return `You are an expert quiz creator. Based on the following course content, generate ${questionCount} quiz questions.

COURSE CONTENT:
${content}

QUESTION TYPES TO INCLUDE:
${typesDescription}

REQUIREMENTS:
1. Distribute questions intelligently across the selected question types
2. Questions should test understanding of key concepts from the content
3. Ensure questions are clear and unambiguous
4. For single choice: provide 4 options (A, B, C, D) with exactly 1 correct answer
5. For multiple select: provide 4-6 options with 2-4 correct answers (select all that apply)
6. For true/false: provide 2 options (A) True, B) False) with the correct answer
7. Include explanations for correct answers
8. Include detailed reference information for each question:
   - Provide 2-4 sentences explaining the concept being tested
   - Include context from the course material
   - Give enough information for the learner to understand and answer correctly on a retake
   - Make it educational and focused on mastery learning

IMPORTANT: Respond ONLY with a valid JSON array in this exact format:
[
    {
        "type": "single-choice",
        "question": "Question text here?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correctAnswer": "A",
        "explanation": "Explanation of why this is correct",
        "referenceInfo": "Detailed 2-4 sentence explanation of the concept from the course material that helps the learner understand this topic."
    },
    {
        "type": "multiple-select",
        "question": "Select all that apply: Question text here?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4", "E) Option 5", "F) Option 6"],
        "correctAnswers": ["A", "C", "E"],
        "explanation": "Explanation of why these options are correct",
        "referenceInfo": "Detailed 2-4 sentence explanation of the concept from the course material that helps the learner understand this topic."
    },
    {
        "type": "true-false",
        "question": "Statement to evaluate as true or false",
        "options": ["A) True", "B) False"],
        "correctAnswer": "A",
        "explanation": "Explanation of why this is true/false",
        "referenceInfo": "Detailed 2-4 sentence explanation of the concept from the course material that helps the learner understand this topic."
    }
]

Do not include any text before or after the JSON array. Only return valid JSON.`;
    }

    /**
     * Get description of question types for the prompt
     * @param {Array<string>} questionTypes - Selected question types
     * @returns {string} Formatted description
     */
    getTypesDescription(questionTypes) {
        const descriptions = {
            'single-choice': 'Single Choice: One correct answer from multiple options',
            'multiple-select': 'Multiple Select: Select all that apply - 2-4 correct answers from 4-6 options',
            'true-false': 'True/False: Simple true or false questions',
            'randomized': 'Randomized: Mix of all question types'
        };

        // Filter out specific types (non-randomized)
        const specificTypes = questionTypes.filter(type => type !== 'randomized');

        // If specific types are selected, use only those (ignore randomized)
        if (specificTypes.length > 0) {
            return specificTypes
                .map(type => descriptions[type] || type)
                .join('\n');
        }

        // If ONLY randomized is selected, generate mix of all types
        if (questionTypes.includes('randomized')) {
            return 'Mix of all question types (single-choice, multiple-select, true-false)';
        }

        // Fallback (shouldn't reach here normally)
        return questionTypes
            .map(type => descriptions[type] || type)
            .join('\n');
    }

    /**
     * Parse questions from Claude's response
     * @param {string} responseText - Raw response from Claude
     * @returns {Array} Parsed questions
     */
    parseQuestions(responseText) {
        try {
            // Try to extract JSON from response
            let jsonText = responseText.trim();

            // Remove markdown code blocks if present
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Parse JSON
            const questions = JSON.parse(jsonText);

            // Validate structure
            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array');
            }

            // Validate each question
            questions.forEach((q, index) => {
                if (!q.type || !q.question) {
                    throw new Error(`Invalid question at index ${index}`);
                }
            });

            return questions;

        } catch (error) {
            console.error('Parse error:', error);
            console.error('Response text:', responseText);
            throw new Error('Failed to parse questions from API response');
        }
    }

    /**
     * Validate question structure
     * @param {Object} question - Question object
     * @returns {boolean} Is valid
     */
    validateQuestion(question) {
        const requiredFields = ['type', 'question', 'explanation'];

        // Check required fields
        for (const field of requiredFields) {
            if (!question[field]) {
                return false;
            }
        }

        // Type-specific validation
        switch (question.type) {
            case 'single-choice':
                return question.options?.length === 4 && question.correctAnswer;

            case 'multiple-select':
                return question.options?.length >= 4 && question.options?.length <= 6 &&
                       Array.isArray(question.correctAnswers) &&
                       question.correctAnswers.length >= 2 &&
                       question.correctAnswers.length <= 4;

            case 'true-false':
                return question.options?.length === 2 && question.correctAnswer;

            default:
                return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizGenerator;
}
