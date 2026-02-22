/**
 * Paper Browser - Renders downloadable PDF lists from manifest.json
 * Used on A-Level and IGCSE pages for self-hosted exam papers.
 */

var CIE_PAPER_NAMES = {
  '9709': {
    '1': 'Paper 1 — Pure Maths 1',
    '2': 'Paper 2 — Pure Maths 2',
    '3': 'Paper 3 — Pure Maths 3',
    '4': 'Paper 4 — Mechanics',
    '5': 'Paper 5 — Statistics 1',
    '6': 'Paper 6 — Statistics 2'
  },
  '0580': {
    '1': 'Paper 1 — Core Short',
    '2': 'Paper 2 — Extended Short',
    '3': 'Paper 3 — Core Structured',
    '4': 'Paper 4 — Extended Structured'
  },
  '0606': {
    '1': '0606 Paper 1 — Add Maths',
    '2': '0606 Paper 2 — Add Maths'
  }
};

var DOC_TYPE_ORDER = { 'QP': 0, 'MS': 1, 'MA': 2 };

function PaperBrowser(containerId, manifestUrl, config) {
  var container = document.getElementById(containerId);
  if (!container) return;

  fetch(manifestUrl)
    .then(function(r) { return r.json(); })
    .then(function(files) { renderPapers(container, files, manifestUrl, config); })
    .catch(function() {
      container.innerHTML = '<p style="color:#94a3b8">Loading papers...</p>';
    });
}

function renderPapers(container, files, manifestUrl, config) {
  var basePath = manifestUrl.replace('/manifest.json', '/');
  var parsed = files.map(function(f) {
    var fname = typeof f === 'string' ? f : f.name;
    var p = parseName(fname, config.type);
    p.name = fname;
    return p;
  });

  // Group by year
  var years = {};
  parsed.forEach(function(p) {
    if (!p.year) return;
    if (!years[p.year]) years[p.year] = [];
    years[p.year].push(p);
  });

  var sortedYears = Object.keys(years).sort(function(a, b) { return b - a; });

  var html = '';
  sortedYears.forEach(function(year) {
    var papers = years[year];
    // Group by session
    var sessions = {};
    papers.forEach(function(p) {
      var key = p.session || 'main';
      if (!sessions[key]) sessions[key] = [];
      sessions[key].push(p);
    });

    html += '<div class="paper-year">';
    html += '<h3 class="paper-year-title" onclick="this.parentElement.classList.toggle(\'collapsed\')">';
    html += year + ' <span class="paper-count">(' + papers.length + ' files)</span></h3>';
    html += '<div class="paper-year-content">';

    var sessionOrder = [
      'May/Jun', 'Oct/Nov', 'Feb/Mar', 'June', 'January', 'November', 'October',
      '3월 교육청', '4월 교육청', '6월 평가원', '7월 교육청', '9월 평가원', '10월 교육청', '11월 교육청',
      'main'
    ];
    var sortedSessions = Object.keys(sessions).sort(function(a, b) {
      var ai = sessionOrder.indexOf(a);
      var bi = sessionOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    sortedSessions.forEach(function(sess) {
      var items = sessions[sess];
      if (sess !== 'main') {
        html += '<h4 class="paper-session">' + sess + '</h4>';
      }

      // Group by paper number
      var byPaper = {};
      items.forEach(function(p) {
        var key = p.paperLabel || 'Paper';
        if (!byPaper[key]) byPaper[key] = [];
        byPaper[key].push(p);
      });

      Object.keys(byPaper).sort().forEach(function(paperKey) {
        html += '<div class="paper-group">';
        html += '<span class="paper-label">' + paperKey + '</span>';
        byPaper[paperKey].sort(function(a, b) {
          // Sort: QP first, then MS, then MA; within same type sort by variant
          var oa = DOC_TYPE_ORDER[a.docType] !== undefined ? DOC_TYPE_ORDER[a.docType] : 9;
          var ob = DOC_TYPE_ORDER[b.docType] !== undefined ? DOC_TYPE_ORDER[b.docType] : 9;
          if (oa !== ob) return oa - ob;
          return (a.variant || '').localeCompare(b.variant || '');
        }).forEach(function(p) {
          var cls = p.docType === 'MS' ? 'link-ms' : (p.docType === 'MA' ? 'link-ma' : '');
          html += ' <a href="' + basePath + p.name + '" target="_blank" class="paper-link ' + cls + '">';
          html += p.docType;
          if (p.variant) html += ' v' + p.variant;
          html += '</a>';
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
  var result = { year: null, session: null, paperLabel: null, docType: null, variant: null };

  if (type === 'cie') {
    // 9709_s24_qp_12.pdf or 0580_s24_qp_42.pdf
    var m = filename.match(/(\d{4})_([smw])(\d{2})_(qp|ms)_(\d)(\d)\.pdf/);
    if (m) {
      var syllabus = m[1];
      result.year = '20' + m[3];
      var sessions = { s: 'May/Jun', w: 'Oct/Nov', m: 'Feb/Mar' };
      result.session = sessions[m[2]] || m[2];
      result.docType = m[4].toUpperCase();
      var paperNum = m[5];
      result.variant = m[6];
      // Use subject name if available
      if (CIE_PAPER_NAMES[syllabus] && CIE_PAPER_NAMES[syllabus][paperNum]) {
        result.paperLabel = CIE_PAPER_NAMES[syllabus][paperNum];
      } else {
        result.paperLabel = 'Paper ' + paperNum;
      }
    }
  } else if (type === 'edexcel' || type === 'aqa' || type === 'ocr') {
    // edexcel-Paper-1-June-2024-QP.pdf or aqa-Paper-1-June-2024-QP.pdf
    var m = filename.match(/(Paper-\S+|AS-Paper-\S+|Core-Pure-\S+|Further-\S+|Decision-\S+)-(\w+)-(\d{4})-(\w+)(?:-(Stats|Mech))?\.pdf/);
    if (m) {
      result.paperLabel = m[1].replace(/-/g, ' ');
      result.session = m[2];
      result.year = m[3];
      result.docType = m[4];
      if (m[5]) result.paperLabel += ' (' + m[5] + ')';
    }
    // Specimen / Sample
    var sp = filename.match(/(Paper-\S+|AS-Paper-\S+|Core-Pure-\S+|Further-\S+|Decision-\S+)-(Specimen|Sample)-(\w+)\.pdf/);
    if (sp) {
      result.paperLabel = sp[1].replace(/-/g, ' ');
      result.year = 'Specimen';
      result.session = 'main';
      result.docType = sp[3];
    }
  } else if (type === 'korean') {
    // Korean exam formats:
    // g3-pyeongwon-2024-06-QP.pdf  (고3 6월 평가원)
    // g3-edu-2024-03-QP.pdf        (고3 3월 교육청)
    // g1-edu-2024-03-QP.pdf        (고1 3월 교육청)
    // csat-2025-QP.pdf             (수능)
    var KR_MONTHS = {
      '03': '3월', '04': '4월', '06': '6월',
      '07': '7월', '09': '9월', '10': '10월', '11': '11월'
    };
    var KR_ORGS = {
      'pyeongwon': '평가원',
      'edu': '교육청'
    };

    // CSAT (수능): csat-2025-QP.pdf
    var mc = filename.match(/^csat-(\d{4})-(QP|MS)\.pdf$/);
    if (mc) {
      result.year = mc[1];
      result.session = 'main';
      result.paperLabel = '수능';
      result.docType = mc[2];
    }

    // Grade exams: g3-pyeongwon-2024-06-QP.pdf
    var mg = filename.match(/^g(\d)-(pyeongwon|edu)-(\d{4})-(\d{2})-(QP|MS)\.pdf$/);
    if (mg) {
      result.year = mg[3];
      var monthNum = mg[4];
      var org = KR_ORGS[mg[2]] || mg[2];
      result.session = (KR_MONTHS[monthNum] || monthNum) + ' ' + org;
      result.paperLabel = '수학';
      result.docType = mg[5];
    }

    // Military academy: kma-2025-QP.pdf, kna-2024-MS.pdf, kafa-2023-QP.pdf
    var ma = filename.match(/^(kma|kna|kafa)-(\d{4})-(QP|MS)\.pdf$/);
    if (ma) {
      result.year = ma[2];
      result.session = 'main';
      result.paperLabel = '수학';
      result.docType = ma[3];
    }
  } else if (type === 'edexcel-igcse') {
    var IGCSE_EDEXCEL_LABELS = {
      '1F': 'Paper 1F — Foundation Non-Calc',
      '2F': 'Paper 2F — Foundation Calculator',
      '1H': 'Paper 1H — Higher Non-Calc',
      '2H': 'Paper 2H — Higher Calculator',
      '3H': 'Paper 3H — Higher Non-Calc (Old)',
      '4H': 'Paper 4H — Higher Calculator (Old)'
    };
    // edexcel-igcse-Paper-1H-June-2024-QP.pdf
    var m = filename.match(/Paper-(\w+)-(\w+)-(\d{4})-(\w+)\.pdf/);
    if (m) {
      result.paperLabel = IGCSE_EDEXCEL_LABELS[m[1]] || ('Paper ' + m[1]);
      result.session = m[2];
      result.year = m[3];
      result.docType = m[4];
    }
    var sp = filename.match(/Paper-(\w+)-Specimen-(\w+)\.pdf/);
    if (sp) {
      result.paperLabel = IGCSE_EDEXCEL_LABELS[sp[1]] || ('Paper ' + sp[1]);
      result.year = 'Specimen';
      result.session = 'main';
      result.docType = sp[2];
    }
  }

  return result;
}
