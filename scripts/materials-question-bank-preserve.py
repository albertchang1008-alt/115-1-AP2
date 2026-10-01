"""Narrow append of Artifact Tool-authored rows, protecting an active student bank.

No spreadsheet authoring library is used here: values come from Artifact Tool's
export; original ZIP entries and old row XML are retained verbatim.
"""
import collections
import hashlib
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

baseline, authored, destination, expected_path, report_path = map(pathlib.Path, sys.argv[1:])
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
ET.register_namespace("", NS)
ns = {"s": NS}


def strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    return ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]


def cells(archive, sheet):
    shared = strings(archive)
    result = {}
    for cell in ET.fromstring(archive.read(sheet)).findall("s:sheetData/s:row/s:c", ns):
        kind = cell.get("t", "n")
        value = cell.find("s:v", ns)
        if kind == "inlineStr":
            value = "".join(cell.find("s:is", ns).itertext()) if cell.find("s:is", ns) is not None else ""
        elif kind == "s":
            value = shared[int(value.text)]
        elif value is not None:
            value = value.text
            if kind == "n":
                value = float(value) if "." in value else int(value)
            elif kind == "b":
                value = bool(int(value))
        else:
            value = None
        result[cell.get("r")] = (value, cell.findtext("s:f", default=None, namespaces=ns))
    return result


def raw_rows(xml):
    return {int(re.search(r'\br="(\d+)"', row).group(1)): row for row in re.findall(r"<row\b.*?</row>", xml, re.S)}


def appended_rows(archive, sheet, first, last):
    values = cells(archive, sheet)
    root = ET.fromstring(archive.read(sheet))
    rows = root.findall("s:sheetData/s:row", ns)
    output = []
    for row in rows:
        index = int(row.get("r"))
        if not first <= index <= last:
            continue
        for cell in row:
            ref = cell.get("r")
            col = re.match("[A-Z]+", ref).group()
            value, formula = values[ref]
            assert formula is None, f"Unexpected formula in {ref}"
            cell.clear()
            cell.set("r", ref)
            # Reuse the original workbook's styles. No styles.xml rewrite.
            style = "5" if sheet.endswith("sheet2.xml") or col in ("C", "D", "H", "I", "J", "K", "L", "O", "P", "Q", "R", "S", "V", "W") else ("4" if col == "B" else "3")
            cell.set("s", style)
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                cell.set("t", "n")
                ET.SubElement(cell, f"{{{NS}}}v").text = str(value)
            elif value is not None:
                cell.set("t", "inlineStr")
                text = ET.SubElement(ET.SubElement(cell, f"{{{NS}}}is"), f"{{{NS}}}t")
                text.text = str(value)
        # Only new rows: fit wrapped text in the existing narrow columns.
        widths = {"C": 10, "D": 16, "H": 60, "I": 24, "J": 24, "K": 24, "L": 24, "O": 60, "P": 14, "Q": 14, "R": 14, "S": 14, "V": 14, "W": 14}
        if sheet.endswith("sheet1.xml"):
            lines = 1
            for col, width in widths.items():
                text = str(values.get(f"{col}{index}", ("", None))[0] or "")
                units = sum(2 if ord(c) > 255 else 1 for c in text)
                lines = max(lines, (units + width - 3) // (width - 2))
            row.set("ht", str(lines * 16 + 6))
            row.set("customHeight", "1")
        else:
            row.set("ht", "45")
            row.set("customHeight", "1")
        output.append(ET.tostring(row, encoding="unicode").replace(f' xmlns="{NS}"', ""))
    assert len(output) == last - first + 1
    return "".join(output)


s1, s2 = "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"
with zipfile.ZipFile(baseline) as original, zipfile.ZipFile(authored) as generated:
    original_xml = {s: original.read(s).decode() for s in (s1, s2)}
    assert set(raw_rows(original_xml[s1])) == set(range(1, 108)), "Not the 106-question baseline"
    replacements = {}
    for sheet, first, last, dimension in ((s1, 108, 162, "A1:X162"), (s2, 24, 28, "A1:B28")):
        xml = original_xml[sheet]
        xml = xml.replace("</sheetData>", appended_rows(generated, sheet, first, last) + "</sheetData>")
        xml = re.sub(r'<dimension ref="[^"]+"\s*/>', f'<dimension ref="{dimension}"/>', xml, count=1)
        if sheet == s2:
            xml, count = re.subn(r'<c\b[^>]*\br="B23"[^>]*>.*?</c>', '<c r="B23" t="inlineStr"><is><t>161 題</t></is></c>', xml, count=1, flags=re.S)
            assert count == 1
        replacements[sheet] = xml.encode()
    # Do not overwrite the repository workbook until the temporary ZIP passes checks.
    staged = authored.parent / "preserved.xlsx"
    with zipfile.ZipFile(staged, "w", zipfile.ZIP_DEFLATED) as final:
        for entry in original.infolist():
            final.writestr(entry, replacements.get(entry.filename, original.read(entry.filename)))

with zipfile.ZipFile(baseline) as before, zipfile.ZipFile(staged) as after:
    old = cells(before, s1)
    new = cells(after, s1)
    for row in range(1, 108):
        for col in [chr(65 + i) for i in range(24)]:
            assert old.get(f"{col}{row}") == new.get(f"{col}{row}"), f"Modified original cell {col}{row}"
    old_raw, new_raw = raw_rows(before.read(s1).decode()), raw_rows(after.read(s1).decode())
    assert all(old_raw[i] == new_raw[i] for i in range(1, 108)), "Original row XML changed"
    old_notes, new_notes = cells(before, s2), cells(after, s2)
    assert all(value == new_notes.get(ref) for ref, value in old_notes.items() if ref != "B23")
    assert new_notes["B23"] == ("161 題", None)
    unchanged_parts = [name for name in before.namelist() if name not in (s1, s2)]
    assert before.namelist() == after.namelist()
    assert all(before.read(name) == after.read(name) for name in unchanged_parts)
    expected = json.loads(expected_path.read_text())
    assert len(expected) == 55
    ids = [new[f"B{row}"][0] for row in range(2, 163)]
    assert len(ids) == len(set(ids)) == 161
    counts, positions = collections.Counter(), collections.Counter()
    root = destination.parent.parent
    html_content = {}
    for q in expected:
        slug = q["slug"]
        if slug not in html_content:
            html = (root / "public/materials" / f"{slug}-v1/index.html").read_text()
            c, _ = json.JSONDecoder().raw_decode(html[html.rindex("\nmount(") + 7:])
            assert c["title"] == re.search(r"<title>(.*?)</title>", html).group(1)
            html_content[slug] = {item["id"]: item for item in c["foundation"] + c["cases"]}
    for row, q in enumerate(expected, 108):
        value = lambda col: new.get(f"{col}{row}", (None, None))[0]
        source = html_content[q["slug"]][q["id"]]
        assert value("A") is None
        assert value("B") == source["id"] == q["id"]
        assert value("C") == value("D") == value("V") == q["title"]
        assert value("E") == q["sequence"] and value("F") == "TRUE" and value("G") == "單選"
        assert value("H") == source["stem"]
        options = [value(col) for col in "IJKL"]
        assert sorted(options) == sorted(source["options"])
        assert options != source["options"], "New options were not shuffled"
        answer_index = "ABCD".index(value("M"))
        assert options[answer_index] == source["options"][source["answer"]]
        assert value("N") == answer_index + 1
        assert all(value(col) for col in "OPQRS")
        assert all(value(col) is None for col in "TUX")
        assert value("W") == q["url"]
        counts[q["title"]] += 1
        positions[value("M")] += 1
    assert set(counts.values()) == {11}
    report = {
        "date": "2026-10-02", "baselineSha256": hashlib.sha256(baseline.read_bytes()).hexdigest(),
        "finalSha256": hashlib.sha256(staged.read_bytes()).hexdigest(),
        "originalQuestions": 106, "originalCellsCompared": 2544, "originalCellsChanged": 0,
        "originalRowsRawXmlUnchanged": 107, "unchangedZipParts": unchanged_parts,
        "notesExistingCellsChanged": ["B23"], "notesAppendedRange": "A24:B28",
        "addedRange": "題庫!A108:X162", "addedQuestions": 55, "totalQuestions": 161,
        "duplicateIds": 0, "htmlStemOptionAnswerMatches": 55, "newOptionOrderChanged": 55,
        "correctPositionCounts": dict(positions), "materialCounts": dict(counts),
        "comparison": "HTML option multisets and correct option text match exactly; shuffled Excel positions map to code and Zuvio number.",
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
destination.write_bytes(staged.read_bytes())
print(json.dumps(report, ensure_ascii=False))
