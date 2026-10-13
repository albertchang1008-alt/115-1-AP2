import { Interaction, InteractionField } from '../shared/classroom';
const choice = (id: string, label: string, options: string[]): InteractionField => ({
  id,
  label,
  kind: 'choice',
  options,
});
const ig = ['IgG', 'IgA', 'IgM', 'IgD', 'IgE'];
export const interactions: Interaction[] = [
  {
    slideId: 'c1-predict',
    title: '革蘭氏染色：先猜再看',
    fields: [
      choice('pick', '傷口檢體做革蘭氏染色，細菌被番紅染成紅色。這隻菌「最不可能」有哪個特徵？', [
        '細胞壁外有一層外膜',
        '含有脂多糖（內毒素）',
        '能形成內孢子',
        '肽聚醣層很薄',
      ]),
    ],
  },
  {
    slideId: 'c1-toxin',
    title: '討論點1：內毒素／外毒素',
    fields: [
      choice('pick', '王先生的高燒和休克，是內毒素還是外毒素造成的？', ['內毒素', '外毒素']),
      choice('reason', '你選這個答案的主要理由是？', [
        '菌體外膜的脂多糖與發燒、休克有關',
        '活菌分泌的蛋白質毒素造成特定作用',
        '尚未對照毒素的來源與作用',
        '目前不確定',
      ]),
    ],
  },
  {
    slideId: 'c1-spread',
    title: '感染與傳播',
    fields: [
      choice('path', '細菌從A床到B床，你認為可能經由哪個途徑？', [
        '照護者的手接觸不同病床',
        '共用器材接觸不同病床',
        '病床周遭環境接觸',
        '目前無法判斷',
      ]),
      choice('intercept', '你會優先加強哪個攔截步驟？', [
        '接觸病人前後的手部衛生',
        '共用器材的消毒處理',
        '依指示執行接觸隔離',
        '目前不確定',
      ]),
    ],
  },
  {
    slideId: 'c1-sterile',
    title: '消毒與滅菌：對還是錯',
    fields: [
      '高壓蒸氣滅菌器，多半是100℃、15分鐘。',
      '皮膚消毒時，95%酒精比70%酒精更有效。',
      '紫外線穿透力強，隔著包裝也能殺菌。',
      '「滅菌」連內孢子都要殺死，「消毒」不一定。',
    ].map((s, i) => choice('tf' + i, s, ['對', '錯'])),
  },
  {
    slideId: 'c1-drug',
    title: '抗生素作用目標配對',
    fields: [
      'Penicillin',
      'Amoxicillin',
      'Cefazolin',
      'Vancomycin',
      'Gentamicin',
      'Erythromycin',
      'Clarithromycin',
      'Tetracycline',
      'Ciprofloxacin',
      'Rifampin',
      'Sulfonamides',
    ].map((s, i) =>
      choice('drug' + i, s, [
        '細胞壁合成',
        '核糖體（蛋白質合成）',
        'DNA複製',
        'RNA合成',
        '葉酸合成',
      ]),
    ),
  },
  {
    slideId: 'c1-resist',
    title: '抗藥性衛教',
    fields: [
      choice('advice', '王先生說「燒退了，藥可以停了吧？」你會選哪一句衛教？', [
        '症狀改善後仍應依醫療團隊指示用藥，不自行停藥',
        '燒退後就自行停藥',
        '自行把每次藥量減半',
        '留下剩藥，下次生病自行服用',
      ]),
      choice('transfer', '哪個不是細菌傳遞抗藥性基因的方式？', [
        '接合',
        '轉導',
        '轉形',
        '分泌作用',
      ]),
      choice('hospital', '醫院可以如何協助減少抗藥菌？', [
        '參考病原菌與藥物敏感性資訊，避免抗生素濫用',
        '所有感染都使用相同抗生素',
        '不參考藥物敏感性資訊',
        '目前不確定',
      ]),
    ],
  },
  {
    slideId: 'c2-predict',
    title: '第二劑疫苗：先猜再看',
    fields: [
      choice('pick', '小安打完第二劑疫苗後，下列何者正確？', [
        '產生的抗體以IgM為主',
        '免疫反應比第一劑更快',
        '抗體的親和力變低',
        '抗體濃度比第一劑低',
      ]),
    ],
  },
  {
    slideId: 'c2-newborn',
    title: '新生兒的兩份禮物',
    fields: [
      choice('placenta', '哪一種抗體能通過胎盤？', ig),
      choice('milk', '哪一種抗體在母乳裡？', ig),
    ],
  },
  {
    slideId: 'c2-first',
    title: '先天免疫：事件排序',
    fields: [
      {
        id: 'order',
        label: '傷口被細菌入侵：把這四件事排出先後順序',
        kind: 'order',
        options: [
          '單核球離開血管，分化成巨噬細胞',
          '補體被活化，C5a把吞噬細胞吸引過來',
          '巨噬細胞吞噬細菌，也清掉戰死的嗜中性球',
          '嗜中性球最早大量聚集到傷口',
        ],
      },
      choice('heat', '補體加熱到幾度就失效？', ['37℃', '56℃', '70℃', '100℃']),
    ],
  },
  {
    slideId: 'c2-tcell',
    title: '免疫細胞角色卡',
    fields: [
      choice('role', '每人選一張角色卡', [
        '樹突細胞',
        'TH1',
        'TH2',
        'TH17',
        'Treg',
        'CD8毒殺型T細胞',
        'B細胞／漿細胞',
      ]),
      choice('intro', '你選的角色主要負責哪項工作？', [
        '呈現抗原，啟動初始T細胞',
        '活化巨噬細胞',
        '協助B細胞產生抗體與嗜酸性球反應',
        '招募嗜中性球',
        '抑制反應，避免免疫反應過度',
        '殺死病毒感染細胞或腫瘤細胞',
        '製造專一性抗體',
      ]),
    ],
  },
  {
    slideId: 'c2-hiv',
    title: 'HIV衛教',
    fields: [
      choice('receptor', 'HIV的gp120主要與哪個受器結合？', ['CD4', 'CD8', 'MHC I', 'MHC II']),
      choice('advice', '媽媽問「為什麼連小感染都扛不住？」你會選哪個說明？', [
        '輔助型T細胞受損，其他免疫細胞的協調也受影響',
        '只有製造抗體的細胞受到影響',
        '只有負責吞噬的細胞受到影響',
        '目前不確定',
      ]),
    ],
  },
  {
    slideId: 'reflect',
    title: '一分鐘反思',
    fields: [
      choice('concept', '今天最需要再加強哪個概念？', [
        '革蘭氏染色與細菌構造',
        '內毒素與外毒素',
        '傳播、消毒與滅菌',
        '抗生素作用目標與抗藥性',
        '抗體與疫苗反應',
        '先天免疫與補體',
        'T細胞角色與HIV',
        '目前皆能掌握',
      ]),
      choice('confidence', '目前你對這些概念的掌握情形是？', [
        '能獨立解釋',
        '看圖提示後能解釋',
        '仍需教師說明',
      ]),
    ],
  },
];
