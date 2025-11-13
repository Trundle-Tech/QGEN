# AI Quiz Generator

An intelligent quiz generator that creates interactive quizzes from XLIFF course content files using Claude AI (Sonnet 4.5).

## Features

- **Upload & Parse**: Upload `_html.xlf` files to extract course content and theme colors
- **Theme Extraction**: Automatically extracts text and background colors from the course styling
- **Flexible Question Types**: Generate mix of:
  - Single Choice (one correct answer)
  - Multiple Choice (two correct answers)
  - Fill in the Blank
  - Choose All Correct (select all that apply)
  - Randomized (mix of all types)
- **Configurable**: Choose 1-50 questions and select which question types to include
- **AI-Powered**: Uses Claude Sonnet 4.5 to generate intelligent, context-aware questions
- **Standalone Output**: Downloads as a single HTML file with inline CSS/JS
- **Interactive Quiz**: Generated quizzes include:
  - Answer validation
  - Instant feedback with explanations
  - Score tracking
  - Review mode
  - Responsive design

## Setup

### 1. API Key Configuration

Your Claude API key is already configured in the `.env` file. If you need to update it:

```bash
# Edit .env file
CLAUDE_API_KEY=your_api_key_here
```

### 2. Install Python Dependencies

```bash
cd QGen
pip3 install -r requirements.txt
```

### 3. Running the Application

The application uses a Flask backend server to proxy API requests and avoid CORS issues.

```bash
cd QGen
python3 server.py
```

The server will start and display:
```
Starting Quiz Generator Server...
Open http://localhost:5000 in your browser
```

**Then open your browser to: http://localhost:5000**

## Usage

### Step 1: Upload Course Content
1. Click "Browse Files" or drag & drop your `_html.xlf` file
2. **Important**: Use the `_html.xlf` version (not the plain `.xlf`) to preserve styling

### Step 2: Review Extracted Theme
- The tool automatically extracts text and background colors from your course
- These colors will be applied to the generated quiz

### Step 3: Configure Quiz
1. **Number of Questions**: Use the slider to select 1-50 questions
2. **Question Types**: Check the types you want to include:
   - ✓ Single Choice
   - ✓ Multiple Choice
   - ✓ Fill in the Blank
   - ✓ Choose All Correct
   - ✓ Randomized

### Step 4: Generate
1. Click "Generate Quiz"
2. Wait for Claude AI to create your questions (may take 10-30 seconds)
3. Click "Download Quiz HTML" to save your interactive quiz

### Step 5: Use Your Quiz
- Open the downloaded HTML file in any web browser
- No internet connection required after download
- Share the file with learners directly

## File Structure

```
QGen/
├── index.html          # Main web interface
├── styles.css          # Interface styling
├── app.js             # Main application controller
├── xlf-parser.js      # XLF file parser
├── quiz-generator.js  # Claude API integration
├── quiz-renderer.js   # Quiz HTML generator
├── server.py          # Flask backend (API proxy)
├── requirements.txt   # Python dependencies
├── .env              # API key configuration
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## How It Works

1. **Parse**: The XLF parser extracts text content and scans for color styles in the HTML markup
2. **Generate**: Content is sent to Claude API with instructions for question generation
3. **Render**: Questions are formatted into an interactive HTML quiz with the extracted theme
4. **Download**: Complete standalone HTML file with inline CSS/JS

## Question Type Details

### Single Choice
- 4 options (A, B, C, D)
- One correct answer
- User selects one option

### Multiple Choice
- 4 options (A, B, C, D)
- Two correct answers
- User must select exactly 2 options

### Fill in the Blank
- Question contains underscores `_____`
- User types the answer
- Case-insensitive matching

### Choose All Correct
- 4-6 options
- 2-3 correct answers
- User selects all that apply

### Randomized
- AI distributes questions across all types
- Balanced mix for variety

## Deploying to Netlify

This application can be deployed to Netlify for free hosting with serverless functions.

### 1. Deploy to Netlify

**Option A: Deploy from GitHub (Recommended)**
1. Push your code to GitHub (already done!)
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select the `Trundle-Tech/QGEN` repository
5. Build settings are auto-configured from `netlify.toml`
6. Click "Deploy site"

**Option B: Manual Deploy**
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify deploy --prod`

### 2. Configure Environment Variable

After deployment, you must add your API key as an environment variable:

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Set:
   - **Key**: `CLAUDE_API_KEY`
   - **Value**: Your Claude API key (e.g., `sk-ant-api03-...`)
4. Click **Save**
5. **Important**: Redeploy the site for the variable to take effect
   - Go to **Deploys** → Click **Trigger deploy** → **Deploy site**

### 3. How It Works

- Netlify serves the static files (HTML, CSS, JS)
- API requests to `/api/generate` are redirected to a Netlify Function
- The serverless function (in `netlify/functions/generate.js`) proxies requests to Claude API
- Your API key is securely stored as an environment variable and never exposed to the browser
- Questions are generated in batches of 5 to stay within Netlify's 10-second function timeout (free tier)

### 4. Important: Netlify Timeout Limits

Netlify Functions have strict timeout limits:
- **Free tier**: 10 seconds maximum
- **Pro tier**: 26 seconds maximum

The application uses **batch generation** (5 questions per batch) to stay within these limits. For example:
- 10 questions = 2 batches (takes ~10-15 seconds total)
- 30 questions = 6 batches (takes ~30-45 seconds total)

Each batch is generated sequentially, so you'll see progress updates like "Generating questions 1-5...", "Generated 10 of 30 questions", etc.

### File Structure for Netlify

```
QGen/
├── netlify/
│   └── functions/
│       └── generate.js    # Serverless function (replaces Flask)
├── netlify.toml           # Netlify configuration
├── index.html             # Static files served by Netlify
├── *.js, *.css            # ...
└── .env                   # Local development only (not deployed)
```

## Troubleshooting

### "Failed to load API key"
- Ensure the `.env` file exists in the QGen folder
- Make sure you're running through a web server (not opening index.html directly)

### "API Error: Invalid API key"
- Check that your Claude API key is correct in the `.env` file
- Ensure there are no extra quotes or spaces

### "Failed to parse XLF file"
- Ensure you're uploading a valid XLIFF (.xlf) file
- Use the `_html.xlf` version for best results

### Quiz doesn't generate
- Check browser console (F12) for error messages
- Ensure you have an active internet connection
- Verify your API key has available credits

## Browser Compatibility

- Chrome/Edge: ✓ Fully supported
- Firefox: ✓ Fully supported
- Safari: ✓ Fully supported
- Mobile browsers: ✓ Responsive design

## Technical Details

- **Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **API**: Anthropic Messages API
- **Max Tokens**: 4096 per generation
- **File Format**: XLIFF 1.2

## Security Notes

- API key is loaded client-side from .env file
- For production use, consider implementing a backend proxy
- Never commit your `.env` file to version control
- The `.gitignore` should include `.env`

## Credits

Powered by Claude AI (Sonnet 4.5) from Anthropic
