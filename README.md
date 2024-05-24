# hmpps-book-a-video-link-ui
[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-book-a-video-link-ui)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#hmpps-book-a-video-link-ui "Link to report")
[![CircleCI](https://circleci.com/gh/ministryofjustice/hmpps-book-a-video-link-ui/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/hmpps-book-a-video-link-ui)

This front end service provides allows court and probation users to book and manage video link hearings/appointments with people in prison.

## Running the application locally

### Install the dependencies using npm:

`npm install`

### Build the service (package SCSS, JS)

`npm run build`

### Run the unit tests

`npm run test`

### To run against DEV dependencies (recommended)

Ensure you have a local .env file, with the following content:

```
INGRESS_URL=http://localhost:3000
REDIS_ENABLED=true
AUDIT_ENABLED=false
TOKEN_VERIFICATION_ENABLED=false
ENVIRONMENT_NAME=DEV

HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
HMPPS_AUTH_EXTERNAL_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
ACTIVITIES_API_URL=https://activities-api-dev.prison.service.justice.gov.uk
LOCATIONS_INSIDE_PRISON_API_URL=https://locations-inside-prison-api-dev.hmpps.service.justice.gov.uk
PRISON_API_URL=https://prison-api-dev.prison.service.justice.gov.uk
PRISONER_SEARCH_API_URL=https://prisoner-search-dev.prison.service.justice.gov.uk
MANAGE_USERS_API_URL=https://manage-users-api-dev.hmpps.service.justice.gov.uk
BOOK_A_VIDEO_LINK_API_URL=https://book-a-video-link-api-dev.prison.service.justice.gov.uk
TOKEN_VERIFICATION_API_URL=https://token-verification-api-dev.prison.service.justice.gov.uk

API_CLIENT_ID=<obtain these from team members>
API_CLIENT_SECRET=<obtain these from team members>
SYSTEM_CLIENT_ID=<obtain these from team members>
SYSTEM_CLIENT_SECRET<obtain these from team members>
```

Start a local container for redis on its default port tcp/6379.

`docker-compose -f docker-compose-local.yml up -d`

Start the application locally.

`npm run start:dev`

Access the service in a browser locally on

`http://localhost:3000/`


### Dependencies

The app requires access to several services, but only requires a redis container running locally.
The rest of the dependencies can reference the DEV environment locations (recommended).

### Run lint

`npm run lint`

### Running integration tests

For local running, pull and start a wiremock container:

`docker compose -f docker-compose-test.yml up -d`

Run the service in test mode:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either run tests in headless mode with:

`npm run int-test`
 
Or run tests with the interactive Cypress UI:

`npm run int-test-ui`

## Change log

A changelog for the service is available [here](./CHANGELOG.md)

## Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`
