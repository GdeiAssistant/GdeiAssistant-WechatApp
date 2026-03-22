const { getCommunityModule, getCommunityPageTitle } = require('../../constants/community.js')
const communityApi = require('../../services/apis/community.js')
const userApi = require('../../services/apis/user.js')
const pageUtils = require('../../utils/page.js')
const i18n = require('../../utils/i18n.js')
var themeUtil = require('../../utils/theme')

function buildTabs(moduleId) {
  switch (moduleId) {
    case 'ershou':
      return [
        { key: 'doing', label: i18n.t('community.center.tabSelling') },
        { key: 'sold', label: i18n.t('community.center.tabSold') },
        { key: 'off', label: i18n.t('community.center.tabOffShelf') }
      ]
    case 'lostandfound':
      return [
        { key: 'lost', label: i18n.t('community.center.tabLost') },
        { key: 'found', label: i18n.t('community.center.tabFound') },
        { key: 'didfound', label: i18n.t('community.center.tabRecovered') }
      ]
    case 'delivery':
      return [
        { key: 'published', label: i18n.t('community.center.tabMyPublished') },
        { key: 'accepted', label: i18n.t('community.center.tabMyAccepted') }
      ]
    case 'dating':
      return [
        { key: 'received', label: i18n.t('community.center.tabReceivedPick') },
        { key: 'sent', label: i18n.t('community.center.tabSentPick') },
        { key: 'posts', label: i18n.t('community.center.tabMyPosts') }
      ]
    default:
      return []
  }
}

function normalizeStandardItem(item, options) {
  const config = options || {}
  return {
    id: config.id,
    title: config.title || i18n.t('community.list.unnamedContent'),
    subtitle: config.subtitle || '',
    summary: config.summary || '',
    cover: config.cover || '',
    priceText: config.priceText || '',
    actions: config.actions || [],
    canOpenDetail: config.canOpenDetail !== false
  }
}

function formatSecretPublishText(publishTime, timer) {
  const baseText = String(publishTime || '').trim()
  if (Number(timer) === 1) {
    var autoDeleteText = i18n.t('community.list.autoDelete24h')
    return baseText ? baseText + ' \u00b7 ' + autoDeleteText : autoDeleteText
  }
  return baseText
}

Page({
  data: {
    themeClass: '',
    moduleId: '',
    moduleConfig: null,
    tabs: [],
    activeTabKey: '',
    itemsByTab: {},
    activeItems: [],
    summaryProfile: null,
    hasShownOnce: false,
    loading: true,
    errorMessage: null,
    t: {}
  },

  setActiveTab: function(tabKey) {
    const itemsByTab = this.data.itemsByTab || {}
    this.setData({
      activeTabKey: tabKey,
      activeItems: itemsByTab[tabKey] || []
    })
  },

  normalizeCenterData: function(moduleId, payload) {
    switch (moduleId) {
      case 'ershou':
        return {
          doing: (payload.doing || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.name,
              subtitle: item.publishTime,
              summary: item.location,
              cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/ershou.png',
              priceText: Number(item.price || 0).toFixed(2),
              actions: [
                { id: 'edit', label: i18n.t('community.center.actionEdit') },
                { id: 'state:0', label: i18n.t('community.center.actionOffShelf') },
                { id: 'state:2', label: i18n.t('community.center.actionSold') }
              ]
            })
          }),
          sold: (payload.sold || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.name,
              subtitle: item.publishTime,
              summary: item.location,
              cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/ershou.png',
              priceText: Number(item.price || 0).toFixed(2),
              actions: [],
              canOpenDetail: false
            })
          }),
          off: (payload.off || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.name,
              subtitle: item.publishTime,
              summary: item.location,
              cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/ershou.png',
              priceText: Number(item.price || 0).toFixed(2),
              actions: [
                { id: 'edit', label: i18n.t('community.center.actionEdit') },
                { id: 'state:1', label: i18n.t('community.center.actionRelist') }
              ],
              canOpenDetail: false
            })
          })
        }
      case 'lostandfound':
        return {
          lost: (payload.lost || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.name,
              subtitle: item.publishTime,
              summary: item.location,
              cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/lostandfound.png',
              actions: [
                { id: 'edit', label: i18n.t('community.center.actionEdit') },
                { id: 'didfound', label: i18n.t('community.center.actionConfirmFound') }
              ]
            })
          }),
          found: (payload.found || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.name,
              subtitle: item.publishTime,
              summary: item.location,
              cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/lostandfound.png',
              actions: [
                { id: 'edit', label: i18n.t('community.center.actionEdit') },
                { id: 'didfound', label: i18n.t('community.center.actionConfirmFound') }
              ]
            })
          }),
          didfound: (payload.didfound || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.name,
              subtitle: item.publishTime,
              summary: item.location,
              cover: item.pictureURL && item.pictureURL.length ? item.pictureURL[0] : '/image/lostandfound.png',
              actions: [],
              canOpenDetail: false
            })
          })
        }
      case 'secret':
        return {
          default: (payload || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: Number(item.type) === 1 ? i18n.t('community.center.voiceSecret') : i18n.t('community.center.textSecret'),
              subtitle: formatSecretPublishText(item.publishTime, item.timer),
              summary: Number(item.type) === 1 ? i18n.t('community.center.tapPlayVoice') : item.content,
              actions: []
            })
          })
        }
      case 'express':
        return {
          default: (payload || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: (item.nickname || i18n.t('community.list.anonStudent')) + ' -> ' + (item.name || 'TA'),
              subtitle: item.publishTime,
              summary: item.content,
              actions: []
            })
          })
        }
      case 'topic':
        return {
          default: (payload || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: '#' + (item.topic || i18n.t('community.list.campusTopic')),
              subtitle: item.publishTime,
              summary: item.content,
              cover: item.imageUrls && item.imageUrls.length ? item.imageUrls[0] : '',
              actions: []
            })
          })
        }
      case 'delivery':
        return {
          published: (payload.published || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.orderId,
              title: item.company || i18n.t('community.modules.delivery.title'),
              subtitle: item.orderTime,
              summary: item.address,
              priceText: Number(item.price || 0).toFixed(2),
              actions: []
            })
          }),
          accepted: (payload.accepted || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.orderId,
              title: item.company || i18n.t('community.modules.delivery.title'),
              subtitle: item.orderTime,
              summary: item.address,
              priceText: Number(item.price || 0).toFixed(2),
              actions: []
            })
          })
        }
      case 'dating':
        return {
          received: (payload.received || []).map(function(item) {
            const profile = item.roommateProfile || {}
            return {
              id: item.pickId,
              title: profile.nickname || item.username || i18n.t('community.list.anonStudent'),
              subtitle: item.createTime || '',
              summary: item.content || '',
              cover: profile.pictureURL || '/image/dating.png',
              status: Number(item.state || 0),
              actions: Number(item.state || 0) === 0 ? [
                { id: 'acceptPick', label: i18n.t('community.center.actionAccept') },
                { id: 'rejectPick', label: i18n.t('community.center.actionReject') }
              ] : []
            }
          }),
          sent: (payload.sent || []).map(function(item) {
            const profile = item.roommateProfile || {}
            return {
              id: item.pickId,
              title: profile.nickname || i18n.t('community.list.anonStudent'),
              subtitle: item.createTime || '',
              summary: item.content || '',
              cover: profile.pictureURL || '/image/dating.png',
              status: Number(item.state || 0),
              qq: Number(item.state || 0) === 1 ? (profile.qq || '') : '',
              wechat: Number(item.state || 0) === 1 ? (profile.wechat || '') : '',
              actions: []
            }
          }),
          posts: (payload.profiles || []).map(function(item) {
            return {
              id: item.profileId,
              title: item.nickname || i18n.t('community.modules.dating.title'),
              subtitle: item.createTime || '',
              summary: item.content || '',
              cover: item.pictureURL || '/image/dating.png',
              status: Number(item.state || 0),
              actions: [
                { id: 'hideProfile', label: i18n.t('community.center.actionHide') }
              ]
            }
          })
        }
      case 'photograph':
        return {
          default: (payload || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.title || i18n.t('community.list.campusWork'),
              subtitle: item.createTime || '',
              summary: item.content || '',
              cover: item.firstImageUrl || (item.imageUrls && item.imageUrls.length ? item.imageUrls[0] : '/image/photograph.png'),
              actions: []
            })
          })
        }
      default:
        return {
          default: []
        }
    }
  },

  loadSummaryProfile: function() {
    if (['ershou', 'lostandfound'].indexOf(this.data.moduleId) === -1) {
      this.setData({
        summaryProfile: null
      })
      return Promise.resolve()
    }

    return userApi.getProfile().then((result) => {
      if (!result.success) {
        return
      }

      const profile = result.data || {}
      this.setData({
        summaryProfile: {
          avatar: profile.avatar || '/image/default.png',
          nickname: profile.nickname || profile.username || i18n.t('community.center.me'),
          introduction: profile.introduction || ''
        }
      })
    }).catch(() => {})
  },

  loadCenter: function() {
    return pageUtils.runWithNavigationLoading(this, () => {
      return Promise.all([
        communityApi.getCenter(this.data.moduleId),
        this.loadSummaryProfile()
      ])
    }).then((resultList) => {
      const result = resultList[0]
      if (!result.success) {
        pageUtils.showTopTips(this, result.message || i18n.t('common.loadFailed'))
        return
      }

      const itemsByTab = this.normalizeCenterData(this.data.moduleId, result.data || [])
      const defaultTab = this.data.tabs.length ? this.data.tabs[0].key : 'default'
      this.setData({
        itemsByTab: itemsByTab,
        loading: false
      })
      this.setActiveTab(this.data.activeTabKey || defaultTab)
    }).catch((error) => {
      this.setData({
        loading: false
      })
      pageUtils.showTopTips(this, error.message)
    })
  },

  switchTab: function(event) {
    const nextTabKey = event.currentTarget.dataset.key
    this.setActiveTab(nextTabKey)
  },

  openDetail: function(event) {
    const itemId = event.currentTarget.dataset.id
    const itemIndex = Number(event.currentTarget.dataset.index)
    const item = this.data.activeItems[itemIndex]
    if (!itemId) {
      return
    }

    if (item && item.canOpenDetail === false) {
      return
    }

    wx.navigateTo({
      url: '/pages/communityDetail/communityDetail?module=' + this.data.moduleId + '&id=' + itemId
    })
  },

  handleAction: function(event) {
    const action = event.currentTarget.dataset.action
    const itemId = event.currentTarget.dataset.id

    if (!action || !itemId) {
      return
    }

    if (action === 'edit') {
      wx.navigateTo({
        url: '/pages/communityPublish/communityPublish?module=' + this.data.moduleId + '&mode=edit&id=' + itemId
      })
      return
    }

    if (action.indexOf('state:') === 0) {
      const state = Number(action.split(':')[1])
      communityApi.updateSecondhandState(itemId, state).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
      return
    }

    if (action === 'didfound') {
      communityApi.markLostAndFoundDone(itemId).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
      return
    }

    if (action === 'acceptPick' || action === 'rejectPick') {
      communityApi.updateDatingPickState(itemId, action === 'acceptPick' ? 1 : -1).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
      return
    }

    if (action === 'hideProfile') {
      communityApi.updateDatingProfileState(itemId, 0).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || i18n.t('community.common.operationFailed'))
          return
        }
        this.loadCenter()
      }).catch((error) => {
        pageUtils.showTopTips(this, error.message)
      })
    }
  },

  openPublish: function() {
    wx.navigateTo({
      url: '/pages/communityPublish/communityPublish?module=' + this.data.moduleId
    })
  },

  refreshI18n: function() {
    var moduleConfig = this.data.moduleId ? getCommunityModule(this.data.moduleId) : this.data.moduleConfig
    var tabs = this.data.moduleId ? buildTabs(this.data.moduleId) : this.data.tabs

    var tData = {
      loading: i18n.t('community.list.loading'),
      emptyTitle: i18n.t('community.list.emptyTitle'),
      emptySummaryCenter: i18n.t('community.center.emptySummary'),
      continuePublish: i18n.t('community.center.continuePublish'),
      contactQQ: i18n.t('community.center.contactQQ'),
      contactWechat: i18n.t('community.center.contactWechat'),
      contactPending: i18n.t('community.center.contactPending')
    }

    this.setData({
      moduleConfig: moduleConfig,
      tabs: tabs,
      t: tData
    })

    if (moduleConfig) {
      wx.setNavigationBarTitle({
        title: getCommunityPageTitle(this.data.moduleId, 'center', moduleConfig.title)
      })
    }
  },

  onLoad: function(options) {
    const moduleId = options && options.module ? options.module : ''
    const moduleConfig = getCommunityModule(moduleId)
    if (!moduleConfig) {
      wx.showModal({
        title: i18n.t('community.common.notice'),
        content: i18n.t('community.common.unknownModule'),
        showCancel: false
      })
      return
    }

    const tabs = buildTabs(moduleId)
    const requestedTabKey = options && options.tab ? String(options.tab) : ''
    const initialTabKey = tabs.filter(function(tab) {
      return tab.key === requestedTabKey
    })[0] ? requestedTabKey : (tabs.length ? tabs[0].key : 'default')

    wx.setNavigationBarTitle({
      title: getCommunityPageTitle(moduleId, 'center', moduleConfig.title)
    })

    this.setData({
      moduleId: moduleId,
      moduleConfig: moduleConfig,
      tabs: tabs,
      activeTabKey: initialTabKey
    })
    this.refreshI18n()
    this.loadCenter()
  },

  onShow: function() {
    themeUtil.applyTheme(this)
    this.refreshI18n()
    if (!this.data.hasShownOnce) {
      this.setData({
        hasShownOnce: true
      })
      return
    }

    if (this.data.moduleId) {
      this.loadCenter()
    }
  },

  onShareAppMessage: function() {
    return {
      title: this.data.moduleConfig ? this.data.moduleConfig.title : i18n.t('community.common.campusCommunity'),
      path: '/pages/communityCenter/communityCenter?module=' + this.data.moduleId
    }
  }
})
