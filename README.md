# CodeCrypt — Bring Forgotten Code Back to Life 👻

> **Hacktoberfest 2026 · Week 4: “Ghost in the Machine”**  
> A local AI-powered code analysis assistant that explains, scans, and helps modernize confusing or legacy source code using Gemma 2 through Ollama.

CodeCrypt gives developers a place to bring unfamiliar code, investigate how it works, identify possible issues, and generate an improved version. Its dark, cinematic interface is inspired by the idea of discovering forgotten code inside a digital archive.

The application uses **Flask** for the backend, **HTML/CSS/vanilla JavaScript** for the frontend, and **Ollama** to run the configured AI model locally.

---

## Features

### 🧠 Explain Code
- Get a concise overview of what a code snippet does.
- Read a beginner-friendly, step-by-step explanation of its logic.
- Identify important variables, functions, concepts, assumptions, and possible edge cases.

### 🔍 Scan for Issues
- Ask the AI to look for potential bugs, risky patterns, and maintainability concerns.
- Receive explanations of why an issue may matter.
- Get suggestions for possible fixes.
- Review severity labels where appropriate.

### ♻️ Restore Code
- Generate a suggested refactored or modernized version.
- Review the changes and the reasoning behind them.
- Copy the generated code for further review and testing.

### 🛠️ Developer-friendly tools
- Language selector with Auto-detect, Python, JavaScript, HTML, CSS, Java, C, C++, SQL, and Other.
- Built-in sample snippets for experimenting with legacy and potentially unsafe patterns.
- Character counter and a configurable input limit (15,000 characters by default).
- Live Ollama connection and model-status indicator.
- Copy generated code or analysis results.
- Recent analysis history stored in the browser using `localStorage` (up to 10 recent entries).
- Responsive dark dashboard with emerald accents and a code-editor-inspired workspace.

---

## How It Works

1. Paste a code snippet into the CodeCrypt editor or load one of the included examples.
2. Select the programming language, or leave it on Auto-detect.
3. Choose **Explain Code**, **Scan for Issues**, or **Restore Code**.
4. The browser sends the request to the Flask backend.
5. Flask builds an action-specific prompt and sends it to the configured Ollama service.
6. The model's response is returned to the browser and displayed in the results panel.

```text
Your browser
     |
     |  POST /api/analyze
     v
Flask application
     |
     |  POST /api/generate
     v
Ollama running the configured model
     |
     |  AI-generated analysis
     v
Flask returns JSON
     |
     v
CodeCrypt displays the result
```

## Tech Stack

| Area | Technology |
|---|---|
| Backend | Python 3 |
| Web framework | Flask |
| HTTP requests | Python `requests` |
| Frontend | HTML5 |
| Styling | CSS3 |
| Interactivity | Vanilla JavaScript |
| Local AI runtime | Ollama |
| Default AI model | Gemma 2 (`gemma2:2b`) |
| Automated tests | Python `unittest` |

No React, Node.js, database, or paid cloud AI API is required.

---

## Screenshots

<img width="1901" height="1198" alt="Screenshot 2026-10-31 205821" src="https://github.com/user-attachments/assets/f1d72aa7-d17a-4156-ae43-bc24ec0ac380" />

<img width="1897" height="1198" alt="Screenshot 2026-10-31 210041" src="https://github.com/user-attachments/assets/e9799f8a-286b-46db-87ed-46544ebafff4" />

<img width="1895" height="1198" alt="Screenshot 2026-10-31 210108" src="https://github.com/user-attachments/assets/661110e2-0ad5-48c6-9d56-6e5d8febcbaa" />


## Requirements

Before running CodeCrypt, install:

- **Python 3.10 or newer**
- **Ollama** — [Download Ollama](https://ollama.com/download)
- The Gemma 2 model used by the application (default: `gemma2:2b`)

Check your Python installation:

```bash
python --version
```

Check that Ollama is available:

```bash
ollama --version
```

## Installation

### 1. Get the project

Clone your repository, then move into the project directory:

```bash
git clone https://github.com/Maheshwar247/CodeCrypt.git
cd CodeCrypt
```

If you downloaded the project as a ZIP, extract it and open a terminal in the `CodeCrypt` folder instead.

### 2. Create a virtual environment

**Windows — PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation for the current terminal session, you can run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

**Windows — Command Prompt:**

```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

The project dependencies are Flask and `requests`.

### 4. Start Ollama and download Gemma 2

Make sure the Ollama application is running. Then download the default model:

```bash
ollama pull gemma2:2b
```

Confirm that the model is installed:

```bash
ollama list
```

The application expects Ollama at `http://localhost:11434` by default.

### 5. Configure the application (optional)

The project includes `.env.example` as a reference for the supported environment variables.

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama service address |
| `OLLAMA_MODEL` | `gemma2:2b` | Model used for analysis |
| `OLLAMA_TIMEOUT` | `120` | AI request timeout in seconds |
| `MAX_CODE_LENGTH` | `15000` | Maximum submitted code length |
| `HOST` | `127.0.0.1` | Flask server host |
| `PORT` | `5000` | Flask server port |
| `DEBUG` | `false` | Flask debug mode |
| `GITHUB_REPO_URL` | empty | Optional repository link displayed by the UI |

These settings are read from environment variables by `app.py`. The application does not automatically load `.env` files, so set variables in your terminal or configure your environment before starting Flask. `.env.example` is a reference template, not an automatic loader.

For example, in Windows PowerShell:

```powershell
$env:OLLAMA_MODEL = "gemma2:2b"
$env:OLLAMA_TIMEOUT = "120"
```

If you use another model, pull it with Ollama and set `OLLAMA_MODEL` to its exact installed name.

---

## Run CodeCrypt

With your virtual environment activated, dependencies installed, and Ollama running:

```bash
python app.py
```

Open the application in your browser:

**http://127.0.0.1:5000**

Keep Ollama running while using the AI features. The Flask server and Ollama are separate processes.

---

## API Endpoints

### `GET /`

Serves the CodeCrypt dashboard.

### `GET /api/health`

Checks whether Ollama is reachable and whether the configured model is available.

Example response:

```json
{
  "online": true,
  "configured_model": "gemma2:2b",
  "model_available": true,
  "available_models": ["gemma2:2b"],
  "max_code_length": 15000,
  "timeout": 120,
  "message": "Connected to Ollama. Model 'gemma2:2b' is ready."
}
```

The response fields can vary depending on Ollama's status.

### `POST /api/analyze`

Sends source code to Ollama for one of the supported analysis actions.

Example request:

```json
{
  "code": "def calculate_total(items, tax=0.08):\n    return sum(items) * (1 + tax)",
  "action": "explain",
  "language": "python"
}
```

Supported `action` values:

| Action | Purpose |
|---|---|
| `explain` | Explain the submitted code |
| `scan` | Scan for potential issues |
| `restore` | Suggest an improved version |

The `language` value can be `auto`, `python`, `javascript`, `html`, `css`, `java`, `c`, `cpp`, `sql`, or `other`.

Successful responses include `success`, `action`, `language`, `model`, and `result`. Validation and AI-service failures return a JSON error response with an appropriate HTTP status.

---

## Run the Tests

CodeCrypt includes automated tests using Python's built-in `unittest` framework. The tests mock Ollama responses, so they do not require a running Ollama server or a downloaded model.

With the virtual environment activated and dependencies installed, run:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

The test suite covers:
- Homepage rendering.
- Ollama health checks for online, offline, and missing-model scenarios.
- Request validation, including empty input, malformed requests, invalid actions, and oversized code.
- Ollama connection errors, timeouts, missing models, and empty responses.
- Successful response handling for Explain, Scan, and Restore.
- Prompt boundaries for treating submitted code as untrusted input.

A passing mocked test suite verifies application behavior around simulated responses; it does not replace testing with a real local Gemma model.

---

## Privacy, Safety, and Limitations

- **Local inference by default:** CodeCrypt sends submitted code to the Ollama URL configured in `OLLAMA_URL`, which defaults to `http://localhost:11434`.
- **Configuration matters:** If you change `OLLAMA_URL` to a remote service, submitted code will be sent to that configured endpoint. Do not use a remote endpoint unless you trust it.
- **No code execution:** CodeCrypt does not execute submitted code or AI-generated code.
- **Untrusted input:** The backend marks submitted source code as untrusted data in its prompts and instructs the model not to follow instructions embedded in code comments or strings.
- **Safe result rendering:** The frontend builds result elements using DOM APIs and text content rather than inserting model output as arbitrary HTML.
- **Browser history:** Recent analysis entries are stored in the browser's `localStorage`. They can remain on that browser until cleared using the application's history controls or browser storage settings. Avoid submitting secrets or credentials.
- **AI is not infallible:** The model may miss bugs, misunderstand context, or suggest incorrect changes. Review all suggestions and run your own tests before using generated code.
- **Not a security certification:** An AI scan is not a complete security audit and cannot guarantee that code is safe or bug-free.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| Cannot connect to Ollama | Start the Ollama application, or run `ollama serve` in a terminal. |
| Model not found | Run `ollama pull gemma2:2b`, or set `OLLAMA_MODEL` to a model you already installed. |
| AI request times out | Try a smaller snippet or increase `OLLAMA_TIMEOUT`. Local inference speed depends on your hardware and model. |
| Code exceeds the character limit | Split a large file into smaller functions or sections. |
| Flask command fails | Confirm the virtual environment is active and run `pip install -r requirements.txt`. |
| Port 5000 is already in use | Set `PORT` to another available port before starting the app. |

---

## Why Open Innovation Matters

Open innovation gives developers the freedom to inspect, experiment with, and adapt the tools they use.

CodeCrypt demonstrates a practical combination of an inspectable application codebase and a locally runnable open-weight model. Developers can experiment with different compatible models, change the prompts, improve the interface, and contribute new analysis capabilities without depending on a paid hosted AI API.

Running AI locally can also give users more control over where their code is processed, provided they keep Ollama configured to a trusted local endpoint.

Gemma is an open-weight model family provided under Google's Gemma Terms of Use. Ollama and the other dependencies have their own licenses and terms. Check each project's official licensing information before redistributing or modifying those components.

---

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a branch for your change:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes.
4. Run the automated tests:

   ```bash
   python -m unittest discover -s tests -p "test_*.py"
   ```

5. Commit your changes and open a pull request describing what you changed.

Please avoid committing virtual environments, `.env` files, model weights, secrets, or personal code samples.

---


**Built for Hacktoberfest 2026 — Week 4: Ghost in the Machine.**  
*Every line has a story. Let's uncover it.* 👻
