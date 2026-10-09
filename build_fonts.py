"""Subset the OFL WenKai fonts for this handbook's text."""
import argparse
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--regular', default=str(root / 'tmp/wenkai/LXGWWenKai-Regular.ttf'))
parser.add_argument('--medium', default=str(root / 'tmp/wenkai/LXGWWenKai-Medium.ttf'))
args = parser.parse_args()
text = ''.join(p.read_text(encoding='utf-8-sig') for p in (root / 'dist').iterdir() if p.suffix in ('.html', '.js', '.json'))
characters = set(map(ord, text)) | set(range(32, 127))
output = root / 'dist' / 'fonts'
output.mkdir(exist_ok=True)
for source, name in ((args.regular, 'regular'), (args.medium, 'medium')):
    font = TTFont(source)
    options = subset.Options()
    options.layout_features = ['*']
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=characters)
    sub.subset(font)
    # Rename the subset to respect the upstream font's reserved names.
    labels = {1: 'Handbook WenKai', 2: name.title(), 3: f'HandbookWenKai-{name}',
              4: f'Handbook WenKai {name.title()}', 6: f'HandbookWenKai-{name}',
              16: 'Handbook WenKai', 17: name.title()}
    for record in font['name'].names:
        if record.nameID in labels:
            record.string = labels[record.nameID].encode(record.getEncoding())
    font.flavor = 'woff'
    target = output / f'wenkai-{name}.woff'
    font.save(target)
    exported = TTFont(target)
    required = {c for c in characters if 0x4e00 <= c <= 0x9fff}
    assert required <= set(exported.getBestCmap()), 'Missing Chinese glyphs'
    print(f'{target.name}: {target.stat().st_size // 1024} KiB, {len(required)} Chinese characters verified')
