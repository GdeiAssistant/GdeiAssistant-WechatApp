const i18n = require('../utils/i18n.js')

const SPARE_TIME_RANGE_MAP = [
  [1, 2],
  [3, 3],
  [4, 5],
  [6, 7],
  [8, 9],
  [10, 12],
  [1, 4],
  [6, 9],
  [10, 12],
  [1, 9],
  [1, 12]
]

function getSpareCampusOptions() {
  return [
    { label: i18n.t('spare.campus.any'), value: 0 },
    { label: i18n.t('spare.campus.haizhu'), value: 1 },
    { label: i18n.t('spare.campus.huadu'), value: 2 },
    { label: i18n.t('spare.campus.nanhai'), value: 3 },
    { label: i18n.t('spare.campus.correspondence'), value: 4 }
  ]
}

function getSpareRoomTypeOptions() {
  return [
    { label: i18n.t('spare.roomType.any'), value: 0 },
    { label: i18n.t('spare.roomType.noRoom'), value: 1 },
    { label: i18n.t('spare.roomType.playground'), value: 2 },
    { label: i18n.t('spare.roomType.largeMultimedia'), value: 3 },
    { label: i18n.t('spare.roomType.computerLab'), value: 4 },
    { label: i18n.t('spare.roomType.sculptureRoom'), value: 5 },
    { label: i18n.t('spare.roomType.multimediaRoom'), value: 6 },
    { label: i18n.t('spare.roomType.translationRoom'), value: 7 },
    { label: i18n.t('spare.roomType.fashionLab'), value: 8 },
    { label: i18n.t('spare.roomType.pianoRoom1'), value: 9 },
    { label: i18n.t('spare.roomType.pianoRoom2'), value: 10 },
    { label: i18n.t('spare.roomType.publicComputerLab'), value: 11 },
    { label: i18n.t('spare.roomType.chinesePaintingRoom'), value: 12 },
    { label: i18n.t('spare.roomType.artStudio'), value: 13 },
    { label: i18n.t('spare.roomType.chemistryLab'), value: 14 },
    { label: i18n.t('spare.roomType.computerRoom'), value: 15 },
    { label: i18n.t('spare.roomType.teachingAidsRoom'), value: 16 },
    { label: i18n.t('spare.roomType.educationLab'), value: 17 },
    { label: i18n.t('spare.roomType.anatomyLab'), value: 18 },
    { label: i18n.t('spare.roomType.financeMathLab'), value: 19 },
    { label: i18n.t('spare.roomType.artClassroom'), value: 20 },
    { label: i18n.t('spare.roomType.montessoriRoom'), value: 21 },
    { label: i18n.t('spare.roomType.modelMakingLab'), value: 22 },
    { label: i18n.t('spare.roomType.graphicDesignLab'), value: 23 },
    { label: i18n.t('spare.roomType.practiceRoom'), value: 24 },
    { label: i18n.t('spare.roomType.photographyLab'), value: 25 },
    { label: i18n.t('spare.roomType.vocalRoom'), value: 26 },
    { label: i18n.t('spare.roomType.biologyLab'), value: 27 },
    { label: i18n.t('spare.roomType.trainingRoom'), value: 28 },
    { label: i18n.t('spare.roomType.sightSingingRoom'), value: 29 },
    { label: i18n.t('spare.roomType.potteryRoom'), value: 30 },
    { label: i18n.t('spare.roomType.gymnasticsRoom'), value: 31 },
    { label: i18n.t('spare.roomType.networkLab'), value: 32 },
    { label: i18n.t('spare.roomType.microTeachingRoom'), value: 33 },
    { label: i18n.t('spare.roomType.noRoomNeeded'), value: 34 },
    { label: i18n.t('spare.roomType.danceRoom1'), value: 35 },
    { label: i18n.t('spare.roomType.danceRoom2'), value: 36 },
    { label: i18n.t('spare.roomType.physicsLab'), value: 37 },
    { label: i18n.t('spare.roomType.smallMultimedia'), value: 38 },
    { label: i18n.t('spare.roomType.smallMultimediaUnder70'), value: 39 },
    { label: i18n.t('spare.roomType.smallClassroomUnder70'), value: 40 },
    { label: i18n.t('spare.roomType.groupRoom'), value: 41 },
    { label: i18n.t('spare.roomType.fitnessRoom'), value: 42 },
    { label: i18n.t('spare.roomType.musicRoom'), value: 43 },
    { label: i18n.t('spare.roomType.musicMajorRoom'), value: 44 },
    { label: i18n.t('spare.roomType.languageLab'), value: 45 },
    { label: i18n.t('spare.roomType.smartRecordingRoom'), value: 46 },
    { label: i18n.t('spare.roomType.mediumMultimedia'), value: 47 },
    { label: i18n.t('spare.roomType.majorClassroom'), value: 48 },
    { label: i18n.t('spare.roomType.majorTheoryRoom'), value: 49 },
    { label: i18n.t('spare.roomType.majorLab'), value: 50 },
    { label: i18n.t('spare.roomType.counselingRoom'), value: 51 },
    { label: i18n.t('spare.roomType.comprehensivePaintingLab'), value: 52 }
  ]
}

function getSpareWeekdayOptions() {
  return [
    { label: i18n.t('spare.weekday.any'), value: -1 },
    { label: i18n.t('spare.weekday.mon'), value: 0 },
    { label: i18n.t('spare.weekday.tue'), value: 1 },
    { label: i18n.t('spare.weekday.wed'), value: 2 },
    { label: i18n.t('spare.weekday.thu'), value: 3 },
    { label: i18n.t('spare.weekday.fri'), value: 4 },
    { label: i18n.t('spare.weekday.sat'), value: 5 },
    { label: i18n.t('spare.weekday.sun'), value: 6 }
  ]
}

function getSpareWeekTypeOptions() {
  return [
    { label: i18n.t('spare.weekType.any'), value: 0 },
    { label: i18n.t('spare.weekType.odd'), value: 1 },
    { label: i18n.t('spare.weekType.even'), value: 2 }
  ]
}

function getSpareClassPeriodOptions() {
  return [
    { label: i18n.t('spare.classPeriod.period12'), value: 0 },
    { label: i18n.t('spare.classPeriod.period3'), value: 1 },
    { label: i18n.t('spare.classPeriod.period45'), value: 2 },
    { label: i18n.t('spare.classPeriod.period67'), value: 3 },
    { label: i18n.t('spare.classPeriod.period89'), value: 4 },
    { label: i18n.t('spare.classPeriod.period1012'), value: 5 },
    { label: i18n.t('spare.classPeriod.morning'), value: 6 },
    { label: i18n.t('spare.classPeriod.afternoon'), value: 7 },
    { label: i18n.t('spare.classPeriod.evening'), value: 8 },
    { label: i18n.t('spare.classPeriod.daytime'), value: 9 },
    { label: i18n.t('spare.classPeriod.allDay'), value: 10 }
  ]
}

module.exports = {
  SPARE_TIME_RANGE_MAP,
  getSpareCampusOptions,
  getSpareRoomTypeOptions,
  getSpareWeekdayOptions,
  getSpareWeekTypeOptions,
  getSpareClassPeriodOptions
}
