const STORE = {
  metrics: "slidesci.metrics",
  assets: "slidesci.assets",
  ai: "slidesci.ai",
  citations: "slidesci.citations",
  panelOrder: "slidesci.panelOrder",
  assetExport: "slidesci.assetExport"
};

const $ = (id) => document.getElementById(id);
let currentCitation = null;
let chartDrafts = {};
let currentChartType = "line";
let currentSectionTemplate = "swiss";
let currentNavTemplate = "orbit";
let currentSectionLanguage = "zh";
let currentNavLanguage = "zh";

const SECTION_TITLE_PRESETS = {
  zh: [
    ["研究背景", "Research Background"],
    ["研究目的", "Research Objectives"],
    ["研究内容", "Research Scope"],
    ["研究方法", "Methodology"],
    ["结果与讨论", "Results & Discussion"],
    ["总结与展望", "Conclusions & Outlook"]
  ],
  en: [
    ["Research Background", "CONTEXT & MOTIVATION"],
    ["Research Objectives", "QUESTIONS & HYPOTHESES"],
    ["Research Scope", "STUDY OVERVIEW"],
    ["Methodology", "DESIGN & METHODS"],
    ["Results & Discussion", "FINDINGS & INTERPRETATION"],
    ["Conclusions & Outlook", "TAKEAWAYS & NEXT STEPS"]
  ]
};

const NAVIGATION_PRESETS = {
  zh: ["研究背景", "研究目的", "研究内容", "研究方法", "结果讨论", "总结展望"],
  en: ["Background", "Objectives", "Scope", "Methods", "Results", "Conclusions"]
};

const CHART_TEMPLATES = {
  line: {
    guide: "宽表格式：第 1 列是 X，后续每列是一组 Y。适合时间序列、剂量响应和趋势比较。",
    example: [["x", "Control", "Treatment"], ["0", "1.2", "1.4"], ["1", "2.1", "2.8"], ["2", "2.9", "4.1"], ["3", "3.4", "5.2"]],
    addSeries: true
  },
  scatter: {
    guide: "宽表格式：第 1 列是 X，后续每列是一组 Y。X 和所有 Y 单元格均填写数字。",
    example: [["x", "Group A", "Group B"], ["1", "1.1", "1.6"], ["2", "2.4", "2.0"], ["3", "2.8", "3.7"], ["4", "4.3", "4.0"]],
    addSeries: true
  },
  bar: {
    guide: "宽表格式：第 1 列是类别名称，后续每列是一个实验组。每行生成一组并列柱。",
    example: [["Category", "Control", "Treatment"], ["Gene A", "2.1", "3.4"], ["Gene B", "3.2", "4.8"], ["Gene C", "1.8", "3.1"]],
    addSeries: true
  },
  replicatebar: {
    guide: "长表格式：每行是一条重复实验。第 1 列填写组名，第 2 列填写原始数值；同组重复多行。柱高自动取均值，每条原始数据绘制为一个点。",
    example: [["Group", "Value"], ["Control", "18"], ["Control", "23"], ["Control", "15"], ["Treatment A", "58"], ["Treatment A", "72"], ["Treatment A", "64"], ["Treatment B", "125"], ["Treatment B", "148"], ["Treatment B", "132"]],
    addSeries: false
  },
  area: {
    guide: "宽表格式：第 1 列是 X，后续每列是一组 Y。面积从 Y=0 基线填充，建议使用非负数据。",
    example: [["x", "Signal A", "Signal B"], ["0", "0.8", "0.4"], ["1", "1.7", "1.1"], ["2", "2.5", "1.8"], ["3", "2.0", "2.4"]],
    addSeries: true
  },
  errorbar: {
    guide: "固定 3 列：X/类别、均值、误差。误差填写 SD、SEM 或置信区间半宽，并在 Y 轴名称中注明。",
    example: [["Category", "Mean", "Error"], ["Control", "2.4", "0.3"], ["Low dose", "3.1", "0.4"], ["High dose", "4.6", "0.5"]],
    addSeries: false
  },
  box: {
    guide: "长表格式：每一行是一条原始观测。第 1 列填写组名，第 2 列填写数值；同组可重复多行。",
    example: [["Group", "Value"], ["Control", "2.1"], ["Control", "2.5"], ["Control", "2.8"], ["Treatment", "3.2"], ["Treatment", "3.8"], ["Treatment", "4.1"]],
    addSeries: false
  },
  heatmap: {
    guide: "矩阵格式：第 1 列是行名，首行后续单元格是列名，其余区域全部填写数值。",
    example: [["Feature", "Sample 1", "Sample 2", "Sample 3"], ["Gene A", "1.2", "2.4", "3.1"], ["Gene B", "2.8", "1.6", "2.2"], ["Gene C", "3.5", "2.9", "1.4"]],
    addSeries: true
  }
};

const actions = {
  copyMetrics,
  pastePosition: () => pasteMetrics({ position: true, size: false }),
  pasteSize: () => pasteMetrics({ position: false, size: true }),
  pasteMetrics: () => pasteMetrics({ position: true, size: true }),
  arrangeGrid: () => arrangeSelected("grid"),
  arrangeByRows: () => arrangeSelected("rows"),
  alignLeft: () => alignSelected("left"),
  alignCenter: () => alignSelected("center"),
  alignTop: () => alignSelected("top"),
  alignMiddle: () => alignSelected("middle"),
  spaceHorizontal: () => spaceSelected("horizontal"),
  spaceVertical: () => spaceSelected("vertical"),
  addCaptions,
  addLabels,
  insertMarkdown,
  insertLatexImage,
  checkSelectedContrast,
  fixSelectedContrast,
  applySelectedColor,
  insertCsvChart,
  downloadCsvChartSvg,
  addChartRow,
  addChartSeries,
  resetChartTemplate,
  loadCsvIntoChartTable,
  lookupDoi,
  insertCitation,
  saveCitation,
  insertSectionDivider,
  insertTopNavigation,
  saveAsset,
  exportAssets,
  importAssets,
  saveAiSettings,
  rewriteSelectedText,
  exportSlides
};

function boot() {
  initializePanelOrdering();
  bindActions();
  initializeChartEditor();
  initializeSectionDividerBuilder();
  initializeTopNavigationBuilder();
  refreshColorPreview();
  loadAiSettings();
  renderAssets();
  renderCitations();
  setStatus(window.PowerPoint ? "PowerPoint 就绪" : "浏览器预览");
}

if (window.Office) {
  Office.onReady(boot);
} else {
  window.addEventListener("DOMContentLoaded", boot);
}

function bindActions() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = actions[button.dataset.action];
      if (!action) return;
      button.disabled = true;
      try {
        await action();
      } catch (error) {
        console.error(error);
        notify(error.message || String(error), true);
      } finally {
        button.disabled = false;
      }
    });
  });

  $("asset-file").addEventListener("change", handleAssetFile);
  document.querySelectorAll(".swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      $("color-to").value = swatch.dataset.color;
      refreshColorPreview();
    });
  });
  $("color-to").addEventListener("input", refreshColorPreview);
  $("color-scope").addEventListener("change", refreshColorPreview);
  $("chart-type").addEventListener("change", handleChartTypeChange);
  $("export-format").addEventListener("change", refreshExportOptions);
  $("export-range").addEventListener("change", refreshExportOptions);
  $("export-resolution").addEventListener("change", refreshExportOptions);
  $("export-width").addEventListener("input", refreshExportOptions);
  $("export-quality").addEventListener("change", refreshExportOptions);
  ["citation-format", "citation-font", "citation-size", "citation-color"].forEach((id) => {
    $(id).addEventListener("input", refreshCitationOutput);
  });
  $("citation-output").addEventListener("input", () => refreshCitationPreview());
  refreshExportOptions();
}

function initializeSectionDividerBuilder() {
  const builder = $("section-divider-builder");
  if (!builder) return;
  builder.querySelectorAll("[data-section-language]").forEach((button) => {
    button.addEventListener("click", () => setSectionLanguage(button.dataset.sectionLanguage));
  });
  builder.querySelectorAll(".section-template").forEach((button) => {
    button.addEventListener("click", () => {
      currentSectionTemplate = button.dataset.template;
      builder.querySelectorAll(".section-template").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-checked", String(selected));
      });
    });
  });
  builder.querySelectorAll(".section-preset").forEach((button) => {
    button.addEventListener("click", () => {
      applySectionPreset(Number(button.dataset.presetIndex));
    });
  });
  ["section-title", "section-subtitle", "section-number", "section-accent", "section-tone"].forEach((id) => {
    $(id).addEventListener("input", refreshSectionDividerPreview);
    $(id).addEventListener("change", refreshSectionDividerPreview);
  });
  refreshSectionDividerPreview();
}

function setSectionLanguage(language) {
  currentSectionLanguage = language === "en" ? "en" : "zh";
  const builder = $("section-divider-builder");
  builder.querySelectorAll("[data-section-language]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.sectionLanguage === currentSectionLanguage);
  });
  builder.querySelectorAll(".section-preset").forEach((button, index) => {
    button.textContent = SECTION_TITLE_PRESETS[currentSectionLanguage][index][0];
  });
  applySectionPreset(Math.max(0, Number($("section-number").value) - 1));
}

function applySectionPreset(index) {
  const presets = SECTION_TITLE_PRESETS[currentSectionLanguage];
  const safeIndex = Math.min(Math.max(0, index || 0), presets.length - 1);
  $("section-title").value = presets[safeIndex][0];
  $("section-subtitle").value = presets[safeIndex][1];
  $("section-number").value = String(safeIndex + 1).padStart(2, "0");
  refreshSectionDividerPreview();
}

function refreshSectionDividerPreview() {
  const builder = $("section-divider-builder");
  if (!builder) return;
  const palette = sectionDividerPalette();
  builder.style.setProperty("--divider-accent", palette.accent);
  builder.style.setProperty("--divider-bg", palette.background);
  builder.style.setProperty("--divider-ink", palette.ink);
  builder.style.setProperty("--divider-soft", palette.soft);
  builder.style.setProperty("--divider-accent-text", palette.accentText);
  const title = $("section-title").value.trim() || "章节标题";
  const subtitle = $("section-subtitle").value.trim() || "SECTION TITLE";
  const number = $("section-number").value.trim() || "01";
  builder.querySelectorAll(".section-template-preview > b").forEach((node) => {
    node.textContent = title;
  });
  builder.querySelectorAll(".section-template-preview > small").forEach((node) => {
    node.textContent = subtitle.toUpperCase();
  });
  builder.querySelector(".preview-swiss b").textContent = number;
  builder.querySelector(".preview-swiss em").textContent = title;
  builder.querySelector(".preview-journal i").textContent = `CHAPTER ${number}`;
  builder.querySelector(".preview-axis i").textContent = `${number} / 06`;
  builder.querySelector(".preview-focus i").textContent = number;
  builder.querySelector(".preview-index i").textContent = number;
  builder.querySelector(".preview-card strong").textContent = number;
  builder.querySelector(".preview-card > em").textContent = subtitle.toUpperCase();
}

function initializeTopNavigationBuilder() {
  const builder = $("top-nav-builder");
  if (!builder) return;
  builder.querySelectorAll("[data-nav-language]").forEach((button) => {
    button.addEventListener("click", () => setNavigationLanguage(button.dataset.navLanguage));
  });
  builder.querySelectorAll(".nav-template").forEach((button) => {
    button.addEventListener("click", () => {
      currentNavTemplate = button.dataset.navTemplate;
      builder.querySelectorAll(".nav-template").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-checked", String(selected));
      });
    });
  });
  $("nav-labels").addEventListener("input", refreshNavigationControls);
  $("nav-accent").addEventListener("input", refreshNavigationPreview);
  $("nav-active").addEventListener("change", refreshNavigationPreview);
  refreshNavigationControls();
}

function setNavigationLanguage(language) {
  currentNavLanguage = language === "en" ? "en" : "zh";
  const builder = $("top-nav-builder");
  builder.querySelectorAll("[data-nav-language]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.navLanguage === currentNavLanguage);
  });
  $("nav-labels").value = NAVIGATION_PRESETS[currentNavLanguage].join(",");
  refreshNavigationControls();
}

function refreshNavigationControls() {
  const labels = navigationLabels();
  const select = $("nav-active");
  const previous = Math.min(Number(select.value) || 0, labels.length - 1);
  select.replaceChildren(...labels.map((label, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${String(index + 1).padStart(2, "0")} · ${label}`;
    return option;
  }));
  select.value = String(Math.max(0, previous));
  refreshNavigationPreview();
}

function refreshNavigationPreview() {
  const builder = $("top-nav-builder");
  if (!builder) return;
  const accent = normalizeHex($("nav-accent")?.value) || "#195B57";
  const active = Math.max(0, Number($("nav-active")?.value) || 0);
  builder.style.setProperty("--nav-accent", accent);
  builder.style.setProperty("--nav-accent-text", bestTextColor(accent));
  builder.querySelectorAll(".nav-template-preview").forEach((preview) => {
    [...preview.children].forEach((item, index) => item.classList.toggle("active", index === active));
  });
}

function initializePanelOrdering() {
  const main = document.querySelector("main");
  const panels = [...main.children].filter((child) => child.classList.contains("panel"));
  panels.forEach((panel, index) => {
    const heading = [...panel.children].find((child) => child.tagName === "H2");
    const id = panel.dataset.panelId || heading?.textContent.trim() || `panel-${index}`;
    panel.dataset.panelId = id;
    if (!heading || heading.parentElement?.classList.contains("panel-heading")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "panel-heading";
    heading.before(wrapper);
    wrapper.appendChild(heading);

    const controls = document.createElement("div");
    controls.className = "panel-order";
    const up = makeOrderButton("↑", "上移模块", () => movePanel(panel, -1));
    const down = makeOrderButton("↓", "下移模块", () => movePanel(panel, 1));
    controls.append(up, down);
    wrapper.appendChild(controls);
  });

  const stored = JSON.parse(localStorage.getItem(STORE.panelOrder) || "[]");
  const byId = new Map(panels.map((panel) => [panel.dataset.panelId, panel]));
  stored.forEach((id) => {
    const panel = byId.get(id);
    if (panel) main.appendChild(panel);
  });
  panels.forEach((panel) => {
    if (!stored.includes(panel.dataset.panelId)) main.appendChild(panel);
  });
  updateOrderButtons();
}

function makeOrderButton(symbol, label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "order-button";
  button.textContent = symbol;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", handler);
  return button;
}

function movePanel(panel, direction) {
  const main = panel.parentElement;
  const panels = [...main.children].filter((child) => child.classList.contains("panel"));
  const index = panels.indexOf(panel);
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= panels.length) return;
  if (direction < 0) main.insertBefore(panel, panels[targetIndex]);
  else main.insertBefore(panels[targetIndex], panel);
  savePanelOrder();
  updateOrderButtons();
}

function savePanelOrder() {
  const order = [...document.querySelectorAll("main > .panel")]
    .map((panel) => panel.dataset.panelId);
  localStorage.setItem(STORE.panelOrder, JSON.stringify(order));
}

function updateOrderButtons() {
  const panels = [...document.querySelectorAll("main > .panel")];
  panels.forEach((panel, index) => {
    const buttons = panel.querySelectorAll(".order-button");
    if (buttons.length !== 2) return;
    buttons[0].disabled = index === 0;
    buttons[1].disabled = index === panels.length - 1;
  });
}

function setStatus(text) {
  $("office-status").textContent = text;
}

function notify(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function assertOffice() {
  if (!window.PowerPoint || !window.Office) {
    throw new Error("请在 PowerPoint 插件窗格中运行此功能。");
  }
}

async function selectedShapes(context) {
  const shapes = context.presentation.getSelectedShapes();
  const count = shapes.getCount();
  shapes.load("items");
  await context.sync();
  if (count.value === 0) {
    throw new Error("请先选中一个或多个对象。");
  }
  shapes.items.forEach((shape) => shape.load("id,left,top,width,height,type,name"));
  await context.sync();
  return shapes.items;
}

async function copyMetrics() {
  assertOffice();
  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    const metrics = shapes.map(shapeData);
    localStorage.setItem(STORE.metrics, JSON.stringify(metrics));
    notify(`已复制 ${metrics.length} 个对象的位置尺寸`);
  });
}

async function pasteMetrics(options) {
  assertOffice();
  const metrics = JSON.parse(localStorage.getItem(STORE.metrics) || "[]");
  if (!metrics.length) throw new Error("还没有复制过位置尺寸。");

  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    shapes.forEach((shape, index) => {
      const metric = metrics[index % metrics.length];
      if (options.position) {
        shape.left = metric.left;
        shape.top = metric.top;
      }
      if (options.size) {
        shape.width = metric.width;
        shape.height = metric.height;
      }
    });
    await context.sync();
    notify(`已应用到 ${shapes.length} 个对象`);
  });
}

async function arrangeSelected(mode) {
  assertOffice();
  const columns = Math.max(1, intVal("grid-columns", 3));
  const gapX = numVal("grid-gap-x", 12);
  const gapY = numVal("grid-gap-y", 12);
  const targetW = optionalNum("grid-width");
  const targetH = optionalNum("grid-height");

  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    const ordered = [...shapes].sort((a, b) => a.top - b.top || a.left - b.left);
    const anchorLeft = Math.min(...ordered.map((shape) => shape.left));
    const anchorTop = Math.min(...ordered.map((shape) => shape.top));
    const cellW = targetW || Math.max(...ordered.map((shape) => shape.width));
    const cellH = targetH || Math.max(...ordered.map((shape) => shape.height));

    ordered.forEach((shape, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      if (targetW) shape.width = targetW;
      if (targetH) shape.height = targetH;
      shape.left = anchorLeft + col * (cellW + gapX);
      shape.top = mode === "rows" ? anchorTop + row * (cellH + gapY) : anchorTop + row * (cellH + gapY);
    });

    await context.sync();
    notify(`已排列 ${ordered.length} 个对象`);
  });
}

async function alignSelected(kind) {
  assertOffice();
  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    if (shapes.length < 2) throw new Error("至少选中两个对象。");
    const anchor = shapes[0];
    shapes.slice(1).forEach((shape) => {
      if (kind === "left") shape.left = anchor.left;
      if (kind === "top") shape.top = anchor.top;
      if (kind === "center") shape.left = anchor.left + anchor.width / 2 - shape.width / 2;
      if (kind === "middle") shape.top = anchor.top + anchor.height / 2 - shape.height / 2;
    });
    await context.sync();
    notify("已按第一个对象对齐");
  });
}

async function spaceSelected(direction) {
  assertOffice();
  const gap = numVal("spacing-gap", 12);
  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    if (shapes.length < 2) throw new Error("至少选中两个对象。");
    const ordered = [...shapes].sort((a, b) =>
      direction === "horizontal" ? a.left - b.left : a.top - b.top
    );
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      if (direction === "horizontal") current.left = previous.left + previous.width + gap;
      if (direction === "vertical") current.top = previous.top + previous.height + gap;
    }
    await context.sync();
    notify("间距已设置");
  });
}

async function addCaptions() {
  assertOffice();
  const prefix = $("caption-prefix").value.trim() || "Figure";
  const start = intVal("caption-start", 1);
  const fontSize = numVal("caption-size", 9);
  const gap = numVal("caption-gap", 6);

  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = await selectedShapes(context);
    const ordered = [...shapes].sort((a, b) => a.top - b.top || a.left - b.left);
    ordered.forEach((shape, index) => {
      const caption = slide.shapes.addTextBox(`${prefix} ${start + index}`, {
        left: shape.left,
        top: shape.top + shape.height + gap,
        width: shape.width,
        height: Math.max(18, fontSize + 8)
      });
      styleText(caption, { size: fontSize, name: "Arial", align: "Center" });
    });
    await context.sync();
    notify(`已添加 ${ordered.length} 个图注`);
  });
}

async function addLabels() {
  assertOffice();
  const style = $("label-style").value;
  const fontSize = numVal("label-size", 16);
  const offsetX = numVal("label-offset-x", 6);
  const offsetY = numVal("label-offset-y", 6);

  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = await selectedShapes(context);
    const ordered = [...shapes].sort((a, b) => a.top - b.top || a.left - b.left);
    ordered.forEach((shape, index) => {
      const label = slide.shapes.addTextBox(formatLabel(style, index), {
        left: shape.left + offsetX,
        top: shape.top + offsetY,
        width: 42,
        height: 26
      });
      styleText(label, { size: fontSize, name: "Arial", bold: true });
    });
    await context.sync();
    notify(`已添加 ${ordered.length} 个标签`);
  });
}

async function insertMarkdown() {
  assertOffice();
  const markdown = $("markdown-input").value.trim();
  if (!markdown) throw new Error("请先输入 Markdown。");

  const blocks = parseMarkdownLite(markdown);
  const left = numVal("md-left", 48);
  let top = numVal("md-top", 48);
  const width = numVal("md-width", 620);

  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    blocks.forEach((block) => {
      const height = block.height;
      const shape = slide.shapes.addTextBox(block.text, { left, top, width, height });
      if (block.kind === "heading") styleText(shape, { size: block.level === 1 ? 24 : 18, bold: true });
      if (block.kind === "body") styleText(shape, { size: 14 });
      if (block.kind === "quote") styleText(shape, { size: 13, italic: true });
      if (block.kind === "code") {
        shape.fill.setSolidColor(block.dark ? "#17211F" : "#F3F5F4");
        shape.lineFormat.visible = false;
        styleText(shape, { size: 11, name: "Menlo", color: block.dark ? "#FFFFFF" : "#17211F" });
      }
      top += height + 8;
    });
    await context.sync();
    notify(`已插入 ${blocks.length} 个 Markdown 块`);
  });
}

async function insertLatexImage() {
  assertOffice();
  const latex = $("latex-input").value.trim();
  if (!latex) throw new Error("请先输入 LaTeX。");
  const svg = await latexToSvg(latex);
  const pngBase64 = await svgToPngBase64(svg, 4);
  await setSelectedData(pngBase64, Office.CoercionType.Image);
  notify("已插入高清公式");
}

async function checkSelectedContrast() {
  assertOffice();
  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    const textShapes = shapes.filter((shape) => supportsTextFrame(shape.type));
    if (!textShapes.length) throw new Error("请选择文本框、占位符或带文字的形状。");

    textShapes.forEach((shape) => shape.textFrame.load("hasText"));
    await context.sync();

    const withText = textShapes.filter((shape) => shape.textFrame.hasText);
    if (!withText.length) throw new Error("选中形状中没有文字。");
    withText.forEach((shape) => shape.textFrame.textRange.font.load("color"));
    const fillShapes = withText.filter((shape) => supportsFill(shape.type));
    fillShapes.forEach((shape) => shape.fill.load("type"));
    await context.sync();

    const solidFillShapes = fillShapes.filter((shape) =>
      String(shape.fill.type).toLowerCase() === "solid"
    );
    solidFillShapes.forEach((shape) => shape.fill.load("foregroundColor"));
    await context.sync();

    const results = withText.map((shape) => {
      const hasSolidFill = solidFillShapes.includes(shape);
      const background = hasSolidFill
        ? normalizeHex(shape.fill.foregroundColor) || "#FFFFFF"
        : "#FFFFFF";
      const foreground = normalizeHex(shape.textFrame.textRange.font.color) || "#000000";
      const ratio = contrastRatio(foreground, background);
      return {
        name: shape.name || "未命名对象",
        background,
        foreground,
        ratio
      };
    });

    renderContrastResults(results);
  });
}

async function applySelectedColor() {
  assertOffice();
  const to = normalizeHex($("color-to").value);
  const scope = $("color-scope").value;
  const smartTextColor = bestTextColor(to);
  let changes = 0;

  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    if (scope === "fill") {
      shapes.filter((shape) => supportsFill(shape.type)).forEach((shape) => {
        shape.fill.setSolidColor(to);
        changes += 1;
      });
    }
    if (scope === "text") {
      const textShapes = shapes.filter((shape) => supportsTextFrame(shape.type));
      textShapes.forEach((shape) => shape.textFrame.load("hasText"));
      await context.sync();
      textShapes.filter((shape) => shape.textFrame.hasText).forEach((shape) => {
        shape.textFrame.textRange.font.color = to;
        changes += 1;
      });
    }
    if (scope === "smart") {
      const smartShapes = shapes.filter((shape) =>
        supportsFill(shape.type) && supportsTextFrame(shape.type)
      );
      smartShapes.forEach((shape) => shape.textFrame.load("hasText"));
      await context.sync();
      smartShapes.forEach((shape) => {
        shape.fill.setSolidColor(to);
        if (shape.textFrame.hasText) {
          shape.textFrame.textRange.font.color = smartTextColor;
        }
        changes += 1;
      });
    }
    await context.sync();
  });

  const message = scope === "smart"
    ? `已智能配色 ${changes} 个对象，文字使用 ${smartTextColor}`
    : `已应用到 ${changes} 处`;
  notify(changes ? message : "选中对象不支持当前颜色范围");
}

async function fixSelectedContrast() {
  assertOffice();
  let inspected = 0;
  let fixed = 0;

  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    const candidates = shapes.filter((shape) =>
      supportsFill(shape.type) && supportsTextFrame(shape.type)
    );
    candidates.forEach((shape) => {
      shape.textFrame.load("hasText");
      shape.fill.load("type");
    });
    await context.sync();

    const withSolidText = candidates.filter((shape) =>
      shape.textFrame.hasText && String(shape.fill.type).toLowerCase() === "solid"
    );
    withSolidText.forEach((shape) => {
      shape.fill.load("foregroundColor");
      shape.textFrame.textRange.font.load("color");
    });
    await context.sync();

    withSolidText.forEach((shape) => {
      const background = normalizeHex(shape.fill.foregroundColor);
      const foreground = normalizeHex(shape.textFrame.textRange.font.color);
      if (!background) return;
      inspected += 1;
      if (!foreground || contrastRatio(foreground, background) < 4.5) {
        shape.textFrame.textRange.font.color = bestTextColor(background);
        fixed += 1;
      }
    });
    await context.sync();
  });

  if (!inspected) throw new Error("请选择带文字且使用纯色填充的文本框或形状。");
  notify(fixed ? `已修复 ${fixed}/${inspected} 个对象` : `${inspected} 个对象均已达到 AA`);
}

async function insertCsvChart() {
  assertOffice();
  const svg = buildCsvChartSvg();
  const pngBase64 = await svgToPngBase64(svg, 2, "#FFFFFF");
  await setSelectedData(pngBase64, Office.CoercionType.Image);
  notify("已插入高清科研图");
}

function downloadCsvChartSvg() {
  const svg = buildCsvChartSvg();
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `slidesci-chart-${dateStamp()}.svg`);
  notify("SVG 已下载");
}

async function lookupDoi() {
  const doi = cleanDoi($("doi-input").value);
  if (!doi) throw new Error("请输入 DOI。");
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (!response.ok) throw new Error(`DOI 查询失败：${response.status}`);
  const item = (await response.json()).message;
  currentCitation = crossrefToCitation(item, doi);
  refreshCitationOutput();
  notify("已获取引用信息");
}

async function insertCitation() {
  assertOffice();
  const text = $("citation-output").value.trim();
  if (!text) throw new Error("请先查询 DOI 或输入引用文本。");
  const format = $("citation-format").value;
  const formatted = currentCitation ? formatCitation(currentCitation, format) : null;
  const fontName = $("citation-font").value;
  const fontSize = numVal("citation-size", 8);
  const color = $("citation-color").value;
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shape = slide.shapes.addTextBox(text, {
      left: numVal("citation-left", 36),
      top: numVal("citation-top", 500),
      width: numVal("citation-width", 648),
      height: Math.max(24, fontSize * 3)
    });
    styleText(shape, { size: fontSize, name: fontName, color });
    await context.sync();
    if (formatted && formatted.text === text) {
      formatted.styles.forEach((style) => {
        if (style.length <= 0) return;
        const range = shape.textFrame.textRange.getSubstring(style.start, style.length);
        if (style.bold) range.font.bold = true;
        if (style.italic) range.font.italic = true;
      });
    }
    await context.sync();
  });
  notify("引用已插入当前页");
}

function saveCitation() {
  const text = $("citation-output").value.trim();
  if (!text) throw new Error("请先查询 DOI 或输入引用文本。");
  const doi = currentCitation?.doi || cleanDoi($("doi-input").value) || `manual-${Date.now()}`;
  const citations = readCitations();
  const existing = citations.find((item) => item.doi.toLowerCase() === doi.toLowerCase());
  if (existing) {
    notify("引用库中已存在该 DOI");
    return;
  }
  citations.unshift({
    doi,
    text,
    title: currentCitation?.title || text,
    citation: currentCitation
  });
  localStorage.setItem(STORE.citations, JSON.stringify(citations.slice(0, 100)));
  renderCitations();
  notify("已加入引用库");
}

async function insertSectionDivider() {
  assertOffice();
  const title = $("section-title").value.trim() || "章节标题";
  const subtitle = $("section-subtitle").value.trim() || "SECTION TITLE";
  const number = $("section-number").value.trim() || "01";
  const palette = sectionDividerPalette();

  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const helpers = sectionShapeHelpers(slide);
    const template = SECTION_DIVIDER_TEMPLATES[currentSectionTemplate] || SECTION_DIVIDER_TEMPLATES.swiss;
    template({ title, subtitle, number, palette, ...helpers });
    await context.sync();
  });
  notify(`已插入章节过渡：${title}`);
}

const SECTION_DIVIDER_TEMPLATES = {
  swiss({ title, subtitle, number, palette, rect, text }) {
    rect(0, 0, 960, 540, palette.background);
    rect(0, 0, 132, 540, palette.accent);
    text(number, 34, 210, 72, 86, { size: 48, bold: true, color: palette.accentText, align: "Center" });
    text("SECTION", 35, 300, 70, 22, { size: 9, bold: true, color: palette.accentText, align: "Center" });
    rect(185, 190, 44, 6, palette.accent);
    text(title, 184, 215, 680, 82, { size: 38, bold: true, color: palette.ink });
    text(subtitle.toUpperCase(), 188, 306, 620, 28, { size: 12, bold: true, color: palette.muted });
    text("SLIDESCI · RESEARCH PRESENTATION", 732, 488, 176, 18, { size: 7, color: palette.muted, align: "Right" });
  },
  journal({ title, subtitle, number, palette, rect, text }) {
    rect(0, 0, 960, 540, palette.background);
    text(`CHAPTER ${number}`, 72, 62, 220, 24, { size: 11, bold: true, color: palette.accent });
    rect(72, 104, 816, 2, palette.softLine);
    rect(0, 176, 960, 172, palette.accent);
    text(title, 72, 208, 816, 66, { size: 38, bold: true, color: palette.accentText });
    text(subtitle.toUpperCase(), 75, 285, 810, 28, { size: 12, bold: true, color: palette.accentText });
    text("RESEARCH REPORT", 72, 448, 210, 18, { size: 8, bold: true, color: palette.muted });
    text(`${number}  /  06`, 760, 439, 128, 28, { size: 13, bold: true, color: palette.ink, align: "Right" });
  },
  axis({ title, subtitle, number, palette, rect, text }) {
    rect(0, 0, 960, 540, palette.background);
    text(`${number} / 06`, 76, 72, 150, 22, { size: 10, bold: true, color: palette.accent });
    text(title, 76, 176, 760, 72, { size: 40, bold: true, color: palette.ink });
    rect(76, 276, 808, 2, palette.softLine);
    rect(76, 268, 18, 18, palette.accent);
    text(subtitle.toUpperCase(), 112, 300, 600, 24, { size: 11, bold: true, color: palette.muted });
    rect(76, 428, 70, 5, palette.accent);
    text("FROM QUESTION TO EVIDENCE", 160, 420, 260, 20, { size: 8, color: palette.muted });
  },
  focus({ title, subtitle, number, palette, rect, text }) {
    const dark = palette.isDark ? palette.background : "#142622";
    rect(0, 0, 960, 540, dark);
    rect(0, 0, 16, 540, palette.accent);
    rect(794, 0, 166, 14, palette.accent);
    text(number, 74, 70, 180, 80, { size: 50, bold: true, color: palette.accent });
    text("CHAPTER", 77, 146, 160, 22, { size: 9, bold: true, color: "#B8C8C4" });
    text(title, 74, 218, 790, 78, { size: 42, bold: true, color: "#FFFFFF" });
    text(subtitle.toUpperCase(), 78, 310, 720, 28, { size: 12, bold: true, color: "#B8C8C4" });
    rect(78, 394, 58, 5, palette.accent);
    text("RESEARCH PRESENTATION", 712, 475, 176, 18, { size: 7, color: "#B8C8C4", align: "Right" });
  },
  index({ title, subtitle, number, palette, rect, text }) {
    rect(0, 0, 960, 540, palette.background);
    rect(0, 0, 224, 540, palette.accent);
    text(number, 48, 180, 128, 92, { size: 54, bold: true, color: palette.accentText, align: "Center" });
    rect(66, 292, 92, 2, palette.accentText);
    text("CHAPTER", 60, 310, 104, 20, { size: 9, bold: true, color: palette.accentText, align: "Center" });
    text(title, 292, 204, 580, 76, { size: 40, bold: true, color: palette.ink });
    text(subtitle.toUpperCase(), 296, 297, 520, 26, { size: 11, bold: true, color: palette.muted });
    text("01   02   03   04   05   06", 294, 432, 360, 20, { size: 8, color: palette.muted });
    rect(337, 457, 32, 4, palette.accent);
  },
  card({ title, subtitle, number, palette, rect, text }) {
    rect(0, 0, 960, 540, palette.background);
    text("RESEARCH REPORT", 72, 62, 220, 20, { size: 9, bold: true, color: palette.muted });
    rect(72, 106, 816, 2, palette.softLine);
    rect(86, 150, 204, 248, palette.accent);
    text(number, 112, 202, 152, 82, { size: 50, bold: true, color: palette.accentText, align: "Center" });
    text("CHAPTER", 116, 300, 144, 22, { size: 9, bold: true, color: palette.accentText, align: "Center" });
    text(title, 352, 210, 500, 70, { size: 38, bold: true, color: palette.ink });
    text(subtitle.toUpperCase(), 356, 302, 480, 26, { size: 11, bold: true, color: palette.muted });
    rect(356, 350, 64, 5, palette.accent);
    text("A STRUCTURED SCIENTIFIC STORY", 356, 371, 310, 20, { size: 8, color: palette.muted });
  }
};

function sectionShapeHelpers(slide) {
  return {
    rect(left, top, width, height, color) {
      const shape = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, {
        left, top, width, height
      });
      shape.fill.setSolidColor(color);
      shape.lineFormat.visible = false;
      return shape;
    },
    text(value, left, top, width, height, options) {
      const shape = slide.shapes.addTextBox(value, { left, top, width, height });
      styleText(shape, { name: "Arial", ...options });
      return shape;
    }
  };
}

function sectionDividerPalette() {
  const accent = normalizeHex($("section-accent")?.value) || "#195B57";
  const tone = $("section-tone")?.value || "light";
  if (tone === "dark") {
    return {
      accent,
      background: "#14211F",
      ink: "#FFFFFF",
      muted: "#B7C4C1",
      soft: interpolateColor(accent, "#14211F", 0.72),
      softLine: "#3A4845",
      accentText: bestTextColor(accent),
      isDark: true
    };
  }
  const background = tone === "warm" ? "#F4F0E8" : "#FFFFFF";
  return {
    accent,
    background,
    ink: "#17211F",
    muted: "#66716E",
    soft: interpolateColor(accent, background, 0.84),
    softLine: tone === "warm" ? "#D9D2C5" : "#DCE3E0",
    accentText: bestTextColor(accent),
    isDark: false
  };
}

async function insertTopNavigation() {
  assertOffice();
  const labels = navigationLabels();
  const active = Math.min(Math.max(0, Number($("nav-active").value) || 0), labels.length - 1);
  const accent = normalizeHex($("nav-accent").value) || "#195B57";
  const position = $("nav-position").value;
  const numbered = $("nav-numbered").value === "yes";
  const top = position === "bottom" ? 482 : 22;

  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const helpers = navigationShapeHelpers(slide);
    const template = TOP_NAVIGATION_TEMPLATES[currentNavTemplate] || TOP_NAVIGATION_TEMPLATES.orbit;
    template({
      labels,
      active,
      accent,
      accentText: bestTextColor(accent),
      numbered,
      top,
      ...helpers
    });
    await context.sync();
  });
  notify(`已插入导航栏：${labels[active]}`);
}

const TOP_NAVIGATION_TEMPLATES = {
  orbit({ labels, active, accent, accentText, numbered, top, rect, text }) {
    const left = 70;
    const width = 820;
    const gap = 7;
    const itemWidth = (width - gap * (labels.length - 1)) / labels.length;
    rect(left, top + 15, width, 2, "#DDE5E2");
    labels.forEach((label, index) => {
      const x = left + index * (itemWidth + gap);
      const selected = index === active;
      if (selected) {
        rect(x, top, itemWidth, 32, accent);
        rect(x + itemWidth / 2 - 3, top + 37, 6, 6, accent);
      } else {
        rect(x, top + 3, itemWidth, 26, "#F1F5F3");
      }
      text(navigationItemText(label, index, numbered), x + 4, top + 7, itemWidth - 8, 18, {
        size: selected ? 10 : 9,
        bold: selected,
        color: selected ? accentText : "#68736F",
        align: "Center"
      });
    });
  },
  molecule({ labels, active, accent, accentText, numbered, top, rect, circle, text }) {
    const left = 82;
    const width = 796;
    const step = width / Math.max(1, labels.length - 1);
    rect(left, top + 15, width, 2, "#CBD7D3");
    labels.forEach((label, index) => {
      const center = left + index * step;
      const selected = index === active;
      const nodeSize = selected ? 28 : 14;
      circle(center - nodeSize / 2, top + 16 - nodeSize / 2, nodeSize, selected ? accent : "#FFFFFF");
      if (!selected) {
        circle(center - 5, top + 11, 10, "#D9E4E0");
      }
      text(numbered ? String(index + 1).padStart(2, "0") : "•", center - 18, top + 7, 36, 18, {
        size: selected ? 9 : 7,
        bold: true,
        color: selected ? accentText : "#71807B",
        align: "Center"
      });
      text(label, center - 54, top + 36, 108, 18, {
        size: selected ? 9 : 8,
        bold: selected,
        color: selected ? accent : "#68736F",
        align: "Center"
      });
    });
  },
  editorial({ labels, active, accent, accentText, numbered, top, rect, text }) {
    const left = 58;
    const width = 844;
    const itemWidth = width / labels.length;
    rect(left, top + 36, width, 2, "#C9D3D0");
    labels.forEach((label, index) => {
      const x = left + index * itemWidth;
      const selected = index === active;
      if (selected) {
        rect(x + 5, top, itemWidth - 10, 31, accent);
        rect(x + itemWidth / 2 - 7, top + 31, 14, 7, accent);
      } else {
        rect(x + 5, top + 29, itemWidth - 10, 3, index < active ? accent : "#C9D3D0");
      }
      text(navigationItemText(label, index, numbered), x + 8, top + 8, itemWidth - 16, 17, {
        size: 9,
        bold: selected,
        color: selected ? accentText : index < active ? accent : "#6F7976",
        align: "Center"
      });
    });
  },
  steps({ labels, active, accent, accentText, numbered, top, rect, text }) {
    const left = 54;
    const width = 852;
    const overlap = 12;
    const itemWidth = (width + overlap * (labels.length - 1)) / labels.length;
    labels.forEach((label, index) => {
      const x = left + index * (itemWidth - overlap);
      const selected = index === active;
      const completed = index < active;
      const fill = selected ? accent : completed ? interpolateColor(accent, "#FFFFFF", 0.42) : "#EDF2F0";
      rect(x, top, itemWidth, 34, fill);
      rect(x + itemWidth - 12, top + 5, 12, 24, selected ? accent : completed ? interpolateColor(accent, "#FFFFFF", 0.42) : "#EDF2F0");
      text(navigationItemText(label, index, numbered), x + 8, top + 9, itemWidth - 22, 17, {
        size: 9,
        bold: selected,
        color: selected ? accentText : completed ? "#315C53" : "#6C7673",
        align: "Center"
      });
      if (index < labels.length - 1) rect(x + itemWidth - 4, top + 13, 8, 8, "#FFFFFF");
    });
  },
  scale({ labels, active, accent, numbered, top, rect, text }) {
    const left = 68;
    const width = 824;
    const itemWidth = width / labels.length;
    rect(left, top + 35, width, 2, "#BCC8C4");
    labels.forEach((label, index) => {
      const x = left + index * itemWidth;
      const selected = index === active;
      rect(x + itemWidth / 2 - 1, top + 30, 2, selected ? 13 : 8, selected ? accent : "#BCC8C4");
      if (selected) {
        rect(x + 16, top, itemWidth - 32, 26, "#FFFFFF");
        rect(x + 16, top, 5, 26, accent);
      }
      text(navigationItemText(label, index, numbered), x + 4, top + 6, itemWidth - 8, 16, {
        size: selected ? 10 : 8,
        bold: selected,
        color: selected ? accent : "#707A77",
        align: "Center"
      });
    });
    text("PROGRESS", left, top + 44, 86, 14, { size: 6, bold: true, color: "#87918E" });
    text(`${String(active + 1).padStart(2, "0")} / ${String(labels.length).padStart(2, "0")}`, left + width - 86, top + 44, 86, 14, {
      size: 7, bold: true, color: accent, align: "Right"
    });
  },
  cursor({ labels, active, accent, accentText, numbered, top, rect, text }) {
    const left = 64;
    const width = 832;
    const gap = 4;
    const itemWidth = (width - gap * (labels.length - 1)) / labels.length;
    rect(left, top, width, 4, accent);
    labels.forEach((label, index) => {
      const x = left + index * (itemWidth + gap);
      const selected = index === active;
      if (selected) {
        rect(x + 5, top, itemWidth - 10, 41, "#FFFFFF");
        rect(x + 5, top, 5, 41, accent);
        rect(x + 18, top + 35, itemWidth - 36, 4, accent);
      } else {
        rect(x + 5, top + 4, itemWidth - 10, 31, "#F5F7F6");
      }
      text(navigationItemText(label, index, numbered), x + 9, top + 12, itemWidth - 18, 17, {
        size: selected ? 10 : 8,
        bold: selected,
        color: selected ? accent : "#6C7673",
        align: "Center"
      });
      if (selected) {
        rect(x + itemWidth - 42, top + 1, 34, 10, accent);
        text("ACTIVE", x + itemWidth - 43, top + 2, 35, 10, {
          size: 5, bold: true, color: accentText, align: "Center"
        });
      }
    });
  }
};

function navigationShapeHelpers(slide) {
  return {
    rect(left, top, width, height, color) {
      const shape = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, {
        left, top, width, height
      });
      shape.fill.setSolidColor(color);
      shape.lineFormat.visible = false;
      return shape;
    },
    circle(left, top, size, color) {
      const shape = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.ellipse, {
        left, top, width: size, height: size
      });
      shape.fill.setSolidColor(color);
      shape.lineFormat.visible = false;
      return shape;
    },
    text(value, left, top, width, height, options) {
      const shape = slide.shapes.addTextBox(value, { left, top, width, height });
      styleText(shape, { name: "Arial", ...options });
      return shape;
    }
  };
}

function navigationLabels() {
  const labels = ($("nav-labels")?.value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  return labels.length >= 2 ? labels : ["研究背景", "研究目的", "研究内容", "研究方法", "结果讨论", "总结展望"];
}

function navigationItemText(label, index, numbered) {
  return numbered ? `${String(index + 1).padStart(2, "0")}  ${label}` : label;
}

async function saveAsset() {
  assertOffice();
  const name = $("asset-name").value.trim() || "未命名素材";
  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    await tryLoadText(context, shapes);
    const assets = readAssets();
    assets.unshift({
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      shapes: shapes.map((shape) => ({
        ...shapeData(shape),
        text: safeShapeText(shape)
      }))
    });
    localStorage.setItem(STORE.assets, JSON.stringify(assets.slice(0, 60)));
    renderAssets();
    notify(`已保存素材：${name}`);
  });
}

async function insertAsset(assetId) {
  assertOffice();
  const asset = readAssets().find((item) => item.id === assetId);
  if (!asset) return;
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const minLeft = Math.min(...asset.shapes.map((shape) => shape.left));
    const minTop = Math.min(...asset.shapes.map((shape) => shape.top));
    asset.shapes.forEach((source) => {
      const options = {
        left: 48 + source.left - minLeft,
        top: 48 + source.top - minTop,
        width: source.width,
        height: source.height
      };
      if (source.text) {
        const copy = slide.shapes.addTextBox(source.text, options);
        styleText(copy, { size: 13 });
      } else {
        const copy = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, options);
        copy.fill.setSolidColor("#EEF2F0");
        copy.lineFormat.color = "#195B57";
      }
    });
    await context.sync();
    notify(`已插入素材：${asset.name}`);
  });
}

function exportAssets() {
  const filename = `slidesci-assets-${dateStamp()}.json`;
  const blob = new Blob([JSON.stringify(readAssets(), null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
  localStorage.setItem(STORE.assetExport, JSON.stringify({
    filename,
    exportedAt: new Date().toISOString(),
    count: readAssets().length
  }));
  renderAssetExportSummary();
  notify(`已导出到系统下载文件夹：${filename}`);
}

function importAssets() {
  $("asset-file").click();
}

async function handleAssetFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const incoming = JSON.parse(await file.text());
  if (!Array.isArray(incoming)) throw new Error("素材文件格式不正确。");
  const merged = [...incoming, ...readAssets()].slice(0, 100);
  localStorage.setItem(STORE.assets, JSON.stringify(merged));
  renderAssets();
  event.target.value = "";
  notify(`已导入 ${incoming.length} 个素材`);
}

function renderAssets() {
  const list = $("asset-list");
  if (!list) return;
  const assets = readAssets();
  $("asset-count").textContent = String(assets.length);
  $("asset-shape-count").textContent = String(assets.reduce((sum, asset) => sum + (asset.shapes?.length || 0), 0));
  list.innerHTML = assets.length ? "" : "<p class=\"muted\">还没有保存素材。</p>";
  assets.forEach((asset) => {
    const item = document.createElement("div");
    item.className = "asset-item";
    const preview = createAssetPreview(asset);
    const body = document.createElement("div");
    body.className = "asset-item-body";

    const title = document.createElement("div");
    title.className = "asset-item-title";
    const name = document.createElement("strong");
    name.textContent = asset.name;
    const created = document.createElement("time");
    created.textContent = formatAssetDate(asset.createdAt);
    title.append(name, created);

    const meta = document.createElement("div");
    meta.className = "asset-item-meta";
    const shapeCount = document.createElement("span");
    shapeCount.className = "asset-badge";
    shapeCount.textContent = `${asset.shapes?.length || 0} 个对象`;
    const textCount = (asset.shapes || []).filter((shape) => shape.text).length;
    meta.append(shapeCount);
    if (textCount) {
      const textBadge = document.createElement("span");
      textBadge.className = "asset-badge";
      textBadge.textContent = `${textCount} 个文本`;
      meta.append(textBadge);
    }

    const actionRow = document.createElement("div");
    actionRow.className = "asset-item-actions";
    const insert = document.createElement("button");
    insert.textContent = "插入";
    insert.addEventListener("click", () => insertAsset(asset.id));
    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.textContent = "删除";
    remove.addEventListener("click", () => {
      localStorage.setItem(STORE.assets, JSON.stringify(readAssets().filter((x) => x.id !== asset.id)));
      renderAssets();
    });
    actionRow.append(insert, remove);
    body.append(title, meta, actionRow);
    item.append(preview, body);
    list.appendChild(item);
  });
  renderAssetExportSummary();
}

function createAssetPreview(asset) {
  const preview = document.createElement("div");
  preview.className = "asset-preview";
  preview.setAttribute("aria-label", `${asset.name} 缩略图`);
  const shapes = (asset.shapes || []).filter((shape) =>
    [shape.left, shape.top, shape.width, shape.height].every(Number.isFinite)
  );
  if (!shapes.length) return preview;

  const minLeft = Math.min(...shapes.map((shape) => shape.left));
  const minTop = Math.min(...shapes.map((shape) => shape.top));
  const maxRight = Math.max(...shapes.map((shape) => shape.left + shape.width));
  const maxBottom = Math.max(...shapes.map((shape) => shape.top + shape.height));
  const width = Math.max(1, maxRight - minLeft);
  const height = Math.max(1, maxBottom - minTop);

  shapes.slice(0, 24).forEach((shape) => {
    const node = document.createElement("span");
    node.className = `asset-preview-shape${shape.text ? " has-text" : ""}`;
    node.style.left = `${4 + ((shape.left - minLeft) / width) * 90}%`;
    node.style.top = `${5 + ((shape.top - minTop) / height) * 86}%`;
    node.style.width = `${Math.max(5, (shape.width / width) * 90)}%`;
    node.style.height = `${Math.max(7, (shape.height / height) * 86)}%`;
    if (shape.text) node.textContent = shape.text.slice(0, 18);
    preview.appendChild(node);
  });
  return preview;
}

function renderAssetExportSummary() {
  const card = document.querySelector(".asset-export-card");
  if (!card) return;
  const record = JSON.parse(localStorage.getItem(STORE.assetExport) || "null");
  const filename = record?.filename || `slidesci-assets-${dateStamp()}.json`;
  $("asset-export-filename").textContent = filename;
  if (!record) {
    card.classList.remove("exported");
    $("asset-export-title").textContent = "系统“下载”文件夹";
    $("asset-export-detail").textContent = "导出后可在 Finder → 下载中找到";
    return;
  }
  card.classList.add("exported");
  $("asset-export-title").textContent = "已发送到系统“下载”文件夹";
  $("asset-export-detail").textContent =
    `${formatAssetDate(record.exportedAt, true)} · ${record.count || 0} 个素材`;
}

function formatAssetDate(value, includeTime = false) {
  if (!value) return "日期未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(date);
}

function renderContrastResults(results) {
  const container = $("contrast-results");
  const withText = results.filter((item) => item.ratio !== null);
  if (!withText.length) {
    container.className = "result-box muted";
    container.textContent = "选中对象中没有可检查的文字。";
    return;
  }
  const failures = withText.filter((item) => item.ratio < 4.5);
  container.className = "result-box";
  container.innerHTML = "";
  const summary = document.createElement("strong");
  summary.textContent = failures.length
    ? `${failures.length}/${withText.length} 个对象对比度不足`
    : `${withText.length} 个对象全部通过`;
  container.appendChild(summary);
  withText.forEach((item) => {
    const line = document.createElement("div");
    const grade = item.ratio >= 7 ? "AAA" : item.ratio >= 4.5 ? "AA" : "不通过";
    line.textContent = `${item.name}: ${item.ratio.toFixed(2)}:1 (${grade})`;
    container.appendChild(line);
  });
}

function refreshColorPreview() {
  const background = normalizeHex($("color-to")?.value) || "#0072B2";
  const scope = $("color-scope")?.value || "smart";
  const preview = $("color-preview");
  const sample = preview?.querySelector(".color-preview-sample");
  const meta = $("color-preview-meta");
  if (!preview || !sample || !meta) return;

  if (scope === "smart") {
    const foreground = bestTextColor(background);
    const ratio = contrastRatio(foreground, background);
    sample.style.background = background;
    sample.style.color = foreground;
    meta.textContent = `自动文字 ${foreground} · ${ratio.toFixed(2)}:1 · ${contrastGrade(ratio)}`;
  } else if (scope === "fill") {
    sample.style.background = background;
    sample.style.color = bestTextColor(background);
    meta.textContent = "仅修改填充色，保留原文字色";
  } else {
    sample.style.background = "#FFFFFF";
    sample.style.color = background;
    const ratio = contrastRatio(background, "#FFFFFF");
    meta.textContent = `白底预览 · ${ratio.toFixed(2)}:1 · ${contrastGrade(ratio)}`;
  }
}

function initializeChartEditor() {
  currentChartType = $("chart-type").value;
  const initial = parseCsv($("chart-csv").value.trim());
  chartDrafts[currentChartType] = initial;
  renderChartDataTable(initial);
  updateChartFormatGuide();
}

function handleChartTypeChange() {
  chartDrafts[currentChartType] = readChartDataTable();
  currentChartType = $("chart-type").value;
  const next = chartDrafts[currentChartType] || cloneTable(CHART_TEMPLATES[currentChartType].example);
  renderChartDataTable(next);
  syncChartTableToCsv();
  updateChartFormatGuide();
}

function updateChartFormatGuide() {
  const template = CHART_TEMPLATES[$("chart-type").value];
  $("chart-format-guide").innerHTML = `<strong>格式指引</strong>${escapeHtml(template.guide)}`;
  $("chart-add-series").hidden = !template.addSeries;
  const isReplicateBar = $("chart-type").value === "replicatebar";
  $("chart-bar-color-field").hidden = !isReplicateBar;
  $("chart-gradient-field").hidden = !isReplicateBar;
  if (isReplicateBar) {
    $("chart-show-legend").checked = false;
    if ($("chart-x-label").value === "X") $("chart-x-label").value = "Group";
    if ($("chart-y-label").value === "Y") $("chart-y-label").value = "Mean";
  } else {
    if ($("chart-x-label").value === "Group") $("chart-x-label").value = "X";
    if ($("chart-y-label").value === "Mean") $("chart-y-label").value = "Y";
  }
}

function renderChartDataTable(data) {
  const tableData = normalizeChartTable(data);
  const container = $("chart-data-table");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const minColumns = minimumChartColumns();

  tableData[0].forEach((value, columnIndex) => {
    const th = document.createElement("th");
    const wrapper = document.createElement("div");
    wrapper.className = "chart-header-cell";
    wrapper.appendChild(makeChartCellInput(value, 0, columnIndex));
    if (columnIndex >= minColumns && tableData[0].length > minColumns) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "chart-cell-remove";
      remove.textContent = "×";
      remove.title = "删除此列";
      remove.addEventListener("click", () => removeChartColumn(columnIndex));
      wrapper.appendChild(remove);
    }
    th.appendChild(wrapper);
    headerRow.appendChild(th);
  });
  const controlHead = document.createElement("th");
  controlHead.className = "chart-control-column";
  headerRow.appendChild(controlHead);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tableData.slice(1).forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    tableData[0].forEach((_, columnIndex) => {
      const td = document.createElement("td");
      td.appendChild(makeChartCellInput(row[columnIndex] || "", rowIndex + 1, columnIndex));
      tr.appendChild(td);
    });
    const control = document.createElement("td");
    control.className = "chart-control-column";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "chart-row-remove";
    remove.textContent = "×";
    remove.title = "删除此行";
    remove.addEventListener("click", () => removeChartRow(rowIndex + 1));
    control.appendChild(remove);
    tr.appendChild(control);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.replaceChildren(table);
  updateChartTableSize(tableData);
}

function makeChartCellInput(value, row, column) {
  const input = document.createElement("input");
  input.value = value;
  input.dataset.row = row;
  input.dataset.column = column;
  input.setAttribute("aria-label", `${row === 0 ? "列名" : `第 ${row} 行`} ${column + 1}`);
  input.addEventListener("input", syncChartTableToCsv);
  return input;
}

function readChartDataTable() {
  const table = $("chart-data-table").querySelector("table");
  if (!table) return [];
  return [...table.rows].map((row) =>
    [...row.querySelectorAll("th:not(.chart-control-column), td:not(.chart-control-column)")]
      .map((cell) => cell.querySelector("input")?.value.trim() || "")
  );
}

function syncChartTableToCsv() {
  const data = readChartDataTable();
  chartDrafts[currentChartType] = data;
  $("chart-csv").value = data.map((row) => row.map(csvField).join(",")).join("\n");
  updateChartTableSize(data);
}

function loadCsvIntoChartTable() {
  const data = parseCsv($("chart-csv").value.trim());
  if (data.length < 2 || data[0].length < minimumChartColumns()) {
    throw new Error("CSV 的行数或列数不符合当前图类型。");
  }
  renderChartDataTable(data);
  syncChartTableToCsv();
  notify("CSV 已载入固定表格");
}

function addChartRow() {
  const data = readChartDataTable();
  data.push(Array(data[0].length).fill(""));
  renderChartDataTable(data);
  syncChartTableToCsv();
  const inputs = $("chart-data-table").querySelectorAll("tbody tr:last-child input");
  inputs[0]?.focus();
}

function addChartSeries() {
  const template = CHART_TEMPLATES[$("chart-type").value];
  if (!template.addSeries) return;
  const data = readChartDataTable();
  const label = $("chart-type").value === "heatmap"
    ? `Sample ${data[0].length}`
    : `Series ${data[0].length}`;
  data.forEach((row, index) => row.push(index === 0 ? label : ""));
  renderChartDataTable(data);
  syncChartTableToCsv();
}

function resetChartTemplate() {
  const data = cloneTable(CHART_TEMPLATES[$("chart-type").value].example);
  renderChartDataTable(data);
  syncChartTableToCsv();
  notify("已载入当前图类型示例");
}

function removeChartRow(rowIndex) {
  const data = readChartDataTable();
  if (data.length <= 2) return;
  data.splice(rowIndex, 1);
  renderChartDataTable(data);
  syncChartTableToCsv();
}

function removeChartColumn(columnIndex) {
  const data = readChartDataTable();
  data.forEach((row) => row.splice(columnIndex, 1));
  renderChartDataTable(data);
  syncChartTableToCsv();
}

function normalizeChartTable(data) {
  const fallback = cloneTable(CHART_TEMPLATES[$("chart-type").value].example);
  if (!data?.length) return fallback;
  const width = Math.max(minimumChartColumns(), ...data.map((row) => row.length));
  const normalized = data.map((row) =>
    Array.from({ length: width }, (_, index) => row[index] ?? "")
  );
  if (normalized.length === 1) normalized.push(Array(width).fill(""));
  return normalized;
}

function minimumChartColumns() {
  if ($("chart-type").value === "errorbar") return 3;
  return 2;
}

function updateChartTableSize(data) {
  if (!data?.length) return;
  $("chart-table-size").textContent = `${Math.max(0, data.length - 1)} 行 × ${data[0].length} 列`;
}

function cloneTable(data) {
  return data.map((row) => [...row]);
}

function csvField(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function buildCsvChartSvg() {
  const table = parseCsv($("chart-csv").value.trim());
  if (table.length < 2 || table[0].length < 2) {
    throw new Error("CSV 至少需要一列 X 和一列 Y。");
  }
  const type = $("chart-type").value;
  if (type === "heatmap") return buildHeatmapSvg(table);
  if (type === "box") return buildBoxPlotSvg(table);
  if (type === "replicatebar") return buildReplicateBarSvg(table);

  const headers = table[0];
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) throw new Error("请至少填写一行数据。");
  const isErrorBar = type === "errorbar";
  if (isErrorBar && headers.length < 3) throw new Error("误差图需要 X、均值、误差 3 列。");

  const numericX = rows.every((row) => Number.isFinite(numericCell(row[0])));
  const xValues = rows.map((row, index) =>
    numericX && type !== "bar" && type !== "errorbar" ? numericCell(row[0]) : index
  );
  const seriesHeaders = isErrorBar ? headers.slice(1, 2) : headers.slice(1);
  const series = seriesHeaders.map((name, seriesIndex) => ({
    name: name || `Series ${seriesIndex + 1}`,
    values: rows.map((row) => numericCell(row[seriesIndex + 1]))
  }));
  if (!series.length || series.some((item) => item.values.some((value) => !Number.isFinite(value)))) {
    throw new Error("Y 数据必须全部是数字。");
  }
  const errors = isErrorBar ? rows.map((row) => numericCell(row[2])) : [];
  if (errors.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("误差列必须全部是非负数字。");
  }

  const width = 1200;
  const height = 700;
  const margin = { left: 105, right: 45, top: 92, bottom: 95 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const allY = isErrorBar
    ? series[0].values.flatMap((value, index) => [value - errors[index], value + errors[index]])
    : series.flatMap((item) => item.values);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  if (type === "bar" || type === "area") {
    minY = Math.min(0, minY);
    maxY = Math.max(0, maxY);
  }
  const yPad = Math.max((maxY - minY) * 0.08, Math.abs(maxY || 1) * 0.04);
  minY -= yPad;
  maxY += yPad;
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xScale = (value) => minX === maxX
    ? margin.left + plotW / 2
    : margin.left + ((value - minX) / (maxX - minX)) * plotW;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const colors = chartPalette($("chart-palette").value);
  const showGrid = $("chart-show-grid").checked;
  const showLegend = $("chart-show-legend").checked;
  const showLabels = $("chart-show-labels").checked;

  const yTicks = Array.from({ length: 6 }, (_, index) => minY + ((maxY - minY) * index) / 5);
  const grid = yTicks.map((value) => {
    const y = yScale(value);
    return `${showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DADFDA" stroke-width="1"/>` : ""}
      <text x="${margin.left - 16}" y="${y + 6}" text-anchor="end" font-size="22" fill="#4F5855">${formatTick(value)}</text>`;
  }).join("");

  let marks = "";
  if (type === "bar") {
    const groupWidth = plotW / Math.max(rows.length, 1);
    const barWidth = Math.min(54, (groupWidth * 0.72) / series.length);
    marks = series.map((item, seriesIndex) => item.values.map((value, rowIndex) => {
      const center = margin.left + groupWidth * (rowIndex + 0.5);
      const x = center - (series.length * barWidth) / 2 + seriesIndex * barWidth;
      const y = yScale(Math.max(value, 0));
      const baseline = yScale(Math.min(value, 0));
      const label = showLabels
        ? `<text x="${x + (barWidth - 3) / 2}" y="${Math.min(y, baseline) - 8}" text-anchor="middle" font-size="17" fill="#4F5855">${formatTick(value)}</text>`
        : "";
      return `<rect x="${x}" y="${Math.min(y, baseline)}" width="${barWidth - 3}" height="${Math.max(1, Math.abs(baseline - y))}" fill="${colors[seriesIndex % colors.length]}"/>${label}`;
    }).join("")).join("");
  } else if (isErrorBar) {
    const color = colors[0];
    marks = series[0].values.map((value, index) => {
      const x = margin.left + (plotW / rows.length) * (index + 0.5);
      const high = yScale(value + errors[index]);
      const low = yScale(value - errors[index]);
      const label = showLabels
        ? `<text x="${x}" y="${high - 12}" text-anchor="middle" font-size="17" fill="#4F5855">${formatTick(value)} ± ${formatTick(errors[index])}</text>`
        : "";
      return `<line x1="${x}" y1="${high}" x2="${x}" y2="${low}" stroke="${color}" stroke-width="4"/>
        <line x1="${x - 13}" y1="${high}" x2="${x + 13}" y2="${high}" stroke="${color}" stroke-width="4"/>
        <line x1="${x - 13}" y1="${low}" x2="${x + 13}" y2="${low}" stroke="${color}" stroke-width="4"/>
        <circle cx="${x}" cy="${yScale(value)}" r="8" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>${label}`;
    }).join("");
  } else {
    marks = series.map((item, seriesIndex) => {
      const color = colors[seriesIndex % colors.length];
      const points = item.values.map((value, index) => `${xScale(xValues[index])},${yScale(value)}`).join(" ");
      const area = type === "area"
        ? `<polygon points="${xScale(xValues[0])},${yScale(0)} ${points} ${xScale(xValues[xValues.length - 1])},${yScale(0)}" fill="${color}" fill-opacity="0.22"/>`
        : "";
      const line = type === "line" || type === "area"
        ? `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`
        : "";
      const dots = item.values.map((value, index) =>
        `<circle cx="${xScale(xValues[index])}" cy="${yScale(value)}" r="7" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
        ${showLabels ? `<text x="${xScale(xValues[index])}" y="${yScale(value) - 12}" text-anchor="middle" font-size="17" fill="#4F5855">${formatTick(value)}</text>` : ""}`
      ).join("");
      return area + line + dots;
    }).join("");
  }

  const xTicks = rows.map((row, index) => {
    const x = type === "bar" || isErrorBar
      ? margin.left + (plotW / rows.length) * (index + 0.5)
      : xScale(xValues[index]);
    return `<text x="${x}" y="${height - margin.bottom + 38}" text-anchor="middle" font-size="22" fill="#4F5855">${escapeHtml(row[0])}</text>`;
  }).join("");
  const legend = showLegend ? series.map((item, index) => {
    const x = margin.left + index * 190;
    return `<circle cx="${x}" cy="61" r="7" fill="${colors[index % colors.length]}"/>
      <text x="${x + 14}" y="68" font-size="22" fill="#17211F">${escapeHtml(item.name)}</text>`;
  }).join("") : "";
  const title = $("chart-title").value.trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <g font-family="Arial, Helvetica, sans-serif">
      ${title ? `<text x="${width / 2}" y="34" text-anchor="middle" font-size="28" font-weight="700" fill="#17211F">${escapeHtml(title)}</text>` : ""}
      ${legend}
      ${grid}
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#17211F" stroke-width="3"/>
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#17211F" stroke-width="3"/>
      ${marks}
      ${xTicks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(30 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function buildBoxPlotSvg(table) {
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) throw new Error("箱线图至少需要一条观测数据。");
  const groups = new Map();
  rows.forEach((row) => {
    const group = row[0] || "未命名组";
    const value = numericCell(row[1]);
    if (!Number.isFinite(value)) throw new Error("箱线图的 Value 列必须全部是数字。");
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(value);
  });

  const summaries = [...groups].map(([name, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      name,
      values,
      min: sorted[0],
      q1: quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      q3: quantile(sorted, 0.75),
      max: sorted[sorted.length - 1]
    };
  });
  const allValues = summaries.flatMap((item) => item.values);
  let minY = Math.min(...allValues);
  let maxY = Math.max(...allValues);
  const pad = Math.max((maxY - minY) * 0.1, Math.abs(maxY || 1) * 0.05);
  minY -= pad;
  maxY += pad;
  if (minY === maxY) { minY -= 1; maxY += 1; }

  const width = 1200;
  const height = 700;
  const margin = { left: 105, right: 45, top: 82, bottom: 95 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const colors = chartPalette($("chart-palette").value);
  const showGrid = $("chart-show-grid").checked;
  const showLabels = $("chart-show-labels").checked;
  const yTicks = Array.from({ length: 6 }, (_, index) => minY + ((maxY - minY) * index) / 5);
  const grid = yTicks.map((value) => {
    const y = yScale(value);
    return `${showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DADFDA"/>` : ""}
      <text x="${margin.left - 16}" y="${y + 6}" text-anchor="end" font-size="22" fill="#4F5855">${formatTick(value)}</text>`;
  }).join("");
  const groupWidth = plotW / summaries.length;
  const marks = summaries.map((item, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    const boxWidth = Math.min(100, groupWidth * 0.48);
    const color = colors[index % colors.length];
    const points = item.values.map((value, pointIndex) => {
      const jitter = ((pointIndex % 7) - 3) * Math.min(5, boxWidth / 18);
      return `<circle cx="${x + jitter}" cy="${yScale(value)}" r="4" fill="${color}" fill-opacity="0.55"/>`;
    }).join("");
    return `<line x1="${x}" y1="${yScale(item.max)}" x2="${x}" y2="${yScale(item.min)}" stroke="${color}" stroke-width="4"/>
      <line x1="${x - boxWidth * 0.28}" y1="${yScale(item.max)}" x2="${x + boxWidth * 0.28}" y2="${yScale(item.max)}" stroke="${color}" stroke-width="4"/>
      <line x1="${x - boxWidth * 0.28}" y1="${yScale(item.min)}" x2="${x + boxWidth * 0.28}" y2="${yScale(item.min)}" stroke="${color}" stroke-width="4"/>
      <rect x="${x - boxWidth / 2}" y="${yScale(item.q3)}" width="${boxWidth}" height="${Math.max(1, yScale(item.q1) - yScale(item.q3))}" fill="${color}" fill-opacity="0.24" stroke="${color}" stroke-width="4"/>
      <line x1="${x - boxWidth / 2}" y1="${yScale(item.median)}" x2="${x + boxWidth / 2}" y2="${yScale(item.median)}" stroke="${color}" stroke-width="5"/>
      ${points}
      ${showLabels ? `<text x="${x}" y="${yScale(item.max) - 12}" text-anchor="middle" font-size="17" fill="#4F5855">n=${item.values.length}, M=${formatTick(item.median)}</text>` : ""}
      <text x="${x}" y="${height - margin.bottom + 38}" text-anchor="middle" font-size="22" fill="#4F5855">${escapeHtml(item.name)}</text>`;
  }).join("");
  return chartSvgShell({ width, height, margin, plotW, plotH, grid, marks, legend: "" });
}

function buildReplicateBarSvg(table) {
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) throw new Error("重复值柱状图至少需要一条实验数据。");

  const groups = new Map();
  rows.forEach((row) => {
    const group = row[0].trim();
    const value = numericCell(row[1]);
    if (!group) throw new Error("每条重复实验都需要填写组名。");
    if (!Number.isFinite(value)) throw new Error("Value 列必须全部是数字。");
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(value);
  });

  const summaries = [...groups].map(([name, values]) => ({
    name,
    values,
    mean: values.reduce((sum, value) => sum + value, 0) / values.length
  }));
  const allValues = summaries.flatMap((item) => [...item.values, item.mean]);
  let minY = Math.min(0, ...allValues);
  let maxY = Math.max(0, ...allValues);
  const pad = Math.max((maxY - minY) * 0.12, Math.abs(maxY || 1) * 0.06);
  minY = Math.min(0, minY - pad);
  maxY += pad;
  if (minY === maxY) maxY += 1;

  const width = 1200;
  const height = 700;
  const margin = { left: 110, right: 50, top: 78, bottom: 145 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const baseline = yScale(0);
  const groupWidth = plotW / summaries.length;
  const barWidth = Math.min(100, groupWidth * 0.56);
  const fillColor = normalizeHex($("chart-bar-color").value) || "#FF5252";
  const lightColor = interpolateColor("#FFFFFF", fillColor, 0.38);
  const useGradient = $("chart-bar-gradient").checked;
  const showGrid = $("chart-show-grid").checked;
  const showLabels = $("chart-show-labels").checked;
  const yTicks = Array.from({ length: 6 }, (_, index) => minY + ((maxY - minY) * index) / 5);
  const grid = yTicks.map((value) => {
    const y = yScale(value);
    return `${showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DADFDA"/>` : ""}
      <text x="${margin.left - 16}" y="${y + 6}" text-anchor="end" font-size="22" fill="#4F5855">${formatTick(value)}</text>`;
  }).join("");
  const gradientId = "replicate-bar-gradient";
  const marks = summaries.map((item, groupIndex) => {
    const center = margin.left + groupWidth * (groupIndex + 0.5);
    const meanY = yScale(item.mean);
    const barY = Math.min(meanY, baseline);
    const barHeight = Math.max(1, Math.abs(baseline - meanY));
    const pointSpread = Math.min(barWidth * 0.34, 34);
    const points = item.values.map((value, pointIndex) => {
      const offset = item.values.length === 1
        ? 0
        : ((pointIndex / (item.values.length - 1)) - 0.5) * pointSpread * 2;
      const x = center + offset;
      const y = yScale(value);
      return `<circle cx="${x}" cy="${y}" r="8" fill="#3F4543" stroke="#FFFFFF" stroke-width="2"/>`;
    }).join("");
    const meanLabel = showLabels
      ? `<text x="${center}" y="${Math.min(meanY, ...item.values.map(yScale)) - 16}" text-anchor="middle" font-size="18" fill="#4F5855">mean ${formatTick(item.mean)} · n=${item.values.length}</text>`
      : "";
    const labelLines = wrapAxisLabel(item.name);
    const xLabel = labelLines.map((line, lineIndex) =>
      `<tspan x="${center}" dy="${lineIndex === 0 ? 0 : 24}">${escapeHtml(line)}</tspan>`
    ).join("");
    return `<rect x="${center - barWidth / 2}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="2"
        fill="${useGradient ? `url(#${gradientId})` : fillColor}" stroke="#242927" stroke-width="4"/>
      ${points}${meanLabel}
      <text x="${center}" y="${height - margin.bottom + 36}" text-anchor="middle" font-size="21" fill="#303735">${xLabel}</text>`;
  }).join("");
  const defs = useGradient
    ? `<defs><linearGradient id="${gradientId}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${lightColor}"/>
        <stop offset="100%" stop-color="${fillColor}"/>
      </linearGradient></defs>`
    : "";
  const title = $("chart-title").value.trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${defs}
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <g font-family="Arial, Helvetica, sans-serif">
      ${title ? `<text x="${width / 2}" y="34" text-anchor="middle" font-size="28" font-weight="700" fill="#17211F">${escapeHtml(title)}</text>` : ""}
      ${grid}
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#17211F" stroke-width="3"/>
      <line x1="${margin.left}" y1="${baseline}" x2="${width - margin.right}" y2="${baseline}" stroke="#17211F" stroke-width="3"/>
      ${marks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(32 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function buildHeatmapSvg(table) {
  const headers = table[0].slice(1);
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (!headers.length || !rows.length) throw new Error("热图至少需要一个行名、一个列名和数值。");
  const values = rows.map((row) => headers.map((_, index) => numericCell(row[index + 1])));
  if (values.flat().some((value) => !Number.isFinite(value))) {
    throw new Error("热图矩阵区域必须全部是数字。");
  }
  const flat = values.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const width = 1200;
  const height = 700;
  const margin = { left: 170, right: 120, top: 120, bottom: 90 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const cellW = plotW / headers.length;
  const cellH = plotH / rows.length;
  const colors = chartPalette($("chart-palette").value);
  const low = "#F3F6F5";
  const high = colors[0];
  const showLabels = $("chart-show-labels").checked;
  const marks = values.map((rowValues, rowIndex) => rowValues.map((value, columnIndex) => {
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    const fill = interpolateColor(low, high, ratio);
    const textColor = contrastRatio("#FFFFFF", fill) >= 4.5 ? "#FFFFFF" : "#17211F";
    return `<rect x="${margin.left + columnIndex * cellW}" y="${margin.top + rowIndex * cellH}" width="${cellW}" height="${cellH}" fill="${fill}" stroke="#FFFFFF" stroke-width="2"/>
      ${showLabels ? `<text x="${margin.left + (columnIndex + 0.5) * cellW}" y="${margin.top + (rowIndex + 0.5) * cellH + 6}" text-anchor="middle" font-size="18" fill="${textColor}">${formatTick(value)}</text>` : ""}`;
  }).join("")).join("");
  const columnLabels = headers.map((header, index) =>
    `<text x="${margin.left + (index + 0.5) * cellW}" y="${margin.top - 14}" text-anchor="middle" font-size="20" fill="#4F5855">${escapeHtml(header)}</text>`
  ).join("");
  const rowLabels = rows.map((row, index) =>
    `<text x="${margin.left - 14}" y="${margin.top + (index + 0.5) * cellH + 7}" text-anchor="end" font-size="20" fill="#4F5855">${escapeHtml(row[0])}</text>`
  ).join("");
  const legendSteps = $("chart-show-legend").checked ? Array.from({ length: 40 }, (_, index) => {
    const ratio = index / 39;
    return `<rect x="${width - 75}" y="${margin.top + (1 - ratio) * 220}" width="22" height="${220 / 39 + 1}" fill="${interpolateColor(low, high, ratio)}"/>`;
  }).join("") : "";
  const legendLabels = $("chart-show-legend").checked
    ? `<text x="${width - 45}" y="${margin.top + 7}" font-size="18" fill="#4F5855">${formatTick(max)}</text>
      <text x="${width - 45}" y="${margin.top + 226}" font-size="18" fill="#4F5855">${formatTick(min)}</text>`
    : "";
  const title = $("chart-title").value.trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <g font-family="Arial, Helvetica, sans-serif">
      ${title ? `<text x="${width / 2}" y="38" text-anchor="middle" font-size="28" font-weight="700" fill="#17211F">${escapeHtml(title)}</text>` : ""}
      ${columnLabels}${rowLabels}${marks}${legendSteps}
      ${legendLabels}
      <text x="${margin.left + plotW / 2}" y="${height - 24}" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(34 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function chartSvgShell({ width, height, margin, plotW, plotH, grid, marks, legend }) {
  const title = $("chart-title").value.trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <g font-family="Arial, Helvetica, sans-serif">
      ${title ? `<text x="${width / 2}" y="34" text-anchor="middle" font-size="28" font-weight="700" fill="#17211F">${escapeHtml(title)}</text>` : ""}
      ${legend}${grid}
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#17211F" stroke-width="3"/>
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#17211F" stroke-width="3"/>
      ${marks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(30 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="26" fill="#17211F">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function quantile(sorted, probability) {
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * probability;
  const base = Math.floor(position);
  const remainder = position - base;
  return sorted[base + 1] === undefined
    ? sorted[base]
    : sorted[base] + remainder * (sorted[base + 1] - sorted[base]);
}

function wrapAxisLabel(value) {
  const text = String(value || "");
  if (text.length <= 14) return [text];
  const splitAt = text.lastIndexOf(" ", 14);
  if (splitAt > 3) return [text.slice(0, splitAt), text.slice(splitAt + 1)];
  return [text.slice(0, 14), text.slice(14)];
}

function interpolateColor(from, to, ratio) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const channel = (key) => Math.round(a[key] + (b[key] - a[key]) * Math.max(0, Math.min(1, ratio)));
  return `#${[channel("r"), channel("g"), channel("b")].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function numericCell(value) {
  if (String(value ?? "").trim() === "") return Number.NaN;
  return Number(value);
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16)
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      field += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  rows.push(row);
  return rows;
}

function chartPalette(name) {
  if (name === "journal") return ["#3B5BA5", "#D85A40", "#5B8E55", "#7B5EA7", "#D39C2C"];
  if (name === "mono") return ["#111111", "#555555", "#888888", "#BBBBBB"];
  return ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9"];
}

function formatTick(value) {
  const magnitude = Math.abs(value);
  if (magnitude >= 10000 || (magnitude > 0 && magnitude < 0.01)) return value.toExponential(1);
  return Number(value.toFixed(2)).toString();
}

function crossrefToCitation(item, doi) {
  const authors = (item.author || []).map((author) =>
    [author.family, author.given].filter(Boolean).join(", ")
  );
  const authorText = authors.length > 3
    ? `${authors[0]} et al.`
    : authors.join("; ") || "Unknown author";
  const year = item.published?.["date-parts"]?.[0]?.[0]
    || item.issued?.["date-parts"]?.[0]?.[0]
    || "n.d.";
  const title = item.title?.[0] || "Untitled";
  const journal = item["container-title"]?.[0] || "";
  return {
    doi,
    title,
    authorText,
    year: String(year),
    journal,
    shortJournal: item["short-container-title"]?.[0] || abbreviateJournalName(journal),
    volume: item.volume || "",
    issue: item.issue || "",
    pages: item.page || item["article-number"] || "",
    fullText: `${authorText} (${year}). ${title}. ${journal}${item.volume ? ` ${item.volume}` : ""}${item.issue ? `(${item.issue})` : ""}${item.page ? `, ${item.page}` : ""}. https://doi.org/${doi}`
  };
}

function refreshCitationOutput() {
  if (!currentCitation) {
    refreshCitationPreview();
    return;
  }
  const formatted = formatCitation(currentCitation, $("citation-format").value);
  $("citation-output").value = formatted.text;
  refreshCitationPreview(formatted);
}

function refreshCitationPreview(formatted = null) {
  const preview = $("citation-preview");
  if (!preview) return;
  const value = formatted || (currentCitation
    ? formatCitation(currentCitation, $("citation-format").value)
    : null);
  const text = $("citation-output").value.trim();
  preview.innerHTML = "";
  if (!text) {
    preview.className = "citation-preview muted";
    preview.textContent = "短引用预览";
    return;
  }
  preview.className = "citation-preview";
  preview.style.fontFamily = $("citation-font").value;
  preview.style.fontSize = `${numVal("citation-size", 8)}pt`;
  preview.style.color = $("citation-color").value;
  if (!value || value.text !== text) {
    preview.textContent = text;
    return;
  }
  let cursor = 0;
  value.styles.forEach((style) => {
    if (style.start > cursor) {
      preview.appendChild(document.createTextNode(text.slice(cursor, style.start)));
    }
    const span = document.createElement("span");
    span.textContent = text.slice(style.start, style.start + style.length);
    if (style.bold) span.style.fontWeight = "700";
    if (style.italic) span.style.fontStyle = "italic";
    preview.appendChild(span);
    cursor = style.start + style.length;
  });
  if (cursor < text.length) preview.appendChild(document.createTextNode(text.slice(cursor)));
}

function formatCitation(citation, format) {
  if (format === "full") {
    const styles = [];
    const journalStart = citation.fullText.indexOf(citation.journal);
    if (citation.journal && journalStart >= 0) {
      styles.push({ start: journalStart, length: citation.journal.length, italic: true });
    }
    return { text: citation.fullText, styles };
  }

  let text = "";
  const styles = [];
  const append = (value, style = null) => {
    if (!value) return;
    const start = text.length;
    text += value;
    if (style) styles.push({ start, length: value.length, ...style });
  };
  append(citation.shortJournal || citation.journal || "Journal", { italic: true });
  append(", ");
  append(citation.year || "n.d.", { bold: true });
  if (citation.volume || citation.issue) {
    append(", ");
    append(citation.issue
      ? `${citation.volume || ""}(${citation.issue})`
      : citation.volume, { italic: true });
  }
  if (citation.pages) {
    append(", ");
    append(citation.pages);
  }
  append(".");
  return { text, styles };
}

function abbreviateJournalName(name) {
  if (!name) return "";
  const skipped = new Set(["of", "the", "and", "in", "on", "for", "a", "an"]);
  const known = {
    international: "Int.",
    journal: "J.",
    chemistry: "Chem.",
    chemical: "Chem.",
    communications: "Commun.",
    communication: "Commun.",
    applied: "Appl.",
    materials: "Mater.",
    science: "Sci.",
    sciences: "Sci.",
    research: "Res.",
    physical: "Phys.",
    physics: "Phys.",
    advanced: "Adv.",
    engineering: "Eng.",
    environmental: "Environ.",
    catalysis: "Catal.",
    organic: "Org.",
    inorganic: "Inorg.",
    analytical: "Anal.",
    molecular: "Mol.",
    angewandte: "Angew.",
    chemie: "Chem.",
    edition: "Ed."
  };
  return name.split(/\s+/).filter(Boolean).map((word) => {
    const clean = word.replace(/[^\p{L}-]/gu, "");
    const lower = clean.toLowerCase();
    if (skipped.has(lower)) return lower;
    if (known[lower]) return known[lower];
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 4)}.`;
  }).join(" ");
}

function cleanDoi(value) {
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
}

function readCitations() {
  return JSON.parse(localStorage.getItem(STORE.citations) || "[]");
}

function renderCitations() {
  const list = $("citation-list");
  if (!list) return;
  const citations = readCitations();
  list.innerHTML = citations.length ? "" : "<p class=\"muted\">引用库为空。</p>";
  citations.forEach((citation) => {
    const item = document.createElement("div");
    item.className = "citation-item";
    const label = document.createElement("span");
    label.textContent = citation.title;
    label.title = citation.text;
    const use = document.createElement("button");
    use.className = "secondary";
    use.textContent = "使用";
    use.addEventListener("click", () => {
      currentCitation = citation.citation || null;
      $("doi-input").value = citation.doi.startsWith("manual-") ? "" : citation.doi;
      $("citation-output").value = citation.text;
      refreshCitationPreview();
    });
    item.append(label, use);
    list.appendChild(item);
  });
}

function saveAiSettings() {
  localStorage.setItem(STORE.ai, JSON.stringify({
    url: $("ai-url").value.trim(),
    model: $("ai-model").value.trim(),
    key: $("ai-key").value.trim(),
    prompt: $("ai-prompt").value
  }));
  notify("AI 设置已保存");
}

function loadAiSettings() {
  const settings = JSON.parse(localStorage.getItem(STORE.ai) || "{}");
  if (settings.url) $("ai-url").value = settings.url;
  if (settings.model) $("ai-model").value = settings.model;
  if (settings.key) $("ai-key").value = settings.key;
  if (settings.prompt) $("ai-prompt").value = settings.prompt;
}

async function rewriteSelectedText() {
  assertOffice();
  const settings = JSON.parse(localStorage.getItem(STORE.ai) || "{}");
  if (!settings.url || !settings.key || !settings.model) throw new Error("请先保存 API 地址、模型和 Key。");

  await PowerPoint.run(async (context) => {
    const shape = context.presentation.getSelectedShapes().getItemAt(0);
    shape.textFrame.load("hasText,textRange/text");
    await context.sync();
    if (!shape.textFrame.hasText) throw new Error("请选中一个包含文本的对象。");
    const original = shape.textFrame.textRange.text;
    const rewritten = await callChatCompletions(settings, original);
    shape.textFrame.textRange.text = rewritten.trim();
    await context.sync();
    notify("已用 AI 润色选中文本");
  });
}

function refreshExportOptions() {
  const format = $("export-format").value;
  const range = $("export-range").value;
  const resolution = $("export-resolution").value;
  const isLossless = format === "png";
  const isPdf = format === "pdf";
  const width = resolution === "custom"
    ? clampExportWidth(numVal("export-width", 1920))
    : Number(resolution);
  const formatLabels = {
    png: "PNG",
    jpeg: "JPEG",
    webp: "WebP",
    pdf: "PDF"
  };

  $("export-range-field").hidden = !isPdf;
  $("export-width-field").hidden = resolution !== "custom";
  $("export-quality-field").hidden = isLossless;
  const rangeLabels = {
    current: "当前页",
    selected: "已选页面",
    all: "全部页面"
  };
  const qualitySummary = isLossless
    ? `${formatLabels[format]} · ${width} px · 无损导出`
    : `${formatLabels[format]} · ${width} px · ${Math.round(numVal("export-quality", 0.92) * 100)}% 质量`;
  $("export-summary").textContent = isPdf
    ? `${qualitySummary} · ${rangeLabels[range]}合并为一个文件`
    : qualitySummary;
  $("export-button").textContent = isPdf ? `导出 ${rangeLabels[range]} PDF` : "导出当前页";
}

async function exportSlides() {
  assertOffice();
  const format = $("export-format").value;
  const range = format === "pdf" ? $("export-range").value : "current";
  const resolution = $("export-resolution").value;
  const width = clampExportWidth(
    resolution === "custom" ? numVal("export-width", 1920) : Number(resolution)
  );
  const quality = Math.min(1, Math.max(0.1, numVal("export-quality", 0.92)));

  await PowerPoint.run(async (context) => {
    const filename = `slide-${dateStamp()}`;
    if (format === "pdf") {
      const slides = await getExportSlides(context, range);
      if (!slides.length) throw new Error("没有可导出的幻灯片。");
      const pages = [];
      const batchSize = 5;
      for (let start = 0; start < slides.length; start += batchSize) {
        const batch = slides.slice(start, start + batchSize);
        const imageResults = batch.map((slide) => slide.getImageAsBase64({ width }));
        await context.sync();

        for (const result of imageResults) {
          const image = await loadImage(`data:image/png;base64,${result.value}`);
          const jpegBlob = await imageToBlob(image, "image/jpeg", quality);
          pages.push({
            jpegBlob,
            width: image.naturalWidth,
            height: image.naturalHeight
          });
        }
      }
      const pdfBlob = await jpegBlobsToPdf(pages);
      downloadBlob(pdfBlob, `${filename}-${pages.length}-pages.pdf`);
      notify(`已导出 ${pages.length} 页 PDF（${width} px）`);
      return;
    }

    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const result = slide.getImageAsBase64({ width });
    await context.sync();
    const sourceUrl = `data:image/png;base64,${result.value}`;
    if (format === "png") {
      downloadDataUrl(sourceUrl, `${filename}.png`);
    } else {
      const image = await loadImage(sourceUrl);
      const mimeType = format === "webp" ? "image/webp" : "image/jpeg";
      const imageBlob = await imageToBlob(image, mimeType, quality);
      downloadBlob(imageBlob, `${filename}.${format === "jpeg" ? "jpg" : "webp"}`);
    }
    notify(`当前页 ${format.toUpperCase()} 已导出（${width} px）`);
  });
}

async function getExportSlides(context, range) {
  if (range === "current") {
    return [context.presentation.getSelectedSlides().getItemAt(0)];
  }
  const collection = range === "all"
    ? context.presentation.slides
    : context.presentation.getSelectedSlides();
  collection.load("items");
  await context.sync();
  return collection.items;
}

function clampExportWidth(width) {
  return Math.round(Math.min(7680, Math.max(320, width || 1920)));
}

function imageToBlob(image, mimeType, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (mimeType === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== mimeType) {
        reject(new Error(`当前环境不支持 ${mimeType === "image/webp" ? "WebP" : "JPEG"} 导出。`));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

async function jpegBlobsToPdf(pages) {
  if (!pages.length) throw new Error("PDF 至少需要一页。");
  const pageObjects = [];
  const pageReferences = [];

  for (let index = 0; index < pages.length; index += 1) {
    const { jpegBlob, width: pixelWidth, height: pixelHeight } = pages[index];
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const pageWidth = 720;
    const pageHeight = Math.round(pageWidth * pixelHeight / pixelWidth * 1000) / 1000;
    const pageObjectId = 3 + index * 3;
    const imageObjectId = pageObjectId + 1;
    const contentObjectId = pageObjectId + 2;
    const imageName = `Im${index}`;
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/${imageName} Do\nQ\n`;

    pageReferences.push(`${pageObjectId} 0 R`);
    pageObjects.push(
      asciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /${imageName} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`),
      concatBytes(
        asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
        jpegBytes,
        asciiBytes("\nendstream")
      ),
      asciiBytes(`<< /Length ${asciiBytes(content).length} >>\nstream\n${content}endstream`)
    );
  }

  const objects = [
    asciiBytes("<< /Type /Catalog /Pages 2 0 R >>"),
    asciiBytes(`<< /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pages.length} >>`),
    ...pageObjects
  ];

  const chunks = [asciiBytes("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n")];
  const offsets = [0];
  let byteLength = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(byteLength);
    const chunk = concatBytes(
      asciiBytes(`${index + 1} 0 obj\n`),
      object,
      asciiBytes("\nendobj\n")
    );
    chunks.push(chunk);
    byteLength += chunk.length;
  });

  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(asciiBytes(xref));
  return new Blob(chunks, { type: "application/pdf" });
}

function asciiBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function concatBytes(...parts) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function shapeData(shape) {
  return {
    id: shape.id,
    left: shape.left,
    top: shape.top,
    width: shape.width,
    height: shape.height,
    type: shape.type,
    name: shape.name
  };
}

function styleText(shape, options = {}) {
  const range = shape.textFrame.textRange;
  if (options.size) range.font.size = options.size;
  if (options.name) range.font.name = options.name;
  if (options.color) range.font.color = options.color;
  if (options.bold !== undefined) range.font.bold = options.bold;
  if (options.italic !== undefined) range.font.italic = options.italic;
  if (options.align) range.paragraphFormat.horizontalAlignment = options.align;
}

async function tryLoadText(context, shapes) {
  try {
    shapes.forEach((shape) => shape.textFrame.load("hasText,textRange/text"));
    await context.sync();
  } catch {
    await context.sync();
  }
}

function safeShapeText(shape) {
  try {
    return shape.textFrame?.hasText ? shape.textFrame.textRange.text : "";
  } catch {
    return "";
  }
}

function parseMarkdownLite(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ kind: "code", text: code.join("\n"), height: Math.max(44, code.length * 15 + 18), dark: true });
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: cleanInline(heading[2]), height: heading[1].length === 1 ? 34 : 28 });
      index += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push("• " + cleanInline(lines[index].replace(/^\s*[-*]\s+/, "")));
        index += 1;
      }
      blocks.push({ kind: "body", text: items.join("\n"), height: Math.max(28, items.length * 22) });
      continue;
    }
    if (line.startsWith(">")) {
      blocks.push({ kind: "quote", text: cleanInline(line.replace(/^>\s?/, "")), height: 28 });
      index += 1;
      continue;
    }
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith("```")) {
      paragraph.push(cleanInline(lines[index]));
      index += 1;
    }
    blocks.push({ kind: "body", text: paragraph.join("\n"), height: Math.max(28, paragraph.length * 22) });
  }
  return blocks;
}

function cleanInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)");
}

async function latexToSvg(latex) {
  if (window.MathJax?.tex2svgPromise) {
    const node = await window.MathJax.tex2svgPromise(latex, { display: true });
    const svg = node.querySelector("svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("data-latex", latex);
    return new XMLSerializer().serializeToString(svg);
  }
  const escaped = escapeHtml(latex);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="90" viewBox="0 0 520 90" data-latex="${escaped}">
    <rect width="520" height="90" fill="white"/>
    <text x="24" y="55" font-family="Menlo, monospace" font-size="28" fill="#17211F">${escaped}</text>
  </svg>`;
}

async function svgToPngBase64(svgText, scale = 4, background = null) {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = parsed.documentElement;
  const viewBox = (svg.getAttribute("viewBox") || "0 0 800 200").split(/\s+/).map(Number);
  const sourceWidth = Math.max(1, viewBox[2] || parseFloat(svg.getAttribute("width")) || 800);
  const sourceHeight = Math.max(1, viewBox[3] || parseFloat(svg.getAttribute("height")) || 200);
  const maxDimension = 4096;
  const appliedScale = Math.min(scale, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * appliedScale));
  const height = Math.max(1, Math.round(sourceHeight * appliedScale));
  svg.setAttribute("width", String(sourceWidth));
  svg.setAttribute("height", String(sourceHeight));

  const serialized = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png").split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图像渲染失败。"));
    image.src = url;
  });
}

function normalizeHex(value) {
  if (!value) return null;
  const named = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    green: "#008000",
    blue: "#0000FF"
  };
  const raw = named[value.toLowerCase()] || value;
  const cleaned = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-f]{6}$/i.test(cleaned)) return cleaned.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(cleaned)) {
    return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`.toUpperCase();
  }
  return null;
}

function supportsTextFrame(type) {
  return [
    "TextBox",
    "GeometricShape",
    "Placeholder",
    "Callout",
    "Freeform"
  ].includes(String(type));
}

function supportsFill(type) {
  return [
    "TextBox",
    "GeometricShape",
    "Callout",
    "Freeform"
  ].includes(String(type));
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function bestTextColor(background) {
  const blackRatio = contrastRatio("#000000", background);
  const whiteRatio = contrastRatio("#FFFFFF", background);
  return blackRatio >= whiteRatio ? "#000000" : "#FFFFFF";
}

function contrastGrade(ratio) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "不通过";
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function setSelectedData(data, coercionType) {
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(data, { coercionType }, (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) reject(new Error(result.error.message));
      else resolve(result.value);
    });
  });
}

async function callChatCompletions(settings, selectedText) {
  const response = await fetch(settings.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.key}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: "system", content: settings.prompt },
        { role: "user", content: selectedText }
      ],
      temperature: 0.3
    })
  });
  if (!response.ok) throw new Error(`AI 请求失败：${response.status}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}

function readAssets() {
  return JSON.parse(localStorage.getItem(STORE.assets) || "[]");
}

function formatLabel(style, index) {
  const alpha = String.fromCharCode((style.startsWith("a") ? 97 : 65) + index);
  if (style === "A") return alpha.toUpperCase();
  if (style === "a") return alpha.toLowerCase();
  if (style === "A)") return `${alpha.toUpperCase()})`;
  if (style === "a)") return `${alpha.toLowerCase()})`;
  if (style === "1)") return `${index + 1})`;
  return String(index + 1);
}

function intVal(id, fallback) {
  return Math.max(0, parseInt($(id).value, 10) || fallback);
}

function numVal(id, fallback) {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : fallback;
}

function optionalNum(id) {
  const raw = $(id).value.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  })[char]);
}

function downloadDataUrl(url, filename) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function dateStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}
