'use strict';

function preventCache() {
	return '?preventCache='+Math.random();
}

function loading() {
	var pleaseWaitDiv = $('<div class="modal" style="padding-top:25%" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"> \
          <div style="margin-left:30%; margin-right:30%">\
            <div class="modal-body" style="background:white;border-radius:10px;"> \
              <h2 style="margin-top:-5px">Processing...</h2> \
              <div class="progress "> \
                <div class="progress-bar progress-bar-striped active" style="width: 100%;"></div> \
              </div>\
            </div>\
          </div>\
        </div>');
	return {
	    showPleaseWait: function() {
	      pleaseWaitDiv.modal();
	    },
	    hidePleaseWait: function () {
	      pleaseWaitDiv.modal('hide');
	    },

	};
}