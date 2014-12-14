'use strict';

angular.module('boardOsApp').service('profile', function() {
	this.name = "Anonymous";
	this.id = null;
	this.login = function(){
        // faire un truc pour se loger
    }
    this.logout = function(){
        // faire un truc pour se deco
    }
});

angular.module('boardOsApp').factory('srvLibrary2', function($http) {
var dataFactory = {};

		dataFactory.getActivities= function() {
			var promise = $http.get('/api/activities').success(function (data) {
				$rootScope.activities = data;
				return data;
			});
			return promise;
		};
		dataFactory.getContextes= function() {
			var promise = $http.get('/api/contextes').success(function (data) { 
				$rootScope.contextes = data;
				return data;
			});
			return promise;
		};
		dataFactory.getAxes= function() {
			var promise = $http.get('/api/axes').success(function (data) { 
				$rootScope.axes = data;
				return data;
			});
			return promise;
		};
		dataFactory.getDashBoards=function(id) {
			if (typeof id == 'undefined') {
				var promise = $http.get('/api/dashboards').success(function (data) { 
					return data;
				})
			} else {
				var promise = $http.get('/api/dashboards/'+id).success(function (data) { 
					return data;
				});
			}

			return promise;
		};
		dataFactory.getIndicateurs= function(id) {
			if (typeof id == 'undefined') {
				var promise = $http.get('/api/indicateurs').success(function (data) { 
					return data;
				})
			} else {
				var promise = $http.get('/api/indicateurs/'+id).success(function (data) { 
					return data;
				});
			}
			return promise;
		};
		dataFactory.getTasks= function(id) {
			if (typeof id == 'undefined') {
				$http.get('/api/tasks').success(function (data) { 
					dataFactory = data;
					console.log(dataFactory);
				})
			} else {
				var promise = $http.get('/api/tasks/'+id).success(function (data) { 
					return data;
				});
			}
		},		
		dataFactory.getMovies= function() {
			var promise = $http({ method: 'GET', url: 'api/movies.php' }).success(function(data, status, headers, config) {
				return data;
			});
			return promise;
		};
		dataFactory.getInitData = function() {
			var deferred = $q.defer();
			var promise = $q.all([
				$http.get('/api/activities').success(function (data) {
				    $rootScope.activities = data;
				  }), 
				$http.get('/api/axes').success(function (data) {
				    $rootScope.axes = data;
				  }),
				$http.get('/api/contextes').success(function (data) {
				    $rootScope.contextes = data;
				  })
			]);

			promise.then(function () {
			  	if (typeof  $rootScope.perimeter == "undefined" ) {$rootScope.perimeter = {refContexte:'',refActivity:'',refAxe:'',category:[true, true, true, true],time:''}};
				// decoder le contexte et les activités pour les mesures
				var even = _.where($rootScope.contextes, {id: $rootScope.perimeter.refcontexte});
				if (even.length > 0 ) {$rootScope.perimeter.Contexte = even[0].name};
				var even = _.where($rootScope.activities, {id: $rootScope.perimeter.refActivity});
				if (even.length > 0 ) {$rootScope.perimeter.Activity = even[0].name};
			});

		};
		return dataFactory;
});

angular.module('boardOsApp').directive('onFinishRender', function ($timeout) {
	return {
		apirict: 'A',
		link: function (scope, element, attr) {
			if (scope.$last === true) {
				$timeout(function () {
					scope.$emit('ngRepeatFinished');
				});
			}
		}
	}
});


angular.module('boardOsApp').factory('calLibrary', function() {
	var sdo = {
		getSumByMonth: function(data, field) {

				var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
				  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

				var map_result = _.map(data, function (item) {
				  var d = new Date(new Number(new Date(item[field])));
				  var month = d.getFullYear()  + ", " +  monthNames[d.getMonth()];
				  return {
				      "Month": month,
				      "User_Count": 1
				  };
				});

				var result_temp = _.reduce(map_result, function (memo, item) {
				  if (memo[item.Month] === undefined) {
				      memo[item.Month] = item.User_Count;
				  }else{
				      memo[item.Month] += item.User_Count;
				  }
				  return memo;
				},{});

				//then wrap the result to the format you expected.
				var result = _.map(result_temp, function(value, key){
				  return {
				      "Month": key,
				      "User_Count": value
				  };
				});
				return result;
		},
		getCountByMonth: function(data, field) {

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
				      "value": 0
				  };
				});

				$.each(data, function (key,item) {
				  var d = new Date(new Number(new Date(item[field])));
				  var month = d.getFullYear()  + ", " +  monthNames[d.getMonth()];
				  $.each(map_result, function (keyMap,itemMap) {
					  if (itemMap.label === month) {
					    itemMap.value += 1;
					  }
					});

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
    		console.log(refSort);
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