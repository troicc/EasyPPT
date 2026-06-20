from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent
SCREENSHOTS = ROOT / "screenshots"
OUTPUT = ROOT / "cards"
OUTPUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1440
TEAL = "#195B57"
INK = "#142523"
MUTED = "#687874"
FONT = "/System/Library/Fonts/PingFang.ttc"

CARDS = [
    {
        "file": "02-chart.png",
        "output": "01-csv-chart.png",
        "section": "科研作图",
        "title": ("数据贴进去，", "论文风图表直接长出来"),
        "subtitle": "告别 Excel 炼丹，在 PPT 里完成科研作图",
        "chips": ("8 类科研图", "色盲友好", "高清 SVG"),
        "accent": "#F2AF3A",
    },
    {
        "file": "03-markdown-latex.png",
        "output": "02-markdown-latex.png",
        "section": "公式排版",
        "title": ("公式不糊，", "排版不崩"),
        "subtitle": "Markdown 与 LaTeX，直接写进 PowerPoint",
        "chips": ("高清公式", "一键插入", "自由定位"),
        "accent": "#79B8AA",
    },
    {
        "file": "01-doi.png",
        "output": "03-doi-citation.png",
        "section": "文献引用",
        "title": ("DOI 一贴，", "引用自己排好队"),
        "subtitle": "查询、排版、保存，一次完成",
        "chips": ("长短引用", "格式可调", "本地引用库"),
        "accent": "#F2AF3A",
    },
    {
        "file": "04-templates.png",
        "output": "04-section-templates.png",
        "section": "科研模板",
        "title": ("科研 PPT，", "也值得有设计感"),
        "subtitle": "不是商务模板，是为研究汇报准备的章节转场",
        "chips": ("6 套版式", "中英双语", "原生可编辑"),
        "accent": "#79B8AA",
    },
    {
        "file": "05-export.png",
        "output": "05-hd-export.png",
        "section": "高清导出",
        "title": ("做完直接交付，", "清晰度不掉线"),
        "subtitle": "从组会屏幕，到论文附件",
        "chips": ("PNG / WebP", "多页 PDF", "最高 4K"),
        "accent": "#F2AF3A",
    },
]


def font(size):
    return ImageFont.truetype(FONT, size=size)


def rounded_image(image, radius):
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *image.size), radius=radius, fill=255)
    result = Image.new("RGBA", image.size)
    result.paste(image.convert("RGBA"), mask=mask)
    return result


def add_centered_text(draw, xy, text, selected_font, fill):
    box = draw.textbbox((0, 0), text, font=selected_font)
    x = xy[0] - (box[2] - box[0]) / 2
    y = xy[1] - (box[3] - box[1]) / 2
    draw.text((x, y), text, font=selected_font, fill=fill)


def build(card):
    canvas = Image.new("RGB", (W, H), "#FAF8F2")
    px = canvas.load()
    start = (250, 248, 242)
    end = (233, 243, 239)
    for y in range(H):
        for x in range(W):
            mix = min(1, (x / W) * 0.42 + (y / H) * 0.58)
            px[x, y] = tuple(round(start[i] * (1 - mix) + end[i] * mix) for i in range(3))

    decor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(decor)
    dd.ellipse((830, -80, 1160, 250), fill=(221, 236, 231, 175))
    dd.ellipse((850, 1110, 1250, 1510), fill=(224, 239, 234, 155))
    for row in range(7):
        for col in range(8):
            dd.ellipse(
                (790 + col * 31, 165 + row * 31, 796 + col * 31, 171 + row * 31),
                fill=(25, 91, 87, 28),
            )
    dd.arc((-90, 20, 1160, 260), 195, 345, fill=(25, 91, 87, 20), width=3)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), decor)
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((54, 48, 250, 94), radius=23, fill=TEAL)
    add_centered_text(draw, (152, 71), "EASYPPT", font(20), "white")
    draw.text((286, 56), card["section"], font=font(22), fill="#5F706C")

    draw.rounded_rectangle((54, 128, 63, 261), radius=5, fill=card["accent"])
    draw.text((88, 128), card["title"][0], font=font(56), fill=INK)
    draw.text((88, 198), card["title"][1], font=font(56), fill=INK)
    draw.text((88, 281), card["subtitle"], font=font(25), fill=MUTED)

    frame = (65, 348, 1015, 1276)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (frame[0] + 4, frame[1] + 18, frame[2] + 4, frame[3] + 18),
        radius=34,
        fill=(18, 59, 56, 55),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(23))
    canvas = Image.alpha_composite(canvas, shadow)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(frame, radius=34, fill="#FFFFFF", outline="#D4E0DD", width=2)
    for x, color in ((100, "#F2AF3A"), (123, "#79B8AA"), (146, TEAL)):
        draw.ellipse((x - 6, 370 - 6, x + 6, 370 + 6), fill=color)

    source = Image.open(SCREENSHOTS / card["file"]).convert("RGB")
    max_w, max_h = 894, 850
    scale = min(max_w / source.width, max_h / source.height)
    new_size = (round(source.width * scale), round(source.height * scale))
    source = source.resize(new_size, Image.Resampling.LANCZOS)
    source = rounded_image(source, 20)
    sx = (W - source.width) // 2
    sy = 397 + (850 - source.height) // 2
    canvas.alpha_composite(source, (sx, sy))

    chip_font = font(25)
    widths = [max(170, draw.textbbox((0, 0), c, font=chip_font)[2] + 78) for c in card["chips"]]
    total = sum(widths) + 28 * (len(widths) - 1)
    x = (W - total) // 2
    for chip, width in zip(card["chips"], widths):
        draw.rounded_rectangle((x, 1310, x + width, 1372), radius=31, fill="#FFFFFF",
                               outline="#C9D9D5", width=2)
        add_centered_text(draw, (x + width / 2, 1341), chip, chip_font, TEAL)
        x += width + 28

    add_centered_text(draw, (W / 2, 1411), "科研 PPT 效率助手", font(18), "#84918E")
    canvas.convert("RGB").save(OUTPUT / card["output"], quality=95)


for item in CARDS:
    build(item)

print(f"Generated {len(CARDS)} cards in {OUTPUT}")
