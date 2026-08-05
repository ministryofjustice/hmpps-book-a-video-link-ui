function PrintButton(button) {
  this.printButton = button

  this.printButton.addEventListener('click', e => {
    e.preventDefault()
    window.print()
  })
}

function ExportButton(button) {
  this.exportButton = button

  this.exportButton.addEventListener('click', e => {
    e.preventDefault()
    const searchParams = new URL(window.location.href).search
    window.location.assign(`view-booking/download-csv${searchParams}`)
  })
}

export { PrintButton, ExportButton }
