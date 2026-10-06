"""Create deterministic card thumbnails; retain full PNG originals for the gallery."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
sources = sorted((root / 'public/images/portfolio').glob('*.png'))
sources += [root / 'public/images/refinery-protection-concept.png']
sources += sorted((root / 'public/images/materials').glob('*-generated.png'))
total = 0
for source in sources:
    widths = [480, 960, 1600] if source.parent.name != 'materials' else [400, 800]
    destination = source.parent / 'previews'
    destination.mkdir(exist_ok=True)
    with Image.open(source) as original:
        original = original.convert('RGB')
        for width in widths:
            height = round(original.height * width / original.width)
            preview = original.resize((width, height), Image.Resampling.LANCZOS)
            target = destination / f'{source.stem}-{width}.webp'
            preview.save(target, 'WEBP', quality=86, method=6)
            total += target.stat().st_size
print(f'{len(sources)} originals retained; previews total {total:,} bytes')
