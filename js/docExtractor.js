/**
 * CampusMiner AI - Document Intelligence & Parser Engine (Tune-Up Edition)
 * Fast, non-blocking in-browser PDF & DOCX text, table & campus entity extractor
 */

class DocumentExtractor {
  constructor() {
    this.cache = new window.PerfUtils.LRUCache(30);
    this.proxyEndpoints = [
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url) => `https://proxy.cors.sh/${url}`
    ];
    
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  /**
   * Fetch Document from URL with LRU Caching
   */
  async fetchDocumentArrayBuffer(url, onLog = () => {}) {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (this.cache.has(cleanUrl)) {
      onLog('CACHE', 'Memuat dokumen dari Memory Cache (Instant 0ms)...');
      return this.cache.get(cleanUrl);
    }

    onLog('INIT', `Mengunduh berkas dokumen: ${cleanUrl}`);

    // Direct fetch
    try {
      onLog('FETCH', 'Mencoba direct download...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(cleanUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer && buffer.byteLength > 100) {
          const result = { buffer, filename: this.getFilenameFromUrl(cleanUrl), size: buffer.byteLength };
          this.cache.set(cleanUrl, result);
          onLog('SUCCESS', `Direct download berhasil (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
          return result;
        }
      }
    } catch (e) {
      onLog('PROXY', 'Direct download terhalang CORS. Mengaktifkan proxy pool...');
    }

    // Proxy pool
    for (let i = 0; i < this.proxyEndpoints.length; i++) {
      const proxyBuilder = this.proxyEndpoints[i];
      const proxyUrl = proxyBuilder(cleanUrl);
      onLog('PROXY', `Mengunduh via Proxy Node #${i + 1}...`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const buffer = await res.arrayBuffer();
          if (buffer && buffer.byteLength > 100) {
            const result = { buffer, filename: this.getFilenameFromUrl(cleanUrl), size: buffer.byteLength };
            this.cache.set(cleanUrl, result);
            onLog('SUCCESS', `Proxy Node #${i + 1} berhasil (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
            return result;
          }
        }
      } catch (err) {
        onLog('WARN', `Proxy Node #${i + 1} gagal (${err.message || 'Timeout'})...`);
      }

      await window.PerfUtils.yieldToMain();
    }

    throw new Error('Gagal mengunduh berkas dokumen dari URL. Silakan coba upload file langsung.');
  }

  /**
   * Main parsing entry point with cooperative non-blocking yielding
   */
  async processDocumentBuffer(arrayBuffer, filename = 'Dokumen', onLog = () => {}) {
    const isWord = filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc');

    onLog('PARSE', `Mendeteksi format berkas: ${isWord ? 'Microsoft Word (.docx)' : 'Adobe PDF (.pdf)'}`);
    await window.PerfUtils.yieldToMain();

    let docResult = null;
    if (isWord) {
      docResult = await this.parseWordDocument(arrayBuffer, filename, onLog);
    } else {
      docResult = await this.parsePdfDocument(arrayBuffer, filename, onLog);
    }

    await window.PerfUtils.yieldToMain();
    onLog('AI-SCAN', 'Menganalisis entitas kampus, prodi, akreditasi, biaya & kontak...');
    
    const campusData = this.analyzeDocumentForCampusEntities(docResult, onLog);
    await window.PerfUtils.yieldToMain();

    onLog('COMPLETE', 'Ekstraksi dokumen berhasil 100%!');

    return {
      ...docResult,
      campusData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * PDF Parser using PDF.js with non-blocking per-page yielding
   */
  async parsePdfDocument(arrayBuffer, filename, onLog = () => {}) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('Library PDF.js belum siap. Periksa koneksi internet Anda.');
    }

    onLog('PDF-INIT', 'Membuka struktur PDF...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    onLog('PDF-PAGES', `PDF memiliki ${totalPages} halaman. Mengekstrak teks & struktur...`);

    let fullText = '';
    const pages = [];
    const tables = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (pageNum % 3 === 0 || pageNum === 1 || pageNum === totalPages) {
        onLog('PDF-PAGE', `Memproses halaman ${pageNum} dari ${totalPages}...`);
      }

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let pageLines = [];
      let currentLine = '';
      let lastY = null;

      for (const item of textContent.items) {
        const text = item.str;
        if (!text) continue;

        const currentY = item.transform ? item.transform[5] : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          currentLine = text;
        } else {
          currentLine += (currentLine.length > 0 && !currentLine.endsWith(' ') ? ' ' : '') + text;
        }
        lastY = currentY;
      }
      if (currentLine.trim()) pageLines.push(currentLine.trim());

      const pageText = pageLines.join('\n');
      fullText += `\n\n--- [Halaman ${pageNum}] ---\n\n` + pageText;

      pages.push({
        pageNumber: pageNum,
        lines: pageLines,
        text: pageText
      });

      // Detect table-like structures
      const tableRows = [];
      pageLines.forEach(line => {
        const columns = line.split(/\s{2,}|\t|\|/).map(c => c.trim()).filter(Boolean);
        if (columns.length >= 3) {
          tableRows.push(columns);
        }
      });

      if (tableRows.length >= 3 && tables.length < 10) {
        tables.push({
          title: `Tabel dari Halaman ${pageNum}`,
          page: pageNum,
          headers: tableRows[0],
          rows: tableRows.slice(1, 300)
        });
      }

      // Yield every 2 pages to keep UI 60 FPS
      if (pageNum % 2 === 0) {
        await window.PerfUtils.yieldToMain();
      }
    }

    let meta = { title: filename, author: '', creator: '', producer: '' };
    try {
      const metadata = await pdfDoc.getMetadata();
      if (metadata?.info) {
        meta.title = metadata.info.Title || filename;
        meta.author = metadata.info.Author || '';
        meta.creator = metadata.info.Creator || '';
        meta.producer = metadata.info.Producer || '';
      }
    } catch (e) {}

    return {
      format: 'PDF',
      filename,
      totalPages,
      fileSize: `${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`,
      metadata: meta,
      pages,
      tables,
      fullText: fullText.trim()
    };
  }

  /**
   * Word (.docx) Parser using Mammoth.js
   */
  async parseWordDocument(arrayBuffer, filename, onLog = () => {}) {
    if (typeof mammoth === 'undefined') {
      throw new Error('Library Mammoth.js belum siap. Periksa koneksi internet Anda.');
    }

    onLog('DOCX-INIT', 'Membaca struktur file Word (.docx)...');
    await window.PerfUtils.yieldToMain();

    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });

    const fullText = rawResult.value || '';
    const rawHtml = htmlResult.value || '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    const tables = [];
    const tableEls = doc.querySelectorAll('table');
    tableEls.forEach((tbl, idx) => {
      if (idx >= 10) return;
      const headers = [];
      const rows = [];
      const trs = tbl.querySelectorAll('tr');

      trs.forEach((tr, trIdx) => {
        if (trIdx > 300) return;
        const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent.trim());
        if (trIdx === 0 && cells.length > 0) {
          headers.push(...cells);
        } else if (cells.length > 0) {
          rows.push(cells);
        }
      });

      if (rows.length > 0) {
        tables.push({
          title: `Tabel Dokumen Word #${idx + 1}`,
          headers: headers.length > 0 ? headers : Array.from({ length: rows[0].length }, (_, i) => `Kolom ${i + 1}`),
          rows
        });
      }
    });

    const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const pages = [];
    let currentPageLines = [];
    let wordCount = 0;
    let pageNum = 1;

    paragraphs.forEach(p => {
      const words = p.split(/\s+/).length;
      currentPageLines.push(p.trim());
      wordCount += words;
      if (wordCount >= 350) {
        pages.push({
          pageNumber: pageNum++,
          lines: currentPageLines,
          text: currentPageLines.join('\n\n')
        });
        currentPageLines = [];
        wordCount = 0;
      }
    });

    if (currentPageLines.length > 0) {
      pages.push({
        pageNumber: pageNum,
        lines: currentPageLines,
        text: currentPageLines.join('\n\n')
      });
    }

    return {
      format: 'Word (DOCX)',
      filename,
      totalPages: pages.length || 1,
      fileSize: `${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`,
      metadata: { title: filename },
      pages,
      tables,
      fullText
    };
  }

  /**
   * Campus Intelligence Analyzer for Document Text
   */
  analyzeDocumentForCampusEntities(docResult, onLog = () => {}) {
    const text = docResult.fullText;
    const lowerText = text.toLowerCase();

    let campusName = '';
    const campusKeywords = ['Universitas', 'Institut', 'Politeknik', 'Sekolah Tinggi', 'Akademi', 'University', 'College'];
    
    const firstLines = (docResult.pages[0]?.lines || text.split('\n')).slice(0, 15);
    for (const line of firstLines) {
      const clean = line.trim();
      if (campusKeywords.some(kw => clean.includes(kw)) && clean.length > 8 && clean.length < 85) {
        campusName = clean;
        break;
      }
    }
    if (!campusName) {
      const match = text.match(/(?:UNIVERSITAS|INSTITUT|POLITEKNIK|SEKOLAH TINGGI)\s+[A-Z\s]{3,45}/);
      if (match) campusName = match[0].trim();
    }
    if (!campusName) campusName = docResult.filename.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');

    let status = 'Perguruan Tinggi';
    if (lowerText.includes('ptn-bh') || lowerText.includes('badan hukum')) status = 'PTN-BH (Negeri)';
    else if (lowerText.includes('ptn') || lowerText.includes('negeri')) status = 'PTN (Negeri)';
    else if (lowerText.includes('pts') || lowerText.includes('swasta') || lowerText.includes('yayasan')) status = 'PTS (Swasta)';
    else if (lowerText.includes('politeknik')) status = 'Politeknik';
    else if (lowerText.includes('institut')) status = 'Institut';

    let akreditasi = 'Terakreditasi';
    const akrMatch = text.match(/(?:akreditasi|peringkat)\s*[:=\-]?\s*(unggul|a|baik sekali|b|baik|c)/i);
    if (akrMatch) {
      akreditasi = `Akreditasi ${akrMatch[1].toUpperCase()}`;
    } else if (text.includes('BAN-PT') || text.includes('LAM-PTKes') || text.includes('LAMEMBA')) {
      akreditasi = 'Akreditasi BAN-PT / LAM';
    }

    let skNumber = '-';
    const skMatch = text.match(/(?:SK|Surat Keputusan|Nomor|No\.)\s*[:=\-]?\s*([A-Za-z0-9\/\.\-]+(?:BAN-PT|MENDIKBUD|KEMENDIKBUD|DIKTI|SK|Kpts)[A-Za-z0-9\/\.\-]*)/i);
    if (skMatch) skNumber = skMatch[0].trim();

    const faculties = [];
    const allPrograms = [];
    const facultyRegex = /(?:Fakultas|Sekolah|Pascasarjana|Departemen|Jurusan)\s+[A-Z][a-zA-Z\s&()-]{3,50}/g;
    const prodiRegex = /\b(D3|D4|S1|S2|S3|Sarjana|Magister|Doktor|Profesi|Spesialis)\s+([A-Z][a-zA-Z\s/&()-]{3,45})/g;

    const facMatches = text.match(facultyRegex) || [];
    const uniqueFacs = [...new Set(facMatches.map(f => f.trim()))].filter(f => f.length < 55);

    let match;
    while ((match = prodiRegex.exec(text)) !== null) {
      const jenjang = match[1].toUpperCase().replace('SARJANA', 'S1').replace('MAGISTER', 'S2').replace('DOKTOR', 'S3');
      const name = match[2].trim().replace(/\s+/g, ' ');
      if (name.length >= 4 && !allPrograms.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        allPrograms.push({
          jenjang,
          name,
          fullName: `${jenjang} ${name}`,
          akreditasi: akreditasi || '-'
        });
      }
    }

    if (uniqueFacs.length > 0) {
      uniqueFacs.forEach(facName => {
        faculties.push({
          name: facName,
          programs: allPrograms.slice(0, 6)
        });
      });
    } else if (allPrograms.length > 0) {
      faculties.push({
        name: 'Daftar Program Studi Dokumen',
        programs: allPrograms
      });
    }

    const tuitionItems = [];
    const moneyRegex = /(?:UKT|Biaya Kuliah|SPP|IPI|BPI|Biaya Masuk|DPP|Kelompok\s+[I|V|X\d]+)?\s*[:=\-]?\s*(?:Rp\.?|IDR)\s*[\d.,]+(?:\s*(?:juta|ribu|jt|\/\s*semester))?/gi;
    const moneyMatches = text.match(moneyRegex) || [];
    const uniqueMoney = [...new Set(moneyMatches.map(m => m.trim()))].filter(m => m.length > 5 && m.length < 45);

    uniqueMoney.slice(0, 8).forEach(m => {
      tuitionItems.push({
        title: 'Komponen Biaya / UKT',
        desc: m,
        amount: m
      });
    });

    const emailMatches = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g) || [];
    const phoneMatches = text.match(/(?:\+62|62|0)(?:21|22|24|31|274|251|8[1-9][0-9])[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,5}/g) || [];
    const websiteMatches = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g) || [];

    const contacts = {
      emails: [...new Set(emailMatches)].filter(e => !e.endsWith('.png')).slice(0, 5),
      phones: [...new Set(phoneMatches)].slice(0, 5),
      websites: [...new Set(websiteMatches)].slice(0, 4),
      skNumber
    };

    return {
      campusName,
      status,
      akreditasi,
      skNumber,
      faculties,
      allPrograms,
      tuitionItems,
      contacts
    };
  }

  getFilenameFromUrl(url) {
    try {
      const pathname = new URL(url).pathname;
      const basename = pathname.substring(pathname.lastIndexOf('/') + 1);
      return basename || 'Dokumen.pdf';
    } catch (e) {
      return 'Dokumen.pdf';
    }
  }
}

window.DocumentExtractor = DocumentExtractor;
