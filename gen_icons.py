from PIL import Image, ImageDraw, ImageFont
import math

SIZE = 1024
BG = (10, 10, 15)
ACCENT = (108, 99, 255)
GLOW = (108, 99, 255, 40)
WHITE = (255, 255, 255)

def draw_icon(transparent_bg=False):
    if transparent_bg:
        img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    else:
        img = Image.new("RGBA", (SIZE, SIZE), (*BG, 255))
    draw = ImageDraw.Draw(img)

    cx, cy = SIZE // 2, SIZE // 2 - 40
    scale = 2.8

    # Checkmark points (relative)
    p1 = (cx - 120 * scale, cy + 10 * scale)
    p2 = (cx - 30 * scale, cy + 80 * scale)
    p3 = (cx + 130 * scale, cy - 80 * scale)

    # Glow layers
    for r in range(30, 0, -3):
        alpha = int(15 * (1 - r / 30))
        glow_color = (*ACCENT, alpha)
        overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(overlay)
        glow_draw.line([p1, p2, p3], fill=glow_color, width=int(40 + r * 2), joint="curve")
        img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)
    draw.line([p1, p2, p3], fill=(*ACCENT, 255), width=42, joint="curve")
    
    # Round caps
    for p in [p1, p3]:
        draw.ellipse([p[0] - 20, p[1] - 20, p[0] + 20, p[1] + 20], fill=(*ACCENT, 255))
    draw.ellipse([p2[0] - 20, p2[1] - 20, p2[0] + 20, p2[1] + 20], fill=(*ACCENT, 255))

    # "DYT" text
    text = "DYT"
    try:
        font = ImageFont.truetype("arial.ttf", 72)
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    text_x = (SIZE - tw) // 2
    text_y = cy + 160 * scale
    draw.text((text_x, text_y), text, fill=(*WHITE, 200), font=font)

    return img

# Main icon (1024x1024, with dark background)
icon = draw_icon(transparent_bg=False)
icon.save(r"c:\Users\GRIGS\Desktop\PhoneApp\frontend\assets\icon.png")
print("icon.png saved:", icon.size)

# Adaptive icon foreground (1024x1024, transparent)
adaptive = draw_icon(transparent_bg=True)
adaptive.save(r"c:\Users\GRIGS\Desktop\PhoneApp\frontend\assets\adaptive-icon.png")
print("adaptive-icon.png saved:", adaptive.size)

# Favicon (48x48)
favicon = icon.resize((48, 48), Image.LANCZOS)
favicon.save(r"c:\Users\GRIGS\Desktop\PhoneApp\frontend\assets\favicon.png")
print("favicon.png saved:", favicon.size)
