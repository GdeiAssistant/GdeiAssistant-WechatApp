module.exports = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    validate: '/api/auth/validate'
  },
  user: {
    avatar: '/api/profile/avatar',
    profile: '/api/user/profile',
    introduction: '/api/introduction',
    birthday: '/api/profile/birthday',
    faculty: '/api/profile/faculty',
    location: '/api/profile/location',
    hometown: '/api/profile/hometown',
    major: '/api/profile/major',
    enrollment: '/api/profile/enrollment',
    nickname: '/api/profile/nickname',
    locations: '/api/profile/locations',
    options: '/api/profile/options'
  },
  cet: {
    number: '/api/cet/number',
    query: '/api/cet/query',
    checkcode: '/api/cet/checkcode'
  },
  campus: {
    grade: '/api/grade',
    schedule: '/api/schedule',
    cardInfo: '/api/card/info',
    cardBill: '/api/card/query',
    evaluate: '/api/evaluate/submit',
    cardLost: '/api/card/lost'
  },
  library: {
    borrow: '/api/library/borrow',
    renew: '/api/library/renew',
    search: '/api/library/search',
    detail: '/api/library/detail'
  },
  data: {
    electricFees: '/api/data/electricfees',
    yellowPage: '/api/data/yellowpage'
  },
  info: {
    graduateExam: '/api/graduate-exam/query',
    spareRoom: '/api/spare/query',
    news: function (type, start, size) {
      return `/api/information/news/type/${type}/start/${start}/size/${size}`
    },
    newsDetail: function (id) {
      return `/api/information/news/id/${id}`
    }
  },
  messages: {
    announcements: function (start, size) {
      return `/api/information/announcement/start/${start}/size/${size}`
    },
    announcementDetail: function (id) {
      return `/api/information/announcement/id/${id}`
    },
    interactionList: function (start, size) {
      return `/api/information/message/interaction/start/${start}/size/${size}`
    },
    unreadCount: '/api/information/message/unread',
    markRead: function (id) {
      return `/api/information/message/id/${id}/read`
    },
    markAllRead: '/api/information/message/readall'
  },
  module: {
    stateDetail: '/api/module/state/detail'
  },
  upload: {
    presignedUrl: '/api/upload/presignedUrl'
  },
  community: {
    secondhand: {
      list: function (start) {
        return `/api/ershou/item/start/${start}`
      },
      keyword: function (keyword, start) {
        return `/api/ershou/keyword/${keyword}/start/${start}`
      },
      type: function (type, start) {
        return `/api/ershou/item/type/${type}/start/${start}`
      },
      detail: function (id) {
        return `/api/ershou/item/id/${id}`
      },
      update: function (id) {
        return `/api/ershou/item/id/${id}`
      },
      publish: '/api/ershou/item',
      profile: '/api/ershou/profile',
      state: function (id) {
        return `/api/ershou/item/state/id/${id}`
      }
    },
    lostAndFound: {
      lost: function (start) {
        return `/api/lostandfound/lostitem/start/${start}`
      },
      found: function (start) {
        return `/api/lostandfound/founditem/start/${start}`
      },
      search: function (type, start) {
        return `/api/lostandfound/lostitem/type/${type}/start/${start}`
      },
      detail: function (id) {
        return `/api/lostandfound/item/id/${id}`
      },
      update: function (id) {
        return `/api/lostandfound/item/id/${id}`
      },
      publish: '/api/lostandfound/item',
      profile: '/api/lostandfound/profile',
      didFound: function (id) {
        return `/api/lostandfound/item/id/${id}/didfound`
      }
    },
    secret: {
      list: function (start, size) {
        return `/api/secret/info/start/${start}/size/${size}`
      },
      detail: function (id) {
        return `/api/secret/id/${id}`
      },
      comments: function (id) {
        return `/api/secret/id/${id}/comments`
      },
      comment: function (id) {
        return `/api/secret/id/${id}/comment`
      },
      like: function (id) {
        return `/api/secret/id/${id}/like`
      },
      publish: '/api/secret/info',
      profile: '/api/secret/profile',
      profilePaged: function (start, size) {
        return `/api/secret/profile/start/${start}/size/${size}`
      }
    },
    express: {
      list: function (start, size) {
        return `/api/express/start/${start}/size/${size}`
      },
      keyword: function (keyword, start, size) {
        return `/api/express/keyword/${keyword}/start/${start}/size/${size}`
      },
      detail: function (id) {
        return `/api/express/id/${id}`
      },
      comments: function (id) {
        return `/api/express/id/${id}/comment`
      },
      comment: function (id) {
        return `/api/express/id/${id}/comment`
      },
      like: function (id) {
        return `/api/express/id/${id}/like`
      },
      guess: function (id) {
        return `/api/express/id/${id}/guess`
      },
      publish: '/api/express',
      profile: function (start, size) {
        return `/api/express/profile/start/${start}/size/${size}`
      }
    },
    topic: {
      list: function (start, size) {
        return `/api/topic/start/${start}/size/${size}`
      },
      keyword: function (keyword, start, size) {
        return `/api/topic/keyword/${keyword}/start/${start}/size/${size}`
      },
      detail: function (id) {
        return `/api/topic/id/${id}`
      },
      like: function (id) {
        return `/api/topic/id/${id}/like`
      },
      publish: '/api/topic',
      profile: function (start, size) {
        return `/api/topic/profile/start/${start}/size/${size}`
      }
    },
    delivery: {
      list: function (start, size) {
        return `/api/delivery/order/start/${start}/size/${size}`
      },
      detail: function (id) {
        return `/api/delivery/order/id/${id}`
      },
      publish: '/api/delivery/order',
      mine: '/api/delivery/mine',
      accept: '/api/delivery/acceptorder',
      finish: function (id) {
        return `/api/delivery/trade/id/${id}/finishtrade`
      }
    },
    dating: {
      list: function (area, start) {
        return `/api/dating/profile/area/${area}/start/${start}`
      },
      detail: function (id) {
        return `/api/dating/profile/id/${id}`
      },
      publish: '/api/dating/profile',
      mine: '/api/dating/profile/my',
      pick: '/api/dating/pick',
      pickDetail: function (id) {
        return `/api/dating/pick/id/${id}`
      },
      picks: {
        sent: '/api/dating/pick/my/sent',
        received: '/api/dating/pick/my/received'
      },
      profileState: function (id) {
        return `/api/dating/profile/id/${id}/state`
      }
    },
    photograph: {
      list: function (type, start, size) {
        return `/api/photograph/type/${type}/start/${start}/size/${size}`
      },
      detail: function (id) {
        return `/api/photograph/id/${id}`
      },
      comments: function (id) {
        return `/api/photograph/id/${id}/comment`
      },
      comment: function (id) {
        return `/api/photograph/id/${id}/comment`
      },
      like: function (id) {
        return `/api/photograph/id/${id}/like`
      },
      publish: '/api/photograph',
      profile: function (start, size) {
        return `/api/photograph/profile/start/${start}/size/${size}`
      },
      stats: {
        photos: '/api/photograph/statistics/photos',
        comments: '/api/photograph/statistics/comments',
        likes: '/api/photograph/statistics/likes'
      }
    }
  }
}
