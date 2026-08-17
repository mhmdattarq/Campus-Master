/**
 * CampusMiner AI - Main Application Controller (Tune-Up Edition)
 * High-performance, debounced, non-blocking UI Orchestrator
 * Supports Web URL Crawler, PDF/Word Parser & Knowledge Extractor / Chatbot Synthesizer
 */

document.addEventListener('DOMContentLoaded', () => {
  const { yieldToMain, debounce, ConcurrencyQueue, renderInChunks } = window.PerfUtils;

  // Clear any existing residual history storage for privacy & security
  try {
    localStorage.removeItem('campusminer_history');
  } catch (e) {}

  // Initialize Services
  const webExtractor = new CampusExtractor();
  const docExtractor = new DocumentExtractor();
  const knowledgeExtractor = new KnowledgeExtractor();
  const batchQueue = new ConcurrencyQueue(2);

  let currentWebDataset = null;
  let currentDocDataset = null;
  let currentKnowledgeDataset = null;
  let currentDocPage = 1;
  let activeAbortController = null;

  // Mode Switcher Elements
  const navModeWeb = document.getElementById('nav-mode-web');
  const navModeDoc = document.getElementById('nav-mode-doc');
  const navModeKnowledge = document.getElementById('nav-mode-knowledge');
  const modeWebContainer = document.getElementById('mode-web-container');
  const modeDocContainer = document.getElementById('mode-doc-container');
  const modeKnowledgeContainer = document.getElementById('mode-knowledge-container');

  // Web Crawler Form Elements
  const crawlerForm = document.getElementById('crawler-form');
  const targetUrlInput = document.getElementById('target-url-input');
  const btnPasteClipboard = document.getElementById('btn-paste-clipboard');
  const btnClearInput = document.getElementById('btn-clear-input');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  // Doc Crawler Form Elements
  const tabDocUpload = document.getElementById('tab-doc-upload');
  const tabDocUrl = document.getElementById('tab-doc-url');
  const docPanelUpload = document.getElementById('doc-panel-upload');
  const docPanelUrl = document.getElementById('doc-panel-url');
  const docDropzone = document.getElementById('doc-dropzone');
  const docFileInput = document.getElementById('doc-file-input');
  const docUrlForm = document.getElementById('doc-url-form');
  const docUrlInput = document.getElementById('doc-url-input');
  const btnPasteDocUrl = document.getElementById('btn-paste-doc-url');

  // Knowledge Extractor Elements
  const tabKbText = document.getElementById('tab-kb-text');
  const tabKbFile = document.getElementById('tab-kb-file');
  const tabKbUrl = document.getElementById('tab-kb-url');
  const kbPanelText = document.getElementById('kb-panel-text');
  const kbPanelFile = document.getElementById('kb-panel-file');
  const kbPanelUrl = document.getElementById('kb-panel-url');
  const kbTextForm = document.getElementById('kb-text-form');
  const kbTextInput = document.getElementById('kb-text-input');
  const kbTextChars = document.getElementById('kb-text-chars');
  const kbTextWords = document.getElementById('kb-text-words');
  const kbDropzone = document.getElementById('kb-dropzone');
  const kbFileInput = document.getElementById('kb-file-input');
  const kbUrlForm = document.getElementById('kb-url-form');
  const kbUrlInput = document.getElementById('kb-url-input');
  const btnPasteKbUrl = document.getElementById('btn-paste-kb-url');

  // Telemetry & Error
  const telemetrySection = document.getElementById('telemetry-section');
  const telemetryStatusText = document.getElementById('telemetry-status-text');
  const telemetryUrlText = document.getElementById('telemetry-url-text');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const telemetryLogs = document.getElementById('telemetry-logs');
  const btnCancelCrawl = document.getElementById('btn-cancel-crawl');
  const errorSection = document.getElementById('error-section');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');
  const btnRetryCrawl = document.getElementById('btn-retry-crawl');

  // Workspace Web
  const workspaceSection = document.getElementById('workspace-section');
  const landingFeatures = document.getElementById('landing-features');
  const tabBtns = document.querySelectorAll('.tabs-nav-bar:not(#doc-tabs-nav-bar):not(#kb-tabs-nav-bar) .tab-btn');
  const tabPanes = document.querySelectorAll('.workspace-tabs-container:not(#doc-workspace-section .workspace-tabs-container):not(#knowledge-workspace-section .workspace-tabs-container) > .tab-pane');
  const statBoxes = document.querySelectorAll('.workspace-header-card:not(#doc-workspace-section .workspace-header-card):not(#knowledge-workspace-section .workspace-header-card) .stat-box');
  const btnNewScrape = document.getElementById('btn-new-scrape');

  // Export Web
  const btnExportMain = document.getElementById('btn-export-main');
  const exportDropdownMenu = document.getElementById('export-dropdown-menu');
  const actExportExcel = document.getElementById('act-export-excel');
  const actExportJson = document.getElementById('act-export-json');
  const actExportCsv = document.getElementById('act-export-csv');
  const actExportMarkdown = document.getElementById('act-export-markdown');
  const actCopySummary = document.getElementById('act-copy-summary');
  const btnExportProdiCsv = document.getElementById('btn-export-prodi-csv');

  // Workspace Doc Elements
  const docWorkspaceSection = document.getElementById('doc-workspace-section');
  const docTabBtns = document.querySelectorAll('#doc-tabs-nav-bar .tab-btn');
  const docTabPanes = document.querySelectorAll('#doc-workspace-section .tab-pane');
  const docStatBoxes = document.querySelectorAll('#doc-workspace-section .stat-box');
  const btnNewDocScrape = document.getElementById('btn-new-doc-scrape');
  const docPageSelect = document.getElementById('doc-page-select');
  const btnPrevDocPage = document.getElementById('btn-prev-doc-page');
  const btnNextDocPage = document.getElementById('btn-next-doc-page');
  const docSearchInput = document.getElementById('doc-search-input');
  const docCurrentPageText = document.getElementById('doc-current-page-text');

  // Export Doc
  const btnExportDocMain = document.getElementById('btn-export-doc-main');
  const exportDocDropdownMenu = document.getElementById('export-doc-dropdown-menu');
  const actDocExportExcel = document.getElementById('act-doc-export-excel');
  const actDocExportJson = document.getElementById('act-doc-export-json');
  const actDocExportCsv = document.getElementById('act-doc-export-csv');
  const actDocExportMarkdown = document.getElementById('act-doc-export-markdown');

  // Workspace Knowledge Elements
  const knowledgeWorkspaceSection = document.getElementById('knowledge-workspace-section');
  const kbTabBtns = document.querySelectorAll('#kb-tabs-nav-bar .tab-btn');
  const kbTabPanes = document.querySelectorAll('#knowledge-workspace-section .tab-pane');
  const kbStatBoxes = document.querySelectorAll('#knowledge-workspace-section .stat-box');
  const btnNewKbScrape = document.getElementById('btn-new-kb-scrape');
  const filterKbQaInput = document.getElementById('filter-kb-qa-input');

  // Knowledge Export Elements
  const btnExportKbMain = document.getElementById('btn-export-kb-main');
  const exportKbDropdownMenu = document.getElementById('export-kb-dropdown-menu');
  const actKbExportJsonl = document.getElementById('act-kb-export-jsonl');
  const actKbExportRag = document.getElementById('act-kb-export-rag');
  const actKbExportSystemPrompt = document.getElementById('act-kb-export-system-prompt');
  const actKbExportExcel = document.getElementById('act-kb-export-excel');

  // Simulator Elements
  const simChatMessages = document.getElementById('sim-chat-messages');
  const simChatForm = document.getElementById('sim-chat-form');
  const simChatInput = document.getElementById('sim-chat-input');
  const simChatSuggestions = document.getElementById('sim-chat-suggestions');
  const btnClearChat = document.getElementById('btn-clear-chat');

  // Modals
  const btnBatchModal = document.getElementById('btn-batch-modal');
  const modalBatch = document.getElementById('modal-batch');
  const btnCloseBatchModal = document.getElementById('btn-close-batch-modal');
  const btnCancelBatch = document.getElementById('btn-cancel-batch');
  const btnStartBatch = document.getElementById('btn-start-batch');
  const batchUrlsTextarea = document.getElementById('batch-urls-textarea');
  const batchStatusPanel = document.getElementById('batch-status-panel');
  const batchProgressText = document.getElementById('batch-progress-text');
  const batchProgressFill = document.getElementById('batch-progress-fill');

  const btnManualHtmlModal = document.getElementById('btn-manual-html-modal');
  const modalManualHtml = document.getElementById('modal-manual-html');
  const btnCloseManualModal = document.getElementById('btn-close-manual-modal');
  const btnCancelManual = document.getElementById('btn-cancel-manual');
  const btnProcessManualHtml = document.getElementById('btn-process-manual-html');
  const manualHtmlTextarea = document.getElementById('manual-html-textarea');
  const manualHtmlUrl = document.getElementById('manual-html-url');

  // Interactive filters
  const filterProdiInput = document.getElementById('filter-prodi-input');
  const jenjangFilterPills = document.querySelectorAll('#jenjang-filter-pills .filter-chip');
  const filterDocsInput = document.getElementById('filter-docs-input');

  // Initialize Theme
  initTheme();
  refreshLucide();

  /* ==========================================================================
     Top Mode Switcher (Web URL vs PDF/Word vs Knowledge Extractor)
     ========================================================================== */

  navModeWeb.addEventListener('click', () => switchCrawlerMode('web'));
  navModeDoc.addEventListener('click', () => switchCrawlerMode('doc'));
  navModeKnowledge.addEventListener('click', () => switchCrawlerMode('knowledge'));

  function switchCrawlerMode(mode) {
    navModeWeb.classList.toggle('active', mode === 'web');
    navModeDoc.classList.toggle('active', mode === 'doc');
    navModeKnowledge.classList.toggle('active', mode === 'knowledge');

    modeWebContainer.classList.toggle('hidden', mode !== 'web');
    modeDocContainer.classList.toggle('hidden', mode !== 'doc');
    modeKnowledgeContainer.classList.toggle('hidden', mode !== 'knowledge');

    workspaceSection.classList.add('hidden');
    docWorkspaceSection.classList.add('hidden');
    knowledgeWorkspaceSection.classList.add('hidden');

    if (mode === 'web' && currentWebDataset) {
      workspaceSection.classList.remove('hidden');
      landingFeatures.classList.add('hidden');
    } else if (mode === 'doc' && currentDocDataset) {
      docWorkspaceSection.classList.remove('hidden');
      landingFeatures.classList.add('hidden');
    } else if (mode === 'knowledge' && currentKnowledgeDataset) {
      knowledgeWorkspaceSection.classList.remove('hidden');
      landingFeatures.classList.add('hidden');
    } else {
      landingFeatures.classList.remove('hidden');
    }

    refreshLucide();
  }

  /* ==========================================================================
     Knowledge Extractor Form & Ingestion Handlers
     ========================================================================== */

  tabKbText.addEventListener('click', () => {
    tabKbText.classList.add('active');
    tabKbFile.classList.remove('active');
    tabKbUrl.classList.remove('active');
    kbPanelText.classList.remove('hidden');
    kbPanelText.classList.add('active');
    kbPanelFile.classList.add('hidden');
    kbPanelFile.classList.remove('active');
    kbPanelUrl.classList.add('hidden');
    kbPanelUrl.classList.remove('active');
    kbTextInput.focus();
  });

  tabKbFile.addEventListener('click', () => {
    tabKbFile.classList.add('active');
    tabKbText.classList.remove('active');
    tabKbUrl.classList.remove('active');
    kbPanelFile.classList.remove('hidden');
    kbPanelFile.classList.add('active');
    kbPanelText.classList.add('hidden');
    kbPanelText.classList.remove('active');
    kbPanelUrl.classList.add('hidden');
    kbPanelUrl.classList.remove('active');
  });

  tabKbUrl.addEventListener('click', () => {
    tabKbUrl.classList.add('active');
    tabKbText.classList.remove('active');
    tabKbFile.classList.remove('active');
    kbPanelUrl.classList.remove('hidden');
    kbPanelUrl.classList.add('active');
    kbPanelText.classList.add('hidden');
    kbPanelText.classList.remove('active');
    kbPanelFile.classList.add('hidden');
    kbPanelFile.classList.remove('active');
    kbUrlInput.focus();
  });

  kbTextInput.addEventListener('input', debounce(() => {
    const text = kbTextInput.value;
    kbTextChars.textContent = text.length;
    kbTextWords.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
  }, 100));

  btnPasteKbUrl?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        kbUrlInput.value = text.trim();
        kbUrlInput.focus();
        showToast('Link baru berhasil dipaste!', 'info');
      } else {
        showToast('Clipboard kosong.', 'warning');
      }
    } catch (e) {
      kbUrlInput.focus();
      kbUrlInput.select();
      showToast('Tekan Ctrl+V / Cmd+V untuk paste link', 'info');
    }
  });

  // Handle Drag & Drop for Knowledge Extractor (Images, PDFs, Docs, TXT)
  ['dragenter', 'dragover'].forEach(eventName => {
    kbDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      kbDropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    kbDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      kbDropzone.classList.remove('dragover');
    }, false);
  });

  kbDropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleKnowledgeFile(files[0]);
    }
  });

  kbFileInput.addEventListener('change', () => {
    if (kbFileInput.files.length > 0) {
      handleKnowledgeFile(kbFileInput.files[0]);
    }
  });

  // Submit Text Input Flow
  kbTextForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = kbTextInput.value.trim();
    if (!text) return;

    errorSection.classList.add('hidden');
    showTelemetry('Teks Input Pengguna');
    updateProgress(25, 'Menganalisis teks & mengekstrak keyword...');

    try {
      const dataset = await knowledgeExtractor.extractKnowledge(text, 'Teks Input Manual', (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(100, 'Selesai!');
      setTimeout(() => {
        hideTelemetry();
        renderKnowledgeDataset(dataset);
        showToast('Knowledge Base Chatbot berhasil diekstrak!', 'success');
      }, 300);
    } catch (err) {
      hideTelemetry();
      showError('Gagal Mengekstrak Knowledge', err.message);
    }
  });

  // Submit URL Scraping to Knowledge Flow
  kbUrlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = kbUrlInput.value.trim();
    if (!url) return;

    errorSection.classList.add('hidden');
    showTelemetry(url);
    updateProgress(20, 'Mengambil halaman website...');

    try {
      const { html, url: finalUrl } = await webExtractor.fetchWebpage(url, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(50, 'Mengekstrak teks & entitas...');
      const webData = await webExtractor.extractCampusData(html, finalUrl, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      const fullSourceText = (webData.cleanContent?.text || '') + '\n\n' + JSON.stringify(webData.identity) + '\n\n' + JSON.stringify(webData.academic);
      
      updateProgress(75, 'Menyintesis Knowledge Base & Q&A Chatbot...');
      const dataset = await knowledgeExtractor.extractKnowledge(fullSourceText, webData.identity?.name || finalUrl, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(100, 'Selesai!');
      setTimeout(() => {
        hideTelemetry();
        renderKnowledgeDataset(dataset);
        showToast(`Knowledge Base ${webData.identity?.name || 'Website'} berhasil diekstrak!`, 'success');
      }, 300);
    } catch (err) {
      hideTelemetry();
      showError('Gagal Scrape ke Knowledge Base', err.message);
    }
  });

  // File & Image Ingestion Dispatcher
  async function handleKnowledgeFile(file) {
    const filename = file.name;
    const lowerName = filename.toLowerCase();

    errorSection.classList.add('hidden');
    showTelemetry(filename);

    const isImage = lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp') || lowerName.endsWith('.bmp');
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    try {
      if (isImage) {
        updateProgress(20, 'Memulai OCR Tesseract untuk membaca teks dalam gambar...');
        const extractedText = await knowledgeExtractor.extractTextFromImage(file, (tag, msg) => {
          appendTelemetryLog(tag, msg);
        });

        updateProgress(70, 'Mengekstrak Knowledge Base & Keyword dari hasil OCR...');
        const dataset = await knowledgeExtractor.extractKnowledge(extractedText, `Gambar (${filename})`, (tag, msg) => {
          appendTelemetryLog(tag, msg);
        });

        updateProgress(100, 'Selesai!');
        setTimeout(() => {
          hideTelemetry();
          renderKnowledgeDataset(dataset);
          showToast(`OCR & Ekstraksi ${filename} berhasil!`, 'success');
        }, 300);

      } else if (isPdf || isDocx) {
        updateProgress(30, `Membaca struktur dokumen ${filename}...`);
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const buffer = e.target.result;
            const docData = await docExtractor.processDocumentBuffer(buffer, filename, (tag, msg) => {
              appendTelemetryLog(tag, msg);
            });

            updateProgress(70, 'Menyintesis Knowledge Base & Q&A dari Dokumen...');
            const dataset = await knowledgeExtractor.extractKnowledge(docData.fullText, filename, (tag, msg) => {
              appendTelemetryLog(tag, msg);
            });

            updateProgress(100, 'Selesai!');
            setTimeout(() => {
              hideTelemetry();
              renderKnowledgeDataset(dataset);
              showToast(`Knowledge Base Dokumen ${filename} berhasil dibuat!`, 'success');
            }, 300);
          } catch (err) {
            hideTelemetry();
            showError('Gagal Memproses Dokumen', err.message);
          }
        };
        reader.readAsArrayBuffer(file);

      } else {
        // Plain text, Markdown, CSV, JSON
        updateProgress(30, `Membaca teks berkas ${filename}...`);
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const textContent = e.target.result;
            updateProgress(65, 'Mengekstrak Q&A dan kata kunci chatbot...');
            const dataset = await knowledgeExtractor.extractKnowledge(textContent, filename, (tag, msg) => {
              appendTelemetryLog(tag, msg);
            });

            updateProgress(100, 'Selesai!');
            setTimeout(() => {
              hideTelemetry();
              renderKnowledgeDataset(dataset);
              showToast(`Knowledge Base ${filename} berhasil diekstrak!`, 'success');
            }, 300);
          } catch (err) {
            hideTelemetry();
            showError('Gagal Membaca File', err.message);
          }
        };
        reader.readAsText(file);
      }

    } catch (err) {
      hideTelemetry();
      showError('Gagal Mengekstrak File', err.message);
    }
  }

  /* ==========================================================================
     Render Knowledge Base Dataset to Workspace
     ========================================================================== */

  async function renderKnowledgeDataset(data) {
    currentKnowledgeDataset = data;

    document.getElementById('res-kb-title').textContent = `Dataset Chatbot: ${data.sourceName}`;
    document.getElementById('res-kb-source-name').textContent = data.sourceName;
    document.getElementById('res-kb-timestamp').textContent = new Date(data.timestamp).toLocaleTimeString('id-ID');
    document.getElementById('res-kb-tokens').textContent = data.estimatedTokens.toLocaleString('id-ID');

    const totalQA = data.qaPairs?.length || 0;
    const totalKW = data.keywords?.primary?.length || 0;
    const totalChunks = data.ragChunks?.length || 0;

    document.getElementById('stat-kb-qa-count').textContent = totalQA;
    document.getElementById('stat-kb-keywords-count').textContent = totalKW;
    document.getElementById('stat-kb-chunks-count').textContent = totalChunks;

    document.getElementById('kb-tab-badge-qa').textContent = totalQA;
    document.getElementById('kb-tab-badge-kw').textContent = totalKW;

    // Render Tab 1: Q&A Cards (chunked to prevent lag)
    const qaContainer = document.getElementById('kb-qa-cards-container');
    if (data.qaPairs && data.qaPairs.length > 0) {
      await renderInChunks(qaContainer, data.qaPairs, (qa) => `
        <div class="kb-qa-card" data-question="${escapeHtml(qa.question.toLowerCase())}" data-intent="${escapeHtml(qa.intent.toLowerCase())}">
          <div class="kb-qa-header">
            <span class="kb-qa-intent"><i data-lucide="tag"></i> ${qa.intent}</span>
            <span class="kb-qa-confidence">${qa.confidence}</span>
          </div>
          <div class="kb-qa-question">${escapeHtml(qa.question)}</div>
          <div class="kb-qa-answer">${escapeHtml(qa.answer)}</div>
          <div class="kb-qa-aliases">
            <span class="kb-qa-aliases-title">Variasi Pertanyaan (User Aliases):</span>
            ${(qa.aliases || []).map(a => `<span>• ${escapeHtml(a)}</span>`).join('')}
          </div>
          <div class="kb-qa-keywords">
            ${(qa.triggerKeywords || []).map(k => `<span class="kb-qa-tag">${escapeHtml(k)}</span>`).join('')}
          </div>
          <div class="kb-qa-card-footer">
            <button class="btn-ghost-sm btn-copy-single-qa" data-answer="${escapeHtml(qa.answer)}" title="Copy Jawaban"><i data-lucide="copy"></i> Copy</button>
          </div>
        </div>
      `, 20);

      document.querySelectorAll('.btn-copy-single-qa').forEach(btn => {
        btn.onclick = async () => {
          await navigator.clipboard.writeText(btn.dataset.answer);
          showToast('Jawaban disalin ke clipboard!', 'success');
        };
      });
    } else {
      qaContainer.innerHTML = '<div class="empty-state"><i data-lucide="help-circle"></i><p>Tidak ada Q&A yang terbentuk.</p></div>';
    }

    // Render Tab 2: Keywords Cloud & Intent Synonyms
    renderKeywordsView(data.keywords);

    // Render Tab 3: Chatbot Simulator Playground Setup
    setupChatbotSimulator(data.qaPairs);

    // Render Tab 4: System Prompt & RAG Chunks
    document.getElementById('kb-system-prompt-viewer').textContent = data.systemPrompt || '';
    document.getElementById('kb-rag-chunks-viewer').textContent = JSON.stringify(data.ragChunks || [], null, 2);

    // Render Tab 5: Source Text
    document.getElementById('kb-source-text-viewer').textContent = data.rawText || '';

    knowledgeWorkspaceSection.classList.remove('hidden');
    landingFeatures.classList.add('hidden');
    knowledgeWorkspaceSection.scrollIntoView({ behavior: 'smooth' });

    refreshLucide();
  }

  function renderKeywordsView(keywords) {
    const primaryContainer = document.getElementById('kb-primary-keywords-list');
    const phrasesContainer = document.getElementById('kb-phrases-keywords-list');
    const synonymsContainer = document.getElementById('kb-synonyms-container');

    let primaryHtml = '';
    (keywords.primary || []).forEach(k => {
      primaryHtml += `<span class="keyword-pill">${escapeHtml(k.keyword)} <span class="keyword-pill-count">${k.frequency}x</span></span>`;
    });
    primaryContainer.innerHTML = primaryHtml || '<p class="text-subtle">Tidak ada keyword terdeteksi.</p>';

    let phrasesHtml = '';
    (keywords.phrases || []).forEach(p => {
      phrasesHtml += `<span class="keyword-pill">${escapeHtml(p)}</span>`;
    });
    phrasesContainer.innerHTML = phrasesHtml || '<p class="text-subtle">Tidak ada frasa terdeteksi.</p>';

    let synHtml = '';
    (keywords.synonyms || []).forEach(s => {
      synHtml += `
        <div class="synonym-card">
          <div class="synonym-card-header"><i data-lucide="layers"></i> KATEGORI: ${s.category}</div>
          <div class="synonym-card-triggers">Trigger Words: <strong>${s.triggers.join(', ')}</strong></div>
          <div class="synonym-card-variations">
            ${s.userVariations.map(v => `<div class="variation-item"><i data-lucide="corner-down-right"></i> "${escapeHtml(v)}"</div>`).join('')}
          </div>
        </div>
      `;
    });
    synonymsContainer.innerHTML = synHtml || '<p class="text-subtle">Tidak ada klasifikasi intent.</p>';
  }

  // Interactive Chatbot Simulator
  function setupChatbotSimulator(qaPairs) {
    simChatMessages.innerHTML = `
      <div class="chat-msg chat-msg-bot">
        <div class="chat-avatar"><i data-lucide="bot"></i></div>
        <div class="chat-bubble">
          <p>Halo! Saya adalah AI Chatbot berbasis <strong>Knowledge Base yang telah diekstrak</strong>. Silakan coba tanyakan pertanyaan apa saja di bawah ini atau klik saran pertanyaan:</p>
          <div class="chat-suggestions" id="sim-chat-suggestions"></div>
        </div>
      </div>
    `;

    const suggestionsBox = document.getElementById('sim-chat-suggestions');
    if (suggestionsBox && qaPairs.length > 0) {
      const topSamples = qaPairs.slice(0, 4);
      topSamples.forEach(qa => {
        const chip = document.createElement('button');
        chip.className = 'chat-suggestion-chip';
        chip.textContent = qa.aliases?.[0] || qa.question;
        chip.onclick = () => {
          simChatInput.value = chip.textContent;
          simChatForm.dispatchEvent(new Event('submit'));
        };
        suggestionsBox.appendChild(chip);
      });
    }

    refreshLucide();
  }

  simChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = simChatInput.value.trim();
    if (!query || !currentKnowledgeDataset?.qaPairs) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg chat-msg-user';
    userMsg.innerHTML = `<div class="chat-avatar"><i data-lucide="user"></i></div><div class="chat-bubble">${escapeHtml(query)}</div>`;
    simChatMessages.appendChild(userMsg);
    simChatInput.value = '';
    simChatMessages.scrollTop = simChatMessages.scrollHeight;

    // Simulate Bot Typing & Matching
    setTimeout(() => {
      const result = knowledgeExtractor.simulateChatbotAnswer(query, currentKnowledgeDataset.qaPairs);
      
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg chat-msg-bot';
      botMsg.innerHTML = `
        <div class="chat-avatar"><i data-lucide="bot"></i></div>
        <div class="chat-bubble">
          <p>${escapeHtml(result.answer)}</p>
          <div class="chat-bubble-meta">
            <span><i data-lucide="check-circle-2"></i> Intent: <strong>${result.intent}</strong></span>
            <span>• Key Fact Confidence: <strong>${result.confidence}%</strong></span>
          </div>
        </div>
      `;
      simChatMessages.appendChild(botMsg);
      simChatMessages.scrollTop = simChatMessages.scrollHeight;
      refreshLucide();
    }, 250);
  });

  btnClearChat?.addEventListener('click', () => {
    if (currentKnowledgeDataset?.qaPairs) {
      setupChatbotSimulator(currentKnowledgeDataset.qaPairs);
      showToast('Percakapan direset!', 'info');
    }
  });

  // Debounced Search on Knowledge Q&A
  filterKbQaInput?.addEventListener('input', debounce(() => {
    const query = filterKbQaInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.kb-qa-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (!query || text.includes(query)) card.style.display = '';
      else card.style.display = 'none';
    });
  }, 120));

  // Knowledge Tabs Navigation
  kbTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      kbTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      kbTabPanes.forEach(pane => {
        if (pane.id === tabId) pane.classList.add('active');
        else pane.classList.remove('active');
      });
      refreshLucide();
    });
  });

  kbStatBoxes.forEach(box => {
    box.addEventListener('click', () => {
      const targetTab = box.dataset.targetTab;
      if (targetTab) {
        kbTabBtns.forEach(b => {
          if (b.dataset.tab === targetTab) b.click();
        });
      }
    });
  });

  // Knowledge Exports
  btnExportKbMain?.addEventListener('click', (e) => {
    e.stopPropagation();
    exportKbDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!exportKbDropdownMenu.contains(e.target) && e.target !== btnExportKbMain) {
      exportKbDropdownMenu.classList.add('hidden');
    }
  });

  actKbExportJsonl?.addEventListener('click', () => {
    if (!currentKnowledgeDataset) return;
    const exporter = new CampusExporter(currentKnowledgeDataset);
    exporter.exportChatbotJSONL();
    showToast('Chatbot Dataset (JSONL) berhasil diunduh!', 'success');
    exportKbDropdownMenu.classList.add('hidden');
  });

  actKbExportRag?.addEventListener('click', () => {
    if (!currentKnowledgeDataset) return;
    const exporter = new CampusExporter(currentKnowledgeDataset);
    exporter.exportRAGChunksJSON();
    showToast('RAG Vector Chunks (JSON) berhasil diunduh!', 'success');
    exportKbDropdownMenu.classList.add('hidden');
  });

  actKbExportSystemPrompt?.addEventListener('click', () => {
    if (!currentKnowledgeDataset) return;
    const exporter = new CampusExporter(currentKnowledgeDataset);
    exporter.exportSystemPromptTxt();
    showToast('AI System Prompt (.txt) berhasil diunduh!', 'success');
    exportKbDropdownMenu.classList.add('hidden');
  });

  actKbExportExcel?.addEventListener('click', () => {
    if (!currentKnowledgeDataset) return;
    const exporter = new CampusExporter(currentKnowledgeDataset);
    exporter.exportKnowledgeToExcel();
    showToast('Excel Knowledge Base (.xlsx) berhasil di-generate!', 'success');
    exportKbDropdownMenu.classList.add('hidden');
  });

  document.getElementById('btn-copy-system-prompt')?.addEventListener('click', async () => {
    if (!currentKnowledgeDataset?.systemPrompt) return;
    await navigator.clipboard.writeText(currentKnowledgeDataset.systemPrompt);
    showToast('System Prompt disalin ke clipboard!', 'success');
  });

  document.getElementById('btn-copy-rag-chunks')?.addEventListener('click', async () => {
    if (!currentKnowledgeDataset?.ragChunks) return;
    await navigator.clipboard.writeText(JSON.stringify(currentKnowledgeDataset.ragChunks, null, 2));
    showToast('RAG Chunks disalin!', 'success');
  });

  document.getElementById('btn-copy-kb-source-text')?.addEventListener('click', async () => {
    if (!currentKnowledgeDataset?.rawText) return;
    await navigator.clipboard.writeText(currentKnowledgeDataset.rawText);
    showToast('Teks asli disalin!', 'success');
  });

  btnNewKbScrape?.addEventListener('click', () => {
    kbTextInput.value = '';
    kbUrlInput.value = '';
    kbTextChars.textContent = '0';
    kbTextWords.textContent = '0';
    knowledgeWorkspaceSection.classList.add('hidden');
    landingFeatures.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (kbPanelText.classList.contains('active')) kbTextInput.focus();
      else if (kbPanelUrl.classList.contains('active')) kbUrlInput.focus();
    }, 150);
  });

  /* ==========================================================================
     PDF & Word Document Handlers
     ========================================================================== */

  tabDocUpload.addEventListener('click', () => {
    tabDocUpload.classList.add('active');
    tabDocUrl.classList.remove('active');
    docPanelUpload.classList.remove('hidden');
    docPanelUpload.classList.add('active');
    docPanelUrl.classList.add('hidden');
    docPanelUrl.classList.remove('active');
  });

  tabDocUrl.addEventListener('click', () => {
    tabDocUrl.classList.add('active');
    tabDocUpload.classList.remove('active');
    docPanelUrl.classList.remove('hidden');
    docPanelUrl.classList.add('active');
    docPanelUpload.classList.add('hidden');
    docPanelUpload.classList.remove('active');
    docUrlInput.focus();
  });

  btnPasteDocUrl?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        docUrlInput.value = text.trim();
        docUrlInput.focus();
        showToast('Link dokumen berhasil dipaste!', 'info');
      } else {
        showToast('Clipboard kosong.', 'warning');
      }
    } catch (e) {
      docUrlInput.focus();
      docUrlInput.select();
      showToast('Tekan Ctrl+V / Cmd+V untuk paste link', 'info');
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    docDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      docDropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    docDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      docDropzone.classList.remove('dragover');
    }, false);
  });

  docDropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleLocalDocumentFile(files[0]);
    }
  });

  docFileInput.addEventListener('change', () => {
    if (docFileInput.files.length > 0) {
      handleLocalDocumentFile(docFileInput.files[0]);
    }
  });

  docUrlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = docUrlInput.value.trim();
    if (!url) return;

    errorSection.classList.add('hidden');
    showTelemetry(url);
    updateProgress(20, 'Mengunduh berkas dokumen...');

    try {
      const { buffer, filename } = await docExtractor.fetchDocumentArrayBuffer(url, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(60, 'Mengekstrak teks & struktur halaman...');
      const dataset = await docExtractor.processDocumentBuffer(buffer, filename, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(100, 'Selesai!');
      setTimeout(() => {
        hideTelemetry();
        renderDocumentDataset(dataset);
        showToast(`Dokumen ${filename} berhasil diekstrak!`, 'success');
      }, 300);

    } catch (err) {
      hideTelemetry();
      showError('Gagal Mengunduh Dokumen', err.message);
    }
  });

  function handleLocalDocumentFile(file) {
    const isDoc = file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc');
    if (!isDoc) {
      showToast('Format berkas tidak didukung. Harap upload file .pdf atau .docx', 'error');
      return;
    }

    errorSection.classList.add('hidden');
    showTelemetry(file.name);
    updateProgress(25, `Membaca berkas lokal: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        updateProgress(60, 'Membedah struktur halaman dokumen...');
        
        const dataset = await docExtractor.processDocumentBuffer(buffer, file.name, (tag, msg) => {
          appendTelemetryLog(tag, msg);
        });

        updateProgress(100, 'Selesai!');
        setTimeout(() => {
          hideTelemetry();
          renderDocumentDataset(dataset);
          showToast(`Dokumen ${file.name} berhasil diekstrak!`, 'success');
        }, 300);

      } catch (err) {
        hideTelemetry();
        showError('Gagal Mengekstrak Dokumen', err.message);
      }
    };

    reader.onerror = () => {
      hideTelemetry();
      showError('Gagal Membaca File', 'Terjadi kesalahan saat membaca file lokal.');
    };

    reader.readAsArrayBuffer(file);
  }

  /* ==========================================================================
     Render Document Dataset to Workspace
     ========================================================================== */

  async function renderDocumentDataset(data) {
    currentDocDataset = data;
    currentDocPage = 1;

    document.getElementById('res-doc-title').textContent = data.metadata?.title || data.filename;
    document.getElementById('res-doc-format-badge').textContent = data.format;
    document.getElementById('res-doc-campus-badge').textContent = data.campusData?.campusName || 'Institusi';
    document.getElementById('res-doc-filename').textContent = data.filename;
    document.getElementById('res-doc-pages').textContent = `${data.totalPages} Halaman`;
    document.getElementById('res-doc-size').textContent = data.fileSize;

    const totalProdi = data.campusData?.allPrograms?.length || 0;
    const totalTuition = data.campusData?.tuitionItems?.length || 0;
    const totalTables = data.tables?.length || 0;

    document.getElementById('stat-doc-campus-name').textContent = (data.campusData?.campusName || 'Institusi').substring(0, 16);
    document.getElementById('stat-doc-prodi-count').textContent = totalProdi;
    document.getElementById('stat-doc-tuition-count').textContent = totalTuition;
    document.getElementById('stat-doc-tables-count').textContent = totalTables;

    document.getElementById('doc-tab-badge-pages').textContent = data.totalPages;
    document.getElementById('doc-tab-badge-tables').textContent = totalTables;
    document.getElementById('doc-tables-count-title').textContent = totalTables;
    document.getElementById('doc-prodi-total-badge').textContent = totalProdi;

    // Tab 1: Campus Entities
    document.getElementById('dt-doc-name').textContent = data.campusData?.campusName || '-';
    document.getElementById('dt-doc-status').textContent = data.campusData?.status || '-';
    document.getElementById('dt-doc-akreditasi').textContent = data.campusData?.akreditasi || '-';
    document.getElementById('dt-doc-sk').textContent = data.campusData?.skNumber || '-';

    const contactsContainer = document.getElementById('doc-contacts-list');
    let contactsHtml = '';
    (data.campusData?.contacts?.emails || []).forEach(e => {
      contactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="mail"></i></div><div class="contact-card-body"><div class="contact-card-type">Email</div><div class="contact-card-val">${e}</div></div></div>`;
    });
    (data.campusData?.contacts?.phones || []).forEach(p => {
      contactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="phone"></i></div><div class="contact-card-body"><div class="contact-card-type">Telepon</div><div class="contact-card-val">${p}</div></div></div>`;
    });
    contactsContainer.innerHTML = contactsHtml || '<p class="text-subtle">Tidak ada kontak eksplisit dalam dokumen.</p>';

    const tuitionContainer = document.getElementById('doc-tuition-list');
    let tuitionHtml = '';
    (data.campusData?.tuitionItems || []).forEach(t => {
      tuitionHtml += `
        <div class="tuition-card">
          <div class="tuition-card-header">
            <span class="tuition-title">${escapeHtml(t.title)}</span>
            <span class="tuition-amount">${escapeHtml(t.amount || '')}</span>
          </div>
          <p class="tuition-desc">${escapeHtml(t.desc)}</p>
        </div>
      `;
    });
    tuitionContainer.innerHTML = tuitionHtml || '<p class="text-subtle">Tidak ada data biaya eksplisit dalam dokumen.</p>';

    // Chunked render for Prodi list
    const prodiContainer = document.getElementById('doc-prodi-container');
    const prodis = data.campusData?.allPrograms || [];
    if (prodis.length > 0) {
      await renderInChunks(prodiContainer, prodis, (p) => `
        <div class="prodi-card-item">
          <div class="prodi-jenjang-tag">${p.jenjang}</div>
          <div class="prodi-name">${escapeHtml(p.name)}</div>
          <div class="prodi-meta-sub">Akreditasi: <strong>${p.akreditasi}</strong></div>
        </div>
      `, 30);
    } else {
      prodiContainer.innerHTML = '<div class="empty-state"><i data-lucide="search-x"></i><p>Tidak ditemukan daftar nama prodi eksplisit.</p></div>';
    }

    setupDocumentReader(data.pages);
    renderDocTables(data.tables || []);
    document.getElementById('doc-fulltext-viewer').textContent = data.fullText || 'Tidak ada teks utuh.';

    docWorkspaceSection.classList.remove('hidden');
    landingFeatures.classList.add('hidden');
    docWorkspaceSection.scrollIntoView({ behavior: 'smooth' });

    refreshLucide();
  }

  function setupDocumentReader(pages) {
    docPageSelect.innerHTML = '';
    const fragment = document.createDocumentFragment();
    pages.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx + 1;
      opt.textContent = `Halaman ${idx + 1} (${(p.lines || []).length} baris)`;
      fragment.appendChild(opt);
    });
    docPageSelect.appendChild(fragment);

    docPageSelect.value = 1;
    currentDocPage = 1;
    renderCurrentPage();

    docPageSelect.onchange = () => {
      currentDocPage = parseInt(docPageSelect.value);
      renderCurrentPage();
    };

    btnPrevDocPage.onclick = () => {
      if (currentDocPage > 1) {
        currentDocPage--;
        docPageSelect.value = currentDocPage;
        renderCurrentPage();
      }
    };

    btnNextDocPage.onclick = () => {
      if (currentDocPage < pages.length) {
        currentDocPage++;
        docPageSelect.value = currentDocPage;
        renderCurrentPage();
      }
    };

    docSearchInput.oninput = debounce(() => {
      renderCurrentPage();
    }, 150);
  }

  function renderCurrentPage() {
    if (!currentDocDataset?.pages) return;
    const page = currentDocDataset.pages[currentDocPage - 1];
    if (!page) return;

    const query = docSearchInput.value.trim();
    let text = page.text || (page.lines || []).join('\n');

    if (query) {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const highlighted = escapeHtml(text).replace(regex, '<mark class="highlight-match">$1</mark>');
      docCurrentPageText.innerHTML = highlighted;
    } else {
      docCurrentPageText.textContent = text;
    }
  }

  function renderDocTables(tables) {
    const container = document.getElementById('doc-tables-container');
    if (!tables || tables.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="table-2"></i><p>Tidak ada tabel data terdeteksi dalam dokumen ini.</p></div>';
      return;
    }

    let html = '';
    tables.forEach(t => {
      html += `
        <div class="content-card mb-4">
          <div class="card-header-bar">
            <h4><i data-lucide="table"></i> ${escapeHtml(t.title)} (${t.rows.length} baris)</h4>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>${t.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${t.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  docTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      docTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      docTabPanes.forEach(pane => {
        if (pane.id === tabId) pane.classList.add('active');
        else pane.classList.remove('active');
      });
      refreshLucide();
    });
  });

  docStatBoxes.forEach(box => {
    box.addEventListener('click', () => {
      const targetTab = box.dataset.targetTab;
      if (targetTab) {
        docTabBtns.forEach(b => {
          if (b.dataset.tab === targetTab) b.click();
        });
      }
    });
  });

  btnExportDocMain.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDocDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!exportDocDropdownMenu.contains(e.target) && e.target !== btnExportDocMain) {
      exportDocDropdownMenu.classList.add('hidden');
    }
  });

  actDocExportExcel.addEventListener('click', () => {
    if (!currentDocDataset) return;
    const exporter = new CampusExporter(currentDocDataset);
    exporter.exportDocumentToExcel();
    showToast('Excel Dokumen (.xlsx) berhasil di-generate!', 'success');
    exportDocDropdownMenu.classList.add('hidden');
  });

  actDocExportJson.addEventListener('click', () => {
    if (!currentDocDataset) return;
    const exporter = new CampusExporter(currentDocDataset);
    exporter.exportToJSON();
    showToast('JSON Dataset Dokumen berhasil diunduh!', 'success');
    exportDocDropdownMenu.classList.add('hidden');
  });

  actDocExportCsv.addEventListener('click', () => {
    if (!currentDocDataset) return;
    const exporter = new CampusExporter(currentDocDataset);
    exporter.exportToCSV();
    showToast('CSV Prodi Dokumen berhasil diunduh!', 'success');
    exportDocDropdownMenu.classList.add('hidden');
  });

  actDocExportMarkdown.addEventListener('click', () => {
    if (!currentDocDataset) return;
    const exporter = new CampusExporter(currentDocDataset);
    exporter.exportToMarkdown();
    showToast('Markdown Dokumen berhasil diunduh!', 'success');
    exportDocDropdownMenu.classList.add('hidden');
  });

  btnNewDocScrape.addEventListener('click', () => {
    docUrlInput.value = '';
    docFileInput.value = '';
    docWorkspaceSection.classList.add('hidden');
    landingFeatures.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (docPanelUrl.classList.contains('active')) docUrlInput.focus();
    }, 150);
  });

  document.getElementById('btn-copy-doc-fulltext')?.addEventListener('click', async () => {
    if (!currentDocDataset?.fullText) return;
    await navigator.clipboard.writeText(currentDocDataset.fullText);
    showToast('Seluruh teks dokumen disalin ke clipboard!', 'success');
  });

  /* ==========================================================================
     Web Crawler Event Handlers & Orchestration
     ========================================================================== */

  crawlerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = targetUrlInput.value.trim();
    if (!url) return;
    startWebExtractionFlow(url);
  });

  targetUrlInput.addEventListener('input', () => {
    if (targetUrlInput.value) btnClearInput.classList.remove('hidden');
    else btnClearInput.classList.add('hidden');
  });

  btnClearInput.addEventListener('click', () => {
    targetUrlInput.value = '';
    btnClearInput.classList.add('hidden');
    targetUrlInput.focus();
  });

  btnPasteClipboard.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        targetUrlInput.value = text.trim();
        btnClearInput.classList.remove('hidden');
        targetUrlInput.focus();
        showToast('URL baru berhasil dipaste dari clipboard!', 'info');
      } else {
        showToast('Clipboard kosong.', 'warning');
      }
    } catch (err) {
      // Fallback: focus input so user can press Ctrl+V
      targetUrlInput.focus();
      targetUrlInput.select();
      showToast('Tekan Ctrl+V / Cmd+V untuk paste URL', 'info');
    }
  });

  btnCancelCrawl.addEventListener('click', () => {
    if (activeAbortController) activeAbortController.abort();
    batchQueue.clear();
    hideTelemetry();
    showToast('Ekstraksi dibatalkan.', 'info');
  });

  btnRetryCrawl.addEventListener('click', () => {
    const url = targetUrlInput.value.trim();
    if (url) startWebExtractionFlow(url);
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.dataset.tab;
      switchTab(targetTabId);
    });
  });

  statBoxes.forEach(box => {
    box.addEventListener('click', () => {
      const targetTab = box.dataset.targetTab;
      if (targetTab) switchTab(targetTab);
    });
  });

  btnNewScrape.addEventListener('click', () => {
    targetUrlInput.value = '';
    btnClearInput.classList.add('hidden');
    workspaceSection.classList.add('hidden');
    landingFeatures.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => targetUrlInput.focus(), 150);
  });

  btnExportMain.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!exportDropdownMenu.contains(e.target) && e.target !== btnExportMain) {
      exportDropdownMenu.classList.add('hidden');
    }
  });

  actExportExcel.addEventListener('click', () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    exporter.exportToExcel();
    showToast('File Excel (.xlsx) berhasil di-generate!', 'success');
    exportDropdownMenu.classList.add('hidden');
  });

  actExportJson.addEventListener('click', () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    exporter.exportToJSON();
    showToast('File JSON dataset berhasil diunduh!', 'success');
    exportDropdownMenu.classList.add('hidden');
  });

  actExportCsv.addEventListener('click', () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    exporter.exportToCSV();
    showToast('File CSV prodi berhasil diunduh!', 'success');
    exportDropdownMenu.classList.add('hidden');
  });

  btnExportProdiCsv.addEventListener('click', () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    exporter.exportToCSV();
    showToast('File CSV prodi berhasil diunduh!', 'success');
  });

  actExportMarkdown.addEventListener('click', () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    exporter.exportToMarkdown();
    showToast('File Markdown (.md) berhasil diunduh!', 'success');
    exportDropdownMenu.classList.add('hidden');
  });

  actCopySummary.addEventListener('click', async () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    const success = await exporter.copySummaryToClipboard();
    if (success) showToast('Ringkasan data disalin ke clipboard!', 'success');
    exportDropdownMenu.classList.add('hidden');
  });

  document.getElementById('btn-copy-overview-card')?.addEventListener('click', async () => {
    if (!currentWebDataset) return;
    const exporter = new CampusExporter(currentWebDataset);
    await exporter.copySummaryToClipboard();
    showToast('Ringkasan profil disalin!', 'success');
  });

  document.getElementById('btn-copy-clean-text')?.addEventListener('click', async () => {
    if (!currentWebDataset?.cleanContent?.text) return;
    await navigator.clipboard.writeText(currentWebDataset.cleanContent.text);
    showToast('Teks bersih disalin ke clipboard!', 'success');
  });

  document.getElementById('btn-copy-markdown-text')?.addEventListener('click', async () => {
    if (!currentWebDataset?.cleanContent?.markdown) return;
    await navigator.clipboard.writeText(currentWebDataset.cleanContent.markdown);
    showToast('Markdown disalin ke clipboard!', 'success');
  });

  document.getElementById('btn-copy-json-dump')?.addEventListener('click', async () => {
    if (!currentWebDataset) return;
    await navigator.clipboard.writeText(JSON.stringify(currentWebDataset, null, 2));
    showToast('Raw JSON disalin ke clipboard!', 'success');
  });

  // Batch Modal
  btnBatchModal.addEventListener('click', () => {
    modalBatch.classList.remove('hidden');
    refreshLucide();
  });

  btnCloseBatchModal.addEventListener('click', () => modalBatch.classList.add('hidden'));
  btnCancelBatch.addEventListener('click', () => modalBatch.classList.add('hidden'));

  btnStartBatch.addEventListener('click', async () => {
    const rawText = batchUrlsTextarea.value.trim();
    if (!rawText) {
      showToast('Harap masukkan setidaknya satu URL.', 'error');
      return;
    }
    const urls = rawText.split('\n').map(u => u.trim()).filter(u => u.length > 5);
    if (urls.length === 0) return;

    btnStartBatch.disabled = true;
    batchStatusPanel.classList.remove('hidden');

    let processed = 0;
    const total = urls.length;

    const taskPromises = urls.map((url) => {
      return batchQueue.add(async () => {
        batchProgressText.textContent = `Memproses (${processed + 1}/${total}): ${url}`;
        try {
          const { html, url: finalUrl } = await webExtractor.fetchWebpage(url);
          const dataset = await webExtractor.extractCampusData(html, finalUrl);
          currentWebDataset = dataset;
          processed++;
        } catch (err) {
          console.warn('Batch task skip on', url, err.message);
        }
        batchProgressFill.style.width = `${Math.round((processed / total) * 100)}%`;
      });
    });

    await Promise.all(taskPromises);

    btnStartBatch.disabled = false;
    modalBatch.classList.add('hidden');
    batchStatusPanel.classList.add('hidden');
    showToast(`Batch selesai! ${processed} dari ${total} berhasil diproses.`, 'success');
    if (currentWebDataset) {
      renderWebDataset(currentWebDataset);
    }
  });

  // Manual HTML Fallback
  btnManualHtmlModal?.addEventListener('click', () => {
    modalManualHtml.classList.remove('hidden');
    manualHtmlUrl.value = targetUrlInput.value || '';
    refreshLucide();
  });

  btnCloseManualModal?.addEventListener('click', () => modalManualHtml.classList.add('hidden'));
  btnCancelManual?.addEventListener('click', () => modalManualHtml.classList.add('hidden'));

  btnProcessManualHtml?.addEventListener('click', async () => {
    const rawHtml = manualHtmlTextarea.value.trim();
    const url = manualHtmlUrl.value.trim() || 'https://perguruan-tinggi.ac.id';
    if (!rawHtml) {
      showToast('Harap paste source code HTML.', 'error');
      return;
    }

    modalManualHtml.classList.add('hidden');
    errorSection.classList.add('hidden');
    showTelemetry(url);
    updateProgress(60, 'Menganalisis source code HTML manual...');

    try {
      const dataset = await webExtractor.extractCampusData(rawHtml, url, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });
      updateProgress(100, 'Selesai!');
      setTimeout(() => {
        hideTelemetry();
        renderWebDataset(dataset);
        showToast('Ekstraksi dari raw HTML berhasil!', 'success');
      }, 300);
    } catch (err) {
      hideTelemetry();
      showError('Gagal Memproses HTML', err.message);
    }
  });

  // Debounced Prodi Filters
  filterProdiInput.addEventListener('input', debounce(() => applyProdiFilters(), 120));
  
  jenjangFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      jenjangFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyProdiFilters();
    });
  });

  // Debounced Docs Filter
  filterDocsInput.addEventListener('input', debounce(() => {
    const query = filterDocsInput.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#docs-table-body tr');
    let visibleCount = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (text.includes(query)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const emptyState = document.getElementById('docs-empty-state');
    if (visibleCount === 0 && rows.length > 0) emptyState.classList.remove('hidden');
    else emptyState.classList.add('hidden');
  }, 120));

  // Theme Toggle
  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  /* ==========================================================================
     Start Web Extraction Flow
     ========================================================================== */

  async function startWebExtractionFlow(url) {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    targetUrlInput.value = cleanUrl;
    btnClearInput.classList.remove('hidden');

    // Reset previous workspace view immediately so old campus data is purged
    workspaceSection.classList.add('hidden');
    landingFeatures.classList.add('hidden');
    currentWebDataset = null;

    // Clear stale DOM containers
    const facContainer = document.getElementById('faculties-container');
    if (facContainer) facContainer.innerHTML = '';
    const tuitionContainer = document.getElementById('tuition-items-container');
    if (tuitionContainer) tuitionContainer.innerHTML = '';
    const contactsContainer = document.getElementById('contacts-full-list');
    if (contactsContainer) contactsContainer.innerHTML = '';
    const docsTbody = document.getElementById('docs-table-body');
    if (docsTbody) docsTbody.innerHTML = '';
    const imagesGrid = document.getElementById('web-images-grid');
    if (imagesGrid) imagesGrid.innerHTML = '';
    const tablesContainer = document.getElementById('tables-container');
    if (tablesContainer) tablesContainer.innerHTML = '';

    errorSection.classList.add('hidden');
    showTelemetry(cleanUrl);
    updateProgress(15, 'Menghubungkan ke target website...');
    activeAbortController = new AbortController();

    try {
      updateProgress(30, 'Mengambil halaman web...');
      const { html, url: finalUrl } = await webExtractor.fetchWebpage(cleanUrl, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(65, 'Membedah data kampus...');
      const dataset = await webExtractor.extractCampusData(html, finalUrl, (tag, msg) => {
        appendTelemetryLog(tag, msg);
      });

      updateProgress(100, 'Menyusun visualisasi...');
      setTimeout(() => {
        hideTelemetry();
        renderWebDataset(dataset);
        showToast(`Ekstraksi data ${dataset.identity.name} berhasil!`, 'success');
      }, 300);

    } catch (err) {
      hideTelemetry();
      showError('Gagal Mengambil Data Kampus', err.message);
    }
  }

  /* ==========================================================================
     Render Web Dataset to UI
     ========================================================================== */

  async function renderWebDataset(data) {
    currentWebDataset = data;

    document.getElementById('res-campus-name').textContent = data.identity.name || 'Perguruan Tinggi';
    document.getElementById('res-badge-type').textContent = data.identity.status || 'Perguruan Tinggi';
    document.getElementById('res-badge-akreditasi').textContent = data.identity.akreditasi || 'Terakreditasi';
    document.getElementById('res-campus-motto').textContent = data.identity.motto ? `"${data.identity.motto}"` : '';
    
    const targetLinkEl = document.getElementById('res-target-link');
    targetLinkEl.href = data.url;
    document.getElementById('res-target-link-text').textContent = data.url;
    document.getElementById('res-crawl-timestamp').textContent = new Date(data.timestamp).toLocaleTimeString('id-ID');
    document.getElementById('res-payload-size').textContent = data.payloadSize;

    const avatarEl = document.getElementById('campus-avatar');
    if (data.metadata?.favicon) {
      avatarEl.innerHTML = `<img src="${data.metadata.favicon}" alt="${data.identity.name}" onerror="this.parentElement.innerHTML='<i data-lucide=\\'school\\'></i>'; lucide.createIcons();">`;
    } else {
      avatarEl.innerHTML = `<i data-lucide="school"></i>`;
    }

    const totalFac = data.academic?.totalFaculties || 0;
    const totalProdi = data.academic?.totalPrograms || 0;
    const totalTuition = data.tuitionAndAdmission?.totalFound || 0;
    const totalContacts = (data.contacts?.emails?.length || 0) + (data.contacts?.phones?.length || 0) + (data.contacts?.socials?.length || 0);
    const totalDocs = data.documents?.length || 0;
    const totalImages = data.images?.length || 0;
    const totalTables = data.tables?.length || 0;

    document.getElementById('stat-faculties-count').textContent = totalFac;
    document.getElementById('stat-prodi-count').textContent = totalProdi;
    document.getElementById('stat-tuition-count').textContent = totalTuition;
    document.getElementById('stat-contacts-count').textContent = totalContacts;
    document.getElementById('stat-docs-count').textContent = totalDocs;
    document.getElementById('stat-images-count').textContent = totalImages;
    document.getElementById('stat-tables-count').textContent = totalTables;

    document.getElementById('tab-badge-prodi').textContent = totalProdi;
    document.getElementById('tab-badge-tuition').textContent = totalTuition;
    document.getElementById('tab-badge-contacts').textContent = totalContacts;
    document.getElementById('tab-badge-docs').textContent = totalDocs;
    document.getElementById('tab-badge-images').textContent = totalImages;
    document.getElementById('images-total-count').textContent = totalImages;
    document.getElementById('tab-badge-tables').textContent = totalTables;
    document.getElementById('tables-total-count').textContent = totalTables;

    // Tab 1: Overview
    document.getElementById('dt-name').textContent = data.identity.name || '-';
    document.getElementById('dt-acronym').textContent = data.identity.acronym || '-';
    document.getElementById('dt-status').textContent = data.identity.status || '-';
    document.getElementById('dt-akreditasi').textContent = data.identity.akreditasi || '-';
    document.getElementById('dt-rektor').textContent = data.identity.rektor || '-';
    document.getElementById('dt-founded').textContent = data.identity.founded || '-';
    document.getElementById('dt-location').textContent = data.identity.location || '-';
    document.getElementById('dt-description').textContent = data.metadata.description || data.identity.motto || 'Tidak ada deskripsi.';

    const overviewContactsList = document.getElementById('overview-contacts-list');
    let quickContactsHtml = '';
    if (data.contacts.emails?.length > 0) {
      quickContactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="mail"></i></div><div class="contact-card-body"><div class="contact-card-type">Email Resmi</div><div class="contact-card-val">${data.contacts.emails[0]}</div></div></div>`;
    }
    if (data.contacts.phones?.length > 0) {
      quickContactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="phone"></i></div><div class="contact-card-body"><div class="contact-card-type">Telepon</div><div class="contact-card-val">${data.contacts.phones[0]}</div></div></div>`;
    }
    if (data.contacts.addresses?.length > 0) {
      quickContactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="map-pin"></i></div><div class="contact-card-body"><div class="contact-card-type">Alamat Kampus</div><div class="contact-card-val">${data.contacts.addresses[0]}</div></div></div>`;
    }
    overviewContactsList.innerHTML = quickContactsHtml || '<p class="text-subtle">Tidak ada kontak utama terdeteksi pada halaman ini.</p>';

    const overviewPortalsList = document.getElementById('overview-portals-list');
    let portalsHtml = '';
    if (data.contacts.portals?.length > 0) {
      data.contacts.portals.forEach(p => {
        portalsHtml += `<a href="${p.link}" target="_blank" rel="noopener noreferrer" class="social-btn-card"><i data-lucide="external-link"></i> ${p.name || p.type}</a>`;
      });
    }
    overviewPortalsList.innerHTML = portalsHtml || '<p class="text-subtle">Tidak ada portal digital spesifik terdeteksi.</p>';

    // Chunked render for faculties & visual assets
    renderFacultiesTree(data.academic?.faculties || []);
    renderTuitionGrid(data.tuitionAndAdmission?.items || []);
    renderContactsDirectory(data.contacts);
    renderDocumentsTable(data.documents || []);
    renderWebImages(data.images || []);
    renderHtmlTables(data.tables || []);

    document.getElementById('clean-text-body').textContent = data.cleanContent?.text || 'Tidak ada konten teks yang diekstrak.';
    document.getElementById('raw-json-viewer').textContent = JSON.stringify(data, null, 2);

    workspaceSection.classList.remove('hidden');
    landingFeatures.classList.add('hidden');
    workspaceSection.scrollIntoView({ behavior: 'smooth' });

    refreshLucide();
  }

  function renderFacultiesTree(faculties) {
    const container = document.getElementById('faculties-container');
    const emptyState = document.getElementById('prodi-empty-state');

    if (!faculties || faculties.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    let html = '';

    faculties.forEach(faculty => {
      html += `
        <div class="faculty-accordion-item" data-faculty-name="${escapeHtml(faculty.name)}">
          <button class="faculty-header-btn" onclick="this.parentElement.classList.toggle('collapsed')">
            <div class="faculty-title-group">
              <i data-lucide="graduation-cap"></i>
              <span class="faculty-title">${escapeHtml(faculty.name)}</span>
              <span class="faculty-count-pill">${faculty.programs.length} Program Studi</span>
            </div>
            <i data-lucide="chevron-down"></i>
          </button>
          <div class="prodi-list-grid">
      `;

      faculty.programs.forEach(prog => {
        html += `
          <div class="prodi-card-item" data-jenjang="${prog.jenjang}" data-prodi-name="${escapeHtml(prog.name)}">
            <div class="prodi-jenjang-tag">${prog.jenjang}</div>
            <div class="prodi-name">${escapeHtml(prog.name)}</div>
            <div class="prodi-meta-sub">
              <span>Akreditasi: <strong>${prog.akreditasi}</strong></span>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    refreshLucide();
  }

  function applyProdiFilters() {
    const searchQuery = filterProdiInput.value.toLowerCase().trim();
    const activePill = document.querySelector('#jenjang-filter-pills .filter-chip.active');
    const activeFilter = activePill ? activePill.dataset.filter : 'all';

    const facultyItems = document.querySelectorAll('.faculty-accordion-item');
    let totalVisibleProdi = 0;

    facultyItems.forEach(facultyItem => {
      const prodiCards = facultyItem.querySelectorAll('.prodi-card-item');
      let visibleInFaculty = 0;

      prodiCards.forEach(card => {
        const prodiName = (card.dataset.prodiName || '').toLowerCase();
        const jenjang = card.dataset.jenjang || '';

        const matchesSearch = !searchQuery || prodiName.includes(searchQuery);
        const matchesJenjang = activeFilter === 'all' || jenjang.toLowerCase() === activeFilter.toLowerCase();

        if (matchesSearch && matchesJenjang) {
          card.style.display = '';
          visibleInFaculty++;
          totalVisibleProdi++;
        } else {
          card.style.display = 'none';
        }
      });

      if (visibleInFaculty === 0) facultyItem.style.display = 'none';
      else facultyItem.style.display = '';
    });

    const emptyState = document.getElementById('prodi-empty-state');
    if (totalVisibleProdi === 0) emptyState.classList.remove('hidden');
    else emptyState.classList.add('hidden');
  }

  function renderTuitionGrid(items) {
    const container = document.getElementById('tuition-items-container');
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="coins"></i><p>Tidak ditemukan data biaya kuliah eksplisit.</p></div>';
      return;
    }

    let html = '';
    items.forEach(item => {
      html += `
        <div class="tuition-card">
          <div class="tuition-card-header">
            <span class="tuition-title">${escapeHtml(item.title)}</span>
            ${item.amount ? `<span class="tuition-amount">${escapeHtml(item.amount)}</span>` : ''}
          </div>
          <p class="tuition-desc">${escapeHtml(item.desc)}</p>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderContactsDirectory(contacts) {
    const fullList = document.getElementById('contacts-full-list');
    let contactsHtml = '';

    (contacts.emails || []).forEach(e => {
      contactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="mail"></i></div><div class="contact-card-body"><div class="contact-card-type">Email Resmi</div><div class="contact-card-val"><a href="mailto:${e}">${escapeHtml(e)}</a></div></div></div>`;
    });

    (contacts.phones || []).forEach(p => {
      contactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="phone"></i></div><div class="contact-card-body"><div class="contact-card-type">Nomor Telepon</div><div class="contact-card-val"><a href="tel:${p.replace(/\s+/g, '')}">${escapeHtml(p)}</a></div></div></div>`;
    });

    (contacts.whatsapp || []).forEach(w => {
      contactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="message-square"></i></div><div class="contact-card-body"><div class="contact-card-type">WhatsApp</div><div class="contact-card-val"><a href="${w.link}" target="_blank" rel="noopener noreferrer">${escapeHtml(w.label)}</a></div></div></div>`;
    });

    (contacts.addresses || []).forEach(a => {
      contactsHtml += `<div class="contact-card-row"><div class="contact-card-icon"><i data-lucide="map-pin"></i></div><div class="contact-card-body"><div class="contact-card-type">Alamat Fisik</div><div class="contact-card-val">${escapeHtml(a)}</div></div></div>`;
    });

    fullList.innerHTML = contactsHtml || '<p class="text-subtle">Tidak ada kontak terdeteksi.</p>';

    const socialsList = document.getElementById('socials-full-list');
    let socialsHtml = '';
    (contacts.socials || []).forEach(s => {
      socialsHtml += `<a href="${s.link}" target="_blank" rel="noopener noreferrer" class="social-btn-card"><i data-lucide="${s.icon || 'globe'}"></i><span>${s.platform}</span></a>`;
    });
    socialsList.innerHTML = socialsHtml || '<p class="text-subtle">Tidak ada media sosial terdeteksi.</p>';
  }

  function renderDocumentsTable(documents) {
    const tbody = document.getElementById('docs-table-body');
    const emptyState = document.getElementById('docs-empty-state');

    if (!documents || documents.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    let html = '';
    documents.forEach(doc => {
      html += `
        <tr>
          <td><span class="badge-tag ${doc.type === 'PDF' ? 'badge-ptn' : 'badge-akreditasi'}">${doc.type}</span></td>
          <td><strong>${escapeHtml(doc.title)}</strong></td>
          <td><a href="${doc.url}" target="_blank" rel="noopener noreferrer" class="link-item"><i data-lucide="external-link"></i> Buka File</a></td>
          <td><a href="${doc.url}" download target="_blank" class="btn-ghost-sm"><i data-lucide="download"></i> Download</a></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  function renderWebImages(images) {
    const grid = document.getElementById('web-images-grid');
    const emptyState = document.getElementById('web-images-empty-state');
    if (!grid) return;

    if (!images || images.length === 0) {
      grid.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    let html = '';
    images.forEach((img, idx) => {
      const isInfo = img.isInfographic || img.category.includes('Brosur');
      html += `
        <div class="web-image-card" data-card-id="${idx}">
          <div class="web-image-thumb-wrap">
            <span class="web-image-cat-badge ${isInfo ? 'badge-infographic' : ''}">${escapeHtml(img.category)}</span>
            <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}" class="web-image-thumb" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2394a3b8\\' stroke-width=\\'2\\'><rect width=\\'18\\' height=\\'18\\' x=\\'3\\' y=\\'3\\' rx=\\'2\\'/><circle cx=\\'9\\' cy=\\'9\\' r=\\'2\\'/><path d=\\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\\'/></svg>';">
          </div>
          <div class="web-image-body">
            <div class="web-image-title" title="${escapeHtml(img.title)}">${escapeHtml(img.title)}</div>
            <div class="web-image-meta-row">
              <span>Dimensi: ${escapeHtml(img.dimensions)}</span>
              <span>Visual Asset</span>
            </div>
            
            <div class="web-image-actions">
              <button class="btn-ocr-trigger" data-img-url="${escapeHtml(img.url)}" data-card-idx="${idx}">
                <i data-lucide="scan-text"></i> Baca Teks (OCR)
              </button>
              <a href="${escapeHtml(img.url)}" target="_blank" rel="noopener noreferrer" class="btn-ghost-sm" title="Buka Gambar Asli">
                <i data-lucide="external-link"></i>
              </a>
              <a href="${escapeHtml(img.url)}" download target="_blank" class="btn-ghost-sm" title="Download Gambar">
                <i data-lucide="download"></i>
              </a>
            </div>

            <!-- OCR Container (Hidden by default) -->
            <div class="web-image-ocr-result hidden" id="ocr-res-${idx}">
              <div class="ocr-result-header">
                <span><i data-lucide="cpu"></i> HASIL BACA OCR</span>
                <span class="text-subtle" id="ocr-status-${idx}">Selesai</span>
              </div>
              <div class="ocr-result-text" id="ocr-text-${idx}"></div>
              <div class="ocr-result-actions">
                <button class="btn-ghost-sm" id="btn-copy-ocr-${idx}">
                  <i data-lucide="copy"></i> Copy
                </button>
                <button class="btn-primary-indigo" style="font-size: 0.72rem; padding: 0.35rem 0.65rem;" id="btn-send-kb-${idx}">
                  <i data-lucide="brain"></i> Ekstrak ke AI
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;

    // Attach OCR Triggers
    grid.querySelectorAll('.btn-ocr-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const imgUrl = btn.dataset.imgUrl;
        const cardIdx = btn.dataset.cardIdx;
        const ocrBox = document.getElementById(`ocr-res-${cardIdx}`);
        const ocrText = document.getElementById(`ocr-text-${cardIdx}`);
        const ocrStatus = document.getElementById(`ocr-status-${cardIdx}`);

        btn.classList.add('loading');
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Membaca OCR...`;
        refreshLucide();

        ocrBox.classList.remove('hidden');
        ocrText.textContent = 'Menghubungkan ke engine OCR Tesseract & memindai karakter teks dalam gambar...';

        try {
          const text = await knowledgeExtractor.extractTextFromImage(imgUrl, (tag, msg) => {
            ocrStatus.textContent = msg;
          });

          btn.classList.remove('loading');
          btn.disabled = false;
          btn.innerHTML = `<i data-lucide="check"></i> Baca Ulang`;

          if (!text || text.length < 5) {
            ocrText.textContent = '(Tidak ditemukan teks yang terbaca dengan jelas dalam gambar ini)';
            ocrStatus.textContent = 'Selesai (0 Karakter)';
          } else {
            ocrText.textContent = text;
            ocrStatus.textContent = `${text.length} Karakter`;
            showToast('Teks dalam gambar berhasil dibaca via OCR!', 'success');

            // Wire Copy OCR Text
            const copyBtn = document.getElementById(`btn-copy-ocr-${cardIdx}`);
            copyBtn.onclick = async () => {
              await navigator.clipboard.writeText(text);
              showToast('Teks OCR disalin!', 'success');
            };

            // Wire Send to Knowledge Extractor
            const sendKbBtn = document.getElementById(`btn-send-kb-${cardIdx}`);
            sendKbBtn.onclick = () => {
              switchCrawlerMode('knowledge');
              tabKbText.click();
              kbTextInput.value = text;
              kbTextChars.textContent = text.length;
              kbTextWords.textContent = text.split(/\s+/).length;
              window.scrollTo({ top: 0, behavior: 'smooth' });
              showToast('Teks gambar dikirim ke Knowledge Extractor!', 'info');
            };
          }
        } catch (err) {
          btn.classList.remove('loading');
          btn.disabled = false;
          btn.innerHTML = `<i data-lucide="scan-text"></i> Coba OCR Lagi`;
          ocrText.textContent = `Gagal membaca OCR: ${err.message}`;
          ocrStatus.textContent = 'Error';
          showToast(`OCR gagal: ${err.message}`, 'error');
        }
        refreshLucide();
      });
    });

    // Wire Filter Images Input
    const filterInput = document.getElementById('filter-web-images-input');
    filterInput?.addEventListener('input', debounce(() => {
      const q = filterInput.value.toLowerCase().trim();
      const cards = grid.querySelectorAll('.web-image-card');
      let visible = 0;
      cards.forEach(c => {
        const text = c.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          c.style.display = '';
          visible++;
        } else {
          c.style.display = 'none';
        }
      });
      if (visible === 0 && cards.length > 0) emptyState?.classList.remove('hidden');
      else emptyState?.classList.add('hidden');
    }, 120));

    refreshLucide();
  }

  function renderHtmlTables(tables) {
    const container = document.getElementById('tables-container');
    if (!tables || tables.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="table-2"></i><p>Tidak ada tabel data HTML ditemukan.</p></div>';
      return;
    }

    let html = '';
    tables.forEach(t => {
      html += `
        <div class="content-card mb-4">
          <div class="card-header-bar">
            <h4><i data-lucide="table"></i> ${escapeHtml(t.title)} (${t.rows.length} baris)</h4>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>${t.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${t.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  /* ==========================================================================
     UI Telemetry & Helpers
     ========================================================================== */

  function switchTab(tabId) {
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    tabPanes.forEach(pane => {
      if (pane.id === tabId) pane.classList.add('active');
      else pane.classList.remove('active');
    });

    refreshLucide();
  }

  function showTelemetry(url) {
    telemetryUrlText.textContent = url;
    telemetryLogs.innerHTML = '';
    telemetrySection.classList.remove('hidden');
    telemetrySection.scrollIntoView({ behavior: 'smooth' });
  }

  function hideTelemetry() {
    telemetrySection.classList.add('hidden');
  }

  function updateProgress(percent, statusText) {
    progressBarFill.style.width = `${percent}%`;
    telemetryStatusText.textContent = statusText;
  }

  function appendTelemetryLog(tag, msg) {
    if (telemetryLogs.children.length > 40) {
      telemetryLogs.removeChild(telemetryLogs.firstElementChild);
    }
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logEl = document.createElement('div');
    logEl.className = 'log-item';
    logEl.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-tag">[${escapeHtml(tag)}]</span> ${escapeHtml(msg)}`;
    telemetryLogs.appendChild(logEl);
    telemetryLogs.scrollTop = telemetryLogs.scrollHeight;
  }

  function showError(title, msg) {
    errorTitle.textContent = title;
    errorMessage.textContent = msg;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    refreshLucide();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function refreshLucide() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('campusminer_theme') || 'light';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusminer_theme', theme);
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    }
    refreshLucide();
  }
});
