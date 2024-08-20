//防重放攻击校验令牌，该默认值为生产环境供开发者体验预览的令牌值
const requestValidateToken = "7UnEVKNng3XV/eBcsL1/lRIANRfXcoPT"

//资源域名
const resourceDomain = "https://gdeiassistant.azurewebsites.net/"

module.exports = {
  requestValidateToken: requestValidateToken,
  resourceDomain : resourceDomain
}
