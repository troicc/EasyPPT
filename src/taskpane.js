const STORE = {
  metrics: "easyppt.metrics",
  assets: "easyppt.assets",
  ai: "easyppt.ai",
  citations: "easyppt.citations",
  panelOrder: "easyppt.panelOrder",
  assetExport: "easyppt.assetExport",
  figureTemplates: "easyppt.figureTemplates",
  formatStyle: "easyppt.formatStyle",
  chartDatasets: "easyppt.chartDatasets",
  chartDefaultStyle: "easyppt.chartDefaultStyle",
  panelFavorites: "easyppt.panelFavorites",
  panelCollapsed: "easyppt.panelCollapsed"
};

const LEGACY_STORE = {
  metrics: "slidesci.metrics",
  assets: "slidesci.assets",
  ai: "slidesci.ai",
  citations: "slidesci.citations",
  panelOrder: "slidesci.panelOrder",
  assetExport: "slidesci.assetExport",
  figureTemplates: "slidesci.figureTemplates",
  formatStyle: "slidesci.formatStyle",
  chartDatasets: "slidesci.chartDatasets",
  chartDefaultStyle: "slidesci.chartDefaultStyle",
  panelFavorites: "slidesci.panelFavorites",
  panelCollapsed: "slidesci.panelCollapsed"
};

const $ = (id) => document.getElementById(id);
let currentCitation = null;
let chartDrafts = {};
let currentChartType = "line";
let currentChartTypeCategory = "trend";
let chartSeriesColors = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9"];
let selectedChartSeriesColorIndex = 0;
let currentChartStyleBase = "easyppt";
let heatmapCustomMidpoint = false;
let chartErrorColorModes = { mean: "auto", bar: "auto", line: "auto" };
let chartErrorCustomColors = { mean: "#111111", bar: "#111111", line: "#111111" };
let currentSectionTemplate = "swiss";
let currentNavTemplate = "orbit";
let currentSectionLanguage = "zh";
let currentNavLanguage = "zh";
let extractedResearchPalette = [];
let paletteImageUrl = null;
let selectedResearchColorIndex = 0;
let currentPaletteCategory = "research";
let currentClassicPaletteId = "soft-science";
let booted = false;
let currentAnimationPlan = null;

const PANEL_CATEGORIES = [
  { id: "layout", label: "排版", titles: ["格式微调", "Figure 一键排版"] },
  { id: "content", label: "内容", titles: ["Markdown / LaTeX", "DOI 引用"] },
  { id: "chart", label: "图表", titles: ["经典配色", "EasyPlot"] },
  { id: "assets", label: "素材", titles: ["素材库"] },
  { id: "enhance", label: "增强", titles: ["智能动画", "AI 助手"] },
  { id: "output", label: "输出", titles: ["导出"] }
];

const FIGURE_PRESETS = {
  nature: {
    name: "Nature · 双栏",
    settings: {
      columns: 2, width: 220, height: 165, gapX: 10, gapY: 10,
      preserveAspect: true,
      labelStyle: "A", labelSize: 14, labelOffsetX: 0, labelOffsetY: 0,
      titleSize: 14, captionSize: 9, textGap: 8, prefix: "Figure"
    }
  },
  science: {
    name: "Science · 三栏",
    settings: {
      columns: 3, width: 165, height: 124, gapX: 8, gapY: 8,
      preserveAspect: true,
      labelStyle: "A", labelSize: 13, labelOffsetX: 0, labelOffsetY: 0,
      titleSize: 13, captionSize: 8.5, textGap: 7, prefix: "Fig."
    }
  },
  cell: {
    name: "Cell · 大图",
    settings: {
      columns: 2, width: 230, height: 172, gapX: 12, gapY: 12,
      preserveAspect: true,
      labelStyle: "A", labelSize: 16, labelOffsetX: 0, labelOffsetY: 0,
      titleSize: 15, captionSize: 9, textGap: 9, prefix: "Figure"
    }
  }
};

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
  barerrorline: {
    guide: "原始重复值模式：每行填写类别、柱重复值、折线重复值；同组自动计算均值和所选误差。折线使用右 Y 轴。",
    example: [["Category", "Yield replicate", "ee replicate"], ["V136A", "18", "61"], ["V136A", "24", "62"], ["V136A", "30", "63"], ["F137A", "29", "69"], ["F137A", "32", "70"], ["F137A", "35", "72"], ["L140A", "39", "70"], ["L140A", "42", "72"], ["L140A", "45", "74"]],
    addSeries: false
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
    guide: "原始重复值模式：每行填写组名和一条观测值；同组可重复多行，自动计算均值、SD、SEM 或 95% CI。",
    example: [["Group", "Value"], ["Control", "2.1"], ["Control", "2.4"], ["Control", "2.7"], ["Low dose", "2.8"], ["Low dose", "3.1"], ["Low dose", "3.4"], ["High dose", "4.2"], ["High dose", "4.6"], ["High dose", "5.0"]],
    addSeries: false
  },
  box: {
    guide: "长表格式：每一行是一条原始观测。第 1 列填写组名，第 2 列填写数值；同组可重复多行。",
    example: [["Group", "Value"], ["Control", "2.1"], ["Control", "2.5"], ["Control", "2.8"], ["Treatment", "3.2"], ["Treatment", "3.8"], ["Treatment", "4.1"]],
    addSeries: false
  },
  violin: {
    guide: "长表格式：每行是一条原始观测。第 1 列填写组名，第 2 列填写数值；同组重复多行。自动绘制核密度小提琴、中心统计线和抖动原始点。",
    example: [["Group", "Value"], ["Control", "2.1"], ["Control", "2.4"], ["Control", "2.8"], ["Control", "3.0"], ["Control", "3.3"], ["Treatment", "3.1"], ["Treatment", "3.5"], ["Treatment", "3.9"], ["Treatment", "4.2"], ["Treatment", "4.6"]],
    addSeries: false
  },
  dualaxis: {
    guide: "固定 3 列：类别、左轴柱形值、右轴折线值。适合附图所示的两种不同量纲数据叠加比较。",
    example: [["Category", "Yield", "ee"], ["V136A", "40", "34"], ["F137A", "60", "42"], ["L140A", "78", "43"], ["F141A", "7", "35"], ["G142A", "16", "40"], ["V144A", "7", "36"], ["D145A", "73", "44"], ["L146A", "23", "39"], ["F152A", "-14", "19"], ["L156A", "18", "40"], ["Y159A", "-17", "6"], ["D139A", "89", "46"]],
    addSeries: false
  },
  heatmap: {
    guide: "矩阵格式：第 1 列是行名，首行后续单元格是列名，其余区域全部填写数值。",
    example: [["Feature", "Sample 1", "Sample 2", "Sample 3"], ["Gene A", "1.2", "2.4", "3.1"], ["Gene B", "2.8", "1.6", "2.2"], ["Gene C", "3.5", "2.9", "1.4"]],
    addSeries: true
  }
};

const CHART_TYPE_GROUPS = [
  { id: "compare", label: "比较", note: "柱状、均值、重复值", types: ["bar", "errorbar", "replicatebar"] },
  { id: "trend", label: "趋势", note: "随 X 变化或变量关系", types: ["line", "scatter", "area"] },
  { id: "dist", label: "分布", note: "看离散程度和原始点", types: ["box", "violin"] },
  { id: "combo", label: "复合", note: "双轴和柱线叠加", types: ["barerrorline", "dualaxis"] },
  { id: "matrix", label: "矩阵", note: "二维数值矩阵", types: ["heatmap"] }
];

const CHART_TYPE_META = {
  line: { label: "折线图", short: "折线", hint: "适合时间序列、剂量响应和趋势比较。" },
  scatter: { label: "散点图", short: "散点", hint: "适合变量关系、相关性和回归展示。" },
  bar: { label: "分组柱状图", short: "分组柱状", hint: "适合多个实验组在不同类别中的并列比较。" },
  barerrorline: { label: "柱状图＋误差棒/折线", short: "柱线误差", hint: "柱数据可带误差棒，也可叠加右轴折线。" },
  replicatebar: { label: "重复值柱状图", short: "重复值柱状", hint: "输入原始重复值，自动显示均值柱和原始点。" },
  area: { label: "面积图", short: "面积", hint: "适合展示累积感、信号强度或连续趋势。" },
  errorbar: { label: "均值 ± 误差图", short: "均值±误差", hint: "输入原始重复值后自动计算 SD、SEM 或 95% CI。" },
  box: { label: "箱线图", short: "箱线", hint: "适合展示中位数、四分位和离散程度。" },
  violin: { label: "小提琴图＋原始点", short: "小提琴", hint: "适合同时展示分布形状、中心统计和原始点。" },
  dualaxis: { label: "双 Y 轴柱线叠加图", short: "双轴柱线", hint: "适合两个不同量纲的数据叠加比较。" },
  heatmap: { label: "热图", short: "热图", hint: "适合二维矩阵、样本×特征或条件×响应。" }
};

const CHART_STYLE_PRESETS = {
  easyppt: {
    font: "Arial", titleSize: 32, axisTitleSize: 24, tickSize: 19, legendSize: 19,
    lineWidth: 3.5, pointSize: 7.5, axisWidth: 3.2, fillOpacity: 1, xRotation: 0,
    legendPosition: "right", background: "#FFFFFF", plotBackground: "#FFFFFF",
    axisColor: "#111111", gridColor: "#E5E5E5", showGrid: false,
    frame: "leftBottom", majorTickLength: 10, minorTickLength: 5, showMinorGrid: false,
    titleWeight: 700, axisTitleWeight: 700, barGradient: true,
    colors: ["#008FF5", "#8E3BFF", "#00A087", "#E64B35", "#F39B7F", "#3C5488"]
  },
  graphpad: {
    font: "Arial", titleSize: 30, axisTitleSize: 28, tickSize: 22, legendSize: 20,
    lineWidth: 2.6, pointSize: 6, axisWidth: 4.2, fillOpacity: 0.78, xRotation: 0,
    legendPosition: "right", background: "#FFFFFF", plotBackground: "#FFFFFF",
    axisColor: "#000000", gridColor: "#D9D9D9", showGrid: false,
    frame: "leftBottom", majorTickLength: 12, minorTickLength: 6, showMinorGrid: false,
    titleWeight: 700, axisTitleWeight: 700,
    tickWeight: 700, legendWeight: 700, tickWidth: 3,
    lineCap: "square", markStroke: "#000000", markStrokeWidth: 2,
    violinInner: "boxplot", barGradient: false,
    colors: ["#79A2D2", "#9B84D1", "#DD83E2", "#6FC3B2", "#E8A168", "#CE6F8F"]
  },
  journal: {
    font: "Times New Roman", titleSize: 26, axisTitleSize: 20, tickSize: 16, legendSize: 16,
    lineWidth: 2.2, pointSize: 5.5, axisWidth: 1.8, fillOpacity: 0.9, xRotation: 0,
    legendPosition: "top", background: "#FFFFFF", plotBackground: "#FFFFFF",
    axisColor: "#202020", gridColor: "#DADFDA", showGrid: false,
    frame: "leftBottom", majorTickLength: 7, minorTickLength: 0, showMinorGrid: false,
    titleWeight: 600, axisTitleWeight: 600, barGradient: false,
    colors: ["#3C5488", "#E64B35", "#00A087", "#4DBBD5", "#F39B7F", "#8491B4"]
  },
  python: {
    font: "DejaVu Sans", titleSize: 28, axisTitleSize: 20, tickSize: 16, legendSize: 16,
    lineWidth: 2.4, pointSize: 6, axisWidth: 1.6, fillOpacity: 0.82, xRotation: 0,
    legendPosition: "top", background: "#FFFFFF", plotBackground: "#FFFFFF",
    axisColor: "#262626", gridColor: "#B0B0B0", showGrid: true,
    frame: "box", majorTickLength: 6, minorTickLength: 3, showMinorGrid: false,
    titleWeight: 500, axisTitleWeight: 400, barGradient: false,
    colors: ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B"]
  },
  r: {
    font: "Arial", titleSize: 28, axisTitleSize: 20, tickSize: 16, legendSize: 16,
    lineWidth: 2.6, pointSize: 6, axisWidth: 0, fillOpacity: 0.78, xRotation: 0,
    legendPosition: "right", background: "#FFFFFF", plotBackground: "#EBEBEB",
    axisColor: "#333333", gridColor: "#FFFFFF", showGrid: true,
    frame: "none", majorTickLength: 0, minorTickLength: 0, showMinorGrid: true,
    titleWeight: 600, axisTitleWeight: 400, barGradient: false,
    colors: ["#F8766D", "#00BFC4", "#7CAE00", "#C77CFF", "#FF61CC", "#00BA38"]
  },
  minimal: {
    font: "Helvetica", titleSize: 30, axisTitleSize: 21, tickSize: 16, legendSize: 16,
    lineWidth: 4, pointSize: 7, axisWidth: 2, fillOpacity: 0.9, xRotation: 0,
    legendPosition: "top", background: "#FFFFFF", plotBackground: "#FFFFFF",
    axisColor: "#26312E", gridColor: "#EEF1F0", showGrid: false,
    frame: "bottom", majorTickLength: 0, minorTickLength: 0, showMinorGrid: false,
    titleWeight: 700, axisTitleWeight: 500, barGradient: false,
    colors: ["#195B57", "#E69F00", "#6D7F7A", "#C95F4B", "#78A89B", "#2D403B"]
  }
};

const actions = {
  copyMetrics,
  pastePosition: () => pasteMetrics({ position: true, size: false }),
  pasteSize: () => pasteMetrics({ position: false, size: true }),
  pasteBorder: () => pasteMetrics({ border: true }),
  pasteMetrics: () => pasteMetrics({ position: true, size: true, border: true }),
  clearMetrics,
  copyFormatStyle,
  applyFormatStyle,
  clearFormatStyle,
  arrangeGrid: () => arrangeSelected("grid"),
  arrangeByRows: () => arrangeSelected("rows"),
  applyFigureLayout: () => buildFigure(true),
  arrangeFigureOnly: () => buildFigure(false),
  saveFigureTemplate,
  deleteFigureTemplate,
  alignLeft: () => alignSelected("left"),
  alignCenter: () => alignSelected("center"),
  alignRight: () => alignSelected("right"),
  alignTop: () => alignSelected("top"),
  alignMiddle: () => alignSelected("middle"),
  alignBottom: () => alignSelected("bottom"),
  spaceHorizontal: () => spaceSelected("horizontal"),
  spaceVertical: () => spaceSelected("vertical"),
  addCaptions,
  addLabels,
  insertMarkdown,
  insertLatexImage,
  choosePaletteImage,
  applyResearchPalette,
  insertCsvChart,
  downloadCsvChartSvg,
  addChartRow,
  addChartSeries,
  resetChartTemplate,
  clearChartTable,
  loadCsvIntoChartTable,
  saveChartDataset,
  loadChartDataset,
  deleteChartDataset,
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
  analyzeSmartAnimation,
  applySmartAnimation,
  exportSlides
};

function boot() {
  if (booted) return;
  booted = true;
  migrateLegacyStorage();
  initializeMetricsPanel();
  initializePanelOrdering();
  initializePanelNavigator();
  bindActions();
  initializeChartEditor();
  initializeChartStyling();
  renderChartDatasets();
  initializeSectionDividerBuilder();
  initializeTopNavigationBuilder();
  initializeFigureBuilder();
  renderResearchPalette();
  loadAiSettings();
  renderAssets();
  renderCitations();
  checkNativeHelperStatus();
  setStatus(window.PowerPoint ? "PowerPoint 就绪" : "浏览器预览");
}

function migrateLegacyStorage() {
  Object.keys(STORE).forEach((key) => {
    if (localStorage.getItem(STORE[key]) !== null) return;
    const legacyValue = localStorage.getItem(LEGACY_STORE[key]);
    if (legacyValue !== null) localStorage.setItem(STORE[key], legacyValue);
  });
}

async function checkNativeHelperStatus() {
  const status = $("native-helper-status");
  if (!status) return;
  try {
    const result = await callNativeAssetApi("/api/native/status");
    status.classList.remove("error");
    status.textContent = result.powerPointInstalled
      ? "本地素材助手已就绪 · 保存与插入均使用 PowerPoint 原生对象"
      : "本地素材助手已启动，但未找到 Microsoft PowerPoint。";
  } catch (error) {
    status.classList.add("error");
    status.textContent = error.message || String(error);
  }
}

if (window.Office) {
  Office.onReady(() => window.setTimeout(boot, 0));
}
window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(boot, window.Office ? 1200 : 0);
});

function bindActions() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = actions[button.dataset.action];
      if (!action) return;
      button.disabled = true;
      try {
        await action();
        if (button.dataset.alignGroup) {
          document.querySelectorAll(`[data-align-group="${button.dataset.alignGroup}"]`)
            .forEach((item) => {
              const selected = item === button;
              item.classList.toggle("selected", selected);
              item.setAttribute("aria-pressed", String(selected));
            });
        }
      } catch (error) {
        console.error(error);
        notify(error.message || String(error), true);
      } finally {
        button.disabled = false;
      }
    });
  });

  $("asset-file").addEventListener("change", handleAssetFile);
  document.querySelectorAll("[data-palette-category]").forEach((button) => {
    button.addEventListener("click", () => {
      currentPaletteCategory = button.dataset.paletteCategory;
      currentClassicPaletteId = CLASSIC_PALETTES[currentPaletteCategory][0].id;
      selectedResearchColorIndex = 0;
      renderResearchPalette();
    });
  });
  $("palette-image-file").addEventListener("change", handlePaletteImage);
  $("figure-template").addEventListener("change", handleFigureTemplateChange);
  $("chart-type").addEventListener("change", handleChartTypeChange);
  $("chart-style").addEventListener("change", () => {
    applyChartStylePreset($("chart-style").value);
    refreshDefaultStyleLabel();
  });
  $("chart-save-default-style").addEventListener("click", saveChartDefaultStyle);
  $("chart-open-custom-color").addEventListener("click", () => {
    $("chart-custom-color-picker").value = chartSeriesColors[selectedChartSeriesColorIndex] || "#0072B2";
    $("chart-custom-color-picker").click();
  });
  $("chart-custom-color-picker").addEventListener("input", (event) => {
    assignChartSeriesColor(event.target.value);
  });
  $("chart-show-legend").addEventListener("change", refreshChartLegendControls);
  $("chart-label-mode").addEventListener("change", refreshChartLabelControls);
  $("chart-label-color-mode").addEventListener("change", refreshChartLabelColorMode);
  ["chart-show-bar-error", "chart-show-overlay-line", "chart-show-line-error"].forEach((id) => {
    $(id).addEventListener("change", () => {
      refreshBarErrorLineControls();
      renderChartSeriesColors();
      renderChartColorControls();
    });
  });
  $("chart-error-data-mode").addEventListener("change", () => switchChartDataMode("errorbar"));
  $("chart-combo-data-mode").addEventListener("change", () => switchChartDataMode("barerrorline"));
  ["chart-y-scale-mode", "chart-x-scale-mode", "chart-y2-scale-mode"].forEach((id) => {
    $(id).addEventListener("change", refreshChartScaleControls);
  });
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

function initializeFigureBuilder() {
  renderFigureTemplates("nature");
  applyFigureSettings(FIGURE_PRESETS.nature.settings);
  refreshFigureTemplateDeleteState();
}

function readFigureTemplates() {
  try {
    const templates = JSON.parse(localStorage.getItem(STORE.figureTemplates) || "[]");
    return Array.isArray(templates) ? templates : [];
  } catch {
    return [];
  }
}

function renderFigureTemplates(selectedValue) {
  const select = $("figure-template");
  if (!select) return;
  const builtIns = Object.entries(FIGURE_PRESETS).map(([id, preset]) => {
    const option = document.createElement("option");
    option.value = `preset:${id}`;
    option.textContent = preset.name;
    return option;
  });
  const custom = readFigureTemplates().map((template) => {
    const option = document.createElement("option");
    option.value = `custom:${template.id}`;
    option.textContent = template.name;
    return option;
  });
  select.replaceChildren(...builtIns, ...custom);
  const normalized = selectedValue?.includes(":") ? selectedValue : `preset:${selectedValue || "nature"}`;
  select.value = [...select.options].some((option) => option.value === normalized)
    ? normalized
    : "preset:nature";
  refreshFigureTemplateDeleteState();
}

function handleFigureTemplateChange() {
  const value = $("figure-template").value;
  if (value.startsWith("preset:")) {
    const preset = FIGURE_PRESETS[value.slice(7)];
    if (preset) applyFigureSettings(preset.settings);
  } else if (value.startsWith("custom:")) {
    const template = readFigureTemplates().find((item) => item.id === value.slice(7));
    if (template) {
      applyFigureSettings(template.settings);
      $("figure-template-name").value = template.name;
    }
  }
  refreshFigureTemplateDeleteState();
}

function refreshFigureTemplateDeleteState() {
  const button = document.querySelector('[data-action="deleteFigureTemplate"]');
  if (button && $("figure-template")) {
    button.disabled = !$("figure-template").value.startsWith("custom:");
  }
}

function applyFigureSettings(settings) {
  const values = {
    "grid-columns": settings.columns,
    "grid-width": settings.width,
    "grid-height": settings.height,
    "grid-gap-x": settings.gapX,
    "grid-gap-y": settings.gapY,
    "label-style": settings.labelStyle,
    "label-size": settings.labelSize,
    "label-offset-x": settings.labelOffsetX,
    "label-offset-y": settings.labelOffsetY,
    "figure-title-size": settings.titleSize,
    "caption-size": settings.captionSize,
    "caption-gap": settings.textGap,
    "caption-prefix": settings.prefix
  };
  Object.entries(values).forEach(([id, value]) => {
    if ($(id) && value !== undefined) $(id).value = value;
  });
  if ($("figure-preserve-aspect")) {
    $("figure-preserve-aspect").checked = settings.preserveAspect !== false;
  }
}

function currentFigureSettings() {
  const gap = Math.max(0, numVal("grid-gap-x", 10));
  return {
    columns: Math.max(1, intVal("grid-columns", 2)),
    width: Math.max(1, numVal("grid-width", 220)),
    height: Math.max(1, numVal("grid-height", 165)),
    gapX: gap,
    gapY: gap,
    preserveAspect: $("figure-preserve-aspect")?.checked !== false,
    labelStyle: $("label-style").value,
    labelSize: Math.max(6, numVal("label-size", 14)),
    labelOffsetX: numVal("label-offset-x", 0),
    labelOffsetY: Math.max(0, numVal("label-offset-y", 0)),
    titleSize: Math.max(6, numVal("figure-title-size", 14)),
    captionSize: Math.max(5, numVal("caption-size", 9)),
    textGap: Math.max(0, numVal("caption-gap", 8)),
    prefix: $("caption-prefix").value.trim() || "Figure"
  };
}

function saveFigureTemplate() {
  const templates = readFigureTemplates();
  const selectedId = $("figure-template").value.startsWith("custom:")
    ? $("figure-template").value.slice(7)
    : "";
  const existing = templates.find((item) => item.id === selectedId);
  const name = $("figure-template-name").value.trim()
    || existing?.name
    || `自定义期刊模板 ${templates.length + 1}`;
  const id = existing?.id || `figure-${Date.now()}`;
  const next = templates.filter((item) => item.id !== id);
  next.push({ id, name, settings: currentFigureSettings() });
  localStorage.setItem(STORE.figureTemplates, JSON.stringify(next));
  renderFigureTemplates(`custom:${id}`);
  $("figure-template-name").value = name;
  notify(`已保存模板：${name}`);
}

function deleteFigureTemplate() {
  const value = $("figure-template").value;
  if (!value.startsWith("custom:")) return;
  const id = value.slice(7);
  const templates = readFigureTemplates();
  const removed = templates.find((item) => item.id === id);
  localStorage.setItem(
    STORE.figureTemplates,
    JSON.stringify(templates.filter((item) => item.id !== id))
  );
  renderFigureTemplates("nature");
  applyFigureSettings(FIGURE_PRESETS.nature.settings);
  $("figure-template-name").value = "";
  notify(`已删除模板：${removed?.name || "自定义模板"}`);
  window.setTimeout(refreshFigureTemplateDeleteState, 0);
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
    const favorite = makePanelUtilityButton("favorite", "收藏模块", "panel-favorite-button");
    const collapse = makePanelUtilityButton("collapse", "收起模块", "panel-collapse-button");
    const up = makeOrderButton("up", "上移模块", () => movePanel(panel, -1));
    const down = makeOrderButton("down", "下移模块", () => movePanel(panel, 1));
    controls.append(favorite, collapse, up, down);
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

function makeOrderButton(icon, label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "order-button panel-move-button";
  setPanelButtonIcon(button, icon);
  button.title = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", handler);
  return button;
}

function makePanelUtilityButton(icon, label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `order-button ${className}`;
  setPanelButtonIcon(button, icon);
  button.title = label;
  button.setAttribute("aria-label", label);
  return button;
}

function setPanelButtonIcon(button, icon) {
  const paths = {
    favorite: '<path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z"/>',
    collapse: '<path d="m7 10 5 5 5-5"/>',
    expand: '<path d="m7 14 5-5 5 5"/>',
    up: '<path d="m7 11 5-5 5 5"/><path d="M12 6v12"/>',
    down: '<path d="m7 13 5 5 5-5"/><path d="M12 6v12"/>'
  };
  button.innerHTML = `<svg class="panel-control-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[icon]}</svg>`;
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
  renderToolOutline();
}

function savePanelOrder() {
  const order = [...document.querySelectorAll("main > .panel")]
    .map((panel) => panel.dataset.panelId);
  localStorage.setItem(STORE.panelOrder, JSON.stringify(order));
}

function updateOrderButtons() {
  const panels = [...document.querySelectorAll("main > .panel")];
  panels.forEach((panel, index) => {
    const orderButtons = [...panel.querySelectorAll(".order-button")]
      .filter((button) => !button.classList.contains("panel-favorite-button")
        && !button.classList.contains("panel-collapse-button"));
    if (orderButtons.length !== 2) return;
    orderButtons[0].disabled = index === 0;
    orderButtons[1].disabled = index === panels.length - 1;
  });
}

function initializePanelNavigator() {
  const panels = getPanels();
  const favorites = readStringList(STORE.panelFavorites);
  const collapsed = readStringList(STORE.panelCollapsed);

  panels.forEach((panel) => {
    const title = panelTitle(panel);
    panel.dataset.panelCategory = categoryForPanel(title).id;
    setPanelCollapsed(panel, collapsed.includes(panel.dataset.panelId), false);
    setPanelFavorite(panel, favorites.includes(panel.dataset.panelId), false, false);

    panel.querySelector(".panel-collapse-button")?.addEventListener("click", (event) => {
      event.stopPropagation();
      setPanelCollapsed(panel, !panel.classList.contains("panel-collapsed"));
    });
    panel.querySelector(".panel-favorite-button")?.addEventListener("click", (event) => {
      event.stopPropagation();
      setPanelFavorite(panel, !panel.classList.contains("panel-favorite"));
    });
    panel.querySelector(".panel-heading")?.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      setPanelCollapsed(panel, !panel.classList.contains("panel-collapsed"));
    });
  });

  $("tool-search-input")?.addEventListener("input", handlePanelSearch);
  $("tool-search-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") clearPanelSearch();
    if (event.key === "Enter") {
      const firstResult = $("tool-search-results")?.querySelector("[data-panel-target]");
      if (firstResult) navigateToPanel(firstResult.dataset.panelTarget);
    }
  });
  $("tool-search-clear")?.addEventListener("click", clearPanelSearch);
  $("tool-outline-open")?.addEventListener("click", openToolOutline);
  $("tool-outline-close")?.addEventListener("click", closeToolOutline);
  $("tool-outline-backdrop")?.addEventListener("click", closeToolOutline);
  $("expand-all-panels")?.addEventListener("click", () => setAllPanelsCollapsed(false));
  $("collapse-all-panels")?.addEventListener("click", () => setAllPanelsCollapsed(true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("tool-outline")?.hidden) closeToolOutline();
  });

  renderFavoriteShortcuts();
  renderToolOutline();
}

function getPanels() {
  return [...document.querySelectorAll("main > .panel")];
}

function panelTitle(panel) {
  return panel.querySelector("h2")?.textContent.trim() || panel.dataset.panelId;
}

function categoryForPanel(title) {
  return PANEL_CATEGORIES.find((category) => category.titles.includes(title))
    || { id: "other", label: "其他", titles: [] };
}

function readStringList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function setPanelCollapsed(panel, collapsed, persist = true) {
  panel.classList.toggle("panel-collapsed", collapsed);
  const button = panel.querySelector(".panel-collapse-button");
  if (button) {
    setPanelButtonIcon(button, collapsed ? "collapse" : "expand");
    button.title = collapsed ? "展开模块" : "收起模块";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-expanded", String(!collapsed));
  }
  if (persist) savePanelState(STORE.panelCollapsed, "panel-collapsed");
  updateOutlinePanelState(panel);
}

function setPanelFavorite(panel, favorite, persist = true, rerender = true) {
  panel.classList.toggle("panel-favorite", favorite);
  const button = panel.querySelector(".panel-favorite-button");
  if (button) {
    setPanelButtonIcon(button, "favorite");
    button.title = favorite ? "取消收藏" : "收藏模块";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(favorite));
  }
  if (persist) savePanelState(STORE.panelFavorites, "panel-favorite");
  if (rerender) {
    renderFavoriteShortcuts();
    renderToolOutline();
  }
}

function savePanelState(key, className) {
  const ids = getPanels()
    .filter((panel) => panel.classList.contains(className))
    .map((panel) => panel.dataset.panelId);
  localStorage.setItem(key, JSON.stringify(ids));
}

function setAllPanelsCollapsed(collapsed) {
  getPanels().forEach((panel) => setPanelCollapsed(panel, collapsed, false));
  savePanelState(STORE.panelCollapsed, "panel-collapsed");
  renderToolOutline();
}

function handlePanelSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  const resultBox = $("tool-search-results");
  $("tool-search-clear").hidden = !query;
  resultBox.replaceChildren();

  if (!query) {
    getPanels().forEach((panel) => panel.classList.remove("panel-search-hidden"));
    resultBox.hidden = true;
    return;
  }

  const matches = getPanels().filter((panel) => {
    const category = categoryForPanel(panelTitle(panel)).label;
    const content = `${panelTitle(panel)} ${category} ${panel.textContent}`.toLowerCase();
    const matched = content.includes(query);
    panel.classList.toggle("panel-search-hidden", !matched);
    return matched;
  });

  matches.forEach((panel) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tool-search-result";
    button.dataset.panelTarget = panel.dataset.panelId;
    const title = document.createElement("strong");
    title.textContent = panelTitle(panel);
    const category = document.createElement("span");
    category.textContent = categoryForPanel(panelTitle(panel)).label;
    button.append(title, category);
    button.addEventListener("click", () => navigateToPanel(panel.dataset.panelId));
    resultBox.appendChild(button);
  });

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "tool-search-empty";
    empty.textContent = "没有找到匹配模块";
    resultBox.appendChild(empty);
  }
  resultBox.hidden = false;
}

function clearPanelSearch() {
  const input = $("tool-search-input");
  if (input) input.value = "";
  $("tool-search-clear").hidden = true;
  $("tool-search-results").hidden = true;
  $("tool-search-results").replaceChildren();
  getPanels().forEach((panel) => panel.classList.remove("panel-search-hidden"));
}

function navigateToPanel(panelId) {
  const panel = getPanels().find((item) => item.dataset.panelId === panelId);
  if (!panel) return;
  clearPanelSearch();
  setPanelCollapsed(panel, false);
  closeToolOutline();
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  panel.classList.remove("panel-highlight");
  window.setTimeout(() => panel.classList.add("panel-highlight"), 20);
  window.setTimeout(() => panel.classList.remove("panel-highlight"), 1200);
}

function renderFavoriteShortcuts() {
  const container = $("favorite-shortcuts");
  if (!container) return;
  container.replaceChildren();
  const favorites = getPanels().filter((panel) => panel.classList.contains("panel-favorite"));
  container.hidden = !favorites.length;
  favorites.slice(0, 5).forEach((panel) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "favorite-shortcut";
    button.textContent = panelTitle(panel);
    button.addEventListener("click", () => navigateToPanel(panel.dataset.panelId));
    container.appendChild(button);
  });
}

function renderToolOutline() {
  const content = $("tool-outline-content");
  if (!content) return;
  content.replaceChildren();
  const panels = getPanels();
  const categories = [...PANEL_CATEGORIES];
  if (panels.some((panel) => panel.dataset.panelCategory === "other")) {
    categories.push({ id: "other", label: "其他", titles: [] });
  }

  categories.forEach((category) => {
    const categoryPanels = panels.filter((panel) => panel.dataset.panelCategory === category.id);
    if (!categoryPanels.length) return;
    const group = document.createElement("section");
    group.className = "tool-outline-group";
    const heading = document.createElement("h3");
    heading.textContent = category.label;
    group.appendChild(heading);
    categoryPanels.forEach((panel) => {
      const row = document.createElement("div");
      row.className = "tool-outline-row";
      row.classList.toggle("is-collapsed", panel.classList.contains("panel-collapsed"));
      row.dataset.outlinePanelId = panel.dataset.panelId;
      const link = document.createElement("button");
      link.type = "button";
      link.className = "tool-outline-link";
      link.textContent = panelTitle(panel);
      link.addEventListener("click", () => navigateToPanel(panel.dataset.panelId));
      const favorite = document.createElement("button");
      favorite.type = "button";
      favorite.className = "tool-outline-favorite";
      favorite.textContent = panel.classList.contains("panel-favorite") ? "★" : "☆";
      favorite.title = panel.classList.contains("panel-favorite") ? "取消收藏" : "收藏模块";
      favorite.setAttribute("aria-label", `${favorite.title}：${panelTitle(panel)}`);
      favorite.addEventListener("click", () => setPanelFavorite(panel, !panel.classList.contains("panel-favorite")));
      row.append(link, favorite);
      group.appendChild(row);
    });
    content.appendChild(group);
  });
}

function updateOutlinePanelState(panel) {
  const rows = $("tool-outline-content")?.querySelectorAll("[data-outline-panel-id]") || [];
  const row = [...rows].find((item) => item.dataset.outlinePanelId === panel.dataset.panelId);
  row?.classList.toggle("is-collapsed", panel.classList.contains("panel-collapsed"));
}

function openToolOutline() {
  renderToolOutline();
  $("tool-outline").hidden = false;
  $("tool-outline-backdrop").hidden = false;
  document.body.classList.add("outline-open");
  $("tool-outline-close")?.focus();
}

function closeToolOutline() {
  if (!$("tool-outline")) return;
  $("tool-outline").hidden = true;
  $("tool-outline-backdrop").hidden = true;
  document.body.classList.remove("outline-open");
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
    shapes.filter((shape) => supportsLineFormat(shape.type))
      .forEach((shape) => shape.lineFormat.load("color,transparency,visible,weight"));
    await context.sync();
    const metrics = shapes.map((shape) => ({
      ...shapeData(shape),
      border: supportsLineFormat(shape.type) ? captureBorderStyle(shape.lineFormat) : null
    }));
    localStorage.setItem(STORE.metrics, JSON.stringify({
      version: 3,
      copiedAt: new Date().toISOString(),
      metrics
    }));
    renderMetricsReference();
    notify(`已锁定 ${metrics.length} 个对象，可切换页面后直接应用`);
  });
}

async function pasteMetrics(options) {
  assertOffice();
  const { metrics } = readMetricsClipboard();
  if (!metrics.length) throw new Error("还没有复制过位置尺寸。");

  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    const matchMode = $("metrics-match-mode")?.value || "auto";
    const applyCount = matchMode === "first" || metrics.length === 1
      ? shapes.length
      : Math.min(shapes.length, metrics.length);
    shapes.slice(0, applyCount).forEach((shape, index) => {
      const metric = matchMode === "first" || metrics.length === 1 ? metrics[0] : metrics[index];
      if (options.position) {
        shape.left = metric.left;
        shape.top = metric.top;
      }
      if (options.size) {
        shape.width = metric.width;
        shape.height = metric.height;
      }
      if (options.border && metric.border && supportsLineFormat(shape.type)) {
        applyBorderStyle(shape.lineFormat, metric.border);
      }
    });
    await context.sync();
    const applied = options.position && options.size && options.border
      ? "位置、尺寸和边框"
      : options.position ? "位置"
        : options.size ? "尺寸" : "边框";
    const skipped = shapes.length - applyCount;
    notify(`已将${applied}应用到 ${applyCount} 个对象${skipped ? `，另有 ${skipped} 个未匹配` : ""}`);
  });
}

function initializeMetricsPanel() {
  renderMetricsReference();
  renderFormatStyleReference();
}

function readMetricsClipboard() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE.metrics) || "[]");
    if (Array.isArray(stored)) return { metrics: stored, copiedAt: "" };
    return {
      metrics: Array.isArray(stored?.metrics) ? stored.metrics : [],
      copiedAt: stored?.copiedAt || ""
    };
  } catch {
    return { metrics: [], copiedAt: "" };
  }
}

function clearMetrics() {
  localStorage.removeItem(STORE.metrics);
  renderMetricsReference();
  notify("已清除跨页基准");
}

function renderMetricsReference() {
  const panel = $("metrics-reference");
  const preview = $("metrics-preview");
  if (!panel || !preview) return;
  const { metrics, copiedAt } = readMetricsClipboard();
  const hasMetrics = metrics.length > 0;
  panel.classList.toggle("empty", !hasMetrics);
  $("metrics-status").classList.toggle("empty", !hasMetrics);
  $("metrics-status").textContent = hasMetrics ? `已锁定 ${metrics.length} 个` : "未设置";
  document.querySelectorAll("[data-metrics-apply]").forEach((button) => {
    button.disabled = !hasMetrics;
  });
  preview.replaceChildren();

  if (!hasMetrics) {
    $("metrics-summary").textContent = "尚未设置基准";
    $("metrics-detail").textContent = "先在幻灯片中选择一个或多个对象。";
    return;
  }

  const slideWidth = Math.max(960, ...metrics.map((item) => item.left + item.width));
  const slideHeight = Math.max(540, ...metrics.map((item) => item.top + item.height));
  metrics.slice(0, 12).forEach((metric, index) => {
    const box = document.createElement("span");
    box.className = "metrics-preview-box";
    box.style.left = `${Math.max(0, metric.left / slideWidth * 100)}%`;
    box.style.top = `${Math.max(0, metric.top / slideHeight * 100)}%`;
    box.style.width = `${Math.max(4, metric.width / slideWidth * 100)}%`;
    box.style.height = `${Math.max(7, metric.height / slideHeight * 100)}%`;
    box.textContent = String(index + 1);
    preview.appendChild(box);
  });

  const first = metrics[0];
  $("metrics-summary").textContent = metrics.length === 1
    ? first.name || "1 个对象"
    : `${metrics.length} 个对象 · 按顺序记录`;
  const border = first.border ? " · 含边框" : "";
  const dimensions = `X ${formatMetric(first.left)} · Y ${formatMetric(first.top)} · W ${formatMetric(first.width)} · H ${formatMetric(first.height)} pt${border}`;
  const time = copiedAt ? ` · ${formatMetricsTime(copiedAt)}` : "";
  $("metrics-detail").textContent = metrics.length === 1
    ? `${dimensions}${time}`
    : `首个对象：${dimensions}${time}`;
}

function formatMetric(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function formatMetricsTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function captureBorderStyle(lineFormat) {
  return compactStyleObject({
    color: lineFormat.color,
    transparency: lineFormat.transparency,
    visible: lineFormat.visible,
    weight: lineFormat.weight
  });
}

function applyBorderStyle(lineFormat, border) {
  if (typeof border.visible === "boolean") lineFormat.visible = border.visible;
  if (border.color) lineFormat.color = border.color;
  const weight = Number(border.weight);
  if (Number.isFinite(weight) && weight >= 0 && weight <= 1584) {
    lineFormat.weight = weight;
  }
  const transparency = Number(border.transparency);
  if (Number.isFinite(transparency) && transparency >= 0 && transparency <= 100) {
    lineFormat.transparency = transparency;
  }
}

async function copyFormatStyle() {
  assertOffice();
  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    if (shapes.length !== 1) throw new Error("复制样式时请只选中 1 个基准对象。");
    const shape = shapes[0];
    const canText = supportsTextFrame(shape.type);
    if (!canText) throw new Error("请选择一个文本框作为文字格式基准。");
    shape.textFrame.load("hasText");
    await context.sync();
    if (!shape.textFrame.hasText) throw new Error("基准文本框中没有文字。");
    let text = null;
    if (shape.textFrame.hasText) {
      const range = shape.textFrame.textRange;
      range.load("text");
      await context.sync();
      if (range.text.length) {
        const sampleIndex = Math.max(0, range.text.search(/\S/));
        const sample = range.getSubstring(sampleIndex, 1);
        sample.font.load("bold,color,italic,name,size");
        sample.paragraphFormat.load("horizontalAlignment");
        await context.sync();
        text = {
          font: compactStyleObject({
            bold: sample.font.bold,
            color: sample.font.color,
            italic: sample.font.italic,
            name: sample.font.name,
            size: validFontSize(sample.font.size)
          }),
          paragraph: compactStyleObject({
            horizontalAlignment: sample.paragraphFormat.horizontalAlignment
          })
        };
      }
    }

    const style = {
      version: 3,
      copiedAt: new Date().toISOString(),
      source: { name: shape.name, type: shape.type },
      text
    };
    if (!text) throw new Error("没有读取到可复制的文字格式。");
    localStorage.setItem(STORE.formatStyle, JSON.stringify(style));
    renderFormatStyleReference();
    notify("样式已复制，可多选对象后一键应用");
  });
}

async function applyFormatStyle() {
  assertOffice();
  const style = readFormatStyle();
  if (!style) throw new Error("还没有复制过样式。");

  await PowerPoint.run(async (context) => {
    const shapes = await selectedShapes(context);
    shapes.filter((shape) => supportsTextFrame(shape.type))
      .forEach((shape) => shape.textFrame.load("hasText"));
    await context.sync();

    let applied = 0;
    shapes.forEach((shape) => {
      if (style.text?.font && supportsTextFrame(shape.type) && shape.textFrame.hasText) {
        applyExactTextStyle(shape.textFrame, style.text);
        applied += 1;
      }
    });
    await context.sync();
    if (!applied) throw new Error("当前所选对象不支持已复制的样式。");
    notify(`已将样式应用到 ${applied} 个对象的完整内容`);
  });
}

function applyExactTextStyle(textFrame, textStyle) {
  const font = textStyle?.font || {};
  const range = textFrame.textRange;
  // PowerPoint may visually shrink text to fit a box after setting font.size.
  // Disable that behavior first so the copied point size remains exact.
  textFrame.autoSizeSetting = "AutoSizeNone";
  if (font.name) range.font.name = font.name;
  if (font.color) range.font.color = font.color;
  if (typeof font.bold === "boolean") range.font.bold = font.bold;
  if (typeof font.italic === "boolean") range.font.italic = font.italic;
  const size = validFontSize(font.size);
  if (size) range.font.size = size;
  if (textStyle.paragraph?.horizontalAlignment) {
    range.paragraphFormat.horizontalAlignment = textStyle.paragraph.horizontalAlignment;
  }
}

function validFontSize(value) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 && size <= 400 ? size : null;
}

function compactStyleObject(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null)
  );
}

function readFormatStyle() {
  try {
    const style = JSON.parse(localStorage.getItem(STORE.formatStyle) || "null");
    return style && typeof style === "object" ? normalizeFormatStyle(style) : null;
  } catch {
    return null;
  }
}

function normalizeFormatStyle(style) {
  const font = compactStyleObject({
    bold: style.text?.font?.bold,
    color: style.text?.font?.color,
    italic: style.text?.font?.italic,
    name: style.text?.font?.name,
    size: validFontSize(style.text?.font?.size)
  });
  return {
    version: 3,
    copiedAt: style.copiedAt,
    source: style.source,
    text: style.text
      ? {
          font,
          paragraph: compactStyleObject({
            horizontalAlignment: style.text.paragraph?.horizontalAlignment
          })
        }
      : null
  };
}

function clearFormatStyle() {
  localStorage.removeItem(STORE.formatStyle);
  renderFormatStyleReference();
  notify("已清除格式刷样式");
}

function renderFormatStyleReference() {
  const reference = $("format-painter-reference");
  if (!reference) return;
  const style = readFormatStyle();
  const hasStyle = Boolean(style);
  reference.classList.toggle("empty", !hasStyle);
  $("format-painter-status").classList.toggle("empty", !hasStyle);
  $("format-painter-status").textContent = hasStyle ? "样式已就绪" : "未复制";
  document.querySelectorAll("[data-format-apply]").forEach((button) => {
    button.disabled = !hasStyle;
  });

  if (!hasStyle) {
    $("format-painter-summary").textContent = "尚未复制样式";
    $("format-painter-detail").textContent = "会应用到整个文本框，不会只改一个字。";
    $("format-painter-swatch").removeAttribute("style");
    return;
  }

  const font = style.text?.font || {};
  const fillColor = "#FFFFFF";
  const fontColor = normalizeHex(font.color) || "#17211F";
  const swatch = $("format-painter-swatch");
  swatch.style.background = fillColor;
  swatch.style.color = fontColor;
  swatch.style.fontFamily = font.name || "inherit";
  swatch.style.fontWeight = font.bold ? "800" : "500";
  swatch.style.fontStyle = font.italic ? "italic" : "normal";

  $("format-painter-summary").textContent = style.source?.name || "已复制对象样式";
  $("format-painter-detail").textContent = `文字 · ${font.name || "默认字体"}${font.size ? ` ${formatMetric(font.size)} pt` : ""}`;
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

async function buildFigure(withAnnotations) {
  assertOffice();
  const settings = currentFigureSettings();
  const figureNumber = Math.max(1, intVal("caption-start", 1));
  const titleDetail = $("figure-title").value.trim();
  const captionDetail = $("figure-caption").value.trim();
  const addLabels = withAnnotations && $("figure-add-labels").checked;
  const addTitle = withAnnotations && $("figure-add-title").checked;
  const addCaption = withAnnotations && $("figure-add-caption").checked;

  await PowerPoint.run(async (context) => {
    const slide = context.presentation.getSelectedSlides().getItemAt(0);
    const shapes = await selectedShapes(context);
    if (shapes.length < 2) throw new Error("请至少选中两张图片。");

    const ordered = sortShapesReadingOrder(shapes);
    const rows = Math.ceil(ordered.length / settings.columns);
    const labelHeight = addLabels ? Math.max(22, settings.labelSize + 8) : 0;
    const labelBand = addLabels ? labelHeight + settings.labelOffsetY + 4 : 0;
    const rowHeight = labelBand + settings.height;
    const figureWidth = Math.min(settings.columns, ordered.length) * settings.width
      + Math.max(0, Math.min(settings.columns, ordered.length) - 1) * settings.gapX;
    const figureHeight = rows * rowHeight + Math.max(0, rows - 1) * settings.gapY;
    const titleHeight = Math.max(22, settings.titleSize + 10);
    const sourceLeft = Math.min(...ordered.map((shape) => shape.left));
    const sourceTop = Math.min(...ordered.map((shape) => shape.top));
    const anchorLeft = sourceLeft;
    const anchorTop = addTitle && sourceTop < titleHeight + settings.textGap + 6
      ? titleHeight + settings.textGap + 6
      : sourceTop;

    ordered.forEach((shape, index) => {
      const col = index % settings.columns;
      const row = Math.floor(index / settings.columns);
      const cellLeft = anchorLeft + col * (settings.width + settings.gapX);
      const rowTop = anchorTop + row * (rowHeight + settings.gapY);
      const imageTop = rowTop + labelBand;
      const fitted = fitShapeToCell(shape, settings.width, settings.height, settings.preserveAspect);
      shape.width = fitted.width;
      shape.height = fitted.height;
      shape.left = cellLeft + (settings.width - fitted.width) / 2;
      shape.top = imageTop + (settings.height - fitted.height) / 2;

      if (addLabels) {
        const label = slide.shapes.addTextBox(formatLabel(settings.labelStyle, index), {
          left: cellLeft + settings.labelOffsetX,
          top: rowTop + settings.labelOffsetY,
          width: Math.max(34, Math.min(settings.width, settings.labelSize * 2.8)),
          height: labelHeight
        });
        styleText(label, {
          size: settings.labelSize,
          name: "Arial",
          color: "#17211F",
          bold: true
        });
      }
    });

    const figureId = `${settings.prefix} ${figureNumber}`;
    if (addTitle) {
      const titleText = titleDetail ? `${figureId}. ${titleDetail}` : figureId;
      const title = slide.shapes.addTextBox(titleText, {
        left: anchorLeft,
        top: Math.max(4, anchorTop - titleHeight - settings.textGap),
        width: figureWidth,
        height: titleHeight
      });
      styleText(title, {
        size: settings.titleSize,
        name: "Arial",
        color: "#17211F",
        bold: true,
        align: "Left"
      });
    }

    if (addCaption) {
      const labelRange = ordered.length > 1
        ? `${formatLabel("A", 0)}–${formatLabel("A", ordered.length - 1)}`
        : formatLabel("A", 0);
      const detail = captionDetail || `(${labelRange}) 请补充分图说明。`;
      const captionText = `${figureId}. ${detail}`;
      const captionHeight = Math.max(
        28,
        Math.ceil(captionText.length / Math.max(28, figureWidth / (settings.captionSize * 0.62)))
          * (settings.captionSize + 5)
      );
      const caption = slide.shapes.addTextBox(captionText, {
        left: anchorLeft,
        top: anchorTop + figureHeight + settings.textGap,
        width: figureWidth,
        height: captionHeight
      });
      styleText(caption, {
        size: settings.captionSize,
        name: "Arial",
        color: "#17211F",
        align: "Left"
      });
    }

    await context.sync();
    const additions = [
      addLabels ? `${ordered.length} 个标签` : "",
      addTitle ? "整图标题" : "",
      addCaption ? "图注" : ""
    ].filter(Boolean);
    notify(
      withAnnotations
        ? `Figure 已完成：${additions.join("、") || "图片排版"}`
        : `已统一整理 ${ordered.length} 张图片`
    );
  });
}

function sortShapesReadingOrder(shapes) {
  if (shapes.length < 2) return [...shapes];
  const averageHeight = shapes.reduce((sum, shape) => sum + shape.height, 0) / shapes.length;
  const rowTolerance = Math.max(8, averageHeight * 0.35);
  return [...shapes].sort((a, b) => {
    if (Math.abs(a.top - b.top) <= rowTolerance) return a.left - b.left;
    return a.top - b.top;
  });
}

function fitShapeToCell(shape, cellWidth, cellHeight, preserveAspect = true) {
  const sourceWidth = Math.max(1, Number(shape.width) || cellWidth);
  const sourceHeight = Math.max(1, Number(shape.height) || cellHeight);
  if (!preserveAspect) return { width: cellWidth, height: cellHeight };
  const scale = Math.min(cellWidth / sourceWidth, cellHeight / sourceHeight);
  return {
    width: Math.max(1, sourceWidth * scale),
    height: Math.max(1, sourceHeight * scale)
  };
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
      if (kind === "right") shape.left = anchor.left + anchor.width - shape.width;
      if (kind === "middle") shape.top = anchor.top + anchor.height / 2 - shape.height / 2;
      if (kind === "bottom") shape.top = anchor.top + anchor.height - shape.height;
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

const CLASSIC_PALETTES = {
  research: [
    {
      id: "soft-science",
      name: "柔和多色科研",
      note: "散点图、热图、趋势图",
      colors: ["#FCE8E6", "#FFC6BC", "#F8B9B8", "#D6DFEF", "#A5CDE2", "#5FA3CB", "#668FCA", "#C9CEFE", "#66A8CD", "#006BAD"]
    },
    {
      id: "ecology",
      name: "生态环境",
      note: "生态、气候与地理图表",
      colors: ["#F0766A", "#F6A69A", "#1F8FAE", "#56B9CF", "#BFE6EA", "#F7D8B8", "#D9E2EB", "#F2F2F2"]
    },
    {
      id: "geology",
      name: "地学图表",
      note: "分区、聚类与多变量图",
      colors: ["#E0B82F", "#218781", "#DFA3A5", "#7C5E98", "#248B3C", "#2272B2", "#DA7624"]
    },
    {
      id: "nature",
      name: "Nature 经典",
      note: "高区分度期刊配色",
      colors: ["#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F", "#8491B4", "#91D1C2", "#DC0000"]
    },
    {
      id: "science",
      name: "Science 经典",
      note: "深色、稳重、对比鲜明",
      colors: ["#3B4992", "#EE0000", "#008B45", "#631879", "#008280", "#BB0021", "#5F559B", "#A20056"]
    },
    {
      id: "colorblind",
      name: "色盲安全",
      note: "适合报告与论文打印",
      colors: ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#D55E00", "#56B4E9", "#F0E442"]
    }
  ],
  atmosphere: [
    {
      id: "winter-sky",
      name: "冬日冰蓝",
      note: "清冷、理性",
      colors: ["#4C78A3", "#71AACE", "#6FB5CF", "#A6C8F3"]
    },
    {
      id: "twilight-rose",
      name: "暮色玫瑰",
      note: "克制、优雅",
      colors: ["#44516D", "#A8868C", "#B5A4B4", "#D3BCB6"]
    },
    {
      id: "city-sunset",
      name: "都市晚霞",
      note: "沉静、温柔",
      colors: ["#37516C", "#9C8CA6", "#D3889C", "#F69D92"]
    },
    {
      id: "coastal-evening",
      name: "海岸暮光",
      note: "深海与暖沙",
      colors: ["#304771", "#4C779E", "#83ADB4", "#E3C49E"]
    },
    {
      id: "coral-breeze",
      name: "珊瑚海风",
      note: "轻快、明亮",
      colors: ["#16939E", "#F9958E", "#A8D8D6", "#E1D1C8"]
    },
    {
      id: "peach-mist",
      name: "柔杏薄雾",
      note: "柔和、低饱和",
      colors: ["#B1979E", "#F6C4B1", "#DCDDE9", "#E8D9DA"]
    },
    {
      id: "misty-rose",
      name: "雾海玫瑰",
      note: "成熟、复古",
      colors: ["#5D6E7D", "#7797B2", "#D88B8B", "#A5ACA5"]
    },
    {
      id: "soft-triad",
      name: "柔光三色",
      note: "蓝、绿、雾紫",
      colors: ["#7581B3", "#9ECBA8", "#E1DFE8"]
    },
    {
      id: "rose-triad",
      name: "玫瑰三色",
      note: "灰紫、豆沙、藕粉",
      colors: ["#E1DFE8", "#D68283", "#B37990"]
    },
    {
      id: "blue-rose-triad",
      name: "蓝玫瑰三色",
      note: "雾蓝与珊瑚",
      colors: ["#E1DFE8", "#8BA3C7", "#D68283"]
    }
  ],
  traditional: [
    {
      id: "water-sakura",
      name: "水绿 · 樱草",
      note: "清润与柔雅",
      colors: [
        { name: "水绿", hex: "#8CC269", rgb: "140, 194, 105" },
        { name: "樱草", hex: "#BC84A8", rgb: "188, 132, 168" }
      ]
    },
    {
      id: "dust-sky",
      name: "尘灰 · 穹灰",
      note: "古朴与清寂",
      colors: [
        { name: "尘灰", hex: "#B6A476", rgb: "182, 164, 118" },
        { name: "穹灰", hex: "#C4D7D6", rgb: "196, 215, 214" }
      ]
    },
    {
      id: "wisteria-stone",
      name: "藤萝 · 石绿",
      note: "雅紫与青碧",
      colors: [
        { name: "藤萝", hex: "#8076A3", rgb: "128, 118, 163" },
        { name: "石绿", hex: "#57C3C2", rgb: "87, 195, 194" }
      ]
    },
    {
      id: "autumn-cheek",
      name: "秋波 · 颊红",
      note: "水蓝与浅绯",
      colors: [
        { name: "秋波", hex: "#8ABCD1", rgb: "138, 188, 209" },
        { name: "颊红", hex: "#EEAA99", rgb: "238, 170, 153" }
      ]
    },
    {
      id: "garden-camellia",
      name: "田园 · 茶花",
      note: "新绿与明红",
      colors: [
        { name: "田园", hex: "#68B88E", rgb: "104, 184, 142" },
        { name: "茶花", hex: "#EE3F4D", rgb: "238, 63, 77" }
      ]
    },
    {
      id: "indigo-lemon",
      name: "靛青 · 柠檬",
      note: "深蓝与亮黄",
      colors: [
        { name: "靛青", hex: "#165EAB", rgb: "22, 94, 171" },
        { name: "柠檬", hex: "#FCD337", rgb: "252, 211, 55" }
      ]
    }
  ]
};

function paletteColorHex(color) {
  return typeof color === "string" ? color : color.hex;
}

function paletteColorName(color, index) {
  return typeof color === "string" ? `颜色 ${index + 1}` : color.name;
}

function activeResearchPalette() {
  if (currentClassicPaletteId === "extracted" && extractedResearchPalette.length) {
    return {
      id: "extracted",
      name: "图片提取结果",
      note: "从论文图片自动识别",
      colors: extractedResearchPalette
    };
  }
  const palettes = CLASSIC_PALETTES[currentPaletteCategory] || CLASSIC_PALETTES.research;
  return palettes.find((palette) => palette.id === currentClassicPaletteId) || palettes[0];
}

function renderResearchPalette() {
  const palette = activeResearchPalette();
  const gallery = $("classic-palette-gallery");
  const container = $("research-palette-preview");
  const meta = $("research-palette-meta");
  if (!gallery || !container || !meta) return;
  document.querySelectorAll("[data-palette-category]").forEach((button) => {
    const active = button.dataset.paletteCategory === currentPaletteCategory;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $("palette-image-tools").hidden = currentPaletteCategory !== "research";

  const palettes = [...CLASSIC_PALETTES[currentPaletteCategory]];
  if (currentPaletteCategory === "research" && extractedResearchPalette.length) {
    palettes.push({
      id: "extracted",
      name: "图片提取结果",
      note: "从论文图片自动识别",
      colors: extractedResearchPalette
    });
  }
  gallery.innerHTML = "";
  palettes.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `classic-palette-card${item.id === palette.id ? " selected" : ""}`;
    card.setAttribute("aria-label", `选择配色 ${item.name}`);
    const strip = document.createElement("span");
    strip.className = "classic-palette-strip";
    item.colors.forEach((color, index) => {
      const chip = document.createElement("i");
      chip.style.background = paletteColorHex(color);
      chip.title = `${paletteColorName(color, index)} ${paletteColorHex(color)}`;
      strip.appendChild(chip);
    });
    const title = document.createElement("strong");
    title.textContent = item.name;
    const note = document.createElement("small");
    note.textContent = item.note;
    card.append(strip, title, note);
    card.addEventListener("click", () => {
      currentClassicPaletteId = item.id;
      selectedResearchColorIndex = 0;
      renderResearchPalette();
    });
    gallery.appendChild(card);
  });

  selectedResearchColorIndex = Math.min(selectedResearchColorIndex, palette.colors.length - 1);
  container.innerHTML = "";
  palette.colors.forEach((color, index) => {
    const hex = paletteColorHex(color);
    const name = paletteColorName(color, index);
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `research-color${index === selectedResearchColorIndex ? " selected" : ""}`;
    swatch.style.background = hex;
    swatch.title = `${name} ${hex}`;
    swatch.setAttribute("aria-label", `${name} ${hex}`);
    swatch.addEventListener("click", () => {
      selectedResearchColorIndex = index;
      renderResearchPalette();
      notify(`已选择 ${name} ${hex}`);
    });
    if (typeof color !== "string") {
      const label = document.createElement("span");
      label.textContent = color.name;
      swatch.appendChild(label);
    }
    container.appendChild(swatch);
  });
  const selected = palette.colors[selectedResearchColorIndex];
  const selectedName = paletteColorName(selected, selectedResearchColorIndex);
  const selectedHex = paletteColorHex(selected);
  const rgb = typeof selected === "string" ? "" : ` · RGB ${selected.rgb}`;
  meta.innerHTML = `${palette.name} · 已选择 <strong>${selectedName} ${selectedHex}</strong>${rgb}`;
  if ($("chart-color-library")) renderChartColorLibrary();
}

function choosePaletteImage() {
  $("palette-image-file").click();
}

async function handlePaletteImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    notify("请选择 PNG、JPG 或 WebP 图片。", true);
    event.target.value = "";
    return;
  }
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(imageUrl);
    extractedResearchPalette = extractImagePalette(image, 6);
    if (!extractedResearchPalette.length) {
      throw new Error("没有识别到足够明显的数据颜色，请换一张颜色更清晰的图片。");
    }
    if (paletteImageUrl) URL.revokeObjectURL(paletteImageUrl);
    paletteImageUrl = imageUrl;
    $("palette-image-preview").src = paletteImageUrl;
    $("palette-image-preview").closest(".image-palette-row")?.classList.add("has-image");
    currentPaletteCategory = "research";
    currentClassicPaletteId = "extracted";
    selectedResearchColorIndex = 0;
    renderResearchPalette();
    notify(`已从图片提取 ${extractedResearchPalette.length} 个颜色`);
  } catch (error) {
    URL.revokeObjectURL(imageUrl);
    notify(error.message || String(error), true);
  } finally {
    event.target.value = "";
  }
}

function extractImagePalette(image, colorCount = 6) {
  const maxSide = 140;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const colored = [];
  const fallback = [];
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 200) continue;
    const pixel = [data[index], data[index + 1], data[index + 2]];
    const max = Math.max(...pixel);
    const min = Math.min(...pixel);
    if (max > 246 && min > 246) continue;
    if (max < 28) continue;
    fallback.push(pixel);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation >= 0.16 && max - min >= 22) colored.push(pixel);
  }
  const pixels = colored.length >= colorCount * 30 ? colored : fallback;
  if (!pixels.length) return [];
  const clusters = clusterRgbPixels(pixels, Math.min(colorCount, pixels.length));
  return clusters
    .sort((a, b) => (b.count * (0.55 + b.saturation)) - (a.count * (0.55 + a.saturation)))
    .map((cluster) => rgbToHex(cluster.rgb))
    .filter((color, index, colors) =>
      colors.findIndex((other) => colorDistance(hexToRgb(color), hexToRgb(other)) < 34) === index
    )
    .slice(0, colorCount);
}

function clusterRgbPixels(pixels, count) {
  const step = Math.max(1, Math.floor(pixels.length / 3500));
  const samples = pixels.filter((_, index) => index % step === 0);
  const centers = [samples[Math.floor(samples.length / 2)]];
  while (centers.length < count) {
    let candidate = samples[0];
    let farthest = -1;
    samples.forEach((pixel) => {
      const distance = Math.min(...centers.map((center) => colorDistance(pixel, center)));
      if (distance > farthest) {
        farthest = distance;
        candidate = pixel;
      }
    });
    centers.push(candidate);
  }

  let assignments = [];
  for (let iteration = 0; iteration < 8; iteration += 1) {
    assignments = centers.map(() => ({ sum: [0, 0, 0], count: 0 }));
    samples.forEach((pixel) => {
      let nearest = 0;
      let best = Infinity;
      centers.forEach((center, index) => {
        const distance = colorDistance(pixel, center);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      const group = assignments[nearest];
      group.sum[0] += pixel[0];
      group.sum[1] += pixel[1];
      group.sum[2] += pixel[2];
      group.count += 1;
    });
    assignments.forEach((group, index) => {
      if (!group.count) return;
      centers[index] = group.sum.map((value) => Math.round(value / group.count));
    });
  }

  return centers.map((rgb, index) => {
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    return {
      rgb,
      count: assignments[index]?.count || 0,
      saturation: max === 0 ? 0 : (max - min) / max
    };
  });
}

function colorDistance(a, b) {
  const left = Array.isArray(a) ? { r: a[0], g: a[1], b: a[2] } : a;
  const right = Array.isArray(b) ? { r: b[0], g: b[1], b: b[2] } : b;
  return Math.sqrt(
    (left.r - right.r) ** 2 +
    (left.g - right.g) ** 2 +
    (left.b - right.b) ** 2
  );
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => Math.max(0, Math.min(255, Math.round(value)))
    .toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

async function applyResearchPalette() {
  assertOffice();
  const activePalette = activeResearchPalette();
  const palette = activePalette.colors.map(paletteColorHex);
  const target = $("research-color-target").value;
  const order = $("research-color-order").value;
  let applied = 0;

  await PowerPoint.run(async (context) => {
    const shapes = (await selectedShapes(context)).sort((a, b) => a.left - b.left || a.top - b.top);
    if (target === "text") {
      shapes.filter((shape) => supportsTextFrame(shape.type))
        .forEach((shape) => shape.textFrame.load("hasText"));
      await context.sync();
    }
    shapes.forEach((shape, index) => {
      if (order === "sequence" && index >= palette.length) return;
      const colorIndex = order === "selected" ? selectedResearchColorIndex : index % palette.length;
      const color = palette[colorIndex];
      if (target === "fill" && supportsFill(shape.type)) {
        shape.fill.setSolidColor(color);
        applied += 1;
      } else if (target === "line" && supportsLineFormat(shape.type)) {
        shape.lineFormat.color = color;
        shape.lineFormat.visible = true;
        applied += 1;
      } else if (target === "text" && supportsTextFrame(shape.type) && shape.textFrame.hasText) {
        shape.textFrame.textRange.font.color = color;
        applied += 1;
      }
    });
    await context.sync();
  });

  if (!applied) throw new Error("选中对象不支持当前应用方式。");
  const selectedColor = palette[selectedResearchColorIndex];
  notify(order === "selected"
    ? `已将 ${selectedColor} 应用到 ${applied} 个对象`
    : `已将 ${activePalette.name} 应用到 ${applied} 个对象`);
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
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `easyppt-chart-${dateStamp()}.svg`);
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
    text("EasyPPT · RESEARCH PRESENTATION", 732, 488, 176, 18, { size: 7, color: palette.muted, align: "Right" });
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
  const id = crypto.randomUUID();
  notify("正在调用 PowerPoint 原生复制…");
  const result = await callNativeAssetApi("/api/native/assets/save", {
    method: "POST",
    body: JSON.stringify({ id, name })
  });
  const assets = readAssets();
  assets.unshift({
    id,
    name,
    createdAt: new Date().toISOString(),
    formatVersion: 3,
    native: true,
    objectCount: result.objectCount || 1,
    clipboardTypeCount: result.typeCount || 0,
    previewUrl: result.previewUrl || null
  });
  localStorage.setItem(STORE.assets, JSON.stringify(assets.slice(0, 60)));
  renderAssets();
  notify(`已原生保存：${name}`);
}

async function insertAsset(assetId) {
  assertOffice();
  const asset = readAssets().find((item) => item.id === assetId);
  if (!asset) return;
  if (!asset.native) {
    throw new Error("这是旧版重建素材，无法保证原样恢复。请删除后重新选择原对象保存。");
  }
  notify("正在通过 PowerPoint 原生粘贴…");
  await callNativeAssetApi(`/api/native/assets/${asset.id}/insert`, {
    method: "POST"
  });
  notify(`已原样插入：${asset.name}`);
}

function exportAssets() {
  const filename = `easyppt-assets-${dateStamp()}.json`;
  const blob = new Blob([JSON.stringify(readAssets(), null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
  localStorage.setItem(STORE.assetExport, JSON.stringify({
    filename,
    exportedAt: new Date().toISOString(),
    count: readAssets().length
  }));
  renderAssetExportSummary();
  notify(`素材索引已导出；原生对象数据仍保存在本机 .native-assets：${filename}`);
}

function importAssets() {
  $("asset-file").click();
}

async function handleAssetFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const incoming = JSON.parse(await file.text());
  if (!Array.isArray(incoming)) throw new Error("素材文件格式不正确。");
  if (incoming.some((asset) => asset.native)) {
    throw new Error("JSON 只包含原生素材索引，不能单独迁移对象数据。请同时复制 .native-assets 文件夹。");
  }
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
  $("asset-shape-count").textContent = String(assets.reduce(
    (sum, asset) => sum + (asset.objectCount || asset.shapes?.length || 0),
    0
  ));
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
    shapeCount.textContent = `${asset.objectCount || asset.shapes?.length || 0} 个对象`;
    const textCount = (asset.shapes || []).filter((shape) => shape.text).length;
    meta.append(shapeCount);
    if (asset.native) {
      const nativeBadge = document.createElement("span");
      nativeBadge.className = "asset-badge";
      nativeBadge.textContent = "PowerPoint 原生";
      meta.append(nativeBadge);
    }
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
    remove.addEventListener("click", async () => {
      try {
        if (asset.native) {
          await callNativeAssetApi(`/api/native/assets/${asset.id}`, { method: "DELETE" });
        }
        localStorage.setItem(STORE.assets, JSON.stringify(readAssets().filter((x) => x.id !== asset.id)));
        renderAssets();
      } catch (error) {
        notify(error.message || String(error), true);
      }
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
  if (asset.native) {
    if (asset.previewUrl) {
      const image = document.createElement("img");
      image.src = asset.previewUrl;
      image.alt = "";
      image.loading = "lazy";
      preview.classList.add("native-preview");
      preview.appendChild(image);
    } else {
      preview.classList.add("native-preview", "native-preview-empty");
      preview.textContent = "PPT";
    }
    return preview;
  }
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
    if (shape.geometryType) {
      node.classList.add(`geometry-${shape.geometryType.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`);
    }
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
  const filename = record?.filename || `easyppt-assets-${dateStamp()}.json`;
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

async function callNativeAssetApi(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error("无法连接本地素材助手，请重启 EasyPPT 本地服务。");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "本地素材助手操作失败。");
  }
  return result;
}

async function analyzeSmartAnimation() {
  assertOffice();
  const snapshot = await collectAnimationSnapshot();
  currentAnimationPlan = buildSmartAnimationPlan(snapshot, readAnimationSettings());
  renderAnimationPlan(currentAnimationPlan);
  notify(`已分析 ${currentAnimationPlan.effects.length} 个对象`);
  return currentAnimationPlan;
}

async function applySmartAnimation() {
  const plan = await analyzeSmartAnimation();
  if (!plan.effects.length) {
    throw new Error("当前范围内没有适合添加动画的对象。");
  }
  const result = await callNativeAssetApi("/api/native/animations/apply", {
    method: "POST",
    body: JSON.stringify({
      effects: plan.effects.map(({ name, effect, trigger, duration }) => ({
        name,
        effect,
        trigger,
        duration
      })),
      transition: plan.transition,
      replaceExisting: $("animation-existing").value === "replace"
    })
  });
  const limited = result.limitedCount ? `，为稳定性暂缓 ${result.limitedCount} 个次要对象` : "";
  notify(`已安全添加 ${result.appliedCount} 个动画${result.skippedCount ? `，跳过 ${result.skippedCount} 个` : ""}${limited}`);
}

function readAnimationSettings() {
  return {
    style: $("animation-style").value,
    scope: $("animation-scope").value,
    neighbors: $("animation-neighbors").value,
    includeDecorations: $("animation-decorations").checked,
    addTransition: $("animation-transition").checked
  };
}

async function collectAnimationSnapshot() {
  const settings = readAnimationSettings();
  return PowerPoint.run(async (context) => {
    const presentation = context.presentation;
    const selectedSlide = presentation.getSelectedSlides().getItemAt(0);
    const slides = presentation.slides;
    selectedSlide.load("id");
    slides.load("items/id");
    await context.sync();

    const currentIndex = slides.items.findIndex((slide) => slide.id === selectedSlide.id);
    if (currentIndex < 0) throw new Error("无法定位当前幻灯片。");

    const neighborIndexes = new Set([currentIndex]);
    if ((settings.neighbors === "both" || settings.neighbors === "previous") && currentIndex > 0) {
      neighborIndexes.add(currentIndex - 1);
    }
    if ((settings.neighbors === "both" || settings.neighbors === "next") && currentIndex < slides.items.length - 1) {
      neighborIndexes.add(currentIndex + 1);
    }

    const requestedSlides = [...neighborIndexes].map((index) => ({
      index,
      shapes: slides.items[index].shapes
    }));
    requestedSlides.forEach(({ shapes }) => {
      shapes.load("items/id,name,type,left,top,width,height");
    });
    await context.sync();
    for (const item of requestedSlides) {
      await tryLoadText(context, item.shapes.items);
    }

    let selectedNames = null;
    if (settings.scope === "selected") {
      const selection = presentation.getSelectedShapes();
      const count = selection.getCount();
      selection.load("items/name");
      await context.sync();
      if (!count.value) throw new Error("“仅选中对象”模式下，请先在当前页选择对象。");
      selectedNames = new Set(selection.items.map((shape) => shape.name));
    }

    const page = (index) => {
      const item = requestedSlides.find((candidate) => candidate.index === index);
      if (!item) return null;
      return {
        index,
        shapes: item.shapes.items.map((shape) => ({
          ...shapeData(shape),
          text: safeShapeText(shape)
        }))
      };
    };

    const current = page(currentIndex);
    if (selectedNames) {
      current.shapes = current.shapes.filter((shape) => selectedNames.has(shape.name));
    }
    return {
      current,
      previous: page(currentIndex - 1),
      next: page(currentIndex + 1)
    };
  });
}

function buildSmartAnimationPlan(snapshot, settings) {
  const allCurrent = snapshot.current.shapes
    .map((shape) => ({ ...shape, role: animationShapeRole(shape) }))
    .filter((shape) => settings.includeDecorations || shape.role !== "decoration");
  const previous = snapshot.previous?.shapes || [];
  const next = snapshot.next?.shapes || [];
  const continuity = animationContinuity(allCurrent, previous, next);
  const ordered = [...allCurrent].sort(animationOrder);
  const pace = settings.style === "subtle" ? 0.42 : settings.style === "dynamic" ? 0.6 : 0.5;

  const effects = ordered.slice(0, 12).map((shape, index) => ({
    name: shape.name,
    label: animationShapeLabel(shape),
    role: shape.role,
    effect: chooseAnimationEffect(shape, settings.style, continuity.names.has(shape.name)),
    trigger: index === 0 || shape.role === "title" ? "withPrevious" : "afterPrevious",
    duration: Number((pace + (shape.role === "visual" ? 0.12 : 0)).toFixed(2))
  }));

  let transition = null;
  if (settings.addTransition) {
    transition = {
      effect: "fade",
      recommendedEffect: continuity.score >= 0.42 ? "morph" : "fade",
      duration: 0.65
    };
  }
  return {
    effects,
    transition,
    continuity: continuity.score,
    omittedCount: Math.max(0, allCurrent.length - effects.length)
  };
}

function animationShapeRole(shape) {
  const name = String(shape.name || "").toLowerCase();
  const type = String(shape.type || "").toLowerCase();
  const text = String(shape.text || "").trim();
  const area = Math.max(0, shape.width * shape.height);
  if (/title|标题/.test(name) || (text && shape.top < 110 && text.length < 90 && shape.width > 220)) return "title";
  if (/chart|diagram|图表|picture|image|media|graphic/.test(`${name} ${type}`) || area > 100000) return "visual";
  if (text) return text.length < 28 && area < 28000 ? "emphasis" : "body";
  if (/line|connector|freeform/.test(type) || area < 1200) return "decoration";
  return "shape";
}

function animationOrder(a, b) {
  const weight = { title: 0, visual: 1, body: 2, emphasis: 3, shape: 4, decoration: 5 };
  return weight[a.role] - weight[b.role] || a.top - b.top || a.left - b.left;
}

function chooseAnimationEffect(shape, style, continuous) {
  if (continuous) return "fade";
  if (style === "subtle") return shape.role === "visual" ? "fade" : "appear";
  if (shape.role === "title") return style === "dynamic" ? "float" : "fade";
  if (shape.role === "visual") return style === "dynamic" ? "zoom" : "fade";
  if (shape.role === "emphasis") return style === "dynamic" ? "zoom" : "wipe";
  if (shape.role === "body") return style === "dynamic" ? "float" : "wipe";
  return "fade";
}

function animationContinuity(current, previous, next) {
  const neighbors = [...previous, ...next];
  if (!neighbors.length || !current.length) return { score: 0, names: new Set() };
  const matched = new Set();
  current.forEach((shape) => {
    const text = normalizedAnimationText(shape.text);
    const match = neighbors.some((neighbor) => {
      const neighborText = normalizedAnimationText(neighbor.text);
      if (text && neighborText && (text === neighborText || text.includes(neighborText) || neighborText.includes(text))) {
        return true;
      }
      const sameType = String(shape.type) === String(neighbor.type);
      const positionDistance = Math.hypot(shape.left - neighbor.left, shape.top - neighbor.top);
      const sizeDistance = Math.abs(shape.width - neighbor.width) + Math.abs(shape.height - neighbor.height);
      return sameType && positionDistance < 24 && sizeDistance < 36;
    });
    if (match) matched.add(shape.name);
  });
  return { score: matched.size / Math.max(current.length, 1), names: matched };
}

function normalizedAnimationText(value) {
  return String(value || "").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "").slice(0, 160);
}

function animationShapeLabel(shape) {
  const text = String(shape.text || "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, 34) : shape.name || "未命名对象";
}

function renderAnimationPlan(plan) {
  const target = $("animation-analysis");
  target.textContent = "";
  const summary = document.createElement("div");
  const continuity = Math.round(plan.continuity * 100);
  summary.innerHTML = `<strong>${plan.effects.length} 个动画</strong> · 跨页连续性 ${continuity}% · 过渡 ${plan.transition ? animationEffectLabel(plan.transition.effect) : "不设置"}`;
  target.append(summary);
  const list = document.createElement("div");
  list.className = "animation-plan-list";
  plan.effects.slice(0, 8).forEach((effect, index) => {
    const row = document.createElement("div");
    row.className = "animation-plan-item";
    const number = document.createElement("strong");
    number.textContent = String(index + 1);
    const name = document.createElement("span");
    name.textContent = effect.label;
    const type = document.createElement("code");
    type.textContent = animationEffectLabel(effect.effect);
    row.append(number, name, type);
    list.append(row);
  });
  target.append(list);
  if (plan.effects.length > 8 || plan.omittedCount) {
    const more = document.createElement("div");
    more.className = "muted";
    more.textContent = `另有 ${Math.max(0, plan.effects.length - 8)} 个动画${plan.omittedCount ? `；为保持节奏，已忽略 ${plan.omittedCount} 个对象` : ""}`;
    target.append(more);
  }
}

function animationEffectLabel(value) {
  return {
    appear: "出现",
    fade: "淡入",
    float: "浮入",
    wipe: "擦除",
    zoom: "缩放",
    morph: "Morph"
  }[value] || value;
}

function initializeChartEditor() {
  currentChartType = $("chart-type").value;
  currentChartTypeCategory = chartTypeCategoryFor(currentChartType);
  const initial = parseCsv($("chart-csv").value.trim());
  chartDrafts[currentChartType] = initial;
  renderChartDataTable(initial);
  renderChartTypePicker();
  updateChartFormatGuide();
}

function initializeChartStyling() {
  renderChartColorLibrary();
  const defaultStyle = readChartDefaultStyle();
  $("chart-style").value = defaultStyle;
  applyChartStylePreset(defaultStyle);
  refreshDefaultStyleLabel();
  refreshChartScaleControls();
  refreshChartLegendControls();
  refreshChartLabelControls();
  refreshChartLabelColorMode();
}

function readChartDefaultStyle() {
  const stored = localStorage.getItem(STORE.chartDefaultStyle);
  return Object.prototype.hasOwnProperty.call(CHART_STYLE_PRESETS, stored) ? stored : "easyppt";
}

function saveChartDefaultStyle() {
  const style = $("chart-style").value;
  if (!Object.prototype.hasOwnProperty.call(CHART_STYLE_PRESETS, style)) return;
  localStorage.setItem(STORE.chartDefaultStyle, style);
  refreshDefaultStyleLabel();
  notify(`默认作图风格已设为：${chartStyleLabel(style)}`);
}

function refreshDefaultStyleLabel() {
  const style = readChartDefaultStyle();
  const isCurrent = $("chart-style").value === style;
  $("chart-default-style-label").textContent = "";
  $("chart-save-default-style").textContent = isCurrent ? "当前默认" : "设为默认";
  $("chart-save-default-style").disabled = isCurrent;
  $("chart-save-default-style").closest(".chart-style-default")?.classList.toggle("is-current", isCurrent);
}

function chartStyleLabel(style) {
  return {
    easyppt: "EasyPPT 风格",
    graphpad: "GraphPad 风格",
    journal: "Classic Journal",
    python: "Python / Matplotlib",
    r: "R / ggplot2",
    minimal: "Minimal"
  }[style] || style;
}

function refreshChartLabelColorMode() {
  const labelsVisible = $("chart-label-mode").value !== "none";
  $("chart-label-color-field").hidden = !labelsVisible || $("chart-label-color-mode").value !== "custom";
}

function refreshChartLegendControls() {
  const enabled = $("chart-show-legend").checked;
  ["chart-legend-position", "chart-legend-size", "chart-legend-offset-x", "chart-legend-offset-y"]
    .forEach((id) => {
      $(id).disabled = !enabled;
    });
  document.querySelector(".chart-legend-card")?.classList.toggle("is-disabled", !enabled);
}

function refreshChartLabelControls() {
  const enabled = $("chart-label-mode").value !== "none";
  [
    "chart-label-position", "chart-label-decimals", "chart-label-size",
    "chart-label-color-mode", "chart-label-bold"
  ].forEach((id) => {
    $(id).disabled = !enabled;
  });
  document.querySelector(".chart-label-card")?.classList.toggle("is-disabled", !enabled);
  refreshChartLabelColorMode();
}

function renderChartColorLibrary() {
  const container = $("chart-color-library");
  container.innerHTML = "";
  const rows = [];
  Object.entries(CLASSIC_PALETTES).forEach(([category, palettes]) => {
    palettes.forEach((palette) => rows.push({ ...palette, category }));
  });
  if (extractedResearchPalette.length) {
    rows.unshift({
      id: "extracted",
      name: "图片提取结果",
      category: "research",
      colors: extractedResearchPalette
    });
  }
  rows.forEach((palette) => {
    const row = document.createElement("div");
    row.className = "chart-color-palette-row";
    const title = document.createElement("strong");
    title.textContent = palette.name;
    const swatches = document.createElement("div");
    swatches.className = "chart-color-palette-swatches";
    palette.colors.forEach((color, index) => {
      const hex = paletteColorHex(color);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chart-library-color";
      button.style.setProperty("--library-color", hex);
      button.title = `${palette.name} · ${paletteColorName(color, index)} ${hex}`;
      button.setAttribute("aria-label", button.title);
      button.addEventListener("click", () => assignChartSeriesColor(hex));
      swatches.appendChild(button);
    });
    row.append(title, swatches);
    container.appendChild(row);
  });
}

function renderChartSeriesColors() {
  const container = $("chart-custom-colors");
  const data = readChartDataTable();
  const type = $("chart-type").value;
  const definitions = chartColorDefinitions(type, data);
  const maxIndex = Math.max(0, ...definitions.map((item) => item.index));
  while (chartSeriesColors.length <= maxIndex) {
    const fallback = chartPalette("accessible");
    chartSeriesColors.push(fallback[chartSeriesColors.length % fallback.length]);
  }
  if (!definitions.some((item) => item.index === selectedChartSeriesColorIndex)) {
    selectedChartSeriesColorIndex = definitions[0]?.index ?? 0;
  }
  container.innerHTML = "";
  definitions.forEach(({ label: name, index }) => {
    ensureChartColorSlot(index);
    const color = chartSeriesColors[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chart-series-color${index === selectedChartSeriesColorIndex ? " selected" : ""}`;
    button.style.setProperty("--series-color", color);
    button.style.setProperty("--series-text", bestTextColor(color));
    button.title = `${name} ${color}；点击后从下方色库选择`;
    button.setAttribute("aria-label", `选择${name}颜色槽位`);
    button.addEventListener("click", () => {
      selectedChartSeriesColorIndex = index;
      renderChartSeriesColors();
      notify(`已选择 ${name}；请从下方色库点选颜色`);
    });
    container.appendChild(button);
  });
  const activeName = definitions.find((item) => item.index === selectedChartSeriesColorIndex)?.label
    || `系列 ${selectedChartSeriesColorIndex + 1}`;
  $("chart-color-target-label").textContent = `正在编辑：${activeName}（点击下方颜色立即应用）`;
}

function chartColorDefinitions(type = $("chart-type")?.value, data = readChartDataTable()) {
  const headers = data[0] || [];
  if (type === "dualaxis") {
    return [
      { label: headers[1] || "柱形", index: 0 },
      { label: headers[2] || "折线", index: 1 }
    ];
  }
  if (type === "barerrorline") {
    const definitions = [{ label: headers[1] || "柱形", index: 0 }];
    if ($("chart-show-overlay-line")?.checked !== false) {
      const lineColumn = $("chart-combo-data-mode")?.value === "raw" ? 2 : 3;
      definitions.push({ label: headers[lineColumn] || "折线", index: 1 });
    }
    return definitions;
  }
  if (type === "replicatebar") {
    return [
      { label: "柱", index: 0 },
      { label: "原始点", index: 1 }
    ];
  }
  if (type === "errorbar") {
    return [{ label: headers[1] || "均值", index: 0 }];
  }
  if (type === "heatmap") {
    const definitions = [{ label: "低值", index: 0 }];
    if (heatmapCustomMidpoint) definitions.push({ label: "中值", index: 1 });
    definitions.push({ label: "高值", index: 2 });
    return definitions;
  }
  if (["box", "violin"].includes(type)) {
    const groupNames = [...new Set(data.slice(1)
      .map((row) => row[0]?.trim())
      .filter(Boolean))];
    if (groupNames.length) {
      return groupNames.map((name, index) => ({ label: name, index }));
    }
  }
  const seriesNames = headers.slice(1);
  if (seriesNames.length) {
    return seriesNames.map((name, index) => ({
      label: name || `系列 ${index + 1}`,
      index
    }));
  }
  return [{ label: "数据系列颜色", index: 0 }];
}

function ensureChartColorSlot(index) {
  const fallback = chartPalette("accessible");
  while (chartSeriesColors.length <= index) {
    chartSeriesColors.push(fallback[chartSeriesColors.length % fallback.length]);
  }
}

function renderChartColorControls() {
  const type = $("chart-type").value;
  const data = readChartDataTable();
  const definitions = chartColorDefinitions(type, data);
  const simple = $("chart-simple-colors");
  const advanced = $("chart-color-editor");
  simple.hidden = false;
  advanced.hidden = !definitions.length;
  simple.innerHTML = "";
  definitions.forEach(({ label: labelText, index: colorIndex }) => {
    ensureChartColorSlot(colorIndex);
    const label = document.createElement("label");
    label.className = "chart-color-dot-control";
    const text = document.createElement("span");
    text.textContent = labelText;
    const input = document.createElement("input");
    input.type = "color";
    input.value = chartSeriesColors[colorIndex];
    input.addEventListener("input", () => {
      chartSeriesColors[colorIndex] = normalizeHex(input.value);
      renderChartSeriesColors();
      renderChartColorControls();
    });
    label.append(input, text);
    simple.appendChild(label);
  });
  if (type === "errorbar") {
    renderErrorColorControl(simple, "误差棒", "mean", chartSeriesColors[0]);
  }
  if (type === "barerrorline") {
    renderErrorColorControl(simple, "柱误差棒", "bar", chartSeriesColors[0]);
    if ($("chart-show-overlay-line")?.checked !== false) {
      renderErrorColorControl(simple, "折线误差棒", "line", chartSeriesColors[1]);
    }
  }
  if (type === "heatmap") {
    const toggle = document.createElement("label");
    toggle.className = "chart-inline-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = heatmapCustomMidpoint;
    checkbox.addEventListener("change", () => {
      heatmapCustomMidpoint = checkbox.checked;
      renderChartColorControls();
    });
    toggle.append(checkbox, document.createTextNode(" 自定义中值颜色"));
    simple.appendChild(toggle);
  }
}

function renderErrorColorControl(container, labelText, key, mainColor) {
  const row = document.createElement("div");
  row.className = "chart-error-color-control";
  const label = document.createElement("span");
  label.textContent = labelText;
  const mode = document.createElement("select");
  mode.setAttribute("aria-label", `${labelText}颜色模式`);
  [["auto", "自动高对比"], ["custom", "自定义"]].forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    mode.appendChild(option);
  });
  mode.value = chartErrorColorModes[key] || "auto";
  const color = resolvedErrorColor(key, mainColor);
  const dot = document.createElement("label");
  dot.className = `chart-error-color-dot${mode.value === "custom" ? "" : " is-auto"}`;
  dot.title = mode.value === "custom" ? `${labelText}自定义颜色` : `${labelText}自动高对比颜色`;
  const input = document.createElement("input");
  input.type = "color";
  input.className = "chart-error-color-picker";
  input.value = chartErrorCustomColors[key] || color;
  input.disabled = mode.value !== "custom";
  input.tabIndex = mode.value === "custom" ? 0 : -1;
  const swatch = document.createElement("span");
  swatch.style.setProperty("--error-color", color);
  mode.addEventListener("change", () => {
    chartErrorColorModes[key] = mode.value;
    renderChartColorControls();
  });
  input.addEventListener("input", () => {
    chartErrorCustomColors[key] = normalizeHex(input.value);
    swatch.style.setProperty("--error-color", chartErrorCustomColors[key]);
  });
  dot.append(input, swatch);
  row.append(label, mode, dot);
  container.appendChild(row);
}

function resolvedErrorColor(key, mainColor) {
  return chartErrorColorModes[key] === "custom"
    ? chartErrorCustomColors[key] || automaticErrorColor(mainColor)
    : automaticErrorColor(mainColor);
}

function automaticErrorColor(mainColor) {
  const background = normalizeHex($("chart-background")?.value) || "#FFFFFF";
  const main = normalizeHex(mainColor) || "#0072B2";
  const candidates = ["#111111", "#FFFFFF", "#B2182B", "#145DA0", "#006D5B", "#7A3E00", "#5B2C83"];
  return candidates.reduce((best, candidate) => {
    const score = Math.min(contrastRatio(candidate, background), contrastRatio(candidate, main));
    const bestScore = Math.min(contrastRatio(best, background), contrastRatio(best, main));
    return score > bestScore ? candidate : best;
  }, candidates[0]);
}

function assignChartSeriesColor(value) {
  const color = normalizeHex(value);
  if (!color) return;
  chartSeriesColors[selectedChartSeriesColorIndex] = color;
  renderChartSeriesColors();
  notify(`已更新系列 ${selectedChartSeriesColorIndex + 1} 颜色：${color}`);
}

function applyChartStylePreset(name) {
  const preset = CHART_STYLE_PRESETS[name];
  if (!preset) return;
  currentChartStyleBase = name;
  $("chart-font-family").value = preset.font;
  $("chart-title-size").value = preset.titleSize;
  $("chart-axis-title-size").value = preset.axisTitleSize;
  $("chart-tick-size").value = preset.tickSize;
  $("chart-legend-size").value = preset.legendSize;
  $("chart-line-width").value = preset.lineWidth;
  $("chart-point-size").value = preset.pointSize;
  $("chart-axis-width").value = preset.axisWidth;
  $("chart-fill-opacity").value = preset.fillOpacity;
  $("chart-x-rotation").value = chartPresetXRotation(name, preset);
  $("chart-legend-position").value = preset.legendPosition;
  $("chart-background").value = preset.background;
  $("chart-axis-color").value = preset.axisColor;
  $("chart-grid-color").value = preset.gridColor;
  $("chart-show-grid").checked = preset.showGrid;
  if (typeof preset.barGradient === "boolean") {
    $("chart-bar-gradient").checked = preset.barGradient;
  }
  if (preset.colors) {
    chartSeriesColors = [...preset.colors];
    renderChartSeriesColors();
    renderChartColorControls();
  }
}

function chartPresetXRotation(name, preset) {
  if (name !== "graphpad") return preset.xRotation ?? 0;
  const type = $("chart-type")?.value;
  if (["dualaxis", "barerrorline"].includes(type)) return -45;
  if (["bar", "line", "area", "errorbar", "replicatebar"].includes(type)) {
    const rows = readChartDataTable().slice(1).filter((row) => row.some((cell) => cell.trim()));
    const hasCrowdedLabels = rows.length > 6 || rows.some((row) => (row[0] || "").trim().length > 6);
    return hasCrowdedLabels ? -45 : 0;
  }
  return 0;
}

function syncChartRotationForCurrentStyle() {
  const style = $("chart-style")?.value;
  const preset = CHART_STYLE_PRESETS[style];
  if (!preset) return;
  $("chart-x-rotation").value = chartPresetXRotation(style, preset);
}

function chartRenderColors() {
  const fallback = chartPalette("accessible");
  return chartSeriesColors.length ? chartSeriesColors : fallback;
}

function chartVisualSettings() {
  const selectedStyle = $("chart-style")?.value;
  const preset = CHART_STYLE_PRESETS[selectedStyle]
    || CHART_STYLE_PRESETS[currentChartStyleBase]
    || CHART_STYLE_PRESETS.easyppt;
  return {
    style: selectedStyle || currentChartStyleBase,
    font: $("chart-font-family")?.value || "Arial",
    titleSize: boundedNumber("chart-title-size", 30, 16, 54),
    axisTitleSize: boundedNumber("chart-axis-title-size", 24, 12, 40),
    tickSize: boundedNumber("chart-tick-size", 19, 10, 32),
    legendSize: boundedNumber("chart-legend-size", 19, 10, 32),
    lineWidth: boundedNumber("chart-line-width", 4, 1, 12),
    pointSize: boundedNumber("chart-point-size", 7, 2, 18),
    axisWidth: boundedNumber("chart-axis-width", 3, 0, 8),
    fillOpacity: boundedNumber("chart-fill-opacity", 1, 0.1, 1),
    xRotation: boundedNumber("chart-x-rotation", 0, -90, 90),
    legendPosition: $("chart-legend-position")?.value || "top",
    legendOffsetX: boundedNumber("chart-legend-offset-x", 0, -300, 300),
    legendOffsetY: boundedNumber("chart-legend-offset-y", 0, -300, 300),
    y2Gap: boundedNumber("chart-y2-gap", 18, 8, 100),
    background: normalizeHex($("chart-background")?.value) || "#FFFFFF",
    plotBackground: preset.plotBackground || normalizeHex($("chart-background")?.value) || "#FFFFFF",
    axisColor: normalizeHex($("chart-axis-color")?.value) || "#17211F",
    gridColor: normalizeHex($("chart-grid-color")?.value) || "#DADFDA",
    labelColor: normalizeHex($("chart-label-color")?.value) || "#4F5855",
    labelColorMode: $("chart-label-color-mode")?.value || "auto",
    labelBold: Boolean($("chart-label-bold")?.checked),
    labelPosition: $("chart-label-position")?.value || "above",
    frame: preset.frame || "leftBottom",
    majorTickLength: preset.majorTickLength ?? 7,
    minorTickLength: preset.minorTickLength ?? 0,
    showMinorGrid: Boolean(preset.showMinorGrid),
    titleWeight: preset.titleWeight || 700,
    axisTitleWeight: preset.axisTitleWeight || 500,
    tickWeight: preset.tickWeight || 400,
    legendWeight: preset.legendWeight || 400,
    tickWidth: preset.tickWidth || Math.max(1, boundedNumber("chart-axis-width", 3, 0, 8) * 0.65),
    lineCap: preset.lineCap || "round",
    markStroke: preset.markStroke || "none",
    markStrokeWidth: preset.markStrokeWidth || 0,
    violinInner: preset.violinInner || "raw"
  };
}

function chartPlotMargins(visual, {
  right = 45,
  top = 70,
  bottom = 95,
  left = 105
} = {}) {
  if (visual.style !== "graphpad") return { left, right, top, bottom };
  const hasTitle = Boolean($("chart-title")?.value.trim());
  return {
    left: Math.max(left, 120),
    right,
    top: hasTitle ? Math.max(72, top) : Math.min(top, 42),
    bottom: Math.max(bottom, 125)
  };
}

function chartTickText(text, x, y, visual, {
  anchor = "end",
  transform = ""
} = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${visual.tickSize}" font-weight="${visual.tickWeight}" fill="${visual.axisColor}"${transform}>${escapeHtml(text)}</text>`;
}

function refreshChartScaleControls() {
  [
    ["chart-y-scale-mode", ["chart-y-min", "chart-y-max"]],
    ["chart-x-scale-mode", ["chart-x-min", "chart-x-max"]],
    ["chart-y2-scale-mode", ["chart-y2-min", "chart-y2-max"]]
  ].forEach(([modeId, fieldIds]) => {
    const manual = $(modeId).value === "manual";
    fieldIds.forEach((id) => {
      $(id).disabled = !manual;
    });
  });
}

function boundedNumber(id, fallback, min, max) {
  const value = Number($(id)?.value);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function chartDataLabelColor(visual, markColor = null, surfaceColor = null) {
  if (visual.labelColorMode === "custom") return visual.labelColor;
  const surface = normalizeHex(surfaceColor) || visual.background;
  const mark = normalizeHex(markColor) || surface;
  const candidates = ["#111111", "#FFFFFF"];
  return candidates.reduce((best, candidate) => {
    const score = Math.min(contrastRatio(candidate, surface), contrastRatio(candidate, mark));
    const bestScore = Math.min(contrastRatio(best, surface), contrastRatio(best, mark));
    return score > bestScore ? candidate : best;
  }, candidates[0]);
}

function chartLabelWeight(visual) {
  return visual.labelBold ? 700 : 400;
}

function handleChartTypeChange() {
  chartDrafts[currentChartType] = readChartDataTable();
  currentChartType = $("chart-type").value;
  currentChartTypeCategory = chartTypeCategoryFor(currentChartType);
  const next = chartDrafts[currentChartType] || cloneTable(currentChartTemplateExample(currentChartType));
  renderChartDataTable(next);
  syncChartTableToCsv();
  renderChartTypePicker();
  updateChartFormatGuide();
  syncChartRotationForCurrentStyle();
}

function chartTypeCategoryFor(type) {
  return CHART_TYPE_GROUPS.find((group) => group.types.includes(type))?.id || CHART_TYPE_GROUPS[0].id;
}

function renderChartTypePicker() {
  const selectedType = $("chart-type").value;
  if (!CHART_TYPE_GROUPS.some((group) => group.id === currentChartTypeCategory)) {
    currentChartTypeCategory = chartTypeCategoryFor(selectedType);
  }
  const categoryHost = $("chart-type-category-pills");
  const optionHost = $("chart-type-option-pills");
  const currentHost = $("chart-type-current");
  if (!categoryHost || !optionHost || !currentHost) return;

  categoryHost.innerHTML = "";
  CHART_TYPE_GROUPS.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chart-type-category${group.id === currentChartTypeCategory ? " selected" : ""}`;
    button.textContent = group.label;
    button.title = group.note;
    button.setAttribute("aria-pressed", String(group.id === currentChartTypeCategory));
    button.addEventListener("click", () => {
      currentChartTypeCategory = group.id;
      renderChartTypePicker();
    });
    categoryHost.appendChild(button);
  });

  const group = CHART_TYPE_GROUPS.find((item) => item.id === currentChartTypeCategory) || CHART_TYPE_GROUPS[0];
  optionHost.innerHTML = "";
  group.types.forEach((type) => {
    const meta = CHART_TYPE_META[type] || { label: type, short: type, hint: "" };
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chart-type-option${type === selectedType ? " selected" : ""}`;
    button.textContent = meta.short || meta.label;
    button.title = `${meta.label}${meta.hint ? `：${meta.hint}` : ""}`;
    button.setAttribute("aria-pressed", String(type === selectedType));
    button.addEventListener("click", () => {
      if ($("chart-type").value === type) return;
      $("chart-type").value = type;
      handleChartTypeChange();
    });
    optionHost.appendChild(button);
  });

  const selectedMeta = CHART_TYPE_META[selectedType] || { label: selectedType, hint: "" };
  const selectedGroup = CHART_TYPE_GROUPS.find((item) => item.types.includes(selectedType));
  currentHost.innerHTML = `<span>当前：${escapeHtml(selectedGroup?.label || "图表")} · ${escapeHtml(selectedMeta.label)}</span>${selectedMeta.hint ? `<small>${escapeHtml(selectedMeta.hint)}</small>` : ""}`;
}

function updateChartFormatGuide() {
  const type = $("chart-type").value;
  const template = CHART_TEMPLATES[type];
  $("chart-format-guide").innerHTML = `<strong>数据格式：</strong>${escapeHtml(currentChartTemplateGuide(type))}`;
  $("chart-add-series").hidden = !template.addSeries;
  const isReplicateBar = type === "replicatebar";
  const isScatter = type === "scatter";
  const isDualAxis = type === "dualaxis";
  const isBarErrorLine = type === "barerrorline";
  const isErrorBar = type === "errorbar";
  const usesRightAxis = isDualAxis || (isBarErrorLine && $("chart-show-overlay-line").checked);
  $("chart-bar-color-field").hidden = true;
  $("chart-gradient-field").hidden = !isReplicateBar;
  $("chart-regression-settings").hidden = !isScatter;
  $("chart-barerrorline-settings").hidden = !isBarErrorLine;
  $("chart-errorbar-settings").hidden = !isErrorBar;
  $("chart-y2-label-field").hidden = !usesRightAxis;
  $("chart-y2-gap-field").hidden = !usesRightAxis;
  if (isReplicateBar) {
    $("chart-show-legend").checked = false;
    if ($("chart-x-label").value === "X") $("chart-x-label").value = "Group";
    if ($("chart-y-label").value === "Y") $("chart-y-label").value = "Mean";
  } else if (isDualAxis) {
    $("chart-show-legend").checked = true;
    if (["X", "Group"].includes($("chart-x-label").value)) $("chart-x-label").value = "Category";
    if (["Y", "Mean"].includes($("chart-y-label").value)) $("chart-y-label").value = "Yield";
    $("chart-y2-label").value = "ee";
    if (!$("chart-title").value) $("chart-title").value = "Alanine scanning";
    $("chart-x-rotation").value = -45;
  } else if (isBarErrorLine) {
    $("chart-show-legend").checked = true;
    if (["X", "Group"].includes($("chart-x-label").value)) $("chart-x-label").value = "Category";
    if (["Y", "Mean"].includes($("chart-y-label").value)) $("chart-y-label").value = "Bar value";
    if (["Secondary Y", "ee"].includes($("chart-y2-label").value)) $("chart-y2-label").value = "Line value";
    $("chart-x-rotation").value = -45;
  } else if ($("chart-type").value === "violin") {
    $("chart-show-legend").checked = false;
    if (["X", "Category"].includes($("chart-x-label").value)) $("chart-x-label").value = "Group";
    if (["Y", "Yield"].includes($("chart-y-label").value)) $("chart-y-label").value = "Value";
  } else {
    if (["Group", "Category"].includes($("chart-x-label").value)) $("chart-x-label").value = "X";
    if (["Mean", "Value", "Yield"].includes($("chart-y-label").value)) $("chart-y-label").value = "Y";
  }
  updateChartKeyControls();
  renderChartSeriesColors();
  renderChartColorControls();
  $("chart-x-scale-group").hidden = !["line", "scatter", "area"].includes($("chart-type").value);
  $("chart-y2-scale-group").hidden = !usesRightAxis;
  refreshChartScaleControls();
  refreshBarErrorLineControls();
  refreshChartLegendControls();
  refreshChartLabelControls();
}

function currentChartTemplateExample(type) {
  if (type === "errorbar" && $("chart-error-data-mode")?.value === "summary") {
    return [["Category", "Mean", "Error"], ["Control", "2.4", "0.3"], ["Low dose", "3.1", "0.4"], ["High dose", "4.6", "0.5"]];
  }
  if (type === "barerrorline" && $("chart-combo-data-mode")?.value === "summary") {
    return [["Category", "Yield", "Yield Error", "ee", "ee Error"], ["V136A", "24", "9", "62", "1.2"], ["F137A", "32", "3", "70", "1.5"], ["L140A", "42", "2", "72", "1.8"]];
  }
  return CHART_TEMPLATES[type].example;
}

function currentChartTemplateGuide(type) {
  if (type === "errorbar" && $("chart-error-data-mode")?.value === "summary") {
    return "已计算模式：固定 3 列，填写类别、均值和误差半宽；误差类型由数据来源决定。";
  }
  if (type === "barerrorline" && $("chart-combo-data-mode")?.value === "summary") {
    return "已计算模式：固定 5 列，填写类别、柱均值、柱误差、折线均值和折线误差。关闭的项目允许对应单元格留空。";
  }
  return CHART_TEMPLATES[type].guide;
}

function switchChartDataMode(type) {
  if ($("chart-type").value !== type) return;
  chartDrafts[type] = cloneTable(currentChartTemplateExample(type));
  renderChartDataTable(chartDrafts[type]);
  syncChartTableToCsv();
  updateChartFormatGuide();
  notify(type === "errorbar" ? "已切换误差棒数据模式" : "已切换柱线图数据模式");
}

function updateChartKeyControls() {
  const type = $("chart-type").value;
  const guides = {
    line: { note: "趋势是否清楚主要取决于线宽、点大小和图例。", keys: ["series-colors", "legend", "labels"] },
    scatter: { note: "优先检查点大小、回归线、公式/R² 和标签位置。", keys: ["series-colors", "labels", "label-position", "legend"] },
    bar: { note: "重点是系列颜色、数据标签和图例，避免柱间信息混淆。", keys: ["series-colors", "labels", "legend"] },
    barerrorline: { note: "柱与折线可使用不同量纲；请分别命名左右 Y 轴，并明确两组误差的类型。", keys: ["y-axis", "y2-axis", "series-colors", "labels", "legend"] },
    replicatebar: { note: "柱高代表均值，原始点代表重复；优先设置点大小、统计标签和颜色。", keys: ["series-colors", "labels", "label-position"] },
    area: { note: "面积透明度和系列颜色决定重叠区域是否可读。", keys: ["series-colors", "legend", "labels"] },
    errorbar: { note: "务必在 Y 轴或图注说明误差类型（SD、SEM 或 CI），并检查标签位置。", keys: ["y-axis", "labels", "label-position"] },
    box: { note: "重点是原始点、四分位摘要和组名；数据标签过多时建议只显示统计摘要。", keys: ["series-colors", "labels", "label-position"] },
    violin: { note: "重点是分布轮廓、原始点、中心统计量和填充透明度。", keys: ["series-colors", "labels", "label-position"] },
    dualaxis: { note: "左右轴量纲必须分别命名；图例位置、偏移和右轴文字间距是防重叠关键。", keys: ["y-axis", "y2-axis", "legend", "series-colors", "labels"] },
    heatmap: { note: "优先选择连续色板、控制单元格标签和图例，名称较长时注意字号。", keys: ["palette", "labels", "legend"] }
  };
  const guide = guides[type] || { note: "先设置轴标题、颜色和图例。", keys: ["palette", "legend"] };
  const labels = {
    "series-colors": "系列颜色",
    palette: "配色",
    legend: "图例位置/偏移",
    labels: "数据标签",
    "label-position": "标签位置",
    "x-axis": "X 轴标题",
    "y-axis": "左 Y 轴标题",
    "y2-axis": "右 Y 轴与间距"
  };
  $("chart-key-controls").innerHTML = `<strong>本图重点：</strong>${escapeHtml(guide.note)}<br>${guide.keys.map((key) => `<span>${escapeHtml(labels[key] || key)}</span>`).join("")}`;
  document.querySelectorAll("[data-chart-setting]").forEach((element) => {
    element.classList.remove("chart-setting-important");
  });
}

function refreshBarErrorLineControls() {
  const isBarErrorLine = $("chart-type")?.value === "barerrorline";
  const showLine = Boolean($("chart-show-overlay-line")?.checked);
  if ($("chart-show-line-error")) {
    $("chart-show-line-error").disabled = !showLine;
  }
  if (!isBarErrorLine) return;
  $("chart-y2-label-field").hidden = !showLine;
  $("chart-y2-gap-field").hidden = !showLine;
  $("chart-y2-scale-group").hidden = !showLine;
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
  if ($("chart-custom-colors")) {
    renderChartSeriesColors();
    renderChartColorControls();
  }
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

function readChartDatasets() {
  try {
    const datasets = JSON.parse(localStorage.getItem(STORE.chartDatasets) || "[]");
    return Array.isArray(datasets) ? datasets : [];
  } catch {
    return [];
  }
}

function renderChartDatasets(selectedId = "") {
  const select = $("chart-dataset-select");
  const datasets = readChartDatasets();
  select.innerHTML = "";
  if (!datasets.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无已保存数据集";
    select.appendChild(option);
    return;
  }
  datasets.forEach((dataset) => {
    const option = document.createElement("option");
    option.value = dataset.id;
    option.textContent = `${dataset.name} · ${chartTypeLabel(dataset.type)} · ${dataset.data.length - 1} 行`;
    select.appendChild(option);
  });
  select.value = selectedId && datasets.some((dataset) => dataset.id === selectedId)
    ? selectedId
    : datasets[0].id;
}

function saveChartDataset() {
  const name = $("chart-dataset-name").value.trim();
  if (!name) throw new Error("请先输入数据集名称。");
  const data = readChartDataTable();
  if (data.length < 2) throw new Error("当前表格没有可保存的数据。");
  const datasets = readChartDatasets();
  const existing = datasets.find((dataset) => dataset.name === name);
  const record = {
    id: existing?.id || crypto.randomUUID(),
    name,
    type: $("chart-type").value,
    data,
    title: $("chart-title").value,
    xLabel: $("chart-x-label").value,
    yLabel: $("chart-y-label").value,
    y2Label: $("chart-y2-label").value,
    errorData: {
      mode: $("chart-error-data-mode").value,
      type: $("chart-error-type").value
    },
    comboData: {
      mode: $("chart-combo-data-mode").value,
      type: $("chart-combo-error-type").value
    },
    barErrorLine: {
      showBarError: $("chart-show-bar-error").checked,
      showLine: $("chart-show-overlay-line").checked,
      showLineError: $("chart-show-line-error").checked
    },
    updatedAt: new Date().toISOString()
  };
  const next = [record, ...datasets.filter((dataset) => dataset.id !== record.id)].slice(0, 80);
  localStorage.setItem(STORE.chartDatasets, JSON.stringify(next));
  renderChartDatasets(record.id);
  notify(existing ? `已更新数据集：${name}` : `已保存数据集：${name}`);
}

function loadChartDataset() {
  const id = $("chart-dataset-select").value;
  const dataset = readChartDatasets().find((item) => item.id === id);
  if (!dataset) throw new Error("请选择要打开的数据集。");
  chartDrafts[currentChartType] = readChartDataTable();
  $("chart-type").value = dataset.type;
  currentChartType = dataset.type;
  currentChartTypeCategory = chartTypeCategoryFor(dataset.type);
  $("chart-error-data-mode").value = dataset.errorData?.mode || "raw";
  $("chart-error-type").value = dataset.errorData?.type || "sd";
  $("chart-combo-data-mode").value = dataset.comboData?.mode || "raw";
  $("chart-combo-error-type").value = dataset.comboData?.type || "sd";
  renderChartDataTable(cloneTable(dataset.data));
  syncChartTableToCsv();
  $("chart-title").value = dataset.title || "";
  $("chart-x-label").value = dataset.xLabel || "X";
  $("chart-y-label").value = dataset.yLabel || "Y";
  $("chart-y2-label").value = dataset.y2Label || "Secondary Y";
  $("chart-show-bar-error").checked = dataset.barErrorLine?.showBarError !== false;
  $("chart-show-overlay-line").checked = dataset.barErrorLine?.showLine !== false;
  $("chart-show-line-error").checked = Boolean(dataset.barErrorLine?.showLineError);
  $("chart-dataset-name").value = dataset.name;
  renderChartTypePicker();
  updateChartFormatGuide();
  notify(`已打开数据集：${dataset.name}`);
}

function deleteChartDataset() {
  const id = $("chart-dataset-select").value;
  const datasets = readChartDatasets();
  const dataset = datasets.find((item) => item.id === id);
  if (!dataset) throw new Error("请选择要删除的数据集。");
  localStorage.setItem(
    STORE.chartDatasets,
    JSON.stringify(datasets.filter((item) => item.id !== id))
  );
  renderChartDatasets();
  notify(`已删除数据集：${dataset.name}`);
}

function chartTypeLabel(type) {
  return {
    line: "折线图", scatter: "散点图", bar: "分组柱状图",
    barerrorline: "柱状图＋误差棒/折线",
    replicatebar: "重复值柱状图", area: "面积图", errorbar: "误差图",
    box: "箱线图", violin: "小提琴图", dualaxis: "双轴柱线图", heatmap: "热图"
  }[type] || type;
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
  const data = cloneTable(currentChartTemplateExample($("chart-type").value));
  renderChartDataTable(data);
  syncChartTableToCsv();
  notify("已载入当前图类型示例");
}

function clearChartTable() {
  const data = readChartDataTable();
  const cleared = data.map((row, rowIndex) =>
    row.map((cell) => rowIndex === 0 ? cell : "")
  );
  renderChartDataTable(cleared);
  syncChartTableToCsv();
  notify("已清空数据行，保留表头和列结构");
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
  const fallback = cloneTable(currentChartTemplateExample($("chart-type").value));
  if (!data?.length) return fallback;
  const width = Math.max(minimumChartColumns(), ...data.map((row) => row.length));
  const normalized = data.map((row) =>
    Array.from({ length: width }, (_, index) => row[index] ?? "")
  );
  if (normalized.length === 1) normalized.push(Array(width).fill(""));
  return normalized;
}

function minimumChartColumns() {
  const type = $("chart-type").value;
  if (type === "barerrorline") return $("chart-combo-data-mode").value === "summary" ? 5 : 3;
  if (type === "errorbar") return $("chart-error-data-mode").value === "summary" ? 3 : 2;
  if (type === "dualaxis") return 3;
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
  let table = parseCsv($("chart-csv").value.trim());
  if (table.length < 2 || table[0].length < 2) {
    throw new Error("CSV 至少需要一列 X 和一列 Y。");
  }
  const type = $("chart-type").value;
  if (type === "errorbar" && $("chart-error-data-mode").value === "raw") {
    table = summarizeRawErrorTable(table, $("chart-error-type").value);
  }
  if (type === "barerrorline" && $("chart-combo-data-mode").value === "raw") {
    table = summarizeRawComboTable(table, $("chart-combo-error-type").value);
  }
  if (type === "heatmap") return buildHeatmapSvg(table);
  if (type === "box") return buildBoxPlotSvg(table);
  if (type === "violin") return buildViolinPlotSvg(table);
  if (type === "dualaxis") return buildDualAxisChartSvg(table);
  if (type === "barerrorline") return buildBarErrorLineChartSvg(table);
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
  const regressionEnabled = type === "scatter" && $("chart-show-regression").checked;
  if (regressionEnabled && !numericX) throw new Error("线性回归要求 X 列全部为数字。");
  const regressionResults = regressionEnabled
    ? series.map((item) => linearRegression(xValues, item.values))
    : [];
  const xMinValue = Math.min(...xValues);
  const xMaxValue = Math.max(...xValues);

  const width = 1200;
  const height = 700;
  const visual = chartVisualSettings();
  const margin = chartPlotMargins(visual, {
    left: 105,
    right: visual.legendPosition === "right" ? 175 : 45,
    top: visual.legendPosition === "top" ? 92 : 70,
    bottom: visual.legendPosition === "bottom" || Math.abs(visual.xRotation) > 30 ? 135 : 95
  });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  let allY = isErrorBar
    ? series[0].values.flatMap((value, index) => [value - errors[index], value + errors[index]])
    : series.flatMap((item) => item.values);
  if (regressionEnabled) {
    allY = allY.concat(regressionResults.flatMap((regression) => [
      regression.slope * xMinValue + regression.intercept,
      regression.slope * xMaxValue + regression.intercept
    ]));
  }
  const yAxis = chartAxisScale("y", allY, {
    includeZero: ["bar", "area", "errorbar"].includes(type)
  });
  const minY = yAxis.min;
  const maxY = yAxis.max;
  const xAxis = numericX && ["line", "scatter", "area"].includes(type)
    ? chartAxisScale("x", xValues)
    : { min: xMinValue, max: xMaxValue, ticks: [], minorTicks: [] };
  const minX = xAxis.min;
  const maxX = xAxis.max;
  const xScale = (value) => minX === maxX
    ? margin.left + plotW / 2
    : margin.left + ((value - minX) / (maxX - minX)) * plotW;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const colors = chartRenderColors();
  const showGrid = $("chart-show-grid").checked;
  const showLegend = $("chart-show-legend").checked;
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showPointLabels = ["value", "nameValue", "all"].includes(labelMode);
  const showSummaryLabels = ["summary", "all"].includes(labelMode);
  const showRegression = regressionEnabled;
  const showEquation = showRegression && $("chart-show-equation").checked;
  const showR2 = showRegression && $("chart-show-r2").checked;

  const grid = yAxis.ticks.map((value) => {
    const y = yScale(value);
    return `${showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}" stroke-width="1"/>` : ""}
      <line x1="${margin.left - visual.majorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), margin.left - visual.majorTickLength - 8, y + 7, visual)}`;
  }).join("") + yAxis.minorTicks.map((value) => {
    const y = yScale(value);
    return `${visual.showMinorGrid && showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}" stroke-width="0.7" opacity="0.65"/>` : ""}
      ${visual.minorTickLength ? `<line x1="${margin.left - visual.minorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>` : ""}`;
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
      const labelText = labelMode === "nameValue" || labelMode === "all"
        ? `${item.name}: ${formatChartLabelValue(value)}`
        : formatChartLabelValue(value);
      const labelPosition = chartLabelCoordinates(x + (barWidth - 3) / 2, Math.min(y, baseline), visual.labelPosition, 10);
      const label = showPointLabels
        ? `<text x="${labelPosition.x}" y="${labelPosition.y}" text-anchor="${labelPosition.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, colors[seriesIndex % colors.length])}">${escapeHtml(labelText)}</text>`
        : "";
      return `<rect x="${x}" y="${Math.min(y, baseline)}" width="${barWidth - 3}" height="${Math.max(1, Math.abs(baseline - y))}" fill="${colors[seriesIndex % colors.length]}" fill-opacity="${visual.fillOpacity}" stroke="${visual.markStroke}" stroke-width="${visual.markStrokeWidth}"/>${label}`;
    }).join("")).join("");
  } else if (isErrorBar) {
    const color = colors[0];
    const errorColor = resolvedErrorColor("mean", color);
    marks = series[0].values.map((value, index) => {
      const x = margin.left + (plotW / rows.length) * (index + 0.5);
      const high = yScale(value + errors[index]);
      const low = yScale(value - errors[index]);
      const labelText = labelMode === "value"
        ? formatChartLabelValue(value)
        : labelMode === "nameValue"
          ? `${rows[index][0]}: ${formatChartLabelValue(value)}`
          : labelMode === "summary"
            ? `${formatChartLabelValue(value)} ± ${formatChartLabelValue(errors[index])}`
            : `${rows[index][0]}: ${formatChartLabelValue(value)} ± ${formatChartLabelValue(errors[index])}`;
      const labelPosition = chartLabelCoordinates(x, high, visual.labelPosition, 12);
      const label = labelMode !== "none"
        ? `<text x="${labelPosition.x}" y="${labelPosition.y}" text-anchor="${labelPosition.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, color)}">${escapeHtml(labelText)}</text>`
        : "";
      return `<line x1="${x}" y1="${high}" x2="${x}" y2="${low}" stroke="${errorColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${x - 13}" y1="${high}" x2="${x + 13}" y2="${high}" stroke="${errorColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${x - 13}" y1="${low}" x2="${x + 13}" y2="${low}" stroke="${errorColor}" stroke-width="${visual.lineWidth}"/>
        <circle cx="${x}" cy="${yScale(value)}" r="${visual.pointSize}" fill="${color}" stroke="${visual.background}" stroke-width="2"/>${label}`;
    }).join("");
  } else {
    marks = series.map((item, seriesIndex) => {
      const color = colors[seriesIndex % colors.length];
      const points = item.values.map((value, index) => `${xScale(xValues[index])},${yScale(value)}`).join(" ");
      const area = type === "area"
        ? `<polygon points="${xScale(xValues[0])},${yScale(0)} ${points} ${xScale(xValues[xValues.length - 1])},${yScale(0)}" fill="${color}" fill-opacity="${Math.min(0.55, visual.fillOpacity * 0.32)}"/>`
        : "";
      const line = type === "line" || type === "area"
        ? `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${visual.lineWidth}" stroke-linejoin="round" stroke-linecap="${visual.lineCap}"/>`
        : "";
      const dots = item.values.map((value, index) => {
        const labelText = labelMode === "nameValue" || labelMode === "all"
          ? `${item.name}: ${formatChartLabelValue(value)}`
          : formatChartLabelValue(value);
        const pointX = xScale(xValues[index]);
        const pointY = yScale(value);
        const labelPosition = chartLabelCoordinates(pointX, pointY, visual.labelPosition, 12);
        return (
        `<circle cx="${pointX}" cy="${pointY}" r="${visual.pointSize}" fill="${color}" stroke="${visual.background}" stroke-width="2"/>
        ${showPointLabels ? `<text x="${labelPosition.x}" y="${labelPosition.y}" text-anchor="${labelPosition.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, color)}">${escapeHtml(labelText)}</text>` : ""}`
        );
      }).join("");
      return area + line + dots;
    }).join("");
  }

  if (showSummaryLabels && !isErrorBar) {
    marks += series.map((item, index) => {
      const mean = item.values.reduce((sum, value) => sum + value, 0) / item.values.length;
      const summary = `${item.name}: μ=${formatChartLabelValue(mean)}, min=${formatChartLabelValue(Math.min(...item.values))}, max=${formatChartLabelValue(Math.max(...item.values))}, n=${item.values.length}`;
      return `<text x="${width - margin.right}" y="${margin.top + 22 + index * (labelSize + 7)}" text-anchor="end" font-size="${labelSize}" fill="${colors[index % colors.length]}">${escapeHtml(summary)}</text>`;
    }).join("");
  }

  let regressionMarks = "";
  let regressionAnnotations = "";
  if (showRegression) {
    regressionMarks = regressionResults.map((regression, index) => {
      const color = colors[index % colors.length];
      const startY = regression.slope * minX + regression.intercept;
      const endY = regression.slope * maxX + regression.intercept;
      return `<line x1="${xScale(minX)}" y1="${yScale(startY)}" x2="${xScale(maxX)}" y2="${yScale(endY)}"
        stroke="${color}" stroke-width="${visual.lineWidth}" stroke-dasharray="12 8" opacity="0.9"/>`;
    }).join("");
    regressionAnnotations = regressionResults.map((regression, index) => {
      if (!showEquation && !showR2) return "";
      const parts = [];
      if (showEquation) parts.push(formatRegressionEquation(regression.slope, regression.intercept));
      if (showR2) parts.push(`R²=${formatChartLabelValue(regression.r2)}`);
      return `<text x="${margin.left + 12}" y="${margin.top + 24 + index * (labelSize + 9)}" font-size="${labelSize}" fill="${colors[index % colors.length]}">${escapeHtml(`${series[index].name}: ${parts.join(" · ")}`)}</text>`;
    }).join("");
  }

  const xTicks = numericX && ["line", "scatter", "area"].includes(type)
    ? xAxis.ticks.map((value) => {
      const x = xScale(value);
      return `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + visual.majorTickLength}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
        ${rotatedTickText(formatTick(value), x, height - margin.bottom + visual.majorTickLength + visual.tickSize + 5, visual)}`;
    }).join("") + xAxis.minorTicks.map((value) => {
      const x = xScale(value);
      return visual.minorTickLength
        ? `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + visual.minorTickLength}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>`
        : "";
    }).join("")
    : rows.map((row, index) => {
      const x = type === "bar" || isErrorBar
        ? margin.left + (plotW / rows.length) * (index + 0.5)
        : xScale(xValues[index]);
      return `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + visual.majorTickLength}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
        ${rotatedTickText(row[0], x, height - margin.bottom + 38, visual)}`;
    }).join("");
  const legend = showLegend ? buildChartLegend(series, colors, visual, width, height, margin) : "";
  const title = $("chart-title").value.trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="34" text-anchor="middle" font-size="${visual.titleSize}" font-weight="${visual.titleWeight}" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="${visual.plotBackground}"/>
      ${legend}
      ${grid}
      ${buildPlotFrame(width, height, margin, visual)}
      ${regressionMarks}
      ${marks}
      ${regressionAnnotations}
      ${xTicks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(30 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function summarizeRawErrorTable(table, errorType) {
  const groups = collectRawGroups(table, [1]);
  if (!groups.length) throw new Error("请至少填写一条有效的重复实验数据。");
  return [
    ["Category", "Mean", errorTypeLabel(errorType)],
    ...groups.map((group) => {
      const values = group.values[0];
      return [group.name, meanValue(values), statisticalError(values, errorType)];
    })
  ];
}

function summarizeRawComboTable(table, errorType) {
  const groups = collectRawGroups(table, [1, 2]);
  if (!groups.length) throw new Error("请至少填写一条有效的柱或折线重复实验数据。");
  const showLine = $("chart-show-overlay-line").checked;
  return [
    ["Category", table[0][1] || "Bar", errorTypeLabel(errorType), table[0][2] || "Line", errorTypeLabel(errorType)],
    ...groups.map((group) => {
      const barValues = group.values[0];
      const lineValues = group.values[1];
      if (!barValues.length) throw new Error(`${group.name} 缺少柱状图重复值。`);
      if (showLine && !lineValues.length) throw new Error(`${group.name} 缺少折线重复值。`);
      return [
        group.name,
        meanValue(barValues),
        statisticalError(barValues, errorType),
        lineValues.length ? meanValue(lineValues) : "",
        lineValues.length ? statisticalError(lineValues, errorType) : ""
      ];
    })
  ];
}

function collectRawGroups(table, valueColumns) {
  const groups = new Map();
  table.slice(1).forEach((row) => {
    const name = String(row[0] || "").trim();
    if (!name) return;
    if (!groups.has(name)) {
      groups.set(name, valueColumns.map(() => []));
    }
    valueColumns.forEach((column, index) => {
      const raw = String(row[column] ?? "").trim();
      if (!raw) return;
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`${name} 中存在非数字重复值。`);
      groups.get(name)[index].push(value);
    });
  });
  return [...groups].map(([name, values]) => ({ name, values }))
    .filter((group) => group.values.some((values) => values.length));
}

function meanValue(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statisticalError(values, type) {
  const sd = sampleStandardDeviation(values);
  if (type === "sem") return sd / Math.sqrt(values.length);
  if (type === "ci95") return 1.96 * sd / Math.sqrt(values.length);
  return sd;
}

function errorTypeLabel(type) {
  return type === "sem" ? "SEM" : type === "ci95" ? "95% CI" : "SD";
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
  const yAxis = chartAxisScale("y", allValues);
  const minY = yAxis.min;
  const maxY = yAxis.max;

  const width = 1200;
  const height = 700;
  const visual = chartVisualSettings();
  const margin = chartPlotMargins(visual, { left: 105, right: 45, top: 82, bottom: 95 });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const colors = chartRenderColors();
  const showGrid = $("chart-show-grid").checked;
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showPointLabels = ["value", "nameValue", "all"].includes(labelMode);
  const showSummaryLabels = ["summary", "all"].includes(labelMode);
  const grid = yAxis.ticks.map((value) => {
    const y = yScale(value);
    return `${showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}"/>` : ""}
      <line x1="${margin.left - visual.majorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), margin.left - visual.majorTickLength - 8, y + 7, visual)}`;
  }).join("") + yAxis.minorTicks.map((value) => {
    const y = yScale(value);
    return visual.minorTickLength
      ? `<line x1="${margin.left - visual.minorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>`
      : "";
  }).join("");
  const groupWidth = plotW / summaries.length;
  const marks = summaries.map((item, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    const boxWidth = Math.min(100, groupWidth * 0.48);
    const color = colors[index % colors.length];
    const points = item.values.map((value, pointIndex) => {
      const jitter = ((pointIndex % 7) - 3) * Math.min(5, boxWidth / 18);
      const pointX = x + jitter;
      const pointText = labelMode === "nameValue" || labelMode === "all"
        ? `${item.name} R${pointIndex + 1}: ${formatChartLabelValue(value)}`
        : `R${pointIndex + 1}: ${formatChartLabelValue(value)}`;
      const labelPosition = chartLabelCoordinates(pointX, yScale(value), visual.labelPosition, 9);
      return `<circle cx="${pointX}" cy="${yScale(value)}" r="${Math.max(3, visual.pointSize * 0.6)}" fill="${color}" fill-opacity="0.65"/>
        ${showPointLabels ? `<text x="${labelPosition.x}" y="${labelPosition.y}" text-anchor="${labelPosition.anchor}" font-size="${Math.max(10, labelSize - 2)}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, color)}">${escapeHtml(pointText)}</text>` : ""}`;
    }).join("");
    const summary = `M=${formatChartLabelValue(item.median)} · Q1=${formatChartLabelValue(item.q1)} · Q3=${formatChartLabelValue(item.q3)} · n=${item.values.length}`;
    return `<line x1="${x}" y1="${yScale(item.max)}" x2="${x}" y2="${yScale(item.min)}" stroke="${color}" stroke-width="${visual.lineWidth}"/>
      <line x1="${x - boxWidth * 0.28}" y1="${yScale(item.max)}" x2="${x + boxWidth * 0.28}" y2="${yScale(item.max)}" stroke="${color}" stroke-width="${visual.lineWidth}"/>
      <line x1="${x - boxWidth * 0.28}" y1="${yScale(item.min)}" x2="${x + boxWidth * 0.28}" y2="${yScale(item.min)}" stroke="${color}" stroke-width="${visual.lineWidth}"/>
      <rect x="${x - boxWidth / 2}" y="${yScale(item.q3)}" width="${boxWidth}" height="${Math.max(1, yScale(item.q1) - yScale(item.q3))}" fill="${color}" fill-opacity="${visual.fillOpacity * 0.35}" stroke="${color}" stroke-width="${visual.lineWidth}"/>
      <line x1="${x - boxWidth / 2}" y1="${yScale(item.median)}" x2="${x + boxWidth / 2}" y2="${yScale(item.median)}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth + 1}"/>
      ${points}
      ${showSummaryLabels ? `<text x="${x}" y="${yScale(item.max) - 12}" text-anchor="middle" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, color)}">${escapeHtml(summary)}</text>` : ""}
      ${rotatedTickText(item.name, x, height - margin.bottom + 38, visual)}`;
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

  const summaries = [...groups].map(([name, values]) => {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return { name, values, mean, sd: sampleStandardDeviation(values, mean) };
  });
  const allValues = summaries.flatMap((item) => [...item.values, item.mean]);
  const yAxis = chartAxisScale("y", allValues, { includeZero: true });
  const minY = yAxis.min;
  const maxY = yAxis.max;

  const width = 1200;
  const height = 700;
  const visual = chartVisualSettings();
  const margin = chartPlotMargins(visual, { left: 110, right: 50, top: 78, bottom: 145 });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const baseline = yScale(0);
  const groupWidth = plotW / summaries.length;
  const barWidth = Math.min(100, groupWidth * 0.56);
  const fillColor = chartSeriesColors[0] || "#FF5252";
  const pointColor = chartSeriesColors[1] || visual.axisColor;
  const lightColor = interpolateColor("#FFFFFF", fillColor, 0.38);
  const useGradient = $("chart-bar-gradient").checked;
  const showGrid = $("chart-show-grid").checked;
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showPointLabels = ["value", "nameValue", "all"].includes(labelMode);
  const showSummaryLabels = ["summary", "all"].includes(labelMode);
  const grid = yAxis.ticks.map((value) => {
    const y = yScale(value);
    return `${showGrid ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}"/>` : ""}
      <line x1="${margin.left - visual.majorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), margin.left - visual.majorTickLength - 8, y + 7, visual)}`;
  }).join("") + yAxis.minorTicks.map((value) => {
    const y = yScale(value);
    return visual.minorTickLength
      ? `<line x1="${margin.left - visual.minorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>`
      : "";
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
      const pointText = labelMode === "nameValue" || labelMode === "all"
        ? `R${pointIndex + 1}: ${formatChartLabelValue(value)}`
        : formatChartLabelValue(value);
      const labelPosition = chartLabelCoordinates(x, y, visual.labelPosition, 13);
      return `<circle cx="${x}" cy="${y}" r="${visual.pointSize}" fill="${pointColor}" stroke="${visual.background}" stroke-width="2"/>
        ${showPointLabels ? `<text x="${labelPosition.x}" y="${labelPosition.y}" text-anchor="${labelPosition.anchor}" font-size="${Math.max(10, labelSize - 1)}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, pointColor)}">${escapeHtml(pointText)}</text>` : ""}`;
    }).join("");
    const summaryText = `mean=${formatChartLabelValue(item.mean)} · SD=${formatChartLabelValue(item.sd)} · n=${item.values.length}`;
    const meanLabel = showSummaryLabels
      ? `<text x="${center}" y="${Math.min(meanY, ...item.values.map(yScale)) - (showPointLabels ? 35 : 16)}" text-anchor="middle" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, fillColor)}">${escapeHtml(summaryText)}</text>`
      : "";
    const labelLines = wrapAxisLabel(item.name);
    const xLabel = labelLines.map((line, lineIndex) =>
      `<tspan x="${center}" dy="${lineIndex === 0 ? 0 : 24}">${escapeHtml(line)}</tspan>`
    ).join("");
    return `<rect x="${center - barWidth / 2}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${visual.style === "graphpad" ? 0 : 2}"
        fill="${useGradient ? `url(#${gradientId})` : fillColor}" fill-opacity="${visual.fillOpacity}" stroke="${visual.style === "graphpad" ? visual.markStroke : visual.axisColor}" stroke-width="${visual.style === "graphpad" ? visual.markStrokeWidth : visual.lineWidth}"/>
      ${points}${meanLabel}
      <text x="${center}" y="${height - margin.bottom + 36}" text-anchor="middle" font-size="${visual.tickSize}" font-weight="${visual.tickWeight}" fill="${visual.axisColor}">${xLabel}</text>`;
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
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="34" text-anchor="middle" font-size="${visual.titleSize}" font-weight="${visual.titleWeight}" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="${visual.plotBackground}"/>
      ${grid}
      ${buildPlotFrame(width, height, margin, visual)}
      <line x1="${margin.left}" y1="${baseline}" x2="${width - margin.right}" y2="${baseline}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>
      ${marks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="${visual.axisTitleSize}" fill="${visual.axisColor}">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(32 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" fill="${visual.axisColor}">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function buildViolinPlotSvg(table) {
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) throw new Error("小提琴图至少需要一条观测数据。");
  const groups = new Map();
  rows.forEach((row) => {
    const group = row[0].trim();
    const value = numericCell(row[1]);
    if (!group) throw new Error("每条观测都需要填写组名。");
    if (!Number.isFinite(value)) throw new Error("Value 列必须全部是数字。");
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(value);
  });

  const visual = chartVisualSettings();
  const colors = chartRenderColors();
  const items = [...groups].map(([name, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const whiskerMin = sorted.find((value) => value >= lowerFence) ?? sorted[0];
    const whiskerMax = [...sorted].reverse().find((value) => value <= upperFence) ?? sorted[sorted.length - 1];
    return {
      name, values, sorted,
      median: quantile(sorted, 0.5),
      q1, q3, whiskerMin, whiskerMax,
      outliers: sorted.filter((value) => value < whiskerMin || value > whiskerMax),
      density: kernelDensity(values, visual.style === "graphpad" ? 128 : 64)
    };
  });
  const allValues = items.flatMap((item) => item.values);
  const densityValues = items.flatMap((item) => item.density.map((entry) => entry.value));
  const yAxis = chartAxisScale("y", [...allValues, ...densityValues]);
  const minY = yAxis.min;
  const maxY = yAxis.max;

  const width = 1200;
  const height = 700;
  const margin = chartPlotMargins(visual, {
    left: 110,
    right: visual.legendPosition === "right" ? 155 : 50,
    top: 90,
    bottom: 115
  });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const yScale = (value) => margin.top + plotH - ((value - minY) / (maxY - minY)) * plotH;
  const groupWidth = plotW / items.length;
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showPoints = ["value", "nameValue", "all"].includes(labelMode);
  const showSummary = ["summary", "all"].includes(labelMode);
  const grid = yAxis.ticks.map((value) => {
    const y = yScale(value);
    return `${$("chart-show-grid").checked ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}" stroke-width="1"/>` : ""}
      <line x1="${margin.left - visual.majorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), margin.left - visual.majorTickLength - 8, y + 7, visual)}`;
  }).join("") + yAxis.minorTicks.map((value) => {
    const y = yScale(value);
    return `${visual.showMinorGrid && $("chart-show-grid").checked ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}" stroke-width="0.7" opacity="0.65"/>` : ""}
      ${visual.minorTickLength ? `<line x1="${margin.left - visual.minorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>` : ""}`;
  }).join("");

  const marks = items.map((item, index) => {
    const center = margin.left + groupWidth * (index + 0.5);
    const color = colors[index % colors.length];
    const density = item.density;
    const maxDensity = Math.max(...density.map((entry) => entry.density), Number.EPSILON);
    const halfWidth = Math.min(90, groupWidth * 0.34);
    const left = density.map((entry) =>
      `${center - (entry.density / maxDensity) * halfWidth},${yScale(entry.value)}`
    );
    const right = [...density].reverse().map((entry) =>
      `${center + (entry.density / maxDensity) * halfWidth},${yScale(entry.value)}`
    );
    const violinShape = visual.style === "graphpad"
      ? `<path d="${buildSmoothViolinPath(density, center, maxDensity, halfWidth, yScale)}" fill="${color}" fill-opacity="${visual.fillOpacity}" stroke="${color}" stroke-width="${visual.lineWidth}" stroke-linejoin="round"/>`
      : `<polygon points="${[...left, ...right].join(" ")}" fill="${color}" fill-opacity="${visual.fillOpacity}" stroke="${color}" stroke-width="${visual.lineWidth}" stroke-linejoin="round"/>`;
    const jitterPoints = item.values.map((value, pointIndex) => {
      const jitter = deterministicJitter(pointIndex, item.values.length) * halfWidth * 0.72;
      const x = center + jitter;
      const label = labelMode === "nameValue" || labelMode === "all"
        ? `${item.name} R${pointIndex + 1}: ${formatChartLabelValue(value)}`
        : formatChartLabelValue(value);
      const position = chartLabelCoordinates(x, yScale(value), visual.labelPosition, 13);
      return `<circle cx="${x}" cy="${yScale(value)}" r="${Math.max(2.5, visual.pointSize * 0.65)}" fill="${visual.axisColor}" fill-opacity="0.65"/>
        ${showPoints ? `<text x="${position.x}" y="${position.y}" text-anchor="${position.anchor}" font-size="${Math.max(10, labelSize - 2)}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, color)}">${escapeHtml(label)}</text>` : ""}`;
    }).join("");
    const summary = `M=${formatChartLabelValue(item.median)} · Q1=${formatChartLabelValue(item.q1)} · Q3=${formatChartLabelValue(item.q3)} · n=${item.values.length}`;
    const inner = visual.violinInner === "boxplot"
      ? (() => {
          const boxWidth = Math.min(58, halfWidth * 0.62);
          const outliers = item.outliers.map((value) =>
            `<circle cx="${center}" cy="${yScale(value)}" r="${Math.max(3.5, visual.pointSize * 0.62)}" fill="${visual.axisColor}"/>`
          ).join("");
          return `<line x1="${center}" y1="${yScale(item.whiskerMax)}" x2="${center}" y2="${yScale(item.q3)}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth}"/>
            <line x1="${center}" y1="${yScale(item.q1)}" x2="${center}" y2="${yScale(item.whiskerMin)}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth}"/>
            <rect x="${center - boxWidth / 2}" y="${yScale(item.q3)}" width="${boxWidth}" height="${Math.max(1, yScale(item.q1) - yScale(item.q3))}" fill="${color}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth}"/>
            <line x1="${center - boxWidth / 2}" y1="${yScale(item.median)}" x2="${center + boxWidth / 2}" y2="${yScale(item.median)}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth + 1}"/>
            ${outliers}`;
        })()
      : `<line x1="${center - halfWidth * 0.45}" y1="${yScale(item.median)}" x2="${center + halfWidth * 0.45}" y2="${yScale(item.median)}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${center}" y1="${yScale(item.q1)}" x2="${center}" y2="${yScale(item.q3)}" stroke="${visual.axisColor}" stroke-width="${visual.lineWidth * 1.5}"/>
        ${jitterPoints}`;
    return `${violinShape}
      ${inner}
      ${showSummary ? `<text x="${center}" y="${yScale(Math.max(...item.values)) - 18}" text-anchor="middle" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, color)}">${escapeHtml(summary)}</text>` : ""}
      ${rotatedTickText(item.name, center, height - margin.bottom + 34, visual)}`;
  }).join("");

  return customChartSvgShell({
    width, height, margin, plotW, plotH, visual, grid, marks,
    yLabel: $("chart-y-label").value, xLabel: $("chart-x-label").value
  });
}

function buildBarErrorLineChartSvg(table) {
  const headers = table[0];
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (headers.length < 5 || !rows.length) {
    throw new Error("柱状图＋误差棒/折线需要类别、柱值、柱误差、折线值、折线误差 5 列。");
  }

  const showBarError = $("chart-show-bar-error").checked;
  const showLine = $("chart-show-overlay-line").checked;
  const showLineError = showLine && $("chart-show-line-error").checked;
  const barValues = rows.map((row) => numericCell(row[1]));
  const barErrors = rows.map((row) => showBarError ? numericCell(row[2]) : 0);
  const lineValues = rows.map((row) => showLine ? numericCell(row[3]) : 0);
  const lineErrors = rows.map((row) => showLineError ? numericCell(row[4]) : 0);

  if (barValues.some((value) => !Number.isFinite(value))) {
    throw new Error("柱值必须全部是数字。");
  }
  if (barErrors.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("启用柱误差棒时，柱误差列必须全部是非负数字。");
  }
  if (showLine && lineValues.some((value) => !Number.isFinite(value))) {
    throw new Error("启用折线时，折线值必须全部是数字。");
  }
  if (lineErrors.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("启用折线误差棒时，折线误差列必须全部是非负数字。");
  }

  const visual = chartVisualSettings();
  const colors = chartRenderColors();
  const barColor = colors[0] || "#727BF4";
  const lineColor = colors[1] || "#EC4899";
  const barErrorColor = resolvedErrorColor("bar", barColor);
  const lineErrorColor = resolvedErrorColor("line", lineColor);
  const width = 1200;
  const height = 700;
  const margin = chartPlotMargins(visual, {
    left: 115,
    right: showLine ? (visual.legendPosition === "right" ? 310 : 155) : (visual.legendPosition === "right" ? 220 : 55),
    top: visual.legendPosition === "top" ? 115 : 85,
    bottom: Math.abs(visual.xRotation) > 30 ? 155 : 115
  });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const rightAxisX = width - margin.right;
  const leftExtent = barValues.flatMap((value, index) => showBarError
    ? [value - barErrors[index], value + barErrors[index]]
    : [value]);
  const leftRange = chartAxisScale("y", leftExtent, { includeZero: true });
  const rightExtent = showLine
    ? lineValues.flatMap((value, index) => showLineError
      ? [value - lineErrors[index], value + lineErrors[index]]
      : [value])
    : [];
  const rightRange = showLine
    ? chartAxisScale("y2", rightExtent, { includeZero: false })
    : null;
  const leftScale = (value) =>
    margin.top + plotH - ((value - leftRange.min) / (leftRange.max - leftRange.min)) * plotH;
  const rightScale = (value) =>
    margin.top + plotH - ((value - rightRange.min) / (rightRange.max - rightRange.min)) * plotH;
  const baseline = leftScale(Math.max(leftRange.min, Math.min(0, leftRange.max)));
  const groupWidth = plotW / rows.length;
  const barWidth = Math.min(62, groupWidth * 0.48);
  const capWidth = Math.max(12, Math.min(24, barWidth * 0.44));
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showValues = labelMode !== "none";

  const grid = leftRange.ticks.map((value) => {
    const y = leftScale(value);
    return `${$("chart-show-grid").checked ? `<line x1="${margin.left}" y1="${y}" x2="${rightAxisX}" y2="${y}" stroke="${visual.gridColor}" stroke-width="1"/>` : ""}
      <line x1="${margin.left - visual.majorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), margin.left - visual.majorTickLength - 8, y + 7, visual)}`;
  }).join("") + leftRange.minorTicks.map((value) => {
    const y = leftScale(value);
    return `${visual.showMinorGrid && $("chart-show-grid").checked ? `<line x1="${margin.left}" y1="${y}" x2="${rightAxisX}" y2="${y}" stroke="${visual.gridColor}" stroke-width="0.7" opacity="0.65"/>` : ""}
      ${visual.minorTickLength ? `<line x1="${margin.left - visual.minorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>` : ""}`;
  }).join("") + (showLine ? rightRange.ticks.map((value) => {
    const y = rightScale(value);
    return `<line x1="${rightAxisX}" y1="${y}" x2="${rightAxisX + visual.majorTickLength}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), rightAxisX + Math.max(visual.y2Gap, visual.majorTickLength + 6), y + 7, visual, { anchor: "start" })}`;
  }).join("") + rightRange.minorTicks.map((value) => {
    const y = rightScale(value);
    return visual.minorTickLength
      ? `<line x1="${rightAxisX}" y1="${y}" x2="${rightAxisX + visual.minorTickLength}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>`
      : "";
  }).join("") : "");

  const bars = barValues.map((value, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    const valueY = leftScale(value);
    const top = Math.min(valueY, baseline);
    const errorHigh = leftScale(value + barErrors[index]);
    const errorLow = leftScale(value - barErrors[index]);
    const labelAnchorY = showBarError ? Math.min(errorHigh, errorLow) : top;
    const labelText = labelMode === "nameValue" || labelMode === "all"
      ? `${headers[1]}: ${formatChartLabelValue(value)}`
      : labelMode === "summary"
        ? `${formatChartLabelValue(value)} ± ${formatChartLabelValue(barErrors[index])}`
        : formatChartLabelValue(value);
    const position = chartLabelCoordinates(x, labelAnchorY, visual.labelPosition, 12);
    const errorMark = showBarError
      ? `<line x1="${x}" y1="${errorHigh}" x2="${x}" y2="${errorLow}" stroke="${barErrorColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${x - capWidth / 2}" y1="${errorHigh}" x2="${x + capWidth / 2}" y2="${errorHigh}" stroke="${barErrorColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${x - capWidth / 2}" y1="${errorLow}" x2="${x + capWidth / 2}" y2="${errorLow}" stroke="${barErrorColor}" stroke-width="${visual.lineWidth}"/>`
      : "";
    return `<rect x="${x - barWidth / 2}" y="${top}" width="${barWidth}" height="${Math.max(1, Math.abs(baseline - valueY))}" fill="${barColor}" fill-opacity="${visual.fillOpacity}" stroke="${visual.markStroke}" stroke-width="${visual.markStrokeWidth}"/>
      ${errorMark}
      ${showValues ? `<text x="${position.x}" y="${position.y}" text-anchor="${position.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, barColor)}" paint-order="stroke" stroke="${visual.background}" stroke-width="4">${escapeHtml(labelText)}</text>` : ""}`;
  }).join("");

  const linePoints = showLine ? lineValues.map((value, index) =>
    `${margin.left + groupWidth * (index + 0.5)},${rightScale(value)}`
  ).join(" ") : "";
  const lineMarks = showLine ? lineValues.map((value, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    const y = rightScale(value);
    const errorHigh = rightScale(value + lineErrors[index]);
    const errorLow = rightScale(value - lineErrors[index]);
    const labelText = labelMode === "nameValue" || labelMode === "all"
      ? `${headers[3]}: ${formatChartLabelValue(value)}`
      : labelMode === "summary"
        ? `${formatChartLabelValue(value)} ± ${formatChartLabelValue(lineErrors[index])}`
        : formatChartLabelValue(value);
    const position = chartLabelCoordinates(x, showLineError ? Math.min(errorHigh, errorLow) : y, visual.labelPosition, 14);
    const errorMark = showLineError
      ? `<line x1="${x}" y1="${errorHigh}" x2="${x}" y2="${errorLow}" stroke="${lineErrorColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${x - capWidth / 2}" y1="${errorHigh}" x2="${x + capWidth / 2}" y2="${errorHigh}" stroke="${lineErrorColor}" stroke-width="${visual.lineWidth}"/>
        <line x1="${x - capWidth / 2}" y1="${errorLow}" x2="${x + capWidth / 2}" y2="${errorLow}" stroke="${lineErrorColor}" stroke-width="${visual.lineWidth}"/>`
      : "";
    return `${errorMark}<circle cx="${x}" cy="${y}" r="${visual.pointSize}" fill="${lineColor}" stroke="${visual.background}" stroke-width="2"/>
      ${showValues ? `<text x="${position.x}" y="${position.y}" text-anchor="${position.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, lineColor)}" paint-order="stroke" stroke="${visual.background}" stroke-width="4">${escapeHtml(labelText)}</text>` : ""}`;
  }).join("") : "";
  const xTicks = rows.map((row, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    return `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + visual.majorTickLength}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${rotatedTickText(row[0], x, height - margin.bottom + 32, visual)}`;
  }).join("");
  const legend = $("chart-show-legend").checked
    ? buildBarErrorLineLegend(headers, { barColor, lineColor }, visual, width, height, margin, rightAxisX, showLine)
    : "";
  const title = $("chart-title").value.trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="42" text-anchor="middle" font-size="${visual.titleSize}" font-weight="${visual.titleWeight}" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="${visual.plotBackground}"/>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>
      ${showLine ? `<line x1="${rightAxisX}" y1="${margin.top}" x2="${rightAxisX}" y2="${height - margin.bottom}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>` : ""}
      <line x1="${margin.left}" y1="${baseline}" x2="${rightAxisX}" y2="${baseline}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>
      ${bars}
      ${showLine ? `<polyline points="${linePoints}" fill="none" stroke="${lineColor}" stroke-width="${visual.lineWidth}" stroke-linejoin="round" stroke-linecap="${visual.lineCap}"/>` : ""}
      ${lineMarks}${xTicks}${legend}
      <text transform="translate(34 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-y-label").value)}</text>
      ${showLine ? `<text transform="translate(${rightAxisX + visual.y2Gap + 74} ${margin.top + plotH / 2}) rotate(90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-y2-label").value)}</text>` : ""}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-x-label").value)}</text>
    </g>
  </svg>`;
}

function buildDualAxisChartSvg(table) {
  const headers = table[0];
  const rows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (headers.length < 3 || !rows.length) {
    throw new Error("双 Y 轴柱线图需要类别、柱形值、折线值 3 列。");
  }
  const barValues = rows.map((row) => numericCell(row[1]));
  const lineValues = rows.map((row) => numericCell(row[2]));
  if ([...barValues, ...lineValues].some((value) => !Number.isFinite(value))) {
    throw new Error("左右轴数据必须全部是数字。");
  }

  const visual = chartVisualSettings();
  const colors = chartRenderColors();
  const barColor = colors[0];
  const lineColor = colors[1 % colors.length];
  const width = 1200;
  const height = 700;
  const margin = chartPlotMargins(visual, {
    left: 115,
    right: visual.legendPosition === "right" ? 310 : 155,
    top: visual.legendPosition === "top" ? 115 : 85,
    bottom: 155
  });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const rightAxisX = width - margin.right;
  const leftRange = chartAxisScale("y", barValues, { includeZero: true });
  const rightRange = chartAxisScale("y2", lineValues, { includeZero: false });
  const leftScale = (value) => margin.top + plotH - ((value - leftRange.min) / (leftRange.max - leftRange.min)) * plotH;
  const rightScale = (value) => margin.top + plotH - ((value - rightRange.min) / (rightRange.max - rightRange.min)) * plotH;
  const leftBaseline = leftScale(Math.max(leftRange.min, Math.min(0, leftRange.max)));
  const groupWidth = plotW / rows.length;
  const barWidth = Math.min(60, groupWidth * 0.44);
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showValues = labelMode !== "none";

  const grid = leftRange.ticks.map((value) => {
    const y = leftScale(value);
    return `${$("chart-show-grid").checked ? `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${visual.gridColor}" stroke-width="1"/>` : ""}
      <line x1="${margin.left - visual.majorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), margin.left - visual.majorTickLength - 8, y + 7, visual)}`;
  }).join("") + rightRange.ticks.map((value) => {
    const y = rightScale(value);
    return `<line x1="${rightAxisX}" y1="${y}" x2="${rightAxisX + visual.majorTickLength}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${chartTickText(formatTick(value), rightAxisX + Math.max(visual.y2Gap, visual.majorTickLength + 6), y + 7, visual, { anchor: "start" })}`;
  }).join("") + leftRange.minorTicks.map((value) => {
    const y = leftScale(value);
    return `${visual.showMinorGrid && $("chart-show-grid").checked ? `<line x1="${margin.left}" y1="${y}" x2="${rightAxisX}" y2="${y}" stroke="${visual.gridColor}" stroke-width="0.7" opacity="0.65"/>` : ""}
      ${visual.minorTickLength ? `<line x1="${margin.left - visual.minorTickLength}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>` : ""}`;
  }).join("") + rightRange.minorTicks.map((value) => {
    const y = rightScale(value);
    return visual.minorTickLength
      ? `<line x1="${rightAxisX}" y1="${y}" x2="${rightAxisX + visual.minorTickLength}" y2="${y}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>`
      : "";
  }).join("");
  const labelPositions = barValues.map((value, index) => resolveDualAxisLabelPositions({
    x: margin.left + groupWidth * (index + 0.5),
    barY: leftScale(value),
    lineY: rightScale(lineValues[index]),
    baseline: leftBaseline,
    labelSize,
    visual,
    bounds: { top: margin.top, bottom: height - margin.bottom }
  }));
  const bars = barValues.map((value, index) => {
    const center = margin.left + groupWidth * (index + 0.5);
    const y = leftScale(value);
    const top = Math.min(y, leftBaseline);
    const position = labelPositions[index].bar;
    return `<rect x="${center - barWidth / 2}" y="${top}" width="${barWidth}" height="${Math.max(1, Math.abs(leftBaseline - y))}" fill="${barColor}" fill-opacity="${visual.fillOpacity}" stroke="${visual.markStroke}" stroke-width="${visual.markStrokeWidth}"/>
      ${showValues ? `<text x="${position.x}" y="${position.y}" text-anchor="${position.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, barColor)}" paint-order="stroke" stroke="${visual.background}" stroke-width="4">${formatChartLabelValue(value)}</text>` : ""}`;
  }).join("");
  const linePoints = lineValues.map((value, index) =>
    `${margin.left + groupWidth * (index + 0.5)},${rightScale(value)}`
  ).join(" ");
  const lineMarks = lineValues.map((value, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    const y = rightScale(value);
    const position = labelPositions[index].line;
    return `<circle cx="${x}" cy="${y}" r="${visual.pointSize}" fill="${lineColor}"/>
      ${showValues ? `<text x="${position.x}" y="${position.y}" text-anchor="${position.anchor}" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual, lineColor)}" paint-order="stroke" stroke="${visual.background}" stroke-width="4">${formatChartLabelValue(value)}</text>` : ""}`;
  }).join("");
  const xTicks = rows.map((row, index) => {
    const x = margin.left + groupWidth * (index + 0.5);
    return `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + visual.majorTickLength}" stroke="${visual.axisColor}" stroke-width="${visual.tickWidth}" stroke-linecap="${visual.lineCap}"/>
      ${rotatedTickText(row[0], x, height - margin.bottom + 32, visual)}`;
  }).join("");
  const legend = $("chart-show-legend").checked
    ? buildDualAxisLegend(headers, barColor, lineColor, visual, width, height, margin, rightAxisX)
    : "";
  const title = $("chart-title").value.trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="42" text-anchor="middle" font-size="${visual.titleSize}" font-weight="${visual.titleWeight}" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="${visual.plotBackground}"/>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>
      <line x1="${rightAxisX}" y1="${margin.top}" x2="${rightAxisX}" y2="${height - margin.bottom}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>
      <line x1="${margin.left}" y1="${leftBaseline}" x2="${rightAxisX}" y2="${leftBaseline}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>
      ${bars}
      <polyline points="${linePoints}" fill="none" stroke="${lineColor}" stroke-width="${visual.lineWidth}" stroke-linejoin="round" stroke-linecap="${visual.lineCap}"/>
      ${lineMarks}${xTicks}${legend}
      <text transform="translate(34 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-y-label").value)}</text>
      <text transform="translate(${rightAxisX + visual.y2Gap + 74} ${margin.top + plotH / 2}) rotate(90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-y2-label").value)}</text>
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-x-label").value)}</text>
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
  const visual = chartVisualSettings();
  const columnRotation = visual.xRotation;
  const longestHeader = Math.max(...headers.map((header) => String(header).length), 1);
  const estimatedHeaderWidth = longestHeader * visual.tickSize * 0.58;
  const rotatedHeaderHeight = Math.abs(Math.sin(columnRotation * Math.PI / 180)) * estimatedHeaderWidth;
  const columnLabelBand = Math.max(34, rotatedHeaderHeight + visual.tickSize + 12);
  const titleBand = $("chart-title").value.trim() ? visual.titleSize + 28 : 18;
  const margin = {
    left: 170,
    right: 120,
    top: Math.max(120, titleBand + columnLabelBand + 18),
    bottom: 90
  };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const cellW = plotW / headers.length;
  const cellH = plotH / rows.length;
  const low = chartSeriesColors[0] || "#F3F6F5";
  const mid = chartSeriesColors[1] || "#F7F7F7";
  const high = chartSeriesColors[2] || "#0072B2";
  const labelMode = chartLabelMode();
  const labelSize = chartLabelSize();
  const showCellLabels = ["value", "nameValue", "all"].includes(labelMode);
  const showSummaryLabel = ["summary", "all"].includes(labelMode);
  const marks = values.map((rowValues, rowIndex) => rowValues.map((value, columnIndex) => {
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    const fill = heatmapCustomMidpoint
      ? ratio <= 0.5
        ? interpolateColor(low, mid, ratio * 2)
        : interpolateColor(mid, high, (ratio - 0.5) * 2)
      : interpolateColor(low, high, ratio);
    const textColor = contrastRatio("#FFFFFF", fill) >= 4.5 ? "#FFFFFF" : visual.axisColor;
    const cellX = margin.left + (columnIndex + 0.5) * cellW;
    const cellY = margin.top + (rowIndex + 0.5) * cellH;
    const detailedCellLabel = labelMode === "nameValue" || labelMode === "all";
    const cellLabel = detailedCellLabel
      ? `<text x="${cellX}" y="${cellY - 3}" text-anchor="middle" font-size="${Math.min(labelSize, Math.max(10, cellW / 8))}" fill="${textColor}">
          <tspan x="${cellX}">${escapeHtml(`${rows[rowIndex][0]} / ${headers[columnIndex]}`)}</tspan>
          <tspan x="${cellX}" dy="${labelSize + 2}">${formatChartLabelValue(value)}</tspan>
        </text>`
      : `<text x="${cellX}" y="${cellY + 6}" text-anchor="middle" font-size="${Math.min(labelSize, Math.max(10, cellW / 8))}" fill="${textColor}">${formatChartLabelValue(value)}</text>`;
    return `<rect x="${margin.left + columnIndex * cellW}" y="${margin.top + rowIndex * cellH}" width="${cellW}" height="${cellH}" fill="${fill}" stroke="#FFFFFF" stroke-width="2"/>
      ${showCellLabels ? cellLabel : ""}`;
  }).join("")).join("");
  const columnLabels = headers.map((header, index) => {
    const x = margin.left + (index + 0.5) * cellW;
    const y = margin.top - 16;
    const anchor = columnRotation < 0 ? "start" : columnRotation > 0 ? "end" : "middle";
    const transform = columnRotation ? ` transform="rotate(${columnRotation} ${x} ${y})"` : "";
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${visual.tickSize}" font-weight="${visual.tickWeight}" fill="${visual.axisColor}"${transform}>${escapeHtml(header)}</text>`;
  }).join("");
  const rowLabels = rows.map((row, index) =>
    `<text x="${margin.left - 14}" y="${margin.top + (index + 0.5) * cellH + 7}" text-anchor="end" font-size="${visual.tickSize}" font-weight="${visual.tickWeight}" fill="${visual.axisColor}">${escapeHtml(row[0])}</text>`
  ).join("");
  const legendSteps = $("chart-show-legend").checked ? Array.from({ length: 40 }, (_, index) => {
    const ratio = index / 39;
    const fill = heatmapCustomMidpoint
      ? ratio <= 0.5
        ? interpolateColor(low, mid, ratio * 2)
        : interpolateColor(mid, high, (ratio - 0.5) * 2)
      : interpolateColor(low, high, ratio);
    return `<rect x="${width - 75}" y="${margin.top + (1 - ratio) * 220}" width="22" height="${220 / 39 + 1}" fill="${fill}"/>`;
  }).join("") : "";
  const legendLabels = $("chart-show-legend").checked
    ? `<text x="${width - 45}" y="${margin.top + 7}" font-size="${visual.tickSize}" font-weight="${visual.tickWeight}" fill="${visual.axisColor}">${formatTick(max)}</text>
      <text x="${width - 45}" y="${margin.top + 226}" font-size="${visual.tickSize}" font-weight="${visual.tickWeight}" fill="${visual.axisColor}">${formatTick(min)}</text>`
    : "";
  const matrixMean = flat.reduce((sum, value) => sum + value, 0) / flat.length;
  const summaryLabel = showSummaryLabel
    ? `<text x="${width - margin.right}" y="82" text-anchor="end" font-size="${labelSize}" font-weight="${chartLabelWeight(visual)}" fill="${chartDataLabelColor(visual)}">min=${formatChartLabelValue(min)} · max=${formatChartLabelValue(max)} · mean=${formatChartLabelValue(matrixMean)} · n=${flat.length}</text>`
    : "";
  const title = $("chart-title").value.trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="38" text-anchor="middle" font-size="${visual.titleSize}" font-weight="700" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      ${marks}${columnLabels}${rowLabels}${legendSteps}${summaryLabel}
      ${legendLabels}
      <text x="${margin.left + plotW / 2}" y="${height - 24}" text-anchor="middle" font-size="${visual.axisTitleSize}" fill="${visual.axisColor}">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(34 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" fill="${visual.axisColor}">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function chartSvgShell({ width, height, margin, plotW, plotH, grid, marks, legend }) {
  const title = $("chart-title").value.trim();
  const visual = chartVisualSettings();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="34" text-anchor="middle" font-size="${visual.titleSize}" font-weight="700" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="${visual.plotBackground}"/>
      ${legend}${grid}
      ${buildPlotFrame(width, height, margin, visual)}
      ${marks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-x-label").value)}</text>
      <text transform="translate(30 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml($("chart-y-label").value)}</text>
    </g>
  </svg>`;
}

function customChartSvgShell({ width, height, margin, plotW, plotH, visual, grid, marks, legend = "", yLabel, xLabel }) {
  const title = $("chart-title").value.trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${visual.background}"/>
    <g font-family="${escapeHtml(visual.font)}, Arial, sans-serif">
      ${title ? `<text x="${width / 2}" y="40" text-anchor="middle" font-size="${visual.titleSize}" font-weight="${visual.titleWeight}" fill="${visual.axisColor}">${escapeHtml(title)}</text>` : ""}
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="${visual.plotBackground}"/>
      ${legend}${grid}
      ${buildPlotFrame(width, height, margin, visual)}
      ${marks}
      <text x="${margin.left + plotW / 2}" y="${height - 22}" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml(xLabel)}</text>
      <text transform="translate(32 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${visual.axisTitleSize}" font-weight="${visual.axisTitleWeight}" fill="${visual.axisColor}">${escapeHtml(yLabel)}</text>
    </g>
  </svg>`;
}

function kernelDensity(values, steps = 48) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, Math.abs(max || 1) * 0.08, 0.1);
  const standardDeviation = sampleStandardDeviation(values);
  const bandwidth = Math.max(
    1.06 * (standardDeviation || spread / 4) * Math.pow(values.length, -0.2),
    spread / 18
  );
  const tail = Math.max(spread * 0.28, bandwidth * 2.4);
  return Array.from({ length: steps }, (_, index) => {
    const value = min - tail + ((max - min + tail * 2) * index) / (steps - 1);
    const density = index === 0 || index === steps - 1 ? 0 : values.reduce((sum, sample) => {
      const z = (value - sample) / bandwidth;
      return sum + Math.exp(-0.5 * z * z);
    }, 0) / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
    return { value, density };
  });
}

function buildSmoothViolinPath(density, center, maxDensity, halfWidth, yScale) {
  const left = density.map((entry) => ({
    x: center - (entry.density / maxDensity) * halfWidth,
    y: yScale(entry.value)
  }));
  const right = [...density].reverse().slice(1).map((entry) => ({
    x: center + (entry.density / maxDensity) * halfWidth,
    y: yScale(entry.value)
  }));
  return catmullRomClosedPath([...left, ...right]);
}

function catmullRomClosedPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${svgNumber(points[0].x)} ${svgNumber(points[0].y)} Z`;
  const closed = [...points, points[0]];
  let path = `M ${svgNumber(closed[0].x)} ${svgNumber(closed[0].y)}`;
  for (let index = 0; index < closed.length - 1; index += 1) {
    const p0 = closed[index - 1] || closed[index];
    const p1 = closed[index];
    const p2 = closed[index + 1];
    const p3 = closed[index + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${svgNumber(c1x)} ${svgNumber(c1y)} ${svgNumber(c2x)} ${svgNumber(c2y)} ${svgNumber(p2.x)} ${svgNumber(p2.y)}`;
  }
  return `${path} Z`;
}

function svgNumber(value) {
  return Number(value.toFixed(3));
}

function deterministicJitter(index, count) {
  if (count <= 1) return 0;
  const sequence = [0, -0.36, 0.36, -0.68, 0.68, -0.18, 0.18, -0.52, 0.52];
  return sequence[index % sequence.length];
}

function paddedRange(values, includeZero) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  const pad = Math.max((max - min) * 0.1, Math.abs(max || 1) * 0.05);
  min -= pad;
  max += pad;
  if (includeZero && values.every((value) => value >= 0)) min = 0;
  if (min === max) max += 1;
  return { min, max };
}

function chartAxisScale(axis, values, { includeZero = false, targetTicks = 5 } = {}) {
  const mode = $(`chart-${axis}-scale-mode`)?.value || "auto";
  const manualMin = numericOptionalValue(`chart-${axis}-min`);
  const manualMax = numericOptionalValue(`chart-${axis}-max`);
  const requestedStep = numericOptionalValue(`chart-${axis}-major-step`);
  const minorCount = Math.max(0, Math.min(9, Number($(`chart-${axis}-minor-count`)?.value) || 0));
  let min;
  let max;
  let step;

  if (mode === "manual") {
    if (!Number.isFinite(manualMin) || !Number.isFinite(manualMax) || manualMin >= manualMax) {
      throw new Error(`${axis.toUpperCase()} 轴手动范围需要填写有效的最小值和最大值。`);
    }
    min = manualMin;
    max = manualMax;
    step = requestedStep > 0 ? requestedStep : niceStep((max - min) / targetTicks);
  } else {
    let dataMin = Math.min(...values);
    let dataMax = Math.max(...values);
    if (includeZero) {
      dataMin = Math.min(0, dataMin);
      dataMax = Math.max(0, dataMax);
    }
    if (dataMin === dataMax) {
      const expansion = Math.abs(dataMax || 1) * 0.2;
      dataMin -= expansion;
      dataMax += expansion;
    }
    step = requestedStep > 0 ? requestedStep : niceStep((dataMax - dataMin) / targetTicks);
    min = Math.floor(dataMin / step) * step;
    max = Math.ceil(dataMax / step) * step;
    if (includeZero && dataMin >= 0) min = 0;
    if (includeZero && dataMax <= 0) max = 0;
  }
  if (!(step > 0)) step = 1;
  const ticks = axisTicks(min, max, step);
  const minorTicks = [];
  if (minorCount > 0) {
    const minorStep = step / (minorCount + 1);
    for (let majorIndex = 0; majorIndex < ticks.length - 1; majorIndex += 1) {
      for (let index = 1; index <= minorCount; index += 1) {
        minorTicks.push(ticks[majorIndex] + minorStep * index);
      }
    }
  }
  return { min, max, step, ticks, minorTicks, minorCount };
}

function niceStep(rawStep) {
  if (!(rawStep > 0)) return 1;
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / (10 ** exponent);
  const niceFraction = [1, 2, 2.5, 5, 10].reduce(
    (best, candidate) => Math.abs(candidate - fraction) < Math.abs(best - fraction) ? candidate : best,
    1
  );
  return niceFraction * (10 ** exponent);
}

function axisTicks(min, max, step) {
  const count = Math.min(100, Math.floor((max - min) / step + 0.5) + 1);
  return Array.from({ length: count }, (_, index) => Number((min + step * index).toPrecision(12)));
}

function numericOptionalValue(id) {
  const raw = $(id)?.value?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function chartLabelCoordinates(x, y, position, offset = 12) {
  if (position === "below") return { x, y: y + offset + 8, anchor: "middle" };
  if (position === "right") return { x: x + offset, y: y + 5, anchor: "start" };
  if (position === "left") return { x: x - offset, y: y + 5, anchor: "end" };
  if (position === "center") return { x, y: y + 5, anchor: "middle" };
  return { x, y: y - offset, anchor: "middle" };
}

function resolveDualAxisLabelPositions({ x, barY, lineY, baseline, labelSize, visual, bounds }) {
  const bar = chartLabelCoordinates(x, barY, visual.labelPosition, 12);
  const line = chartLabelCoordinates(x, lineY, visual.labelPosition, 14);
  const collisionDistance = Math.max(24, labelSize * 1.65);
  if (Math.abs(bar.y - line.y) < collisionDistance) {
    const barIsPositive = barY <= baseline;
    bar.x = x - 8;
    bar.anchor = "end";
    bar.y = barIsPositive ? barY + labelSize + 7 : barY + labelSize + 10;
    line.x = x + 8;
    line.anchor = "start";
    line.y = lineY - 14;
  }
  bar.y = Math.max(bounds.top + labelSize, Math.min(bounds.bottom - 5, bar.y));
  line.y = Math.max(bounds.top + labelSize, Math.min(bounds.bottom - 5, line.y));
  return { bar, line };
}

function rotatedTickText(value, x, y, visual) {
  const rotation = visual.xRotation;
  const anchor = rotation > 0 ? "start" : rotation < 0 ? "end" : "middle";
  const transform = rotation ? ` transform="rotate(${rotation} ${x} ${y})"` : "";
  return chartTickText(value, x, y, visual, { anchor, transform });
}

function buildChartLegend(series, colors, visual, width, height, margin) {
  return series.map((item, index) => {
    let x;
    let y;
    if (visual.legendPosition === "right") {
      x = width - margin.right + 24;
      y = margin.top + 22 + index * (visual.legendSize + 14);
    } else if (visual.legendPosition === "bottom") {
      x = margin.left + index * 190;
      y = height - 52;
    } else if (visual.legendPosition === "inside") {
      x = width - margin.right - 190;
      y = margin.top + 24 + index * (visual.legendSize + 12);
    } else {
      x = margin.left + index * 190;
      y = 64;
    }
    x += visual.legendOffsetX;
    y += visual.legendOffsetY;
    return `<circle cx="${x}" cy="${y - 6}" r="${Math.max(5, visual.pointSize * 0.75)}" fill="${colors[index % colors.length]}"/>
      <text x="${x + 15}" y="${y}" font-size="${visual.legendSize}" font-weight="${visual.legendWeight}" fill="${visual.axisColor}">${escapeHtml(item.name)}</text>`;
  }).join("");
}

function buildDualAxisLegend(headers, barColor, lineColor, visual, width, height, margin, rightAxisX) {
  let x;
  let y;
  if (visual.legendPosition === "top") {
    x = margin.left + 20;
    y = 70;
  } else if (visual.legendPosition === "bottom") {
    x = margin.left + 20;
    y = height - 58;
  } else if (visual.legendPosition === "inside") {
    x = rightAxisX - 155;
    y = margin.top + 25;
  } else {
    x = rightAxisX + visual.y2Gap + 118;
    y = margin.top + 24;
  }
  x += visual.legendOffsetX;
  y += visual.legendOffsetY;
  const secondX = visual.legendPosition === "top" || visual.legendPosition === "bottom" ? x + 180 : x;
  const secondY = visual.legendPosition === "top" || visual.legendPosition === "bottom"
    ? y
    : y + visual.legendSize + 26;
  return `<rect x="${x}" y="${y - 18}" width="16" height="24" fill="${barColor}"/>
    <text x="${x + 28}" y="${y}" font-size="${visual.legendSize}" font-weight="${visual.legendWeight}" fill="${visual.axisColor}">${escapeHtml(headers[1])}</text>
    <line x1="${secondX}" y1="${secondY - 7}" x2="${secondX + 22}" y2="${secondY - 7}" stroke="${lineColor}" stroke-width="${visual.lineWidth}"/>
    <circle cx="${secondX + 11}" cy="${secondY - 7}" r="${visual.pointSize}" fill="${lineColor}"/>
    <text x="${secondX + 34}" y="${secondY}" font-size="${visual.legendSize}" font-weight="${visual.legendWeight}" fill="${visual.axisColor}">${escapeHtml(headers[2])}</text>`;
}

function buildBarErrorLineLegend(headers, colors, visual, width, height, margin, rightAxisX, showLine) {
  let x;
  let y;
  if (visual.legendPosition === "top") {
    x = margin.left + 20;
    y = 70;
  } else if (visual.legendPosition === "bottom") {
    x = margin.left + 20;
    y = height - 58;
  } else if (visual.legendPosition === "inside") {
    x = rightAxisX - 175;
    y = margin.top + 25;
  } else {
    x = rightAxisX + (showLine ? visual.y2Gap + 118 : 28);
    y = margin.top + 24;
  }
  x += visual.legendOffsetX;
  y += visual.legendOffsetY;
  const secondX = visual.legendPosition === "top" || visual.legendPosition === "bottom" ? x + 200 : x;
  const secondY = visual.legendPosition === "top" || visual.legendPosition === "bottom"
    ? y
    : y + visual.legendSize + 26;
  return `<rect x="${x}" y="${y - 18}" width="16" height="24" fill="${colors.barColor}"/>
    <text x="${x + 28}" y="${y}" font-size="${visual.legendSize}" font-weight="${visual.legendWeight}" fill="${visual.axisColor}">${escapeHtml(headers[1] || "Bar")}</text>
    ${showLine ? `<line x1="${secondX}" y1="${secondY - 7}" x2="${secondX + 22}" y2="${secondY - 7}" stroke="${colors.lineColor}" stroke-width="${visual.lineWidth}"/>
      <circle cx="${secondX + 11}" cy="${secondY - 7}" r="${visual.pointSize}" fill="${colors.lineColor}"/>
      <text x="${secondX + 34}" y="${secondY}" font-size="${visual.legendSize}" font-weight="${visual.legendWeight}" fill="${visual.axisColor}">${escapeHtml(headers[3] || "Line")}</text>` : ""}`;
}

function buildPlotFrame(width, height, margin, visual) {
  if (visual.frame === "none" || visual.axisWidth <= 0) return "";
  const left = margin.left;
  const right = width - margin.right;
  const top = margin.top;
  const bottom = height - margin.bottom;
  const line = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${visual.axisColor}" stroke-width="${visual.axisWidth}" stroke-linecap="${visual.lineCap}"/>`;
  if (visual.frame === "box") {
    return `${line(left, top, right, top)}${line(right, top, right, bottom)}${line(left, bottom, right, bottom)}${line(left, top, left, bottom)}`;
  }
  if (visual.frame === "bottom") return line(left, bottom, right, bottom);
  return `${line(left, top, left, bottom)}${line(left, bottom, right, bottom)}`;
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
  if (name === "custom") {
    if (chartSeriesColors.length) return chartSeriesColors;
  }
  if (name === "research-current") {
    const active = activeResearchPalette()?.colors?.map(paletteColorHex).filter(Boolean);
    if (active?.length) return active;
  }
  if (name === "nature") {
    return CLASSIC_PALETTES.research.find((palette) => palette.id === "nature").colors.map(paletteColorHex);
  }
  if (name === "science") {
    return CLASSIC_PALETTES.research.find((palette) => palette.id === "science").colors.map(paletteColorHex);
  }
  if (name.startsWith("classic:")) {
    const [, category, id] = name.split(":");
    const palette = CLASSIC_PALETTES[category]?.find((item) => item.id === id);
    if (palette) return palette.colors.map(paletteColorHex);
  }
  if (name === "journal") return ["#3B5BA5", "#D85A40", "#5B8E55", "#7B5EA7", "#D39C2C"];
  if (name === "mono") return ["#111111", "#555555", "#888888", "#BBBBBB"];
  return ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9"];
}

function formatTick(value) {
  const magnitude = Math.abs(value);
  if (magnitude >= 10000 || (magnitude > 0 && magnitude < 0.01)) return value.toExponential(1);
  return Number(value.toFixed(2)).toString();
}

function chartLabelMode() {
  return $("chart-label-mode")?.value || "none";
}

function chartLabelSize() {
  const value = Number($("chart-label-size")?.value);
  return Number.isFinite(value) ? Math.max(10, Math.min(30, value)) : 17;
}

function formatChartLabelValue(value) {
  const setting = $("chart-label-decimals")?.value || "auto";
  if (setting === "auto") return formatTick(value);
  const decimals = Math.max(0, Math.min(4, Number(setting)));
  return Number(value).toFixed(decimals);
}

function sampleStandardDeviation(values, mean = null) {
  if (values.length < 2) return 0;
  const center = mean ?? values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function linearRegression(xValues, yValues) {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    throw new Error("线性回归至少需要两个有效数据点。");
  }
  const meanX = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
  const meanY = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const denominator = xValues.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  if (denominator === 0) throw new Error("线性回归要求 X 数据不能全部相同。");
  const numerator = xValues.reduce(
    (sum, value, index) => sum + (value - meanX) * (yValues[index] - meanY),
    0
  );
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  const totalVariation = yValues.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  const residualVariation = yValues.reduce((sum, value, index) => {
    const predicted = slope * xValues[index] + intercept;
    return sum + (value - predicted) ** 2;
  }, 0);
  const r2 = totalVariation === 0 ? 1 : Math.max(0, Math.min(1, 1 - residualVariation / totalVariation));
  return { slope, intercept, r2 };
}

function formatRegressionEquation(slope, intercept) {
  const sign = intercept < 0 ? "−" : "+";
  return `y=${formatChartLabelValue(slope)}x ${sign} ${formatChartLabelValue(Math.abs(intercept))}`;
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

function supportsLineFormat(type) {
  return [
    "Line",
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
  const alpha = alphabeticLabel(index);
  if (style === "A") return alpha;
  if (style === "a") return alpha.toLowerCase();
  if (style === "A)") return `${alpha})`;
  if (style === "a)") return `${alpha.toLowerCase()})`;
  if (style === "1)") return `${index + 1})`;
  return String(index + 1);
}

function alphabeticLabel(index) {
  let value = Math.max(0, index) + 1;
  let output = "";
  while (value > 0) {
    value -= 1;
    output = String.fromCharCode(65 + (value % 26)) + output;
    value = Math.floor(value / 26);
  }
  return output;
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
