/**
 * Paper Browser - Renders downloadable PDF lists from manifest.json
 * Used on A-Level and IGCSE pages for self-hosted exam papers.
 */

function PaperBrowser(containerId, manifestUrl, config) {
  const container = document.getElementById(containerId);
  if (!container) return;

  fetch(manifestUrl)
    .then(r => r.json())
    .then(files => renderPapers(container, files, manifestUrl, config))
    .catch(() => {
      container.innerHTML = '<p style="color:#94a3b8">Loading papers...</p>';
    });
}

function renderPapers(container, files, manifestUrl, config) {
  const basePath = manifestUrl.replace('/manifest.json', '/');
  const parsed = files.map(f => Object.assign(parseName(f.name, config.type), { name: f.name, size: f.size }));

  // Group by year
  const years = {};
  parsed.forEach(p => {
    if (!p.year) return;
    if (!years[p.year]) years[p.year] = [];
    years[p.year].push(p);
  });

  const sortedYears = Object.keys(years).sort((a, b) => b - a);

  let html = '';
  sortedYears.forEach(year => {
    const papers = years[year];
    // Group by session
    const sessions = {};
    papers.forEach(p => {
      const key = p.session || 'main';
      if (!sessions[key]) sessions[key] = [];
      sessions[key].push(p);
    });

    html += '<div class="paper-year">';
    html += '<h3 class="paper-year-title" onclick="this.parentElement.classList.toggle(\'collapsed\')">';
    html += year + ' <span class="paper-count">(' + papers.length + ' files)</span></h3>';
    html += '<div class="paper-year-content">';

    const sessionOrder = ['May/Jun', 'Oct/Nov', 'Feb/Mar', 'June', 'January', 'November', 'October', 'main'];
    const sortedSessions = Object.keys(sessions).sort((a, b) => {
      const ai = sessionOrder.indexOf(a);
      const bi = sessionOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    sortedSessions.forEach(sess => {
      const items = sessions[sess];
      if (sess !== 'main') {
        html += '<h4 class="paper-session">' + sess + '</h4>';
      }

      // Group by paper number
      const byPaper = {};
      items.forEach(p => {
        const key = p.paperLabel || 'Paper';
        if (!byPaper[key]) byPaper[key] = [];
        byPaper[key].push(p);
      });

      Object.keys(byPaper).sort().forEach(paperKey => {
        html += '<div class="paper-group">';
        html += '<span class="paper-label">' + paperKey + '</span>';
        byPaper[paperKey].sort((a, b) => a.docType.localeCompare(b.docType)).forEach(p => {
          const sizeKB = Math.round(p.size / 1024);
          const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + 'MB' : sizeKB + 'KB';
          const cls = p.docType === 'MS' ? 'link-ms' : (p.docType === 'MA' ? 'link-ma' : '');
          html += ' <a href="' + basePath + p.name + '" target="_blank" class="paper-link ' + cls + '">';
          html += p.docType;
          if (p.variant) html += ' v' + p.variant;
          html += ' <span class="paper-size">(' + sizeStr + ')</span></a>';
        });
        html += '</div>';
      });
    });

    html += '</div></div>';
  });

  if (!html) html = '<p style="color:#94a3b8">No papers available.</p>';
  container.innerHTML = html;
}

function parseName(filename, type) {
  const result = { year: null, session: null, paperLabel: null, docType: null, variant: null };

  if (type === 'cie') {
    // 9709_s24_qp_12.pdf or 0580_s24_qp_42.pdf
    const m = filename.match(/(\d{4})_([smw])(\d{2})_(qp|ms)_(\d)(\d)\.pdf/);
    if (m) {
      result.year = '20' + m[3];
      const sessions = { s: 'May/Jun', w: 'Oct/Nov', m: 'Feb/Mar' };
      result.session = sessions[m[2]] || m[2];
      result.docType = m[4].toUpperCase();
      result.paperLabel = 'Paper ' + m[5];
      result.variant = m[6];
    }
  } else if (type === 'edexcel' || type === 'aqa' || type === 'ocr') {
    // edexcel-Paper-1-June-2024-QP.pdf or aqa-Paper-1-June-2024-QP.pdf
    const m = filename.match(/(Paper-\S+|AS-Paper-\S+|Core-Pure-\S+|Further-\S+|Decision-\S+)-(\w+)-(\d{4})-(\w+)(?:-(Stats|Mech))?\.pdf/);
    if (m) {
      result.paperLabel = m[1].replace(/-/g, ' ');
      result.session = m[2];
      result.year = m[3];
      result.docType = m[4];
      if (m[5]) result.paperLabel += ' (' + m[5] + ')';
    }
    // Specimen / Sample
    const sp = filename.match(/(Paper-\S+|AS-Paper-\S+|Core-Pure-\S+|Further-\S+|Decision-\S+)-(Specimen|Sample)-(\w+)\.pdf/);
    if (sp) {
      result.paperLabel = sp[1].replace(/-/g, ' ');
      result.year = 'Specimen';
      result.session = 'main';
      result.docType = sp[3];
    }
  } else if (type === 'edexcel-igcse') {
    // edexcel-igcse-Paper-1H-June-2024-QP.pdf
    const m = filename.match(/Paper-(\w+)-(\w+)-(\d{4})-(\w+)\.pdf/);
    if (m) {
      result.paperLabel = 'Paper ' + m[1];
      result.session = m[2];
      result.year = m[3];
      result.docType = m[4];
    }
    const sp = filename.match(/Paper-(\w+)-Specimen-(\w+)\.pdf/);
    if (sp) {
      result.paperLabel = 'Paper ' + sp[1];
      result.year = 'Specimen';
      result.session = 'main';
      result.docType = sp[2];
    }
  }

  return result;
}
