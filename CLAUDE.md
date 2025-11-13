# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Quiz Generator - A web application that creates interactive HTML quizzes from XLIFF (`.xlf`) course content files using Claude AI Sonnet 4.5. The system parses educational content and generates questions with AI-powered intelligence. Quizzes are styled using the shadcn/ui design system with the zinc color scheme.

## Architecture

### Client-Server Split (CORS Workaround)

The application uses a **Flask backend proxy** to avoid browser CORS restrictions when calling Claude API:

- **Frontend** (HTML/CSS/JS): Runs in browser, handles UI and file parsing
- **Backend** (Flask): Proxies API requests to Claude API with authentication
- **Flow**: Browser → Flask `/api/generate` → Claude API → Flask → Browser

**Critical**: Direct browser-to-Claude API calls will fail with CORS errors. All API requests must go through the Flask proxy endpoint.

### Module Responsibilities

1. **server.py** (Flask Backend)
   - Routes: `/api/generate` (API proxy), `/` (index.html), `/<path>` (static files)
   - **Route Order Matters**: API routes must be registered before catch-all static route
   - Loads API key from `.env` file (not exposed to frontend)
   - 60-second timeout for quiz generation requests

2. **xlf-parser.js** (XLFParser class)
   - Parses XLIFF 1.2 XML format using browser DOMParser
   - Extracts plain text from `<source>` tags, stripping HTML tags
   - Returns: `{content: [...]}`

3. **quiz-generator.js** (QuizGenerator class)
   - Endpoint: `/api/generate` (NOT direct Claude API)
   - Builds structured prompts for Claude with question type specifications
   - Model: `claude-sonnet-4-5-20250929`, max_tokens: 4096
   - **Batch Generation**: Supports variable question counts (1-50)
   - Each API call requests 10 or fewer questions
   - Expects JSON array response from Claude
   - Handles JSON extraction (strips markdown code blocks if present)

4. **quiz-renderer.js** (QuizRenderer class)
   - Generates standalone HTML with inline CSS/JS (no external dependencies)
   - Uses shadcn/ui design system with zinc color scheme (CSS variables in `:root`)
   - Renders interactive quiz with state management (navigation, scoring, review mode)
   - Output is a single `.html` file that works offline

5. **app.js** (Main Controller)
   - Orchestrates file upload → parsing → generation → download flow
   - Global state: `parsedData`, `generatedQuestions` (accumulates across batches)
   - Drag-and-drop file handling with visual feedback
   - Progressive UI disclosure (steps appear as data becomes available)
   - **Batch Generation Loop**:
     - Divides total questions into batches of 10
     - Generates each batch sequentially with await
     - Updates progress indicator after each batch
     - Accumulates all questions in `generatedQuestions` array
     - Handles remainders (e.g., 35 questions = 10+10+10+5)

## Development Commands

### Start Development Server
```bash
python3 server.py
```
Server runs on port 5000 with auto-reload enabled (debug mode).

### Install Dependencies (First Time)
```bash
pip3 install -r requirements.txt
```

### Testing the Application
1. Start server: `python3 server.py`
2. Open: http://localhost:5000
3. Upload test file: `../Starter-course-test_html.xlf` (in parent directory)
4. Configure quiz (question count: 1-50, select question types)
5. Click "Generate Quiz" and watch batch progress
6. View questions in preview panel as they appear
7. Download completed quiz

## Input File Format

XLIFF files (`.xlf` or `_html.xlf`):
- Both formats supported - extracts text content from `<source>` tags
- HTML tags are automatically stripped from content

XLIFF Structure:
```xml
<file original="...">
  <body>
    <trans-unit id="...">
      <source>
        <g id="..." ctype="x-html-P" xhtml:style="color: rgb(0, 0, 0)">Text</g>
      </source>
    </trans-unit>
  </body>
</file>
```

## Question Generation Logic

### Question Types
1. **Single Choice**: 4 options (A-D), exactly 1 correct answer
2. **Multiple Select**: 4-6 options, 2-4 correct answers (select all that apply)
3. **True/False**: 2 options (True/False), 1 correct answer
4. **Randomized**: AI distributes across all types

**Note**: Fill-in-Blank questions have been removed. Multiple Choice and Choose All Correct have been consolidated into "Multiple Select".

### Question Structure
Each generated question includes:
- `type`: Question type (single-choice, multiple-select, true-false)
- `question`: The question text
- `options`: Array of answer options
- `correctAnswer` or `correctAnswers`: The correct answer(s)
- `explanation`: Brief explanation of why the answer is correct
- `referenceInfo`: Detailed 2-4 sentence explanation from course material
  - Provides context and understanding for mastery learning
  - Shown in review mode for incorrect answers
  - Helps learner prepare for retake

### AI Prompt Structure
- Content is passed as plain text (HTML stripped)
- Specific instructions per question type
- Request JSON-only response (no markdown wrapping)
- Include explanations for correct answers
- **NEW**: Include detailed reference information for each question:
  - 2-4 sentences explaining the concept being tested
  - Context from the course material
  - Educational content focused on mastery learning

## Configuration

### Environment Variables (.env)
```
CLAUDE_API_KEY=sk-ant-api03-...
```
- **Security**: Never commit `.env` to version control
- API key is loaded server-side only (not exposed to browser)
- If key is missing/invalid, server exits with error message
- **IMPORTANT**: Format must be exact (no `export`, no quotes, no spaces around `=`)
  - ✓ Correct: `CLAUDE_API_KEY=sk-ant-api03-...`
  - ✗ Wrong: `export CLAUDE_API_KEY='sk-ant-api03-...'`
  - ✗ Wrong: `CLAUDE_API_KEY = sk-ant-api03-...`

### UI Configuration Options
- Question count: 1-50 (slider) - target number of questions
- Question types: Toggle buttons (multi-select)
  - Buttons highlight when active (dark background with shadow)
  - Click to toggle on/off
  - At least one question type must be selected
  - **Default State**: Single Choice, Multiple Select, and True/False are active by default
  - **Randomized Button**: Inactive by default (must be explicitly selected)
    - When ONLY "Randomized" is selected: generates mix of all question types
    - When specific types are selected: "Randomized" is ignored, specific types take precedence
    - This prevents accidental mixing when user wants specific question types only
- **Batch Generation**: Questions generated in batches of 5
  - Click "Generate Quiz" once
  - System automatically generates in batches (5 per API call)
  - Shows real-time progress: "Generating questions 1-5...", "Generated 5 of 30 questions"
  - Batch size reduced to 5 to avoid Netlify function timeouts (10s limit on free tier)
  - Questions appear in preview as each batch completes
  - Avoids API token limits and timeouts
- Question preview panel: Shows accumulated questions
  - Visual type badges (color-coded by type)
  - Correct answers highlighted in green
  - Includes explanations
  - Updates incrementally as batches complete
  - Animated slide-in for new questions

## Common Pitfalls

### Question Type Selection Not Respected
- **Symptom**: Selecting only "Single Choice" generates all question types
- **Cause**: "Randomized" button was active, which overrides specific type selections
- **Fix**:
  - Ensure "Randomized" button is NOT highlighted/active if you want specific types only
  - Click "Randomized" to deactivate it if it's highlighted
  - The `getTypesDescription()` function now prioritizes specific types over "Randomized"
- **Resolution**: Fixed in commit 9535b30 (Nov 2025)
  - Randomized button now inactive by default
  - Specific type selections take precedence over Randomized

### .env File Format Issues
- **Symptom**: "API key not configured" or 404 errors on `/api/generate`
- **Cause**: Incorrect `.env` file format with `export`, quotes, or extra spaces
- **Fix**: Ensure `.env` file format is exact:
  ```
  CLAUDE_API_KEY=sk-ant-api03-...
  ```
  - No `export` keyword
  - No quotes around the value
  - No spaces around the `=` sign
- **After fixing**: Restart the Flask server (`python3 server.py`)

### CORS Issues
- **Symptom**: "Failed to fetch" errors in browser console
- **Cause**: Frontend trying to call Claude API directly
- **Fix**: Ensure `quiz-generator.js` uses `/api/generate` endpoint (not `https://api.anthropic.com/...`)

### Static Files Not Loading (404s)
- **Symptom**: CSS/JS files return 404, page appears unstyled
- **Cause**: Flask route order incorrect
- **Fix**: API routes (`/api/*`) must be registered before static catch-all route (`/<path:path>`)

### XLF Parse Failures
- **Symptom**: "Failed to parse XLF file" error
- **Cause**: Invalid XML, wrong namespace, or plain `.xlf` instead of `_html.xlf`
- **Fix**: Check file has `xmlns:xhtml="http://www.w3.org/1999/xhtml"` namespace

### API Token Limit / 500 Errors
- **Symptom**: 500 INTERNAL SERVER ERROR when generating many questions (30+), or request timeout after 60 seconds
- **Cause**: Prompt too large (content + question count + instructions exceed Claude's context window)
- **Solution Implemented**: Batch generation (5 questions per API call)
- **Why It Works**:
  - Each batch stays well under token limits
  - Course content repeated in each call, but only 5 questions requested
  - Much faster than one-at-a-time (30 questions = 6 API calls, not 30)
- **Implementation**:
  - `generateQuiz()` loops through batches of 5
  - Each batch: generate → accumulate → update progress → update preview
  - Handles remainders automatically (e.g., 27 questions = 5+5+5+5+5+2)

### Netlify 504 Timeout Errors
- **Symptom**: "Request timeout" or 504 errors on Netlify deployment
- **Cause**: Netlify Functions have timeout limits:
  - Free tier: 10 seconds maximum
  - Pro tier: 26 seconds maximum
  - Background functions (Pro only): 15 minutes
- **Solution**:
  - Batch size reduced to 5 questions per request
  - Each batch should complete in 5-8 seconds
  - For large quizzes (30+ questions), multiple batches are generated sequentially
- **If still timing out**:
  - Reduce question count
  - Upgrade to Netlify Pro for 26s timeout
  - Consider using background functions (requires Pro + code changes)
- **Local development**: No timeout issues with Flask server (60s timeout)

## Output Quiz Behavior

Generated quiz files are fully self-contained:
- All CSS/JS inlined (no external dependencies)
- Works offline after download
- State management: tracks answers, calculates scores
- Mobile responsive (CSS media queries)

### Quiz User Experience Flow

**Taking the Quiz:**
1. User selects an answer (single/multiple choice or fill-in-blank)
2. "Next" button becomes enabled immediately upon selection
3. No immediate feedback is shown - user moves to next question
4. User can navigate back/forward to change answers before completion
5. Previous answers are restored when navigating back
6. On last question, "Next" triggers results screen

**Results Screen:**
- Shows animated progress ring that fills based on percentage achieved
- Displays score as fraction (e.g., "17/20") and percentage in center of ring
- Lists all missed questions with clickable items
- Two action buttons: "Review Missed Questions" and "Retake Missed Questions"
- If 100% achieved: Shows congratulations screen with completion stats

**Review Mode:**
- Triggered by clicking "Review Missed Questions" or clicking a specific missed question
- Shows user's correct selections highlighted in GREEN
- Shows user's incorrect selections highlighted in RED
- For incorrect answers: displays clickable reference information section
  - Initially collapsed with "View Reference Information" header
  - Click to expand and view detailed explanation from course material
  - Helps learner understand concept before retaking
- Does NOT reveal which options are correct (only shows what user selected)
- User can navigate through all questions

**Retake Flow (Mastery-Based Learning):**
1. Click "Retake Missed Questions" to quiz only on missed questions
2. Question counter shows "Question 1 of X" where X is number of missed questions
3. Complete retake and view results
4. If still missed questions: retake ONLY newly missed questions
5. Repeat until 100% achieved
6. On 100% completion: Show congratulations screen with:
   - Total questions count
   - Number of attempts to mastery
   - "Complete Course" button

## Quiz JavaScript Implementation Details

### Key Functions in quiz-renderer.js:

**Answer Handling:**
- `selectOption()`: Handles option selection, enables Next button via `checkAnswerSelected()`
- `checkAnswerSelected()`: Validates if answer is selected, enables/disables Next button
- `saveCurrentAnswer()`: Stores user answer and checks correctness (called by nextQuestion)
- No submit button - answers saved automatically on navigation

**Navigation:**
- `nextQuestion()`: Saves current answer, advances to next question or shows results
- `previousQuestion()`: Saves current answer if present, moves back, restores previous selection
- `restorePreviousSelection()`: Restores answers when navigating back (no highlighting)
- `restoreAnswer()`: Used in review mode, highlights correct (green) and incorrect (red) answers

**Results & Review:**
- `showResults()`: Checks for 100% completion, routes to either regular results or congratulations
- `showRegularResults()`: Displays progress ring, score, missed questions list
- `showCongratulations()`: Displays 100% completion screen with stats
- `jumpToQuestion(index)`: Allows jumping to specific question from missed list
- `reviewAnswers()`: Enters review mode, jumps to first missed question

**Reference Information:**
- `showReferenceInfo(text)`: Displays reference info section for incorrect answers
- `toggleReference()`: Expands/collapses reference content with animation

**Retake Logic:**
- `retakeMissedQuestions()`: Filters to only missed questions, resets quiz state
  - Maps missed question indices (handles nested retakes using `originalIndex` property)
  - Creates new questions array with `originalIndex` property for tracking
  - Increments `retakeAttempt` counter
  - Resets `userAnswers` and starts new quiz with subset
- `reviewAnswers()`: Properly handles `originalIndex` when in retake mode
  - Checks if in retake mode and uses stored `originalIndex` from questions
  - Correctly maps back to original question set when filtering
  - Prevents bug where wrong questions were shown in nested retakes
- `completeCourse()`: Handles 100% completion action
  - Sends postMessage to parent window for LMS/Rise 360 integration

**Progress Ring Display:**
- SVG-based circular progress indicator
- Calculates `stroke-dashoffset` based on percentage: `circumference - (percentage / 100) * circumference`
- Animates from 0 to target percentage with CSS transition
- Displays fraction and percentage in center overlay

**State Variables:**
- `questions[]`: Current question set (changes during retakes)
- `originalQuestions[]`: Original full question set (never changes)
- `userAnswers[]`: Array of objects with {answer, correct, question} for each question
- `reviewMode`: Boolean flag controlling whether in review mode
- `isAnswered`: Tracks if current question has been answered
- `currentQuestionIndex`: Current question being displayed
- `missedQuestionIndices[]`: Tracks original indices of missed questions
- `isRetakeMode`: Boolean flag indicating if currently retaking
- `retakeAttempt`: Counter for number of retake attempts
- `totalOriginalQuestions`: Constant storing original question count

## Modification Guidelines

### Adding New Question Types
1. Update `quiz-generator.js`: Add type to `getTypesDescription()`
2. Update `quiz-renderer.js`: Add rendering logic in `selectOption()` for multi-select vs single-select
3. Update `index.html`: Add toggle button option
4. Update Claude prompt in `buildPrompt()` with type specifications
5. Update validation in `validateQuestion()` method

### Customizing Quiz UI
Modify `quiz-renderer.js`:
- `getStyles()`: CSS generation using shadcn/ui CSS variables
- Modify `:root` CSS variables to change color scheme
- Available shadcn themes: zinc (default), slate, stone, gray, neutral, red, rose, orange, green, blue, yellow, violet
- `getScript()`: Quiz interaction logic (answer submission, navigation, scoring)

## Design System

### shadcn/ui Integration

The quiz renderer uses the shadcn/ui design system with CSS variables for consistent, themeable styling.

**Current Theme**: zinc (neutral gray tones)

**CSS Variables** (defined in `:root` in quiz-renderer.js):
- `--background`: Main background color
- `--foreground`: Main text color
- `--card`: Card/container backgrounds
- `--primary`: Primary action colors (header, buttons)
- `--secondary`: Secondary buttons and elements
- `--muted`: Muted backgrounds (footer, disabled states)
- `--destructive`: Error/incorrect states
- `--border`: Border colors
- `--input`: Input field borders
- `--ring`: Focus ring colors
- `--radius`: Border radius size

**Color Format**: HSL values (e.g., `240 5.9% 10%`)
- Used with `hsl(var(--variable-name))` in CSS
- Supports alpha channel: `hsl(var(--destructive) / 0.1)` for transparency

**Benefits**:
- Consistent design language across all quiz elements
- Easy theme switching by modifying CSS variables
- No dynamic color calculation needed
- Better accessibility with predefined contrast ratios

## API Key Security

- ✓ API key stored in `.env` (not tracked by git via `.gitignore`)
- ✓ Key loaded server-side only (Flask)
- ✓ Never exposed to browser/client
- ✓ Flask proxy handles authentication
- ✗ Do NOT add API key to frontend JavaScript
- ✗ Do NOT commit `.env` file

## Rise 360 Integration

### Code Blocks (Beta)

**NEW**: Rise 360 introduced Code Blocks (October 2025) that enable tracking of embedded HTML content.

**How It Works:**
- Upload quiz as ZIP file with index.html
- Code Blocks support HTML, CSS, and JavaScript
- Can communicate completion status using postMessage
- Continue blocks recognize when learners complete the activity

**Integration Method:**

The quiz already includes the correct postMessage code:
```javascript
window.parent.postMessage({ type: 'complete' }, '*');
window.parent.postMessage({
    type: 'lesson-complete',
    status: 'completed'
}, '*');
```

These messages are sent when learner achieves 100% mastery in the `completeCourse()` function.

**Packaging for Rise 360:**
1. Generated quiz HTML is standalone (all CSS/JS inline)
2. Package as ZIP with `index.html` at root
3. Upload to Rise 360 Code Block
4. Rise tracks completion when postMessage received

**Benefits:**
- ✓ Full quiz functionality preserved
- ✓ Completion tracking in Rise 360
- ✓ Works in regular courses and microlearning
- ✓ Continue blocks can gate progress based on quiz completion
- ✓ No Storyline 360 required

**Limitations:**
- Code Blocks still in beta (October 2025)
- Not recommended for critical deliverables during beta period
- Rise 360 subscription required

**Alternative Integration Methods:**
- **Storyline 360 Blocks**: Convert quiz to Storyline (full tracking, stable)
- **SCORM Export**: Package quiz as SCORM for LMS upload (requires implementation)
- **Embed Block**: Basic iframe embed (no completion tracking)
