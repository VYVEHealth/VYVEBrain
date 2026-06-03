# Shared VYVE thumbnail renderer. Used for the Lewis sample AND the real generator.
# Real generator passes a graded video-frame as `bg`; sample synthesises a brand bg.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1280, 720
DARK   = (13, 43, 43)      # #0D2B2B
TEAL   = (27, 120, 120)    # #1B7878
TEALLT = (77, 170, 170)    # #4DAAAA
GOLD   = (201, 168, 76)    # #C9A84C
PAPER  = (244, 250, 250)   # #F4FAFA
HOSTC  = (159, 196, 196)

def _resolve(cands):
    for p in cands:
        if os.path.isfile(p):
            return p
    return None

# Title serif: prefer Playfair Display (brand) if dropped beside the script or installed,
# then elegant fallbacks (Instrument Serif in-container, Georgia/Times on macOS), then DejaVu.
_HERE = os.path.dirname(os.path.abspath(__file__))
SERIF = _resolve([
    os.path.join(_HERE, "PlayfairDisplay.ttf"),
    os.path.join(_HERE, "PlayfairDisplay-Bold.ttf"),
    os.path.join(_HERE, "PlayfairDisplay-Regular.ttf"),
    "/mnt/skills/examples/canvas-design/canvas-fonts/InstrumentSerif-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/Library/Fonts/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
]) or None
SANS = _resolve([
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]) or None
SANSB = _resolve([
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]) or SANS

def F(path, sz):
    return ImageFont.truetype(path, sz) if path else ImageFont.load_default()

def tracked(draw, xy, text, font, fill, tracking=0, shadow=None):
    x, y = xy
    for ch in text:
        if shadow:
            draw.text((x+shadow[0], y+shadow[1]), ch, font=font, fill=shadow[2])
        draw.text((x, y), ch, font=font, fill=fill)
        w = draw.textlength(ch, font=font)
        x += w + tracking
    return x

def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= maxw: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines[:2]

def brand_bg():
    # Sample stand-in for a graded video frame: vertical teal gradient + warm glow.
    bg = Image.new("RGB", (W, H), DARK)
    px = bg.load()
    for y in range(H):
        t = y / H
        r = int(DARK[0] + (TEAL[0]-DARK[0]) * (t*0.85))
        g = int(DARK[1] + (TEAL[1]-DARK[1]) * (t*0.85))
        b = int(DARK[2] + (TEAL[2]-DARK[2]) * (t*0.85))
        for x in range(W): px[x, y] = (r, g, b)
    # warm highlight glow upper-right (brand: warm highlights)
    glow = Image.new("L", (W, H), 0); gd = ImageDraw.Draw(glow)
    gd.ellipse([W-560, -260, W+200, 360], fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    warm = Image.new("RGB", (W, H), (210, 180, 120))
    bg = Image.composite(warm, bg, glow.point(lambda v: int(v*0.55)))
    return bg

def grade(frame):
    # Brand grade applied to a real frame: deepen + teal-bias shadows, keep warm highlights.
    f = frame.convert("RGB").resize((W, H))
    tint = Image.new("RGB", (W, H), DARK)
    return Image.blend(f, tint, 0.22)

def render(category, title, host, bg=None, logo_path=None, out="thumb.jpg"):
    img = (grade(bg) if bg is not None else brand_bg()).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    # bottom scrim for legibility
    scrim = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(scrim)
    for y in range(H):
        a = 0 if y < H*0.40 else int(((y - H*0.40) / (H*0.60)) ** 1.4 * 215)
        sd.line([(0, y), (W, y)], fill=a)
    img = Image.composite(Image.new("RGB", (W, H), DARK), img, scrim)
    d = ImageDraw.Draw(img, "RGBA")

    MX, base = 92, H - 96
    f_eyebrow = F(SANSB, 25); f_title = F(SERIF, 96); f_host = F(SANS, 32)
    try:
        f_title.set_variation_by_axes([600])  # Playfair VF -> medium-bold for thumbnail legibility
    except Exception:
        pass

    # title (wrap to <=2 lines), measured upward from host line
    tlines = wrap(d, title, f_title, W - MX - 360)
    th = len(tlines) * 96
    host_y = base
    title_bottom = host_y - 34
    title_top = title_bottom - th
    eyebrow_y = title_top - 40

    # gold accent rule
    d.line([(MX, eyebrow_y+14), (MX, base+30)], fill=GOLD, width=3)
    TX = MX + 26
    tracked(d, (TX, eyebrow_y), category.upper(), f_eyebrow, GOLD, tracking=4)
    yy = title_top
    for ln in tlines:
        d.text((TX-2, yy), ln, font=f_title, fill=PAPER)
        yy += 96
    tracked(d, (TX, host_y), ("with " + host) if host else "VYVE session", f_host, HOSTC, tracking=1)

    # logo top-left (real logo if given, else wordmark stand-in)
    if logo_path and os.path.isfile(logo_path):
        lg = Image.open(logo_path).convert("RGBA"); lw = 168
        lg = lg.resize((lw, int(lg.height*lw/lg.width)))
        img.paste(lg, (MX-4, 64), lg)
    else:
        tracked(d, (MX-2, 60), "VYVE", F(SERIF, 52), PAPER, tracking=10)
        d.line([(MX, 124), (MX+196, 124)], fill=(255,255,255,90), width=2)

    img.save(out, "JPEG", quality=90)
    return out
