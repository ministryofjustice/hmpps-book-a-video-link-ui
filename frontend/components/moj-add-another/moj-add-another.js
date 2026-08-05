function MojAddAnother($component) {
  // Store original prototype methods if needed
  const originalFocusHeading = MOJFrontend.AddAnother.prototype.focusHeading
  const originalCreateRemoveButton = MOJFrontend.AddAnother.prototype.createRemoveButton
  const originalGetNewItem = MOJFrontend.AddAnother.prototype.getNewItem

  // Our component does not have a heading, so we override this function to do nothing
  MOJFrontend.AddAnother.prototype.focusHeading = function () {}

  // Our component's remove button has different classes to the original, so we override this function
  MOJFrontend.AddAnother.prototype.createRemoveButton = function (item) {
    return item.append('<button type="button" class="moj-add-another__remove-button">Remove</button>')
  }

  // The original component clones the first element when clicking "Add another", including the value of that element, which we want to leave blank
  MOJFrontend.AddAnother.prototype.getNewItem = function () {
    const item = this.getItems().first().clone()
    if (!this.hasRemoveButton(item)) {
      this.createRemoveButton(item)
    }
    item.find('input, textarea, select').val('')
    return item
  }

  const instance = new MOJFrontend.AddAnother($component)

  // Restore original prototype methods to avoid affecting other instances
  MOJFrontend.AddAnother.prototype.focusHeading = originalFocusHeading
  MOJFrontend.AddAnother.prototype.createRemoveButton = originalCreateRemoveButton
  MOJFrontend.AddAnother.prototype.getNewItem = originalGetNewItem

  return instance
}

export default MojAddAnother
