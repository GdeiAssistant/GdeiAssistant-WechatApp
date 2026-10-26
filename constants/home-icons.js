// Matches GdeiAssistant Web Home.vue's Lucide symbols (stroke width 1.8).
const icons = {
  grade: 'star',
  schedule: 'calendar',
  cet: 'file-text',
  graduateExam: 'graduation-cap',
  spare: 'door-open',
  card: 'wallet-cards',
  evaluate: 'pen-line',
  collection: 'book-open',
  data: 'database',
  marketplace: 'shopping-cart',
  lostandfound: 'search',
  secret: 'eye',
  express: 'heart',
  topic: 'message-circle',
  delivery: 'truck',
  dating: 'users',
  photograph: 'camera',
  appearance: 'info',
  settings: 'settings',
  logout: 'log-out',
  news: 'newspaper',
  notice: 'bell'
}

function getIcon(id, dark) {
  return '/image/linear/' + (dark ? 'dark' : 'light') + '/' + (icons[id] || 'info') + '.svg'
}

module.exports = { icons, getIcon }
