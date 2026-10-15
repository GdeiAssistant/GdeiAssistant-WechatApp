// The timetable exposes lesson labels, not wall-clock start/end times.
// Use the campus date (China UTC+8), including when the device is abroad.
function campusDate(now) {
  const date = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return {
    column: (date.getUTCDay() + 6) % 7,
    label:
      date.getUTCFullYear() +
      '-' +
      String(date.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getUTCDate()).padStart(2, '0')
  }
}

function getTodaySchedule(data, now) {
  const week = Number(data && data.week)
  if (!data || !Array.isArray(data.scheduleList) || !Number.isInteger(week) || week < 1) {
    return { status: 'unavailable', lessons: [] }
  }
  const column = campusDate(now).column
  const lessons = []
  for (const item of data.scheduleList) {
    if (!item || !Number.isInteger(item.column) || item.column < 0 || item.column > 6) {
      return { status: 'unavailable', lessons: [] }
    }
    if (item.column !== column) continue
    const min = Number(item.minScheduleWeek)
    const max = Number(item.maxScheduleWeek)
    if (
      !Number.isInteger(min) ||
      min < 1 ||
      !Number.isInteger(max) ||
      max < min ||
      typeof item.scheduleName !== 'string' ||
      !item.scheduleName.trim() ||
      typeof item.scheduleLesson !== 'string' ||
      !item.scheduleLesson.trim()
    ) {
      return { status: 'unavailable', lessons: [] }
    }
    if (week >= min && week <= max) {
      lessons.push({
        name: item.scheduleName,
        lesson: item.scheduleLesson,
        location: typeof item.scheduleLocation === 'string' ? item.scheduleLocation : ''
      })
    }
  }
  return { status: lessons.length ? 'ready' : 'empty', lessons }
}

module.exports = { campusDate, getTodaySchedule }
