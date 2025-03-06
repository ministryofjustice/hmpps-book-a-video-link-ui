function MojAddAnother($component) {
  // Our component does not have a heading, so we override this function to do nothing
  MOJFrontend.AddAnother.prototype.focusHeading = () => {}

  // Our component's remove button has different classes to the original, so we override this function
  MOJFrontend.AddAnother.prototype.createRemoveButton = (item) => item.append('<button type="button" class="moj-add-another__remove-button">Remove</button>');

  // The original component clones the first element when clicking "Add another", including the value of that element, which we want to leave blank
  MOJFrontend.AddAnother.prototype.getNewItem = function () {
    const item = this.getItems().first().clone();
    if (!this.hasRemoveButton(item)) {
      this.createRemoveButton(item);
    }
    item.find('input, textarea, select').val('')
    return item
  };

  new MOJFrontend.AddAnother($component)
}

export default MojAddAnother
