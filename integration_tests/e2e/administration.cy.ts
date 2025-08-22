import { startOfToday } from 'date-fns'
import Page from '../pages/page'
import HomePage from '../pages/home'
import AdministrationPage from '../pages/administration/administration'
import ExtractDataByBookingDatePage from '../pages/administration/extractDataByBookingDate'
import ExtractDataByHearingDatePage from '../pages/administration/extractDataByHearingDate'
import ManagePrisonVideoRoomsPage from '../pages/administration/managePrisonVideoRooms'
import ViewRoomsPage from '../pages/administration/viewRooms'
import berwynLocations from '../mockApis/fixtures/bookAVideoLinkApi/berwynLocations.json'
import EditRoomPage from '../pages/administration/editRoom'
import ManagePrisonDetailsPage from '../pages/administration/managePrisonDetails'
import EditPrisonDetailsPage from '../pages/administration/editPrisonDetails'

context('Administration', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['BVLS_ADMIN'])
  })

  beforeEach(() => {
    cy.task('stubAdminUser')
  })

  it('Admin user can download a CSV of court booking events by date of booking', () => {
    cy.task('stubCourtDataExtractByBookingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByBookingDate().click()

    const extractDataByBookingDatePage = Page.verifyOnPage(ExtractDataByBookingDatePage)
    extractDataByBookingDatePage.selectCourt()
    extractDataByBookingDatePage.selectDate(startOfToday())
    extractDataByBookingDatePage.enterNumberOfDays(7)
    extractDataByBookingDatePage.extractData().click()

    cy.readFile('cypress/downloads/courtDataExtractByBookingDate.csv').should('exist')
  })

  it('Admin user can download a CSV of probation booking events by date of booking', () => {
    cy.task('stubProbationDataExtractByBookingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByBookingDate().click()

    const extractDataByBookingDatePage = Page.verifyOnPage(ExtractDataByBookingDatePage)
    extractDataByBookingDatePage.selectProbation()
    extractDataByBookingDatePage.selectDate(startOfToday())
    extractDataByBookingDatePage.enterNumberOfDays(7)
    extractDataByBookingDatePage.extractData().click()

    cy.readFile('cypress/downloads/probationDataExtractByBookingDate.csv').should('exist')
  })

  it('Admin user can download a CSV of court booking events by date of hearing', () => {
    cy.task('stubCourtDataExtractByHearingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByHearingDate().click()

    const extractDataByHearingDatePage = Page.verifyOnPage(ExtractDataByHearingDatePage)
    extractDataByHearingDatePage.selectCourt()
    extractDataByHearingDatePage.selectDate(startOfToday())
    extractDataByHearingDatePage.enterNumberOfDays(7)
    extractDataByHearingDatePage.extractData().click()

    cy.readFile('cypress/downloads/courtDataExtractByHearingDate.csv').should('exist')
  })

  it('Admin user can download a CSV of probation booking events by date of hearing', () => {
    cy.task('stubProbationDataExtractByMeetingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByHearingDate().click()

    const extractDataByHearingDatePage = Page.verifyOnPage(ExtractDataByHearingDatePage)
    extractDataByHearingDatePage.selectProbation()
    extractDataByHearingDatePage.selectDate(startOfToday())
    extractDataByHearingDatePage.enterNumberOfDays(7)
    extractDataByHearingDatePage.extractData().click()

    cy.readFile('cypress/downloads/probationDataExtractByMeetingDate.csv').should('exist')
  })

  it('Admin user can manage a room', () => {
    cy.task('stubAllPrisons')
    cy.task('stubEnabledPrisons')
    cy.task('stubPrisonLocations', berwynLocations)
    cy.task('stubGetEnabledCourts')
    cy.task('stubGetEnabledProbationTeams')
    cy.task('stubGetRoomDetails', {
      key: 'BWI-VIDEOLINK-VCC-01',
      prisonCode: 'BWI',
      description: 'Video Room 01',
      enabled: true,
      dpsLocationId: 'f1c78dca-733b-43cc-b03f-6c870941a2c7',
      extraAttributes: {
        attributeId: 56,
        locationStatus: 'INACTIVE',
        statusMessage: null,
        expectedActiveDate: null,
        locationUsage: 'COURT',
        allowedParties: ['ABERCV'],
        prisonVideoUrl: null,
        notes: null,
        schedule: [
          {
            scheduleId: 54,
            startDayOfWeek: 'MONDAY',
            endDayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '18:00',
            locationUsage: 'COURT',
            allowedParties: ['ABERCV'],
          },
        ],
      },
    })
    cy.task('stubGetPrison', {
      prisonCode: 'BWI',
      response: {
        prisonId: 83,
        code: 'BWI',
        name: 'Berwyn (HMP & YOI)',
        enabled: true,
        notes: null,
      },
    })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.managePrisonVideoRooms().click()

    const managePrisonRoomPage = Page.verifyOnPage(ManagePrisonVideoRoomsPage)
    managePrisonRoomPage.manageRoomsLink().click()

    const viewRoomsPage = Page.verifyOnPage(ViewRoomsPage)
    viewRoomsPage.viewOrEditLink().click()

    const editRoomPage = Page.verifyOnPage(EditRoomPage)
    editRoomPage.selectRoomStatus('active')
    editRoomPage.roomLink().type('https://prison-room-link')
    editRoomPage.comments().type('This is a comment')

    cy.task('stubUpdateRoomDetails')
    cy.task('stubGetRoomDetails', {
      key: 'BWI-VIDEOLINK-VCC-01',
      prisonCode: 'BWI',
      description: 'Video Room 01',
      enabled: true,
      dpsLocationId: 'f1c78dca-733b-43cc-b03f-6c870941a2c7',
      extraAttributes: {
        attributeId: 56,
        locationStatus: 'ACTIVE',
        statusMessage: null,
        expectedActiveDate: null,
        locationUsage: 'COURT',
        allowedParties: ['ABERCV'],
        prisonVideoUrl: 'https://prison-room-link',
        notes: 'This is a comment',
        schedule: [
          {
            scheduleId: 54,
            startDayOfWeek: 'MONDAY',
            endDayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '18:00',
            locationUsage: 'COURT',
            allowedParties: ['ABERCV'],
          },
        ],
      },
    })
    editRoomPage.save().click()

    cy.get(`.moj-alert__content`).should('have.text', 'Room changes have been saved')
    editRoomPage.getSelectedRoomStatus().should('eq', 'active')
    editRoomPage.roomLink().should('have.value', 'https://prison-room-link')
    editRoomPage.getSelectedRoomPermission().should('eq', 'court')
    editRoomPage.comments().should('have.value', 'This is a comment')
  })

  it('Admin user can manage prison details', () => {
    cy.task('stubAllPrisons')

    cy.task('stubGetPrison', {
      prisonCode: 'AA1',
      response: {
        prisonId: 3,
        code: 'AA1',
        name: 'AA3 Prison for test',
        enabled: false,
        notes: null,
        pickUpTime: null,
      },
    })

    cy.task('stubUpdatePrisonDetails', {
      prisonCode: 'AA1',
      response: {
        prisonId: 3,
        code: 'AA1',
        name: 'AA3 Prison for test',
        enabled: false,
        notes: null,
        pickUpTime: '30',
      },
    })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.managePrisonDetails().click()

    const managePrisonDetailsPage = Page.verifyOnPage(ManagePrisonDetailsPage)
    managePrisonDetailsPage.managePrisonLink('AA1').click()

    const editPrisonDetailsPage = Page.verifyOnPage(EditPrisonDetailsPage)
    editPrisonDetailsPage.selectPickUpTimeOn().click()
    editPrisonDetailsPage.selectPickUpTime30().click()
    editPrisonDetailsPage.save().click()
    editPrisonDetailsPage.assertSaved()
  })
})
