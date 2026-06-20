<p align="center">
  <img src="./assets/easyppt-logo.svg" width="128" alt="EasyPPT logo">
</p>

<h1 align="center">EasyPPT</h1>

<p align="center">
  <a href="https://github.com/troicc/EasyPPT/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/troicc/EasyPPT?style=flat-square"></a>
  <a href="./LICENSE"><img alt="License: AGPL-3.0-or-later" src="https://img.shields.io/badge/license-AGPL--3.0--or--later-195B57?style=flat-square"></a>
  <img alt="Platform: macOS" src="https://img.shields.io/badge/platform-macOS-222222?style=flat-square&logo=apple">
  <img alt="PowerPoint Office.js add-in" src="https://img.shields.io/badge/PowerPoint-Office.js-B7472A?style=flat-square&logo=microsoftpowerpoint">
  <img alt="Native helper: Swift" src="https://img.shields.io/badge/native_helper-Swift-F05138?style=flat-square&logo=swift&logoColor=white">
</p>

English | [简体中文](./README_CN.md)

A productivity toolkit for creating scientific presentations in PowerPoint on macOS—covering layout, plotting, citations, reusable assets, and export.

## Key Features

- **Efficient layout** — Copy position, size, border, and text styles; align and distribute objects; build publication-ready multi-panel figures with labels, titles, and captions.
- **Scientific plotting** — Create common statistical charts, heatmaps, violin plots, and dual-axis charts with journal-inspired styles, scientific palettes, regression, error visualization, and data labels.
- **Content tools** — Insert Markdown and high-resolution LaTeX equations, retrieve DOI metadata and format citations, or polish scientific text with AI.
- **Reusable assets** — Save text boxes, images, groups, charts, and special shapes locally, then restore them as editable native PowerPoint objects.
- **Presentation enhancement** — Generate restrained object animations and slide transitions based on the current slide and its surrounding context.
- **Flexible export** — Export slides as PNG, JPEG, or WebP, or combine the current, selected, or all slides into a PDF.
- **Custom workspace** — Search, favorite, and reorder modules; preferences are saved locally.

## Quick Start

```sh
npm run start
```

After starting the local server, follow the [macOS sideloading guide](./docs/MAC_SIDELOAD.md) to load `manifest.xml` into PowerPoint.

## Architecture

EasyPPT is primarily a PowerPoint Office.js Web Add-in. On macOS, a native Swift clipboard helper and PowerPoint AppleScript integration preserve editable Office object formats in the local asset library.

## Brand Assets

- Vector logo: [`assets/easyppt-logo.svg`](./assets/easyppt-logo.svg)
- 1024 px app icon: [`assets/easyppt-icon-1024.png`](./assets/easyppt-icon-1024.png)
- macOS application icon: [`assets/EasyPPT.icns`](./assets/EasyPPT.icns)

## License

The source code is licensed under [GNU AGPL v3.0 or later](./LICENSE). Contact the maintainer for closed-source commercial licensing. Modified distributions must use a different name and logo; accurate references such as "based on EasyPPT" are permitted. See [LICENSING.md](./LICENSING.md) for complete terms.
