'use strict';

angular.module('boardOsApp').factory('calLibrary', function() {
	var sdo = {
	 	displayLastYear: function(data, fieldDate, field) {

	 		var dateResult = [];
	        var i;
	        var yourDate = new Date();
	        for (i=0;i<12;i++){
	            dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
	        }

	        var map_result = _.map(dateResult, function (item) {
	          return {
	              "month": moment(item).format("YYYY.MM"),
	              "value": null
	            };
	        });

	        map_result.reverse() // par ordre croissant

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

				var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
				  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

				var dateResult = [];
				var i;
				var yourDate = new Date();
				for (i=0;i<12;i++){
					dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
				}

				var map_result = _.map(dateResult, function (item) {
				  var d = new Date(new Number(new Date(item)));
				  var month = d.getFullYear()  + ", " +  monthNames[d.getMonth()];
				  return {
				      "label": month,
				      "count": 0,
				      "sum": 0,
				      "mean":0
				  };
				});

				$.each(data, function (key,item) {
				  var d = new Date(new Number(new Date(item[fieldDate])));
				  var month = d.getFullYear()  + ", " +  monthNames[d.getMonth()];
				  $.each(map_result, function (keyMap,itemMap) {
					  if (itemMap.label === month) {
			    		itemMap.count += 1;
			    		itemMap.sum += parseInt(item[field],10);
					  }
				  });
				});

				$.each(map_result, function (keyMap,itemMap) {
				    if (itemMap.count > 0) {
				    	itemMap.mean = itemMap.sum / itemMap.count;
				    }
				});

				return map_result.reverse();
		},
		getSumCumul : function(ref, value){

			var result=[
				{key: "Real", values: [], mean: 0},
	            {key: "Ref", values: [], mean: 0}
	            ];

			/*cumulative à faire */
			var lastval = 0;

    		var refSort = _.sortBy(ref, function(obj){ return obj.date });

    		var valueSort = _.sortBy(value, function(obj){ return obj.date });
			$.each(refSort, function( indexref, valueref ) {
				result[1].values.push([new Date(valueref.date).getTime(),indexref+1]);
				var blnFind = false;
			  	$.each(valueSort, function( index, value ) {
			  		if (valueref.date == value.date) {
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
		}
	}
	return sdo;
});