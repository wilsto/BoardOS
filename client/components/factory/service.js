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
    hidePleaseWait: function() {
      pleaseWaitDiv.modal('hide');
    },
    giveMeMyColor: function(value, category) {

      if (category === 'Alert') {
        switch (true) {
          case (value > 0):
            return '#CB4B16';
          case (value === 0):
            return '#859900';
        }
      }

      if (category === 'Goal' || typeof category === 'undefined') {
        switch (true) {
          case (value >= 80):
            return '#859900';
          case (value >= 10):
            return '#FF7F0E';
          default:
            return '#CB4B16';
        }
      }
    },
    displayLastYear: function(data, fieldDate, field, rework) {

      var dateResult = [];
      var i;
      var yourDate = new Date();
      for (i = 0; i < 12; i++) {
        dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
      }

      var map_result = _.map(dateResult, function(item) {
        var itemdate = (item.length > 7) ? moment(item).format('YYYY.MM') : item;
        return {
          'month': moment(itemdate).format('YYYY.MM'),
          'month2': moment(itemdate).format('YYYY.M'),
          'value': null
        };
      });

      map_result.reverse(); // par ordre croissant

      $.each(data, function(key, item) {
        $.each(map_result, function(keyMap, itemMap) {
          if (itemMap.month === item[fieldDate] || itemMap.month2 === item[fieldDate]) {
            itemMap.value = parseInt(item.value[field]);
          }
          if (rework) {
            itemMap.count = itemMap.value || 0;
            itemMap.label = itemMap.month;
            itemMap.mean = null;
            itemMap.series = null;
            itemMap.sum = null;
          }
        });
      });

      return map_result;

    },
    getByMonth: function(data, fieldDate, field) {
      var dateResult = [];
      var i;
      var yourDate = new Date();
      for (i = 0; i < 12; i++) {
        dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
      }

      var map_result = _.map(dateResult, function(item) {
        var itemdate = (item.length > 7) ? moment(item).format('YYYY.MM') : item;
        return {
          'label': moment(itemdate).format('YYYY.MM'),
          'count': 0,
          'sum': 0,
          'mean': 0
        };
      });

      $.each(data, function(key, item) {
        $.each(map_result, function(keyMap, itemMap) {
          var month = (item[fieldDate].length > 7) ? moment(item[fieldDate]).format('YYYY.MM') : item[fieldDate];
          if (itemMap.label === month) {
            itemMap.count += 1;
            itemMap.sum += parseInt(item[field], 10) || null; // gère le cas de NaN
          }
        });
      });

      $.each(map_result, function(keyMap, itemMap) {
        itemMap.mean = parseInt(itemMap.sum / itemMap.count) || null;
      });

      return map_result.reverse();
    },
    getSumCumul: function(ref, value) {

      var result = [{
        key: 'Real',
        values: [],
        mean: 0
      }, {
        key: 'Ref',
        values: [],
        mean: 0
      }];

      /*cumulative à faire */
      var lastval = 0;

      var refSort = _.sortBy(ref, function(obj) {
        return obj.date;
      });

      var valueSort = _.sortBy(value, function(obj) {
        return obj.date;
      });
      $.each(refSort, function(indexref, valueref) {
        result[1].values.push([new Date(valueref.date).getTime(), indexref + 1]);
        var blnFind = false;
        $.each(valueSort, function(index, value) {
          if (valueref.date === value.date) {
            blnFind = true;
            lastval = index + 1;
          }
        });
        result[0].values.push([new Date(valueref.date).getTime(), lastval]);
      });

      /*	var result = myarray.concat();
			for (var i = 0; i < myarray.length; i++){
			    result[i] = myarray.slice(0, i + 1).reduce(function(p, i){ return p + i; });
			}*/
      return result;
    },
    getCalculByMonth: function(arrays, calculType) {
      // some de valerus de tableaux déjà par mois
      //arrays = [[1,2,3,4,5,6], [1,1,1,1,1,1], [2,2,2,2,2,2]];
      var result, mergeArray;
      if (arrays.length > 1) {
        mergeArray = _.zip.apply(_, arrays);
        result = _.map(mergeArray, function(pieces) {
          return {
            sum: _.reduce(pieces, function(m, p) {
              return (p === null) ? m : m + p;
            }, null),
            count: _.reduce(pieces, function(m, p) {
              return (p === null) ? m : m + 1;
            }, 0)
          };
        });
      } else {
        mergeArray = arrays[0];
        result = _.map(mergeArray, function(pieces) {
          return {
            sum: pieces,
            count: (pieces) ? 1 : null
          };
        });
      }



      // mise par mois
      var dateResult = [];
      var i;
      var yourDate = new Date();
      for (i = 0; i < 12; i++) {
        dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
      }

      var map_result = _.map(dateResult, function(item) {
        var itemdate = (item.length > 7) ? moment(item).format('YYYY.MM') : item;
        return {
          'label': moment(itemdate).format('YYYY.MM'),
          'count': 0,
          'sum': 0,
          'mean': 0
        };
      });

      map_result.reverse(); // par ordre croissant

      // association des deux
      angular.forEach(map_result, function(itemMap, keyMap) {
        itemMap.count = result[keyMap].count || null;
        itemMap.mean = parseInt(result[keyMap].sum / result[keyMap].count) || null;
        itemMap.sum = result[keyMap].sum || null;
      });

      return map_result;
    }
  };
  return sdo;
});
