import type { CheerioAPI } from 'cheerio'

export const getPageHeader = ($: CheerioAPI) => $('h1').text().trim()
export const getByDataQa = ($: CheerioAPI, dataQa: string) => $(`[data-qa=${dataQa}]`)
export const existsByDataQa = ($: CheerioAPI, dataQa: string) => getByDataQa($, dataQa).length > 0
export const getByName = ($: CheerioAPI, name: string) => $(`[name=${name}]`)
export const getTextById = ($: CheerioAPI, id: string) => $(`[id=${id}]`).text().trim()
export const existsByName = ($: CheerioAPI, name: string) => getByName($, name).length > 0
export const getPageAlert = ($: CheerioAPI) => $('div.moj-alert__content').text().trim()

export const getByLabel = ($: CheerioAPI, label: string) => {
  const lbl = $(`label:contains("${label}")`)
  return lbl.attr('for') ? $(`#${lbl.attr('for')}`) : lbl.find('input, select, textarea')
}
export const existsByLabel = ($: CheerioAPI, label: string) => getByLabel($, label).length > 0

export const getValueByKey = ($: CheerioAPI, key: string) => {
  return (
    $('.govuk-summary-list .govuk-summary-list__row')
      .filter((_, e) => $(e).find('.govuk-summary-list__key').text().trim() === key)
      .find('.govuk-summary-list__value')
      .text()
      .trim() || null
  )
}

export const existsByKey = ($: CheerioAPI, key: string) => {
  return (
    $('.govuk-summary-list .govuk-summary-list__row').filter(
      (_, e) => $(e).find('.govuk-summary-list__key').text().trim() === key,
    ).length > 0
  )
}

export const dropdownOptions = ($: CheerioAPI, name: string) => {
  return getByName($, name)
    .find('option')
    .map((_, option) => $(option).attr('value'))
    .get()
    .filter(s => s.length > 1)
}

export const radioOptions = ($: CheerioAPI, name: string) => {
  return getByName($, name)
    .map((_, option) => $(option).attr('value'))
    .get()
    .filter(s => s.length > 1)
}
