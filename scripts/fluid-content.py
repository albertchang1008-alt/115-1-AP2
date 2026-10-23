#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Four source-backed fluid materials. Never writes cards, progress or registration."""
from pathlib import Path
import json,yaml,re,shutil,hashlib
R=Path(__file__).resolve().parents[1];MAIN=Path('/Users/HHC/Documents/ChatGPT/課程平台1.0');K=Path('/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge');E=R/'docs/urinary-release/fluid';E.mkdir(exist_ok=True)
SLUGS=['fluid-compartments','water-sodium-regulation','electrolyte-balance','acid-base-homeostasis']
review=json.loads((MAIN/'materials-src/figures/raster/_review.json').read_text())['items'];assets=[]
for slug in SLUGS:
 if not (R/f'docs/urinary-fluid-specs/{slug}.md').exists():shutil.copy2(MAIN/f'docs/urinary-fluid-specs/{slug}.md',R/f'docs/urinary-fluid-specs/{slug}.md')
 for p in sorted((MAIN/f'materials-src/figures/raster/{slug}/incoming').glob('*.png')):
  note=review[p.stem];assert note['verdict']=='pass';dst=R/f'materials-src/figures/raster/{slug}/incoming'/p.name;dst.parent.mkdir(parents=True,exist_ok=True)
  if dst.exists():assert dst.read_bytes()==p.read_bytes()
  else:shutil.copy2(p,dst)
  assets.append(dict(source=str(p),copy=str(dst.relative_to(R)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),review=note))
assert len(assets)==14;(E/'asset-review.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
# title, summary, concept, points, application, reviewed card UIDs.
N={
'fluid-compartments':[
['總水量與比例分母','總水量約佔體重60%是標準示例','體液分布的百分比必須先辨認分母；標準示例以體重的60%表示總水量。',['體重與總水量是不同分母。','個別含水比例會隨年齡與性別而異。'],'看到百分比先補上「佔誰的比例」，再進行分配。',['body-fluid-compartments']],
['細胞內液與細胞外液','總水量分為內液2/3與外液1/3','以總水量為分母，細胞內液佔2/3，細胞外液佔1/3。',['細胞膜界定細胞內外。','血漿屬於細胞外液。'],'用同一總水量作基準比較兩份水量，勿把血管內誤稱細胞內。',['body-fluid-compartments']],
['血漿與組織間液','細胞外液再分血漿20%與組織間液80%','血漿與組織間液都是細胞外液；此處20%與80%的分母是細胞外液。',['血漿在血管內。','組織間液位於細胞間隙。'],'將血管壁與細胞膜分開看，兩條界線代表不同分類。',['body-fluid-compartments']],
['換算到體重比例','同一60%示例對應內液40%、外液20%','標準示例中，內液佔體重40%、外液佔20%；外液細分為血漿4%與組織間液16%。',['4%與16%是外液20%的細分。','不能把40%、20%、4%、16%全部相加。'],'先畫內外兩層分類，再確認血漿和組織間液已包含於外液。',['body-fluid-compartments']],
['血漿與組織間液的差別','血漿蛋白質量是重要差別','血漿與組織間液同屬外液；微血管壁對蛋白質不通透，使較多蛋白質保留在血漿。',['小離子在兩側都存在。','蛋白質與小離子的分布不能混為一談。'],'比較圖中大分子與小粒子的位置，避免用是否有血球作為兩種液體的主要差別。',['body-fluid-compartments','electrolyte-osmolarity']],
['含水比例的個別差異','含水比例隨性別與年齡改變','男性約65%、女性約55%；課本也列嬰兒約77%、老人約47%，這些比例都以體重為分母。',['脂肪比例影響身體含水比例。','標準60%示例不適用所有個別條件。'],'比較同一尺度的比例條，先讀人物條件，再讀含水比例。',['body-fluid-compartments']]],
'water-sodium-regulation':[
['水攝取三來源','液體、食物與代謝水共同構成攝取','每日攝取示例為液體1500 mL、食物800 mL、代謝水200 mL，合計2500 mL。',['三項都使用每日分母。','代謝水是體內代謝產生的水。'],'整理一天水分來源時，飲水量不等於全部水攝取量。',['water-intake-output']],
['排出途徑與無知覺蒸散','尿、肺、皮膚與糞便皆可排水','水分經尿液、呼氣、皮膚蒸散、流汗與糞便排出；無明顯流汗仍有皮膚蒸散。',['各途徑的量可有範圍。','不可將各範圍極值強行湊成攝取示例總量。'],'看見沒有流汗的情境，仍須保留呼氣與皮膚蒸散兩條路徑。',['water-intake-output']],
['口渴與ADH','增加攝取與增加保水是兩條路徑','口渴促進飲水；抗利尿激素ADH增加集尿管對水的通透性，使水沿滲透梯度回收。',['飲水影響進入身體的水。','ADH影響腎臟最後留回的水。'],'用入口與腎端兩個位置追蹤水分，避免將口渴等同於小管水通道。',['sodium-water-balance','adh-water-reabsorption']],
['RAAS的分工','腎素啟動，血管收縮素II與醛固酮接續作用','近腎絲球細胞釋放腎素，促血管收縮素原形成I；經肺臟轉化酶形成II，再促進醛固酮作用。',['腎素本身不是直接血管收縮者。','血管收縮素II可促血管收縮。','醛固酮促鈉再吸收。'],'按催化、血管作用與腎端鈉回收逐步配對，不把整條鏈壓成腎素直接收縮血管。',['renin-angiotensin-aldosterone','juxtaglomerular-apparatus']],
['醛固酮與ADH比較','保鈉與調水通透性的直接作用不同','醛固酮促遠曲小管及集尿管鈉再吸收並增加鉀分泌；ADH直接增加水通透性。',['鈉回到血液，鉀進入管液。','水可隨鈉回收而移動，但不等同ADH直接調整水通道。'],'把鈉、鉀、水分成三列，再填各自移動方向與調節訊號。',['sodium-water-balance','potassium-secretion','adh-water-reabsorption']],
['排鈉與容積／濃度','鈉總量與鈉濃度是不同的量','心房利鈉尿肽ANP促進排鈉；鈉量與水量共同影響體液容積和濃度。',['濃度要同時考慮溶質量與水量。','鈉總量相同時，水量不同仍可使濃度改變。'],'比較容器時先看水位與粒子總數，再判讀濃度，避免只數鈉粒子。',['sodium-water-balance']]],
'electrolyte-balance':[
['解離與粒子數','相同起始分子數下比較解離後粒子','在完全解離模型中，一個葡萄糖分子維持1粒子，NaCl形成2粒子，MgCl₂形成3粒子。',['MgCl₂形成一個Mg²⁺與兩個Cl⁻。','Mg²⁺的二價不代表MgCl₂只形成兩粒子。'],'先固定起始分子數，再數解離後的全部粒子，不只看離子電荷。',['electrolyte-osmolarity']],
['滲透與水移動','在只通水的膜模型中，水移向粒子較多側','膜可通水而不通溶質時，兩側粒子濃度不同會帶動水朝粒子較多側移動。',['膜的通透條件是判斷前提。','水移動與溶質直接穿膜不同。'],'先查膜允許誰通過，再判斷哪側粒子較多，勿直接把溶質畫成自由穿膜。',['electrolyte-osmolarity']],
['mEq與mOsm的意義','電荷當量與滲透粒子數描述不同概念','mEq/L涉及離子電荷當量與價數；滲透效應則須考慮溶液中粒子數。',['價數與粒子數不可互換。','解離後須計入各種離子。'],'比較NaCl與MgCl₂時，分開寫每種離子的電荷與整份溶質解離後的粒子數。',['electrolyte-osmolarity']],
['鈉與鉀','鈉主要在細胞外，鉀主要在細胞內','Na⁺是主要細胞外陽離子，K⁺主要在細胞內；腎小管後段可調節鉀分泌。',['醛固酮增加鈉回收與鉀分泌。','鉀分泌的方向是血到管液。'],'先用細胞膜定位內外液，再用腎小管壁定位回收與分泌，兩種界線不能混用。',['sodium-water-balance','potassium-secretion','electrolyte-osmolarity']],
['氯與鈣磷','氯是外液陰離子，PTH使腎回鈣排磷','Cl⁻是重要細胞外陰離子，常隨Na⁺移動；副甲狀腺素促腎鈣再吸收並增加磷排泄。',['鈣回收與磷排泄方向不同。','活化維生素D參與腸道鈣吸收。'],'將鈣與磷的腎端方向分別畫出，避免把兩者都寫成保留或排出。',['chloride-balance','calcium-phosphate-balance']],
['鎂的角色','鎂參與酵素與神經肌肉功能','Mg²⁺是重要細胞內電解質，參與多種酵素活性、鈉鉀幫浦與神經肌肉功能。',['鎂也與核糖體功能有關。','不能因為量較少就視為沒有生理作用。'],'從細胞內反應、膜運輸與神經肌肉三個位置整理鎂的功能。',['magnesium-balance']]],
'acid-base-homeostasis':[
['酸鹼平衡三系統','化學緩衝、肺與腎共同維持酸鹼','血液pH約7.35–7.45；化學緩衝減小波動，肺調整CO₂排出，腎臟調整H⁺與HCO₃⁻。',['暫時接住H⁺不等於已排出酸。','肺與腎的調節對象不同。'],'把緩衝與離開身體的路徑分開，才能辨認每個系統負責的步驟。',['acid-base-balance']],
['碳酸氫根與碳酸比','鹼在分子，酸在分母','碳酸系統以HCO₃⁻／H₂CO₃的比值影響pH；pH＝pKa＋log（鹼／酸）。',['課本示例為6.1＋log（26／1.3）≈7.4。','分子與分母不可顛倒。'],'先將鹼與酸放回公式的正確位置，再讀示例，避免只記兩個數字。',['acid-base-balance']],
['多種緩衝系統','碳酸、磷酸鹽、蛋白質與血紅素分處不同區間','碳酸／HCO₃⁻是重要細胞外緩衝；血紅素位於血球內，磷酸鹽可在腎小管承接H⁺。',['蛋白質可解離基團也能緩衝。','血漿、血球與尿液的所在需分開。'],'看到血紅素先找紅血球，再將磷酸鹽接到管液，勿把全部緩衝物放在血漿。',['buffer-systems']],
['呼吸調節CO₂','呼吸增加CO₂排出可使pH上升','呼吸速率增加使CO₂排出增加，碳酸負荷減少，pH朝上升方向改變。',['排出的物質為CO₂。','不能把此途徑當成腎小管排H⁺。'],'沿血液到肺再到體外追蹤CO₂，將呼氣方向與血液pH變化配對。',['acid-base-balance']],
['腎臟分泌H⁺與回收HCO₃⁻','酸進管液，碳酸氫根回到血液','近曲小管以Na⁺－H⁺相對運送分泌H⁺；遠曲小管與集尿管也可分泌H⁺，同時HCO₃⁻回到血液。',['分泌方向須由血側朝管液側理解。','尿液變酸與血液變酸不能畫成同向。'],'在圖上先標血側與管液側，再填入氫與碳酸氫根的箭頭。',['renal-acid-base-compensation']],
['銨與磷酸鹽帶走酸','NH₃承接H⁺成NH₄⁺並隨尿排出','NH₃與H⁺結合形成NH₄⁺；磷酸鹽也能承接H⁺，協助尿液排酸。',['回收HCO₃⁻與排酸配合。','尿腔反應與鹼回血分屬不同方向。'],'把酸接到尿中攜帶物，再追蹤尿液出口，不要因尿酸化就推定血也更酸。',['renal-acid-base-compensation','buffer-systems']]]}
# Questions are loaded from a separate authored blueprint, correct option first.
Q=json.loads((R/'docs/urinary-release/fluid/question-blueprint.json').read_text())
def source(uid):
 p=K/(uid+'.md');d=yaml.safe_load(p.read_text().split('---',2)[1]);assert d['review_status']=='reviewed',uid
 return uid+'；'+', '.join(s['book']+' p.'+str(s['page'])for s in d['sources'])
def ref(sources):
 books={}
 for s in sources:
  for book,page in re.findall(r'(physiology/CH\d+|anatomy/AB-05_15) p\.(\d+)',s):books.setdefault(book,set()).add(int(page))
 out=[]
 for book,pages in sorted(books.items()):
  title='《解剖學》泌尿系統'if book.startswith('anatomy')else'《生理學》腎臟與體液的恆定'if book.endswith('09')else'《生理學》第5章'
  ranges=[];start=prev=None
  for page in sorted(pages):
   if start is None:start=prev=page
   elif page==prev+1:prev=page
   else:ranges.append(str(start)if start==prev else str(start)+'–'+str(prev));start=prev=page
  if start is not None:ranges.append(str(start)if start==prev else str(start)+'–'+str(prev))
  out.append(title+'，第 '+'、'.join(ranges)+' 頁')
 return '；'.join(out)+'。'
comparisons=[]
for si,slug in enumerate(SLUGS):
 spec=(R/f'docs/urinary-fluid-specs/{slug}.md').read_text();title=spec.splitlines()[0].split(' ',2)[2].split('：')[0];nodes=[]
 for i,(nt,summary,concept,points,application,uids)in enumerate(N[slug],1):
  sources=[source(uid)for uid in uids];nodes.append(dict(id=f'{slug}-node-{i:02d}',tag=f'{i:02d}',title=nt,summary=summary,figure=f'{slug}-node-{i:02d}.svg',concept=concept,points=points,clinical=dict(title='觀察與應用',text=application),sources=sources,reference=ref(sources),caption=summary+'。'))
 states=[]
 for line in spec.splitlines():
  if line.startswith('| state-'):
   cells=[x.strip()for x in line.split('|')[1:-1]];states.append(dict(id=cells[0][:7],label=cells[1],explain=cells[2]+'。'))
 questions=[]
 for i,raw in enumerate(Q[slug]['questions']):
  node,stem,opts,hint,explain=raw;answer=i%4;correct=opts[0];rot=opts[-answer:]+opts[:-answer]if answer else list(opts);assert rot[answer]==correct
  kind='foundation'if i<6 else'case';num=i+1 if i<6 else i-5;q=dict(id=f'{slug}-{kind}-q{num:02d}',stem=stem,options=rot,answer=answer,hint=hint,explain=explain,nodeId=nodes[node-1]['id'],sources=nodes[node-1]['sources']);questions.append(q);comparisons.append(dict(id=q['id'],before=correct,after=rot[answer],answer=answer,unchanged=True))
 node,stem,opts,hint,feedback=Q[slug]['predict'];answer=(si+6)%4;correct=opts[0];rot=opts[-answer:]+opts[:-answer]if answer else list(opts);assert rot[answer]==correct
 predict=dict(question=stem,options=rot,answer=answer,feedback=feedback,sources=nodes[node-1]['sources']);comparisons.append(dict(id=slug+'-predict',before=correct,after=rot[answer],answer=answer,unchanged=True))
 c=dict(slug=slug,version='v1',experience='guided',title=title,subtitle=Q[slug]['subtitle'],label=title+'｜互動資訊圖表',stats=Q[slug]['stats'],lab=dict(title='情境實驗室',intro='切換三個閱讀主題，沿圖中關係觀察；紅色粗體標出這次的重點。',figure=slug+'-overview.svg',states=states,predict=predict),nodes=nodes,foundation=questions[:6],cases=questions[6:],credits=[ref(list(dict.fromkeys(s for n in nodes for s in n['sources']))),'底圖由 ChatGPT 製作；標籤、箭頭與資料層以原生 SVG 呈現。'])
 p=R/f'materials-src/{slug}/content.json';p.parent.mkdir(exist_ok=True);p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
(E/'answer-text-comparison.json').write_text(json.dumps(comparisons,ensure_ascii=False,indent=2)+'\n');print('Created four contents, 24 nodes, 44 questions, 4 predictions; all sources reviewed.')
