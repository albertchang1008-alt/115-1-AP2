"""把 Zuvio「下載數據」xlsx 去識別化成測試夾具（原檔不進 repo）。
用法：python3 scripts/make-zuvio-fixture.py <原始xlsx> tests/fixtures/zuvio/W8-results-anon.xlsx tests/fixtures/zuvio/W8-results-expected.json
- 學號依出現順序換成 T001…，姓名換成「學生01」…，作答人名欄清空，作答時間改固定值。
- 只輸出第一張工作表的儲存格值（重新建立活頁簿：不保留其他工作表、註解、docProps 內容）。
- 寫出後掃描整個 ZIP，原檔出現過的學號與姓名 0 命中才保留，否則刪檔並失敗。
- expected.json 只含每題答對人數（由原檔「對O/錯X」欄計算），不含任何個資。
"""
import sys, json, zipfile, re, os
import openpyxl
src, out, exp = sys.argv[1:4]
ws = openpyxl.load_workbook(src, data_only=True).worksheets[0]
rows = [[c for c in r] for r in ws.iter_rows(values_only=True)]
ids, names, idmap, namemap = set(), set(), {}, {}
answered = set()
def new_id(v):
    v = str(v).strip()
    if v not in idmap: idmap[v] = 'T' + str(len(idmap) + 1).zfill(3)
    return idmap[v]
mode = None; block = 0; correct = {}
for r in rows:
    a = str(r[0]).strip() if r and r[0] is not None else ''
    if re.match(r'^第(\d+)題', a): block = int(re.match(r'^第(\d+)題', a).group(1)); mode = 'block'; continue
    if a == '學號' and len(r) > 1 and r[1] == '姓名': mode = 'students' if block else 'summary'; continue
    if a == '選項編號': mode = 'options'; continue
    if mode in ('summary', 'students') and a:
        ids.add(a); names.add(str(r[1]))
        if mode == 'students': answered.add(a)
        if mode == 'students' and len(r) > 2 and str(r[2]).strip().upper() == 'O': correct[block] = correct.get(block, 0) + 1
        r[0] = new_id(a)
        if r[1] is not None:
            nm = str(r[1]); namemap.setdefault(nm, '學生' + str(len(namemap) + 1).zfill(2)); r[1] = namemap[nm]
        if mode == 'summary' and len(r) > 2: r[2] = '2026-01-01 00:00:00'
    if mode == 'options' and a.isdigit() and len(r) > 4:
        for k in range(4, len(r)): r[k] = None
wb = openpyxl.Workbook(); ws2 = wb.active; ws2.title = 'Sheet1'
for r in rows: ws2.append([None if v is None else v for v in r])
wb.properties.creator = ''; wb.properties.lastModifiedBy = ''
wb.save(out)
with zipfile.ZipFile(out) as z:
    blob = b''.join(z.read(n) for n in z.namelist()).decode('utf-8', 'ignore')
leaks = [x for x in ids | names if x and len(x) >= 2 and x in blob]
if leaks:
    os.remove(out); sys.exit(f'去識別化失敗：{len(leaks)} 個原始值仍出現在檔案中')
json.dump({'questions': max(correct) if correct else 0, 'correctByQuestion': [correct.get(i, 0) for i in range(1, (max(correct) if correct else 0) + 1)], 'students': len(answered), 'rosterRows': len(idmap)}, open(exp, 'w'), ensure_ascii=False)
print('ok', len(idmap), 'students')
