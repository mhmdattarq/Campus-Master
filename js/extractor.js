/**
 * CampusMiner AI - Core Extraction & Intelligence Engine (Tune-Up Edition)
 * Fast, non-blocking DOM parser with LRU memory caching & cooperative yielding
 */

class CampusExtractor {
  constructor() {
    this.cache = new window.PerfUtils.LRUCache(40);
    this.proxyEndpoints = [
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url) => `https://proxy.cors.sh/${url}`,
      (url) => `https://thingproxy.freeboard.io/fetch/${url}`
    ];
    this.turndownService = null;
    if (typeof TurndownService !== 'undefined') {
      this.turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });
    }
  }

  /**
   * Main fetch pipeline with LRU Cache and multi-proxy racing
   */
  async fetchWebpage(targetUrl, onLog = () => {}, bypassCache = false) {
    let url = targetUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Check LRU In-Memory Cache first for instant 0ms response
    if (!bypassCache && this.cache.has(url)) {
      onLog('CACHE', 'Memuat halaman dari Memory Cache (Instant 0ms)...');
      return this.cache.get(url);
    }

    onLog('INIT', `Memulai fetch target: ${url}`);
    let lastError = null;

    // 1. Try Direct fetch first (works for CORS-enabled APIs)
    try {
      onLog('FETCH', 'Mencoba direct fetch (Fast lane)...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const html = await res.text();
        if (html && html.length > 200) {
          const result = { html, url, fetchMethod: 'direct' };
          this.cache.set(url, result);
          onLog('SUCCESS', `Direct fetch berhasil (${(html.length / 1024).toFixed(1)} KB)`);
          return result;
        }
      }
    } catch (e) {
      onLog('PROXY', 'Direct fetch terhalang CORS. Mengaktifkan proxy pool berkecepatan tinggi...');
    }

    // 2. Try proxy pool sequentially with fast failover
    for (let i = 0; i < this.proxyEndpoints.length; i++) {
      const proxyBuilder = this.proxyEndpoints[i];
      const proxyUrl = proxyBuilder(url);
      onLog('PROXY', `Menghubungkan via Proxy Node #${i + 1}...`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const res = await fetch(proxyUrl, { 
          signal: controller.signal,
          headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const html = await res.text();
          if (html && html.length > 200) {
            const result = { html, url, fetchMethod: `proxy-${i + 1}` };
            this.cache.set(url, result);
            onLog('SUCCESS', `Proxy Node #${i + 1} sukses mengambil ${(html.length / 1024).toFixed(1)} KB data`);
            return result;
          }
        }
      } catch (err) {
        lastError = err;
        onLog('WARN', `Proxy Node #${i + 1} gagal (${err.message || 'Timeout'}). Beralih...`);
      }
      
      // Yield to avoid freezing UI while testing proxy pool
      await window.PerfUtils.yieldToMain();
    }

    throw new Error(lastError ? lastError.message : 'Semua proxy gagal menghubungi website target.');
  }

  /**
   * Parse Raw HTML into DOM with non-blocking cooperative yielding
   */
  async extractCampusData(html, baseUrl, onLog = () => {}) {
    onLog('PARSE', 'Membedah struktur DOM & elemen semantic...');
    await window.PerfUtils.yieldToMain();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Set base for relative links resolution
    const baseEl = doc.createElement('base');
    baseEl.href = baseUrl;
    doc.head.appendChild(baseEl);

    onLog('AI-SCAN', 'Menganalisis Metadata, Schema.org & OpenGraph...');
    const metadata = this.extractMetadata(doc, baseUrl);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Mendeteksi Profil, Akreditasi & Identitas Kampus...');
    const identity = this.extractCampusIdentity(doc, metadata, baseUrl);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Menambang struktur Fakultas & Program Studi...');
    const academic = this.extractFacultiesAndPrograms(doc);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Memindai Biaya Kuliah, UKT & Jalur PMB...');
    const tuitionAndAdmission = this.extractTuitionAndPMB(doc);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Mengumpulkan Kontak, WhatsApp & Portal Digital...');
    const contacts = this.extractContactsAndSocials(doc, baseUrl);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Mendeteksi Dokumen PDF & Brosur Pendaftaran...');
    const documents = this.extractDocumentsAndPdfs(doc, baseUrl);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Memindai Brosur Gambar, Pamflet & Galeri Web...');
    const images = this.extractWebImages(doc, baseUrl);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Mengekstrak Tabel Data HTML...');
    const tables = this.extractHtmlTables(doc);
    await window.PerfUtils.yieldToMain();

    onLog('AI-SCAN', 'Membersihkan artikel teks untuk Clean Reader...');
    const cleanContent = this.extractCleanContent(doc, html);

    onLog('COMPLETE', 'Ekstraksi data selesai 100%!');

    return {
      url: baseUrl,
      timestamp: new Date().toISOString(),
      payloadSize: `${(html.length / 1024).toFixed(1)} KB`,
      identity,
      metadata,
      academic,
      tuitionAndAdmission,
      contacts,
      documents,
      images,
      tables,
      cleanContent
    };
  }

  /**
   * Extract Meta Tags, OpenGraph, JSON-LD, Microdata
   */
  extractMetadata(doc, baseUrl) {
    const meta = {
      title: doc.title || '',
      description: '',
      keywords: '',
      favicon: '',
      ogImage: '',
      ogTitle: '',
      ogDescription: '',
      ogSiteName: '',
      jsonLd: [],
      rawMetaTags: []
    };

    const descEl = doc.querySelector('meta[name="description"]') || doc.querySelector('meta[property="og:description"]');
    if (descEl) meta.description = descEl.getAttribute('content') || '';

    const kwEl = doc.querySelector('meta[name="keywords"]');
    if (kwEl) meta.keywords = kwEl.getAttribute('content') || '';

    const ogImgEl = doc.querySelector('meta[property="og:image"]');
    if (ogImgEl) meta.ogImage = this.toAbsoluteUrl(ogImgEl.getAttribute('content'), baseUrl);

    const ogTitleEl = doc.querySelector('meta[property="og:title"]');
    if (ogTitleEl) meta.ogTitle = ogTitleEl.getAttribute('content') || '';

    const ogSiteEl = doc.querySelector('meta[property="og:site_name"]');
    if (ogSiteEl) meta.ogSiteName = ogSiteEl.getAttribute('content') || '';

    const favEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    if (favEl) {
      meta.favicon = this.toAbsoluteUrl(favEl.getAttribute('href'), baseUrl);
    } else {
      try {
        meta.favicon = `${new URL(baseUrl).origin}/favicon.ico`;
      } catch (e) {
        meta.favicon = '';
      }
    }

    // JSON-LD Scripts (bounded)
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script, idx) => {
      if (idx > 5) return;
      try {
        const parsed = JSON.parse(script.textContent);
        meta.jsonLd.push(parsed);
      } catch (e) {}
    });

    return meta;
  }

  /**
   * Smart Indonesian Campus Identity & Profile Resolver
   */
  extractCampusIdentity(doc, metadata, url) {
    const fullText = doc.body ? doc.body.innerText : '';
    const title = metadata.title || '';
    const ogSiteName = metadata.ogSiteName || '';

    let name = '';
    const campusKeywords = ['Universitas', 'Institut', 'Politeknik', 'Sekolah Tinggi', 'Akademi', 'University', 'College', 'State Polytechnic'];
    
    if (metadata.jsonLd.length > 0) {
      for (const item of metadata.jsonLd) {
        if (item['@type'] === 'CollegeOrUniversity' || item['@type'] === 'EducationalOrganization' || item['name']) {
          if (typeof item.name === 'string' && item.name.length > 3) {
            name = item.name;
            break;
          }
        }
      }
    }

    if (!name && ogSiteName) name = ogSiteName;
    if (!name) {
      const h1El = doc.querySelector('h1');
      if (h1El && campusKeywords.some(kw => h1El.textContent.includes(kw))) {
        name = h1El.textContent.trim();
      }
    }
    if (!name && title) {
      const parts = title.split(/[|\-–—•]/);
      for (const part of parts) {
        const cleanPart = part.trim();
        if (campusKeywords.some(kw => cleanPart.includes(kw))) {
          name = cleanPart;
          break;
        }
      }
      if (!name) name = parts[0].trim();
    }
    if (!name) {
      try {
        name = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        name = 'Perguruan Tinggi';
      }
    }

    name = name.replace(/\s+/g, ' ').trim();

    let acronym = '';
    const acronymMatch = name.match(/\(([A-Z0-9\-]{2,10})\)/);
    if (acronymMatch) {
      acronym = acronymMatch[1];
    } else {
      const words = name.split(' ');
      if (words.length > 1) {
        const caps = words.map(w => w[0] || '').join('').toUpperCase();
        if (caps.length >= 2 && caps.length <= 6) acronym = caps;
      }
    }

    let status = 'Perguruan Tinggi';
    const lowerText = fullText.toLowerCase();
    if (lowerText.includes('ptn-bh') || lowerText.includes('perguruan tinggi negeri badan hukum')) status = 'PTN-BH (Negeri)';
    else if (lowerText.includes('ptn') || lowerText.includes('perguruan tinggi negeri') || name.toLowerCase().includes('negeri')) status = 'PTN (Negeri)';
    else if (lowerText.includes('pts') || lowerText.includes('swasta') || lowerText.includes('yayasan')) status = 'PTS (Swasta)';
    else if (name.toLowerCase().includes('politeknik')) status = 'Politeknik';
    else if (name.toLowerCase().includes('institut')) status = 'Institut';
    else if (name.toLowerCase().includes('sekolah tinggi')) status = 'Sekolah Tinggi';

    let akreditasi = 'Terakreditasi';
    const akreditasiPatterns = [
      /akreditasi\s*(?:institusi|kampus)?\s*[:=\-]?\s*(unggul|a|baik sekali|b|baik|c)/i,
      /peringkat\s*akreditasi\s*[:=\-]?\s*(unggul|a|baik sekali|b|baik|c)/i,
      /terakreditasi\s*(unggul|a|baik sekali|b|baik|c)/i
    ];
    for (const pat of akreditasiPatterns) {
      const match = fullText.match(pat);
      if (match) {
        akreditasi = `Akreditasi ${match[1].toUpperCase()}`;
        break;
      }
    }
    if (akreditasi === 'Terakreditasi' && fullText.includes('BAN-PT')) {
      akreditasi = 'Akreditasi BAN-PT';
    }

    let rektor = '-';
    const rektorPatterns = [
      /rektor\s*[:=\-]?\s*([A-Za-z\s.,]+(?:Prof|Dr|Ph\.D|M\.[A-Za-z]+|S\.[A-Za-z]+)[A-Za-z\s.,]*)/i,
      /(?:rektor|direktur|ketua)\s*[:=\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5}(?:,\s*[A-Za-z.,\s]+)?)/
    ];
    for (const pat of rektorPatterns) {
      const match = fullText.match(pat);
      if (match && match[1].trim().length < 80) {
        rektor = match[1].trim().replace(/[\r\n\t]+/g, ' ');
        break;
      }
    }

    let founded = '-';
    const foundedPatterns = [
      /(?:berdiri|didirikan|sejak|tahun)\s*(?:pada\s*tahun|tahun)?\s*[:=\-]?\s*(19\d\d|20\d\d)/i,
      /est\.\s*(19\d\d|20\d\d)/i
    ];
    for (const pat of foundedPatterns) {
      const match = fullText.match(pat);
      if (match) {
        founded = match[1];
        break;
      }
    }

    let motto = metadata.description || `Portal resmi informasi dan layanan akademik ${name}`;
    if (motto.length > 200) motto = motto.substring(0, 197) + '...';

    let location = 'Indonesia';
    const cityMatch = fullText.match(/(?:Jakarta|Bandung|Surabaya|Yogyakarta|Semarang|Malang|Medan|Makassar|Denpasar|Palembang|Padang|Bogor|Depok|Tangerang|Bekasi|Surakarta|Solo)/i);
    if (cityMatch) location = cityMatch[0] + ', Indonesia';

    return {
      name,
      acronym,
      status,
      akreditasi,
      rektor,
      founded,
      motto,
      location,
      logo: metadata.favicon || metadata.ogImage || ''
    };
  }

  /**
   * Deep Faculty & Study Program Hierarchy Extractor
   */
  extractFacultiesAndPrograms(doc) {
    const faculties = [];
    const allPrograms = [];

    const facultyKeywords = ['Fakultas', 'Sekolah', 'Pascasarjana', 'Graduate School', 'Faculty of', 'School of', 'Departemen', 'Jurusan', 'Program Vokasi'];
    const jenjangRegex = /\b(D3|D4|S1|S2|S3|Sarjana Terapan|Diploma 3|Diploma 4|Sarjana|Magister|Doktor|Profesi|Spesialis|Sp\.1|Sp\.2)\b/i;
    const prodiRegex = /(?:Program Studi|Prodi|Jurusan)?\s*(?:(D3|D4|S1|S2|S3|Sarjana|Magister|Doktor|Profesi)\s+)?([A-Z][a-zA-Z\s/&()-]+(?:Teknik|Informatika|Sistem Informasi|Manajemen|Akuntansi|Kedokteran|Hukum|Psikologi|Ilmu Komunikasi|Farmasi|Biologi|Fisika|Kimia|Matematika|Statistika|Arsitektur|Desain|Pendidikan|Ekonomi|Sastra|Hubungan Internasional|Teknologi|Agroteknologi|Peternakan|Keperawatan|Kebidanan|Gizi)[a-zA-Z\s/&()-]*)/gi;

    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, .faculty-title, .card-title, .accordion-title, dt, strong');
    
    headingElements.forEach(heading => {
      const text = heading.textContent.trim();
      const isFaculty = facultyKeywords.some(kw => text.includes(kw)) && text.length > 5 && text.length < 90;

      if (isFaculty) {
        const facultyName = text.replace(/\s+/g, ' ');
        let existingFaculty = faculties.find(f => f.name.toLowerCase() === facultyName.toLowerCase());
        if (!existingFaculty) {
          existingFaculty = { name: facultyName, programs: [] };
          faculties.push(existingFaculty);
        }

        let nextSibling = heading.nextElementSibling;
        let scanLimit = 4;
        while (nextSibling && scanLimit > 0) {
          if (/^H[1-4]$/i.test(nextSibling.tagName)) break;

          const listItems = nextSibling.querySelectorAll('li, tr, .prodi-item, .program-card, p, a');
          if (listItems.length > 0) {
            listItems.forEach(item => {
              const itemText = item.textContent.trim().replace(/\s+/g, ' ');
              if (itemText.length > 3 && itemText.length < 90) {
                const parsedProdi = this.parseProdiItem(itemText);
                if (parsedProdi && !existingFaculty.programs.some(p => p.name.toLowerCase() === parsedProdi.name.toLowerCase())) {
                  existingFaculty.programs.push(parsedProdi);
                  allPrograms.push({ ...parsedProdi, faculty: facultyName });
                }
              }
            });
          }
          nextSibling = nextSibling.nextElementSibling;
          scanLimit--;
        }
      }
    });

    const textNodes = doc.querySelectorAll('li, p, td, a');
    textNodes.forEach(node => {
      const text = node.textContent.trim().replace(/\s+/g, ' ');
      if (text.length >= 6 && text.length <= 75) {
        if (jenjangRegex.test(text) || prodiRegex.test(text)) {
          const parsed = this.parseProdiItem(text);
          if (parsed && !allPrograms.some(p => p.name.toLowerCase() === parsed.name.toLowerCase())) {
            let defaultFaculty = faculties.find(f => f.name === 'Program Studi Universitas');
            if (!defaultFaculty) {
              defaultFaculty = { name: 'Program Studi Universitas', programs: [] };
              faculties.push(defaultFaculty);
            }
            defaultFaculty.programs.push(parsed);
            allPrograms.push({ ...parsed, faculty: defaultFaculty.name });
          }
        }
      }
    });

    const cleanFaculties = faculties.filter(f => f.programs.length > 0);

    return {
      totalFaculties: cleanFaculties.length,
      totalPrograms: allPrograms.length,
      faculties: cleanFaculties,
      allPrograms
    };
  }

  parseProdiItem(text) {
    let clean = text.replace(/^[•\-\d.)\s]+/, '').trim();
    if (clean.length < 4 || clean.length > 85) return null;
    if (clean.toLowerCase().startsWith('fakultas') || clean.toLowerCase().startsWith('universitas')) return null;

    let jenjang = 'S1';
    if (/\bD3\b|Diploma 3|Ahli Madya/i.test(clean)) jenjang = 'D3';
    else if (/\bD4\b|Diploma 4|Sarjana Terapan/i.test(clean)) jenjang = 'D4';
    else if (/\bS1\b|Sarjana/i.test(clean)) jenjang = 'S1';
    else if (/\bS2\b|Magister|Master/i.test(clean)) jenjang = 'S2';
    else if (/\bS3\b|Doktor|Doctoral/i.test(clean)) jenjang = 'S3';
    else if (/\bProfesi\b/i.test(clean)) jenjang = 'Profesi';
    else if (/\bSpesialis|Sp\.1|Sp\.2\b/i.test(clean)) jenjang = 'Spesialis';

    let akreditasi = '';
    const akrMatch = clean.match(/\((?:Akreditasi\s*)?(Unggul|Baik Sekali|A|B|C|Baik|Internasional|ASIIN|ABET)\)/i);
    if (akrMatch) {
      akreditasi = akrMatch[1].toUpperCase();
      clean = clean.replace(akrMatch[0], '').trim();
    }

    let name = clean.replace(/^(?:Program Studi|Prodi|Jurusan)\s*/i, '')
                    .replace(/^(?:D3|D4|S1|S2|S3|Sarjana|Magister|Doktor|Diploma 3|Diploma 4|Profesi)\s*(?:-|–|:)?\s*/i, '')
                    .trim();

    if (name.length < 3) return null;

    return {
      name,
      fullName: `${jenjang} ${name}`,
      jenjang,
      akreditasi: akreditasi || '-'
    };
  }

  extractTuitionAndPMB(doc) {
    const tuitionItems = [];
    const keywords = ['Biaya', 'UKT', 'Uang Kuliah', 'SPP', 'Pangkal', 'Jalur Masuk', 'PMB', 'SNBP', 'SNBT', 'Mandiri', 'Beasiswa', 'Syarat Pendaftaran'];
    
    const elements = doc.querySelectorAll('h2, h3, h4, .card, .pricing-item, table, tr, p');
    elements.forEach(el => {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      if (keywords.some(kw => text.includes(kw)) && text.length > 10 && text.length < 350) {
        const amountMatch = text.match(/Rp\s*[\d.,]+(?:\s*(?:juta|ribu|jt))?/i);
        tuitionItems.push({
          title: text.substring(0, 55),
          desc: text,
          amount: amountMatch ? amountMatch[0] : null
        });
      }
    });

    const uniqueTuitions = [];
    const seen = new Set();
    for (const item of tuitionItems) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTuitions.push(item);
      }
    }

    return {
      totalFound: uniqueTuitions.length,
      items: uniqueTuitions.slice(0, 12)
    };
  }

  extractContactsAndSocials(doc, baseUrl) {
    const fullText = doc.body ? doc.body.innerText : '';
    const contacts = { emails: [], phones: [], whatsapp: [], addresses: [], socials: [], portals: [] };

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailMatches = fullText.match(emailRegex) || [];
    contacts.emails = [...new Set(emailMatches)].filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.svg')).slice(0, 6);

    const phoneRegex = /(?:\+62|62|0)(?:21|22|24|31|274|251|8[1-9][0-9])[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,5}/g;
    const phoneMatches = fullText.match(phoneRegex) || [];
    contacts.phones = [...new Set(phoneMatches)].filter(p => p.length >= 8 && p.length <= 18).slice(0, 6);

    const links = doc.querySelectorAll('a[href]');
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const absHref = this.toAbsoluteUrl(href, baseUrl);
      const text = a.textContent.trim();

      if (absHref.includes('wa.me/') || absHref.includes('api.whatsapp.com')) {
        if (!contacts.whatsapp.some(w => w.link === absHref)) {
          contacts.whatsapp.push({ link: absHref, label: text || 'WhatsApp Official' });
        }
      }

      const socialPlatforms = [
        { name: 'Instagram', match: 'instagram.com', icon: 'instagram' },
        { name: 'YouTube', match: 'youtube.com', icon: 'youtube' },
        { name: 'Twitter / X', match: 'twitter.com', icon: 'twitter' },
        { name: 'Facebook', match: 'facebook.com', icon: 'facebook' },
        { name: 'LinkedIn', match: 'linkedin.com', icon: 'linkedin' }
      ];

      for (const sp of socialPlatforms) {
        if (absHref.includes(sp.match) && !contacts.socials.some(s => s.link === absHref)) {
          contacts.socials.push({ platform: sp.name, icon: sp.icon, link: absHref, label: text || sp.name });
          break;
        }
      }

      const portalKeywords = ['siakad', 'sia', 'academic', 'lms', 'moodle', 'elearning', 'perpustakaan', 'library', 'pmb'];
      for (const pk of portalKeywords) {
        if ((absHref.toLowerCase().includes(pk) || text.toLowerCase().includes(pk)) && !contacts.portals.some(p => p.link === absHref)) {
          contacts.portals.push({ name: text || pk.toUpperCase(), link: absHref, type: pk.toUpperCase() });
          break;
        }
      }
    });

    const addressPatterns = [
      /(?:Jl\.|Jalan|Kampus|Gedung)\s+[A-Za-z0-9\s.,-]+(?:No\.\s*\d+|Kav\.\s*\d+|Km\.\s*\d+)?[A-Za-z0-9\s.,-]*(?:Kode Pos|\d{5})/i,
      /(?:Jl\.|Jalan)\s+[A-Za-z0-9\s.,-]{10,80}/i
    ];
    for (const pat of addressPatterns) {
      const match = fullText.match(pat);
      if (match && !contacts.addresses.includes(match[0].trim())) {
        contacts.addresses.push(match[0].trim().replace(/\s+/g, ' '));
      }
    }

    return contacts;
  }

  extractDocumentsAndPdfs(doc, baseUrl) {
    const documents = [];
    const docLinks = doc.querySelectorAll('a[href]');

    docLinks.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const lowerHref = href.toLowerCase();

      if (lowerHref.endsWith('.pdf') || lowerHref.endsWith('.docx') || lowerHref.endsWith('.xlsx') || lowerHref.includes('.pdf?')) {
        const absUrl = this.toAbsoluteUrl(href, baseUrl);
        const title = a.textContent.trim() || a.getAttribute('title') || absUrl.split('/').pop().split('?')[0];

        let type = 'PDF';
        if (lowerHref.includes('.docx') || lowerHref.includes('.doc')) type = 'DOCX';
        if (lowerHref.includes('.xlsx') || lowerHref.includes('.xls')) type = 'XLSX';

        if (!documents.some(d => d.url === absUrl)) {
          documents.push({ title: title.replace(/\s+/g, ' '), url: absUrl, type });
        }
      }
    });

    return documents.slice(0, 30);
  }

  extractHtmlTables(doc) {
    const tables = [];
    const tableEls = doc.querySelectorAll('table');

    tableEls.forEach((table, index) => {
      if (index >= 15) return; // Limit to top 15 tables to avoid memory bloat
      const headers = [];
      const rows = [];

      const ths = table.querySelectorAll('th');
      if (ths.length > 0) {
        ths.forEach(th => headers.push(th.textContent.trim().replace(/\s+/g, ' ')));
      }

      const trs = table.querySelectorAll('tbody tr, tr');
      trs.forEach((tr, rIdx) => {
        if (rIdx > 500) return; // Limit rows
        const rowData = [];
        const cells = tr.querySelectorAll('td');
        if (cells.length > 0) {
          cells.forEach(td => rowData.push(td.textContent.trim().replace(/\s+/g, ' ')));
          rows.push(rowData);
        }
      });

      let title = `Tabel Data #${index + 1}`;
      const caption = table.querySelector('caption');
      if (caption) {
        title = caption.textContent.trim();
      } else {
        const prevHeading = table.previousElementSibling;
        if (prevHeading && /^H[1-6]$/i.test(prevHeading.tagName)) {
          title = prevHeading.textContent.trim();
        }
      }

      if (rows.length > 0) {
        tables.push({
          id: `table-${index + 1}`,
          title,
          headers: headers.length > 0 ? headers : Array.from({ length: rows[0].length }, (_, i) => `Kolom ${i + 1}`),
          rows
        });
      }
    });

    return tables;
  }

  extractCleanContent(doc, rawHtml) {
    const clone = doc.cloneNode(true);
    const noisySelectors = ['script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer', 'header', '.menu', '.navigation', '.sidebar', '.cookie-banner', '#comments'];
    noisySelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    const mainEl = clone.querySelector('main, article, #content, .content, .main-content') || clone.body;
    const cleanText = mainEl ? mainEl.innerText.replace(/\n\s*\n\s*\n/g, '\n\n').trim() : '';

    let markdown = '';
    if (this.turndownService && mainEl) {
      try {
        markdown = this.turndownService.turndown(mainEl.innerHTML);
      } catch (e) {
        markdown = cleanText;
      }
    } else {
      markdown = cleanText;
    }

    return { text: cleanText, markdown };
  }

  /**
   * Extract Web Images, Pamphlets, Infographics & Banner Visual Assets
   */
  extractWebImages(doc, baseUrl) {
    const images = [];
    const seenUrls = new Set();

    // 1. Scan <img> elements
    const imgEls = doc.querySelectorAll('img');
    imgEls.forEach((img) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
      if (!src) return;

      const absUrl = this.toAbsoluteUrl(src, baseUrl);
      if (!absUrl || seenUrls.has(absUrl)) return;
      if (absUrl.startsWith('data:image/svg') || absUrl.includes('1x1') || absUrl.includes('google-analytics') || absUrl.includes('doubleclick')) return;

      const alt = (img.getAttribute('alt') || '').trim();
      const title = (img.getAttribute('title') || img.getAttribute('aria-label') || '').trim();
      const width = parseInt(img.getAttribute('width') || '0', 10);
      const height = parseInt(img.getAttribute('height') || '0', 10);

      // Skip tiny tracking badges
      if (width > 0 && width < 30 && height > 0 && height < 30) return;

      seenUrls.add(absUrl);

      // Classify Image Context
      const lowerAll = `${absUrl} ${alt} ${title}`.toLowerCase();
      let category = 'Galeri / Umum';
      let isInfographic = false;

      if (/pmb|brosur|biaya|ukt|jadwal|akreditasi|alur|infografis|banner|poster|syarat|jalur|registrasi|seleksi|beasiswa/i.test(lowerAll)) {
        category = 'Brosur & Infografis PMB';
        isInfographic = true;
      } else if (/gedung|kampus|lab|fasilitas|perpustakaan|asrama|building|facility|library/i.test(lowerAll)) {
        category = 'Fasilitas & Kampus';
      } else if (/rektor|dekan|dosen|pimpinan|lecturer|profile|guru-besar|direktur/i.test(lowerAll)) {
        category = 'Pimpinan & Dosen';
      } else if (/logo|lambang|icon|emblem/i.test(lowerAll)) {
        category = 'Logo & Identitas';
      }

      images.push({
        url: absUrl,
        alt: alt || 'Gambar Halaman Kampus',
        title: title || alt || absUrl.split('/').pop().split('?')[0],
        category,
        isInfographic,
        dimensions: (width > 0 && height > 0) ? `${width}x${height}px` : '-'
      });
    });

    // 2. Scan CSS background-image in hero/banner elements
    const bannerEls = doc.querySelectorAll('[style*="background-image"], .banner, .hero, .slider, .carousel');
    bannerEls.forEach(el => {
      const style = el.getAttribute('style') || '';
      const bgMatch = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
      if (bgMatch && bgMatch[1]) {
        const absUrl = this.toAbsoluteUrl(bgMatch[1], baseUrl);
        if (absUrl && !seenUrls.has(absUrl) && !absUrl.startsWith('data:')) {
          seenUrls.add(absUrl);
          images.push({
            url: absUrl,
            alt: 'Banner / Background Visual',
            title: el.textContent.trim().substring(0, 40) || 'Hero Banner Image',
            category: 'Brosur & Infografis PMB',
            isInfographic: true,
            dimensions: '-'
          });
        }
      }
    });

    // Prioritize Infographics & PMB brochures first
    images.sort((a, b) => (b.isInfographic ? 1 : 0) - (a.isInfographic ? 1 : 0));

    return images.slice(0, 40);
  }

  toAbsoluteUrl(url, base) {
    if (!url) return '';
    try {
      return new URL(url, base).href;
    } catch (e) {
      return url;
    }
  }
}

window.CampusExtractor = CampusExtractor;
