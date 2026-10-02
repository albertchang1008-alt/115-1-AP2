"""Preserve workbook OOXML; apply only Artifact Tool-authored Taiwan wording cells."""
import hashlib,json,re,zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
TEMP=Path('/tmp/taiwan-terms')
PART='xl/worksheets/sheet1.xml'
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def cells(blob):return {c.get('r'):ET.tostring(c) for c in ET.fromstring(blob).findall('s:sheetData/s:row/s:c',NS)}
def text(raw):
    c=ET.fromstring(raw);inline=c.find('s:is',NS)
    return ''.join(inline.itertext()) if inline is not None else c.findtext('s:v',default='',namespaces=NS)
def taiwan(s):return s.replace('每搏輸出量','心搏量').replace('每搏量','心搏量')
changes=json.loads((TEMP/'changes.json').read_text())
with zipfile.ZipFile(TEMP/'baseline.xlsx') as before,zipfile.ZipFile(TEMP/'authored.xlsx') as authored:
    original=before.read(PART).decode();a=cells(original);b=cells(authored.read(PART))
    expected={ref for ref,raw in a.items() if re.search(r'(163|164|169)$',ref) and taiwan(text(raw))!=text(raw)}
    assert {c['ref'] for c in changes}==expected
    replacement=original
    for c in changes:
        ref=c['ref'];assert c['before']==text(a[ref]);assert c['after']==taiwan(text(a[ref]))==text(b[ref])
        m=re.search(r'<c\b[^>]*\br="'+ref+r'"[^>]*>.*?</c>',replacement,re.S);assert m
        replacement=replacement[:m.start()]+taiwan(m[0])+replacement[m.end():]
    staged=TEMP/'preserved.xlsx'
    with zipfile.ZipFile(staged,'w') as after:
        for entry in before.infolist():after.writestr(entry,replacement.encode() if entry.filename==PART else before.read(entry.filename))
with zipfile.ZipFile(TEMP/'baseline.xlsx') as before,zipfile.ZipFile(staged) as after:
    assert before.namelist()==after.namelist()
    other=[p for p in before.namelist() if p!=PART];assert all(before.read(p)==after.read(p) for p in other)
    a,b=cells(before.read(PART)),cells(after.read(PART));assert a.keys()==b.keys()
    changed=[ref for ref in a if a[ref]!=b[ref]];assert set(changed)==expected
    assert all(text(b[ref])==taiwan(text(a[ref])) for ref in changed)
    # Every complete cell element outside the permitted references remains byte-equivalent.
    report={'baselineCommit':'99bca1d','allowedRows':[163,164,169],'changedCellCount':len(changed),'changedCells':changes,'otherQuestionCellsUnchanged':len(a)-len(changed),'allOtherZipPartsUnchanged':other,'styleAndSheetStructureUnchanged':True,'baselineSha256':hashlib.sha256((TEMP/'baseline.xlsx').read_bytes()).hexdigest(),'finalSha256':hashlib.sha256(staged.read_bytes()).hexdigest()}
    (ROOT/'docs/TAIWAN_TERMS_XLSX_VERIFY.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(ROOT/'html/資訊圖表題庫_上傳用.xlsx').write_bytes(staged.read_bytes())
print(json.dumps({'changedCellCount':len(changed),'changedCells':changed,'otherQuestionCellsUnchanged':len(a)-len(changed)},ensure_ascii=False))
