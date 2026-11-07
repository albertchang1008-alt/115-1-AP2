// 樣張用示範題目：取自教師 W8課前1 Zuvio 匯入檔（不含學生資料），只在示範模式使用。
import type { ZPoolEntry } from './zuvio';
export const SAMPLE_POOL: ZPoolEntry[] = [
 {
  "unitId": "airway",
  "unitTitle": "呼吸道與肺的構造",
  "group": "呼吸",
  "version": "sample-airway-v1",
  "question": {
   "id": "W8-01",
   "text": "搭飛機下降時耳朵悶脹，吞口水後改善，是哪個構造平衡了中耳壓力？",
   "options": [
    {
     "id": "a",
     "text": "氣管"
    },
    {
     "id": "b",
     "text": "會厭"
    },
    {
     "id": "c",
     "text": "耳咽管"
    },
    {
     "id": "d",
     "text": "鼻腔"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "gas",
  "unitTitle": "氣體交換與運輸",
  "group": "呼吸",
  "version": "sample-gas-v1",
  "question": {
   "id": "W8-02",
   "text": "呼吸膜不包括？",
   "options": [
    {
     "id": "a",
     "text": "第二型肺泡細胞"
    },
    {
     "id": "b",
     "text": "第一型肺泡細胞"
    },
    {
     "id": "c",
     "text": "微血管內皮細胞"
    },
    {
     "id": "d",
     "text": "基底膜"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "ventilation",
  "unitTitle": "肺通氣與肺容積",
  "group": "呼吸",
  "version": "sample-ventilation-v1",
  "question": {
   "id": "W8-03",
   "text": "肺順應性的意義？",
   "options": [
    {
     "id": "a",
     "text": "每分鐘換氣量"
    },
    {
     "id": "b",
     "text": "最大吸氣後能呼出的量"
    },
    {
     "id": "c",
     "text": "肺間壓改變時肺容積改變的多寡（ΔV/ΔP）"
    },
    {
     "id": "d",
     "text": "肺泡表面張力"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "ventilation",
  "unitTitle": "肺通氣與肺容積",
  "group": "呼吸",
  "version": "sample-ventilation-v1",
  "question": {
   "id": "W8-04",
   "text": "功能肺餘量（FRC）＝？",
   "options": [
    {
     "id": "a",
     "text": "ERV＋RV"
    },
    {
     "id": "b",
     "text": "TV＋IRV"
    },
    {
     "id": "c",
     "text": "IRV＋ERV"
    },
    {
     "id": "d",
     "text": "TV＋RV"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "gas",
  "unitTitle": "氣體交換與運輸",
  "group": "呼吸",
  "version": "sample-gas-v1",
  "question": {
   "id": "W8-05",
   "text": "肺泡 PO₂ 約 100、入肺血約 40 mmHg，O₂ 如何移動？",
   "options": [
    {
     "id": "a",
     "text": "由血液進入肺泡"
    },
    {
     "id": "b",
     "text": "不移動"
    },
    {
     "id": "c",
     "text": "由肺泡擴散進入血液"
    },
    {
     "id": "d",
     "text": "以主動運輸進入血液"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "gas",
  "unitTitle": "氣體交換與運輸",
  "group": "呼吸",
  "version": "sample-gas-v1",
  "question": {
   "id": "W8-06",
   "text": "血基質中與氧結合的鐵？",
   "options": [
    {
     "id": "a",
     "text": "二價鐵（Fe²⁺）"
    },
    {
     "id": "b",
     "text": "三價鐵（Fe³⁺）"
    },
    {
     "id": "c",
     "text": "鈣離子"
    },
    {
     "id": "d",
     "text": "鎂離子"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "resp-control",
  "unitTitle": "呼吸調節",
  "group": "呼吸",
  "version": "sample-resp-control-v1",
  "question": {
   "id": "W8-07",
   "text": "直接刺激中樞化學受器的是？",
   "options": [
    {
     "id": "a",
     "text": "血液中的 O₂"
    },
    {
     "id": "b",
     "text": "血液中的 Na⁺"
    },
    {
     "id": "c",
     "text": "腦脊髓液中的 H⁺"
    },
    {
     "id": "d",
     "text": "腦脊髓液中的葡萄糖"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "acidbase",
  "unitTitle": "酸鹼平衡",
  "group": "體液與酸鹼",
  "version": "sample-acidbase-v1",
  "question": {
   "id": "W8-08",
   "text": "依 pH＝6.1＋log（HCO₃⁻/H₂CO₃），HCO₃⁻ 不變而 H₂CO₃ 增加，pH？",
   "options": [
    {
     "id": "a",
     "text": "下降"
    },
    {
     "id": "b",
     "text": "上升"
    },
    {
     "id": "c",
     "text": "不變"
    },
    {
     "id": "d",
     "text": "固定為 6.1"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "resp-control",
  "unitTitle": "呼吸調節",
  "group": "呼吸",
  "version": "sample-resp-control-v1",
  "question": {
   "id": "W8-09",
   "text": "閉氣一段時間後會自動開始吸氣，這是因為下列何者直接刺激延腦化學接受器所致？",
   "options": [
    {
     "id": "a",
     "text": "動脈血氧分壓（PaO2）太低"
    },
    {
     "id": "b",
     "text": "血中二氧化碳濃度太高"
    },
    {
     "id": "c",
     "text": "血中的酸性代謝物增加"
    },
    {
     "id": "d",
     "text": "腦脊髓液中的氫離子增多"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "ventilation",
  "unitTitle": "肺通氣與肺容積",
  "group": "呼吸",
  "version": "sample-ventilation-v1",
  "question": {
   "id": "W8-10",
   "text": "肺部的那一種細胞，主要負責分泌表面張力劑（surfactant），可以降低肺泡內的表面張力，避免肺泡塌陷？",
   "options": [
    {
     "id": "a",
     "text": "微血管內皮細胞（endothelial cell）"
    },
    {
     "id": "b",
     "text": "第一型肺泡細胞（type I alveolar cell）"
    },
    {
     "id": "c",
     "text": "第二型肺泡細胞（type II alveolar cell）"
    },
    {
     "id": "d",
     "text": "肺泡內巨噬細胞（alveolar macrophage）"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "airway",
  "unitTitle": "呼吸道與肺的構造",
  "group": "呼吸",
  "version": "sample-airway-v1",
  "question": {
   "id": "W8-11",
   "text": "下列何者不通過肺門？",
   "options": [
    {
     "id": "a",
     "text": "胸管"
    },
    {
     "id": "b",
     "text": "肺動脈"
    },
    {
     "id": "c",
     "text": "肺靜脈"
    },
    {
     "id": "d",
     "text": "主支氣管"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "airway",
  "unitTitle": "呼吸道與肺的構造",
  "group": "呼吸",
  "version": "sample-airway-v1",
  "question": {
   "id": "W8-12",
   "text": "下列支氣管樹的分支，何者具有氣體交換功能?",
   "options": [
    {
     "id": "a",
     "text": "葉支氣管"
    },
    {
     "id": "b",
     "text": "節支氣管"
    },
    {
     "id": "c",
     "text": "終末細支氣管"
    },
    {
     "id": "d",
     "text": "呼吸性細支氣管"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "ventilation",
  "unitTitle": "肺通氣與肺容積",
  "group": "呼吸",
  "version": "sample-ventilation-v1",
  "question": {
   "id": "W8-13",
   "text": "有關肺活量（vital capacity）的敘述，下列何者錯誤？",
   "options": [
    {
     "id": "a",
     "text": "可由肺量計（spirometer）測得"
    },
    {
     "id": "b",
     "text": "為盡力吸氣後所能呼出的最大氣量"
    },
    {
     "id": "c",
     "text": "一般而言男性比同年齡和同體型的女性大"
    },
    {
     "id": "d",
     "text": "為吸氣儲備容積（IRV）和呼氣儲備容積（ERV）的總和"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "ventilation",
  "unitTitle": "肺通氣與肺容積",
  "group": "呼吸",
  "version": "sample-ventilation-v1",
  "question": {
   "id": "W8-14",
   "text": "阻塞性肺病(例如氣喘或支氣管炎)其第一秒用力呼氣容積（FEV 1）/ 用力肺活量（FVC）最可能為下列哪個數值？",
   "options": [
    {
     "id": "a",
     "text": "1"
    },
    {
     "id": "b",
     "text": "0.9"
    },
    {
     "id": "c",
     "text": "0.85"
    },
    {
     "id": "d",
     "text": "0.75"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "gas",
  "unitTitle": "氣體交換與運輸",
  "group": "呼吸",
  "version": "sample-gas-v1",
  "question": {
   "id": "W8-15",
   "text": "有關二氧化碳(CO 2)在血液中運送的敘述，下列何者正確？",
   "options": [
    {
     "id": "a",
     "text": "二氧化碳的溶解度比氧氣小，血液中大約有 7 ％ 二氧化碳溶解於血漿中"
    },
    {
     "id": "b",
     "text": "血液中大約有 23％ 二氧化碳分子以不可逆的方式與血紅素蛋白的胺基結合形成碳醯胺基血紅素"
    },
    {
     "id": "c",
     "text": "紅血球中的氫離子(H +)與血漿中的氯離子(Cl-)進行交換的過程稱作氯轉移(chloride shift)，此過程用來恢復紅血球細胞膜兩側的電荷平衡"
    },
    {
     "id": "d",
     "text": "約有 70 ％ 從組織進入血液的二氧化碳經過碳酸酐酶(carbonic anhydrase)催化會轉換成碳酸氫根(HCO 3-)與氫離子(H +)，此反應主要在紅血球中進行"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "kidney-structure",
  "unitTitle": "腎臟與尿路構造",
  "group": "泌尿",
  "version": "sample-kidney-structure-v1",
  "question": {
   "id": "W8-16",
   "text": "兩個腎錐體之間有一塊組織，和外層皮質連在一起，它叫什麼？",
   "options": [
    {
     "id": "a",
     "text": "腎乳頭"
    },
    {
     "id": "b",
     "text": "腎盂"
    },
    {
     "id": "c",
     "text": "腎柱"
    },
    {
     "id": "d",
     "text": "腎被膜"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "gfr",
  "unitTitle": "腎絲球過濾與清除率",
  "group": "泌尿",
  "version": "sample-gfr-v1",
  "question": {
   "id": "W8-17",
   "text": "過濾分率（FF）是在問送到腎臟的血漿有多少比例被濾出去，應怎麼算？",
   "options": [
    {
     "id": "a",
     "text": "每分鐘濾出的量（GFR）除以腎血流量（RBF）"
    },
    {
     "id": "b",
     "text": "每分鐘濾出的量（GFR）除以腎血漿流量（RPF）"
    },
    {
     "id": "c",
     "text": "腎血流量（RBF）除以每分鐘濾出的量（GFR）"
    },
    {
     "id": "d",
     "text": "腎血漿流量（RPF）除以每分鐘濾出的量（GFR）"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "gfr",
  "unitTitle": "腎絲球過濾與清除率",
  "group": "泌尿",
  "version": "sample-gfr-v1",
  "question": {
   "id": "W8-18",
   "text": "清除率的算式是「尿中物質有多濃 × 每分鐘尿量 ÷ 血漿中有多濃」（C＝U×V／P），算出的數字在說什麼？",
   "options": [
    {
     "id": "a",
     "text": "每分鐘相當清掉多少毫升血漿裡的那種物質"
    },
    {
     "id": "b",
     "text": "每分鐘從血漿移到尿裡多少毫克的那種物質"
    },
    {
     "id": "c",
     "text": "每毫升尿裡裝了多少毫克的那種物質"
    },
    {
     "id": "d",
     "text": "一天從膀胱排掉多少毫升的尿"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "tubule",
  "unitTitle": "腎小管與調節",
  "group": "泌尿",
  "version": "sample-tubule-v1",
  "question": {
   "id": "W8-19",
   "text": "腎小管回收葡萄糖也有速度上限，「葡萄糖最大轉運量」指的是什麼？",
   "options": [
    {
     "id": "a",
     "text": "尿裡葡萄糖有多濃的固定數字"
    },
    {
     "id": "b",
     "text": "腎臟每分鐘血流量的上限"
    },
    {
     "id": "c",
     "text": "膀胱一天能存多少尿的上限"
    },
    {
     "id": "d",
     "text": "每分鐘能搬運多少葡萄糖的上限"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "tubule",
  "unitTitle": "腎小管與調節",
  "group": "泌尿",
  "version": "sample-tubule-v1",
  "question": {
   "id": "W8-20",
   "text": "亨利氏環的上升枝把氯化鈉（NaCl，一種鹽）收回血液時，水能一起穿過它的管壁嗎？",
   "options": [
    {
     "id": "a",
     "text": "水和鹽一起通過，比例相同"
    },
    {
     "id": "b",
     "text": "水能通過，鹽不能回收"
    },
    {
     "id": "c",
     "text": "水不能穿過管壁"
    },
    {
     "id": "d",
     "text": "水能不能通過，要看膀胱壓力"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "kidney-structure",
  "unitTitle": "腎臟與尿路構造",
  "group": "泌尿",
  "version": "sample-kidney-structure-v1",
  "question": {
   "id": "W8-21",
   "text": "輸尿管從腎盂通到膀胱，沿路有三個較窄的地方，中間那個在哪裡？",
   "options": [
    {
     "id": "a",
     "text": "腎門和腎筋膜交界"
    },
    {
     "id": "b",
     "text": "與髂外動脈及靜脈交叉的地方"
    },
    {
     "id": "c",
     "text": "尿道通到體外的開口"
    },
    {
     "id": "d",
     "text": "膀胱出口的尿道內口"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "fluid",
  "unitTitle": "體液與電解質",
  "group": "體液與酸鹼",
  "version": "sample-fluid-v1",
  "question": {
   "id": "W8-22",
   "text": "知道一個人的體重，並採用「全身水約占體重60%」的例子，想分出細胞內外各有多少水，第一步要算什麼？",
   "options": [
    {
     "id": "a",
     "text": "把整個體重當成細胞裡的水"
    },
    {
     "id": "b",
     "text": "把血漿比例當成全身水比例"
    },
    {
     "id": "c",
     "text": "先用體重算出全身共有多少水"
    },
    {
     "id": "d",
     "text": "直接把體重當成血漿的量"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "fluid",
  "unitTitle": "體液與電解質",
  "group": "體液與酸鹼",
  "version": "sample-fluid-v1",
  "question": {
   "id": "W8-23",
   "text": "想知道鈉在體液裡有多濃，要一起看哪兩個量？",
   "options": [
    {
     "id": "a",
     "text": "剛才喝水的動作和次數"
    },
    {
     "id": "b",
     "text": "鈉的量和水的量"
    },
    {
     "id": "c",
     "text": "鈉的總量，不看水有多少"
    },
    {
     "id": "d",
     "text": "鈉的總量和鉀的總量"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "fluid",
  "unitTitle": "體液與電解質",
  "group": "體液與酸鹼",
  "version": "sample-fluid-v1",
  "question": {
   "id": "W8-24",
   "text": "副甲狀腺素（PTH，一種調整鈣磷的激素）在腎臟作用時，會把鈣和磷往哪裡送？",
   "options": [
    {
     "id": "a",
     "text": "把更多鈣收回血液，把更多磷排進尿"
    },
    {
     "id": "b",
     "text": "把更多鈣和磷都收回血液"
    },
    {
     "id": "c",
     "text": "把更多鈣和磷都排進尿"
    },
    {
     "id": "d",
     "text": "把更多鈣排進尿，把更多磷收回血液"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "acidbase",
  "unitTitle": "酸鹼平衡",
  "group": "體液與酸鹼",
  "version": "sample-acidbase-v1",
  "question": {
   "id": "W8-25",
   "text": "酸不酸的數字叫pH，數字越小越酸。其他條件先不變，呼吸加快、呼出更多二氧化碳（CO₂）時，血液的pH會往哪個方向變？",
   "options": [
    {
     "id": "a",
     "text": "pH變小，血液更酸"
    },
    {
     "id": "b",
     "text": "pH不改變"
    },
    {
     "id": "c",
     "text": "pH變大，但血液的酸增加"
    },
    {
     "id": "d",
     "text": "pH變大，血液比較不酸"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "gfr",
  "unitTitle": "腎絲球過濾與清除率",
  "group": "泌尿",
  "version": "sample-gfr-v1",
  "question": {
   "id": "W8-26",
   "text": "下列何者會導致腎絲球過濾率（glomerular filtration rate）下降？",
   "options": [
    {
     "id": "a",
     "text": "入球小動脈（afferent arteriole）擴張"
    },
    {
     "id": "b",
     "text": "出球小動脈（efferent arteriole）收縮"
    },
    {
     "id": "c",
     "text": "血中白蛋白（albumin）濃度增加"
    },
    {
     "id": "d",
     "text": "超過濾膜（ultrafiltration membrane）通透性增加"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "tubule",
  "unitTitle": "腎小管與調節",
  "group": "泌尿",
  "version": "sample-tubule-v1",
  "question": {
   "id": "W8-27",
   "text": "有關腎素－血管張力素系統（renin-angiotensin system）之敘述，下列何者正確？",
   "options": [
    {
     "id": "a",
     "text": "腎素可作用於血管平滑肌細胞，使血壓升高"
    },
    {
     "id": "b",
     "text": "血管張力素原（angiotensinogen）分泌自肝臟"
    },
    {
     "id": "c",
     "text": "失血可造成醛固酮（aldosterone）分泌減少"
    },
    {
     "id": "d",
     "text": "缺水可造成血管張力素II（angiotensin II）生成減少"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "tubule",
  "unitTitle": "腎小管與調節",
  "group": "泌尿",
  "version": "sample-tubule-v1",
  "question": {
   "id": "W8-28",
   "text": "下列何者是維持亨利氏環下行支水分再吸收的因素?",
   "options": [
    {
     "id": "a",
     "text": "氫離子"
    },
    {
     "id": "b",
     "text": "氯離子"
    },
    {
     "id": "c",
     "text": "尿素"
    },
    {
     "id": "d",
     "text": "鉀離子"
    }
   ],
   "answer": "c"
  }
 },
 {
  "unitId": "kidney-structure",
  "unitTitle": "腎臟與尿路構造",
  "group": "泌尿",
  "version": "sample-kidney-structure-v1",
  "question": {
   "id": "W8-29",
   "text": "下列何者是由入球小動脈（afferent arteriole）的管壁平滑肌細胞特化形成，能分泌腎活素（renin）調節血壓？",
   "options": [
    {
     "id": "a",
     "text": "緻密斑細胞（macula densa cells）"
    },
    {
     "id": "b",
     "text": "近腎絲球細胞（juxtaglomerular cells）"
    },
    {
     "id": "c",
     "text": "腎小球系膜細胞（mesangial cells）"
    },
    {
     "id": "d",
     "text": "足細胞（podocytes）"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "acidbase",
  "unitTitle": "酸鹼平衡",
  "group": "體液與酸鹼",
  "version": "sample-acidbase-v1",
  "question": {
   "id": "W8-30",
   "text": "有關體內維持酸鹼平衡的敘述，下列何者錯誤？",
   "options": [
    {
     "id": "a",
     "text": "腎臟近曲小管可藉由次級主動運輸分泌氫離子"
    },
    {
     "id": "b",
     "text": "重碳酸根離子與氫離子結合後分解成二氧化碳和水"
    },
    {
     "id": "c",
     "text": "醛固酮過量分泌會造成腎小管性酸中毒"
    },
    {
     "id": "d",
     "text": "降低血管收縮素Ⅱ分泌會降低氫離子分泌"
    }
   ],
   "answer": "d"
  }
 },
 {
  "unitId": "gfr",
  "unitTitle": "腎絲球過濾與清除率",
  "group": "泌尿",
  "version": "sample-gfr-v1",
  "question": {
   "id": "W8-31",
   "text": "下列何者具有最低的腎臟血漿清除率（renal clearance）？",
   "options": [
    {
     "id": "a",
     "text": "葡萄糖（glucose）"
    },
    {
     "id": "b",
     "text": "尿素（urea）"
    },
    {
     "id": "c",
     "text": "肌酐酸（creatinine）"
    },
    {
     "id": "d",
     "text": "對胺基馬尿酸（para-aminohippuric acid）"
    }
   ],
   "answer": "a"
  }
 },
 {
  "unitId": "gfr",
  "unitTitle": "腎絲球過濾與清除率",
  "group": "泌尿",
  "version": "sample-gfr-v1",
  "question": {
   "id": "W8-32",
   "text": "當某物質在血漿中的濃度為 5 mg/mL，在尿液中的濃度為 80 mg/mL，且此時的排尿量為1mL/min，依據數值計算此物質的血漿清除率（plasma clearance）為何？",
   "options": [
    {
     "id": "a",
     "text": "8mL/min"
    },
    {
     "id": "b",
     "text": "16mL/min"
    },
    {
     "id": "c",
     "text": "125mL/min"
    },
    {
     "id": "d",
     "text": "400mL/min"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "kidney-structure",
  "unitTitle": "腎臟與尿路構造",
  "group": "泌尿",
  "version": "sample-kidney-structure-v1",
  "question": {
   "id": "W8-33",
   "text": "下列何者不是輸尿管（ureter）管腔較為狹窄的位置？",
   "options": [
    {
     "id": "a",
     "text": "腎盂（renal pelvis）與輸尿管交接處"
    },
    {
     "id": "b",
     "text": "腰大肌（psoas major）表面"
    },
    {
     "id": "c",
     "text": "與髂外動脈及靜脈交叉處"
    },
    {
     "id": "d",
     "text": "穿進膀胱（urinary bladder）處"
    }
   ],
   "answer": "b"
  }
 },
 {
  "unitId": "tubule",
  "unitTitle": "腎小管與調節",
  "group": "泌尿",
  "version": "sample-tubule-v1",
  "question": {
   "id": "W8-34",
   "text": "利尿劑主要作用機制為下列何者？",
   "options": [
    {
     "id": "a",
     "text": "滲透性利尿劑主要作用在遠曲小管"
    },
    {
     "id": "b",
     "text": "環利尿劑主要作用在鈉—氫協同運輸"
    },
    {
     "id": "c",
     "text": "醛固酮拮抗劑主要作用在集尿管"
    },
    {
     "id": "d",
     "text": "鈉通道阻斷劑主要作用在近曲小管"
    }
   ],
   "answer": "c"
  }
 }
];
