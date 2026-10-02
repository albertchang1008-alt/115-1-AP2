"""Apply Artifact Tool-authored terminology values while preserving all other OOXML."""
import hashlib, json, re, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMP = Path('/tmp/stage1-terminology')
OLD = '\u982d\u81c2\u5e79'
NEW = '頭臂動脈'
PART = 'xl/worksheets/sheet1.xml'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def cells(blob):
    return {c.get('r'): ET.tostring(c) for c in ET.fromstring(blob).findall('s:sheetData/s:row/s:c', NS)}

def text(raw):
    c = ET.fromstring(raw)
    inline = c.find('s:is', NS)
    return ''.join(inline.itertext()) if inline is not None else c.findtext('s:v', default='', namespaces=NS)

baseline = TEMP / 'baseline.xlsx'
destination = ROOT / 'html/資訊圖表題庫_上傳用.xlsx'
changes = json.loads((TEMP / 'changes.json').read_text())
assert len(changes) == 12
with zipfile.ZipFile(baseline) as before, zipfile.ZipFile(TEMP / 'authored.xlsx') as authored:
    original = before.read(PART).decode()
    old_cells, authored_cells = cells(original), cells(authored.read(PART))
    expected = {ref for ref, raw in old_cells.items() if OLD in text(raw) if re.search(r'(196|204)$', ref)}
    assert {c['ref'] for c in changes} == expected
    replacement = original
    for change in changes:
        ref, value = change['ref'], change['value']
        assert value == text(old_cells[ref]).replace(OLD, NEW) == text(authored_cells[ref])
        pattern = r'<c\b[^>]*\br="' + ref + r'"[^>]*>.*?</c>'
        match = re.search(pattern, replacement, re.S)
        assert match and OLD in match[0]
        replacement = replacement[:match.start()] + match[0].replace(OLD, NEW) + replacement[match.end():]
    staged = TEMP / 'preserved.xlsx'
    with zipfile.ZipFile(staged, 'w') as after:
        for entry in before.infolist():
            after.writestr(entry, replacement.encode() if entry.filename == PART else before.read(entry.filename))

with zipfile.ZipFile(baseline) as before, zipfile.ZipFile(staged) as after:
    assert before.namelist() == after.namelist()
    unchanged_parts = [p for p in before.namelist() if p != PART]
    assert all(before.read(p) == after.read(p) for p in unchanged_parts)
    a, b = cells(before.read(PART)), cells(after.read(PART))
    assert a.keys() == b.keys()
    changed = [ref for ref in a if a[ref] != b[ref]]
    assert set(changed) == expected
    assert all(text(b[ref]) == text(a[ref]).replace(OLD, NEW) for ref in changed)
    assert OLD not in after.read(PART).decode()
    # Stronger than a cell comparison: undoing the term substitutions restores the full sheet XML.
    assert before.read(PART).decode() == after.read(PART).decode().replace(NEW, OLD)
    report = {'baselineCommit': (TEMP / 'baseline-commit.txt').read_text().strip(),
              'baselineSha256': hashlib.sha256(baseline.read_bytes()).hexdigest(),
              'finalSha256': hashlib.sha256(staged.read_bytes()).hexdigest(),
              'changedCells': changed, 'changedCellCount': len(changed),
              'otherCellsUnchanged': len(a) - len(changed), 'unchangedZipParts': unchanged_parts,
              'sheetXmlOnlyTerminologyChanged': True, 'newTerm': NEW}
    (ROOT / 'docs/STAGE1_TERMINOLOGY_XLSX_VERIFY.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
destination.write_bytes(staged.read_bytes())
print(json.dumps(report, ensure_ascii=False))
