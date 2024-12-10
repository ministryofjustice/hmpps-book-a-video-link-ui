import { isValid, parse } from 'date-fns'
import {
  convertToTitleCase,
  dateAtTime,
  extractPrisonAppointmentsFromBooking,
  formatDate,
  initialiseName,
  parseDate,
  parseDatePickerDate,
  simpleDateToDate,
  simpleTimeToDate,
  toDateString,
} from './utils'
import { VideoLinkBooking } from '../@types/bookAVideoLinkApi/types'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('parseDate', () => {
  it.each([
    ['2022-02-17', undefined, new Date(2022, 1, 17)],
    ['17/02/2022', 'dd/MM/yyyy', new Date(2022, 1, 17)],
  ])('%s parseDate(%s, %s)', (date: string, fmt: string, expected: Date) => {
    expect(parseDate(date, fmt)).toEqual(expected)
  })
})

describe('formatDate', () => {
  it.each([
    [null, null, 'd MMMM yyyy', undefined],
    ['empty string', '', 'd MMMM yyyy', undefined],
    ['Poor format string', '20-03-2022', 'd MMMM yyyy', undefined],
    ['ISO Date String', '2022-03-20', 'd MMMM yyyy', '20 March 2022'],
    ['Date Object', new Date(2022, 2, 20), 'd MMMM yyyy', '20 March 2022'],
  ])('%s formatDate(%s, %s)', (_: string, a: string | Date, fmt: string, expected: string) => {
    expect(formatDate(a, fmt)).toEqual(expected)
  })
})

describe('parseDatePickerDate', () => {
  it('is not a date', () => {
    expect(isValid(parseDatePickerDate('bad string'))).toBeFalsy()
  })

  it('is invalid date', () => {
    expect(isValid(parseDatePickerDate('31/02/2022'))).toBeFalsy()
  })

  it.each([
    { datePickerDate: '23-10-2023', separator: '-' },
    { datePickerDate: '23/10/2023', separator: '/' },
    { datePickerDate: '23,10,2023', separator: ',' },
    { datePickerDate: '23.10.2023', separator: '.' },
    { datePickerDate: '23 10 2023', separator: ' ' },
  ])("parses date string when separator is '$separator'", async ({ datePickerDate }) => {
    const date = parseDatePickerDate(datePickerDate)

    expect(date).toEqual(parse('2023-10-23', 'yyyy-MM-dd', new Date()))
  })

  it('parses one digit day and month and two digit year', () => {
    const date = parseDatePickerDate('2/9/23')

    expect(date).toEqual(parse('2023-09-02', 'yyyy-MM-dd', new Date()))
  })

  it('parses three digit year', () => {
    const date = parseDatePickerDate('02/09/223')

    expect(date).toEqual(parse('0223-09-02', 'yyyy-MM-dd', new Date()))
  })
})

describe('simpleDateToDate', () => {
  it('has all empty fields', () => {
    expect(simpleDateToDate({ day: '', month: '', year: '' })).toEqual(null)
  })

  it('is invalid', () => {
    expect(isValid(simpleDateToDate({ day: '31', month: '02', year: '2022' }))).toBeFalsy()
  })

  it('is valid', () => {
    const date = simpleDateToDate({ day: '20', month: '03', year: '2022' })
    expect(date).toEqual(parse('2022-03-20', 'yyyy-MM-dd', new Date()))
  })
})

describe('simpleTimeToDate', () => {
  it('has all empty fields', () => {
    expect(simpleTimeToDate({ hour: '', minute: '' })).toEqual(null)
  })

  it('is invalid', () => {
    expect(isValid(simpleTimeToDate({ hour: '25', minute: '00' }))).toBeFalsy()
  })

  it('is valid', () => {
    const date = simpleTimeToDate({ hour: '13', minute: '35' })
    expect(date).toEqual(parse('13:35', 'HH:mm', new Date(0)))
  })
})

describe('dateAtTime', () => {
  it('returns a new date with the time set correctly', () => {
    const date = parse('2022-03-20', 'yyyy-MM-dd', new Date())
    const time = parse('13:35', 'HH:mm', new Date(0))

    expect(dateAtTime(date, time)).toEqual(parse('2022-03-20 13:35', 'yyyy-MM-dd HH:mm', new Date()))
  })
})

describe('extractPrisonAppointmentsFromBooking', () => {
  it('Should extract a probation meeting as the main appointment', async () => {
    const probationAppointment = {
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_PROBATION',
      prisonLocKey: 'VCC-ROOM-1',
      appointmentDate: '2024-04-05',
      startTime: '11:30',
      endTime: '12:30',
    }

    const booking = {
      prisonAppointments: [probationAppointment],
    } as VideoLinkBooking

    expect(extractPrisonAppointmentsFromBooking(booking)).toEqual({
      mainAppointment: probationAppointment,
    })
  })

  it('Should extract court hearings', async () => {
    const preHearing = {
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_COURT_PRE',
      prisonLocKey: 'PRE_LOCATION',
      appointmentDate: '2022-03-20',
      startTime: '13:15',
      endTime: '13:30',
    }

    const mainHearing = {
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_COURT_MAIN',
      prisonLocKey: 'LOCATION',
      appointmentDate: '2022-03-20',
      startTime: '13:30',
      endTime: '14:30',
    }

    const postHearing = {
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_COURT_POST',
      prisonLocKey: 'POST_LOCATION',
      appointmentDate: '2022-03-20',
      startTime: '14:30',
      endTime: '14:45',
    }

    const booking = {
      prisonAppointments: [preHearing, mainHearing, postHearing],
    } as VideoLinkBooking

    expect(extractPrisonAppointmentsFromBooking(booking)).toEqual({
      preAppointment: preHearing,
      mainAppointment: mainHearing,
      postAppointment: postHearing,
    })
  })
})

describe('toDateString', () => {
  it('converts a date to a string', () => {
    expect(toDateString(new Date(2022, 2, 31))).toEqual('2022-03-31')
    expect(toDateString(new Date(2022, 9, 20))).toEqual('2022-10-20')
  })
})
