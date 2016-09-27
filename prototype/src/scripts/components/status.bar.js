/**
 * App status bar UI component.
 **/ 
function StatusBar() {

  // app message image ref.
  // TODO: add /images/message/info, warning, error
  this.messageImage = d3.select('#message-image');

  // message title: region name, or info, warning, error 
  this.messageTitle = d3.select('#message-title');

  // app status message ref
  this.message = d3.select('#message');

  // message number UI ref.
  this.messageNumber = d3.select('#message-number');

  // number format for display
  this.numberFormat = d3.format(',');

} // end of StatusBar() constructor


/**
 * Updates app status bar image, code, title, message text and stats display.
 */
StatusBar.prototype.update = function (code, title, messageText, data){
  console.log('StatusBar::update');

  // update status bar flag image   
  this.messageImage.attr('src', '../images/flags/' + code + '.png');

  // update msg title
  this.messageTitle.text(title);

  // update app message text
  this.message.text(messageText);

  // update stats data display
  this.messageNumber.text( this.numberFormat(data) );  
}

