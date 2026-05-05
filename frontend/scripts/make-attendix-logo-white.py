"""Build attendix-logo-white.png (opaque logo -> white, keep alpha). Run: python frontend/scripts/make-attendix-logo-white.py"""
from pathlib import Path

from PIL import Image

FRONTEND = Path(__file__).resolve().parents[1]
SRC = FRONTEND / "src/images/attendix-logo.png"
DST = FRONTEND / "src/images/attendix-logo-white.png"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source: {SRC}")
    img = Image.open(SRC).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 25:
                px[x, y] = (255, 255, 255, 0)
            else:
                px[x, y] = (255, 255, 255, a)
    DST.parent.mkdir(parents=True, exist_ok=True)
    img.save(DST, optimize=True)
    print(f"wrote {DST}")


if __name__ == "__main__":
    main()
