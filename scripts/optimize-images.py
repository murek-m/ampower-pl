"""Create responsive WebP copies without changing the original photographs.

Run with Python + Pillow. Generated filenames are content hashes; original JPEGs
stay in the source tree. Only referenced public files enter the release manifest.
"""
from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO
import hashlib
import json
import re

root = Path(__file__).resolve().parent.parent
page = root / 'index.html'
html = page.read_text()
manifest_path = root / 'assets/public-assets.json'
manifest = json.loads(manifest_path.read_text())
mapping = {}
aliases = {}
for path in sorted((root / 'assets/images').glob('*.jpg')):
    with Image.open(path) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        variants = []
        for width in sorted(set([min(480, image.width), min(640, image.width), image.width])):
            resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            resized.save(buffer, 'WEBP', quality=74, method=6)
            data = buffer.getvalue()
            name = 'assets/images/' + hashlib.sha256(data).hexdigest()[:16] + '.webp'
            original_name = path.relative_to(root).as_posix()
            aliases[name] = original_name
            previous = BytesIO()
            resized.save(previous, 'WEBP', quality=82, method=6)
            aliases['assets/images/' + hashlib.sha256(previous.getvalue()).hexdigest()[:16] + '.webp'] = original_name
            if width == image.width and len(data) >= path.stat().st_size:
                name = original_name
            else:
                (root / name).write_bytes(data)
            variants.append((name, width))
        mapping[path.relative_to(root).as_posix()] = variants

def replace(match):
    tag = match.group(0)
    source = re.search(r'src="/([^"]+)"', tag).group(1)
    variants = mapping[aliases.get(source, source)]
    tag = re.sub(r'\s+(?:srcset|sizes)="[^"]*"', '', tag)
    # Cards have two columns from 641px; galleries and features stack below 881px.
    before = html[:match.start()]
    if before.rfind('class="card-photo"') > before.rfind('</div>'):
        sizes = '(max-width: 640px) calc(100vw - 48px), (max-width: 1100px) calc((100vw - 68px) / 2), 516px'
    elif before.rfind('class="gallery"') > before.rfind('</section>'):
        sizes = '(max-width: 880px) calc(100vw - 48px), (max-width: 1100px) calc((100vw - 88px) / 3), 338px'
    else:
        sizes = '(max-width: 880px) calc(100vw - 48px), 516px'
    tag = tag.replace('src="/' + source + '"', 'src="/' + variants[-1][0] + '"')
    srcset = ', '.join('/' + name + ' ' + str(width) + 'w' for name, width in variants)
    return tag[:-1] + ' srcset="' + srcset + '" sizes="' + sizes + '">'

html = re.sub(r'<img\b[^>]*src="/assets/images/[a-f0-9]{16}\.(?:jpg|webp)"[^>]*>', replace, html)
page.write_text(html)
# Keep JPEG Open Graph URLs and all non-image assets. On subsequent runs retain
# existing referenced WebPs, so rerunning the script is safe.
references = set(re.findall(r'assets/images/[a-f0-9]{16}\.(?:jpg|webp)', html))
manifest = sorted(set(p for p in manifest if not p.startswith('assets/images/')) | references)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print('Responsive photographs:', len(mapping), 'public images:', len(references))
