/**
 * CampusMiner AI - Multi-Format Export Module
 * Excel (Multi-sheet XLSX), JSON, CSV, Markdown, and Clipboard Handler
 * Supports both Web Scraping and PDF/Word Document datasets
 */

class CampusExporter {
  constructor(data) {
    this.data = data;
    const rawName = data.identity?.name || data.campusData?.campusName || data.filename || 'Data_Kampus';
    this.safeCampusName = rawName.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 40);
  }

  /**
   * Export Web Dataset to Multi-sheet Excel Workbook (.xlsx)
   */
  exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Library SheetJS belum terload. Silakan periksa koneksi internet.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Profil & Identitas
    const profileRows = [
      ['PROPERTI', 'NILAI'],
      ['Nama Resmi Kampus', this.data.identity?.name || '-'],
      ['Akronim / Singkatan', this.data.identity?.acronym || '-'],
      ['Status Institusi', this.data.identity?.status || '-'],
      ['Peringkat Akreditasi', this.data.identity?.akreditasi || '-'],
      ['Rektor / Pimpinan', this.data.identity?.rektor || '-'],
      ['Tahun Berdiri', this.data.identity?.founded || '-'],
      ['Lokasi', this.data.identity?.location || '-'],
      ['URL Asal', this.data.url || '-'],
      ['Waktu Ekstraksi', this.data.timestamp || '-'],
      ['Motto / Deskripsi', this.data.identity?.motto || '-']
    ];
    const wsProfile = XLSX.utils.aoa_to_sheet(profileRows);
    XLSX.utils.book_append_sheet(wb, wsProfile, 'Profil Kampus');

    // Sheet 2: Fakultas & Program Studi
    const prodiRows = [
      ['No', 'Fakultas / Departemen', 'Jenjang', 'Nama Program Studi', 'Akreditasi', 'Nama Lengkap']
    ];
    let prodiIndex = 1;
    if (this.data.academic && this.data.academic.faculties) {
      this.data.academic.faculties.forEach(fac => {
        fac.programs.forEach(prog => {
          prodiRows.push([
            prodiIndex++,
            fac.name,
            prog.jenjang,
            prog.name,
            prog.akreditasi,
            prog.fullName
          ]);
        });
      });
    }
    const wsProdi = XLSX.utils.aoa_to_sheet(prodiRows);
    XLSX.utils.book_append_sheet(wb, wsProdi, 'Program Studi');

    // Sheet 3: Kontak, Email & Portal
    const contactRows = [
      ['Kategori', 'Tipe / Nama', 'Nilai / URL Tautan']
    ];
    (this.data.contacts?.emails || []).forEach(e => contactRows.push(['Email Resmi', 'Email', e]));
    (this.data.contacts?.phones || []).forEach(p => contactRows.push(['Telepon Resmi', 'Telepon', p]));
    (this.data.contacts?.whatsapp || []).forEach(w => contactRows.push(['WhatsApp', w.label, w.link]));
    (this.data.contacts?.addresses || []).forEach(a => contactRows.push(['Alamat Fisik', 'Alamat', a]));
    (this.data.contacts?.socials || []).forEach(s => contactRows.push(['Media Sosial', s.platform, s.link]));
    (this.data.contacts?.portals || []).forEach(pt => contactRows.push(['Portal Digital', pt.type, pt.link]));
    
    const wsContacts = XLSX.utils.aoa_to_sheet(contactRows);
    XLSX.utils.book_append_sheet(wb, wsContacts, 'Kontak & Portal');

    // Sheet 4: Dokumen & Brosur PDF
    if (this.data.documents && this.data.documents.length > 0) {
      const docRows = [
        ['No', 'Tipe', 'Judul Dokumen / Brosur', 'Link Download Langsung']
      ];
      this.data.documents.forEach((d, idx) => {
        docRows.push([idx + 1, d.type, d.title, d.url]);
      });
      const wsDocs = XLSX.utils.aoa_to_sheet(docRows);
      XLSX.utils.book_append_sheet(wb, wsDocs, 'Dokumen & PDF');
    }

    // Sheet 5: Brosur Gambar, Pamflet & Infografis
    if (this.data.images && this.data.images.length > 0) {
      const imgRows = [
        ['No', 'Kategori', 'Judul / Alt Text', 'Dimensi', 'URL Gambar Asli']
      ];
      this.data.images.forEach((img, idx) => {
        imgRows.push([idx + 1, img.category, img.title, img.dimensions, img.url]);
      });
      const wsImgs = XLSX.utils.aoa_to_sheet(imgRows);
      XLSX.utils.book_append_sheet(wb, wsImgs, 'Brosur & Gambar Web');
    }

    // Sheet 5+: Extracted HTML Tables
    if (this.data.tables && this.data.tables.length > 0) {
      this.data.tables.forEach((t, i) => {
        const tableRows = [t.headers, ...t.rows];
        const wsTable = XLSX.utils.aoa_to_sheet(tableRows);
        const safeSheetName = (t.title || `Tabel_${i + 1}`).substring(0, 28).replace(/[\\/?*[\]]/g, '_');
        XLSX.utils.book_append_sheet(wb, wsTable, safeSheetName);
      });
    }

    const filename = `${this.safeCampusName}_Dataset.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export Document (PDF / Word) Dataset to Excel
   */
  exportDocumentToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Library SheetJS belum terload. Silakan periksa koneksi internet.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Metadata Dokumen & Entitas
    const docMeta = [
      ['PROPERTI DOKUMEN', 'NILAI'],
      ['Nama Berkas', this.data.filename || '-'],
      ['Format Berkas', this.data.format || '-'],
      ['Jumlah Halaman', this.data.totalPages || 1],
      ['Ukuran File', this.data.fileSize || '-'],
      ['Institusi Terdeteksi', this.data.campusData?.campusName || '-'],
      ['Status', this.data.campusData?.status || '-'],
      ['Akreditasi', this.data.campusData?.akreditasi || '-'],
      ['Nomor SK / Legalitas', this.data.campusData?.skNumber || '-'],
      ['Waktu Analisis', this.data.timestamp || '-']
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(docMeta);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Info Dokumen');

    // Sheet 2: Program Studi
    const prodis = this.data.campusData?.allPrograms || [];
    if (prodis.length > 0) {
      const prodiRows = [['No', 'Jenjang', 'Nama Program Studi', 'Akreditasi', 'Nama Lengkap']];
      prodis.forEach((p, idx) => {
        prodiRows.push([idx + 1, p.jenjang, p.name, p.akreditasi, p.fullName]);
      });
      const wsProdi = XLSX.utils.aoa_to_sheet(prodiRows);
      XLSX.utils.book_append_sheet(wb, wsProdi, 'Program Studi Dokumen');
    }

    // Sheet 3+: Tables found in Document
    const tables = this.data.tables || [];
    if (tables.length > 0) {
      tables.forEach((t, i) => {
        const tableRows = [t.headers, ...t.rows];
        const wsTable = XLSX.utils.aoa_to_sheet(tableRows);
        const safeSheetName = (t.title || `Tabel_Doc_${i + 1}`).substring(0, 28).replace(/[\\/?*[\]]/g, '_');
        XLSX.utils.book_append_sheet(wb, wsTable, safeSheetName);
      });
    }

    const filename = `${this.safeCampusName}_Document_Dataset.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export to JSON Dataset
   */
  exportToJSON() {
    const jsonStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    this.downloadBlob(blob, `${this.safeCampusName}_Dataset.json`);
  }

  /**
   * Export Study Programs to CSV with UTF-8 BOM
   */
  exportToCSV() {
    let csvContent = '\uFEFFNo,Fakultas,Jenjang,Nama Program Studi,Akreditasi,Nama Lengkap\n';

    let index = 1;
    const prodiList = this.data.academic?.allPrograms || this.data.campusData?.allPrograms || [];
    
    prodiList.forEach(prog => {
      const row = [
        index++,
        `"${(prog.faculty || 'Umum').replace(/"/g, '""')}"`,
        `"${(prog.jenjang || '').replace(/"/g, '""')}"`,
        `"${(prog.name || '').replace(/"/g, '""')}"`,
        `"${(prog.akreditasi || '').replace(/"/g, '""')}"`,
        `"${(prog.fullName || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${this.safeCampusName}_Prodi_List.csv`);
  }

  /**
   * Export to Comprehensive Markdown Report
   */
  exportToMarkdown() {
    let md = '';
    
    if (this.data.format) {
      // Document Markdown
      md += `# Laporan Analisis Dokumen: ${this.data.filename}\n\n`;
      md += `> Format: **${this.data.format}** | Total Halaman: **${this.data.totalPages}** | Ukuran: **${this.data.fileSize}**\n`;
      md += `> Diekstrak oleh **CampusMiner AI** pada ${new Date(this.data.timestamp).toLocaleString('id-ID')}\n\n`;
      
      md += `## 1. Entitas & Informasi Kampus Terdeteksi\n\n`;
      md += `- **Nama Kampus:** ${this.data.campusData?.campusName || '-'}\n`;
      md += `- **Status:** ${this.data.campusData?.status || '-'}\n`;
      md += `- **Akreditasi:** ${this.data.campusData?.akreditasi || '-'}\n`;
      md += `- **Nomor SK:** ${this.data.campusData?.skNumber || '-'}\n\n`;

      const prodis = this.data.campusData?.allPrograms || [];
      if (prodis.length > 0) {
        md += `## 2. Program Studi yang Ditemukan (${prodis.length})\n\n`;
        md += `| Jenjang | Nama Program Studi | Akreditasi |\n| :--- | :--- | :--- |\n`;
        prodis.forEach(p => {
          md += `| **${p.jenjang}** | ${p.name} | ${p.akreditasi} |\n`;
        });
        md += `\n`;
      }

      md += `## 3. Teks Dokumen\n\n`;
      md += this.data.fullText || '';
    } else {
      // Web Markdown
      md += `# Laporan Data Kampus: ${this.data.identity?.name || 'Institusi'}\n\n`;
      md += `> Diekstrak secara otomatis oleh **CampusMiner AI** pada ${new Date(this.data.timestamp).toLocaleString('id-ID')}\n`;
      md += `> Sumber URL: [${this.data.url}](${this.data.url})\n\n`;

      md += `## 1. Identitas & Profil Kampus\n\n`;
      md += `| Parameter | Nilai |\n| :--- | :--- |\n`;
      md += `| **Nama Resmi** | ${this.data.identity?.name} |\n`;
      md += `| **Akronim** | ${this.data.identity?.acronym || '-'} |\n`;
      md += `| **Status** | ${this.data.identity?.status} |\n`;
      md += `| **Akreditasi** | ${this.data.identity?.akreditasi} |\n`;
      md += `| **Rektor / Pimpinan** | ${this.data.identity?.rektor} |\n`;
      md += `| **Tahun Berdiri** | ${this.data.identity?.founded} |\n`;
      md += `| **Lokasi** | ${this.data.identity?.location} |\n\n`;

      md += `## 2. Struktur Fakultas & Program Studi\n\n`;
      if (this.data.academic && this.data.academic.faculties?.length > 0) {
        this.data.academic.faculties.forEach(fac => {
          md += `### ${fac.name}\n\n`;
          md += `| Jenjang | Program Studi | Akreditasi |\n| :--- | :--- | :--- |\n`;
          fac.programs.forEach(p => {
            md += `| **${p.jenjang}** | ${p.name} | ${p.akreditasi} |\n`;
          });
          md += `\n`;
        });
      }
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    this.downloadBlob(blob, `${this.safeCampusName}_Report.md`);
  }

  /**
   * Copy Formatted Text Summary to Clipboard
   */
  async copySummaryToClipboard() {
    let text = '';
    if (this.data.format) {
      text += `📄 **Dokumen: ${this.data.filename} (${this.data.format})**\n`;
      text += `🏛️ Kampus: ${this.data.campusData?.campusName || '-'}\n`;
      text += `⭐ Status: ${this.data.campusData?.status || '-'} | ${this.data.campusData?.akreditasi || '-'}\n`;
      text += `🎓 Total Prodi: ${this.data.campusData?.allPrograms?.length || 0}\n`;
    } else {
      text += `🏛️ **${this.data.identity?.name}**\n`;
      text += `⭐ Status: ${this.data.identity?.status} | Akreditasi: ${this.data.identity?.akreditasi}\n`;
      text += `📍 Lokasi: ${this.data.identity?.location}\n`;
      text += `🔗 URL: ${this.data.url}\n`;
      text += `🎓 Total Prodi: ${this.data.academic?.totalPrograms || 0}\n`;
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  }

  /**
   * Export Knowledge Base to Excel Workbook (.xlsx)
   */
  exportKnowledgeToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Library SheetJS belum terload.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Q&A Chatbot Pairs
    const qaRows = [
      ['ID', 'Kategori', 'Intent Name', 'Trigger Question', 'Answer (Jawaban Chatbot)', 'Key Points / Entities', 'Confidence', 'Keywords']
    ];
    (this.data.qaPairs || []).forEach(qa => {
      qaRows.push([
        qa.id,
        qa.category,
        qa.intent,
        qa.question,
        qa.answer,
        (qa.keyPoints || []).join(', '),
        qa.confidence,
        (qa.triggerKeywords || []).join(', ')
      ]);
    });
    const wsQA = XLSX.utils.aoa_to_sheet(qaRows);
    XLSX.utils.book_append_sheet(wb, wsQA, 'Chatbot QA Pairs');

    // Sheet 2: Keywords & Synonyms
    const kwRows = [
      ['Tipe', 'Kata Kunci / Frasa', 'Frekuensi / Variasi', 'Kategori']
    ];
    (this.data.keywords?.primary || []).forEach(k => {
      kwRows.push(['Primary Keyword', k.keyword, k.frequency, k.category]);
    });
    (this.data.keywords?.phrases || []).forEach(p => {
      kwRows.push(['N-gram Phrase', p, '-', 'Phrase']);
    });
    const wsKW = XLSX.utils.aoa_to_sheet(kwRows);
    XLSX.utils.book_append_sheet(wb, wsKW, 'Keywords & Triggers');

    // Sheet 3: RAG Chunks
    const ragRows = [
      ['Chunk ID', 'Source', 'Category', 'Content']
    ];
    (this.data.ragChunks || []).forEach(r => {
      ragRows.push([r.chunk_id, r.source, r.metadata?.category || 'General', r.content]);
    });
    const wsRAG = XLSX.utils.aoa_to_sheet(ragRows);
    XLSX.utils.book_append_sheet(wb, wsRAG, 'RAG Document Chunks');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, `KnowledgeBase_${this.safeCampusName}.xlsx`);
  }

  /**
   * Export Chatbot Training Dataset in JSONL / JSON format
   */
  exportChatbotJSONL() {
    const dataset = (this.data.qaPairs || []).map(qa => ({
      id: qa.id,
      category: qa.category,
      intent: qa.intent,
      user_prompt: qa.question,
      user_aliases: qa.aliases || [],
      bot_response: qa.answer,
      grounded_facts: qa.keyPoints || [],
      trigger_keywords: qa.triggerKeywords || []
    }));

    const jsonlString = dataset.map(item => JSON.stringify(item)).join('\n');
    const blob = new Blob([jsonlString], { type: 'application/x-jsonlines;charset=utf-8;' });
    this.downloadBlob(blob, `Chatbot_Dataset_${this.safeCampusName}.jsonl`);
  }

  /**
   * Export RAG Chunks format for Vector Databases
   */
  exportRAGChunksJSON() {
    const jsonStr = JSON.stringify(this.data.ragChunks || [], null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    this.downloadBlob(blob, `RAG_Chunks_${this.safeCampusName}.json`);
  }

  /**
   * Export AI Chatbot System Prompt (.txt)
   */
  exportSystemPromptTxt() {
    const prompt = this.data.systemPrompt || '';
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8;' });
    this.downloadBlob(blob, `Chatbot_System_Prompt_${this.safeCampusName}.txt`);
  }

  /**
   * Helper to trigger browser download
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

// Attach to window
window.CampusExporter = CampusExporter;
