/*
 * Copyright Adam Pritchard 2014
 * MIT License : http://adampritchard.mit-license.org/
 */

$(function() {
  "use strict";

  if (document.referrer) {
    // After a successful member creation (with cheque payment) we want to move
    // the user off the registration page. We'll send them to the root of the
    // domain.
    var doneURL = document.referrer.split('/').slice(0, 3).join('/');
    $('#newMember .doneBtn').attr('href', doneURL);
  }

  var inIframe = (window !== window.top);

  // If we're in an iframe, get rid of the forced container width.
  if (inIframe) {
    $('.container:first').css('width', '100%');
  }

  // If we're in an iframe, we need to do some asynchronous work before
  // submitting, so we'll handle the submit button directly, do our work, and
  // then fire off an event to start the actual data submission.
  var $fakeSubmit = $('<div class="hidden">').appendTo('body');

  DECA.setupMemberFormSubmit('self-serve',
                             '#newMember form',
                             '#newMember .waitModal',
                             $fakeSubmit);


  var submitClick = function(event) {
    event.preventDefault();

    // Alter the form and modal depending on payment method
    // TODO: Don't hardcode field name
    $('#newMember [name="payment_method"]').val($(this).val());
    if ($(this).val() === 'cheque') {
      $('#newMember .waitModal .show-paypal').addClass('hidden');
      $('#newMember .waitModal .show-cheque').removeClass('hidden');
    }
    else {
      $('#newMember .waitModal .show-paypal').removeClass('hidden');
      $('#newMember .waitModal .show-cheque').addClass('hidden');
    }

    if (!inIframe || !('parentIFrame' in window)) {
      // No extra work -- just submit.
      $fakeSubmit.click();
      return false;
    }

    // Because we're in an iframe, our modal wait dialog doesn't show at the
    // correct position -- i.e., it's not necessarily visible at all when it
    // shows (it will appear at the top of the iframe). We'll ask the parent
    // window where we should put the modal.

    window.parentIFrame.sendMessage(JSON.stringify({
      action: 'get-top',
      responseID: 'self-serve-join'
    }));

    return false;
  };

  var messageFromParent = function(event) {
    if (!event.originalEvent || !event.originalEvent.data) {
      return;
    }

    var data;

    try {
      data = JSON.parse(event.originalEvent.data);
    }
    catch(e) {
      // Clearly not for us.
      return;
    }

    if (data.responseID !== 'self-serve-join') {
      // Not for us
      return;
    }

    if (data.message === 'get-top-response') {
      var top = data.value;

      // If `top` is negative, then the top of the iframe is in full view.
      // In that case, just use 0.
      if (top < 0) {
        top = 0;
      }

      top += 'px';

      $('#newMember .modal').css('top', top);

      // Now do the actual submit.
      $fakeSubmit.click();
    }
  };
  $(window).on('message', messageFromParent);

  $('#newMember [name="submit"][value="paypal"]').click(submitClick);
  $('#newMember [name="submit"][value="cheque"]').click(submitClick);
});
