const SPARE_TIME_RANGE_MAP = [
  [1, 2],
  [3, 3],
  [4, 5],
  [6, 7],
  [8, 9],
  [10, 12],
  [1, 4],
  [6, 9],
  [10, 12],
  [1, 9],
  [1, 12]
]

const SPARE_CAMPUS_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '海珠校区', value: 1 },
  { label: '花都校区', value: 2 },
  { label: '广东轻工南海校区', value: 3 },
  { label: '业余函授校区', value: 4 }
]

const SPARE_ROOM_TYPE_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '不用课室的课程', value: 1 },
  { label: '操场', value: 2 },
  { label: '大多媒体', value: 3 },
  { label: '电脑专业机房', value: 4 },
  { label: '雕塑室', value: 5 },
  { label: '多媒体教室', value: 6 },
  { label: '翻译室', value: 7 },
  { label: '服装实验室', value: 8 },
  { label: '钢琴室', value: 9 },
  { label: '钢琴室', value: 10 },
  { label: '公共机房', value: 11 },
  { label: '国画临摹室', value: 12 },
  { label: '画室', value: 13 },
  { label: '化学实验室', value: 14 },
  { label: '机房', value: 15 },
  { label: '教具室', value: 16 },
  { label: '教育实验室', value: 17 },
  { label: '解剖实验室', value: 18 },
  { label: '金融数学实验室', value: 19 },
  { label: '美术课室', value: 20 },
  { label: '蒙氏教学法专用课室', value: 21 },
  { label: '模型制作实验室', value: 22 },
  { label: '平面制作实验室', value: 23 },
  { label: '琴房', value: 24 },
  { label: '摄影实验室', value: 25 },
  { label: '声乐课室', value: 26 },
  { label: '生物实验室', value: 27 },
  { label: '实训室', value: 28 },
  { label: '视唱练耳室', value: 29 },
  { label: '陶艺室', value: 30 },
  { label: '体操房', value: 31 },
  { label: '网络实验室', value: 32 },
  { label: '微格课室', value: 33 },
  { label: '无须课室', value: 34 },
  { label: '舞蹈室', value: 35 },
  { label: '舞蹈室', value: 36 },
  { label: '物理实验室', value: 37 },
  { label: '小多媒体', value: 38 },
  { label: '小多媒体(<70)', value: 39 },
  { label: '小普通课室(<70)', value: 40 },
  { label: '小组课室', value: 41 },
  { label: '形体房', value: 42 },
  { label: '音乐室', value: 43 },
  { label: '音乐专业课室', value: 44 },
  { label: '语音室', value: 45 },
  { label: '智能录像室', value: 46 },
  { label: '中多媒体(70-100)', value: 47 },
  { label: '专业课教室', value: 48 },
  { label: '专业理论课室', value: 49 },
  { label: '专业实验室', value: 50 },
  { label: '咨询室', value: 51 },
  { label: '综合绘画实验室', value: 52 }
]

const SPARE_WEEKDAY_OPTIONS = [
  { label: '不限', value: -1 },
  { label: '周一', value: 0 },
  { label: '周二', value: 1 },
  { label: '周三', value: 2 },
  { label: '周四', value: 3 },
  { label: '周五', value: 4 },
  { label: '周六', value: 5 },
  { label: '周日', value: 6 }
]

const SPARE_WEEK_TYPE_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '单周', value: 1 },
  { label: '双周', value: 2 }
]

const SPARE_CLASS_PERIOD_OPTIONS = [
  { label: '第 1-2 节', value: 0 },
  { label: '第 3 节', value: 1 },
  { label: '第 4-5 节', value: 2 },
  { label: '第 6-7 节', value: 3 },
  { label: '第 8-9 节', value: 4 },
  { label: '第 10-12 节', value: 5 },
  { label: '上午', value: 6 },
  { label: '下午', value: 7 },
  { label: '晚上', value: 8 },
  { label: '白天', value: 9 },
  { label: '整天', value: 10 }
]

module.exports = {
  SPARE_TIME_RANGE_MAP,
  SPARE_CAMPUS_OPTIONS,
  SPARE_ROOM_TYPE_OPTIONS,
  SPARE_WEEKDAY_OPTIONS,
  SPARE_WEEK_TYPE_OPTIONS,
  SPARE_CLASS_PERIOD_OPTIONS
}
