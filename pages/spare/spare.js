const {
  SPARE_TIME_RANGE_MAP,
  getSpareCampusOptions,
  getSpareRoomTypeOptions,
  getSpareWeekdayOptions,
  getSpareWeekTypeOptions,
  getSpareClassPeriodOptions
} = require('../../constants/spare.js')
const infoApi = require('../../services/apis/info.js')
const pageUtils = require('../../utils/page.js')
var themeUtil = require('../../utils/theme')
const i18n = require('../../utils/i18n.js')

Page({
  onShow: function () {
    themeUtil.applyTheme(this)
    this.refreshI18n()
  },
  data: {
    t: {},
    themeClass: '',
    campusOptions: [],
    roomTypeOptions: [],
    weekDayOptions: [],
    weekTypeOptions: [],
    classPeriodOptions: [],
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
      pageUtils.showTopTips(this, this.data.t.seatingError)
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
      title: this.data.t.shareTitle,
      path: '/pages/spare/spare'
    }
  },

  refreshI18n: function() {
    this.setData({
      t: {
        navTitle: i18n.t('sparePage.navTitle'),
        queryConditions: i18n.t('sparePage.queryConditions'),
        campus: i18n.t('sparePage.campus'),
        roomType: i18n.t('sparePage.roomType'),
        weekDay: i18n.t('sparePage.weekDay'),
        weekType: i18n.t('sparePage.weekType'),
        classPeriod: i18n.t('sparePage.classPeriod'),
        minSeating: i18n.t('sparePage.minSeating'),
        maxSeating: i18n.t('sparePage.maxSeating'),
        optional: i18n.t('sparePage.optional'),
        search: i18n.t('sparePage.search'),
        queryResult: i18n.t('sparePage.queryResult'),
        noResult: i18n.t('sparePage.noResult'),
        roomNumber: i18n.t('sparePage.roomNumber'),
        roomTypeLabel: i18n.t('sparePage.roomTypeLabel'),
        campusLabel: i18n.t('sparePage.campusLabel'),
        sectionLabel: i18n.t('sparePage.sectionLabel'),
        classCapacity: i18n.t('sparePage.classCapacity'),
        examCapacity: i18n.t('sparePage.examCapacity'),
        reSearch: i18n.t('sparePage.reSearch'),
        seatingError: i18n.t('sparePage.seatingError'),
        shareTitle: i18n.t('sparePage.shareTitle')
      },
      campusOptions: getSpareCampusOptions(),
      roomTypeOptions: getSpareRoomTypeOptions(),
      weekDayOptions: getSpareWeekdayOptions(),
      weekTypeOptions: getSpareWeekTypeOptions(),
      classPeriodOptions: getSpareClassPeriodOptions()
    })
    wx.setNavigationBarTitle({ title: this.data.t.navTitle })
  }
})
