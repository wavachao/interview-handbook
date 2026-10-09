"""Build standalone, font-embedded PDFs from the same content used by the website."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'dist' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Chinese', 'C:/Windows/Fonts/simsun.ttc', subfontIndex=0))
pdfmetrics.registerFontFamily('Chinese', normal='Chinese', bold='Chinese', italic='Chinese', boldItalic='Chinese')
GREEN = colors.HexColor('#245b49')
MUTED = colors.HexColor('#72826b')
PAGE_WIDTH, PAGE_HEIGHT = A4
styles = {
    'body': ParagraphStyle('body', fontName='Chinese', fontSize=10.2, leading=18.8, spaceAfter=8, wordWrap='CJK', textColor=colors.HexColor('#354231')),
    'chapter': ParagraphStyle('chapter', fontName='Chinese', fontSize=23, leading=33, spaceAfter=17, textColor=GREEN, wordWrap='CJK', keepWithNext=True),
    'question': ParagraphStyle('question', fontName='Chinese', fontSize=14, leading=23, spaceBefore=20, spaceAfter=12, textColor=GREEN, wordWrap='CJK', keepWithNext=True),
    'label': ParagraphStyle('label', fontName='Chinese', fontSize=10.5, leading=18, spaceBefore=9, spaceAfter=5, textColor=GREEN, keepWithNext=True),
    'summary': ParagraphStyle('summary', fontName='Chinese', fontSize=10.2, leading=19, backColor=colors.HexColor('#edf3e7'), borderPadding=11, spaceBefore=3, spaceAfter=15, wordWrap='CJK', textColor=colors.HexColor('#405b36')),
    'source': ParagraphStyle('source', fontName='Chinese', fontSize=8, leading=13, spaceAfter=4, wordWrap='CJK', textColor=MUTED),
    'meta': ParagraphStyle('meta', fontName='Chinese', fontSize=9, leading=17, spaceAfter=8, wordWrap='CJK', textColor=MUTED),
    'cover': ParagraphStyle('cover', fontName='Chinese', fontSize=36, leading=54, spaceAfter=23, textColor=GREEN),
    'cover_sub': ParagraphStyle('cover_sub', fontName='Chinese', fontSize=21, leading=31, spaceAfter=22, textColor=GREEN, wordWrap='CJK'),
    'code': ParagraphStyle('code', fontName='Chinese', fontSize=8, leading=13, leftIndent=9, rightIndent=9, backColor=colors.HexColor('#f3f5ef'), borderPadding=9, spaceBefore=8, spaceAfter=14),
}

def safe(text):
    return escape(str(text).replace('\u2011', '-').replace('\u2010', '-'))

class HandbookDoc(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name in ('chapter', 'question'):
            level = 0 if flowable.style.name == 'chapter' else 1
            text = flowable.getPlainText()
            key = flowable.bookmark_key
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=level, closed=level == 0)
            self.notify('TOCEntry', (level, text, self.page, key))

def page_frame(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#dbe4d3'))
    canvas.line(48, 39, PAGE_WIDTH - 48, 39)
    canvas.setFillColor(MUTED)
    canvas.setFont('Chinese', 8)
    canvas.drawString(48, 25, '面试手册 · 经典知识点整理 / 2026.10')
    canvas.drawRightString(PAGE_WIDTH - 48, 25, str(doc.page))
    if doc.page > 1:
        canvas.drawString(48, PAGE_HEIGHT - 31, 'THE INTERVIEW HANDBOOK')
    canvas.restoreState()

def wrapped_code(code):
    max_width = PAGE_WIDTH - 116
    output = []
    for line in code.expandtabs(2).splitlines():
        current = ''
        for char in line:
            if pdfmetrics.stringWidth(current + char, 'Chinese', 8) > max_width:
                output.append(current)
                current = '  ' + char
            else:
                current += char
        output.append(current)
    return '\n'.join(output)

def build(chapters, filename, subtitle):
    count = sum(len(c['sections']) for c in chapters)
    doc = HandbookDoc(str(OUT / filename), pagesize=A4, topMargin=53, bottomMargin=58, leftMargin=48, rightMargin=48,
                      title=f'面试手册 - {subtitle}', author='面试手册', subject='七科高频面试题原创中文整理', pageCompression=1)
    story = [Spacer(1, 96), Paragraph('THE INTERVIEW HANDBOOK', styles['meta']), Spacer(1, 22),
             Paragraph('面试手册', styles['cover']), Paragraph(safe(subtitle), styles['cover_sub']),
             Paragraph('把基础，读成底气。', styles['body']), Spacer(1, 25),
             Paragraph(f'{len(chapters)} 个科目 / {count} 道问题<br/>回答要点 · 常见追问 · 易错点 · 参考来源', styles['body']),
             Spacer(1, 35), Paragraph('整理日期：2026-10-09', styles['meta']),
             Paragraph('本手册总结经典面试知识点，不是全网公司面经的穷举，也不代表真实招聘频次统计。题解为独立中文整理，具体版本与实现请参考题目中的原始资料。', styles['meta']),
             Paragraph('C++ 以 C++17/20 为主；MySQL 以 8.4 LTS InnoDB 为主；Redis 以开源版常用功能为主。目录、PDF 书签及参考链接均可点击。', styles['meta']), PageBreak(),
             Paragraph('阅读目录', styles['chapter'])]
    story[-1].bookmark_key = 'contents'
    # The contents heading is not itself listed: TOC starts after it.
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle('toc0', fontName='Chinese', fontSize=12, leading=23, spaceBefore=10, textColor=GREEN, wordWrap='CJK'),
        ParagraphStyle('toc1', fontName='Chinese', fontSize=9, leading=17, leftIndent=15, firstLineIndent=0, textColor=colors.HexColor('#5e7055'), wordWrap='CJK'),
    ]
    story.append(toc)
    for c in chapters:
        story.append(PageBreak())
        heading = Paragraph(safe(c['title']), styles['chapter'])
        heading.bookmark_key = c['id']
        story.extend([heading, Paragraph(safe(c['subtitle']), styles['meta']), Paragraph(safe(c['description']), styles['body'])])
        for i, q in enumerate(c['sections'], 1):
            h = Paragraph(f'{i:02d}. {safe(q["title"])}', styles['question'])
            h.bookmark_key = q['id']
            story.extend([h, Paragraph(f'{safe(q["group"])} / {safe(q["level"])}', styles['meta']),
                          Paragraph(safe(q['summary']), styles['summary']), Paragraph('回答要点', styles['label'])])
            for n, point in enumerate(q['points'], 1):
                story.append(Paragraph(f'{n}. {safe(point)}', styles['body']))
            if q.get('code'):
                story.append(Preformatted(wrapped_code(q['code']), styles['code']))
            story.extend([Paragraph('常见追问', styles['label']), Paragraph(safe(q['followup']), styles['body']),
                          Paragraph('易错点', styles['label']), Paragraph(safe(q['pitfall']), styles['body']),
                          Paragraph('延伸阅读 / 原始参考资料', styles['source'])])
            for s in q['sources']:
                story.append(Paragraph(f'<link href="{safe(s["url"])}" color="#245b49">{safe(s["title"])}</link>', styles['source']))
    doc.multiBuild(story, onFirstPage=page_frame, onLaterPages=page_frame)
    reader = PdfReader(OUT / filename)
    text = ''.join(page.extract_text() or '' for page in reader.pages)
    compact_text = ''.join(text.split())
    for c in chapters:
        for q in c['sections']:
            expected_title = q['title'].replace('\u2011', '-').replace('\u2010', '-')
            assert ''.join(expected_title.split()) in compact_text, f'Missing PDF title: {q["id"]}'
    assert reader.outline, 'Missing PDF bookmarks'
    assert any('/Annots' in p for p in reader.pages), 'Missing clickable reference links'
    print(f'{filename}: {len(reader.pages)} pages, {count} questions, titles / bookmarks / links verified')

if __name__ == '__main__':
    chapters = []
    for file in ('content-cpp-ds.json', 'content-systems.json', 'content-databases.json'):
        chapters.extend(json.loads((ROOT / 'dist' / file).read_text(encoding='utf-8-sig')))
    order = ['cpp', 'ds', 'os', 'network', 'architecture', 'mysql', 'redis']
    chapters.sort(key=lambda c: order.index(c['id']))
    build(chapters, 'all.pdf', '计算机基础 · 七科完整手册')
    for c in chapters:
        build([c], f'{c["id"]}.pdf', c['title'])
