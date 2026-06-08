const MM_TO_PX = 96 / 25.4;
const PAGE_PRESETS = {
  A4: { label: "A4", width: 794, height: 1123, pdf: [210, 297] },
  "3:4": { label: "3-4", width: 720, height: 960, pdf: [180, 240] },
  "9:16": { label: "9-16", width: 720, height: 1280, pdf: [180, 320] },
};
const STORAGE_KEY = "kindle-clippings-exporter-state-v2";
const PNG_CAPTURE_SCALE = 2;
const PDF_CAPTURE_SCALE = 1.45;
const PDF_JPEG_QUALITY = 0.86;
const META_FONT_KEY = "songti";
const PDF_A4_SPEC = PAGE_PRESETS.A4;
const PDF_FONT_FILES = {
  regular: {
    path: "assets/fonts/NotoSerifSC-Regular.ttf",
    fallbackPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
  },
  bold: {
    path: "assets/fonts/NotoSerifSC-Bold.ttf",
    fallbackPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
  },
};
const FONT_OPTIONS = {
  songti: {
    cssFamily: '"ClippingSongti", "Songti SC", STSong, SimSun, serif',
    pdfPath: "assets/fonts/NotoSerifSC-Regular.ttf",
    pdfBoldPath: "assets/fonts/NotoSerifSC-Bold.ttf",
    remotePdfPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
    remotePdfBoldPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
    pdfSubset: false,
    supportsBold: true,
    wordFamily: "ClippingSongti, Songti SC, STSong, SimSun, serif",
  },
  heiti: {
    cssFamily: '"ClippingHeiti", SimHei, Heiti SC, sans-serif',
    pdfPath: "assets/fonts/NotoSansSC-Regular.ttf",
    pdfBoldPath: "assets/fonts/NotoSansSC-Bold.ttf",
    remotePdfPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
    remotePdfBoldPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
    pdfSubset: false,
    supportsBold: true,
    wordFamily: "ClippingHeiti, SimHei, Heiti SC, Microsoft YaHei, sans-serif",
  },
  kaiti: {
    cssFamily: '"ClippingKaiti", "Kaiti SC", STKaiti, KaiTi, serif',
    pdfPath: "assets/fonts/LXGWWenKai-Regular.ttf",
    remotePdfPath: "https://cdn.jsdelivr.net/npm/lxgwwenkai-web@0.1.2/LXGWWenKai-Regular.ttf",
    pdfSubset: false,
    supportsBold: false,
    wordFamily: "ClippingKaiti, Kaiti SC, STKaiti, KaiTi, serif",
  },
  yuanti: {
    cssFamily: '"ClippingYuanti", Yuanti SC, YouYuan, sans-serif',
    pdfPath: "assets/fonts/ResourceHanRoundedCN-Regular.ttf",
    remotePdfPath: "",
    pdfSubset: false,
    supportsBold: false,
    wordFamily: "ClippingYuanti, Yuanti SC, YouYuan, Microsoft YaHei, sans-serif",
  },
  handwrite: {
    cssFamily: '"ClippingHandwrite", "ClippingKaiti", "Kaiti SC", STKaiti, KaiTi, serif',
    pdfPath: "assets/fonts/ZhiMangXing-Regular.ttf",
    remotePdfPath: "https://raw.githubusercontent.com/google/fonts/main/ofl/zhimangxing/ZhiMangXing-Regular.ttf",
    pdfSubset: false,
    supportsBold: false,
    wordFamily: "ClippingHandwrite, ClippingKaiti, Kaiti SC, STKaiti, KaiTi, serif",
  },
};
const pdfFontBufferCache = new Map();

const defaultLayout = {
  pageSize: "A4",
  customRatioW: 3,
  customRatioH: 4,
  marginTop: 25,
  marginRight: 25,
  marginBottom: 25,
  marginLeft: 25,
  fontSize: 20,
  lineHeight: 1.8,
  paragraphGap: 20,
  textWeight: 400,
  fontKey: "songti",
  fontFamily: FONT_OPTIONS.songti.cssFamily,
  backgroundTheme: "white",
  bulletStyle: "circle",
  showBullets: true,
  headerMode: "compact",
};

const state = {
  bookInfo: { title: "", author: "" },
  clippings: [],
  layout: { ...defaultLayout },
  importStats: null,
  exportMode: "excerpt",
  showCoverPage: false,
  pages: [],
  search: "",
  selectedId: "",
  statusMode: "count",
  zoom: 0.85,
};

const els = {};
let measureContext;
let draggedClippingId = "";

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindControls();
  loadState();
  renderAll();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function cacheElements() {
  [
    "bookTitle",
    "bookAuthor",
    "fileInput",
    "searchInput",
    "addClipping",
    "clearClippings",
    "clippingList",
    "statusLine",
    "paperWrap",
    "paperPages",
    "exportPng",
    "exportPdf",
    "exportImagePdf",
    "exportWord",
    "exportMarkdown",
    "zoomOut",
    "zoomIn",
    "zoomValue",
    "pageSize",
    "customRatioFields",
    "customRatioW",
    "customRatioH",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "resetMargins",
    "fontSize",
    "lineHeight",
    "paragraphGap",
    "textWeight",
    "fontSizeLabel",
    "lineHeightLabel",
    "paragraphGapLabel",
    "textWeightLabel",
    "resetLayout",
    "showBullets",
    "bulletOptions",
    "fontOptions",
    "themeOptions",
    "importStats",
    "exportModeOptions",
    "headerModeOptions",
    "showCoverPage",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindControls() {
  els.bookTitle.addEventListener("input", () => {
    state.bookInfo.title = els.bookTitle.value.trim();
    updateSelectedBookInfo();
    saveState();
  });

  els.bookAuthor.addEventListener("input", () => {
    state.bookInfo.author = els.bookAuthor.value.trim();
    updateSelectedBookInfo();
    saveState();
  });

  els.fileInput.addEventListener("change", handleFileImport);
  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim();
    state.statusMode = "count";
    renderList();
  });
  els.addClipping.addEventListener("click", addClipping);
  els.clearClippings.addEventListener("click", clearClippings);
  els.exportPng.addEventListener("click", exportPngPages);
  els.exportPdf.addEventListener("click", exportPdfPages);
  els.exportImagePdf.addEventListener("click", exportImagePdfPages);
  els.exportWord.addEventListener("click", exportWordPages);
  els.exportMarkdown.addEventListener("click", exportMarkdown);

  els.zoomOut.addEventListener("click", () => {
    state.zoom = Math.max(0.45, +(state.zoom - 0.06).toFixed(2));
    renderPreviewScale();
  });
  els.zoomIn.addEventListener("click", () => {
    state.zoom = Math.min(1.2, +(state.zoom + 0.06).toFixed(2));
    renderPreviewScale();
  });

  els.pageSize.addEventListener("change", () => {
    state.layout.pageSize = els.pageSize.value;
    syncCustomRatioVisibility();
    renderPreview();
    saveState();
  });

  ["customRatioW", "customRatioH"].forEach((key) => {
    els[key].addEventListener("input", () => {
      state.layout[key] = Math.max(1, Number(els[key].value) || defaultLayout[key]);
      renderPreview();
      saveState();
    });
  });

  ["marginTop", "marginRight", "marginBottom", "marginLeft"].forEach((key) => {
    els[key].addEventListener("input", () => {
      state.layout[key] = Math.max(0, Number(els[key].value) || 0);
      renderPreview();
      saveState();
    });
  });

  els.resetMargins.addEventListener("click", () => {
    ["marginTop", "marginRight", "marginBottom", "marginLeft"].forEach((key) => {
      state.layout[key] = defaultLayout[key];
      els[key].value = defaultLayout[key];
    });
    renderPreview();
    saveState();
  });

  [
    ["fontSize", "fontSize"],
    ["lineHeight", "lineHeight"],
    ["paragraphGap", "paragraphGap"],
    ["textWeight", "textWeight"],
  ].forEach(([id, key]) => {
    els[id].addEventListener("input", () => {
      state.layout[key] = Number(els[id].value);
      renderPreview();
      saveState();
    });
  });

  els.resetLayout.addEventListener("click", () => {
    ["fontSize", "lineHeight", "paragraphGap", "textWeight"].forEach((key) => {
      state.layout[key] = defaultLayout[key];
      els[key].value = defaultLayout[key];
    });
    renderPreview();
    saveState();
  });

  els.showBullets.addEventListener("change", () => {
    state.layout.showBullets = els.showBullets.checked;
    renderPreview();
    saveState();
  });

  els.bulletOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-bullet]");
    if (!button) return;
    state.layout.bulletStyle = button.dataset.bullet;
    selectButton(els.bulletOptions, button);
    renderPreview();
    saveState();
  });

  els.fontOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-font-key]");
    if (!button) return;
    applyFontKey(button.dataset.fontKey);
    selectButton(els.fontOptions, button);
    renderPreview();
    saveState();
  });

  els.themeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-theme]");
    if (!button) return;
    state.layout.backgroundTheme = button.dataset.theme;
    selectButton(els.themeOptions, button);
    renderPreview();
    saveState();
  });

  els.exportModeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    state.exportMode = button.dataset.mode;
    selectButton(els.exportModeOptions, button);
    renderPreview();
    saveState();
  });

  els.headerModeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-header-mode]");
    if (!button) return;
    state.layout.headerMode = button.dataset.headerMode;
    selectButton(els.headerModeOptions, button);
    renderPreview();
    saveState();
  });

  els.showCoverPage.addEventListener("change", () => {
    state.showCoverPage = els.showCoverPage.checked;
    renderPreview();
    saveState();
  });
}

function parseKindleClippings(rawText) {
  const normalized = String(rawText || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const blocks = normalized
    .split(/\n?={10,}\n?/g)
    .map((block) => block.trim())
    .filter(Boolean);
  const items = [];
  const stats = {
    title: "",
    author: "",
    totalBlocks: blocks.length,
    recognizedCount: 0,
    dedupedCount: 0,
    duplicateCount: 0,
    emptyCount: 0,
    failedCount: 0,
  };

  blocks.forEach((block, index) => {
    const parsed = parseClippingBlock(block);
    if (parsed.status === "ok") {
      const item = { ...parsed.item, id: createId(index), note: "", noteOpen: false, expanded: false };
      items.push(item);
      stats.recognizedCount += 1;
      if (!stats.title) stats.title = item.bookTitle;
      if (!stats.author) stats.author = item.author;
      return;
    }
    if (parsed.status === "empty") {
      stats.emptyCount += 1;
      return;
    }
    stats.failedCount += 1;
  });

  return { items, stats };
}

function parseClippings(rawText) {
  return parseKindleClippings(rawText).items;
}

function parseClippingBlock(block) {
  const lines = String(block)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { status: "failed" };

  const book = parseBookLine(lines[0]);
  const metaLineIndex = findMetaLineIndex(lines);
  if (metaLineIndex < 0) return { status: "failed" };

  const meta = parseMetaLine(lines[metaLineIndex]);
  const content = normalizeHighlightContent(lines.slice(metaLineIndex + 1));
  if (!content) return { status: "empty" };

  return {
    status: "ok",
    item: {
      bookTitle: book.title,
      author: book.author,
      content,
      page: meta.page,
      location: meta.location,
      createdAt: meta.createdAt,
      rawMeta: lines[metaLineIndex],
    },
  };
}

function findMetaLineIndex(lines) {
  return lines.findIndex((line, index) => index > 0 && /^-\s*/.test(line) && /标注|Highlight|Location|位置|Added|添加于/i.test(line));
}

function normalizeHighlightContent(lines) {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  return cleaned.reduce((result, line) => {
    const normalizedLine = line.replace(/\s+/g, " ");
    if (!result) return normalizedLine;
    return `${result}${shouldJoinWithoutSpace(result, normalizedLine) ? "" : " "}${normalizedLine}`;
  }, "");
}

function shouldJoinWithoutSpace(left, right) {
  const last = left.slice(-1);
  const first = right.slice(0, 1);
  return /[\u4e00-\u9fff，。！？；：“”‘’、]/.test(last) || /[\u4e00-\u9fff，。！？；：“”‘’、]/.test(first);
}

function parseBookLine(line) {
  const clean = line.trim();
  const groups = [...clean.matchAll(/[（(]([^()（）]+)[）)]/g)].map((match) => ({
    value: match[1].trim(),
    index: match.index,
  }));
  const authorGroup = groups.find((group) => {
    return /[\u4e00-\u9fa5A-Za-z]/.test(group.value) && !/z-library|kindle|mobi|azw|epub|pdf|calibre/i.test(group.value);
  });
  const author = authorGroup?.value || "";
  const titleSource = authorGroup ? clean.slice(0, authorGroup.index).trim() : clean;
  const title = titleSource
    .replace(/\s*[（(][^()（）]*z-library[^()（）]*[）)]/gi, "")
    .replace(/\s*[（(][^()（）]*(?:kindle|mobi|azw|epub|pdf|calibre)[^()（）]*[）)]/gi, "")
    .replace(/\s*[（(]\s*[）)]\s*$/, "")
    .trim();
  return {
    title: title || clean.replace(/\s*[（(].*$/, "").trim() || clean,
    author,
  };
}

function parseMetaLine(line) {
  const page =
    line.match(/第\s*([0-9０-９]+)\s*页/)?.[1] ||
    line.match(/\bpage\s*([0-9]+)\b/i)?.[1] ||
    line.match(/\bon\s+page\s+([0-9]+)\b/i)?.[1] ||
    "";
  const location =
    line.match(/位置\s*#?([0-9０-９\-–—]+)/)?.[1] ||
    line.match(/\bLocation\s*#?\s*([0-9\-–—]+)/i)?.[1] ||
    line.match(/\bloc\.\s*([0-9\-–—]+)/i)?.[1] ||
    "";
  const createdAt =
    line.match(/添加于\s*(.+)$/)?.[1]?.trim() ||
    line.match(/Added on\s*(.+)$/i)?.[1]?.trim() ||
    "";
  return { page, location, createdAt };
}

function deduplicateHighlights(items) {
  const seen = new Set();
  const deduped = [];
  let duplicateCount = 0;
  items.forEach((item) => {
    const key = item.content.trim();
    if (seen.has(key)) {
      duplicateCount += 1;
      return;
    }
    seen.add(key);
    deduped.push(item);
  });
  return { items: deduped, duplicateCount };
}

function handleFileImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = parseKindleClippings(String(reader.result || ""));
      const deduped = deduplicateHighlights(parsed.items);
      parsed.stats.dedupedCount = deduped.items.length;
      parsed.stats.duplicateCount = deduped.duplicateCount;
      state.importStats = parsed.stats;
      state.clippings = deduped.items;
      state.search = "";
      state.statusMode = "notice";
      els.searchInput.value = "";
      if (!deduped.items.length) {
        state.selectedId = "";
        state.bookInfo = { title: "", author: "" };
        setStatus("没有识别到有效划线，请确认文件内容来自 My Clippings.txt。");
        renderAll();
        saveState();
        return;
      }
      selectClipping(deduped.items[0].id, false);
      setStatus(buildImportStatus(deduped.items, parsed.stats));
      renderAll();
      saveState();
    } catch (error) {
      state.importStats = null;
      state.statusMode = "notice";
      setStatus("导入时遇到问题，请检查文件是否为 Kindle 的 My Clippings.txt。");
      renderImportStats();
      console.error(error);
    }
  };
  reader.onerror = () => {
    state.statusMode = "notice";
    setStatus("文件读取失败，请重新选择 My Clippings.txt。");
    renderImportStats();
  };
  reader.readAsText(file, "utf-8");
  event.target.value = "";
}

function buildImportStatus(items, stats = {}) {
  const bookCount = new Set(items.map((item) => getBookKey(item))).size;
  const duplicateText = stats.duplicateCount ? `，已去重 ${stats.duplicateCount} 条` : "";
  return bookCount > 1
    ? `已导入 ${items.length} 条划线，识别到 ${bookCount} 本书${duplicateText}，预览会按书籍自动分页。`
    : `已导入 ${items.length} 条划线${duplicateText}。`;
}

function addClipping() {
  const item = {
    id: createId(),
    bookTitle: state.bookInfo.title || "未命名书籍",
    author: state.bookInfo.author || "",
    content: "在这里输入新的划线内容。",
    page: "",
    location: "",
    createdAt: "",
    rawMeta: "",
    note: "",
    noteOpen: false,
    expanded: false,
  };
  state.clippings.push(item);
  state.importStats = null;
  state.statusMode = "count";
  selectClipping(item.id, false);
  renderAll();
  saveState();
  const textarea = els.clippingList.querySelector(`[data-id="${item.id}"] textarea`);
  textarea?.focus();
  textarea?.select();
}

function clearClippings() {
  state.clippings = [];
  state.selectedId = "";
  state.bookInfo = { title: "", author: "" };
  state.importStats = null;
  state.statusMode = "notice";
  setStatus("划线内容已清空。");
  renderAll();
  saveState();
}

function selectClipping(id, shouldRender = true) {
  state.selectedId = id;
  const item = state.clippings.find((current) => current.id === id);
  if (item) {
    state.bookInfo = {
      title: item.bookTitle,
      author: item.author,
    };
  }
  if (shouldRender) {
    renderAll();
    saveState();
  }
}

function updateSelectedBookInfo() {
  const item = state.clippings.find((current) => current.id === state.selectedId);
  if (item) {
    item.bookTitle = state.bookInfo.title;
    item.author = state.bookInfo.author;
  }
  state.statusMode = "count";
  renderHighlightList();
  renderPreview();
  saveState();
}

function getPreviewItems() {
  return flattenBookGroups(state.clippings.filter((item) => item.content.trim()));
}

function getVisibleItems() {
  const keyword = state.search.toLowerCase();
  if (!keyword) return state.clippings;
  return state.clippings.filter((item) => {
    return [item.bookTitle, item.author, item.content, item.note].join(" ").toLowerCase().includes(keyword);
  });
}

function renderAll() {
  els.bookTitle.value = state.bookInfo.title;
  els.bookAuthor.value = state.bookInfo.author;
  syncLayoutControls();
  syncCustomRatioVisibility();
  syncModeControls();
  renderImportStats();
  renderHighlightList();
  renderPreview();
}

function renderImportStats() {
  const stats = state.importStats;
  if (!stats) {
    els.importStats.classList.remove("visible");
    els.importStats.innerHTML = "";
    return;
  }
  els.importStats.classList.add("visible");
  els.importStats.innerHTML = `
    <strong>${escapeHtml(stats.title || state.bookInfo.title || "未命名书籍")}</strong>
    <div>作者：${escapeHtml(stats.author || state.bookInfo.author || "未知作者")}</div>
    <div class="stats-grid">
      <span>识别 ${stats.recognizedCount || 0} 条</span>
      <span>剩余 ${stats.dedupedCount || 0} 条</span>
      <span>去重 ${stats.duplicateCount || 0} 条</span>
      <span>空内容 ${stats.emptyCount || 0} 条</span>
      <span>失败 ${stats.failedCount || 0} 条</span>
    </div>
  `;
}

function syncLayoutControls() {
  normalizeLayoutFont();
  ["marginTop", "marginRight", "marginBottom", "marginLeft", "fontSize", "lineHeight", "paragraphGap", "textWeight"].forEach((key) => {
    els[key].value = state.layout[key];
  });
  els.showBullets.checked = state.layout.showBullets;
  els.showCoverPage.checked = state.showCoverPage;
  updateRangeLabels();
  selectButtonByValue(els.bulletOptions, "bullet", state.layout.bulletStyle);
  selectButtonByValue(els.fontOptions, "fontKey", state.layout.fontKey);
  selectButtonByValue(els.themeOptions, "theme", state.layout.backgroundTheme);
  selectButtonByValue(els.headerModeOptions, "headerMode", getHeaderMode());
}

function syncModeControls() {
  selectButtonByValue(els.exportModeOptions, "mode", state.exportMode);
}

function applyFontKey(fontKey) {
  const normalizedKey = FONT_OPTIONS[fontKey] ? fontKey : defaultLayout.fontKey;
  state.layout.fontKey = normalizedKey;
  state.layout.fontFamily = FONT_OPTIONS[normalizedKey].cssFamily;
}

function getEffectiveTextWeight(fontKey = state.layout.fontKey, weight = state.layout.textWeight) {
  const config = FONT_OPTIONS[fontKey] || FONT_OPTIONS[defaultLayout.fontKey];
  if (!config.supportsBold) return 400;
  return Number(weight) >= 500 ? 700 : 400;
}

function normalizeLayoutFont() {
  const currentKey = state.layout.fontKey || inferFontKey(state.layout.fontFamily);
  applyFontKey(currentKey);
}

function inferFontKey(fontFamily = "") {
  const family = String(fontFamily);
  if (family.includes("ClippingHeiti") || family.includes("SimHei") || family.includes("Heiti")) return "heiti";
  if (family.includes("ClippingHandwrite") || family.includes("Zhi Mang Xing")) return "handwrite";
  if (family.includes("ClippingKaiti") || family.includes("LXGW") || family.includes("Kaiti") || family.includes("KaiTi")) return "kaiti";
  if (family.includes("ClippingYuanti") || family.includes("Yuanti") || family.includes("YouYuan")) return "yuanti";
  return "songti";
}

function renderList() {
  renderHighlightList();
}

function renderHighlightList() {
  const visibleItems = getVisibleItems();
  els.clippingList.innerHTML = "";
  if (!visibleItems.length) {
    els.clippingList.innerHTML = `
      <div class="empty-state">
        <div>
          <i data-lucide="file"></i>
          <div>点击上方「导入 Kindle 原始笔记」</div>
          <div>或点「添加」手动输入</div>
          <div>可拖动排序，点 × 删除</div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    renderStatusCount();
    return;
  }

  groupItemsByBook(visibleItems).forEach((group) => {
    const heading = document.createElement("div");
    heading.className = "book-group-heading";
    heading.innerHTML = `
      <strong>${escapeHtml(group.title)}</strong>
      <span>${escapeHtml(group.author || "未知作者")} · ${group.items.length} 条</span>
    `;
    els.clippingList.appendChild(heading);

    group.items.forEach((item) => {
    const card = document.createElement("article");
    card.className = `clipping-card${item.id === state.selectedId ? " selected" : ""}`;
    card.dataset.id = item.id;
    card.draggable = true;
    const hasNote = Boolean((item.note || "").trim());
    const noteVisible = Boolean(item.noteOpen);
    card.innerHTML = `
      <span class="drag-dots">⁝</span>
      <div class="clipping-main">
        <div class="clipping-meta">${escapeHtml(item.bookTitle || "未命名书籍")} · ${escapeHtml(item.author || "未知作者")}</div>
        <div class="card-actions">
          <button class="text-btn toggle-full" type="button">${item.expanded ? "收起全文" : "展开全文"}</button>
          <button class="text-btn toggle-note" type="button">${noteVisible ? "收起笔记" : hasNote ? "编辑笔记" : "添加笔记"}</button>
        </div>
        <textarea class="quote-input${item.expanded ? "" : " collapsed"}" aria-label="划线内容">${escapeHtml(item.content)}</textarea>
        <div class="note-box${noteVisible ? " visible" : ""}">
          <label>笔记</label>
          <textarea class="note-input" aria-label="笔记" placeholder="写下你的笔记...">${escapeHtml(item.note || "")}</textarea>
        </div>
      </div>
      <button class="delete-item" type="button" title="删除">
        <i data-lucide="x"></i>
      </button>
    `;
    const quoteTextarea = card.querySelector(".quote-input");
    const noteTextarea = card.querySelector(".note-input");
    card.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("textarea")) return;
      if (state.selectedId !== item.id) {
        selectClipping(item.id);
      }
    });
    card.addEventListener("dragstart", (event) => {
      if (event.target.closest("textarea") || event.target.closest("button")) {
        event.preventDefault();
        return;
      }
      draggedClippingId = item.id;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.id);
    });
    card.addEventListener("dragover", (event) => {
      if (!draggedClippingId || draggedClippingId === item.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      card.classList.add("drop-target");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("drop-target");
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData("text/plain") || draggedClippingId;
      card.classList.remove("drop-target");
      moveClippingBefore(sourceId, item.id);
    });
    card.addEventListener("dragend", () => {
      draggedClippingId = "";
      card.classList.remove("dragging", "drop-target");
    });
    quoteTextarea.addEventListener("focus", () => {
      if (state.selectedId !== item.id) selectClipping(item.id, false);
    });
    quoteTextarea.addEventListener("input", () => {
      item.content = quoteTextarea.value;
      state.statusMode = "count";
      renderPreview();
      renderStatusCount();
      saveState();
    });
    noteTextarea.addEventListener("input", () => {
      item.note = noteTextarea.value;
      item.noteOpen = true;
      renderPreview();
      saveState();
    });
    card.querySelector(".toggle-full").addEventListener("click", () => {
      item.expanded = !item.expanded;
      renderHighlightList();
      saveState();
    });
    card.querySelector(".toggle-note").addEventListener("click", () => {
      item.noteOpen = !noteVisible;
      renderHighlightList();
      saveState();
    });
    card.querySelector(".delete-item").addEventListener("click", () => {
      state.clippings = state.clippings.filter((current) => current.id !== item.id);
      if (state.selectedId === item.id) {
        const next = state.clippings[0];
        state.selectedId = next?.id || "";
        state.bookInfo = next ? { title: next.bookTitle, author: next.author } : { title: "", author: "" };
      }
      state.importStats = null;
      state.statusMode = "count";
      renderAll();
      saveState();
    });
    els.clippingList.appendChild(card);
  });
  });
  if (window.lucide) window.lucide.createIcons();
  renderStatusCount();
}

function renderStatusCount() {
  if (state.statusMode === "notice") {
    return;
  }
  const total = state.clippings.length;
  const visible = getVisibleItems().length;
  const books = new Set(state.clippings.map((item) => getBookKey(item))).size;
  const pageCount = state.pages.length;
  setStatus(
    state.search
      ? `搜索结果 ${visible} / ${total} 条。`
      : `当前共 ${total} 条划线，${books || 0} 本书，${pageCount || 0} 页预览。`
  );
}

function renderPreview() {
  const spec = getPageSpec();
  const contentPages = paginateClippings(getPreviewItems(), spec, state.layout);
  state.pages = state.showCoverPage ? [createCoverPage(spec), ...contentPages] : contentPages;
  applyPreviewVariables(spec);
  els.paperPages.innerHTML = "";

  if (!state.pages.length) {
    els.paperPages.innerHTML = createEmptyPageHtml(spec);
  } else {
    state.pages.forEach((page, index) => {
      els.paperPages.appendChild(renderPage(page, index, spec));
    });
  }

  updateRangeLabels();
  renderPreviewScale();
  renderStatusCount();
}

function paginateClippings(items, spec, layout) {
  const bookCounts = countByBook(items);
  const pages = [];
  let currentPage = null;
  let currentBookKey = "";
  let currentBookPageIndex = 0;

  items.forEach((item) => {
    const bookKey = getBookKey(item);
    if (bookKey !== currentBookKey) {
      currentBookKey = bookKey;
      currentBookPageIndex = 0;
      currentPage = createPage(item, bookCounts.get(bookKey), spec, layout, currentBookPageIndex);
      pages.push(currentPage);
    }

    const textWidth = Math.max(80, currentPage.contentWidth - (layout.showBullets ? 22 : 0));
    const noteText = shouldExportNotes() ? (item.note || "").trim() : "";
    let lines = wrapTextToLines(item.content, textWidth, layout);
    const noteLines = noteText ? wrapTextToLines(noteText, textWidth, getNoteLayout(layout)) : [];
    const noteUnits = getNoteLineUnits(noteLines, layout);
    if (!lines.length) return;

    const requiredLines = lines.length + noteUnits + currentPage.gapLines;
    const emptyPage = currentPage.items.length === 0;
    if (!emptyPage && requiredLines > currentPage.remainingLines) {
      currentBookPageIndex += 1;
      currentPage = createPage(item, bookCounts.get(bookKey), spec, layout, currentBookPageIndex);
      pages.push(currentPage);
    }

    const fullPageCapacity = currentPage.maxLines;
    if (lines.length + noteUnits <= fullPageCapacity) {
      currentPage.items.push({
        id: item.id,
        content: lines.join(""),
        note: noteText,
        continued: false,
      });
      currentPage.remainingLines -= lines.length + noteUnits + currentPage.gapLines;
      return;
    }

    while (lines.length) {
      if (currentPage.remainingLines <= 0 || currentPage.items.length > 0) {
        currentBookPageIndex += 1;
        currentPage = createPage(item, bookCounts.get(bookKey), spec, layout, currentBookPageIndex);
        pages.push(currentPage);
      }
      const isLastChunk = lines.length <= Math.max(1, currentPage.remainingLines - noteUnits);
      const roomForText = Math.max(1, currentPage.remainingLines - (isLastChunk ? noteUnits : 0));
      const takeCount = Math.max(1, Math.min(lines.length, roomForText));
      const partLines = lines.slice(0, takeCount);
      lines = lines.slice(takeCount);
      currentPage.items.push({
        id: item.id,
        content: partLines.join(""),
        note: lines.length ? "" : noteText,
        continued: lines.length > 0,
      });
      currentPage.remainingLines -= takeCount + (lines.length ? 0 : noteUnits) + currentPage.gapLines;
    }
  });

  return pages;
}

function shouldExportNotes() {
  return state.exportMode === "notes";
}

function getNoteLayout(layout) {
  return {
    ...layout,
    fontSize: Math.max(11, layout.fontSize * 0.78),
    lineHeight: 1.65,
    textWeight: 400,
    fontKey: META_FONT_KEY,
    fontFamily: FONT_OPTIONS[META_FONT_KEY].cssFamily,
  };
}

function getNoteLineUnits(noteLines, layout) {
  if (!noteLines.length) return 0;
  const noteLinePx = Math.max(11, layout.fontSize * 0.78) * 1.65;
  const quoteLinePx = layout.fontSize * layout.lineHeight;
  return Math.max(1, Math.ceil((noteLines.length * noteLinePx + 10) / quoteLinePx));
}

function createCoverPage(spec) {
  const first = getPreviewItems()[0] || {};
  return {
    type: "cover",
    bookTitle: state.bookInfo.title || first.bookTitle || "未命名书籍",
    author: state.bookInfo.author || first.author || "未知作者",
    bookCount: getPreviewItems().length,
    exportDate: formatDate(new Date()),
    items: [],
    contentWidth: spec.width,
  };
}

function createPage(item, bookCount, spec, layout, bookPageIndex = 0) {
  const padding = getPadding(layout);
  const contentWidth = spec.width - padding.left - padding.right;
  const headerType = getPageHeaderType(bookPageIndex, getHeaderMode());
  const lineHeightPx = layout.fontSize * layout.lineHeight;
  const contentHeight = getAvailableContentHeight(spec, layout, headerType);
  return {
    bookTitle: item.bookTitle || "未命名书籍",
    author: item.author || "未知作者",
    bookCount: bookCount || 0,
    bookPageIndex,
    headerType,
    items: [],
    contentWidth,
    gapLines: Math.max(1, Math.ceil(layout.paragraphGap / lineHeightPx)),
    maxLines: Math.max(1, Math.floor(contentHeight / lineHeightPx)),
    remainingLines: Math.max(1, Math.floor(contentHeight / lineHeightPx)),
  };
}

function createPageElement(page, index, spec) {
  const article = document.createElement("article");
  article.className = `paper theme-${state.layout.backgroundTheme}${page.type === "cover" ? " cover-page" : ""}`;
  article.dataset.pageIndex = String(index + 1);
  article.style.width = `${spec.width}px`;
  article.style.height = `${spec.height}px`;

  const content = document.createElement("div");
  content.className = "paper-content";
  if (page.type === "cover") {
    content.innerHTML = `
      <div class="cover-kicker" data-pdf-role="cover-kicker">Kindle Clippings</div>
      <h1 class="cover-title" data-pdf-role="cover-title">${escapeHtml(page.bookTitle)}</h1>
      <p class="cover-author" data-pdf-role="cover-author">${escapeHtml(page.author)}</p>
      <div class="cover-line"></div>
      <p class="cover-meta" data-pdf-role="cover-meta">导出日期：${escapeHtml(page.exportDate)}</p>
      <p class="cover-meta" data-pdf-role="cover-meta">共 ${page.bookCount} 条划线</p>
    `;
    article.appendChild(content);
    return article;
  }

  if (page.headerType === "full") {
    content.appendChild(renderFullHeader(page));
  } else if (page.headerType === "compact") {
    content.appendChild(renderCompactHeader(page, index + 1));
  } else {
    const spacer = document.createElement("div");
    spacer.className = "paper-header-spacer";
    content.appendChild(spacer);
  }

  const list = document.createElement("ul");
  list.className = "quote-list";
  page.items.forEach((item) => {
    const li = document.createElement("li");
    li.dataset.itemId = item.id || "";
    if (!state.layout.showBullets) li.classList.add("no-bullet");
    if (state.layout.showBullets) {
      const bullet = document.createElement("span");
      bullet.className = "quote-bullet";
      bullet.dataset.pdfRole = "marker";
      if (state.layout.bulletStyle === "bar") {
        bullet.classList.add("marker-bar");
      }
      bullet.textContent = getBullet(state.layout.bulletStyle);
      li.appendChild(bullet);
    }
    const text = document.createElement("span");
    text.className = "quote-text";
    text.dataset.pdfRole = "quote-text";
    text.textContent = item.content + (item.continued ? "" : "");
    li.appendChild(text);
    if (item.note) {
      const note = document.createElement("div");
      note.className = "quote-note";
      note.dataset.pdfRole = "note";
      note.innerHTML = `<strong class="quote-note-label">笔记：</strong>${escapeHtml(item.note)}`;
      li.appendChild(note);
    }
    list.appendChild(li);
  });
  content.appendChild(list);
  article.appendChild(content);

  const pageNumber = document.createElement("span");
  pageNumber.className = "page-number";
  pageNumber.dataset.pdfRole = "page-number";
  if (page.headerType === "compact") {
    pageNumber.classList.add("hidden");
  }
  pageNumber.textContent = `${index + 1}`;
  article.appendChild(pageNumber);
  return article;
}

function renderFullHeader(page) {
  const fragment = document.createDocumentFragment();
  const header = document.createElement("header");
  header.className = "paper-header";
  header.innerHTML = `
    <h1 class="paper-title" data-pdf-role="title">${escapeHtml(page.bookTitle)}</h1>
    <p class="paper-author" data-pdf-role="author">${escapeHtml(page.author)}</p>
  `;
  const rule = document.createElement("div");
  rule.className = "paper-rule";
  const count = document.createElement("p");
  count.className = "count-line";
  count.dataset.pdfRole = "count";
  count.textContent = `共 ${page.bookCount} 条划线`;
  fragment.appendChild(header);
  fragment.appendChild(rule);
  fragment.appendChild(count);
  return fragment;
}

function renderCompactHeader(page, pageNumber) {
  const header = document.createElement("header");
  header.className = "compact-header";
  header.innerHTML = `
    <span data-pdf-role="compact-title">${escapeHtml(page.bookTitle)} · ${escapeHtml(page.author)}</span>
    <span data-pdf-role="compact-page">${pageNumber}</span>
  `;
  return header;
}

function renderPage(page, pageIndex, spec) {
  return createPageElement(page, pageIndex, spec);
}

function createEmptyPageHtml(spec) {
  return `
    <article class="paper theme-${state.layout.backgroundTheme}" style="width:${spec.width}px;height:${spec.height}px">
      <div class="paper-content">
        <header class="paper-header">
          <h1>未命名书籍</h1>
          <p>未知作者</p>
        </header>
        <div class="paper-rule"></div>
        <p class="count-line">共 0 条划线</p>
      </div>
    </article>
  `;
}

function wrapTextToLines(text, maxWidth, layout) {
  const context = getMeasureContext();
  context.font = `${getEffectiveTextWeight(layout.fontKey, layout.textWeight)} ${layout.fontSize}px ${layout.fontFamily}`;
  const lines = [];
  const paragraphs = text.split(/\n+/);
  paragraphs.forEach((paragraph, paragraphIndex) => {
    let line = "";
    Array.from(paragraph).forEach((char) => {
      const nextLine = line + char;
      if (line && context.measureText(nextLine).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = nextLine;
      }
    });
    if (line) lines.push(line);
    if (paragraphIndex < paragraphs.length - 1) lines.push("");
  });
  return lines;
}

function getMeasureContext() {
  if (!measureContext) {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  return measureContext;
}

function getHeaderMode() {
  return state.layout.headerMode || defaultLayout.headerMode;
}

function getPageHeaderType(bookPageIndex, headerMode = getHeaderMode()) {
  if (headerMode === "repeat") return "full";
  if (bookPageIndex === 0) return "full";
  return headerMode === "compact" ? "compact" : "none";
}

function getAvailableContentHeight(spec, layout, headerType) {
  const padding = getPadding(layout);
  return spec.height - padding.top - padding.bottom - getHeaderHeight(headerType);
}

function getHeaderHeight(headerType) {
  if (headerType === "full") return 154;
  if (headerType === "compact") return 44;
  return 8;
}

function countByBook(items) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getBookKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function getBookKey(item) {
  return `${item.bookTitle || "未命名书籍"}__${item.author || "未知作者"}`;
}

function getPageSpec() {
  if (state.layout.pageSize !== "custom") {
    return PAGE_PRESETS[state.layout.pageSize] || PAGE_PRESETS.A4;
  }
  const ratioW = Math.max(1, state.layout.customRatioW);
  const ratioH = Math.max(1, state.layout.customRatioH);
  const width = 720;
  const height = Math.round((width * ratioH) / ratioW);
  return {
    label: `${ratioW}-${ratioH}`,
    width,
    height,
    pdf: [180, Math.round((180 * ratioH) / ratioW)],
  };
}

function getPadding(layout) {
  return {
    top: layout.marginTop * MM_TO_PX,
    right: layout.marginRight * MM_TO_PX,
    bottom: layout.marginBottom * MM_TO_PX,
    left: layout.marginLeft * MM_TO_PX,
  };
}

function applyPreviewVariables(spec) {
  applyPageVariables(els.paperPages, spec);
}

function applyPageVariables(target, spec) {
  const padding = getPadding(state.layout);
  const paddingValue = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
  target.style.setProperty("--page-width", `${spec.width}px`);
  target.style.setProperty("--page-height", `${spec.height}px`);
  target.style.setProperty("--page-padding", paddingValue);
  target.style.setProperty("--meta-font", FONT_OPTIONS[META_FONT_KEY].cssFamily);
  target.style.setProperty("--quote-font", state.layout.fontFamily);
  target.style.setProperty("--quote-size", `${state.layout.fontSize}px`);
  target.style.setProperty("--quote-line", state.layout.lineHeight);
  target.style.setProperty("--quote-gap", `${state.layout.paragraphGap}px`);
  target.style.setProperty("--quote-weight", getEffectiveTextWeight(state.layout.fontKey, state.layout.textWeight));
}

function renderPreviewScale() {
  els.paperWrap.style.transform = `scale(${state.zoom})`;
  els.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
}

function updateRangeLabels() {
  els.fontSizeLabel.textContent = `${state.layout.fontSize}px`;
  els.lineHeightLabel.textContent = state.layout.lineHeight.toFixed(1);
  els.paragraphGapLabel.textContent = `${state.layout.paragraphGap}px`;
  const weights = {
    300: "清淡",
    400: "常规",
    500: "偏深",
    600: "深",
    700: "极深",
  };
  els.textWeightLabel.textContent = weights[state.layout.textWeight] || "常规";
}

function syncCustomRatioVisibility() {
  els.pageSize.value = state.layout.pageSize;
  els.customRatioW.value = state.layout.customRatioW;
  els.customRatioH.value = state.layout.customRatioH;
  els.customRatioFields.classList.toggle("is-hidden", state.layout.pageSize !== "custom");
}

function getBullet(style) {
  const bullets = {
    square: "■",
    circle: "●",
    diamond: "◆",
    triangle: "▶",
    bar: "",
    none: "",
  };
  return Object.prototype.hasOwnProperty.call(bullets, style) ? bullets[style] : "●";
}

function selectButton(container, selectedButton) {
  container.querySelectorAll("button").forEach((button) => button.classList.remove("selected"));
  selectedButton.classList.add("selected");
}

function selectButtonByValue(container, dataKey, value) {
  const attributeName = dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  const button = Array.from(container.querySelectorAll(`button[data-${attributeName}]`)).find(
    (current) => current.dataset[dataKey] === value
  );
  if (button) {
    selectButton(container, button);
  }
}

function saveState() {
  try {
    const payload = {
      bookInfo: state.bookInfo,
      clippings: state.clippings,
      layout: state.layout,
      importStats: state.importStats,
      exportMode: state.exportMode,
      showCoverPage: state.showCoverPage,
      selectedId: state.selectedId,
      statusMode: state.statusMode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("保存状态失败", error);
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    state.bookInfo = {
      title: saved.bookInfo?.title || "",
      author: saved.bookInfo?.author || "",
    };
    state.layout = { ...defaultLayout, ...(saved.layout || {}) };
    normalizeLayoutFont();
    state.exportMode = saved.exportMode === "notes" ? "notes" : "excerpt";
    state.showCoverPage = Boolean(saved.showCoverPage);
    state.importStats = saved.importStats || null;
    state.clippings = Array.isArray(saved.clippings)
      ? saved.clippings.map((item) => ({
          id: item.id || createId(),
          bookTitle: item.bookTitle || "",
          author: item.author || "",
          content: item.content || "",
          page: item.page || "",
          location: item.location || "",
          createdAt: item.createdAt || "",
          rawMeta: item.rawMeta || "",
          note: item.note || "",
          noteOpen: Boolean(item.noteOpen),
          expanded: Boolean(item.expanded),
        }))
      : [];
    state.selectedId = saved.selectedId && state.clippings.some((item) => item.id === saved.selectedId) ? saved.selectedId : state.clippings[0]?.id || "";
    if (state.selectedId) {
      const selected = state.clippings.find((item) => item.id === state.selectedId);
      state.bookInfo = {
        title: selected?.bookTitle || state.bookInfo.title,
        author: selected?.author || state.bookInfo.author,
      };
    }
    state.statusMode = state.clippings.length ? "count" : saved.statusMode || "count";
  } catch (error) {
    console.warn("读取本地状态失败", error);
  }
}

function exportMarkdown() {
  const items = getPreviewItems();
  if (!items.length) {
    setStatus("没有可导出的 Markdown 内容。");
    return;
  }
  const dateText = formatDate(new Date());
  const groups = groupItemsByBook(items);
  const content = groups
    .map((group) => {
      const lines = [
        `# ${group.title}`,
        "",
        `作者：${group.author}`,
        "",
        `导出日期：${dateText}  `,
        `共 ${group.items.length} 条划线`,
        "",
        "---",
        "",
      ];
      group.items.forEach((item, index) => {
        lines.push(`## 划线 ${index + 1}`, "");
        item.content.split(/\n+/).forEach((line) => {
          if (line.trim()) lines.push(`> ${line.trim()}`);
        });
        if (shouldExportNotes() && item.note?.trim()) {
          lines.push("", "笔记：", item.note.trim());
        }
        lines.push("", "---", "");
      });
      return lines.join("\n").trim();
    })
    .join("\n\n");
  const firstTitle = groups[0]?.title || "Kindle-Clippings";
  const blob = new Blob(["\ufeff", content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${safeFileName(firstTitle)}-Kindle-Clippings.md`);
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  setStatus("Markdown 已导出。");
}

function groupItemsByBook(items) {
  const groups = [];
  const map = new Map();
  items.forEach((item) => {
    const key = getBookKey(item);
    if (!map.has(key)) {
      const group = {
        title: item.bookTitle || "未命名书籍",
        author: item.author || "未知作者",
        items: [],
      };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(item);
  });
  return groups;
}

function flattenBookGroups(items) {
  return groupItemsByBook(items).flatMap((group) => group.items);
}

function moveClippingBefore(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const sourceIndex = state.clippings.findIndex((item) => item.id === sourceId);
  const targetIndex = state.clippings.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [source] = state.clippings.splice(sourceIndex, 1);
  const nextTargetIndex = state.clippings.findIndex((item) => item.id === targetId);
  state.clippings.splice(nextTargetIndex, 0, source);
  state.statusMode = "count";
  renderAll();
  saveState();
}

async function exportPngPages() {
  if (!window.html2canvas) {
    setStatus("导出库尚未加载完成，请稍后再试。");
    return;
  }
  const pages = getPageElements();
  if (!state.pages.length || !pages.length) {
    setStatus("没有可导出的分页内容。");
    return;
  }
  setStatus(`正在导出 ${pages.length} 张图片...`);
  for (let index = 0; index < pages.length; index += 1) {
    const canvas = await capturePageCanvas(pages[index], { scale: PNG_CAPTURE_SCALE });
    const page = state.pages[index];
    const filename = `${safeFileName(page?.bookTitle || "Kindle-Clippings")}-划线排版-p${String(index + 1).padStart(2, "0")}.png`;
    downloadDataUrl(canvas.toDataURL("image/png"), filename);
    await wait(260);
  }
  setStatus(`已导出 ${pages.length} 张图片。`);
}

async function exportPdfPages() {
  await exportPdfTextBased();
}

async function exportImagePdfPages() {
  if (!window.html2canvas || !window.jspdf?.jsPDF) {
    setStatus("导出库尚未加载完成，请稍后再试。");
    return;
  }
  const pages = getPageElements();
  if (!state.pages.length || !pages.length) {
    setStatus("没有可导出的分页内容。");
    return;
  }
  setStatus(`正在生成 ${pages.length} 页高清 PDF...`);
  const { jsPDF } = window.jspdf;
  const spec = getPageSpec();
  const pdfWidth = spec.pdf[0];
  const pdfHeight = spec.pdf[1];
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? "l" : "p",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
  });

  for (let index = 0; index < pages.length; index += 1) {
    if (index > 0) {
      pdf.addPage([pdfWidth, pdfHeight], pdfWidth > pdfHeight ? "l" : "p");
    }
    const canvas = await capturePageCanvas(pages[index], { scale: PDF_CAPTURE_SCALE });
    const imageData = canvas.toDataURL("image/jpeg", PDF_JPEG_QUALITY);
    pdf.addImage(imageData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");
  }

  pdf.save(`${safeFileName(state.clippings[0]?.bookTitle || "Kindle-Clippings")}-划线排版.pdf`);
  setStatus("高清 PDF 已生成。");
}

async function exportPdfTextBased() {
  const items = getPreviewItems();
  if (!items.length && !state.showCoverPage) {
    setStatus("没有可导出的 PDF 内容。");
    return;
  }
  try {
    setStatus("正在生成文字 PDF...");
    const blob = await buildEmbeddedTextPdfBlob();
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `${safeFileName(items[0]?.bookTitle || state.bookInfo.title || "Kindle-Clippings")}-划线排版.pdf`);
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    setStatus("文字 PDF 已生成。");
  } catch (error) {
    console.error(error);
    const detail = error?.friendlyMessage || error?.message || "";
    setStatus(detail ? `文字 PDF 生成失败：${detail}` : "文字 PDF 生成失败，请确认所选字体文件已放入 assets/fonts。");
  }
}

async function buildPdfTextBlob() {
  if (!window.PDFLib || !window.fontkit) {
    throwFriendlyPdfError("PDF 文本导出库尚未加载完成，请稍后再试。");
  }
  const { PDFDocument } = window.PDFLib;
  const doc = await PDFDocument.create();
  const fonts = await initPdfFonts(doc);
  const settings = createPdfSettings(fonts);
  const pages = paginateForPdf(getPreviewItems(), settings);

  pages.forEach((pageData, pageIndex) => {
    const page = doc.addPage([settings.pageWidthPt, settings.pageHeightPt]);
    drawPdfBackground(page, settings);
    if (pageData.type === "cover") {
      drawPdfCoverPage(page, settings, pageData);
      return;
    }
    if (pageData.headerType === "full") {
      drawPdfFullHeader(page, settings, pageData, pageIndex);
    } else if (pageData.headerType === "compact") {
      drawPdfCompactHeader(page, settings, pageData, pageIndex);
    }

    let y = pageData.contentTop;
    pageData.items.forEach((item) => {
      y = drawPdfHighlight(page, item, settings.padding.left, y, pageData.contentWidth, settings);
      if (item.noteLines?.length) {
        y = drawPdfNote(page, item, settings.padding.left + settings.bulletWidth, y + settings.noteGap, pageData.contentWidth - settings.bulletWidth, settings);
      }
      y += settings.paragraphGapPx;
    });

    if (pageData.headerType !== "compact") {
      drawPdfFooter(page, settings, pageIndex);
    }
  });

  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes], { type: "application/pdf" });
}

async function loadPdfFonts() {
  // 文本 PDF 需要真实可嵌入中文字体。请将 NotoSerifSC-Regular.ttf 和
  // NotoSerifSC-Bold.ttf 放入 assets/fonts/，否则中文文本 PDF 会被阻止导出。
  const [regular, bold] = await Promise.all([
    loadRequiredPdfFont(PDF_FONT_FILES.regular),
    loadRequiredPdfFont(PDF_FONT_FILES.bold),
  ]);
  return { regular, bold };
}

async function loadRequiredPdfFont(fontFile) {
  try {
    return await loadArrayBuffer(fontFile.path);
  } catch (error) {
    try {
      return await loadArrayBuffer(fontFile.fallbackPath);
    } catch (fallbackError) {
      throwFriendlyPdfError(`缺少字体文件：${fontFile.path}。请把 Noto Serif SC 的 Regular 和 Bold 字体放入 assets/fonts 后重试。`);
    }
  }
}

async function initPdfFonts(doc) {
  doc.registerFontkit(window.fontkit);
  const fontBytes = await loadPdfFonts();
  return {
    regular: await doc.embedFont(fontBytes.regular, { subset: false }),
    bold: await doc.embedFont(fontBytes.bold, { subset: false }),
  };
}

function createPdfSettings(fonts) {
  const spec = PDF_A4_SPEC;
  const scale = mmToPt(spec.pdf[0]) / spec.width;
  const padding = getPadding(state.layout);
  const theme = getThemeColors(state.layout.backgroundTheme);
  return {
    spec,
    scale,
    fonts,
    theme,
    pageWidthPt: mmToPt(spec.pdf[0]),
    pageHeightPt: mmToPt(spec.pdf[1]),
    padding,
    fontSizePx: state.layout.fontSize,
    lineHeightPx: state.layout.fontSize * state.layout.lineHeight,
    noteFontSizePx: Math.max(11, state.layout.fontSize * 0.78),
    noteLineHeightPx: Math.max(11, state.layout.fontSize * 0.78) * 1.65,
    paragraphGapPx: state.layout.paragraphGap,
    noteGap: 8,
    bulletWidth: state.layout.showBullets ? 22 : 0,
    footerReservePx: 34,
    showNotes: shouldExportNotes(),
    showCoverPage: state.showCoverPage,
    headerMode: getHeaderMode(),
  };
}

function paginateForPdf(highlights, settings) {
  const pages = [];
  const bookCounts = countByBook(highlights);
  if (settings.showCoverPage) {
    pages.push(createPdfCoverPageData(highlights));
  }

  let currentPage = null;
  let currentBookKey = "";
  let currentBookPageIndex = 0;

  highlights.forEach((highlight) => {
    const bookKey = getBookKey(highlight);
    if (bookKey !== currentBookKey) {
      currentBookKey = bookKey;
      currentBookPageIndex = 0;
      currentPage = createPdfContentPage(highlight, bookCounts.get(bookKey), settings, currentBookPageIndex);
      pages.push(currentPage);
    }

    const blocks = splitHighlightForPdf(highlight, currentPage.contentWidth, settings);
    blocks.forEach((block) => {
      const blockHeight = measurePdfBlockHeight(block, settings);
      if (currentPage.items.length && blockHeight > currentPage.remainingHeight) {
        currentBookPageIndex += 1;
        currentPage = createPdfContentPage(highlight, bookCounts.get(bookKey), settings, currentBookPageIndex);
        pages.push(currentPage);
      }

      if (blockHeight <= currentPage.remainingHeight || !block.contentLines.length) {
        addPdfBlockToPage(currentPage, block, blockHeight);
        return;
      }

      let remainingLines = block.contentLines.slice();
      while (remainingLines.length) {
        if (currentPage.items.length || currentPage.remainingHeight <= settings.lineHeightPx) {
          currentBookPageIndex += 1;
          currentPage = createPdfContentPage(highlight, bookCounts.get(bookKey), settings, currentBookPageIndex);
          pages.push(currentPage);
        }
        const canIncludeNote = block.noteLines.length && remainingLines.length <= Math.floor((currentPage.remainingHeight - measurePdfNoteHeight(block.noteLines, settings)) / settings.lineHeightPx);
        const noteHeight = canIncludeNote ? measurePdfNoteHeight(block.noteLines, settings) : 0;
        const lineCapacity = Math.max(1, Math.floor((currentPage.remainingHeight - noteHeight) / settings.lineHeightPx));
        const contentLines = remainingLines.slice(0, lineCapacity);
        remainingLines = remainingLines.slice(contentLines.length);
        const pageBlock = {
          ...block,
          contentLines,
          noteLines: remainingLines.length ? [] : block.noteLines,
          continued: remainingLines.length > 0,
        };
        addPdfBlockToPage(currentPage, pageBlock, measurePdfBlockHeight(pageBlock, settings));
      }
    });
  });

  return pages;
}

function createPdfCoverPageData(highlights) {
  const first = highlights[0] || {};
  return {
    type: "cover",
    bookTitle: state.bookInfo.title || first.bookTitle || "未命名书籍",
    author: state.bookInfo.author || first.author || "未知作者",
    bookCount: highlights.length,
    exportDate: formatDate(new Date()),
  };
}

function createPdfContentPage(item, bookCount, settings, bookPageIndex) {
  const headerType = getPdfPageHeaderType(bookPageIndex, settings.headerMode, settings.showCoverPage);
  const contentTop = settings.padding.top + getHeaderHeight(headerType);
  const footerReserve = headerType === "compact" ? 8 : settings.footerReservePx;
  const contentBottom = settings.spec.height - settings.padding.bottom - footerReserve;
  const contentWidth = settings.spec.width - settings.padding.left - settings.padding.right;
  return {
    bookTitle: item.bookTitle || "未命名书籍",
    author: item.author || "未知作者",
    bookCount: bookCount || 0,
    bookPageIndex,
    headerType,
    contentTop,
    contentBottom,
    contentWidth,
    remainingHeight: Math.max(settings.lineHeightPx, contentBottom - contentTop),
    items: [],
  };
}

function getPdfPageHeaderType(bookPageIndex, headerMode, hasCover) {
  if (headerMode === "repeat") return "full";
  if (hasCover && headerMode === "compact") return "compact";
  if (bookPageIndex === 0) return "full";
  return headerMode === "compact" ? "compact" : "none";
}

function splitHighlightForPdf(highlight, pageContentWidth, settings) {
  const textWidth = Math.max(80, pageContentWidth - settings.bulletWidth);
  const contentLines = wrapPdfText(settings.fonts.regular, highlight.content, textWidth, settings.fontSizePx, settings.scale);
  const noteText = settings.showNotes ? (highlight.note || "").trim() : "";
  const noteLines = noteText ? wrapPdfText(settings.fonts.regular, noteText, textWidth - 12, settings.noteFontSizePx, settings.scale) : [];
  return [
    {
      id: highlight.id,
      contentLines,
      noteLines,
      continued: false,
    },
  ];
}

function addPdfBlockToPage(page, block, blockHeight) {
  page.items.push(block);
  page.remainingHeight -= blockHeight;
}

function measurePdfTextBlock(font, text, maxWidth, fontSize, lineHeight, scale) {
  return wrapPdfText(font, text, maxWidth, fontSize, scale).length * lineHeight;
}

function measurePdfBlockHeight(block, settings) {
  return (
    Math.max(1, block.contentLines.length) * settings.lineHeightPx +
    measurePdfNoteHeight(block.noteLines, settings) +
    settings.paragraphGapPx
  );
}

function measurePdfNoteHeight(noteLines, settings) {
  if (!noteLines?.length) return 0;
  return settings.noteGap + (noteLines.length + 1) * settings.noteLineHeightPx;
}

function wrapPdfText(font, text, maxWidth, fontSize, scale) {
  const lines = [];
  const maxWidthPt = maxWidth * scale;
  const fontSizePt = fontSize * scale;
  String(text || "")
    .split(/\n+/)
    .forEach((paragraph, paragraphIndex, paragraphs) => {
      let line = "";
      Array.from(paragraph).forEach((char) => {
        const nextLine = line + char;
        if (line && font.widthOfTextAtSize(nextLine, fontSizePt) > maxWidthPt) {
          lines.push(line);
          line = char;
        } else {
          line = nextLine;
        }
      });
      if (line) lines.push(line);
      if (paragraphIndex < paragraphs.length - 1) lines.push("");
    });
  return lines;
}

function drawPdfBackground(page, settings) {
  drawPdfVectorRect(page, 0, 0, settings.spec.width, settings.spec.height, settings.theme.background, settings);
}

function drawPdfCoverPage(page, settings, cover) {
  const centerY = settings.spec.height * 0.42;
  const left = settings.spec.width * 0.16;
  const width = settings.spec.width * 0.68;
  drawPdfVectorText(page, "Kindle Clippings", left, centerY - 78, 15, settings.theme.muted, settings, settings.fonts.regular);
  drawPdfVectorText(page, cover.bookTitle, left, centerY - 34, 46, settings.theme.title, settings, settings.fonts.bold);
  drawPdfVectorText(page, cover.author, left, centerY + 28, 20, settings.theme.muted, settings, settings.fonts.regular);
  drawPdfVectorLine(page, left, centerY + 70, left + width, centerY + 70, settings.theme.rule, 1, settings);
  drawPdfVectorText(page, `导出日期：${cover.exportDate}`, left, centerY + 108, 18, settings.theme.muted, settings, settings.fonts.regular);
  drawPdfVectorText(page, `共 ${cover.bookCount} 条划线`, left, centerY + 140, 18, settings.theme.muted, settings, settings.fonts.regular);
}

function drawPdfFullHeader(page, settings, pageData) {
  const x = settings.padding.left;
  const y = settings.padding.top;
  const width = settings.spec.width - settings.padding.left - settings.padding.right;
  drawPdfVectorText(page, pageData.bookTitle, x, y, 34, settings.theme.title, settings, settings.fonts.bold);
  drawPdfVectorText(page, pageData.author, x, y + 54, 19, settings.theme.muted, settings, settings.fonts.regular);
  drawPdfVectorLine(page, x, y + 94, x + width, y + 94, settings.theme.rule, 1, settings);
  drawPdfVectorText(page, `共 ${pageData.bookCount} 条划线`, x, y + 121, 13, settings.theme.light, settings, settings.fonts.regular);
}

function drawPdfCompactHeader(page, settings, pageData, pageIndex) {
  const x = settings.padding.left;
  const y = settings.padding.top;
  const width = settings.spec.width - settings.padding.left - settings.padding.right;
  drawPdfVectorText(page, `${pageData.bookTitle} · ${pageData.author}`, x, y + 4, 13, settings.theme.light, settings, settings.fonts.regular);
  drawPdfVectorText(page, String(pageIndex + 1), x + width, y + 4, 13, settings.theme.light, settings, settings.fonts.regular, { align: "right" });
  drawPdfVectorLine(page, x, y + 34, x + width, y + 34, settings.theme.rule, 1, settings);
}

function drawPdfFooter(page, settings, pageIndex) {
  drawPdfVectorText(page, String(pageIndex + 1), settings.spec.width - 26, settings.spec.height - 28, 12, settings.theme.light, settings, settings.fonts.regular, { align: "right" });
}

function drawPdfHighlight(page, highlight, x, y, maxWidth, settings) {
  const textX = x + settings.bulletWidth;
  if (state.layout.showBullets) {
    drawPdfMarker(page, x, y, Math.max(1, highlight.contentLines.length) * settings.lineHeightPx, settings);
  }
  highlight.contentLines.forEach((line, index) => {
    drawPdfVectorText(page, line, textX, y + index * settings.lineHeightPx, settings.fontSizePx, settings.theme.text, settings, getPdfBodyFont(settings));
  });
  return y + Math.max(1, highlight.contentLines.length) * settings.lineHeightPx;
}

function drawPdfNote(page, highlight, x, y, maxWidth, settings) {
  drawPdfVectorRect(page, x + 12, y + 2, 3, Math.max(16, highlight.noteLines.length * settings.noteLineHeightPx - 2), settings.theme.marker, settings, 0.45);
  drawPdfVectorText(page, "笔记：", x + 24, y, settings.noteFontSizePx, settings.theme.muted, settings, settings.fonts.regular);
  highlight.noteLines.forEach((line, index) => {
    drawPdfVectorText(page, line, x + 24, y + (index + 1) * settings.noteLineHeightPx, settings.noteFontSizePx, settings.theme.muted, settings, settings.fonts.regular);
  });
  return y + (highlight.noteLines.length + 1) * settings.noteLineHeightPx;
}

function addPdfPageIfNeeded(doc, pdfState) {
  if (pdfState.y <= pdfState.bottom) return pdfState.page;
  pdfState.page = doc.addPage([pdfState.settings.pageWidthPt, pdfState.settings.pageHeightPt]);
  pdfState.y = pdfState.top;
  return pdfState.page;
}

function getPdfBodyFont(settings) {
  return state.layout.textWeight >= 600 ? settings.fonts.bold : settings.fonts.regular;
}

function drawPdfMarker(page, x, y, height, settings) {
  const style = state.layout.bulletStyle;
  if (style === "none") return;
  const markerCenterX = x + settings.bulletWidth * 0.5;
  const markerCenterY = y + settings.fontSizePx * 0.52;
  const markerSize = Math.max(3.2, Math.min(5.6, settings.fontSizePx * 0.24));
  if (style === "bar") {
    drawPdfVectorRect(page, markerCenterX - 1.4, y + 7, 2.8, Math.max(18, height - 14), settings.theme.marker, settings, 0.9);
  } else if (style === "square") {
    drawPdfVectorRect(page, markerCenterX - markerSize * 0.5, markerCenterY - markerSize * 0.5, markerSize, markerSize, settings.theme.marker, settings, 0.9);
  } else if (style === "diamond") {
    drawPdfVectorDiamond(page, markerCenterX, markerCenterY, markerSize * 0.58, settings.theme.marker, settings);
  } else if (style === "triangle") {
    drawPdfVectorTriangle(page, markerCenterX - markerSize * 0.48, markerCenterY - markerSize * 0.55, markerSize * 1.12, markerSize * 1.12, settings.theme.marker, settings);
  } else {
    drawPdfVectorCircle(page, markerCenterX, markerCenterY, markerSize * 0.42, settings.theme.marker, settings);
  }
}

function drawPdfVectorText(page, text, xPx, yPx, sizePx, color, settings, font, options = {}) {
  const sizePt = sizePx * settings.scale;
  const value = String(text || "");
  const width = font.widthOfTextAtSize(value, sizePt);
  page.drawText(value, {
    x: xPx * settings.scale + (options.align === "right" ? -width : 0),
    y: settings.pageHeightPt - (yPx + sizePx * 0.86) * settings.scale,
    size: sizePt,
    font,
    color: toPdfRgb(color),
  });
}

function drawPdfVectorRect(page, xPx, yPx, widthPx, heightPx, color, settings, opacity = 1) {
  page.drawRectangle({
    x: xPx * settings.scale,
    y: settings.pageHeightPt - (yPx + heightPx) * settings.scale,
    width: widthPx * settings.scale,
    height: heightPx * settings.scale,
    color: toPdfRgb(color, opacity),
  });
}

function drawPdfVectorLine(page, x1Px, y1Px, x2Px, y2Px, color, widthPx, settings) {
  page.drawLine({
    start: { x: x1Px * settings.scale, y: settings.pageHeightPt - y1Px * settings.scale },
    end: { x: x2Px * settings.scale, y: settings.pageHeightPt - y2Px * settings.scale },
    thickness: widthPx * settings.scale,
    color: toPdfRgb(color),
  });
}

function drawPdfVectorCircle(page, cxPx, cyPx, rPx, color, settings) {
  page.drawCircle({
    x: cxPx * settings.scale,
    y: settings.pageHeightPt - cyPx * settings.scale,
    size: rPx * 2 * settings.scale,
    color: toPdfRgb(color),
  });
}

function drawPdfVectorDiamond(page, cxPx, cyPx, rPx, color, settings) {
  const cx = cxPx * settings.scale;
  const cy = settings.pageHeightPt - cyPx * settings.scale;
  const r = rPx * settings.scale;
  page.drawSvgPath(`M ${cx} ${cy + r} L ${cx + r} ${cy} L ${cx} ${cy - r} L ${cx - r} ${cy} Z`, { color: toPdfRgb(color) });
}

function drawPdfVectorTriangle(page, xPx, yPx, widthPx, heightPx, color, settings) {
  const x = xPx * settings.scale;
  const yTop = settings.pageHeightPt - yPx * settings.scale;
  const yBottom = settings.pageHeightPt - (yPx + heightPx) * settings.scale;
  const yMid = settings.pageHeightPt - (yPx + heightPx / 2) * settings.scale;
  page.drawSvgPath(`M ${x} ${yTop} L ${x + widthPx * settings.scale} ${yMid} L ${x} ${yBottom} Z`, { color: toPdfRgb(color) });
}

function throwFriendlyPdfError(message) {
  const error = new Error(message);
  error.friendlyMessage = message;
  throw error;
}

async function buildNativePdfBlob() {
  return buildPdfTextBlob();
}

async function buildEmbeddedTextPdfBlob() {
  if (!window.PDFLib || !window.fontkit) {
    throwFriendlyPdfError("PDF 文本导出库尚未加载完成，请稍后再试。");
  }
  await waitForFonts();
  await nextFrame();
  await nextFrame();
  const { PDFDocument } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(window.fontkit);

  const spec = getPageSpec();
  const pageWidthPt = mmToPt(spec.pdf[0]);
  const pageHeightPt = mmToPt(spec.pdf[1]);
  const measuredPages = await measurePreviewPagesForPdf(spec);
  if (!measuredPages.length) {
    throwFriendlyPdfError("没有可导出的分页内容。");
  }
  const embeddedFontCache = new Map();
  const fontRegistry = await createMeasuredPdfFontRegistry(pdfDoc, measuredPages, embeddedFontCache);

  measuredPages.forEach((pageData) => {
    const pdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    drawMeasuredPdfPage(pdfPage, pageData, spec, pageWidthPt, pageHeightPt, fontRegistry);
  });

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([bytes], { type: "application/pdf" });
}

async function measurePreviewPagesForPdf(spec) {
  if (!getPageElements().length && state.pages.length) {
    renderPreview();
    await waitForFonts();
    await nextFrame();
  }
  const measuredPages = [];
  const pageElements = getPageElements();
  for (const pageElement of pageElements) {
    const { page, cleanup } = createExportPageClone(pageElement, spec);
    await waitForFonts();
    await nextFrame();
    await nextFrame();
    try {
      measuredPages.push(measurePdfPageFromElement(page));
    } finally {
      cleanup();
    }
  }
  return measuredPages;
}

function measurePdfPageFromElement(page) {
  const pageRect = page.getBoundingClientRect();
  const pageStyle = window.getComputedStyle(page);
  const background = flattenCssColor(pageStyle.backgroundColor || getThemeColors(state.layout.backgroundTheme).background);
  const rects = [];
  const texts = [];

  page.querySelectorAll(".paper-rule, .cover-line").forEach((element) => {
    const style = window.getComputedStyle(element);
    const box = getRelativeBox(element, pageRect);
    if (box) {
      rects.push({ ...box, color: flattenCssColor(style.backgroundColor, background) });
    }
  });

  page.querySelectorAll(".compact-header").forEach((element) => {
    const style = window.getComputedStyle(element);
    const borderWidth = parseCssPx(style.borderBottomWidth);
    if (borderWidth > 0) {
      const box = getRelativeBox(element, pageRect);
      if (!box) return;
      rects.push({
        x: box.x,
        y: box.y + box.height - borderWidth,
        width: box.width,
        height: borderWidth,
        color: flattenCssColor(style.borderBottomColor, background),
      });
    }
  });

  page.querySelectorAll(".quote-note").forEach((element) => {
    const style = window.getComputedStyle(element);
    const borderWidth = parseCssPx(style.borderLeftWidth);
    if (borderWidth > 0) {
      const box = getRelativeBox(element, pageRect);
      if (!box) return;
      rects.push({
        x: box.x,
        y: box.y,
        width: borderWidth,
        height: box.height,
        color: flattenCssColor(style.borderLeftColor, background),
      });
    }
  });

  page.querySelectorAll(".quote-bullet.marker-bar").forEach((element) => {
    const marker = measureBarMarker(element, pageRect, background);
    if (marker) rects.push(marker);
  });

  page
    .querySelectorAll(
      [
        ".cover-kicker",
        ".cover-title",
        ".cover-author",
        ".cover-meta",
        ".paper-title",
        ".paper-author",
        ".count-line",
        ".compact-header span",
        ".page-number",
        ".quote-text",
        ".quote-note",
        ".quote-bullet:not(.marker-bar)",
      ].join(", ")
    )
    .forEach((element) => {
      texts.push(...measureTextElementForPdf(element, pageRect, background));
    });

  return { background, rects, texts };
}

function getRelativeBox(element, pageRect) {
  if (!isElementVisible(element)) return null;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - pageRect.left,
    y: rect.top - pageRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function measureBarMarker(element, pageRect, background) {
  if (!isElementVisible(element)) return null;
  const box = getRelativeBox(element, pageRect);
  if (!box) return null;
  const style = window.getComputedStyle(element);
  const before = window.getComputedStyle(element, "::before");
  const width = parseCssPx(before.width, 4);
  const top = parseCssPx(before.top, 7);
  const bottom = parseCssPx(before.bottom, 7);
  return {
    x: box.x + box.width / 2 - width / 2,
    y: box.y + top,
    width,
    height: Math.max(parseCssPx(before.minHeight, 18), box.height - top - bottom),
    color: flattenCssColor(style.color, background),
    radius: parseCssPx(before.borderRadius),
  };
}

function measureTextElementForPdf(element, pageRect, background) {
  if (!isElementVisible(element)) return [];
  const segments = [];
  getTextNodes(element).forEach((node) => {
    segments.push(...measureTextNodeForPdf(node, pageRect, background));
  });
  return segments;
}

function measureTextNodeForPdf(node, pageRect, background) {
  const rawText = node.nodeValue || "";
  if (!rawText.trim()) return [];
  const element = node.parentElement;
  if (!element || !isElementVisible(element)) return [];
  const style = window.getComputedStyle(element);
  const role = getPdfTextRole(element);
  const fontKey = inferFontKey(style.fontFamily);
  const fontSize = parseCssPx(style.fontSize, state.layout.fontSize);
  const lineHeight = parseCssLineHeight(style.lineHeight, fontSize);
  const fontWeight = getEffectiveTextWeight(fontKey, parseCssFontWeight(style.fontWeight));
  const letterSpacing = parseCssPx(style.letterSpacing);
  const color = flattenCssColor(style.color, background);
  const baselineOffset = Math.max(fontSize * 0.72, (lineHeight - fontSize) / 2 + fontSize * 0.86);
  const range = document.createRange();
  const groups = [];
  let offset = 0;

  Array.from(rawText).forEach((char) => {
    const nextOffset = offset + char.length;
    range.setStart(node, offset);
    range.setEnd(node, nextOffset);
    offset = nextOffset;
    const rect = getFirstVisibleRect(range);
    if (!rect) {
      const last = groups[groups.length - 1];
      if (last && /\s/.test(char)) last.text += char;
      return;
    }
    const x = rect.left - pageRect.left;
    const y = rect.top - pageRect.top;
    if (Math.abs(letterSpacing) > 0.01) {
      groups.push({ text: char, x, y, height: rect.height });
      return;
    }
    const last = groups[groups.length - 1];
    if (last && Math.abs(last.y - y) < Math.max(4, lineHeight * 0.5)) {
      last.text += char;
      last.y = Math.min(last.y, y);
      last.height = Math.max(last.height, rect.height);
    } else {
      groups.push({ text: char, x, y, height: rect.height });
    }
  });
  range.detach?.();

  return groups
    .filter((group) => group.text)
    .map((group) => ({
      text: group.text,
      x: group.x,
      y: group.y,
      fontSize,
      lineHeight,
      baselineOffset,
      fontKey,
      fontWeight,
      color,
      role,
    }));
}

function getPdfTextRole(element) {
  return element.closest("[data-pdf-role]")?.dataset.pdfRole || "";
}

function getTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function getFirstVisibleRect(range) {
  const rects = Array.from(range.getClientRects());
  return rects.find((rect) => rect.width > 0 && rect.height > 0) || null;
}

function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

async function createMeasuredPdfFontRegistry(pdfDoc, measuredPages, embeddedFontCache) {
  const styleContext = prepareMeasuredPdfTextStyles(measuredPages);
  const requests = new Map();
  measuredPages.forEach((page) => {
    page.texts.forEach((text) => {
      const fontKey = FONT_OPTIONS[text.fontKey] ? text.fontKey : defaultLayout.fontKey;
      const weight = getPdfTextWeight(text, styleContext);
      text.pdfFontWeight = weight;
      text.pdfColor = getPdfTextColor(text);
      requests.set(getPdfFontCacheKey(fontKey, weight), { fontKey, weight });
    });
  });
  if (!requests.size) {
    requests.set(getPdfFontCacheKey(META_FONT_KEY, 400), { fontKey: META_FONT_KEY, weight: 400 });
  }
  const fonts = new Map();
  for (const request of requests.values()) {
    fonts.set(
      getPdfFontCacheKey(request.fontKey, request.weight),
      await embedConfiguredFont(pdfDoc, request.fontKey, embeddedFontCache, request.weight)
    );
  }
  return {
    get(fontKey, weight) {
      const normalizedKey = FONT_OPTIONS[fontKey] ? fontKey : defaultLayout.fontKey;
      const normalizedWeight = getEffectiveTextWeight(normalizedKey, weight);
      const key = getPdfFontCacheKey(normalizedKey, normalizedWeight);
      return fonts.get(key) || fonts.get(getPdfFontCacheKey(META_FONT_KEY, 400)) || Array.from(fonts.values())[0];
    },
  };
}

function prepareMeasuredPdfTextStyles(measuredPages) {
  let needsSongtiRegular = false;
  measuredPages.forEach((page) => {
    page.texts.forEach((text) => {
      if (text.fontKey === META_FONT_KEY && text.role !== "quote-text") return;
      if (text.fontKey === META_FONT_KEY && getEffectiveTextWeight(text.fontKey, text.fontWeight) < 600) {
        needsSongtiRegular = true;
      }
    });
  });
  return { preferBoldMeta: !needsSongtiRegular };
}

function getPdfTextWeight(text, context = {}) {
  if (["title", "cover-title"].includes(text.role)) return 700;
  if (text.fontKey === META_FONT_KEY && context.preferBoldMeta && text.role !== "quote-text") return 700;
  return getEffectiveTextWeight(text.fontKey, text.fontWeight);
}

function getPdfTextColor(text) {
  if (["title", "cover-title"].includes(text.role)) return darkenCssColor(text.color, 0.16);
  if (text.role === "quote-text") return darkenCssColor(text.color, text.fontWeight >= 600 ? 0.16 : 0.1);
  if (text.role === "marker") return darkenCssColor(text.color, 0.12);
  return darkenCssColor(text.color, 0.04);
}

function getPdfFontCacheKey(fontKey, weight) {
  return `${fontKey}:${Number(weight) >= 600 ? 700 : 400}`;
}

function drawMeasuredPdfPage(pdfPage, pageData, spec, pageWidthPt, pageHeightPt, fontRegistry) {
  const scale = pageWidthPt / spec.width;
  drawEmbeddedRect(pdfPage, 0, 0, spec.width, spec.height, pageData.background, scale, pageHeightPt);
  pageData.rects.forEach((rect) => {
    drawEmbeddedRect(pdfPage, rect.x, rect.y, rect.width, rect.height, rect.color, scale, pageHeightPt);
  });
  pageData.texts.forEach((text) => {
    const font = fontRegistry.get(text.fontKey, text.pdfFontWeight ?? text.fontWeight);
    drawMeasuredText(pdfPage, text, scale, pageHeightPt, font);
  });
}

function drawMeasuredText(pdfPage, text, scale, pageHeightPt, font) {
  pdfPage.drawText(String(text.text || ""), {
    x: text.x * scale,
    y: pageHeightPt - (text.y + text.baselineOffset) * scale,
    size: text.fontSize * scale,
    font,
    color: toPdfRgb(text.pdfColor || text.color),
  });
}

function parseCssPx(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCssLineHeight(value, fontSize) {
  if (!value || value === "normal") return fontSize * 1.2;
  return parseCssPx(value, fontSize * 1.2);
}

function parseCssFontWeight(value) {
  if (value === "bold") return 700;
  if (value === "normal") return 400;
  return parseCssPx(value, 400);
}

function flattenCssColor(color, background = "#ffffff") {
  const fg = parseColor(color);
  const bg = parseColor(background);
  const alpha = fg.a ?? 1;
  return `rgb(${Math.round(fg.r * alpha + bg.r * (1 - alpha))}, ${Math.round(fg.g * alpha + bg.g * (1 - alpha))}, ${Math.round(fg.b * alpha + bg.b * (1 - alpha))})`;
}

function darkenCssColor(color, amount = 0) {
  const { r, g, b } = parseColor(color);
  const ratio = Math.max(0, Math.min(1, amount));
  return `rgb(${Math.round(r * (1 - ratio))}, ${Math.round(g * (1 - ratio))}, ${Math.round(b * (1 - ratio))})`;
}

async function embedConfiguredFont(pdfDoc, fontKey, embeddedFontCache = new Map(), weight = 400) {
  const normalizedKey = FONT_OPTIONS[fontKey] ? fontKey : defaultLayout.fontKey;
  const config = FONT_OPTIONS[normalizedKey];
  const useBold = Number(weight) >= 600 && config.supportsBold && config.pdfBoldPath;
  const path = useBold ? config.pdfBoldPath : config.pdfPath || FONT_OPTIONS.songti.pdfPath;
  const fallbackPath = useBold ? config.remotePdfBoldPath : config.remotePdfPath;
  const subset = config.pdfSubset !== false;
  const cacheKey = `${path}__${subset ? "subset" : "full"}`;
  if (embeddedFontCache.has(cacheKey)) {
    return embeddedFontCache.get(cacheKey);
  }
  try {
    const bytes = await loadPdfFontBytes(path, fallbackPath);
    const font = await pdfDoc.embedFont(bytes, { subset });
    embeddedFontCache.set(cacheKey, font);
    return font;
  } catch (error) {
    throwFriendlyPdfError(`${normalizedKey} 字体嵌入失败：${error?.message || "请检查字体文件是否可访问"}`);
  }
}

async function loadPdfFontBytes(path, fallbackPath = "") {
  if (pdfFontBufferCache.has(path)) {
    return pdfFontBufferCache.get(path);
  }
  try {
    const bytes = await loadArrayBuffer(path);
    pdfFontBufferCache.set(path, bytes);
    return bytes;
  } catch (error) {
    if (!fallbackPath) throw error;
    try {
      const bytes = await loadArrayBuffer(fallbackPath);
      pdfFontBufferCache.set(path, bytes);
      return bytes;
    } catch (fallbackError) {
      throw new Error(`${path} 加载失败，备用字体也不可用`);
    }
  }
}

async function loadArrayBuffer(path) {
  try {
    const response = await fetch(path);
    if (response.ok) {
      return await response.arrayBuffer();
    }
  } catch (error) {
    console.warn("fetch 字体失败，尝试本地 XHR。", error);
  }
  return loadArrayBufferWithXhr(path);
}

function loadArrayBufferWithXhr(path) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", path, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      if ((request.status >= 200 && request.status < 300) || request.status === 0) {
        resolve(request.response);
        return;
      }
      reject(new Error(`字体加载失败：${path}`));
    };
    request.onerror = () => reject(new Error(`字体加载失败：${path}`));
    request.send();
  });
}

function drawEmbeddedPdfPage(pdfPage, pageData, pageIndex, spec, pageWidthPt, pageHeightPt, fonts) {
  const scale = pageWidthPt / spec.width;
  const theme = getThemeColors(state.layout.backgroundTheme);
  const padding = getPadding(state.layout);
  drawEmbeddedRect(pdfPage, 0, 0, spec.width, spec.height, theme.background, scale, pageHeightPt);

  if (pageData.type === "cover") {
    drawEmbeddedCoverPage(pdfPage, pageData, spec, scale, pageHeightPt, theme, fonts.meta);
    return;
  }

  let contentY = padding.top;
  if (pageData.headerType === "full") {
    drawEmbeddedFullHeader(pdfPage, pageData, padding.left, padding.top, spec.width - padding.left - padding.right, scale, pageHeightPt, theme, fonts.meta);
    contentY += getHeaderHeight("full");
  } else if (pageData.headerType === "compact") {
    drawEmbeddedCompactHeader(pdfPage, pageData, pageIndex + 1, padding.left, padding.top, spec.width - padding.left - padding.right, scale, pageHeightPt, theme, fonts.meta);
    contentY += getHeaderHeight("compact");
  } else {
    contentY += getHeaderHeight("none");
  }

  drawEmbeddedQuoteList(pdfPage, pageData, padding.left, contentY, pageData.contentWidth, scale, pageHeightPt, theme, fonts);
  if (pageData.headerType !== "compact") {
    drawEmbeddedText(pdfPage, String(pageIndex + 1), spec.width - 26, spec.height - 28, 12, theme.light, scale, pageHeightPt, fonts.meta, { align: "right" });
  }
}

function drawEmbeddedCoverPage(pdfPage, pageData, spec, scale, pageHeightPt, theme, font) {
  const centerY = spec.height * 0.42;
  const left = spec.width * 0.16;
  const width = spec.width * 0.68;
  drawEmbeddedText(pdfPage, "Kindle Clippings", left, centerY - 78, 15, theme.muted, scale, pageHeightPt, font);
  drawEmbeddedText(pdfPage, pageData.bookTitle, left, centerY - 34, 46, theme.title, scale, pageHeightPt, font);
  drawEmbeddedText(pdfPage, pageData.author, left, centerY + 28, 20, theme.muted, scale, pageHeightPt, font);
  drawEmbeddedLine(pdfPage, left, centerY + 70, left + width, centerY + 70, theme.rule, 1, scale, pageHeightPt);
  drawEmbeddedText(pdfPage, `导出日期：${pageData.exportDate}`, left, centerY + 108, 18, theme.muted, scale, pageHeightPt, font);
  drawEmbeddedText(pdfPage, `共 ${pageData.bookCount} 条划线`, left, centerY + 140, 18, theme.muted, scale, pageHeightPt, font);
}

function drawEmbeddedFullHeader(pdfPage, pageData, x, y, width, scale, pageHeightPt, theme, font) {
  drawEmbeddedText(pdfPage, pageData.bookTitle, x, y, 34, theme.title, scale, pageHeightPt, font);
  drawEmbeddedText(pdfPage, pageData.author, x, y + 54, 19, theme.muted, scale, pageHeightPt, font);
  drawEmbeddedLine(pdfPage, x, y + 94, x + width, y + 94, theme.rule, 1, scale, pageHeightPt);
  drawEmbeddedText(pdfPage, `共 ${pageData.bookCount} 条划线`, x, y + 121, 13, theme.light, scale, pageHeightPt, font);
}

function drawEmbeddedCompactHeader(pdfPage, pageData, pageNumber, x, y, width, scale, pageHeightPt, theme, font) {
  drawEmbeddedText(pdfPage, `${pageData.bookTitle} · ${pageData.author}`, x, y + 4, 13, theme.light, scale, pageHeightPt, font);
  drawEmbeddedText(pdfPage, String(pageNumber), x + width, y + 4, 13, theme.light, scale, pageHeightPt, font, { align: "right" });
  drawEmbeddedLine(pdfPage, x, y + 34, x + width, y + 34, theme.rule, 1, scale, pageHeightPt);
}

function drawEmbeddedQuoteList(pdfPage, pageData, x, y, width, scale, pageHeightPt, theme, fonts) {
  const layout = state.layout;
  const bulletWidth = layout.showBullets ? 22 : 0;
  const textX = x + bulletWidth;
  const textWidth = Math.max(80, width - bulletWidth);
  const lineHeight = layout.fontSize * layout.lineHeight;
  let cursorY = y;

  pageData.items.forEach((item) => {
    const lines = wrapPdfTextToLines(item.content, textWidth, layout, fonts.content, scale);
    if (layout.showBullets) {
      drawEmbeddedMarker(pdfPage, x, cursorY, Math.max(1, lines.length) * lineHeight, scale, pageHeightPt, theme);
    }
    lines.forEach((line, lineIndex) => {
      drawEmbeddedText(pdfPage, line, textX, cursorY + lineIndex * lineHeight, layout.fontSize, theme.text, scale, pageHeightPt, fonts.content);
    });
    cursorY += Math.max(1, lines.length) * lineHeight;

    if (item.note) {
      const noteLayout = getNoteLayout(layout);
      const noteLines = wrapPdfTextToLines(item.note, textWidth - 12, noteLayout, fonts.meta, scale);
      const noteLineHeight = noteLayout.fontSize * noteLayout.lineHeight;
      cursorY += 8;
      drawEmbeddedRect(pdfPage, textX, cursorY + 2, 3, Math.max(16, noteLines.length * noteLineHeight - 2), theme.marker, scale, pageHeightPt, 0.45);
      drawEmbeddedText(pdfPage, "笔记：", textX + 12, cursorY, noteLayout.fontSize, theme.muted, scale, pageHeightPt, fonts.meta);
      noteLines.forEach((line, lineIndex) => {
        drawEmbeddedText(pdfPage, line, textX + 12, cursorY + (lineIndex + 1) * noteLineHeight, noteLayout.fontSize, theme.muted, scale, pageHeightPt, fonts.meta);
      });
      cursorY += (noteLines.length + 1) * noteLineHeight;
    }

    cursorY += layout.paragraphGap;
  });
}

function wrapPdfTextToLines(text, maxWidthPx, layout, font, scale) {
  const lines = [];
  const maxWidthPt = maxWidthPx * scale;
  const fontSizePt = layout.fontSize * scale;
  String(text || "")
    .split(/\n+/)
    .forEach((paragraph, paragraphIndex, paragraphs) => {
      let line = "";
      Array.from(paragraph).forEach((char) => {
        const nextLine = line + char;
        if (line && font.widthOfTextAtSize(nextLine, fontSizePt) > maxWidthPt) {
          lines.push(line);
          line = char;
        } else {
          line = nextLine;
        }
      });
      if (line) lines.push(line);
      if (paragraphIndex < paragraphs.length - 1) lines.push("");
    });
  return lines;
}

function drawEmbeddedMarker(pdfPage, x, y, height, scale, pageHeightPt, theme) {
  const style = state.layout.bulletStyle;
  const markerColor = theme.marker;
  const bulletWidth = state.layout.showBullets ? 22 : 0;
  const markerCenterX = x + bulletWidth * 0.5;
  const markerCenterY = y + state.layout.fontSize * 0.52;
  const markerSize = Math.max(3.2, Math.min(5.6, state.layout.fontSize * 0.24));
  if (style === "bar") {
    drawEmbeddedRect(pdfPage, markerCenterX - 1.4, y + 7, 2.8, Math.max(18, height - 14), markerColor, scale, pageHeightPt, 0.9);
    return;
  }
  if (style === "none") return;
  if (style === "square") {
    drawEmbeddedRect(pdfPage, markerCenterX - markerSize * 0.5, markerCenterY - markerSize * 0.5, markerSize, markerSize, markerColor, scale, pageHeightPt, 0.9);
    return;
  }
  if (style === "diamond") {
    drawEmbeddedDiamond(pdfPage, markerCenterX, markerCenterY, markerSize * 0.58, markerColor, scale, pageHeightPt);
    return;
  }
  if (style === "triangle") {
    drawEmbeddedTriangle(pdfPage, markerCenterX - markerSize * 0.48, markerCenterY - markerSize * 0.55, markerSize * 1.12, markerSize * 1.12, markerColor, scale, pageHeightPt);
    return;
  }
  drawEmbeddedCircle(pdfPage, markerCenterX, markerCenterY, markerSize * 0.42, markerColor, scale, pageHeightPt);
}

function drawEmbeddedText(pdfPage, text, xPx, yPx, sizePx, color, scale, pageHeightPt, font, options = {}) {
  const sizePt = sizePx * scale;
  const textValue = String(text || "");
  const width = font.widthOfTextAtSize(textValue, sizePt);
  const x = xPx * scale + (options.align === "right" ? -width : 0);
  const y = pageHeightPt - (yPx + sizePx * 0.86) * scale;
  pdfPage.drawText(textValue, {
    x,
    y,
    size: sizePt,
    font,
    color: toPdfRgb(color),
  });
}

function drawEmbeddedRect(pdfPage, xPx, yPx, widthPx, heightPx, color, scale, pageHeightPt, opacity = 1) {
  pdfPage.drawRectangle({
    x: xPx * scale,
    y: pageHeightPt - (yPx + heightPx) * scale,
    width: widthPx * scale,
    height: heightPx * scale,
    color: toPdfRgb(color, opacity),
  });
}

function drawEmbeddedLine(pdfPage, x1Px, y1Px, x2Px, y2Px, color, widthPx, scale, pageHeightPt) {
  pdfPage.drawLine({
    start: { x: x1Px * scale, y: pageHeightPt - y1Px * scale },
    end: { x: x2Px * scale, y: pageHeightPt - y2Px * scale },
    thickness: widthPx * scale,
    color: toPdfRgb(color),
  });
}

function drawEmbeddedCircle(pdfPage, cxPx, cyPx, rPx, color, scale, pageHeightPt) {
  pdfPage.drawCircle({
    x: cxPx * scale,
    y: pageHeightPt - cyPx * scale,
    size: rPx * 2 * scale,
    color: toPdfRgb(color),
  });
}

function drawEmbeddedDiamond(pdfPage, cxPx, cyPx, rPx, color, scale, pageHeightPt) {
  const cx = cxPx * scale;
  const cy = pageHeightPt - cyPx * scale;
  const r = rPx * scale;
  pdfPage.drawSvgPath(`M ${cx} ${cy + r} L ${cx + r} ${cy} L ${cx} ${cy - r} L ${cx - r} ${cy} Z`, {
    color: toPdfRgb(color),
  });
}

function drawEmbeddedTriangle(pdfPage, xPx, yPx, widthPx, heightPx, color, scale, pageHeightPt) {
  const x = xPx * scale;
  const yTop = pageHeightPt - yPx * scale;
  const yBottom = pageHeightPt - (yPx + heightPx) * scale;
  const yMid = pageHeightPt - (yPx + heightPx / 2) * scale;
  pdfPage.drawSvgPath(`M ${x} ${yTop} L ${x + widthPx * scale} ${yMid} L ${x} ${yBottom} Z`, {
    color: toPdfRgb(color),
  });
}

function toPdfRgb(color, opacity = 1) {
  const { rgb } = window.PDFLib;
  const { r, g, b, a } = parseColor(color);
  const alpha = opacity * (a ?? 1);
  if (alpha >= 1) return rgb(r / 255, g / 255, b / 255);
  return rgb(
    (r * alpha + 255 * (1 - alpha)) / 255,
    (g * alpha + 255 * (1 - alpha)) / 255,
    (b * alpha + 255 * (1 - alpha)) / 255
  );
}

function buildFallbackNativePdfBlob() {
  const spec = getPageSpec();
  const pageWidthPt = mmToPt(spec.pdf[0]);
  const pageHeightPt = mmToPt(spec.pdf[1]);
  const objects = [];
  const reserveObject = () => {
    objects.push("");
    return objects.length;
  };
  const setObject = (id, value) => {
    objects[id - 1] = value;
  };

  const catalogId = reserveObject();
  const pagesId = reserveObject();
  const fontId = reserveObject();
  const cidFontId = reserveObject();
  const latinFontId = reserveObject();
  const pageIds = [];

  state.pages.forEach((page, index) => {
    const contentId = reserveObject();
    const pageId = reserveObject();
    const stream = buildNativePdfPageStream(page, index, spec, pageWidthPt, pageHeightPt);
    setObject(contentId, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    setObject(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${formatPdfNumber(pageWidthPt)} ${formatPdfNumber(pageHeightPt)}] /Resources << /ProcSet [/PDF /Text] /Font << /F1 ${fontId} 0 R /F2 ${latinFontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  setObject(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  setObject(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  setObject(
    fontId,
    `<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [${cidFontId} 0 R] >>`
  );
  setObject(
    cidFontId,
    `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 5 >> /DW 1000 >>`
  );
  setObject(latinFontId, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function buildNativePdfPageStream(page, pageIndex, spec, pageWidthPt, pageHeightPt) {
  const scale = pageWidthPt / spec.width;
  const theme = getThemeColors(state.layout.backgroundTheme);
  const padding = getPadding(state.layout);
  const commands = [];
  const add = (command) => commands.push(command);

  drawPdfRect(add, 0, 0, spec.width, spec.height, theme.background, scale, pageHeightPt);

  if (page.type === "cover") {
    drawNativeCoverPage(add, page, spec, scale, pageHeightPt, theme);
    return commands.join("\n");
  }

  let contentY = padding.top;
  if (page.headerType === "full") {
    drawNativeFullHeader(add, page, padding.left, padding.top, spec.width - padding.left - padding.right, scale, pageHeightPt, theme);
    contentY += getHeaderHeight("full");
  } else if (page.headerType === "compact") {
    drawNativeCompactHeader(add, page, pageIndex + 1, padding.left, padding.top, spec.width - padding.left - padding.right, scale, pageHeightPt, theme);
    contentY += getHeaderHeight("compact");
  } else {
    contentY += getHeaderHeight("none");
  }

  drawNativeQuoteList(add, page, padding.left, contentY, page.contentWidth, scale, pageHeightPt, theme);
  if (page.headerType !== "compact") {
    drawPdfText(add, String(pageIndex + 1), spec.width - 26, spec.height - 28, 12, theme.light, scale, pageHeightPt, { align: "right" });
  }
  return commands.join("\n");
}

function drawNativeCoverPage(add, page, spec, scale, pageHeightPt, theme) {
  const centerY = spec.height * 0.42;
  const left = spec.width * 0.16;
  const width = spec.width * 0.68;
  drawPdfText(add, "Kindle Clippings", left, centerY - 78, 15, theme.muted, scale, pageHeightPt);
  drawPdfText(add, page.bookTitle, left, centerY - 34, 46, theme.title, scale, pageHeightPt);
  drawPdfText(add, page.author, left, centerY + 28, 20, theme.muted, scale, pageHeightPt);
  drawPdfLine(add, left, centerY + 70, left + width, centerY + 70, theme.rule, 1, scale, pageHeightPt);
  drawPdfText(add, `导出日期：${page.exportDate}`, left, centerY + 108, 18, theme.muted, scale, pageHeightPt);
  drawPdfText(add, `共 ${page.bookCount} 条划线`, left, centerY + 140, 18, theme.muted, scale, pageHeightPt);
}

function drawNativeFullHeader(add, page, x, y, width, scale, pageHeightPt, theme) {
  drawPdfText(add, page.bookTitle, x, y, 34, theme.title, scale, pageHeightPt);
  drawPdfText(add, page.author, x, y + 54, 19, theme.muted, scale, pageHeightPt);
  drawPdfLine(add, x, y + 94, x + width, y + 94, theme.rule, 1, scale, pageHeightPt);
  drawPdfText(add, `共 ${page.bookCount} 条划线`, x, y + 121, 13, theme.light, scale, pageHeightPt);
}

function drawNativeCompactHeader(add, page, pageNumber, x, y, width, scale, pageHeightPt, theme) {
  drawPdfText(add, `${page.bookTitle} · ${page.author}`, x, y + 4, 13, theme.light, scale, pageHeightPt);
  drawPdfText(add, String(pageNumber), x + width, y + 4, 13, theme.light, scale, pageHeightPt, { align: "right" });
  drawPdfLine(add, x, y + 34, x + width, y + 34, theme.rule, 1, scale, pageHeightPt);
}

function drawNativeQuoteList(add, page, x, y, width, scale, pageHeightPt, theme) {
  const layout = state.layout;
  const bulletWidth = layout.showBullets ? 22 : 0;
  const textX = x + bulletWidth;
  const textWidth = Math.max(80, width - bulletWidth);
  const lineHeight = layout.fontSize * layout.lineHeight;
  let cursorY = y;

  page.items.forEach((item) => {
    const lines = wrapTextToLines(item.content, textWidth, layout);
    if (layout.showBullets) {
      drawNativeMarker(add, x, cursorY, lines.length * lineHeight, scale, pageHeightPt, theme);
    }
    lines.forEach((line, lineIndex) => {
      drawPdfText(add, line, textX, cursorY + lineIndex * lineHeight, layout.fontSize, theme.text, scale, pageHeightPt);
    });
    cursorY += Math.max(1, lines.length) * lineHeight;

    if (item.note) {
      const noteLayout = getNoteLayout(layout);
      const noteLines = wrapTextToLines(item.note, textWidth - 12, noteLayout);
      cursorY += 8;
      drawPdfRect(add, textX, cursorY + 2, 3, Math.max(16, noteLines.length * noteLayout.fontSize * noteLayout.lineHeight - 2), theme.marker, scale, pageHeightPt, 0.45);
      drawPdfText(add, "笔记：", textX + 12, cursorY, noteLayout.fontSize, theme.muted, scale, pageHeightPt);
      noteLines.forEach((line, lineIndex) => {
        drawPdfText(add, line, textX + 12, cursorY + (lineIndex + 1) * noteLayout.fontSize * noteLayout.lineHeight, noteLayout.fontSize, theme.muted, scale, pageHeightPt);
      });
      cursorY += (noteLines.length + 1) * noteLayout.fontSize * noteLayout.lineHeight;
    }

    cursorY += layout.paragraphGap;
  });
}

function drawNativeMarker(add, x, y, height, scale, pageHeightPt, theme) {
  const style = state.layout.bulletStyle;
  const markerColor = theme.marker;
  if (style === "bar") {
    drawPdfRect(add, x + 9, y + 7, 4, Math.max(18, height - 14), markerColor, scale, pageHeightPt, 0.9);
    return;
  }
  if (style === "none") return;
  const cy = y + state.layout.fontSize * state.layout.lineHeight * 0.5;
  if (style === "square") {
    drawPdfRect(add, x + 8, cy - 4, 8, 8, markerColor, scale, pageHeightPt, 0.9);
    return;
  }
  if (style === "diamond") {
    drawPdfDiamond(add, x + 12, cy, 5, markerColor, scale, pageHeightPt);
    return;
  }
  if (style === "triangle") {
    drawPdfTriangle(add, x + 8, cy - 5, 10, 10, markerColor, scale, pageHeightPt);
    return;
  }
  drawPdfCircle(add, x + 12, cy, 4.2, markerColor, scale, pageHeightPt);
}

function drawPdfText(add, text, xPx, yPx, sizePx, color, scale, pageHeightPt, options = {}) {
  const sizePt = sizePx * scale;
  const x = xPx * scale;
  const y = pageHeightPt - (yPx + sizePx * 0.86) * scale;
  const textWidth = estimatePdfTextWidth(text, sizePt);
  const tx = options.align === "right" ? x - textWidth : x;
  let cursorX = tx;
  splitPdfTextRuns(text).forEach((run) => {
    if (!run.text) return;
    if (run.type === "latin") {
      add(
        `BT /F2 ${formatPdfNumber(sizePt)} Tf ${pdfRgb(color)} rg ${formatPdfNumber(cursorX)} ${formatPdfNumber(y)} Td (${escapePdfLiteral(run.text)}) Tj ET`
      );
    } else {
      add(
        `BT /F1 ${formatPdfNumber(sizePt)} Tf ${pdfRgb(color)} rg ${formatPdfNumber(cursorX)} ${formatPdfNumber(y)} Td <${utf16BeHex(run.text)}> Tj ET`
      );
    }
    cursorX += estimatePdfTextWidth(run.text, sizePt, run.type);
  });
}

function drawPdfRect(add, xPx, yPx, widthPx, heightPx, color, scale, pageHeightPt, opacity = 1) {
  const x = xPx * scale;
  const y = pageHeightPt - (yPx + heightPx) * scale;
  const width = widthPx * scale;
  const height = heightPx * scale;
  add(`q ${pdfRgb(color, opacity)} rg ${formatPdfNumber(x)} ${formatPdfNumber(y)} ${formatPdfNumber(width)} ${formatPdfNumber(height)} re f Q`);
}

function drawPdfLine(add, x1Px, y1Px, x2Px, y2Px, color, widthPx, scale, pageHeightPt) {
  add(
    `q ${pdfRgb(color)} RG ${formatPdfNumber(widthPx * scale)} w ${formatPdfNumber(x1Px * scale)} ${formatPdfNumber(pageHeightPt - y1Px * scale)} m ${formatPdfNumber(x2Px * scale)} ${formatPdfNumber(pageHeightPt - y2Px * scale)} l S Q`
  );
}

function drawPdfCircle(add, cxPx, cyPx, rPx, color, scale, pageHeightPt) {
  const k = 0.5522847498;
  const cx = cxPx * scale;
  const cy = pageHeightPt - cyPx * scale;
  const r = rPx * scale;
  const c = r * k;
  add(
    `q ${pdfRgb(color)} rg ${formatPdfNumber(cx + r)} ${formatPdfNumber(cy)} m ${formatPdfNumber(cx + r)} ${formatPdfNumber(cy + c)} ${formatPdfNumber(cx + c)} ${formatPdfNumber(cy + r)} ${formatPdfNumber(cx)} ${formatPdfNumber(cy + r)} c ${formatPdfNumber(cx - c)} ${formatPdfNumber(cy + r)} ${formatPdfNumber(cx - r)} ${formatPdfNumber(cy + c)} ${formatPdfNumber(cx - r)} ${formatPdfNumber(cy)} c ${formatPdfNumber(cx - r)} ${formatPdfNumber(cy - c)} ${formatPdfNumber(cx - c)} ${formatPdfNumber(cy - r)} ${formatPdfNumber(cx)} ${formatPdfNumber(cy - r)} c ${formatPdfNumber(cx + c)} ${formatPdfNumber(cy - r)} ${formatPdfNumber(cx + r)} ${formatPdfNumber(cy - c)} ${formatPdfNumber(cx + r)} ${formatPdfNumber(cy)} c f Q`
  );
}

function drawPdfDiamond(add, cxPx, cyPx, rPx, color, scale, pageHeightPt) {
  const cx = cxPx * scale;
  const cy = pageHeightPt - cyPx * scale;
  const r = rPx * scale;
  add(`q ${pdfRgb(color)} rg ${formatPdfNumber(cx)} ${formatPdfNumber(cy + r)} m ${formatPdfNumber(cx + r)} ${formatPdfNumber(cy)} l ${formatPdfNumber(cx)} ${formatPdfNumber(cy - r)} l ${formatPdfNumber(cx - r)} ${formatPdfNumber(cy)} l h f Q`);
}

function drawPdfTriangle(add, xPx, yPx, widthPx, heightPx, color, scale, pageHeightPt) {
  const x = xPx * scale;
  const yTop = pageHeightPt - yPx * scale;
  const yBottom = pageHeightPt - (yPx + heightPx) * scale;
  const yMid = pageHeightPt - (yPx + heightPx / 2) * scale;
  add(`q ${pdfRgb(color)} rg ${formatPdfNumber(x)} ${formatPdfNumber(yTop)} m ${formatPdfNumber(x + widthPx * scale)} ${formatPdfNumber(yMid)} l ${formatPdfNumber(x)} ${formatPdfNumber(yBottom)} l h f Q`);
}

function pdfRgb(color, opacity = 1) {
  const { r, g, b } = parseColor(color);
  if (opacity < 1) {
    const bg = { r: 255, g: 255, b: 255 };
    return [r, g, b]
      .map((value, index) => {
        const backgroundValue = [bg.r, bg.g, bg.b][index];
        return formatPdfNumber((value * opacity + backgroundValue * (1 - opacity)) / 255);
      })
      .join(" ");
  }
  return [r, g, b].map((value) => formatPdfNumber(value / 255)).join(" ");
}

function parseColor(color) {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 };
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?/);
  if (match) {
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
      a: match[4] === undefined ? 1 : Number(match[4]),
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function utf16BeHex(text) {
  let hex = "";
  Array.from(String(text || "")).forEach((char) => {
    const code = char.codePointAt(0);
    const safeCode = code > 0xffff ? 0x25a1 : code;
    hex += String(safeCode.toString(16)).padStart(4, "0").toUpperCase();
  });
  return hex;
}

function splitPdfTextRuns(text) {
  const runs = [];
  let current = "";
  let currentType = "";
  Array.from(String(text || "")).forEach((char) => {
    const type = isLatinPdfChar(char) ? "latin" : "cjk";
    if (current && type !== currentType) {
      runs.push({ type: currentType, text: current });
      current = "";
    }
    current += char;
    currentType = type;
  });
  if (current) runs.push({ type: currentType, text: current });
  return runs;
}

function isLatinPdfChar(char) {
  const code = char.codePointAt(0);
  return code >= 0x20 && code <= 0x7e;
}

function estimatePdfTextWidth(text, fontSizePt, forcedType = "") {
  if (forcedType === "latin") {
    return Array.from(String(text || "")).reduce((width, char) => width + (char === " " ? 0.28 : 0.53), 0) * fontSizePt;
  }
  if (forcedType === "cjk") {
    return Array.from(String(text || "")).length * fontSizePt;
  }
  return splitPdfTextRuns(text).reduce((width, run) => width + estimatePdfTextWidth(run.text, fontSizePt, run.type), 0);
}

function escapePdfLiteral(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function mmToPt(mm) {
  return (mm * 72) / 25.4;
}

function formatPdfNumber(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function exportWordPages() {
  if (!state.pages.length) {
    setStatus("没有可导出的 Word 内容。");
    return;
  }
  const spec = getPageSpec();
  const html = buildWordHtml(spec);
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${safeFileName(state.clippings[0]?.bookTitle || "Kindle-Clippings")}-划线排版.doc`);
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  setStatus("Word 已生成。");
}

function buildWordHtml(spec) {
  const layout = state.layout;
  const padding = getPadding(layout);
  const pageWidthMm = spec.pdf[0];
  const pageHeightMm = spec.pdf[1];
  const theme = getThemeColors(layout.backgroundTheme);
  const marker = getBullet(layout.bulletStyle);
  const markerHtml = (content) => {
    if (!layout.showBullets) return "";
    if (layout.bulletStyle === "bar") {
      return `<td class="marker-cell"><span class="word-bar"></span></td>`;
    }
    return `<td class="marker-cell"><span class="word-marker">${escapeHtml(marker)}</span></td>`;
  };
  const pages = state.pages
    .map((page, index) => {
      if (page.type === "cover") {
        return `
          <section class="word-page cover-word-page">
            <p class="cover-kicker">Kindle Clippings</p>
            <h1 class="cover-title">${escapeHtml(page.bookTitle)}</h1>
            <p class="cover-author">${escapeHtml(page.author)}</p>
            <div class="cover-line"></div>
            <p class="cover-meta">导出日期：${escapeHtml(page.exportDate)}</p>
            <p class="cover-meta">共 ${page.bookCount} 条划线</p>
          </section>
        `;
      }
      const quotes = page.items
        .map((item) => {
          return `
            <table class="quote-row" cellspacing="0" cellpadding="0">
              <tr>
                ${markerHtml(item.content)}
                <td class="quote-text">
                  ${escapeHtml(item.content)}
                  ${item.note ? `<div class="word-note"><strong>笔记：</strong>${escapeHtml(item.note)}</div>` : ""}
                </td>
              </tr>
            </table>
          `;
        })
        .join("");
      return `
        <section class="word-page">
          ${renderWordHeader(page, index + 1)}
          ${quotes}
          ${page.headerType === "compact" ? "" : `<span class="page-number">${index + 1}</span>`}
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }
          body {
            margin: 0;
            color: ${theme.text};
            background: ${theme.background};
            font-family: Songti SC, STSong, SimSun, serif;
          }
          .word-page {
            position: relative;
            width: ${pageWidthMm}mm;
            height: ${pageHeightMm}mm;
            box-sizing: border-box;
            padding: ${padding.top / MM_TO_PX}mm ${padding.right / MM_TO_PX}mm ${padding.bottom / MM_TO_PX}mm ${padding.left / MM_TO_PX}mm;
            page-break-after: always;
            background: ${theme.background};
            overflow: hidden;
          }
          h1 {
            margin: 0 0 12px;
            color: ${theme.title};
            font-family: Songti SC, STSong, SimSun, serif;
            font-size: 26pt;
            line-height: 1.2;
          }
          .author {
            margin: 0;
            color: ${theme.muted};
            font-family: Songti SC, STSong, SimSun, serif;
            font-size: 14pt;
          }
          .rule {
            height: 1px;
            margin: 20px 0 16px;
            background: ${theme.rule};
          }
          .count {
            margin: 0 0 20px;
            color: ${theme.light};
            font-size: 10pt;
          }
          .word-compact-header {
            display: table;
            width: 100%;
            margin: 0 0 14pt;
            padding-bottom: 7pt;
            border-bottom: 1px solid ${theme.rule};
            color: ${theme.light};
            font-family: Songti SC, STSong, SimSun, serif;
            font-size: 10pt;
            line-height: 1.25;
          }
          .word-compact-header span {
            display: table-cell;
          }
          .word-compact-header span:last-child {
            width: 20mm;
            text-align: right;
          }
          .word-header-spacer {
            height: 6pt;
          }
          .quote-row {
            width: 100%;
            margin: 0 0 ${layout.paragraphGap * 0.6}pt;
            border-collapse: collapse;
          }
          .marker-cell {
            width: 18pt;
            vertical-align: top;
            text-align: center;
            color: ${theme.marker};
            font-family: Songti SC, STSong, SimSun, serif;
          }
          .word-marker {
            display: inline-block;
            padding-top: ${layout.fontSize * layout.lineHeight * 0.32}px;
            font-size: ${layout.fontSize * 0.48}px;
            line-height: 1;
          }
          .word-bar {
            display: inline-block;
            width: 3px;
            min-height: ${Math.max(18, layout.fontSize * layout.lineHeight - 14)}px;
            border-radius: 999px;
            background: ${theme.marker};
          }
          .quote-text {
            font-family: ${wordFontFamily(layout.fontKey, layout.fontFamily)};
            font-size: ${layout.fontSize}pt;
            line-height: ${layout.lineHeight};
            font-weight: ${layout.textWeight};
            vertical-align: top;
          }
          .page-number {
            position: absolute;
            right: 14mm;
            bottom: 10mm;
            color: ${theme.light};
            font-size: 9pt;
          }
          .word-note {
            margin-top: 7pt;
            padding-left: 9pt;
            border-left: 2pt solid ${theme.marker};
            color: ${theme.muted};
            font-family: Songti SC, STSong, SimSun, serif;
            font-size: ${Math.max(9, layout.fontSize * 0.72)}pt;
            line-height: 1.55;
            font-weight: 400;
          }
          .cover-word-page {
            display: table;
          }
          .cover-word-page::before {
            content: "";
            display: table-cell;
            height: 100%;
            vertical-align: middle;
          }
          .cover-kicker {
            color: ${theme.muted};
            font-size: 12pt;
            letter-spacing: 3pt;
          }
          .cover-title {
            margin: 18pt 0 12pt;
            color: ${theme.title};
            font-size: 34pt;
            line-height: 1.15;
          }
          .cover-author,
          .cover-meta {
            margin: 0 0 8pt;
            color: ${theme.muted};
            font-size: 16pt;
          }
          .cover-line {
            height: 1px;
            margin: 26pt 0;
            background: ${theme.rule};
          }
        </style>
      </head>
      <body>${pages}</body>
    </html>
  `;
}

function renderWordHeader(page, pageNumber) {
  if (page.headerType === "full") {
    return `
      <h1>${escapeHtml(page.bookTitle)}</h1>
      <p class="author">${escapeHtml(page.author)}</p>
      <div class="rule"></div>
      <p class="count">共 ${page.bookCount} 条划线</p>
    `;
  }
  if (page.headerType === "compact") {
    return `
      <div class="word-compact-header">
        <span>${escapeHtml(page.bookTitle)} · ${escapeHtml(page.author)}</span>
        <span>${pageNumber}</span>
      </div>
    `;
  }
  return `<div class="word-header-spacer"></div>`;
}

function getPageElements() {
  return Array.from(els.paperPages.querySelectorAll(".paper"));
}

async function capturePageCanvas(pageElement, options = {}) {
  await waitForFonts();
  const spec = getPageSpec();
  const { page: exportPage, cleanup } = createExportPageClone(pageElement, spec);
  await nextFrame();
  await nextFrame();
  await waitForFonts();

  try {
    return await html2canvas(exportPage, {
      backgroundColor: null,
      scale: options.scale || PNG_CAPTURE_SCALE,
      useCORS: true,
      allowTaint: false,
      windowWidth: spec.width,
      windowHeight: spec.height,
      width: spec.width,
      height: spec.height,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    cleanup();
  }
}

function createExportPageClone(pageElement, spec) {
  const host = document.createElement("div");
  host.className = "export-capture-host";
  host.style.position = "fixed";
  host.style.left = "-12000px";
  host.style.top = "0";
  host.style.width = `${spec.width}px`;
  host.style.height = `${spec.height}px`;
  host.style.overflow = "hidden";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  applyPageVariables(host, spec);

  const page = pageElement.cloneNode(true);
  page.style.width = `${spec.width}px`;
  page.style.height = `${spec.height}px`;
  page.style.boxShadow = "none";
  page.style.transform = "none";
  page.style.margin = "0";
  host.appendChild(page);
  document.body.appendChild(host);

  return {
    page,
    cleanup: () => host.remove(),
  };
}

async function waitForFonts() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function getThemeColors(theme) {
  const themes = {
    white: {
      background: "#fffefe",
      text: "#251f18",
      title: "#65311e",
      muted: "#8b806f",
      light: "#aca18e",
      marker: "#75664f",
      rule: "rgba(138,112,63,0.18)",
    },
    paper: {
      background: "#f7ecd1",
      text: "#251f18",
      title: "#65311e",
      muted: "#8b806f",
      light: "#aca18e",
      marker: "#75664f",
      rule: "rgba(138,112,63,0.18)",
    },
    green: {
      background: "#eaf4e9",
      text: "#251f18",
      title: "#65311e",
      muted: "#728071",
      light: "#8d9a8a",
      marker: "#64725f",
      rule: "rgba(92,112,82,0.18)",
    },
    dark: {
      background: "#1f211f",
      text: "#ece6d7",
      title: "#f0c78f",
      muted: "#b8b2a7",
      light: "#b8b2a7",
      marker: "#f0c78f",
      rule: "rgba(240,199,143,0.22)",
    },
  };
  return themes[theme] || themes.white;
}

function wordFontFamily(fontKey, fontFamily = "") {
  if (FONT_OPTIONS[fontKey]) {
    return FONT_OPTIONS[fontKey].wordFamily;
  }
  if (fontFamily.includes("SimHei")) {
    return "SimHei, Heiti SC, Microsoft YaHei, sans-serif";
  }
  if (fontFamily.includes("Zhi Mang Xing")) {
    return "Zhi Mang Xing, LXGW WenKai, Kaiti SC, STKaiti, KaiTi, serif";
  }
  if (fontFamily.includes("LXGW WenKai")) {
    return "LXGW WenKai, Kaiti SC, STKaiti, KaiTi, serif";
  }
  if (fontFamily.includes("Yuanti") || fontFamily.includes("YouYuan")) {
    return "Yuanti SC, YouYuan, Microsoft YaHei, sans-serif";
  }
  if (fontFamily.includes("Kaiti")) {
    return "LXGW WenKai, Kaiti SC, STKaiti, KaiTi, serif";
  }
  return "Songti SC, STSong, SimSun, serif";
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function setStatus(text) {
  els.statusLine.textContent = text;
}

function createId(seed = Date.now()) {
  return `${Date.now().toString(36)}-${seed}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeFileName(name) {
  return (name || "Kindle-Clippings").replace(/[\\/:*?"<>|]/g, "_");
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.ClippingsParser = { parseClippings, parseKindleClippings, deduplicateHighlights, parseBookLine, parseMetaLine };
window.ClippingsPager = { paginateClippings, getPageSpec };
window.ClippingsExport = {
  capturePageCanvas,
  exportMarkdown,
  exportPdfTextBased,
  buildNativePdfBlob,
  buildPdfTextBlob,
  buildEmbeddedTextPdfBlob,
};
