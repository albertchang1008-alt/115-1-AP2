"""Read-only acceptance: compare the workbook against Git and actual public HTML.

After the registration commit: python3 scripts/materials-question-bank-audit.py HEAD^
No writes, no spreadsheet dependencies, no platform access.
"""
import collections
import io
import json
import pathlib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
ref = sys.argv[1] if len(sys.argv) > 1 else "HEAD^"
filename = "html/資訊圖表題庫_上傳用.xlsx"
before = zipfile.ZipFile(io.BytesIO(subprocess.check_output(["git", "show", f"{ref}:{filename}"], cwd=root)))
after = zipfile.ZipFile(root / filename)
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def values(archive, sheet):
    assert "xl/sharedStrings.xml" not in archive.namelist()
    out = {}
    for c in ET.fromstring(archive.read(sheet)).findall("s:sheetData/s:row/s:c", ns):
        inline = c.find("s:is", ns)
        value = ("".join(inline.itertext()) if inline is not None else None) if c.get("t") == "inlineStr" else c.findtext("s:v", namespaces=ns)
        out[c.get("r")] = (value, c.findtext("s:f", namespaces=ns))
    return out


s1, s2 = "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"
old, new = values(before, s1), values(after, s1)
for row in range(2, 108):
    for col in "ABCDEFGHIJKLMNOPQRSTUVWX":
        assert old.get(f"{col}{row}") == new.get(f"{col}{row}"), f"Old cell changed: {col}{row}"
raw = lambda archive: re.findall(rb"<row\b.*?</row>", archive.read(s1), re.S)
assert raw(before) == raw(after)[:107]
notes_old, notes_new = values(before, s2), values(after, s2)
assert all(value == notes_new.get(cell) for cell, value in notes_old.items() if cell != "B23")
assert notes_new["B23"] == ("161 題", None)
ids = [new[f"B{row}"][0] for row in range(2, 163)]
assert len(set(ids)) == 161
assert len(raw(after)) == 162
slugs = ["blood-vessels", "circulation-routes", "blood-pressure-regulation", "lymphatic-system", "hemodynamics"]
correct_positions = collections.Counter()
matched = 0
for index, slug in enumerate(slugs):
    html = (root / f"public/materials/{slug}-v1/index.html").read_text()
    content, _ = json.JSONDecoder().raw_decode(html[html.rindex("\nmount(") + 7:])
    title = re.search(r"<title>(.*?)</title>", html).group(1)
    for seq, q in enumerate(content["foundation"] + content["cases"], 1):
        row = 108 + 11 * index + seq - 1
        val = lambda col: new.get(f"{col}{row}", (None, None))[0]
        assert val("B") == q["id"] and val("H") == q["stem"]
        assert val("C") == val("D") == val("V") == title
        assert int(val("E")) == seq and val("F") == "TRUE" and val("G") == "單選"
        options = [val(col) for col in "IJKL"]
        assert sorted(options) == sorted(q["options"]) and options != q["options"]
        answer = "ABCD".index(val("M"))
        assert options[answer] == q["options"][q["answer"]] and int(val("N")) == answer + 1
        assert all(val(col) for col in "OPQRS")
        assert all(val(col) in (None, "") for col in "ATUX")
        assert val("W") == f"https://albertchang1008-alt.github.io/115-1-AP2/materials/{slug}-v1/index.html"
        matched += 1
        correct_positions[val("M")] += 1
assert matched == 55
print(json.dumps({"originalCellsCompared": 2544, "originalCellsChanged": 0, "originalRowXmlUnchanged": 107, "htmlQuestionsMatched": matched, "total": 161, "duplicateIds": 0, "correctPositions": dict(correct_positions)}, ensure_ascii=False))
