"""Near-white pixels -> transparent in attendix-logo.png. Run: python frontend/scripts/transparentize-attendix-logo.py"""
from pathlib import Path

from PIL import Image

FRONTEND = Path(__file__).resolve().parents[1]


def process(path: Path) -> None:
    if not path.exists():
        print(f"skip missing: {path}")
        return
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            mx, mn = max(r, g, b), min(r, g, b)
            sat = mx - mn
            if mx >= 248 and sat <= 22:
                px[x, y] = (r, g, b, 0)
            elif mx >= 235 and sat <= 35 and (r + g + b) >= 700:
                t = (mx - 235) / 13.0
                na = int(max(0, min(255, a * (1 - t))))
                px[x, y] = (r, g, b, na)
    img.save(path, optimize=True)
    print(f"updated {path}")


def main() -> None:
    for rel in ("src/images/attendix-logo.png", "public/attendix-logo.png"):
        process(FRONTEND / rel)


if __name__ == "__main__":
    main()
