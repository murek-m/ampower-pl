from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.labels, self.controls, self.links, self.references = path, set(), set(), [], [], []
        self.h1, self.errors = 0, []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        ident = a.get('id')
        if ident:
            if ident in self.ids: self.errors.append('duplicate ID: ' + ident)
            self.ids.add(ident)
        if tag == 'h1': self.h1 += 1
        if tag == 'label' and 'for' in a: self.labels.add(a['for'])
        if tag in ('input', 'select', 'textarea'): self.controls.append(a)
        if tag == 'img' and 'alt' not in a: self.errors.append('image without alt')
        if tag in ('a', 'link') and 'href' in a: self.links.append(a['href'])
        if tag == 'script' and 'src' in a: self.links.append(a['src'])
        for key in ('aria-describedby', 'aria-controls', 'aria-labelledby'):
            if a.get(key): self.references.extend(a[key].split())

root = Path.cwd()
pages = {p: Page(root / p) for p in ['index.html', 'smart-home-energy/index.html']}
for name, page in pages.items():
    if page.h1 != 1: page.errors.append('expected exactly one H1')
    for control in page.controls:
        if control.get('type') != 'hidden' and control.get('id') not in page.labels and not control.get('aria-label'):
            page.errors.append('control without label: ' + str(control.get('id')))
    for ref in page.references:
        if ref not in page.ids: page.errors.append('missing ARIA target: ' + ref)
    for href in page.links:
        url = urlsplit(href)
        if url.scheme or url.netloc: continue
        target = root / url.path.lstrip('/') if url.path.startswith('/') else page.path.parent / unquote(url.path)
        if not url.path: target = page.path
        if target.is_dir(): target /= 'index.html'
        if not target.is_file(): page.errors.append('missing local link: ' + href)
        if url.fragment:
            other = pages.get(str(target.relative_to(root)))
            if other and url.fragment not in other.ids: page.errors.append('missing fragment: ' + href)
    if page.errors: raise SystemExit(name + ': ' + '; '.join(page.errors))
    print(name + ': HTML IDs, labels, ARIA, links OK')
