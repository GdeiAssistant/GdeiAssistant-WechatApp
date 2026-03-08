module.exports = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    wechatOpenId: '/api/wechat/app/userid',
    qqOpenId: '/qq/app/userid'
  },
  user: {
    avatar: '/api/profile/avatar',
    profile: '/api/user/profile'
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
    bookQuery: '/api/book/borrow',
    bookRenew: '/api/book/renew',
    collectionQuery: '/api/collection/search',
    collectionDetail: '/api/collection/detail'
  }
}
