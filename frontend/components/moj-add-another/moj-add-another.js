function MojAddAnother($component) {
  MOJFrontend.AddAnother.prototype.createRemoveButton = function (item) {
    item.append(
      '<button type="button" class="moj-add-another__remove-button">Remove</button>'
    );
  };

  new MOJFrontend.AddAnother($component)
}

export default MojAddAnother
