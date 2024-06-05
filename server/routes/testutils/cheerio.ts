import Root = cheerio.Root

export const getPageHeader = ($: Root) => $('h1').text().trim()
export const getByDataQa = ($: Root, dataQa: string) => $(`[data-qa=${dataQa}]`)
export const existsByDataQa = ($: Root, dataQa: string) => getByDataQa($, dataQa).length > 0
export const getByName = ($: Root, name: string) => $(`[name=${name}]`)
export const existsByName = ($: Root, name: string) => getByName($, name).length > 0

export const getByLabel = ($: Root, label: string) => {
  const lbl = $(`label:contains("${label}")`)
  return lbl.attr('for') ? $(`#${lbl.attr('for')}`) : lbl.find('input, select, textarea')
}
export const existsByLabel = ($: Root, label: string) => getByLabel($, label).length > 0
