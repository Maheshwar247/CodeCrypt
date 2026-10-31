/**
 * CodeCrypt — Bring Forgotten Code Back to Life
 * Hacktoberfest 2026 Week 4: "Ghost in the Machine"
 *
 * Frontend Interactions, Live Ollama Health Polling,
 * and Safe DOM Markdown Parsing (strictly preventing arbitrary innerHTML injection).
 */

(function () {
  'use strict';

  // --- Sample Code Snippets for Immediate Testing ---
  const SAMPLE_SNIPPETS = {
    python_legacy: {
      lang: 'python',
      code: `# Legacy Python 2.7 Data Worker (circa 2011)
# Warning: contains outdated idioms, mutable default, and unsafe eval
import sys

def process_records(record_str, cache={}):
    """Processes semicolon-delimited user config records."""
    items = record_str.split(";")
    for item in items:
        if not item.strip():
            continue
        key, val = item.split("=", 1)
        # Danger: evaluating untrusted string
        cache[key.strip()] = eval(val.strip())
    return cache

if __name__ == "__main__":
    raw_payload = "timeout=120; debug=True; auth_token='crypt-994'"
    print "Processed cache:", process_records(raw_payload)
`
    },
    js_callback: {
      lang: 'javascript',
      code: `// Legacy ES5 Asynchronous Data Loader (Callback Pyramid)
function fetchLegacySession(userId, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/v1/users/" + userId + "/token", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var token = JSON.parse(xhr.responseText).token;
        var xhr2 = new XMLHttpRequest();
        xhr2.open("GET", "/api/v1/vault?token=" + token, true);
        xhr2.onreadystatechange = function() {
          if (xhr2.readyState === 4 && xhr2.status === 200) {
            onSuccess(JSON.parse(xhr2.responseText));
          } else if (xhr2.readyState === 4) {
            onError("Vault retrieval failed");
          }
        };
        xhr2.send();
      } else {
        onError("Token retrieval failed");
      }
    }
  };
  xhr.send();
}`
    },
    sql_injection: {
      lang: 'sql',
      code: `-- Vulnerable Authentication and Query Routine
-- Python / Raw SQL dynamic string concatenation
def authenticate_user(db_cursor, username, password_hash):
    query = "SELECT id, role, email FROM user_archive WHERE username = '" + username + "' AND pass_hash = '" + password_hash + "'"
    db_cursor.execute(query)
    record = db_cursor.fetchone()
    if record:
        return {"status": "authenticated", "user": record}
    return {"status": "denied"}
`
    },
    c_memory: {
      lang: 'c',
      code: `/* Legacy C Log Buffer - Unsafe String Copy and Memory Leak */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void log_legacy_event(const char *incoming_tag, const char *msg) {
    char buffer[64];
    /* Unsafe: potential buffer overflow */
    strcpy(buffer, incoming_tag);
    strcat(buffer, ": ");
    strcat(buffer, msg);

    char *dynamic_record = (char *)malloc(strlen(buffer) + 1);
    strcpy(dynamic_record, buffer);

    printf("[ARCHIVE-LOG] %s\\n", dynamic_record);
    /* Notice: dynamic_record is never freed (memory leak) */
}
`
    }
  };

  // --- DOM Elements ---
  const codeInput = document.getElementById('code-input');
  const languageSelect = document.getElementById('language-select');
  const charCountEl = document.getElementById('char-count');
  const charWarningEl = document.getElementById('char-warning');
  const editorGutter = document.getElementById('editor-gutter');
  const clearBtn = document.getElementById('clear-btn');
  const exampleBtn = document.getElementById('example-btn');
  const exampleMenu = document.getElementById('example-menu');

  // Action Buttons
  const actionBtns = document.querySelectorAll('.action-btn');
  const actionExplainBtn = document.getElementById('action-explain');
  const actionScanBtn = document.getElementById('action-scan');
  const actionRestoreBtn = document.getElementById('action-restore');

  // Chamber States
  const stateEmpty = document.getElementById('state-empty');
  const stateLoading = document.getElementById('state-loading');
  const stateError = document.getElementById('state-error');
  const stateSuccess = document.getElementById('state-success');

  const loadingTitle = document.getElementById('loading-title');
  const loadingSubtitle = document.getElementById('loading-subtitle');
  const errorMessage = document.getElementById('error-message');
  const retryBtn = document.getElementById('retry-btn');
  const renderedOutput = document.getElementById('rendered-output');
  const resultActionBadge = document.getElementById('result-action-badge');
  const resultLangBadge = document.getElementById('result-lang-badge');
  const resultTimestamp = document.getElementById('result-timestamp');
  const copyFullBtn = document.getElementById('copy-full-btn');

  // Ollama Status & Header Elements
  const ollamaStatusBadge = document.getElementById('ollama-status-badge');
  const refreshStatusBtn = document.getElementById('refresh-status-btn');
  const connectionAlert = document.getElementById('connection-alert');
  const alertTitle = document.getElementById('alert-title');
  const alertMessage = document.getElementById('alert-message');
  const closeAlertBtn = document.getElementById('close-alert-btn');

  // Dossier Modal
  const openDossierBtn = document.getElementById('open-dossier-btn');
  const dossierModal = document.getElementById('dossier-modal');
  const closeDossierBtn = document.getElementById('close-dossier-btn');
  const modalDismissBtn = document.getElementById('modal-dismiss-btn');

  // Recent History Drawer
  const historyToggleBtn = document.getElementById('history-toggle-btn');
  const historyDrawer = document.getElementById('history-drawer');
  const closeHistoryBtn = document.getElementById('close-history-btn');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const toastContainer = document.getElementById('toast-container');

  // Internal State
  let lastSubmittedAction = null;
  let lastRawResult = '';
  const MAX_LIMIT = parseInt(codeInput.getAttribute('maxlength') || '15000', 10);
  const LOCAL_STORAGE_KEY = 'codecrypt_recent_history_v1';

  // ==========================================================================
  // Health & Connectivity Checks
  // ==========================================================================

  async function checkOllamaHealth() {
    ollamaStatusBadge.className = 'status-badge checking';
    const statusLabel = ollamaStatusBadge.querySelector('.status-label');
    statusLabel.textContent = 'Checking Ollama...';

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.online) {
        if (data.model_available) {
          ollamaStatusBadge.className = 'status-badge online';
          statusLabel.textContent = 'Ollama Online';
          ollamaStatusBadge.title = `Connected to ${data.url}. Model ${data.configured_model} is ready.`;
          hideConnectionAlert();
        } else {
          ollamaStatusBadge.className = 'status-badge offline';
          statusLabel.textContent = 'Model Missing';
          ollamaStatusBadge.title = `Model '${data.configured_model}' not found in Ollama.`;
          showConnectionAlert(
            'Target Model Missing',
            `Ollama is running, but model '${data.configured_model}' is not installed. Run 'ollama pull ${data.configured_model}' in your terminal.`
          );
        }
      } else {
        ollamaStatusBadge.className = 'status-badge offline';
        statusLabel.textContent = 'Ollama Offline';
        ollamaStatusBadge.title = data.message || 'Cannot reach Ollama';
        showConnectionAlert(
          'Ollama Service Offline',
          data.message || 'Cannot connect to Ollama. Run `ollama serve` in a terminal window.'
        );
      }
    } catch (err) {
      ollamaStatusBadge.className = 'status-badge offline';
      statusLabel.textContent = 'Service Offline';
      ollamaStatusBadge.title = 'Cannot reach backend /api/health';
      showConnectionAlert('Connection Error', 'Could not reach the CodeCrypt backend server.');
    }
  }

  function showConnectionAlert(title, message) {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    connectionAlert.classList.remove('hidden');
  }

  function hideConnectionAlert() {
    connectionAlert.classList.add('hidden');
  }

  // ==========================================================================
  // Code Editor Line Numbers & Character Counter
  // ==========================================================================

  function updateEditorMetrics() {
    const text = codeInput.value;
    const len = text.length;

    charCountEl.textContent = len.toLocaleString();

    const counterGroup = charCountEl.closest('.char-counter-group');
    if (len > MAX_LIMIT) {
      counterGroup.className = 'char-counter-group error';
      charWarningEl.textContent = 'Limit exceeded';
      charWarningEl.classList.remove('hidden');
    } else if (len > MAX_LIMIT * 0.85) {
      counterGroup.className = 'char-counter-group warning';
      charWarningEl.textContent = 'Approaching limit';
      charWarningEl.classList.remove('hidden');
    } else {
      counterGroup.className = 'char-counter-group';
      charWarningEl.classList.add('hidden');
    }

    // Update Line Numbers Gutter
    const lines = text.split('\n').length;
    const currentGutterLines = editorGutter.children.length;
    if (lines !== currentGutterLines) {
      // Rebuild gutter safely
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= Math.max(lines, 1); i++) {
        const span = document.createElement('span');
        span.textContent = i;
        frag.appendChild(span);
      }
      editorGutter.textContent = '';
      editorGutter.appendChild(frag);
    }

    // Synchronize gutter scroll
    editorGutter.scrollTop = codeInput.scrollTop;
  }

  codeInput.addEventListener('input', updateEditorMetrics);
  codeInput.addEventListener('scroll', () => {
    editorGutter.scrollTop = codeInput.scrollTop;
  });

  // Handle Tab indentation in textarea
  codeInput.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 4;
      updateEditorMetrics();
    }
  });

  // ==========================================================================
  // Sample Loader & Dropdown Management
  // ==========================================================================

  exampleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = exampleMenu.classList.contains('show');
    exampleMenu.classList.toggle('show', !isExpanded);
    exampleBtn.setAttribute('aria-expanded', String(!isExpanded));
  });

  document.addEventListener('click', (e) => {
    if (!exampleMenu.contains(e.target) && e.target !== exampleBtn) {
      exampleMenu.classList.remove('show');
      exampleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  exampleMenu.querySelectorAll('.dropdown-item').forEach((item) => {
    item.addEventListener('click', () => {
      const sampleKey = item.getAttribute('data-sample');
      const sample = SAMPLE_SNIPPETS[sampleKey];
      if (sample) {
        codeInput.value = sample.code;
        languageSelect.value = sample.lang;
        updateEditorMetrics();
        exampleMenu.classList.remove('show');
        exampleBtn.setAttribute('aria-expanded', 'false');
        showToast('Sample code loaded into editor');
      }
    });
  });

  clearBtn.addEventListener('click', () => {
    codeInput.value = '';
    updateEditorMetrics();
    showToast('Editor cleared');
    codeInput.focus();
  });

  // ==========================================================================
  // State Switching
  // ==========================================================================

  function setChamberState(state) {
    stateEmpty.classList.add('hidden');
    stateLoading.classList.add('hidden');
    stateError.classList.add('hidden');
    stateSuccess.classList.add('hidden');
    copyFullBtn.classList.add('hidden');

    if (state === 'empty') stateEmpty.classList.remove('hidden');
    else if (state === 'loading') stateLoading.classList.remove('hidden');
    else if (state === 'error') stateError.classList.remove('hidden');
    else if (state === 'success') {
      stateSuccess.classList.remove('hidden');
      copyFullBtn.classList.remove('hidden');
    }
  }

  function setButtonsBusy(isBusy) {
    actionBtns.forEach((btn) => {
      btn.disabled = isBusy;
      btn.setAttribute('aria-busy', String(isBusy));
    });
  }

  // ==========================================================================
  // Analysis Invocation & API Call
  // ==========================================================================

  async function triggerAnalysis(action) {
    const rawCode = codeInput.value.trim();

    if (!rawCode) {
      showToast('Please paste or write some code to analyze', 'error');
      codeInput.focus();
      return;
    }

    if (rawCode.length > MAX_LIMIT) {
      showToast(`Code exceeds limit (${rawCode.length.toLocaleString()} / ${MAX_LIMIT.toLocaleString()} chars)`, 'error');
      return;
    }

    lastSubmittedAction = action;
    const selectedLang = languageSelect.value;

    // Configure loading presentation based on action
    if (action === 'explain') {
      loadingTitle.textContent = 'Deciphering Code Logic...';
      loadingSubtitle.textContent = 'Gemma 2 is unpacking operations, flows, and assumptions.';
    } else if (action === 'scan') {
      loadingTitle.textContent = 'Scanning for Spectral Anomalies...';
      loadingSubtitle.textContent = 'Detecting bugs, security issues, and legacy smells.';
    } else if (action === 'restore') {
      loadingTitle.textContent = 'Reviving Forgotten Artifact...';
      loadingSubtitle.textContent = 'Modernizing, refactoring, and restructuring into modern code.';
    }

    setChamberState('loading');
    setButtonsBusy(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: rawCode,
          action: action,
          language: selectedLang
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        handleAnalysisError(data.error || 'Failed to complete analysis.', data.error_code);
      } else {
        handleAnalysisSuccess(data, action, selectedLang, rawCode);
      }
    } catch (err) {
      handleAnalysisError(
        'Network error: Failed to communicate with the CodeCrypt server. Ensure the Flask server is running.',
        'NETWORK_FAILURE'
      );
    } finally {
      setButtonsBusy(false);
    }
  }

  function handleAnalysisError(msg, errorCode) {
    setChamberState('error');
    errorMessage.textContent = msg;

    const troubleshootSteps = document.getElementById('troubleshoot-steps');
    troubleshootSteps.textContent = '';

    if (errorCode === 'OLLAMA_UNREACHABLE') {
      addTroubleshootStep(troubleshootSteps, 'Start Ollama service: run `ollama serve` in a terminal.');
      addTroubleshootStep(troubleshootSteps, 'Verify default endpoint at `http://localhost:11434`.');
    } else if (errorCode === 'MODEL_NOT_FOUND') {
      addTroubleshootStep(troubleshootSteps, 'Pull the required model: execute `ollama pull gemma2:2b`.');
      addTroubleshootStep(troubleshootSteps, 'Or configure another model via OLLAMA_MODEL environment variable.');
    } else if (errorCode === 'OLLAMA_TIMEOUT') {
      addTroubleshootStep(troubleshootSteps, 'Try submitting a smaller code snippet.');
      addTroubleshootStep(troubleshootSteps, 'Increase timeout by setting OLLAMA_TIMEOUT=180 in your environment.');
    } else {
      addTroubleshootStep(troubleshootSteps, 'Review the error details above.');
      addTroubleshootStep(troubleshootSteps, 'Verify that the local Ollama instance has sufficient GPU/RAM resources.');
    }
  }

  function addTroubleshootStep(parentEl, text) {
    const li = document.createElement('li');
    li.textContent = text;
    parentEl.appendChild(li);
  }

  function handleAnalysisSuccess(data, action, language, originalCode) {
    lastRawResult = data.result;

    resultActionBadge.textContent = action.toUpperCase();
    resultActionBadge.className = `badge badge-action action-${action}`;

    const displayLang = language === 'auto' ? 'Inferred' : language.toUpperCase();
    resultLangBadge.textContent = displayLang;

    const now = new Date();
    resultTimestamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Render markdown safely into the DOM container
    renderedOutput.textContent = '';
    renderSafeMarkdown(data.result, renderedOutput);

    setChamberState('success');

    // Save to browser localStorage history (optional recent sessions)
    saveToRecentHistory({
      action: action,
      language: language,
      codePreview: originalCode.slice(0, 100).replace(/\s+/g, ' '),
      fullCode: originalCode,
      result: data.result,
      timestamp: now.toISOString()
    });

    showToast('Analysis completed successfully');
  }

  retryBtn.addEventListener('click', () => {
    if (lastSubmittedAction) {
      triggerAnalysis(lastSubmittedAction);
    }
  });

  // Action Button Listeners
  actionExplainBtn.addEventListener('click', () => triggerAnalysis('explain'));
  actionScanBtn.addEventListener('click', () => triggerAnalysis('scan'));
  actionRestoreBtn.addEventListener('click', () => triggerAnalysis('restore'));

  // ==========================================================================
  // SAFE DOM MARKDOWN PARSER
  // Strictly renders markdown to DOM nodes WITHOUT using arbitrary innerHTML.
  // Protects against model hallucination XSS or malicious code output.
  // ==========================================================================

  function renderSafeMarkdown(markdownText, targetElement) {
    const lines = markdownText.split('\n');
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockBuffer = [];
    let currentList = null;

    function flushList() {
      if (currentList) {
        targetElement.appendChild(currentList);
        currentList = null;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Block Detection (```lang)
      if (line.trim().startsWith('```')) {
        flushList();
        if (inCodeBlock) {
          // Closing code block
          const codeContent = codeBlockBuffer.join('\n');
          const codeContainer = createSafeCodeBlockElement(codeBlockLang, codeContent);
          targetElement.appendChild(codeContainer);
          inCodeBlock = false;
          codeBlockBuffer = [];
          codeBlockLang = '';
        } else {
          // Opening code block
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim() || 'code';
          codeBlockBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockBuffer.push(line);
        continue;
      }

      // Empty line -> flush list and skip
      if (!line.trim()) {
        flushList();
        continue;
      }

      // Headings: ###, ##, #
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const headingTag = level === 1 ? 'h2' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
        const headingEl = document.createElement(headingTag);
        appendFormattedInlineText(headingEl, headingText);
        targetElement.appendChild(headingEl);
        continue;
      }

      // Unordered List Items: - item or * item
      const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (ulMatch) {
        if (!currentList || currentList.tagName.toLowerCase() !== 'ul') {
          flushList();
          currentList = document.createElement('ul');
        }
        const li = document.createElement('li');
        appendFormattedInlineText(li, ulMatch[2]);
        currentList.appendChild(li);
        continue;
      }

      // Ordered List Items: 1. item
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!currentList || currentList.tagName.toLowerCase() !== 'ol') {
          flushList();
          currentList = document.createElement('ol');
        }
        const li = document.createElement('li');
        appendFormattedInlineText(li, olMatch[2]);
        currentList.appendChild(li);
        continue;
      }

      // Regular paragraph
      flushList();
      const p = document.createElement('p');
      appendFormattedInlineText(p, line);
      targetElement.appendChild(p);
    }

    // Flush any pending list or unclosed code block
    flushList();
    if (inCodeBlock && codeBlockBuffer.length > 0) {
      const codeContent = codeBlockBuffer.join('\n');
      const codeContainer = createSafeCodeBlockElement(codeBlockLang, codeContent);
      targetElement.appendChild(codeContainer);
    }
  }

  /**
   * Builds a safe DOM container for code blocks with language header and copy button.
   */
  function createSafeCodeBlockElement(language, codeContent) {
    const container = document.createElement('div');
    container.className = 'code-block-container';

    // Header bar
    const header = document.createElement('div');
    header.className = 'code-block-header';

    const langSpan = document.createElement('span');
    langSpan.className = 'code-block-lang';
    langSpan.textContent = language;
    header.appendChild(langSpan);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.setAttribute('type', 'button');
    copyBtn.textContent = 'Copy Code';

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeContent);
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => {
          copyBtn.textContent = 'Copy Code';
        }, 2000);
        showToast('Code block copied to clipboard');
      } catch (err) {
        showToast('Failed to copy to clipboard', 'error');
      }
    });

    header.appendChild(copyBtn);
    container.appendChild(header);

    // Pre & Code
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = codeContent; // TextContent is 100% safe against XSS
    pre.appendChild(code);
    container.appendChild(pre);

    return container;
  }

  /**
   * Safely parse inline styles: inline code `...`, bold **...**,
   * italic *...*, and severity badges [Severity: ...] without innerHTML.
   */
  function appendFormattedInlineText(parentEl, rawText) {
    // Check for severity badge pattern at start: [Severity: Critical] or [Critical]
    let textToParse = rawText;
    const severityMatch = textToParse.match(/^\[?(Severity:\s*)?(Critical|Warning|Notice|High|Medium|Low)\]?\s*[:-]?\s*/i);

    if (severityMatch) {
      const level = severityMatch[2].toLowerCase();
      const tag = document.createElement('span');
      tag.className = `severity-tag severity-${level === 'high' ? 'critical' : level === 'medium' ? 'warning' : level === 'low' ? 'notice' : level}`;
      tag.textContent = severityMatch[2].toUpperCase();
      parentEl.appendChild(tag);
      textToParse = textToParse.slice(severityMatch[0].length);
    }

    // Tokenize text for inline code (`code`), bold (**text**), and italic (*text*)
    // Regex splits by backticks first
    const codeTokens = textToParse.split(/(`[^`]+`)/g);

    for (const token of codeTokens) {
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        const inlineCode = document.createElement('code');
        inlineCode.className = 'inline-code';
        inlineCode.textContent = token.slice(1, -1);
        parentEl.appendChild(inlineCode);
      } else {
        // Parse bold and italics within this token
        parseBoldAndItalic(parentEl, token);
      }
    }
  }

  function parseBoldAndItalic(parentEl, text) {
    // Split by bold (**bold**)
    const boldTokens = text.split(/(\*\*[^*]+\*\*)/g);

    for (const bToken of boldTokens) {
      if (bToken.startsWith('**') && bToken.endsWith('**') && bToken.length >= 4) {
        const strong = document.createElement('strong');
        strong.textContent = bToken.slice(2, -2);
        parentEl.appendChild(strong);
      } else {
        // Split by italic (*italic*)
        const italicTokens = bToken.split(/(\*[^*]+\*)/g);
        for (const iToken of italicTokens) {
          if (iToken.startsWith('*') && iToken.endsWith('*') && iToken.length >= 2) {
            const em = document.createElement('em');
            em.textContent = iToken.slice(1, -1);
            parentEl.appendChild(em);
          } else {
            // Safe regular text node
            parentEl.appendChild(document.createTextNode(iToken));
          }
        }
      }
    }
  }

  // ==========================================================================
  // Full Report Copy Button
  // ==========================================================================

  copyFullBtn.addEventListener('click', async () => {
    if (!lastRawResult) return;
    try {
      await navigator.clipboard.writeText(lastRawResult);
      const span = copyFullBtn.querySelector('.copy-text');
      const originalText = span.textContent;
      span.textContent = '✓ Copied!';
      setTimeout(() => {
        span.textContent = originalText;
      }, 2000);
      showToast('Full analysis report copied to clipboard');
    } catch (err) {
      showToast('Failed to copy report to clipboard', 'error');
    }
  });

  // ==========================================================================
  // Recent History Drawer (Local Storage Only)
  // ==========================================================================

  function getStoredHistory() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToRecentHistory(item) {
    try {
      const history = getStoredHistory();
      history.unshift(item);
      const trimmed = history.slice(0, 10); // Keep last 10
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
      renderHistoryList();
    } catch (e) {
      // Storage quota or disabled; fail gracefully
    }
  }

  function renderHistoryList() {
    const history = getStoredHistory();
    historyList.textContent = '';

    if (history.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.className = 'drawer-notice';
      emptyNote.textContent = 'No recent analyses recorded yet.';
      historyList.appendChild(emptyNote);
      return;
    }

    history.forEach((entry, idx) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const cardHeader = document.createElement('div');
      cardHeader.className = 'history-card-header';

      const actionBadge = document.createElement('span');
      actionBadge.className = 'badge badge-action';
      actionBadge.textContent = entry.action.toUpperCase();

      const timeSpan = document.createElement('span');
      timeSpan.className = 'meta-time';
      const timeDate = new Date(entry.timestamp);
      timeSpan.textContent = isNaN(timeDate.getTime()) ? '' : timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      cardHeader.appendChild(actionBadge);
      cardHeader.appendChild(timeSpan);
      card.appendChild(cardHeader);

      const snippetEl = document.createElement('div');
      snippetEl.className = 'history-snippet';
      snippetEl.textContent = entry.codePreview || '(Snippet)';
      card.appendChild(snippetEl);

      card.addEventListener('click', () => {
        codeInput.value = entry.fullCode || '';
        languageSelect.value = entry.language || 'auto';
        updateEditorMetrics();

        // Restore rendered output
        lastRawResult = entry.result;
        resultActionBadge.textContent = entry.action.toUpperCase();
        resultLangBadge.textContent = (entry.language || 'auto').toUpperCase();
        resultTimestamp.textContent = isNaN(timeDate.getTime()) ? 'Stored' : timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        renderedOutput.textContent = '';
        renderSafeMarkdown(entry.result, renderedOutput);
        setChamberState('success');
        historyDrawer.classList.add('hidden');
        showToast('Restored previous analysis from local storage');
      });

      historyList.appendChild(card);
    });
  }

  historyToggleBtn.addEventListener('click', () => {
    const isHidden = historyDrawer.classList.contains('hidden');
    if (isHidden) {
      renderHistoryList();
      historyDrawer.classList.remove('hidden');
    } else {
      historyDrawer.classList.add('hidden');
    }
  });

  closeHistoryBtn.addEventListener('click', () => {
    historyDrawer.classList.add('hidden');
  });

  clearHistoryBtn.addEventListener('click', () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      renderHistoryList();
      showToast('Local history cleared');
    } catch (e) {}
  });

  // ==========================================================================
  // Dossier Modal
  // ==========================================================================

  function openDossier() {
    dossierModal.classList.remove('hidden');
  }

  function closeDossier() {
    dossierModal.classList.add('hidden');
  }

  openDossierBtn.addEventListener('click', openDossier);
  closeDossierBtn.addEventListener('click', closeDossier);
  modalDismissBtn.addEventListener('click', closeDossier);

  dossierModal.addEventListener('click', (e) => {
    if (e.target === dossierModal) closeDossier();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDossier();
      historyDrawer.classList.add('hidden');
      exampleMenu.classList.remove('show');
    }
  });

  // Refresh status button & badge click
  refreshStatusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    checkOllamaHealth();
  });

  ollamaStatusBadge.addEventListener('click', () => {
    checkOllamaHealth();
  });

  closeAlertBtn.addEventListener('click', hideConnectionAlert);

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;

    const icon = document.createElement('span');
    icon.textContent = type === 'error' ? '⚠️' : '⚡';
    toast.appendChild(icon);

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  updateEditorMetrics();
  checkOllamaHealth();

})();
