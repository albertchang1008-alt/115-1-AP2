#!/usr/bin/env python3
"""Check the delivered TSV independently of the artifact-tool authoring path."""
import argparse,copy,csv,hashlib,itertools,json,re,unicodedata
from pathlib import Path

def norm(s):
 return ''.join(c for c in unicodedata.normalize('NFKC',s.replace('**','')) if c.isalnum())

def common10(a,b):
 a,b=norm(a),norm(b)
 return any(a[i:i+10] in b for i in range(len(a)-9))

def existing_changes(before,projection):
 if len(projection)<len(before):return -1
 return sum(b!=v for old,new in zip(before,projection) for b,v in itertools.zip_longest(old,new,fillvalue=None))

EDITORIAL=re.compile(r'原題|原[①②③④]|原選項|既有說明|依本題所用範圍|課本(?:表列|內文)|國考簡化|依原解析|本題局部調控模型|此模型')
LETTER=re.compile(r'(?<![A-Za-z])[A-H](?![A-Za-z])|[Ａ-Ｈ]|選項\s*[A-Ha-h]|選\s*[A-Ha-h]')

def audit_row(row,source,draft):
 errors=[]
 def ck(ok,label):
  if not ok:errors.append(label)
 if len(row)!=32:return ['32欄']
 ck(row[2]==source['id'],'ID');ck(row[14:18]==source['options'],'選項');ck(row[12]=='ABCD'[source['answer']],'答案');ck(row[13]==str(source['answer']+1),'Zuvio')
 ck(row[31]=='TRUE','啟用');ck(row[4:6]==['心臟II','血流路徑動畫'],'分類')
 ck(not re.search(r'圖中|圖上|腦底圖|模型觀察|如圖',row[11]),'獨立題幹')
 fields=row[18:23];ex,kw,ch,de,me=fields
 ck(all(fields),'五欄完整')
 ck(len(ex.replace('**',''))<=150 and 2<=len([s for s in re.split('[。！？]',ex) if s.strip()])<=4,'解析長度句數')
 ck(len(kw.replace('**',''))<=40 and '還是' not in kw,'①字數或二選一')
 ck(source['options'][source['answer']] not in kw,'①洩答')
 quotes=re.findall('「([^」]+)」',kw)
 ck(bool(quotes) and '：' in kw,'①格式')
 ck(all(norm(x) in norm(row[11]) for q in quotes for x in re.split('[、，]',q)),'①題幹線索')
 ck(len(ch.replace('**',''))<=90 and 1<=ch.count('→')<=2,'②字數步數')
 answer=source['options'][source['answer']]
 match=re.fullmatch(r'因為(.+)，所以答案是「'+re.escape(answer)+r'」。',de)
 ck(bool(match),'③句型及答案');ck(bool(match) and len(match[1].replace('**',''))<=60,'③理由字數')
 ck(len(me.replace('**',''))<=25 and not me.endswith('。') and norm(me)!=norm(ex),'④字數格式')
 ck(draft['memoryKeyword'] in me,'④關鍵詞')
 for f in fields:
  ck(not EDITORIAL.search(f),'編輯用語');ck(not LETTER.search(f),'選項字母');ck(not re.search('<br\\b',f,re.I),'br')
  ck(f.count('**')<=4 and f.count('**')==2*len(re.findall(r'\*\*[^*]+\*\*',f)),'粗體')
  ck(not re.search('[\U0001F300-\U0001FAFF]',f),'emoji未使用')
 for a,b in itertools.combinations([ch,de,me],2):ck(not common10(a,b),'②③④連續十字重複')
 return sorted(set(errors))

def main():
 p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('baseline',type=Path);p.add_argument('evidence',type=Path);a=p.parse_args()
 base=list(csv.reader(a.baseline.open(encoding='utf-8-sig')))
 rows=list(csv.reader((a.root/'docs/bank-fixes/BLOOD_FLOW_11_PASTE.tsv').open(encoding='utf-8'),delimiter='\t'))
 content=json.loads((a.root/'materials-src/blood-flow-routes/content.json').read_text());source=content['foundation']+content['cases']
 draft=json.loads((a.root/'docs/bank-fixes/BLOOD_FLOW_11_DRAFT.json').read_text())
 projected=json.loads((a.evidence/'projection.json').read_text())
 assert len(base)==747 and len(rows)==11 and all(len(r)==32 for r in base+rows)
 assert projected==base+rows
 changes=existing_changes(base,projected)
 assert changes==0
 assert [int(r[1]) for r in rows]==list(range(int(base[-1][1])+1,int(base[-1][1])+12))
 assert not set(r[2] for r in rows)&set(r[2] for r in base[1:])
 findings=[{'id':r[2],'errors':audit_row(r,s,d)} for r,s,d in zip(rows,source,draft)]
 probes={}
 for name,index,value in [('編輯用語',18,'原題的答案正確。另一項不對。'),('選項字母',18,'選A才對。其餘不對。'),('br',20,'甲<br>→乙'),('④關鍵詞',22,'方向記清楚'),('答案',12,'D'),('32欄',None,None)]:
  r=copy.deepcopy(rows[0])
  if index is None:r.pop()
  else:r[index]=value
  probes[name]=name in audit_row(r,source[0],draft[0])
 r=copy.deepcopy(rows[0]);r[20]=r[22]+'→再回想';probes['重複']=bool('②③④連續十字重複' in audit_row(r,source[0],draft[0]))
 bad=copy.deepcopy(projected);bad[1][0]+='BAD';probes['範圍外']=existing_changes(base,bad)==1
 result={'pass':all(not r['errors'] for r in findings) and all(probes.values()),'baselineRows':len(base),'newRows':len(rows),'columns':32,'pasteRange':'A748:AF758','sequence':[86,96],'existingCellsCompared':len(base)*32,'existingCellChanges':0,'outsideScopeChanges':0,'sourceSHA256':hashlib.sha256(a.baseline.read_bytes()).hexdigest(),'templateSHA256':hashlib.sha256((a.root/'docs/bank-fixes/BLOOD_FLOW_11_PASTE.tsv').read_bytes()).hexdigest(),'editorialTerms':sum(bool(EDITORIAL.search(v)) for r in rows for v in r[18:23]),'optionLetters':sum(bool(LETTER.search(v)) for r in rows for v in r[18:23]),'br':sum(bool(re.search('<br\\b',v,re.I)) for r in rows for v in r[18:23]),'findings':findings,'negativeProbes':probes}
 for key,filename in [('parseBankSheet','parseBankSheet.json'),('memoryReview','memory-check.json'),('authoring','authoring-check.json')]:
  path=a.evidence/filename
  if path.exists():
   result[key]=json.loads(path.read_text())
   if 'pass' in result[key]:result['pass']=result['pass'] and result[key]['pass']
 log=a.evidence/'npm-check.txt'
 if log.exists():
  text=log.read_text();counts={k:[int(x) for x in re.findall(r'^# '+k+r' (\d+)$',text,re.M)] for k in ['tests','pass','fail','skipped']}
  ok=counts['tests']==counts['pass']==[234,77] and counts['fail']==counts['skipped']==[0,0] and '版本一致：1.10.3' in text
  result['npmCheck']={'pass':ok,'version':'1.10.3','counts':counts};result['pass']=result['pass'] and ok
 (a.root/'docs/bank-fixes/BLOOD_FLOW_11_CHECK.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k not in ['memoryReview','parseBankSheet']},ensure_ascii=False,indent=2))
 assert result['pass']

if __name__=='__main__':main()
