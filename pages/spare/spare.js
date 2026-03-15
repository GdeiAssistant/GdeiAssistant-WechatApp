const {
  SPARE_TIME_RANGE_MAP,
  SPARE_CAMPUS_OPTIONS,
  SPARE_ROOM_TYPE_OPTIONS,
  SPARE_WEEKDAY_OPTIONS,
  SPARE_WEEK_TYPE_OPTIONS,
  SPARE_CLASS_PERIOD_OPTIONS
} = require('../../constants/spare.js')
const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')

Page({
  data: {
    campusOptions: SPARE_CAMPUS_OPTIONS,
    roomTypeOptions: SPARE_ROOM_TYPE_OPTIONS,
    weekDayOptions: SPARE_WEEKDAY_OPTIONS,
    weekTypeOptions: SPARE_WEEK_TYPE_OPTIONS,
    classPeriodOptions: SPARE_CLASS_PERIOD_OPTIONS,
    campusIndex: 0,
    roomTypeIndex: 0,
    weekDayIndex: 0,
    weekTypeIndex: 0,
    classPeriodIndex: 0,
    minSeating: '',
    maxSeating: '',
    result: null,
    loading: false,
    errorMessage: null
  },

  handlePickerChange: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [field]: Number(event.detail.value)
    })
  },

  setFieldValue: function(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [field]: event.detail.value
    })
  },

  buildQueryPayload: function() {
    const classNumber = this.data.classPeriodOptions[this.data.classPeriodIndex].value
    const timeRange = SPARE_TIME_RANGE_MAP[classNumber] || [1, 2]
    const weekDayValue = this.data.weekDayOptions[this.data.weekDayIndex].value
    const minSeating = String(this.data.minSeating || '').trim()
    const maxSeating = String(this.data.maxSeating || '').trim()

    const payload = {
      zone: this.data.campusOptions[this.data.campusIndex].value,
      type: this.data.roomTypeOptions[this.data.roomTypeIndex].value,
      startTime: timeRange[0],
      endTime: timeRange[1],
      minWeek: weekDayValue === -1 ? 0 : weekDayValue,
      maxWeek: weekDayValue === -1 ? 6 : weekDayValue,
      weekType: this.data.weekTypeOptions[this.data.weekTypeIndex].value,
      classNumber: classNumber
    }

    if (minSeating) {
      payload.minSeating = Number(minSeating)
    }

    if (maxSeating) {
      payload.maxSeating = Number(maxSeating)
    }

    return payload
  },

  submitQuery: function() {
    const payload = this.buildQueryPayload()

    if (payload.minSeating && payload.maxSeating && payload.minSeating > payload.maxSeating) {
      pageUtils.showTopTips(this, '最少座位数不能大于最多座位数')
      return
    }

    pageUtils.runWithNavigationLoading(this, () => {
      return infoApi.querySpareRoom(payload)
    }).then((result) => {
      if (result.success) {
        this.setData({
          result: Array.isArray(result.data) ? result.data : []
        })
      } else {
        pageUtils.showTopTips(this, result.message)
      }
    }).catch((error) => {
      pageUtils.showTopTips(this, error.message)
    })
  },

  resetQuery: function() {
    this.setData({
      result: null
    })
  },

  onShareAppMessage: function() {
    return {
      title: '空教室',
      path: '/pages/spare/spare'
    }
  }
})
