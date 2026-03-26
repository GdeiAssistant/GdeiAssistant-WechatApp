var data = require('./mock-data.js')

function handleLogin(payload, utils) {
  var username = String(payload.username || '').trim()
  var password = String(payload.password || '').trim()

  if (!username || !password) {
    return utils.rejectWithMessage(
      data.localizedMockText(
        '校园网账号和密码不能为空',
        '校園網賬號和密碼不能為空',
        'Campus account and password are required',
        '学内アカウントとパスワードを入力してください',
        '캠퍼스 계정과 비밀번호를 입력해 주세요',
        utils.currentLocale && utils.currentLocale()
      )
    )
  }

  if (username !== data.MOCK_ACCOUNT_DATA.username || password !== data.MOCK_ACCOUNT_DATA.password) {
    return utils.rejectWithMessage(
      data.localizedMockText(
        '账号或密码错误，请检查后重试',
        '賬號或密碼錯誤，請檢查後重試',
        'Incorrect username or password. Please check and try again',
        'アカウントまたはパスワードが正しくありません。確認して再試行してください',
        '아이디 또는 비밀번호가 올바르지 않습니다. 확인 후 다시 시도해 주세요',
        utils.currentLocale && utils.currentLocale()
      ),
      { statusCode: 401 }
    )
  }

  var nextState = utils.readState()
  nextState.token = 'mock-session-token'
  utils.writeState(nextState)
  return utils.resolveWithDelay(utils.buildSuccess({ token: nextState.token }))
}

function handlePresignedUrl(query, utils) {
  var fileName = query.fileName || 'upload_' + Date.now() + '.jpg'
  var mockKey = 'mock-uploads/' + Date.now() + '/' + fileName
  return utils.resolveWithDelay(utils.buildSuccess({
    key: mockKey,
    url: 'https://mock-storage.example.com/' + mockKey + '?X-Mock-Signature=mock_token_' + Date.now(),
    token: 'mock_upload_token_' + Date.now()
  }))
}

function handleLogout(token, utils) {
  if (!token) {
    return Promise.resolve()
  }

  var state = utils.readState()
  if (state.token === token) {
    state.token = ''
    utils.writeState(state)
  }
  return Promise.resolve()
}

module.exports = {
  handleLogin: handleLogin,
  handlePresignedUrl: handlePresignedUrl,
  handleLogout: handleLogout
}
