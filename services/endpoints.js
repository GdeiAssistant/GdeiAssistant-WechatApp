module.exports = {
  auth: {
    login: 'rest/userlogin',
    refreshToken: 'rest/token/refresh',
    expireToken: 'rest/token/expire',
    wechatOpenId: 'wechat/app/userid',
    qqOpenId: 'qq/app/userid'
  },
  user: {
    avatar: 'rest/avatar/',
    profile: 'rest/profile',
    access: 'rest/access'
  },
  campus: {
    grade: 'rest/gradequery',
    schedule: 'rest/schedulequery',
    cardInfo: 'rest/cardinfo',
    cardBill: 'rest/cardquery',
    evaluate: 'rest/evaluate',
    cardLost: 'rest/cardlost'
  },
  library: {
    bookQuery: 'rest/bookquery',
    bookRenew: 'rest/bookrenew',
    collectionQuery: 'rest/collectionquery',
    collectionDetail: 'rest/collectiondetail'
  }
}
