'use strict';

angular.module('boardOsApp').factory('myLibrary', function() {
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

	var sdo = {
		showPleaseWait: function() {
			pleaseWaitDiv.modal();
		},
		hidePleaseWait: function () {
			pleaseWaitDiv.modal('hide');
		},
		giveMeMyColor: function (value, category) {

			if (category === 'Alert') {
				switch (true) {
					case (value > 0) : return '#CB4B16';
					case (value === 0) : return '#859900'; 
				}
			}

			if (category === 'Goal' || typeof category === 'undefined') {
				switch (true) {
					case (value >= 80) : return '#859900'; 
					case (value >= 10) : return '#FF7F0E';
					default: return '#CB4B16';
				}
			}
		},
		displayLastYear: function(data, fieldDate, field) {

			var dateResult = [];
			var i;
			var yourDate = new Date();
			for (i=0;i<12;i++){
				dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
			}

			var map_result = _.map(dateResult, function (item) {
				return {
					'month': moment(item).format('YYYY.MM'),
					'value': null
				};
			});

	        map_result.reverse(); // par ordre croissant
	        
	        $.each(data, function (key,item) {
	        	$.each(map_result, function (keyMap,itemMap) {
	        		if (itemMap.month === item[fieldDate]) {
	        			itemMap.value = item[field];
	        		}
	        	});
	        });

	        return map_result;

	    },
	    getByMonth: function(data, fieldDate, field) {
	    	var dateResult = [];
	    	var i;
	    	var yourDate = new Date();
	    	for (i=0;i<12;i++){
	    		dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
	    	}

	    	var map_result = _.map(dateResult, function (item) {
	    		return {
	    			'label': moment(item).format('YYYY.MM'),
	    			'count': 0,
	    			'sum': 0,
	    			'mean':0
	    		};
	    	});

	    	$.each(data, function (key,item) {
	    		$.each(map_result, function (keyMap,itemMap) {
	    			if (itemMap.label === moment(item[fieldDate]).format('YYYY.MM')) {
	    				itemMap.count += 1;
	    				itemMap.sum += parseInt(item[field],10) || 0; // gère le cas de NaN
	    			}
	    		});
	    	});

	    	$.each(map_result, function (keyMap,itemMap) {
	    		itemMap.mean = null;
	    		if (itemMap.count > 0) {
	    			itemMap.mean = itemMap.sum / itemMap.count;
	    		}
	    	});

	    	return map_result.reverse();
	    },
	    getSumCumul : function(ref, value){

	    	var result=[
	    	{key: 'Real', values: [], mean: 0},
	    	{key: 'Ref', values: [], mean: 0}
	    	];

	    	/*cumulative à faire */
	    	var lastval = 0;

	    	var refSort = _.sortBy(ref, function(obj){ return obj.date ;});

	    	var valueSort = _.sortBy(value, function(obj){ return obj.date ;});
	    	$.each(refSort, function( indexref, valueref ) {
	    		result[1].values.push([new Date(valueref.date).getTime(),indexref+1]);
	    		var blnFind = false;
	    		$.each(valueSort, function( index, value ) {
	    			if (valueref.date === value.date) {
	    				blnFind = true;
	    				lastval = index+1;
	    			} 
	    		});
	    		result[0].values.push([new Date(valueref.date).getTime(),lastval]);
	    	});

			/*	var result = myarray.concat();
			for (var i = 0; i < myarray.length; i++){
			    result[i] = myarray.slice(0, i + 1).reduce(function(p, i){ return p + i; });
			}*/
			return result;
		},
		getCalculByMonth : function(arrays, calculType){
			// some de valerus de tableaux déjà par mois
			//arrays = [[1,2,3,4,5,6], [1,1,1,1,1,1], [2,2,2,2,2,2]];
			var result;
			if (arrays.length > 1 ) {
				result = _.map(_.zip.apply(_, arrays), function(pieces) {
					return _.reduce(pieces, function(m, p) {return (p === null) ? m:m+p;}, null);
				});
			} else {
				result = arrays[0];
			}
			// mise par mois
			var dateResult = [];
			var i;
			var yourDate = new Date();
			for (i=0;i<12;i++){
				dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
			}

			var map_result = _.map(dateResult, function (item) {
				return {
					'label': moment(item).format('YYYY.MM'),
					'count': 0,
					'sum': 0,
					'mean':0
				};
			});

       		 map_result.reverse(); // par ordre croissant

       		// On ne compte que les array avec des valeurs pour les moyennes
       		var compactArrays =[];
       		$.each(arrays, function (keyMap,anArray) {
       			if (_.compact(anArray).length > 0) {
       				compactArrays.push(anArray);
       			}
       		});
  
       		// association des deux
       		$.each(map_result, function (keyMap,itemMap) {
       			itemMap.count = parseInt(result[keyMap] /compactArrays.length)  ;
       			itemMap.sum = result[keyMap] ;
       		});

       		return map_result;
       	}
       };
       return sdo;
   });