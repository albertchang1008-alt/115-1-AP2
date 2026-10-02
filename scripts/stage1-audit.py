"""Independent, read-only specification and immutable workbook audit."""
import io,json,re,subprocess,zipfile,hashlib
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
spec=(ROOT/'docs/STAGE1_SUPPLEMENT_SPEC.md').read_text()
slugs=['cardiac-output','blood-pressure-measurement','capillary-exchange','major-vessels','blood-types','lymphoid-organs']
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
name='html/資訊圖表題庫_上傳用.xlsx'
original=subprocess.check_output(['git','show','f7b97a7:'+name],cwd=ROOT)
current=(ROOT/name).read_bytes()
def cells(z,part):
    result={}
    for c in ET.fromstring(z.read(part)).findall('s:sheetData/s:row/s:c',ns):
        result[c.get('r')]=(''.join(c.find('s:is',ns).itertext()) if c.get('t')=='inlineStr' and c.find('s:is',ns) is not None else c.findtext('s:v',namespaces=ns),c.findtext('s:f',namespaces=ns))
    return result
with zipfile.ZipFile(io.BytesIO(original)) as before,zipfile.ZipFile(io.BytesIO(current)) as after:
    p='xl/worksheets/sheet1.xml';old,new=cells(before,p),cells(after,p)
    for row in range(1,163):
        for col in 'ABCDEFGHIJKLMNOPQRSTUVWX':assert old.get(f'{col}{row}')==new.get(f'{col}{row}'),f'{col}{row}'
    raw=lambda z:re.findall(rb'<row\b.*?</row>',z.read(p),re.S)
    assert raw(before)==raw(after)[:162];assert len(raw(after))==228
    a,b=cells(before,'xl/worksheets/sheet2.xml'),cells(after,'xl/worksheets/sheet2.xml')
    assert all(v==b.get(k) for k,v in a.items() if k!='B23');assert b['B23']==('227 題',None)
    assert len({new[f'B{r}'][0] for r in range(2,229)})==227
    originalIds={old[f'B{r}'][0] for r in range(2,163)}
    matched=0;nodeOriginals=0
    sections=re.split(r'^### \d+\. ',spec,flags=re.M)[1:]
    for i,(slug,section) in enumerate(zip(slugs,sections)):
        c=json.loads((ROOT/f'materials-src/{slug}/content.json').read_text())
        h=(ROOT/f'public/materials/{slug}-v1/index.html').read_text();built,_=json.JSONDecoder().raw_decode(h[h.rindex('\nmount(')+7:]);assert built==c
        originals=re.findall(r'^  \d+\. (.*)$',section.split('- 節點：\n')[1].split('- 先備：')[0],re.M)
        assert [n['concept'] for n in c['nodes']]==originals;nodeOriginals+=6
        for kind,label in [('foundation','先備'),('cases','情境')]:
            line=re.search(rf'^- {label}：(.*)$',section,re.M)[1]
            entries=re.split('[①②③④⑤⑥]',line)[1:];assert len(entries)==len(c[kind])
            for raw,q in zip(entries,c[kind]):
                stem,options=raw.strip().split('？',1);opts=options.split('／')
                assert q['stem']==stem+'？';assert sorted(q['options'])==sorted(opts);assert q['options'][q['answer']]==opts[0]
                assert q['hint'] and q['explain'] and q['nodeId'] in {n['id'] for n in c['nodes']};assert q['id'] not in originalIds
        for j,q in enumerate(c['foundation']+c['cases']):
            row=163+i*11+j;v=lambda col:new.get(f'{col}{row}',(None,None))[0]
            assert v('C')==('心臟II' if i<4 else '血液' if i==4 else '淋巴系統');assert v('D')==c['title'];assert v('E')==str(j+1)
            assert v('B')==q['id'];assert v('H')==q['stem'];assert [v(col) for col in 'IJKL']==q['options'];assert v('M')=='ABCD'[q['answer']];assert v('N')==str(q['answer']+1)
            assert v('O')==q['explain'];assert all(v(col) for col in 'PQRS');matched+=1
report={'baselineCommit':'f7b97a7','originalQuestions':161,'originalCellsCompared':3864,'originalCellsChanged':0,'originalRowXmlUnchanged':162,'newQuestionsMatchSpecAndHtml':matched,'nodeProseVerbatim':nodeOriginals,'totalQuestions':227,'duplicateIds':0,'baselineSha256':hashlib.sha256(original).hexdigest(),'finalSha256':hashlib.sha256(current).hexdigest()}
(ROOT/'docs/STAGE1_SPEC_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
