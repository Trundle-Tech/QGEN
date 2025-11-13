# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies (One-time setup)
```bash
cd QGen
pip3 install -r requirements.txt
```

### 2. Start the Server
```bash
python3 server.py
```

You should see:
```
Starting Quiz Generator Server...
Open http://localhost:5000 in your browser
```

### 3. Open Your Browser
Navigate to: **http://localhost:5000**

---

## 📝 Creating Your First Quiz

1. **Upload File**: Drag and drop `Starter-course-test_html.xlf` (in parent directory)

2. **Review Theme**: See the extracted colors from your course

3. **Configure**:
   - Set number of questions (try 5 for a quick test)
   - Keep all question types checked

4. **Generate**: Click "Generate Quiz"

5. **Download**: Click "Download Quiz HTML" and open the file in your browser

6. **Test**: Try answering questions, submit answers, and see your score!

---

## 🛠️ Troubleshooting

**"Failed to fetch" error**
- Make sure the Flask server is running (`python3 server.py`)
- Check that you're accessing http://localhost:5000 (not http://localhost:8000)

**"API Error" message**
- Verify your API key is set in the `.env` file
- Check that your API key has available credits

**Server won't start**
- Install dependencies: `pip3 install -r requirements.txt`
- Check if port 5000 is already in use

---

## 💡 Tips

- Use `_html.xlf` files for best theme extraction
- Start with fewer questions (5-10) for faster testing
- "Randomized" question type creates a mix of all types
- Generated quizzes work offline after download

---

## 🔑 Your Setup

✓ API Key: Configured in `.env`
✓ Server: Flask (Python)
✓ Port: 5000
✓ Model: Claude Sonnet 4.5

**Ready to generate quizzes!** 🎉
