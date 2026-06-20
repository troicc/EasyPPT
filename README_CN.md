# EasyPPT

[English](./README.md) | 简体中文

面向 macOS PowerPoint 的科研演示效率工具：集中完成排版、绘图、引用、素材复用与导出。

## 核心功能

- **高效排版**：复制位置、尺寸、边框与文字格式；快速对齐、调整间距，并一键整理多图 Figure、标签、标题和图注。
- **科研绘图**：支持常用统计图、热图、小提琴图及双 Y 轴图；内置多套期刊风格、科研配色、回归分析、误差展示和数据标签。
- **内容增强**：插入 Markdown 与高清 LaTeX 公式，查询 DOI 并生成引用，使用 AI 润色科研文本。
- **素材复用**：本地保存文本框、图片、组合、图表和特殊形状，再次插入时保持 PowerPoint 原生可编辑格式。
- **演示优化**：根据页面内容及上下页结构智能安排对象动画和页面过渡。
- **灵活导出**：将幻灯片导出为 PNG、JPEG、WebP，或把当前页、选中页及全部页面合并为 PDF。
- **个性化工作区**：搜索、收藏和调整功能模块顺序，偏好设置自动保存在本地。

## 快速开始

```sh
npm run start
```

启动本地服务后，按照 [macOS 侧载指南](./docs/MAC_SIDELOAD.md) 将 `manifest.xml` 加载到 PowerPoint。

## 技术架构

EasyPPT 主体基于 PowerPoint Office.js Web Add-in。为保留素材的 Office 原生格式，macOS 端额外使用 Swift 剪贴板助手与 PowerPoint AppleScript 接口。

## 许可证

源代码采用 [GNU AGPL v3.0 or later](./LICENSE) 许可。闭源商业集成可联系项目维护者获取商业授权。修改或重新发布的版本必须使用不同的名称和 Logo；允许准确注明“基于 EasyPPT”。完整条款请参阅 [LICENSING.md](./LICENSING.md)。
