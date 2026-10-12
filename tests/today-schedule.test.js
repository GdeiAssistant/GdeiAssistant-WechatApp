const test = require('node:test')
const assert = require('node:assert/strict')
const { campusDate, getTodaySchedule } = require('../utils/today-schedule.js')

const now = new Date('2026-10-12T16:30:00Z') // Tuesday in China, Monday in UTC.
function lesson(overrides) {
  return Object.assign(
    {
      column: 1,
      scheduleName: '软件测试',
      scheduleLesson: '第 3-4 节',
      minScheduleWeek: 1,
      maxScheduleWeek: 16,
      scheduleLocation: '教学楼 C402'
    },
    overrides
  )
}

test('uses campus date rather than device timezone, including Sunday and midnight', () => {
  assert.deepEqual(campusDate(now), { column: 1, label: '2026-10-13' })
  assert.equal(campusDate(new Date('2026-10-11T04:00:00Z')).column, 6)
  assert.equal(campusDate(new Date('2026-10-12T15:59:59Z')).label, '2026-10-12')
})

test('filters actual day and inclusive week range, preserving lesson labels and API order', () => {
  const result = getTodaySchedule(
    {
      week: '5',
      scheduleList: [
        lesson(),
        lesson({ column: 0 }),
        lesson({ minScheduleWeek: 6 }),
        lesson({ maxScheduleWeek: 4 }),
        lesson({ scheduleName: '英语', minScheduleWeek: 5, maxScheduleWeek: 5 })
      ]
    },
    now
  )
  assert.deepEqual(result, {
    status: 'ready',
    lessons: [
      { name: '软件测试', lesson: '第 3-4 节', location: '教学楼 C402' },
      { name: '英语', lesson: '第 3-4 节', location: '教学楼 C402' }
    ]
  })
  assert.equal(Object.hasOwn(result, 'nextClass'), false)
  assert.equal(Object.hasOwn(result.lessons[0], 'startTime'), false)
})

test('only a valid successful empty timetable establishes no classes', () => {
  assert.deepEqual(getTodaySchedule({ week: 5, scheduleList: [] }, now), {
    status: 'empty',
    lessons: []
  })
  for (const data of [
    null,
    {},
    { week: 5 },
    { week: 0, scheduleList: [] },
    { week: 'bad', scheduleList: [] },
    { week: 5, scheduleList: [lesson({ column: null })] },
    { week: 5, scheduleList: [lesson({ scheduleName: '' })] },
    { week: 5, scheduleList: [lesson({ minScheduleWeek: undefined })] },
    { week: 5, scheduleList: [null] }
  ]) {
    assert.equal(getTodaySchedule(data, now).status, 'unavailable')
  }
})

test('does not invent a missing location or clock time', () => {
  const result = getTodaySchedule(
    { week: 5, scheduleList: [lesson({ scheduleLocation: null })] },
    now
  )
  assert.deepEqual(result.lessons[0], { name: '软件测试', lesson: '第 3-4 节', location: '' })
})
