# EasyPPT

一个面向 macOS PowerPoint 的科研 PPT 效率助手。

## 快速开始

```sh
npm run start
```

然后按 [docs/MAC_SIDELOAD.md](./docs/MAC_SIDELOAD.md) 把 `manifest.xml` 侧载到 PowerPoint。

## 功能模块

- 位置尺寸复制粘贴
- 对齐和间距增强
- 图片网格排列
- 批量图注和组图标签
- Markdown 插入
- LaTeX 高清公式插入
- 选中文本形状的文字/纯色背景对比度检查、智能配色与一键修复
- 固定表格模板与 CSV 双输入模式，支持折线、散点、分组柱状、重复值均值柱、面积、均值 ± 误差、箱线和热图
- 图标题、坐标轴、配色、网格、图例与数据标签设置
- DOI 元数据查询、完整/短引用、富文本格式插入和本地引用库
- 模块顺序自定义并自动保存
- 本地素材库（中英文双版本、6 套可编辑章节过渡页、6 套特色顶部导航栏、缩略图预览、对象统计、JSON 导入导出；导出文件进入系统默认“下载”文件夹）
- AI 文本润色
- 当前页 PNG、JPEG、WebP 导出，以及当前页、已选页面或全部页面的多页 PDF 合并导出；支持标准、高清、超高清和自定义清晰度

## 技术说明

macOS 上不能直接使用 Windows VSTO/COM 插件架构，所以这里使用 PowerPoint Office.js Web Add-in。插件本体是静态网页，PowerPoint 通过 `manifest.xml` 加载任务窗格。
