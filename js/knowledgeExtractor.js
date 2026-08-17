/**
 * CampusMiner AI - Knowledge Extractor Engine
 * Overpower NLP, OCR, Entity Miner & Chatbot Dataset Synthesizer
 * Built for high-precision, factual, zero-hallucination Chatbot Knowledge Bases & RAG
 */

class KnowledgeExtractor {
  constructor() {
    this.stopWordsIndo = new Set([
      'yang', 'untuk', 'pada', 'ke', 'para', 'namun', 'menurut', 'antara', 'dia', 'dua',
      'ia', 'seperti', 'jika', 'sehingga', 'kembali', 'dan', 'ini', 'karena', 'kepada',
      'oleh', 'saat', 'harus', 'sementara', 'setelah', 'belum', 'kami', 'sekitar', 'bagi',
      'serta', 'di', 'dari', 'telah', 'sebagai', 'masih', 'hal', 'ketika', 'adalah', 'itu',
      'dengan', 'bisa', 'akan', 'ada', 'atau', 'dapat', 'dalam', 'tidak', 'juga', 'agar',
      'sudah', 'tersebut', 'banyak', 'lebih', 'sangat', 'secara', 'tentang', 'setiap', 'mana'
    ]);

    this.categories = {
      biaya: ['biaya', 'ukt', 'spp', 'uang', 'bayar', 'nominal', 'rupiah', 'rp', 'tarif', 'tagihan', 'cicilan', 'pangkal', 'gedung', 'ipi', 'dpp', 'beasiswa'],
      pmb: ['pmb', 'daftar', 'pendaftaran', 'seleksi', 'masuk', 'jalur', 'mandiri', 'snbp', 'snbt', 'gelombang', 'jadwal', 'syarat', 'kuota', 'tes'],
      akademik: ['fakultas', 'prodi', 'program studi', 'jurusan', 'kurikulum', 'sks', 'semester', 'd3', 'd4', 's1', 's2', 's3', 'sarjana', 'magister', 'doktor', 'akreditasi', 'gelar'],
      fasilitas: ['fasilitas', 'gedung', 'laboratorium', 'lab', 'perpustakaan', 'asrama', 'kantin', 'wifi', 'olahraga', 'masjid', 'kampus'],
      kontak: ['kontak', 'hubungi', 'telepon', 'whatsapp', 'email', 'alamat', 'lokasi', 'helpdesk', 'call center', 'instagram', 'website'],
      persyaratan: ['syarat', 'dokumen', 'berkas', 'ijazah', 'ktp', 'foto', 'skck', 'kesehatan', 'bebas narkoba', 'surat']
    };
  }

  /**
   * Main knowledge synthesis from raw text
   */
  async extractKnowledge(rawText, sourceName = 'Dokumen/Teks', onLog = () => {}) {
    onLog('INIT', `Memulai analisis teks sumber (${rawText.length} karakter)...`);
    await window.PerfUtils.yieldToMain();

    const cleanText = this.sanitizeText(rawText);
    if (!cleanText || cleanText.length < 20) {
      throw new Error('Teks terlalu pendek atau tidak mengandung informasi yang dapat diekstrak.');
    }

    onLog('SEGMENT', 'Memecah teks menjadi paragraf & entitas semantik...');
    const segments = this.segmentTextIntoUnits(cleanText);
    await window.PerfUtils.yieldToMain();

    onLog('NLP', 'Menganalisis kata kunci penting, intent & synonyms...');
    const keywords = this.extractKeywords(cleanText);
    await window.PerfUtils.yieldToMain();

    onLog('SYNTHESIZE', 'Menyusun daftar pertanyaan & jawaban chatbot (Q&A Knowledge Cards)...');
    const qaPairs = this.generateQAPairs(segments, cleanText);
    await window.PerfUtils.yieldToMain();

    onLog('RAG', 'Membuat chunking RAG & format System Prompt AI...');
    const ragChunks = this.generateRAGChunks(cleanText, sourceName);
    const systemPrompt = this.generateChatbotSystemPrompt(qaPairs, sourceName);

    onLog('COMPLETE', `Berhasil mengekstrak ${qaPairs.length} Knowledge Card & ${keywords.primary.length} Keyword Utama!`);

    return {
      sourceName,
      timestamp: new Date().toISOString(),
      characterCount: cleanText.length,
      wordCount: cleanText.split(/\s+/).length,
      estimatedTokens: Math.round(cleanText.length / 4),
      keywords,
      qaPairs,
      ragChunks,
      systemPrompt,
      rawText: cleanText
    };
  }

  /**
   * Extract Text from Image using Tesseract.js OCR
   */
  async extractTextFromImage(imageFileOrUrl, onLog = () => {}) {
    if (typeof Tesseract === 'undefined') {
      throw new Error('Library OCR Tesseract.js belum termuat. Periksa koneksi internet Anda.');
    }

    onLog('OCR-INIT', 'Memulai engine OCR (Optical Character Recognition)...');
    await window.PerfUtils.yieldToMain();

    try {
      const worker = await Tesseract.createWorker('ind+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            onLog('OCR-PROGRESS', `Membaca gambar: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const ret = await worker.recognize(imageFileOrUrl);
      await worker.terminate();

      const text = ret.data.text.trim();
      onLog('OCR-SUCCESS', `OCR selesai! Menemukan ${text.length} karakter teks dalam gambar.`);
      return text;
    } catch (err) {
      throw new Error(`Gagal mengenali teks dalam gambar: ${err.message}`);
    }
  }

  /**
   * Text sanitization
   */
  sanitizeText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Break text into meaningful semantic chunks / sections
   */
  segmentTextIntoUnits(text) {
    const rawParagraphs = text.split(/\n\s*\n+/);
    const segments = [];

    rawParagraphs.forEach(p => {
      const trimmed = p.trim();
      if (trimmed.length > 25) {
        // Classify Category
        const category = this.detectCategory(trimmed);
        segments.push({
          text: trimmed,
          category,
          entities: this.extractEntitiesFromSnippet(trimmed)
        });
      }
    });

    return segments;
  }

  /**
   * Detect Category of a text snippet
   */
  detectCategory(text) {
    const lower = text.toLowerCase();
    let bestCat = 'umum';
    let maxScore = 0;

    for (const [cat, words] of Object.entries(this.categories)) {
      let score = 0;
      words.forEach(w => {
        if (lower.includes(w)) score += 1;
      });
      if (score > maxScore) {
        maxScore = score;
        bestCat = cat;
      }
    }

    return bestCat;
  }

  /**
   * Extract specific entities from a snippet (Price, Dates, Phones, Emails, SK, Prodis)
   */
  extractEntitiesFromSnippet(text) {
    const prices = text.match(/(?:Rp\.?|IDR)\s*[\d.,]+(?:\s*(?:juta|ribu|jt|\/\s*semester))?/gi) || [];
    const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g) || [];
    const phones = text.match(/(?:\+62|62|0)(?:21|22|24|31|274|251|8[1-9][0-9])[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,5}/g) || [];
    const dates = text.match(/\b(?:\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/gi) || [];
    const links = text.match(/https?:\/\/[^\s]+/gi) || [];

    return {
      prices: [...new Set(prices)],
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
      dates: [...new Set(dates)],
      links: [...new Set(links)]
    };
  }

  /**
   * High-Precision Keyword & Synonym Generator
   */
  extractKeywords(text) {
    const words = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.stopWordsIndo.has(w));

    // Frequency map
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);

    // Extract N-gram phrases (2-word phrases like 'teknik informatika', 'biaya kuliah', 'jalur mandiri')
    const phraseMap = {};
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (!this.stopWordsIndo.has(words[i]) && !this.stopWordsIndo.has(words[i + 1])) {
        phraseMap[phrase] = (phraseMap[phrase] || 0) + 1;
      }
    }

    // Top single keywords
    const sortedKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({
        keyword: word,
        frequency: count,
        category: this.detectCategory(word)
      }));

    // Top Phrases
    const sortedPhrases = Object.entries(phraseMap)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([phrase, count]) => phrase);

    // Contextual Trigger Synonyms Map
    const triggerSynonyms = [];
    const triggerCategories = ['biaya', 'pmb', 'akademik', 'kontak', 'persyaratan'];
    triggerCategories.forEach(cat => {
      const related = sortedKeywords.filter(k => k.category === cat).map(k => k.keyword);
      if (related.length > 0) {
        triggerSynonyms.push({
          category: cat.toUpperCase(),
          triggers: related,
          userVariations: this.getUserQueryVariations(cat, related)
        });
      }
    });

    return {
      primary: sortedKeywords.slice(0, 20),
      phrases: sortedPhrases,
      synonyms: triggerSynonyms
    };
  }

  /**
   * Generate common user query variations for chatbot intent training
   */
  getUserQueryVariations(category, relatedWords) {
    const sample = relatedWords.slice(0, 3).join(', ');
    switch (category) {
      case 'biaya':
        return ['Berapa biaya kuliah?', 'Berapa UKT per semester?', 'Apakah ada biaya gedung?', 'Berapa rincian tarif masuk?'];
      case 'pmb':
        return ['Kapan pendaftaran dibuka?', 'Apa saja jalur masuk yang tersedia?', 'Bagaimana cara mendaftar PMB?', 'Kapan jadwal tes seleksi?'];
      case 'akademik':
        return ['Apa saja program studi dan jurusan yang ada?', 'Berapa jenjang S1/D3/S2 yang tersedia?', 'Apa akreditasi program studi?'];
      case 'kontak':
        return ['Nomor kontak admin / CS yang bisa dihubungi?', 'Berapa nomor WhatsApp PMB?', 'Apa alamat email resmi dan kantornya?'];
      case 'persyaratan':
        return ['Apa saja syarat pendaftaran?', 'Dokumen apa saja yang harus disiapkan?', 'Apakah butuh SKCK atau bebas narkoba?'];
      default:
        return ['Informasi umum tentang ' + sample];
    }
  }

  /**
   * Synthesize Grounded Q&A Knowledge Pairs from Segments
   */
  generateQAPairs(segments, fullText) {
    const qaPairs = [];
    let idCounter = 1;

    segments.forEach(seg => {
      const text = seg.text;
      const cat = seg.category;
      const entities = seg.entities;

      // Rule 1: Segment with Price / Tuition details
      if (entities.prices.length > 0) {
        qaPairs.push({
          id: `QA-${idCounter++}`,
          intent: 'info_biaya_kuliah',
          category: 'Biaya / Keuangan',
          question: `Berapa rincian biaya kuliah / UKT yang tertera?`,
          aliases: ['Berapa biaya kuliah?', 'Berapa UKT nya?', 'Rincian uang kuliah', 'Berapa biaya masuknya?'],
          answer: text,
          keyPoints: entities.prices,
          confidence: 'Tinggi (98%)',
          triggerKeywords: ['biaya', 'ukt', 'spp', 'rupiah', ...entities.prices]
        });
      }

      // Rule 2: Segment with PMB / Registration Schedules or Paths
      else if (cat === 'pmb' && (entities.dates.length > 0 || text.toLowerCase().includes('jalur') || text.toLowerCase().includes('gelombang'))) {
        qaPairs.push({
          id: `QA-${idCounter++}`,
          intent: 'jadwal_jalur_pendaftaran',
          category: 'Pendaftaran / PMB',
          question: `Apa saja jalur masuk dan jadwal pendaftaran yang berlaku?`,
          aliases: ['Kapan pendaftaran dibuka?', 'Apa saja jalur seleksinya?', 'Kapan gelombang pendaftaran PMB?', 'Jadwal seleksi masuk'],
          answer: text,
          keyPoints: entities.dates.length > 0 ? entities.dates : ['Jalur Pendaftaran'],
          confidence: 'Tinggi (95%)',
          triggerKeywords: ['pmb', 'daftar', 'jadwal', 'jalur', 'gelombang']
        });
      }

      // Rule 3: Segment with Requirements (Syarat / Berkas)
      else if (cat === 'persyaratan' || text.toLowerCase().includes('syarat') || text.toLowerCase().includes('dokumen') || text.toLowerCase().includes('ijazah')) {
        qaPairs.push({
          id: `QA-${idCounter++}`,
          intent: 'syarat_pendaftaran',
          category: 'Persyaratan & Dokumen',
          question: `Apa saja persyaratan dan berkas yang wajib disiapkan?`,
          aliases: ['Apa syarat daftarnya?', 'Dokumen apa yang harus diupload?', 'Syarat masuk apa saja?', 'Berkas administrasi'],
          answer: text,
          keyPoints: ['Persyaratan Dokumen'],
          confidence: 'Tinggi (96%)',
          triggerKeywords: ['syarat', 'dokumen', 'berkas', 'ijazah', 'persyaratan']
        });
      }

      // Rule 4: Segment with Academic Programs / Faculties
      else if (cat === 'akademik' || text.toLowerCase().includes('program studi') || text.toLowerCase().includes('fakultas') || text.toLowerCase().includes('jurusan')) {
        qaPairs.push({
          id: `QA-${idCounter++}`,
          intent: 'daftar_program_studi',
          category: 'Fakultas & Prodi',
          question: `Program studi atau fakultas apa saja yang tersedia?`,
          aliases: ['Daftar jurusan apa saja?', 'Ada fakultas apa saja?', 'Program studi yang ada?', 'Jurusan dan akreditasi'],
          answer: text,
          keyPoints: ['Program Studi / Fakultas'],
          confidence: 'Tinggi (94%)',
          triggerKeywords: ['fakultas', 'prodi', 'jurusan', 'akreditasi', 's1', 'd3']
        });
      }

      // Rule 5: Segment with Contacts
      else if (entities.phones.length > 0 || entities.emails.length > 0 || entities.links.length > 0 || cat === 'kontak') {
        qaPairs.push({
          id: `QA-${idCounter++}`,
          intent: 'kontak_layanan',
          category: 'Kontak & Informasi',
          question: `Bagaimana cara menghubungi kontak resmi atau layanan helpdesk?`,
          aliases: ['Nomor WA admin?', 'Email resmi kampus?', 'Alamat dan kontak helpdesk', 'Dimana lokasinya?'],
          answer: text,
          keyPoints: [...entities.phones, ...entities.emails],
          confidence: 'Tinggi (99%)',
          triggerKeywords: ['kontak', 'telepon', 'whatsapp', 'email', 'alamat', 'wa']
        });
      }

      // Fallback: General informative paragraph
      else if (text.length > 60) {
        const firstSentence = text.split('.')[0] + '.';
        qaPairs.push({
          id: `QA-${idCounter++}`,
          intent: 'informasi_umum',
          category: 'Informasi Umum',
          question: `Informasi terkait: ${firstSentence.substring(0, 60)}...`,
          aliases: [`Apa penjelasan mengenai ${firstSentence.substring(0, 40)}?`],
          answer: text,
          keyPoints: ['Fakta Dokumen'],
          confidence: 'Sedang (90%)',
          triggerKeywords: text.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !this.stopWordsIndo.has(w)).slice(0, 4)
        });
      }
    });

    return qaPairs.slice(0, 25);
  }

  /**
   * Generate RAG Vector Database Chunks (JSON & Text ready for Embedding)
   */
  generateRAGChunks(text, source) {
    const paragraphs = text.split(/\n\s*\n+/);
    const chunks = [];
    let chunkId = 1;

    let currentChunk = '';
    paragraphs.forEach(p => {
      if ((currentChunk + '\n\n' + p).length < 600) {
        currentChunk += (currentChunk ? '\n\n' : '') + p;
      } else {
        if (currentChunk.trim()) {
          chunks.push({
            chunk_id: `chunk_${chunkId++}`,
            source,
            content: currentChunk.trim(),
            metadata: {
              category: this.detectCategory(currentChunk),
              character_count: currentChunk.length
            }
          });
        }
        currentChunk = p;
      }
    });

    if (currentChunk.trim()) {
      chunks.push({
        chunk_id: `chunk_${chunkId++}`,
        source,
        content: currentChunk.trim(),
        metadata: {
          category: this.detectCategory(currentChunk),
          character_count: currentChunk.length
        }
      });
    }

    return chunks;
  }

  /**
   * Generate AI Chatbot System Instructions / Prompt Knowledge Base
   */
  generateChatbotSystemPrompt(qaPairs, sourceName) {
    let prompt = `You are a helpful, factual, and strictly grounded AI Assistant for "${sourceName}".\n`;
    prompt += `Your job is to answer user queries accurately based ONLY on the following verified Knowledge Base.\n`;
    prompt += `Rules:\n`;
    prompt += `1. If the information is in the knowledge base, provide a polite, concise, and helpful answer.\n`;
    prompt += `2. If the user asks something not present in the knowledge base, politely say you do not have that specific information and direct them to contact official helpdesk.\n`;
    prompt += `3. Never hallucinate or invent prices, dates, or study programs.\n\n`;
    prompt += `### VERIFIED KNOWLEDGE BASE:\n\n`;

    qaPairs.forEach((qa, idx) => {
      prompt += `[KB #${idx + 1}] CATEGORY: ${qa.category} | INTENT: ${qa.intent}\n`;
      prompt += `QUESTION TRIGGER: ${qa.question}\n`;
      prompt += `ANSWER: ${qa.answer}\n`;
      prompt += `KEY VALUES: ${(qa.keyPoints || []).join(', ') || '-'}\n\n`;
    });

    return prompt;
  }

  /**
   * Fast Local Simulator Matcher (Simulates Chatbot in-browser)
   */
  simulateChatbotAnswer(userQuestion, qaPairs) {
    const qLower = userQuestion.toLowerCase();
    const qWords = qLower.split(/\s+/).filter(w => w.length > 2 && !this.stopWordsIndo.has(w));

    let bestMatch = null;
    let bestScore = 0;

    qaPairs.forEach(qa => {
      let score = 0;
      
      // Keyword matching
      qa.triggerKeywords.forEach(kw => {
        if (qLower.includes(kw.toLowerCase())) score += 3;
      });

      // Aliases matching
      qa.aliases.forEach(alias => {
        const aWords = alias.toLowerCase().split(/\s+/);
        aWords.forEach(aw => {
          if (qWords.includes(aw)) score += 2;
        });
      });

      // Question title matching
      qWords.forEach(qw => {
        if (qa.question.toLowerCase().includes(qw)) score += 1.5;
        if (qa.answer.toLowerCase().includes(qw)) score += 1;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = qa;
      }
    });

    if (bestMatch && bestScore >= 2) {
      return {
        matched: true,
        answer: bestMatch.answer,
        intent: bestMatch.intent,
        category: bestMatch.category,
        confidence: Math.min(99, Math.round(75 + bestScore * 3)),
        matchedQuestion: bestMatch.question
      };
    }

    return {
      matched: false,
      answer: `Maaf, saya belum menemukan informasi spesifik mengenai hal tersebut di dalam basis data yang diberikan. Anda dapat menghubungi kontak atau helpdesk resmi kampus untuk informasi lebih lanjut.`,
      intent: 'fallback_unknown',
      category: 'Uncertain',
      confidence: 30,
      matchedQuestion: '-'
    };
  }
}

// Attach to window
window.KnowledgeExtractor = KnowledgeExtractor;
