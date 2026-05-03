#!/usr/bin/env python3
"""Generate OG/Twitter cards for every chapter as 1200x630 SVGs.

Re-run after editing the CHAPTERS list. The generated SVGs are
self-contained and reference no external assets, so they render
correctly when scrapers fetch them.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent

CHAPTERS = [
    {
        "slug": "index",
        "eyebrow": "Six chapters · An interactive journal",
        "title": "More\nis different.",
        "accent": "#6eb5ff",
        "glyph": "boids",
    },
    {
        "slug": "life",
        "eyebrow": "Chapter 01 · Cellular Automata",
        "title": "Life",
        "accent": "#4ade80",
        "glyph": "gol",
    },
    {
        "slug": "form",
        "eyebrow": "Chapter 02 · Fractal Geometry",
        "title": "Form",
        "accent": "#c084fc",
        "glyph": "spiral",
    },
    {
        "slug": "patterns",
        "eyebrow": "Chapter 03 · Pattern Formation",
        "title": "Patterns",
        "accent": "#e879f9",
        "glyph": "stripes",
    },
    {
        "slug": "mind",
        "eyebrow": "Chapter 04 · Neural Emergence",
        "title": "Mind",
        "accent": "#ffb347",
        "glyph": "neurons",
    },
    {
        "slug": "cosmos",
        "eyebrow": "Chapter 05 · Gravity & Structure",
        "title": "Cosmos",
        "accent": "#22d3ee",
        "glyph": "stars",
    },
    {
        "slug": "synthesis",
        "eyebrow": "Chapter 06 · Composition",
        "title": "Synthesis",
        "accent": "#f5d76e",
        "glyph": "compose",
    },
    {
        "slug": "coda",
        "eyebrow": "∞ · Coda",
        "title": "After the\nlast word.",
        "accent": "#f1f1f7",
        "glyph": "fade",
    },
]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def rgba(h, a):
    r, g, b = hex_to_rgb(h)
    return f"rgba({r},{g},{b},{a})"


# --- glyph drawers (SVG fragments) -------------------------------------------

def glyph_boids(accent):
    # A flock of 9 chevrons radiating from a point
    pieces = []
    import math
    cx, cy = 1000, 315
    for i in range(11):
        a = -0.55 + i * 0.11
        d = 60 + (i % 3) * 18
        x = cx + math.cos(a) * d
        y = cy + math.sin(a) * d
        ang_deg = math.degrees(a) + 180
        pieces.append(
            f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang_deg:.1f})" '
            f'fill="{rgba(accent, 0.55)}" stroke="{rgba(accent, 0.85)}" stroke-width="1">'
            f'<path d="M14 0 L-8 -5 L-5 0 L-8 5 Z"/></g>'
        )
    return "\n".join(pieces)


def glyph_gol(accent):
    # A 12x10 grid of GoL-ish cells (some on)
    cell = 22
    cells_on = [
        (1,1),(2,2),(3,3),(2,3),(2,4),
        (5,5),(6,5),(7,5),(6,4),(6,6),
        (8,1),(9,2),(9,3),
        (4,8),(5,8),(6,8),(5,7),(5,9),
        (10,6),(10,7),(11,6),(11,7),
        (8,9),(9,9),(10,9),
    ]
    rects = []
    ox, oy = 880, 105
    for c, r in cells_on:
        rects.append(
            f'<rect x="{ox+c*cell}" y="{oy+r*cell}" width="{cell-3}" height="{cell-3}" rx="2" fill="{rgba(accent, 0.85)}"/>'
        )
    return "\n".join(rects)


def glyph_spiral(accent):
    # Logarithmic spiral path
    import math
    pts = []
    cx, cy = 990, 315
    for i in range(180):
        t = i * 0.13
        r = 6 + math.exp(t * 0.13) * 1.4
        if r > 220: break
        x = cx + r * math.cos(t)
        y = cy + r * math.sin(t)
        pts.append(f"{x:.1f},{y:.1f}")
    pl = " ".join(pts)
    return (
        f'<polyline points="{pl}" fill="none" stroke="{rgba(accent, 0.9)}" stroke-width="2.2" stroke-linecap="round"/>'
        f'<polyline points="{pl}" fill="none" stroke="{rgba(accent, 0.18)}" stroke-width="9"/>'
    )


def glyph_stripes(accent):
    # Curved Turing-stripes
    paths = []
    for i in range(10):
        y = 90 + i * 48
        d = f"M820 {y} q60 -30 120 0 t120 0 t120 0"
        paths.append(f'<path d="{d}" fill="none" stroke="{rgba(accent, 0.70 - i*0.045)}" stroke-width="11" stroke-linecap="round"/>')
    return "\n".join(paths)


def glyph_neurons(accent):
    # A small graph: nodes + connecting lines
    import math, random
    random.seed(7)
    nodes = []
    for li, count in enumerate([3, 4, 5, 4, 3]):
        for n in range(count):
            x = 820 + li * 65
            y = 170 + n * (270 / max(count, 1)) + (li % 2) * 8
            nodes.append((x, y, li))
    edges = []
    for i, (x1, y1, l1) in enumerate(nodes):
        for j, (x2, y2, l2) in enumerate(nodes):
            if l2 == l1 + 1 and random.random() < 0.55:
                edges.append((x1, y1, x2, y2))
    parts = []
    for x1, y1, x2, y2 in edges:
        parts.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{rgba(accent, 0.35)}" stroke-width="1.1"/>')
    for x, y, _ in nodes:
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="6" fill="{rgba(accent, 0.95)}"/>')
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="14" fill="{rgba(accent, 0.18)}"/>')
    return "\n".join(parts)


def glyph_stars(accent):
    # A sparse starfield with one bright orbit
    import math, random
    random.seed(3)
    parts = []
    for _ in range(60):
        x = 800 + random.random() * 320
        y = 100 + random.random() * 430
        r = 0.6 + random.random() * 1.6
        a = 0.3 + random.random() * 0.55
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.2f}" fill="rgba(220,225,240,{a:.2f})"/>')
    cx, cy = 990, 315
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="9" fill="#fff5cc"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="40" fill="none" stroke="{rgba(accent, 0.6)}" stroke-width="1.4"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="80" fill="none" stroke="{rgba(accent, 0.28)}" stroke-width="1.2"/>')
    parts.append(f'<circle cx="{cx + 40}" cy="{cy}" r="3" fill="{accent}"/>')
    parts.append(f'<circle cx="{cx - 60}" cy="{cy + 50}" r="2.4" fill="{accent}"/>')
    return "\n".join(parts)


def glyph_compose(accent):
    # A composite of: a small spiral arc + grid + chevron + node — five overlapping motifs.
    import math
    parts = []
    cx, cy = 990, 315
    # GoL cells (mind)
    for c, r in [(0,0),(1,0),(0,1),(2,1),(2,2),(1,2)]:
        parts.append(f'<rect x="{840+c*16}" y="{180+r*16}" width="13" height="13" rx="2" fill="{rgba(accent, 0.7)}"/>')
    # Spiral arc
    pts = []
    for i in range(80):
        t = i * 0.22
        r = 8 + math.exp(t * 0.12) * 1.0
        if r > 130: break
        x = cx + r * math.cos(t + 1.0)
        y = cy + r * math.sin(t + 1.0)
        pts.append(f"{x:.1f},{y:.1f}")
    parts.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{rgba(accent, 0.9)}" stroke-width="2"/>')
    # Boid chevrons
    for i, ang in enumerate([0.2, 0.7, 1.2, 1.7, 2.2]):
        x = cx + 70 + math.cos(ang) * 80
        y = cy + 30 + math.sin(ang) * 80
        parts.append(
            f'<g transform="translate({x:.1f},{y:.1f}) rotate({math.degrees(ang)+180:.1f})" '
            f'fill="{rgba(accent, 0.75)}"><path d="M12 0 L-7 -4 L-4 0 L-7 4 Z"/></g>'
        )
    # Neurons
    for nx, ny in [(880, 380), (920, 410), (970, 430), (1020, 410), (1060, 380)]:
        parts.append(f'<circle cx="{nx}" cy="{ny}" r="5" fill="{rgba(accent, 0.95)}"/>')
    parts.append(f'<polyline points="880,380 920,410 970,430 1020,410 1060,380" fill="none" stroke="{rgba(accent, 0.4)}" stroke-width="1.1"/>')
    # Star
    parts.append(f'<circle cx="{cx-90}" cy="{cy-60}" r="6" fill="#fff5cc"/>')
    return "\n".join(parts)


def glyph_fade(accent):
    # A single bright point that fades into nothing — for Coda.
    parts = []
    cx, cy = 990, 315
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="220" fill="none" stroke="{rgba(accent, 0.06)}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="140" fill="none" stroke="{rgba(accent, 0.10)}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="70" fill="none" stroke="{rgba(accent, 0.20)}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="22" fill="{rgba(accent, 0.35)}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="6" fill="{accent}"/>')
    # A few far-flung dust motes
    import random
    random.seed(11)
    for _ in range(40):
        x = 800 + random.random() * 320
        y = 100 + random.random() * 430
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="0.9" fill="rgba(220,225,240,0.35)"/>')
    return "\n".join(parts)


GLYPHS = {
    "boids":   glyph_boids,
    "gol":     glyph_gol,
    "spiral":  glyph_spiral,
    "stripes": glyph_stripes,
    "neurons": glyph_neurons,
    "stars":   glyph_stars,
    "compose": glyph_compose,
    "fade":    glyph_fade,
}


# --- card template ------------------------------------------------------------

TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07070d"/>
      <stop offset="100%" stop-color="#0e0e1c"/>
    </linearGradient>
    <radialGradient id="halo" cx="78%" cy="40%" r="55%">
      <stop offset="0%" stop-color="{accent_a25}"/>
      <stop offset="100%" stop-color="rgba(7,7,13,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#halo)"/>

  <!-- monospace eyebrow -->
  <text x="92" y="142" font-family="JetBrains Mono, ui-monospace, monospace"
        font-size="22" letter-spacing="4.6" fill="{accent}">{eyebrow_uc}</text>

  <!-- big serif title -->
  <text x="92" y="290" font-family="Cormorant Garamond, Georgia, serif"
        font-weight="300" font-size="160" fill="#e6e1d9" letter-spacing="-3">
{title_lines}
  </text>

  <!-- footer brand -->
  <g transform="translate(92,560)">
    <text font-family="Cormorant Garamond, Georgia, serif" font-weight="500"
          font-size="32" fill="#e6e1d9" letter-spacing="1.5">EM<tspan fill="{accent}">ERG</tspan>ENCE</text>
    <text x="220" y="-1" font-family="JetBrains Mono, ui-monospace, monospace"
          font-size="15" letter-spacing="3" fill="rgba(230,225,217,0.45)">AN INTERACTIVE JOURNAL ON COMPLEXITY</text>
  </g>

  <!-- accent line -->
  <line x1="92" y1="180" x2="190" y2="180" stroke="{accent}" stroke-width="2" opacity="0.85"/>

  <!-- chapter glyph -->
  {glyph}
</svg>
'''


def render_title(title: str, base_y: int = 290, line_h: int = 162) -> str:
    """Render multi-line titles as <tspan> children inside the parent <text>."""
    lines = title.split("\n")
    parts = []
    for i, line in enumerate(lines):
        y = base_y + i * line_h - (len(lines) - 1) * line_h
        parts.append(f'    <tspan x="92" y="{y}">{line}</tspan>')
    # Re-baseline so the LAST line sits at base_y. But text base_y=290 is the first
    # line baseline; we want all to fit nicely. For 1 line: y=290. For 2 lines:
    # y=200 and y=362. Override by rebuilding with explicit ys.
    if len(lines) == 1:
        return f'    <tspan x="92" y="{base_y}">{lines[0]}</tspan>'
    # Two lines: stack centered around 310
    ys = [220, 380]
    return "\n".join(f'    <tspan x="92" y="{ys[i]}">{lines[i]}</tspan>' for i in range(len(lines)))


def main():
    for chap in CHAPTERS:
        accent = chap["accent"]
        glyph_fn = GLYPHS[chap["glyph"]]
        svg = TEMPLATE.format(
            accent=accent,
            accent_a25=rgba(accent, 0.20),
            eyebrow_uc=chap["eyebrow"].upper(),
            title_lines=render_title(chap["title"]),
            glyph=glyph_fn(accent),
        )
        out = OUT / f"{chap['slug']}.svg"
        out.write_text(svg, encoding="utf-8")
        print(f"  wrote {out.name} ({len(svg):,} bytes)")


if __name__ == "__main__":
    main()
