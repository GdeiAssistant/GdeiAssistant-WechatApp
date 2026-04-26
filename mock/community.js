const {
  getDeliveryDefaultOrderName
} = require('../constants/community.js')
const i18n = require('../utils/i18n.js')

const DEFAULT_AVATAR = '/image/default.png'

const COMMUNITY_DEFAULT_STATE = {
  secondhandItems: [
    {
      id: 101,
      name: '九成新机械键盘',
      description: '宿舍自用，青轴，带灯效和原装盒。',
      price: 168,
      location: '海珠校区南苑宿舍楼下',
      type: 2,
      state: 1,
      qq: 'mock_contact_id_1',
      phone: '13000000000',
      publishTime: '2026-03-13 20:10',
      pictureURL: ['/image/ershou.png'],
      owner: 'gdeiassistant'
    },
    {
      id: 102,
      name: '考研数学资料一套',
      description: '张宇基础 36 讲和历年真题，已做少量笔记。',
      price: 48,
      location: '图书馆一楼自助借阅区',
      type: 8,
      state: 1,
      qq: 'mock_contact_id_2',
      phone: '13000000001',
      publishTime: '2026-03-14 16:20',
      pictureURL: ['/image/book.png'],
      owner: 'campus_seller'
    },
    {
      id: 103,
      name: '宿舍小风扇',
      description: 'USB 供电，支持摇头，使用正常。',
      price: 25,
      location: '北苑 8 栋快递柜',
      type: 5,
      state: 0,
      qq: 'mock_contact_id_1',
      phone: '13000000000',
      publishTime: '2026-03-10 12:00',
      pictureURL: ['/image/data.png'],
      owner: 'gdeiassistant'
    },
    {
      id: 104,
      name: '折叠雨伞',
      description: '黑色自动伞，几乎全新。',
      price: 18,
      location: '教学楼 A 栋',
      type: 7,
      state: 2,
      qq: 'mock_contact_id_1',
      phone: '13000000000',
      publishTime: '2026-03-09 18:00',
      pictureURL: ['/image/spare.png'],
      owner: 'gdeiassistant'
    }
  ],
  lostAndFoundItems: [
    {
      id: 201,
      name: '蓝色校园卡',
      description: '卡套上贴有小熊贴纸，卡背写了联系电话。',
      location: '一饭门口',
      lostType: 0,
      itemType: 1,
      state: 0,
      qq: 'mock_contact_id_1',
      wechat: 'mock_wechat_id_1',
      phone: '13000000000',
      publishTime: '2026-03-15 08:20',
      pictureURL: ['/image/lostandfound.png'],
      owner: 'gdeiassistant'
    },
    {
      id: 202,
      name: '身份证',
      description: '在图书馆四楼自习区捡到，请失主联系。',
      location: '图书馆四楼',
      lostType: 1,
      itemType: 2,
      state: 0,
      qq: 'mock_contact_id_3',
      wechat: 'mock_wechat_id_2',
      phone: '13000000002',
      publishTime: '2026-03-14 19:40',
      pictureURL: ['/image/card.png'],
      owner: 'library_helper'
    },
    {
      id: 203,
      name: '黑色双肩包',
      description: '内有数据线和一本离散数学笔记。',
      location: 'B 栋 302',
      lostType: 0,
      itemType: 6,
      state: 1,
      qq: 'mock_contact_id_1',
      wechat: 'mock_wechat_id_1',
      phone: '',
      publishTime: '2026-03-11 09:10',
      pictureURL: ['/image/book.png'],
      owner: 'gdeiassistant'
    }
  ],
  secrets: [
    {
      id: 301,
      content: '今天终于把小程序的 mock 流程跑通了，开心。',
      type: 0,
      theme: 1,
      timer: 0,
      publishTime: '2026-03-15 11:20',
      owner: 'gdeiassistant',
      voiceURL: '',
      likedUsers: ['campus_buddy']
    },
    {
      id: 302,
      content: '最近图书馆四楼位置好难抢，希望早起可以赢一次。',
      type: 0,
      theme: 3,
      timer: 0,
      publishTime: '2026-03-14 22:12',
      owner: 'late_study',
      voiceURL: '',
      likedUsers: ['gdeiassistant']
    }
  ],
  secretComments: {
    301: [
      { id: 1, nickname: '同路人', comment: '继续加油，快发版本！', createTime: '2026-03-15 11:30' }
    ],
    302: [
      { id: 1, nickname: '自习搭子', comment: '早上七点前基本还有位置。', createTime: '2026-03-14 22:18' }
    ]
  },
  expressItems: [
    {
      id: 401,
      nickname: '匿名热心同学',
      realname: '林知远',
      selfGender: 0,
      name: '图书馆靠窗的你',
      personGender: 1,
      content: '你总是在晚自习最后十分钟整理笔记，真的很认真。',
      publishTime: '2026-03-13 20:16',
      owner: 'gdeiassistant',
      likedUsers: ['campus_buddy'],
      guessSum: 2,
      guessCount: 1
    },
    {
      id: 402,
      nickname: '今天也想吃宵夜',
      realname: '',
      selfGender: 1,
      name: '操场夜跑的男生',
      personGender: 0,
      content: '你总穿着蓝色外套，跑步节奏特别稳。',
      publishTime: '2026-03-14 21:30',
      owner: 'campus_crush',
      likedUsers: ['gdeiassistant'],
      guessSum: 0,
      guessCount: 0
    }
  ],
  expressComments: {
    401: [
      { id: 1, nickname: '围观群众', comment: '这也太甜了吧。', publishTime: '2026-03-13 20:26' }
    ],
    402: []
  },
  topics: [
    {
      id: 501,
      topic: '春招实习',
      content: '大家最近投递前端和客户端岗位的反馈怎么样？',
      count: 1,
      imageUrls: ['/image/news.png'],
      publishTime: '2026-03-15 10:10',
      owner: 'gdeiassistant',
      likedUsers: ['campus_buddy']
    },
    {
      id: 502,
      topic: '图书馆选座',
      content: '自习室哪个楼层最适合背书？',
      count: 0,
      imageUrls: [],
      publishTime: '2026-03-14 18:10',
      owner: 'study_group',
      likedUsers: []
    }
  ],
  deliveryOrders: [
    {
      orderId: 601,
      name: getDeliveryDefaultOrderName(),
      number: 'mock_pickup_code_a',
      phone: '13000000000',
      price: 4,
      company: '菜鸟驿站',
      address: '示例楼栋 A 区',
      remarks: '一个中号纸箱，麻烦轻拿轻放。',
      orderTime: '2026-03-15 12:08',
      state: 0,
      publisher: 'gdeiassistant',
      acceptor: '',
      tradeId: null
    },
    {
      orderId: 602,
      name: getDeliveryDefaultOrderName(),
      number: 'mock_pickup_code_b',
      phone: '13000000003',
      price: 6,
      company: '京东站点',
      address: '示例楼栋 B 区',
      remarks: '已付款，直接放宿舍门口即可。',
      orderTime: '2026-03-14 17:30',
      state: 1,
      publisher: 'campus_runner',
      acceptor: 'gdeiassistant',
      tradeId: 9001
    }
  ],
  datingProfiles: [
    {
      profileId: 701,
      nickname: '阿远的室友',
      grade: 3,
      faculty: '软件工程',
      hometown: '汕头',
      content: '会拍照、会修电脑、食堂很少踩雷。',
      qq: 'mock_contact_id_1',
      wechat: 'mock_wechat_id_1',
      area: 0,
      pictureURL: '/image/dating.png',
      state: 1,
      createTime: '2026-03-12 14:10',
      owner: 'gdeiassistant'
    },
    {
      profileId: 702,
      nickname: '夜跑学长',
      grade: 4,
      faculty: '数学与信息科学学院',
      hometown: '佛山',
      content: '喜欢长跑和拍落日，周末会去图书馆。',
      qq: 'mock_contact_id_4',
      wechat: 'mock_wechat_id_3',
      area: 1,
      pictureURL: '/image/photograph.png',
      state: 1,
      createTime: '2026-03-11 18:30',
      owner: 'runner_senior'
    }
  ],
  datingPicks: [
    {
      pickId: 801,
      profileId: 701,
      sender: 'campus_buddy',
      content: '可以认识一下吗？感觉你会是很靠谱的搭子。',
      state: 0,
      createTime: '2026-03-14 20:00'
    },
    {
      pickId: 802,
      profileId: 702,
      sender: 'gdeiassistant',
      content: '夜跑结束后有空一起喝奶茶吗？',
      state: 1,
      createTime: '2026-03-14 21:15'
    }
  ],
  photographs: [
    {
      id: 901,
      title: '雨后教学楼',
      content: '下课时刚好遇到一点夕阳。',
      type: 1,
      feedType: 1,
      count: 2,
      imageUrls: ['/image/photograph.png', '/image/news.png'],
      createTime: '2026-03-15 17:20',
      owner: 'gdeiassistant',
      likedUsers: ['campus_buddy']
    },
    {
      id: 902,
      title: '图书馆长廊',
      content: '周末的光影很温柔。',
      type: 2,
      feedType: 0,
      count: 1,
      imageUrls: ['/image/news.png'],
      createTime: '2026-03-14 15:45',
      owner: 'photo_club',
      likedUsers: []
    }
  ],
  photographComments: {
    901: [
      { commentId: 1, nickname: '摄影社同学', comment: '构图好舒服。', createTime: '2026-03-15 17:40' }
    ],
    902: []
  }
}

function localizedCommunityText(locale, simplifiedChinese, traditionalChinese, english, japanese, korean) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  if (normalizedLocale === 'zh-HK' || normalizedLocale === 'zh-TW') return traditionalChinese
  if (normalizedLocale === 'en') return english
  if (normalizedLocale === 'ja') return japanese
  if (normalizedLocale === 'ko') return korean
  return simplifiedChinese
}

function getCommunityLocale(utils) {
  return i18n.normalizeLocale(utils && utils.currentLocale ? utils.currentLocale() : i18n.getCurrentLocale())
}

function buildLocalizedCommunityState(locale) {
  var normalizedLocale = i18n.normalizeLocale(locale || i18n.getCurrentLocale())
  var state = JSON.parse(JSON.stringify(COMMUNITY_DEFAULT_STATE))

  state.secondhandItems[0].name = localizedCommunityText(normalizedLocale, '九成新机械键盘', '九成新機械鍵盤', 'Mechanical keyboard in great condition', '美品メカニカルキーボード', '상태 좋은 기계식 키보드')
  state.secondhandItems[0].description = localizedCommunityText(normalizedLocale, '宿舍自用，青轴，带灯效和原装盒。', '宿舍自用，青軸，帶燈效和原裝盒。', 'Personally used in the dorm, blue switches, includes lighting and the original box.', '寮で使っていたもので、青軸・ライト付き・元箱ありです。', '기숙사에서 사용했고 청축, 조명, 정품 박스 포함입니다.')
  state.secondhandItems[0].location = localizedCommunityText(normalizedLocale, '海珠校区南苑宿舍楼下', '海珠校區南苑宿舍樓下', 'Haizhu campus South Court dorm entrance', '海珠キャンパス南苑寮の前', '하이주 캠퍼스 남원 기숙사 앞')
  state.secondhandItems[1].name = localizedCommunityText(normalizedLocale, '考研数学资料一套', '考研數學資料一套', 'Graduate exam math materials set', '大学院試験数学資料セット', '대학원 입시 수학 자료 세트')
  state.secondhandItems[1].description = localizedCommunityText(normalizedLocale, '张宇基础 36 讲和历年真题，已做少量笔记。', '張宇基礎 36 講和歷年真題，已做少量筆記。', 'Includes Zhang Yu basic lectures and past papers, with a few notes inside.', '張宇の基礎 36 講と過去問セットで、少し書き込みがあります。', '장위 기본 36강과 기출 세트이며 필기가 조금 있습니다.')
  state.secondhandItems[1].location = localizedCommunityText(normalizedLocale, '图书馆一楼自助借阅区', '圖書館一樓自助借閱區', 'Library 1F self-service lending area', '図書館1階セルフ貸出エリア', '도서관 1층 셀프 대출 구역')
  state.secondhandItems[2].name = localizedCommunityText(normalizedLocale, '宿舍小风扇', '宿舍小風扇', 'Small dorm fan', '寮用小型扇風機', '기숙사용 미니 선풍기')
  state.secondhandItems[2].description = localizedCommunityText(normalizedLocale, 'USB 供电，支持摇头，使用正常。', 'USB 供電，支持搖頭，使用正常。', 'USB powered, oscillates, and works well.', 'USB給電で首振り対応、問題なく使えます。', 'USB 전원, 회전 기능 지원, 정상 작동합니다.')
  state.secondhandItems[2].location = localizedCommunityText(normalizedLocale, '北苑 8 栋快递柜', '北苑 8 棟快遞櫃', 'North Court Bldg 8 parcel lockers', '北苑8棟宅配ロッカー前', '북원 8동 택배 보관함 앞')
  state.secondhandItems[3].name = localizedCommunityText(normalizedLocale, '折叠雨伞', '摺疊雨傘', 'Foldable umbrella', '折りたたみ傘', '접이식 우산')
  state.secondhandItems[3].description = localizedCommunityText(normalizedLocale, '黑色自动伞，几乎全新。', '黑色自動傘，幾乎全新。', 'Black automatic umbrella, almost new.', '黒の自動開閉傘で、ほぼ新品です。', '검은색 자동 우산으로 거의 새것입니다.')
  state.secondhandItems[3].location = localizedCommunityText(normalizedLocale, '教学楼 A 栋', '教學樓 A 棟', 'Teaching Building A', '講義棟 A', '강의동 A')

  state.lostAndFoundItems[0].name = localizedCommunityText(normalizedLocale, '蓝色校园卡', '藍色校園卡', 'Blue campus card', '青い学生証', '파란색 캠퍼스 카드')
  state.lostAndFoundItems[0].description = localizedCommunityText(normalizedLocale, '卡套上贴有小熊贴纸，卡背写了联系电话。', '卡套上貼有小熊貼紙，卡背寫了聯繫電話。', 'There is a bear sticker on the card holder and a phone number on the back.', 'カードケースにクマのシールがあり、裏面に連絡先が書かれています。', '카드 케이스에 곰 스티커가 붙어 있고 뒷면에 연락처가 적혀 있습니다.')
  state.lostAndFoundItems[0].location = localizedCommunityText(normalizedLocale, '一饭门口', '一飯門口', 'Outside Canteen 1', '第一食堂の入口', '1식당 앞')
  state.lostAndFoundItems[1].name = localizedCommunityText(normalizedLocale, '身份证', '身份證', 'ID card', '身分証', '신분증')
  state.lostAndFoundItems[1].description = localizedCommunityText(normalizedLocale, '在图书馆四楼自习区捡到，请失主联系。', '在圖書館四樓自習區撿到，請失主聯繫。', 'Found in the library 4F study area. Please contact me if it is yours.', '図書館4階の自習エリアで拾いました。持ち主の方は連絡してください。', '도서관 4층 자습 구역에서 주웠습니다. 분실하신 분은 연락해 주세요.')
  state.lostAndFoundItems[1].location = localizedCommunityText(normalizedLocale, '图书馆四楼', '圖書館四樓', 'Library 4F', '図書館4階', '도서관 4층')
  state.lostAndFoundItems[1].wechat = localizedCommunityText(normalizedLocale, 'mock_wechat_id_2', 'mock_wechat_id_2', 'mock_wechat_id_2', 'mock_wechat_id_2', 'mock_wechat_id_2')
  state.lostAndFoundItems[2].name = localizedCommunityText(normalizedLocale, '黑色双肩包', '黑色雙肩包', 'Black backpack', '黒いバックパック', '검은 백팩')
  state.lostAndFoundItems[2].description = localizedCommunityText(normalizedLocale, '内有数据线和一本离散数学笔记。', '內有數據線和一本離散數學筆記。', 'Contains a cable and a notebook for discrete mathematics.', '中にケーブルと離散数学のノートが入っています。', '안에 케이블과 이산수학 필기 노트가 들어 있습니다.')
  state.lostAndFoundItems[2].location = localizedCommunityText(normalizedLocale, 'B 栋 302', 'B 棟 302', 'Building B Room 302', 'B棟302', 'B동 302호')

  state.secrets[0].content = localizedCommunityText(normalizedLocale, '今天终于把小程序的 mock 流程跑通了，开心。', '今天終於把小程序的 mock 流程跑通了，開心。', 'Finally got the mini-program mock flow working today. Feeling great.', '今日ついにミニプログラムの mock フローが通ってうれしい。', '오늘 드디어 미니프로그램 mock 흐름을 다 돌렸어요. 기분 좋네요.')
  state.secrets[1].content = localizedCommunityText(normalizedLocale, '最近图书馆四楼位置好难抢，希望早起可以赢一次。', '最近圖書館四樓位置好難搶，希望早起可以贏一次。', 'Seats on the library 4F have been so hard to get lately. Hoping waking up early helps me win once.', '最近は図書館4階の席が本当に取りづらい。早起きで一回勝ちたい。', '요즘 도서관 4층 자리가 정말 잡기 힘들어요. 일찍 일어나서 한 번은 이기고 싶네요.')
  state.secretComments[301][0].nickname = localizedCommunityText(normalizedLocale, '同路人', '同路人', 'Fellow traveler', '同じ道を行く人', '같은 길을 걷는 사람')
  state.secretComments[301][0].comment = localizedCommunityText(normalizedLocale, '继续加油，快发版本！', '繼續加油，快發版本！', 'Keep going. Ship that release soon!', 'その調子で、早くリリースしよう！', '계속 힘내요. 얼른 버전 올려요!')
  state.secretComments[302][0].nickname = localizedCommunityText(normalizedLocale, '自习搭子', '自習搭子', 'Study buddy', '自習仲間', '자습 메이트')
  state.secretComments[302][0].comment = localizedCommunityText(normalizedLocale, '早上七点前基本还有位置。', '早上七點前基本還有位置。', 'There are usually still seats before 7 a.m.', '朝7時前ならだいたいまだ席があります。', '아침 7시 전이면 대체로 자리가 있어요.')

  state.expressItems[0].nickname = localizedCommunityText(normalizedLocale, '匿名热心同学', '匿名熱心同學', 'Anonymous kind student', '匿名の親切な学生', '익명의 친절한 학생')
  state.expressItems[0].name = localizedCommunityText(normalizedLocale, '图书馆靠窗的你', '圖書館靠窗的你', 'You by the library window', '図書館の窓際にいるあなた', '도서관 창가의 너')
  state.expressItems[0].content = localizedCommunityText(normalizedLocale, '你总是在晚自习最后十分钟整理笔记，真的很认真。', '你總是在晚自習最後十分鐘整理筆記，真的很認真。', 'You always organize your notes in the last ten minutes of evening study. It is really impressive.', '夜自習の最後の10分でいつもノートを整理していて、本当に真面目だなと思う。', '야간 자습 마지막 10분마다 늘 노트를 정리하더라고요. 정말 성실해 보여요.')
  state.expressItems[1].nickname = localizedCommunityText(normalizedLocale, '今天也想吃宵夜', '今天也想吃宵夜', 'Still craving a late-night snack', '今日も夜食が食べたい', '오늘도 야식이 먹고 싶어')
  state.expressItems[1].name = localizedCommunityText(normalizedLocale, '操场夜跑的男生', '操場夜跑的男生', 'The guy running on the track at night', '夜にグラウンドを走るあなた', '밤에 운동장을 달리던 남학생')
  state.expressItems[1].content = localizedCommunityText(normalizedLocale, '你总穿着蓝色外套，跑步节奏特别稳。', '你總穿著藍色外套，跑步節奏特別穩。', 'You always wear a blue jacket and your running pace is so steady.', 'いつも青い上着を着ていて、走るペースがすごく安定している。', '항상 파란 겉옷을 입고 있는데 달리는 리듬이 정말 안정적이에요.')
  state.expressComments[401][0].nickname = localizedCommunityText(normalizedLocale, '围观群众', '圍觀群眾', 'Onlooker', '見守る人', '구경하던 사람')
  state.expressComments[401][0].comment = localizedCommunityText(normalizedLocale, '这也太甜了吧。', '這也太甜了吧。', 'This is way too sweet.', 'これは甘すぎるでしょ。', '이건 너무 달달하네요.')

  state.topics[0].topic = localizedCommunityText(normalizedLocale, '春招实习', '春招實習', 'Spring internship hunt', '春採用インターン', '봄 인턴 지원')
  state.topics[0].content = localizedCommunityText(normalizedLocale, '大家最近投递前端和客户端岗位的反馈怎么样？', '大家最近投遞前端和客戶端崗位的反饋怎麼樣？', 'How has everyone been hearing back from frontend and client-side applications lately?', '最近、フロントエンドやクライアント系の応募結果ってどうですか。', '요즘 프론트엔드랑 클라이언트 직군 지원 결과가 어떤가요?')
  state.topics[1].topic = localizedCommunityText(normalizedLocale, '图书馆选座', '圖書館選座', 'Library seat picking', '図書館の席取り', '도서관 자리 잡기')
  state.topics[1].content = localizedCommunityText(normalizedLocale, '自习室哪个楼层最适合背书？', '自習室哪個樓層最適合背書？', 'Which study room floor is best for memorizing?', '自習室はどの階が暗記に向いていますか。', '자습실은 몇 층이 암기하기에 가장 좋나요?')

  state.deliveryOrders[0].name = getDeliveryDefaultOrderName(normalizedLocale)
  state.deliveryOrders[0].company = localizedCommunityText(normalizedLocale, '菜鸟驿站', '菜鳥驛站', 'Cainiao Station', '菜鳥ステーション', '차이냐오 스테이션')
  state.deliveryOrders[0].address = localizedCommunityText(normalizedLocale, '示例楼栋 A 区', '示例樓棟 A 區', 'Example Building A', 'サンプル棟 A', '예시 건물 A')
  state.deliveryOrders[0].remarks = localizedCommunityText(normalizedLocale, '一个中号纸箱，麻烦轻拿轻放。', '一個中號紙箱，麻煩輕拿輕放。', 'A medium-size box. Please handle with care.', '中サイズの段ボールです。丁寧に扱ってください。', '중간 크기 상자예요. 조심히 다뤄 주세요.')
  state.deliveryOrders[1].name = getDeliveryDefaultOrderName(normalizedLocale)
  state.deliveryOrders[1].company = localizedCommunityText(normalizedLocale, '京东站点', '京東站點', 'JD pickup point', 'JD受取所', 'JD 수령 지점')
  state.deliveryOrders[1].address = localizedCommunityText(normalizedLocale, '示例楼栋 B 区', '示例樓棟 B 區', 'Example Building B', 'サンプル棟 B', '예시 건물 B')
  state.deliveryOrders[1].remarks = localizedCommunityText(normalizedLocale, '已付款，直接放宿舍门口即可。', '已付款，直接放宿舍門口即可。', 'Already paid. You can leave it at the dorm door.', '支払い済みです。寮のドア前に置いてもらえれば大丈夫です。', '결제 완료했습니다. 기숙사 문 앞에 두셔도 됩니다.')

  state.datingProfiles[0].nickname = localizedCommunityText(normalizedLocale, '阿远的室友', '阿遠的室友', 'A Yuan\'s roommate', 'アーユエンのルームメイト', '아위안의 룸메이트')
  state.datingProfiles[0].faculty = localizedCommunityText(normalizedLocale, '软件工程', '軟體工程', 'Software Engineering', 'ソフトウェア工学', '소프트웨어공학')
  state.datingProfiles[0].hometown = localizedCommunityText(normalizedLocale, '汕头', '汕頭', 'Shantou', '汕頭', '산터우')
  state.datingProfiles[0].content = localizedCommunityText(normalizedLocale, '会拍照、会修电脑、食堂很少踩雷。', '會拍照、會修電腦、食堂很少踩雷。', 'Can take photos, fix computers, and rarely picks bad dishes in the canteen.', '写真も撮れるしパソコン修理もできるし、食堂でもあまりハズレを引かない。', '사진도 찍고 컴퓨터도 고칠 줄 알고, 학식도 실패가 거의 없어요.')
  state.datingProfiles[1].nickname = localizedCommunityText(normalizedLocale, '夜跑学长', '夜跑學長', 'Night-run senior', '夜ラン先輩', '야간 러닝 선배')
  state.datingProfiles[1].faculty = localizedCommunityText(normalizedLocale, '数学与信息科学学院', '數學與信息科學學院', 'School of Mathematics and Information Science', '数学情報科学学院', '수학정보과학대학')
  state.datingProfiles[1].hometown = localizedCommunityText(normalizedLocale, '佛山', '佛山', 'Foshan', '佛山', '포산')
  state.datingProfiles[1].content = localizedCommunityText(normalizedLocale, '喜欢长跑和拍落日，周末会去图书馆。', '喜歡長跑和拍落日，週末會去圖書館。', 'Likes long-distance running and sunset photography, and goes to the library on weekends.', '長距離ランと夕焼けの写真が好きで、週末は図書館にも行きます。', '장거리 달리기와 노을 사진을 좋아하고 주말엔 도서관에도 가요.')
  state.datingPicks[0].content = localizedCommunityText(normalizedLocale, '可以认识一下吗？感觉你会是很靠谱的搭子。', '可以認識一下嗎？感覺你會是很靠譜的搭子。', 'Can we get to know each other? You seem like a really reliable person.', '少し話してみませんか。とても頼れそうな人だと思いました。', '서로 알아갈 수 있을까요? 정말 믿음직한 사람 같아요.')
  state.datingPicks[1].content = localizedCommunityText(normalizedLocale, '夜跑结束后有空一起喝奶茶吗？', '夜跑結束後有空一起喝奶茶嗎？', 'Want to grab milk tea after the night run?', '夜ランのあと、ミルクティーでもどうですか。', '야간 러닝 끝나고 밀크티 한 잔 할래요?')

  state.photographs[0].title = localizedCommunityText(normalizedLocale, '雨后教学楼', '雨後教學樓', 'Teaching building after the rain', '雨上がりの講義棟', '비 온 뒤의 강의동')
  state.photographs[0].content = localizedCommunityText(normalizedLocale, '下课时刚好遇到一点夕阳。', '下課時剛好遇到一點夕陽。', 'Caught a little sunset right after class.', '授業が終わったらちょうど少し夕日が出ていた。', '수업 끝나고 딱 노을이 조금 비쳤어요.')
  state.photographs[1].title = localizedCommunityText(normalizedLocale, '图书馆长廊', '圖書館長廊', 'Library corridor', '図書館の回廊', '도서관 복도')
  state.photographs[1].content = localizedCommunityText(normalizedLocale, '周末的光影很温柔。', '週末的光影很溫柔。', 'The weekend light felt really gentle.', '週末の光と影がとてもやわらかかった。', '주말의 빛과 그림자가 정말 부드러웠어요.')
  state.photographComments[901][0].nickname = localizedCommunityText(normalizedLocale, '摄影社同学', '攝影社同學', 'Photography club student', '写真部の学生', '사진 동아리 학생')
  state.photographComments[901][0].comment = localizedCommunityText(normalizedLocale, '构图好舒服。', '構圖好舒服。', 'The composition feels so comfortable.', '構図がすごく心地いい。', '구도가 정말 편안해 보여요.')

  return state
}

function cloneCommunityState(utils) {
  return buildLocalizedCommunityState(getCommunityLocale(utils))
}

function getCurrentUsername(utils) {
  const state = utils.readState()
  const profile = state && state.profile ? state.profile : {}
  return profile.username || 'gdeiassistant'
}

function ensureCommunityState(utils) {
  const state = utils.readState()
  const currentLocale = getCommunityLocale(utils)
  if (!state.community || typeof state.community !== 'object' || state.communityLocale !== currentLocale) {
    state.community = cloneCommunityState(utils)
    state.communityLocale = currentLocale
    utils.writeState(state)
  }
  return state.community
}

function communityMessage(utils, key) {
  var locale = getCommunityLocale(utils)
  var messages = {
    marketItemNotFound: localizedCommunityText(locale, '商品不存在', '商品不存在', 'Item not found', '商品が見つかりません', '상품을 찾을 수 없습니다'),
    marketIncomplete: localizedCommunityText(locale, '请完整填写商品信息', '請完整填寫商品信息', 'Please complete all item information', '商品情報をすべて入力してください', '상품 정보를 모두 입력해 주세요'),
    marketInvalidPrice: localizedCommunityText(locale, '请输入正确的商品价格', '請輸入正確的商品價格', 'Please enter a valid item price', '正しい商品価格を入力してください', '올바른 상품 가격을 입력해 주세요'),
    marketEditDenied: localizedCommunityText(locale, '没有权限编辑该商品', '沒有權限編輯該商品', 'You do not have permission to edit this item', 'この商品を編集する権限がありません', '이 상품을 수정할 권한이 없습니다'),
    marketOperateDenied: localizedCommunityText(locale, '没有权限操作该商品', '沒有權限操作該商品', 'You do not have permission to operate on this item', 'この商品を操作する権限がありません', '이 상품을 조작할 권한이 없습니다'),
    infoNotFound: localizedCommunityText(locale, '信息不存在', '信息不存在', 'Information not found', '情報が見つかりません', '정보를 찾을 수 없습니다'),
    lostFoundIncomplete: localizedCommunityText(locale, '请完整填写失物信息', '請完整填寫失物信息', 'Please complete all lost-and-found information', '遺失物情報をすべて入力してください', '분실물 정보를 모두 입력해 주세요'),
    lostFoundContactRequired: localizedCommunityText(locale, '请至少填写一种联系方式', '請至少填寫一種聯繫方式', 'Please provide at least one contact method', '連絡先を少なくとも1つ入力してください', '연락처를 하나 이상 입력해 주세요'),
    secretNotFound: localizedCommunityText(locale, '树洞不存在', '樹洞不存在', 'Secret post not found', 'ツリーホールが見つかりません', '트리홀을 찾을 수 없습니다'),
    commentEmpty: localizedCommunityText(locale, '评论不能为空', '評論不能為空', 'Comment cannot be empty', 'コメントを空にすることはできません', '댓글은 비워둘 수 없습니다'),
    secretContentEmpty: localizedCommunityText(locale, '树洞内容不能为空', '樹洞內容不能為空', 'Secret content cannot be empty', 'ツリーホールの内容は空にできません', '트리홀 내용은 비워둘 수 없습니다'),
    secretVoiceEmpty: localizedCommunityText(locale, '语音内容不能为空', '語音內容不能為空', 'Voice content cannot be empty', '音声内容は空にできません', '음성 내용은 비워둘 수 없습니다'),
    expressNotFound: localizedCommunityText(locale, '表白信息不存在', '表白信息不存在', 'Confession post not found', '告白情報が見つかりません', '고백 게시글을 찾을 수 없습니다'),
    expressGuessUnsupported: localizedCommunityText(locale, '该表白不支持猜名字', '該表白不支持猜名字', 'This confession does not support name guessing', 'この告白は名前当てに対応していません', '이 고백 글은 이름 맞히기를 지원하지 않습니다'),
    expressIncomplete: localizedCommunityText(locale, '请完整填写表白信息', '請完整填寫表白信息', 'Please complete all confession information', '告白情報をすべて入力してください', '고백 정보를 모두 입력해 주세요'),
    topicNotFound: localizedCommunityText(locale, '话题不存在', '話題不存在', 'Topic not found', 'トピックが見つかりません', '토픽을 찾을 수 없습니다'),
    topicIncomplete: localizedCommunityText(locale, '请完整填写话题信息', '請完整填寫話題信息', 'Please complete all topic information', 'トピック情報をすべて入力してください', '토픽 정보를 모두 입력해 주세요'),
    deliveryNotFound: localizedCommunityText(locale, '订单不存在', '訂單不存在', 'Order not found', '注文が見つかりません', '주문을 찾을 수 없습니다'),
    deliveryOwnOrder: localizedCommunityText(locale, '不能接自己发布的订单', '不能接自己發布的訂單', 'You cannot accept your own order', '自分が出した注文は受けられません', '자신이 올린 주문은 받을 수 없습니다'),
    deliveryAccepted: localizedCommunityText(locale, '订单已被接取', '訂單已被接取', 'Order has already been accepted', '注文はすでに受注されています', '주문이 이미 접수되었습니다'),
    tradeNotFound: localizedCommunityText(locale, '交易不存在', '交易不存在', 'Trade not found', '取引が見つかりません', '거래를 찾을 수 없습니다'),
    deliveryFinishDenied: localizedCommunityText(locale, '只有发布者可确认完成', '只有發布者可確認完成', 'Only the publisher can confirm completion', '完了確認は投稿者のみ可能です', '게시자만 완료를 확인할 수 있습니다'),
    deliveryIncomplete: localizedCommunityText(locale, '请完整填写跑腿订单信息', '請完整填寫跑腿訂單信息', 'Please complete all errand order information', '配送注文情報をすべて入力してください', '심부름 주문 정보를 모두 입력해 주세요'),
    datingIncomplete: localizedCommunityText(locale, '请完整填写交友信息', '請完整填寫交友信息', 'Please complete all dating information', '交友情報をすべて入力してください', '교류 정보를 모두 입력해 주세요'),
    datingTargetNotFound: localizedCommunityText(locale, '目标信息不存在', '目標信息不存在', 'Target profile not found', '対象プロフィールが見つかりません', '대상 정보를 찾을 수 없습니다'),
    datingSelfPick: localizedCommunityText(locale, '不能给自己发送撩一下', '不能給自己發送撩一下', 'You cannot send a pick to yourself', '自分自身に送ることはできません', '자기 자신에게 찔러보기를 보낼 수 없습니다'),
    datingPickExists: localizedCommunityText(locale, '你已经发送过撩一下了', '你已經發送過撩一下了', 'You have already sent a pick', 'すでに送信済みです', '이미 찔러보기를 보냈습니다'),
    requestNotFound: localizedCommunityText(locale, '请求不存在', '請求不存在', 'Request not found', 'リクエストが見つかりません', '요청을 찾을 수 없습니다'),
    requestOperateDenied: localizedCommunityText(locale, '没有权限操作该请求', '沒有權限操作該請求', 'You do not have permission to operate on this request', 'このリクエストを操作する権限がありません', '이 요청을 조작할 권한이 없습니다'),
    infoOperateDenied: localizedCommunityText(locale, '没有权限操作该信息', '沒有權限操作該信息', 'You do not have permission to operate on this post', 'この情報を操作する権限がありません', '이 정보를 조작할 권한이 없습니다'),
    photoNotFound: localizedCommunityText(locale, '作品不存在', '作品不存在', 'Work not found', '作品が見つかりません', '작품을 찾을 수 없습니다'),
    photoUploadRequired: localizedCommunityText(locale, '请至少上传一张图片', '請至少上傳一張圖片', 'Please upload at least one image', '画像を少なくとも1枚アップロードしてください', '이미지를 한 장 이상 업로드해 주세요')
  }
  return messages[key] || key
}

function currentUserDisplayName(utils) {
  return localizedCommunityText(getCommunityLocale(utils), '我', '我', 'Me', '私', '나')
}

function saveCommunityState(utils, communityState) {
  const state = utils.readState()
  state.community = communityState
  utils.writeState(state)
}

function buildProfile(username, utils) {
  var locale = getCommunityLocale(utils)
  return {
    username: username,
    nickname: username === 'gdeiassistant'
      ? localizedCommunityText(locale, '林知远', '林知遠', 'Lin Zhiyuan', 'リン・ジーユエン', '린즈위안')
      : localizedCommunityText(locale, `${username} 同学`, `${username} 同學`, `${username} Student`, `${username} さん`, `${username} 학생`),
    avatarURL: DEFAULT_AVATAR,
    introduction: username === 'gdeiassistant'
      ? localizedCommunityText(locale, '喜欢做实用的小工具。', '喜歡做實用的小工具。', 'Enjoys building practical tools.', '実用的な小さなツールを作るのが好き。', '실용적인 작은 도구 만드는 걸 좋아합니다.')
      : localizedCommunityText(locale, '这个人很懒，什么都没写。', '這個人很懶，什麼都沒寫。', 'This person has not written anything yet.', 'この人はまだ何も書いていません。', '이 사람은 아직 아무 소개도 적지 않았습니다.')
  }
}

function buildSecretPayload(secret, username, commentList) {
  return Object.assign({}, secret, {
    liked: Array.isArray(secret.likedUsers) && secret.likedUsers.indexOf(username) !== -1 ? 1 : 0,
    likeCount: Array.isArray(secret.likedUsers) ? secret.likedUsers.length : 0,
    commentCount: Array.isArray(commentList) ? commentList.length : 0
  })
}

function buildExpressPayload(item, username, commentList) {
  return Object.assign({}, item, {
    liked: Array.isArray(item.likedUsers) && item.likedUsers.indexOf(username) !== -1,
    likeCount: Array.isArray(item.likedUsers) ? item.likedUsers.length : 0,
    commentCount: Array.isArray(commentList) ? commentList.length : 0,
    canGuess: !!item.realname
  })
}

function buildTopicPayload(item, username) {
  return Object.assign({}, item, {
    liked: Array.isArray(item.likedUsers) && item.likedUsers.indexOf(username) !== -1,
    likeCount: Array.isArray(item.likedUsers) ? item.likedUsers.length : 0
  })
}

function buildPhotographPayload(item, username, commentList) {
  return Object.assign({}, item, {
    firstImageUrl: item.imageUrls && item.imageUrls.length ? item.imageUrls[0] : '',
    liked: Array.isArray(item.likedUsers) && item.likedUsers.indexOf(username) !== -1,
    likeCount: Array.isArray(item.likedUsers) ? item.likedUsers.length : 0,
    commentCount: Array.isArray(commentList) ? commentList.length : 0,
    photographCommentList: commentList
  })
}

function findById(list, key, id) {
  const targetId = Number(id)
  return (list || []).filter(function(item) {
    return Number(item[key]) === targetId
  })[0] || null
}

function nextId(list, key, base) {
  const values = (list || []).map(function(item) {
    return Number(item[key]) || 0
  })
  const maxValue = values.length ? Math.max.apply(null, values) : base
  return maxValue + 1
}

function nowText() {
  return '2026-03-15 18:00'
}

function createComment(list, nickname, comment) {
  const nextCommentId = nextId(list, list.length && list[0].commentId !== undefined ? 'commentId' : 'id', 0)
  if (list.length && list[0].commentId !== undefined) {
    return {
      commentId: nextCommentId,
      nickname: nickname,
      comment: comment,
      createTime: nowText()
    }
  }
  return {
    id: nextCommentId,
    nickname: nickname,
    comment: comment,
    publishTime: nowText(),
    createTime: nowText()
  }
}

function getDeliveryDetailType(order, username) {
  if (!order) {
    return 2
  }
  if (order.publisher === username) {
    return 0
  }
  if (!order.acceptor) {
    return 1
  }
  if (order.acceptor === username) {
    return 3
  }
  return 2
}

function buildRoommatePickPayload(pick, communityState) {
  const profile = findById(communityState.datingProfiles, 'profileId', pick.profileId)
  return Object.assign({}, pick, {
    roommateProfile: profile || null
  })
}

function handleSecondhand(path, method, data, token, utils) {
  if (!/^\/api\/ershou\//.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/ershou\/item\/start\/\d+$/.test(path) && method === 'GET') {
    const matched = /\/start\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const list = communityState.secondhandItems.filter(function(item) {
      return Number(item.state) === 1
    }).slice(start, start + 10)
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/ershou\/keyword\/.+\/start\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/ershou\/keyword\/(.+)\/start\/(\d+)$/.exec(path)
    const keyword = decodeURIComponent(matched[1]).toLowerCase()
    const start = Number(matched[2])
    const list = communityState.secondhandItems.filter(function(item) {
      return Number(item.state) === 1 &&
        (String(item.name).toLowerCase().indexOf(keyword) !== -1 ||
        String(item.description).toLowerCase().indexOf(keyword) !== -1)
    }).slice(start, start + 10)
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/ershou\/item\/type\/\d+\/start\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/ershou\/item\/type\/(\d+)\/start\/(\d+)$/.exec(path)
    const type = Number(matched[1])
    const start = Number(matched[2])
    const list = communityState.secondhandItems.filter(function(item) {
      return Number(item.state) === 1 && Number(item.type) === type
    }).slice(start, start + 10)
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (path === '/api/ershou/profile' && method === 'GET') {
    const mine = communityState.secondhandItems.filter(function(item) {
      return item.owner === username
    })
    return utils.resolveWithDelay(utils.buildSuccess({
      doing: mine.filter(function(item) { return Number(item.state) === 1 }),
      sold: mine.filter(function(item) { return Number(item.state) === 0 }),
      off: mine.filter(function(item) { return Number(item.state) === 2 })
    }))
  }

  if (/^\/api\/ershou\/item\/id\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/ershou\/item\/id\/(\d+)$/.exec(path)
    const item = findById(communityState.secondhandItems, 'id', matched[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketItemNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess({
      secondhandItem: item,
      profile: buildProfile(item.owner, utils)
    }))
  }

  if (path === '/api/ershou/item' && method === 'POST') {
    const nextItem = {
      id: nextId(communityState.secondhandItems, 'id', 100),
      name: String(data.name || '').trim(),
      description: String(data.description || '').trim(),
      price: Number(data.price || 0),
      location: String(data.location || '').trim(),
      type: Number(data.type || 0),
      state: 1,
      qq: String(data.qq || '').trim(),
      phone: String(data.phone || '').trim(),
      publishTime: nowText(),
      pictureURL: Array.isArray(data.imageKeys) ? data.imageKeys : [data.imageKeys].filter(Boolean),
      owner: username
    }
    if (!nextItem.name || !nextItem.description || !nextItem.location || !nextItem.pictureURL.length) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketIncomplete'))
    }
    if (!(nextItem.price > 0)) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketInvalidPrice'))
    }
    communityState.secondhandItems.unshift(nextItem)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/ershou\/item\/id\/\d+$/.test(path) && method === 'POST') {
    const matched = /^\/api\/ershou\/item\/id\/(\d+)$/.exec(path)
    const item = findById(communityState.secondhandItems, 'id', matched[1])
    if (!item || item.owner !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketEditDenied'))
    }

    item.name = String(data.name || '').trim()
    item.description = String(data.description || '').trim()
    item.price = Number(data.price || 0)
    item.location = String(data.location || '').trim()
    item.type = Number(data.type || 0)
    item.qq = String(data.qq || '').trim()
    item.phone = String(data.phone || '').trim()

    if (!item.name || !item.description || !item.location) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketIncomplete'))
    }
    if (!(item.price > 0)) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketInvalidPrice'))
    }

    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/ershou\/item\/state\/id\/\d+$/.test(path) && method === 'POST') {
    const matched = /^\/api\/ershou\/item\/state\/id\/(\d+)$/.exec(path)
    const item = findById(communityState.secondhandItems, 'id', matched[1])
    if (!item || item.owner !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'marketOperateDenied'))
    }
    item.state = Number(data.state || 0)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleLostAndFound(path, method, data, token, utils) {
  if (!/^\/api\/lostandfound\//.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/lostandfound\/lostitem\/start\/\d+$/.test(path) && method === 'GET') {
    const start = Number(/\/start\/(\d+)$/.exec(path)[1])
    return utils.resolveWithDelay(utils.buildSuccess(communityState.lostAndFoundItems.filter(function(item) {
      return Number(item.state) === 0 && Number(item.lostType) === 0
    }).slice(start, start + 10)))
  }

  if (/^\/api\/lostandfound\/founditem\/start\/\d+$/.test(path) && method === 'GET') {
    const start = Number(/\/start\/(\d+)$/.exec(path)[1])
    return utils.resolveWithDelay(utils.buildSuccess(communityState.lostAndFoundItems.filter(function(item) {
      return Number(item.state) === 0 && Number(item.lostType) === 1
    }).slice(start, start + 10)))
  }

  if (/^\/api\/lostandfound\/lostitem\/type\/\d+\/start\/\d+$/.test(path) && method === 'POST') {
    const matched = /^\/api\/lostandfound\/lostitem\/type\/(\d+)\/start\/(\d+)$/.exec(path)
    const lostType = Number(matched[1])
    const start = Number(matched[2])
    const keyword = String(data.keyword || '').trim().toLowerCase()
    const list = communityState.lostAndFoundItems.filter(function(item) {
      return Number(item.state) === 0 &&
        Number(item.lostType) === lostType &&
        (String(item.name).toLowerCase().indexOf(keyword) !== -1 ||
        String(item.description).toLowerCase().indexOf(keyword) !== -1)
    }).slice(start, start + 10)
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (path === '/api/lostandfound/profile' && method === 'GET') {
    const mine = communityState.lostAndFoundItems.filter(function(item) {
      return item.owner === username
    })
    return utils.resolveWithDelay(utils.buildSuccess({
      lost: mine.filter(function(item) { return Number(item.state) === 0 && Number(item.lostType) === 0 }),
      found: mine.filter(function(item) { return Number(item.state) === 0 && Number(item.lostType) === 1 }),
      didfound: mine.filter(function(item) { return Number(item.state) === 1 })
    }))
  }

  if (/^\/api\/lostandfound\/item\/id\/\d+$/.test(path) && method === 'GET') {
    const item = findById(communityState.lostAndFoundItems, 'id', /^\/api\/lostandfound\/item\/id\/(\d+)$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'infoNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess({
      item: item,
      profile: buildProfile(item.owner, utils)
    }))
  }

  if (path === '/api/lostandfound/item' && method === 'POST') {
    const nextItem = {
      id: nextId(communityState.lostAndFoundItems, 'id', 200),
      name: String(data.name || '').trim(),
      description: String(data.description || '').trim(),
      location: String(data.location || '').trim(),
      lostType: Number(data.lostType || 0),
      itemType: Number(data.itemType || 0),
      state: 0,
      qq: String(data.qq || '').trim(),
      wechat: String(data.wechat || '').trim(),
      phone: String(data.phone || '').trim(),
      publishTime: nowText(),
      pictureURL: Array.isArray(data.imageKeys) ? data.imageKeys : [data.imageKeys].filter(Boolean),
      owner: username
    }
    if (!nextItem.name || !nextItem.description || !nextItem.location || !nextItem.pictureURL.length) {
      return utils.rejectWithMessage(communityMessage(utils, 'lostFoundIncomplete'))
    }
    communityState.lostAndFoundItems.unshift(nextItem)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/lostandfound\/item\/id\/\d+$/.test(path) && method === 'POST') {
    const matched = /^\/api\/lostandfound\/item\/id\/(\d+)$/.exec(path)
    const item = findById(communityState.lostAndFoundItems, 'id', matched[1])
    if (!item || item.owner !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'infoOperateDenied'))
    }

    item.name = String(data.name || '').trim()
    item.description = String(data.description || '').trim()
    item.location = String(data.location || '').trim()
    item.lostType = Number(data.lostType || 0)
    item.itemType = Number(data.itemType || 0)
    item.qq = String(data.qq || '').trim()
    item.wechat = String(data.wechat || '').trim()
    item.phone = String(data.phone || '').trim()

    if (!item.name || !item.description || !item.location) {
      return utils.rejectWithMessage(communityMessage(utils, 'lostFoundIncomplete'))
    }
    if (!item.qq && !item.wechat && !item.phone) {
      return utils.rejectWithMessage(communityMessage(utils, 'lostFoundContactRequired'))
    }

    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/lostandfound\/item\/id\/\d+\/didfound$/.test(path) && method === 'POST') {
    const item = findById(communityState.lostAndFoundItems, 'id', /^\/api\/lostandfound\/item\/id\/(\d+)\/didfound$/.exec(path)[1])
    if (!item || item.owner !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'infoOperateDenied'))
    }
    item.state = 1
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleSecret(path, method, data, token, utils) {
  if (!/^\/api\/secret\//.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/secret\/info\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/secret\/info\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    const list = communityState.secrets.slice(start, start + size).map(function(item) {
      return buildSecretPayload(item, username, communityState.secretComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/secret\/profile\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/secret\/profile\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Math.min(Number(matched[2]), 50)
    const list = communityState.secrets.filter(function(item) {
      return item.owner === username
    }).slice(start, start + size).map(function(item) {
      return buildSecretPayload(item, username, communityState.secretComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (path === '/api/secret/profile' && method === 'GET') {
    const list = communityState.secrets.filter(function(item) {
      return item.owner === username
    }).map(function(item) {
      return buildSecretPayload(item, username, communityState.secretComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/secret\/id\/\d+$/.test(path) && method === 'GET') {
    const secretId = /^\/api\/secret\/id\/(\d+)$/.exec(path)[1]
    const item = findById(communityState.secrets, 'id', secretId)
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'secretNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess(buildSecretPayload(item, username, communityState.secretComments[item.id] || [])))
  }

  if (/^\/api\/secret\/id\/\d+\/comments$/.test(path) && method === 'GET') {
    const secretId = Number(/^\/api\/secret\/id\/(\d+)\/comments$/.exec(path)[1])
    return utils.resolveWithDelay(utils.buildSuccess((communityState.secretComments[secretId] || []).slice()))
  }

  if (/^\/api\/secret\/id\/\d+\/comment$/.test(path) && method === 'POST') {
    const secretId = Number(/^\/api\/secret\/id\/(\d+)\/comment$/.exec(path)[1])
    const item = findById(communityState.secrets, 'id', secretId)
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'secretNotFound'))
    }
    const comment = String(data.comment || '').trim()
    if (!comment) {
      return utils.rejectWithMessage(communityMessage(utils, 'commentEmpty'))
    }
    const list = communityState.secretComments[secretId] || []
    list.push(createComment(list, currentUserDisplayName(utils), comment))
    communityState.secretComments[secretId] = list
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/secret\/id\/\d+\/like$/.test(path) && method === 'POST') {
    const secretId = Number(/^\/api\/secret\/id\/(\d+)\/like$/.exec(path)[1])
    const item = findById(communityState.secrets, 'id', secretId)
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'secretNotFound'))
    }
    const like = Number(data.like || 0)
    item.likedUsers = Array.isArray(item.likedUsers) ? item.likedUsers : []
    if (like === 1 && item.likedUsers.indexOf(username) === -1) {
      item.likedUsers.push(username)
    }
    if (like === 0) {
      item.likedUsers = item.likedUsers.filter(function(userItem) {
        return userItem !== username
      })
    }
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (path === '/api/secret/info' && method === 'POST') {
    const type = Number(data.type || 0)
    const content = String(data.content || '').trim()
    const voiceKey = String(data.voiceKey || '').trim()
    if (type === 0 && !content) {
      return utils.rejectWithMessage(communityMessage(utils, 'secretContentEmpty'))
    }
    if (type === 1 && !voiceKey) {
      return utils.rejectWithMessage(communityMessage(utils, 'secretVoiceEmpty'))
    }
    const nextSecret = {
      id: nextId(communityState.secrets, 'id', 300),
      content: content || localizedCommunityText(getCommunityLocale(utils), '语音树洞', '語音樹洞', 'Voice secret', '音声ツリーホール', '음성 트리홀'),
      type: type,
      theme: Number(data.theme || 1),
      timer: Number(data.timer || 0),
      publishTime: nowText(),
      owner: username,
      voiceURL: voiceKey,
      likedUsers: []
    }
    communityState.secrets.unshift(nextSecret)
    communityState.secretComments[nextSecret.id] = []
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleExpress(path, method, data, token, utils) {
  if (!/^\/api\/express(\/|$)/.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/express\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/express\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    const list = communityState.expressItems.slice(start, start + size).map(function(item) {
      return buildExpressPayload(item, username, communityState.expressComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/express\/keyword\/.+\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/express\/keyword\/(.+)\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const keyword = decodeURIComponent(matched[1]).toLowerCase()
    const start = Number(matched[2])
    const size = Number(matched[3])
    const list = communityState.expressItems.filter(function(item) {
      return String(item.nickname).toLowerCase().indexOf(keyword) !== -1 ||
        String(item.name).toLowerCase().indexOf(keyword) !== -1 ||
        String(item.content).toLowerCase().indexOf(keyword) !== -1
    }).slice(start, start + size).map(function(item) {
      return buildExpressPayload(item, username, communityState.expressComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/express\/profile\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/express\/profile\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    const list = communityState.expressItems.filter(function(item) {
      return item.owner === username
    }).slice(start, start + size).map(function(item) {
      return buildExpressPayload(item, username, communityState.expressComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/express\/id\/\d+$/.test(path) && method === 'GET') {
    const item = findById(communityState.expressItems, 'id', /^\/api\/express\/id\/(\d+)$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'expressNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess(buildExpressPayload(item, username, communityState.expressComments[item.id] || [])))
  }

  if (/^\/api\/express\/id\/\d+\/comment$/.test(path) && method === 'GET') {
    const expressId = Number(/^\/api\/express\/id\/(\d+)\/comment$/.exec(path)[1])
    return utils.resolveWithDelay(utils.buildSuccess((communityState.expressComments[expressId] || []).slice()))
  }

  if (/^\/api\/express\/id\/\d+\/comment$/.test(path) && method === 'POST') {
    const expressId = Number(/^\/api\/express\/id\/(\d+)\/comment$/.exec(path)[1])
    const item = findById(communityState.expressItems, 'id', expressId)
    const comment = String(data.comment || '').trim()
    if (!item || !comment) {
      return utils.rejectWithMessage(communityMessage(utils, 'commentEmpty'))
    }
    const list = communityState.expressComments[expressId] || []
    list.push(createComment(list, currentUserDisplayName(utils), comment))
    communityState.expressComments[expressId] = list
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/express\/id\/\d+\/like$/.test(path) && method === 'POST') {
    const item = findById(communityState.expressItems, 'id', /^\/api\/express\/id\/(\d+)\/like$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'expressNotFound'))
    }
    item.likedUsers = Array.isArray(item.likedUsers) ? item.likedUsers : []
    if (item.likedUsers.indexOf(username) === -1) {
      item.likedUsers.push(username)
      saveCommunityState(utils, communityState)
    }
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/express\/id\/\d+\/guess$/.test(path) && method === 'POST') {
    const item = findById(communityState.expressItems, 'id', /^\/api\/express\/id\/(\d+)\/guess$/.exec(path)[1])
    const guessedName = String(data.name || '').trim().toLowerCase()
    if (!item || !item.realname) {
      return utils.rejectWithMessage(communityMessage(utils, 'expressGuessUnsupported'))
    }
    item.guessSum = Number(item.guessSum || 0) + 1
    const correct = String(item.realname || '').trim().toLowerCase() === guessedName
    if (correct) {
      item.guessCount = Number(item.guessCount || 0) + 1
    }
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(correct))
  }

  if (path === '/api/express' && method === 'POST') {
    const nextItem = {
      id: nextId(communityState.expressItems, 'id', 400),
      nickname: String(data.nickname || '').trim(),
      realname: String(data.realname || '').trim(),
      selfGender: Number(data.selfGender || 0),
      name: String(data.name || '').trim(),
      personGender: Number(data.personGender || 0),
      content: String(data.content || '').trim(),
      publishTime: nowText(),
      owner: username,
      likedUsers: [],
      guessSum: 0,
      guessCount: 0
    }
    if (!nextItem.nickname || !nextItem.name || !nextItem.content) {
      return utils.rejectWithMessage(communityMessage(utils, 'expressIncomplete'))
    }
    communityState.expressItems.unshift(nextItem)
    communityState.expressComments[nextItem.id] = []
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleTopic(path, method, data, token, utils) {
  if (!/^\/api\/topic(\/|$)/.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/topic\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/topic\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    return utils.resolveWithDelay(utils.buildSuccess(communityState.topics.slice(start, start + size).map(function(item) {
      return buildTopicPayload(item, username)
    })))
  }

  if (/^\/api\/topic\/keyword\/.+\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/topic\/keyword\/(.+)\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const keyword = decodeURIComponent(matched[1]).toLowerCase()
    const start = Number(matched[2])
    const size = Number(matched[3])
    const list = communityState.topics.filter(function(item) {
      return String(item.topic).toLowerCase().indexOf(keyword) !== -1 ||
        String(item.content).toLowerCase().indexOf(keyword) !== -1
    }).slice(start, start + size).map(function(item) {
      return buildTopicPayload(item, username)
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/topic\/profile\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/topic\/profile\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    const list = communityState.topics.filter(function(item) {
      return item.owner === username
    }).slice(start, start + size).map(function(item) {
      return buildTopicPayload(item, username)
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/topic\/id\/\d+$/.test(path) && method === 'GET') {
    const item = findById(communityState.topics, 'id', /^\/api\/topic\/id\/(\d+)$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'topicNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess(buildTopicPayload(item, username)))
  }

  if (/^\/api\/topic\/id\/\d+\/like$/.test(path) && method === 'POST') {
    const item = findById(communityState.topics, 'id', /^\/api\/topic\/id\/(\d+)\/like$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'topicNotFound'))
    }
    item.likedUsers = Array.isArray(item.likedUsers) ? item.likedUsers : []
    if (item.likedUsers.indexOf(username) === -1) {
      item.likedUsers.push(username)
      saveCommunityState(utils, communityState)
    }
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (path === '/api/topic' && method === 'POST') {
    const imageUrls = Array.isArray(data.imageKeys) ? data.imageKeys : [data.imageKeys].filter(Boolean)
    const nextItem = {
      id: nextId(communityState.topics, 'id', 500),
      topic: String(data.topic || '').trim(),
      content: String(data.content || '').trim(),
      count: imageUrls.length,
      imageUrls: imageUrls,
      publishTime: nowText(),
      owner: username,
      likedUsers: []
    }
    if (!nextItem.topic || !nextItem.content) {
      return utils.rejectWithMessage(communityMessage(utils, 'topicIncomplete'))
    }
    communityState.topics.unshift(nextItem)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleDelivery(path, method, data, token, utils) {
  if (!/^\/api\/delivery\//.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/delivery\/order\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/delivery\/order\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    return utils.resolveWithDelay(utils.buildSuccess(communityState.deliveryOrders.slice(start, start + size)))
  }

  if (/^\/api\/delivery\/order\/id\/\d+$/.test(path) && method === 'GET') {
    const order = findById(communityState.deliveryOrders, 'orderId', /^\/api\/delivery\/order\/id\/(\d+)$/.exec(path)[1])
    if (!order) {
      return utils.rejectWithMessage(communityMessage(utils, 'deliveryNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess({
      order: order,
      detailType: getDeliveryDetailType(order, username),
      trade: order.tradeId ? {
        tradeId: order.tradeId,
        orderId: order.orderId,
        acceptor: order.acceptor,
        publisher: order.publisher
      } : null
    }))
  }

  if (path === '/api/delivery/mine' && method === 'GET') {
    return utils.resolveWithDelay(utils.buildSuccess({
      published: communityState.deliveryOrders.filter(function(item) {
        return item.publisher === username
      }),
      accepted: communityState.deliveryOrders.filter(function(item) {
        return item.acceptor === username
      })
    }))
  }

  if (path === '/api/delivery/acceptorder' && method === 'POST') {
    const order = findById(communityState.deliveryOrders, 'orderId', data.orderId)
    if (!order) {
      return utils.rejectWithMessage(communityMessage(utils, 'deliveryNotFound'))
    }
    if (order.publisher === username) {
      return utils.rejectWithMessage(communityMessage(utils, 'deliveryOwnOrder'))
    }
    if (Number(order.state) !== 0) {
      return utils.rejectWithMessage(communityMessage(utils, 'deliveryAccepted'))
    }
    order.state = 1
    order.acceptor = username
    order.tradeId = nextId(communityState.deliveryOrders, 'tradeId', 9000)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/delivery\/trade\/id\/\d+\/finishtrade$/.test(path) && method === 'POST') {
    const tradeId = Number(/^\/api\/delivery\/trade\/id\/(\d+)\/finishtrade$/.exec(path)[1])
    const order = communityState.deliveryOrders.filter(function(item) {
      return Number(item.tradeId) === tradeId
    })[0]
    if (!order) {
      return utils.rejectWithMessage(communityMessage(utils, 'tradeNotFound'))
    }
    if (order.publisher !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'deliveryFinishDenied'))
    }
    order.state = 2
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (path === '/api/delivery/order' && method === 'POST') {
    const nextOrder = {
      orderId: nextId(communityState.deliveryOrders, 'orderId', 600),
      name: String(data.name || getDeliveryDefaultOrderName(getCommunityLocale(utils))).trim(),
      number: String(data.number || '').trim(),
      phone: String(data.phone || '').trim(),
      price: Number(data.price || 0),
      company: String(data.company || '').trim(),
      address: String(data.address || '').trim(),
      remarks: String(data.remarks || '').trim(),
      orderTime: nowText(),
      state: 0,
      publisher: username,
      acceptor: '',
      tradeId: null
    }
    if (!nextOrder.phone || !nextOrder.company || !nextOrder.address || !(nextOrder.price > 0)) {
      return utils.rejectWithMessage(communityMessage(utils, 'deliveryIncomplete'))
    }
    communityState.deliveryOrders.unshift(nextOrder)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleDating(path, method, data, token, utils) {
  if (!/^\/api\/dating\//.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (/^\/api\/dating\/profile\/area\/\d+\/start\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/dating\/profile\/area\/(\d+)\/start\/(\d+)$/.exec(path)
    const area = Number(matched[1])
    const start = Number(matched[2])
    const list = communityState.datingProfiles.filter(function(item) {
      return Number(item.area) === area && Number(item.state) !== 0
    }).slice(start, start + 10)
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/dating\/profile\/id\/\d+$/.test(path) && method === 'GET') {
    const profile = findById(communityState.datingProfiles, 'profileId', /^\/api\/dating\/profile\/id\/(\d+)$/.exec(path)[1])
    if (!profile) {
      return utils.rejectWithMessage(communityMessage(utils, 'infoNotFound'))
    }
    const relatedPick = communityState.datingPicks.filter(function(item) {
      return Number(item.profileId) === Number(profile.profileId) && item.sender === username && Number(item.state) === 1
    })[0]
    return utils.resolveWithDelay(utils.buildSuccess({
      profile: profile,
      pictureURL: profile.pictureURL,
      isContactVisible: profile.owner === username || !!relatedPick,
      isPickNotAvailable: !!relatedPick
    }))
  }

  if (path === '/api/dating/profile/my' && method === 'GET') {
    return utils.resolveWithDelay(utils.buildSuccess(communityState.datingProfiles.filter(function(item) {
      return item.owner === username
    })))
  }

  if (path === '/api/dating/pick/my/sent' && method === 'GET') {
    return utils.resolveWithDelay(utils.buildSuccess(communityState.datingPicks.filter(function(item) {
      return item.sender === username
    }).map(function(item) {
      return buildRoommatePickPayload(item, communityState)
    })))
  }

  if (path === '/api/dating/pick/my/received' && method === 'GET') {
    return utils.resolveWithDelay(utils.buildSuccess(communityState.datingPicks.filter(function(item) {
      const profile = findById(communityState.datingProfiles, 'profileId', item.profileId)
      return profile && profile.owner === username
    }).map(function(item) {
      return buildRoommatePickPayload(item, communityState)
    })))
  }

  if (path === '/api/dating/profile' && method === 'POST') {
    const nextProfile = {
      profileId: nextId(communityState.datingProfiles, 'profileId', 700),
      nickname: String(data.nickname || '').trim(),
      grade: Number(data.grade || 1),
      faculty: String(data.faculty || '').trim(),
      hometown: String(data.hometown || '').trim(),
      content: String(data.content || '').trim(),
      qq: String(data.qq || '').trim(),
      wechat: String(data.wechat || '').trim(),
      area: Number(data.area || 0),
      pictureURL: String(data.imageKey || '/image/dating.png'),
      state: 1,
      createTime: nowText(),
      owner: username
    }
    if (!nextProfile.nickname || !nextProfile.faculty || !nextProfile.hometown || !nextProfile.content) {
      return utils.rejectWithMessage(communityMessage(utils, 'datingIncomplete'))
    }
    communityState.datingProfiles.unshift(nextProfile)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (path === '/api/dating/pick' && method === 'POST') {
    const profileId = Number(data.profileId || 0)
    const profile = findById(communityState.datingProfiles, 'profileId', profileId)
    if (!profile) {
      return utils.rejectWithMessage(communityMessage(utils, 'datingTargetNotFound'))
    }
    if (profile.owner === username) {
      return utils.rejectWithMessage(communityMessage(utils, 'datingSelfPick'))
    }
    const exists = communityState.datingPicks.filter(function(item) {
      return Number(item.profileId) === profileId && item.sender === username
    })[0]
    if (exists) {
      return utils.rejectWithMessage(communityMessage(utils, 'datingPickExists'))
    }
    communityState.datingPicks.unshift({
      pickId: nextId(communityState.datingPicks, 'pickId', 800),
      profileId: profileId,
      sender: username,
      content: String(data.content || '').trim(),
      state: 0,
      createTime: nowText()
    })
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/dating\/pick\/id\/\d+$/.test(path) && method === 'POST') {
    const pick = findById(communityState.datingPicks, 'pickId', /^\/api\/dating\/pick\/id\/(\d+)$/.exec(path)[1])
    if (!pick) {
      return utils.rejectWithMessage(communityMessage(utils, 'requestNotFound'))
    }
    const profile = findById(communityState.datingProfiles, 'profileId', pick.profileId)
    if (!profile || profile.owner !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'requestOperateDenied'))
    }
    pick.state = Number(data.state || -1)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/dating\/profile\/id\/\d+\/state$/.test(path) && method === 'POST') {
    const profile = findById(communityState.datingProfiles, 'profileId', /^\/api\/dating\/profile\/id\/(\d+)\/state$/.exec(path)[1])
    if (!profile || profile.owner !== username) {
      return utils.rejectWithMessage(communityMessage(utils, 'infoOperateDenied'))
    }
    profile.state = Number(data.state || 0)
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handlePhotograph(path, method, data, token, utils) {
  if (!/^\/api\/photograph(\/|$)/.test(path)) {
    return null
  }

  const authError = utils.ensureAuthorized(token)
  if (authError) {
    return authError
  }

  const communityState = ensureCommunityState(utils)
  const username = getCurrentUsername(utils)

  if (path === '/api/photograph/statistics/photos' && method === 'GET') {
    return utils.resolveWithDelay(utils.buildSuccess(communityState.photographs.length))
  }
  if (path === '/api/photograph/statistics/comments' && method === 'GET') {
    const commentCount = Object.keys(communityState.photographComments).reduce(function(total, key) {
      return total + (communityState.photographComments[key] || []).length
    }, 0)
    return utils.resolveWithDelay(utils.buildSuccess(commentCount))
  }
  if (path === '/api/photograph/statistics/likes' && method === 'GET') {
    const likeCount = communityState.photographs.reduce(function(total, item) {
      return total + (Array.isArray(item.likedUsers) ? item.likedUsers.length : 0)
    }, 0)
    return utils.resolveWithDelay(utils.buildSuccess(likeCount))
  }

  if (/^\/api\/photograph\/type\/\d+\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/photograph\/type\/(\d+)\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const type = Number(matched[1])
    const start = Number(matched[2])
    const size = Number(matched[3])
    const list = communityState.photographs.filter(function(item) {
      return Number(item.feedType) === type
    }).slice(start, start + size).map(function(item) {
      return buildPhotographPayload(item, username, communityState.photographComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (/^\/api\/photograph\/id\/\d+$/.test(path) && method === 'GET') {
    const item = findById(communityState.photographs, 'id', /^\/api\/photograph\/id\/(\d+)$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'photoNotFound'))
    }
    return utils.resolveWithDelay(utils.buildSuccess(buildPhotographPayload(item, username, communityState.photographComments[item.id] || [])))
  }

  if (/^\/api\/photograph\/id\/\d+\/comment$/.test(path) && method === 'GET') {
    const photoId = Number(/^\/api\/photograph\/id\/(\d+)\/comment$/.exec(path)[1])
    return utils.resolveWithDelay(utils.buildSuccess((communityState.photographComments[photoId] || []).slice()))
  }

  if (/^\/api\/photograph\/id\/\d+\/comment$/.test(path) && method === 'POST') {
    const photoId = Number(/^\/api\/photograph\/id\/(\d+)\/comment$/.exec(path)[1])
    const item = findById(communityState.photographs, 'id', photoId)
    const comment = String(data.comment || '').trim()
    if (!item || !comment) {
      return utils.rejectWithMessage(communityMessage(utils, 'commentEmpty'))
    }
    const list = communityState.photographComments[photoId] || []
    list.push(createComment(list, currentUserDisplayName(utils), comment))
    communityState.photographComments[photoId] = list
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/photograph\/profile\/start\/\d+\/size\/\d+$/.test(path) && method === 'GET') {
    const matched = /^\/api\/photograph\/profile\/start\/(\d+)\/size\/(\d+)$/.exec(path)
    const start = Number(matched[1])
    const size = Number(matched[2])
    const list = communityState.photographs.filter(function(item) {
      return item.owner === username
    }).slice(start, start + size).map(function(item) {
      return buildPhotographPayload(item, username, communityState.photographComments[item.id] || [])
    })
    return utils.resolveWithDelay(utils.buildSuccess(list))
  }

  if (path === '/api/photograph' && method === 'POST') {
    const imageUrls = Array.isArray(data.imageKeys) ? data.imageKeys : [data.imageKeys].filter(Boolean)
    const nextItem = {
      id: nextId(communityState.photographs, 'id', 900),
      title: String(data.title || '').trim(),
      content: String(data.content || '').trim(),
      type: Number(data.type || 1),
      feedType: Number(data.type || 1) === 2 ? 0 : 1,
      count: imageUrls.length,
      imageUrls: imageUrls,
      createTime: nowText(),
      owner: username,
      likedUsers: []
    }
    if (!nextItem.title || !nextItem.imageUrls.length) {
      return utils.rejectWithMessage(communityMessage(utils, 'photoUploadRequired'))
    }
    communityState.photographs.unshift(nextItem)
    communityState.photographComments[nextItem.id] = []
    saveCommunityState(utils, communityState)
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  if (/^\/api\/photograph\/id\/\d+\/like$/.test(path) && method === 'POST') {
    const item = findById(communityState.photographs, 'id', /^\/api\/photograph\/id\/(\d+)\/like$/.exec(path)[1])
    if (!item) {
      return utils.rejectWithMessage(communityMessage(utils, 'photoNotFound'))
    }
    item.likedUsers = Array.isArray(item.likedUsers) ? item.likedUsers : []
    if (item.likedUsers.indexOf(username) === -1) {
      item.likedUsers.push(username)
      saveCommunityState(utils, communityState)
    }
    return utils.resolveWithDelay(utils.buildSuccess(null))
  }

  return null
}

function handleRequest(options) {
  const requestOptions = options || {}
  const path = requestOptions.path || ''
  const method = String(requestOptions.method || 'GET').toUpperCase()
  const payload = Object.assign({}, requestOptions.payload || {}, requestOptions.query || {})
  const token = requestOptions.token || ''
  const utils = requestOptions.utils || {}

  return handleSecondhand(path, method, payload, token, utils) ||
    handleLostAndFound(path, method, payload, token, utils) ||
    handleSecret(path, method, payload, token, utils) ||
    handleExpress(path, method, payload, token, utils) ||
    handleTopic(path, method, payload, token, utils) ||
    handleDelivery(path, method, payload, token, utils) ||
    handleDating(path, method, payload, token, utils) ||
    handlePhotograph(path, method, payload, token, utils)
}

module.exports = {
  handleRequest
}
