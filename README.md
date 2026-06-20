# EasyPPT

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

## License

The source code is licensed under [GNU AGPL v3.0 or later](./LICENSE). Contact the maintainer for closed-source commercial licensing. Modified distributions must use a different name and logo; accurate references such as "based on EasyPPT" are permitted. See [LICENSING.md](./LICENSING.md) for complete terms.
