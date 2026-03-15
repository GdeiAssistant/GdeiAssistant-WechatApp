const { getCommunityModule, getCommunityPageTitle } = require('../../constants/community.js')
const communityApi = require('../../services/apis/community.js')
const userApi = require('../../services/apis/user.js')
const pageUtils = require('../../utils/page.js')

function buildTabs(moduleId) {
  switch (moduleId) {
    case 'ershou':
      return [
        { key: 'doing', label: '正在出售' },
        { key: 'sold', label: '已下架' },
        { key: 'off', label: '已售出' }
      ]
    case 'lostandfound':
      return [
        { key: 'lost', label: '寻物信息' },
        { key: 'found', label: '招领信息' },
        { key: 'didfound', label: '已寻回' }
      ]
    case 'delivery':
      return [
        { key: 'published', label: '我发布的' },
        { key: 'accepted', label: '我接的单' }
      ]
    case 'dating':
      return [
        { key: 'received', label: '收到的撩' },
        { key: 'sent', label: '我发出的' },
        { key: 'posts', label: '我的发布' }
      ]
    default:
      return []
  }
}

function normalizeStandardItem(item, options) {
  const config = options || {}
  return {
    id: config.id,
    title: config.title || '未命名内容',
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
    return baseText ? `${baseText} · 24 小时后自动删除` : '24 小时后自动删除'
  }
  return baseText
}

Page({
  data: {
    moduleId: '',
    moduleConfig: null,
    tabs: [],
    activeTabKey: '',
    itemsByTab: {},
    activeItems: [],
    summaryProfile: null,
    hasShownOnce: false,
    loading: true,
    errorMessage: null
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
                { id: 'edit', label: '编辑' },
                { id: 'state:0', label: '下架' },
                { id: 'state:2', label: '售出' }
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
              actions: [
                { id: 'edit', label: '编辑' },
                { id: 'state:1', label: '重新上架' }
              ],
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
              actions: [],
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
                { id: 'edit', label: '编辑' },
                { id: 'didfound', label: '确认寻回' }
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
                { id: 'edit', label: '编辑' },
                { id: 'didfound', label: '确认寻回' }
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
              title: Number(item.type) === 1 ? '语音树洞' : '文字树洞',
              subtitle: formatSecretPublishText(item.publishTime, item.timer),
              summary: Number(item.type) === 1 ? '点击查看详情播放语音' : item.content,
              actions: []
            })
          })
        }
      case 'express':
        return {
          default: (payload || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: `${item.nickname || '匿名同学'} -> ${item.name || 'TA'}`,
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
              title: `#${item.topic || '校园话题'}`,
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
              title: item.company || '全民快递',
              subtitle: item.orderTime,
              summary: item.address,
              priceText: Number(item.price || 0).toFixed(2),
              actions: []
            })
          }),
          accepted: (payload.accepted || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.orderId,
              title: item.company || '全民快递',
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
              title: profile.nickname || item.username || '匿名同学',
              subtitle: item.createTime || '',
              summary: item.content || '',
              cover: profile.pictureURL || '/image/dating.png',
              status: Number(item.state || 0),
              actions: Number(item.state || 0) === 0 ? [
                { id: 'acceptPick', label: '同意' },
                { id: 'rejectPick', label: '拒绝' }
              ] : []
            }
          }),
          sent: (payload.sent || []).map(function(item) {
            const profile = item.roommateProfile || {}
            return {
              id: item.pickId,
              title: profile.nickname || '匿名同学',
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
              title: item.nickname || '卖室友',
              subtitle: item.createTime || '',
              summary: item.content || '',
              cover: item.pictureURL || '/image/dating.png',
              status: Number(item.state || 0),
              actions: [
                { id: 'hideProfile', label: '隐藏' }
              ]
            }
          })
        }
      case 'photograph':
        return {
          default: (payload || []).map(function(item) {
            return normalizeStandardItem(item, {
              id: item.id,
              title: item.title || '作品',
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
          nickname: profile.nickname || profile.username || '我',
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
        pageUtils.showTopTips(this, result.message || '加载失败')
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
      url: `/pages/communityDetail/communityDetail?module=${this.data.moduleId}&id=${itemId}`
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
        url: `/pages/communityPublish/communityPublish?module=${this.data.moduleId}&mode=edit&id=${itemId}`
      })
      return
    }

    if (action.indexOf('state:') === 0) {
      const state = Number(action.split(':')[1])
      communityApi.updateSecondhandState(itemId, state).then((result) => {
        if (!result.success) {
          pageUtils.showTopTips(this, result.message || '操作失败')
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
          pageUtils.showTopTips(this, result.message || '操作失败')
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
          pageUtils.showTopTips(this, result.message || '操作失败')
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
          pageUtils.showTopTips(this, result.message || '操作失败')
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
      url: `/pages/communityPublish/communityPublish?module=${this.data.moduleId}`
    })
  },

  onLoad: function(options) {
    const moduleId = options && options.module ? options.module : ''
    const moduleConfig = getCommunityModule(moduleId)
    if (!moduleConfig) {
      wx.showModal({
        title: '提示',
        content: '未识别的社区模块',
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
    this.loadCenter()
  },

  onShow: function() {
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
      title: this.data.moduleConfig ? this.data.moduleConfig.title : '校园社区',
      path: `/pages/communityCenter/communityCenter?module=${this.data.moduleId}`
    }
  }
})
