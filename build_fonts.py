"""Subset the installed OFL Noto Sans SC font for this handbook's text."""
import argparse
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--source', default='C:/Windows/Fonts/NotoSansSC-VF.ttf')
args = parser.parse_args()
text = ''.join(p.read_text(encoding='utf-8-sig') for p in (root / 'dist').iterdir() if p.suffix in ('.html', '.js', '.json'))
characters = set(map(ord, text)) | set(range(32, 127))
output = root / 'dist' / 'fonts'
output.mkdir(exist_ok=True)
for weight, name in ((400, 'regular'), (600, 'semibold')):
    font = TTFont(args.source)
    options = subset.Options()
    options.layout_features = ['*']
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=characters)
    sub.subset(font)
    font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
    font.flavor = 'woff'
    target = output / f'handbook-{name}.woff'
    font.save(target)
    exported = TTFont(target)
    required = {c for c in characters if 0x4e00 <= c <= 0x9fff}
    assert required <= set(exported.getBestCmap()), 'Missing Chinese glyphs'
    print(f'{target.name}: {target.stat().st_size // 1024} KiB, {len(required)} Chinese characters verified')
