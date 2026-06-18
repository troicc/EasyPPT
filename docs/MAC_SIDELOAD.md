# EasyPPT 本地安装

这是一个 PowerPoint Office.js Web Add-in，适合 macOS 版 PowerPoint 侧载测试。

## 运行本地服务

```sh
npm run start
```

默认地址是：

```text
https://localhost:3000/src/taskpane.html
```

第一次运行会生成自签名证书：

```text
.certs/localhost.crt
```

如果 PowerPoint 任务窗格显示证书错误，把这个证书加入 macOS 钥匙串并设为始终信任，然后重启 PowerPoint。

## 侧载到 macOS PowerPoint

1. 打开 Finder。
2. 按 `Cmd` + `Shift` + `G`。
3. 前往：

```text
/Users/<你的用户名>/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef
```

如果 `wef` 文件夹不存在，就手动创建。

4. 把项目里的 `manifest.xml` 复制到这个 `wef` 文件夹。
5. 重启 PowerPoint。
6. 打开任意 PPT，进入 `开始` > `加载项`，选择 `EasyPPT`。

## 当前功能

- 复制和粘贴选中对象的位置、尺寸。
- 以第一个选中对象为参考做左对齐、居中、顶端对齐、垂直居中。
- 设置选中对象的水平或垂直间距。
- 批量网格排列图片或形状。
- 批量添加图注和科研组图标签。
- 插入轻量 Markdown 文本块。
- 把 LaTeX 公式渲染为高清透明图片插入，兼容旧版 Mac PowerPoint。
- 检查选中文本框或形状的文字/纯色背景对比度，并显示 AA/AAA 等级。
- “智能填充 + 文字”会应用目标填充色，并自动选择对比度更高的黑色或白色文字。
- “修复现有配色”会保留原填充色，只修复未达到 AA 标准的文字颜色。
- 先选择图类型，再在固定表格模板中填写数据；也可直接粘贴 CSV。支持折线、散点、分组柱状、重复值均值柱、面积、均值 ± 误差、箱线和热图，可插入高清图或下载 SVG。
- 根据 DOI 查询 Crossref 元数据，生成完整引用或“期刊缩写、年份、卷(期)、页码”的短引用。
- 引用支持设置字体、字号、颜色、位置和宽度；短引用插入时自动设置期刊名与卷期斜体、年份粗体。
- 每个功能模块标题右侧提供上移和下移按钮，排列顺序会自动保存在本机。
- 本地素材库保存、插入、导入、导出。
- 通过兼容 OpenAI Chat Completions 的接口润色选中文本。
- 导出当前页为 PNG、JPEG 或 WebP，并将当前页、已选页面或全部页面批量合并导出为多页 PDF。

## 已知边界

- Office.js 对 PowerPoint 的能力比 Windows VSTO 少，不能完全复刻 SlideSCI 的所有底层格式复制能力。
- 素材库第一版保存的是对象位置、尺寸和文本，图片二进制与复杂形状样式暂未完整克隆。
- AI 请求是否可用取决于接口是否允许 Office 任务窗格跨域调用；如果被 CORS 拦截，需要接一个本地代理服务。
- CSV 图插入 PowerPoint 后是高清图片；下载的 SVG 可继续在矢量编辑器中修改。
