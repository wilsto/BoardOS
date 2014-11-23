'use strict';

angular.module('boardOsApp')
  .controller('KPIsCtrl', function ($scope, $http, socket, ngToast,actionKPI,categoryKPI,groupByKPI) {
    $scope.KPIs = [];
    $scope.KPI = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.load = function() {
      $http.get('/api/KPIs').success(function(KPIs) {
        $scope.KPIs = KPIs;
      });
    };

    $scope.save = function() {
      delete $scope.KPI.__v;
      console.log($scope.KPI );

      if (typeof $scope.KPI._id == 'undefined') {
        $http.post('/api/KPIs', $scope.KPI);
        ngToast.create('KPI "' + $scope.KPI.name + '" was created');
      } else {
        $http.put('/api/KPIs/'+ $scope.KPI._id , $scope.KPI);
        ngToast.create('KPI "' + $scope.KPI.name + '" was updated');
      }
      $scope.load();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(KPI) {
      $scope.KPI = {};
      $scope.KPI = KPI;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.reset = function() {
      $scope.KPI = {};
    };

    $scope.delete = function(KPI,index) {
      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          $http.delete('/api/KPIs/' + KPI._id).success(function () {
              $scope.KPIs.splice(index, 1);
              ngToast.create('KPI "' + KPI.name + '" was deleted');
          });
        }
      }); 
    }; 

    $scope.load();

    $scope.loadXEditable = function() {
    
        //toggle `popup` / `inline` mode
        $.fn.editable.defaults.mode = 'popup';     
        
        //make username editable
        $('#name').editable({
          success: function(response, newValue) {
              $scope.KPI.name = newValue;
          }
        });

        var countries = [];
        $.each({"BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria", "BA": "Bosnia and Herzegovina", "BB": "Barbados", "WF": "Wallis and Futuna", "BL": "Saint Bartelemey", "BM": "Bermuda", "BN": "Brunei Darussalam", "BO": "Bolivia", "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BT": "Bhutan", "JM": "Jamaica", "BV": "Bouvet Island", "BW": "Botswana", "WS": "Samoa", "BR": "Brazil", "BS": "Bahamas", "JE": "Jersey", "BY": "Belarus", "O1": "Other Country", "LV": "Latvia", "RW": "Rwanda", "RS": "Serbia", "TL": "Timor-Leste", "RE": "Reunion", "LU": "Luxembourg", "TJ": "Tajikistan", "RO": "Romania", "PG": "Papua New Guinea", "GW": "Guinea-Bissau", "GU": "Guam", "GT": "Guatemala", "GS": "South Georgia and the South Sandwich Islands", "GR": "Greece", "GQ": "Equatorial Guinea", "GP": "Guadeloupe", "JP": "Japan", "GY": "Guyana", "GG": "Guernsey", "GF": "French Guiana", "GE": "Georgia", "GD": "Grenada", "GB": "United Kingdom", "GA": "Gabon", "SV": "El Salvador", "GN": "Guinea", "GM": "Gambia", "GL": "Greenland", "GI": "Gibraltar", "GH": "Ghana", "OM": "Oman", "TN": "Tunisia", "JO": "Jordan", "HR": "Croatia", "HT": "Haiti", "HU": "Hungary", "HK": "Hong Kong", "HN": "Honduras", "HM": "Heard Island and McDonald Islands", "VE": "Venezuela", "PR": "Puerto Rico", "PS": "Palestinian Territory", "PW": "Palau", "PT": "Portugal", "SJ": "Svalbard and Jan Mayen", "PY": "Paraguay", "IQ": "Iraq", "PA": "Panama", "PF": "French Polynesia", "BZ": "Belize", "PE": "Peru", "PK": "Pakistan", "PH": "Philippines", "PN": "Pitcairn", "TM": "Turkmenistan", "PL": "Poland", "PM": "Saint Pierre and Miquelon", "ZM": "Zambia", "EH": "Western Sahara", "RU": "Russian Federation", "EE": "Estonia", "EG": "Egypt", "TK": "Tokelau", "ZA": "South Africa", "EC": "Ecuador", "IT": "Italy", "VN": "Vietnam", "SB": "Solomon Islands", "EU": "Europe", "ET": "Ethiopia", "SO": "Somalia", "ZW": "Zimbabwe", "SA": "Saudi Arabia", "ES": "Spain", "ER": "Eritrea", "ME": "Montenegro", "MD": "Moldova, Republic of", "MG": "Madagascar", "MF": "Saint Martin", "MA": "Morocco", "MC": "Monaco", "UZ": "Uzbekistan", "MM": "Myanmar", "ML": "Mali", "MO": "Macao", "MN": "Mongolia", "MH": "Marshall Islands", "MK": "Macedonia", "MU": "Mauritius", "MT": "Malta", "MW": "Malawi", "MV": "Maldives", "MQ": "Martinique", "MP": "Northern Mariana Islands", "MS": "Montserrat", "MR": "Mauritania", "IM": "Isle of Man", "UG": "Uganda", "TZ": "Tanzania, United Republic of", "MY": "Malaysia", "MX": "Mexico", "IL": "Israel", "FR": "France", "IO": "British Indian Ocean Territory", "FX": "France, Metropolitan", "SH": "Saint Helena", "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands (Malvinas)", "FM": "Micronesia, Federated States of", "FO": "Faroe Islands", "NI": "Nicaragua", "NL": "Netherlands", "NO": "Norway", "NA": "Namibia", "VU": "Vanuatu", "NC": "New Caledonia", "NE": "Niger", "NF": "Norfolk Island", "NG": "Nigeria", "NZ": "New Zealand", "NP": "Nepal", "NR": "Nauru", "NU": "Niue", "CK": "Cook Islands", "CI": "Cote d'Ivoire", "CH": "Switzerland", "CO": "Colombia", "CN": "China", "CM": "Cameroon", "CL": "Chile", "CC": "Cocos (Keeling) Islands", "CA": "Canada", "CG": "Congo", "CF": "Central African Republic", "CD": "Congo, The Democratic Republic of the", "CZ": "Czech Republic", "CY": "Cyprus", "CX": "Christmas Island", "CR": "Costa Rica", "CV": "Cape Verde", "CU": "Cuba", "SZ": "Swaziland", "SY": "Syrian Arab Republic", "KG": "Kyrgyzstan", "KE": "Kenya", "SR": "Suriname", "KI": "Kiribati", "KH": "Cambodia", "KN": "Saint Kitts and Nevis", "KM": "Comoros", "ST": "Sao Tome and Principe", "SK": "Slovakia", "KR": "Korea, Republic of", "SI": "Slovenia", "KP": "Korea, Democratic People's Republic of", "KW": "Kuwait", "SN": "Senegal", "SM": "San Marino", "SL": "Sierra Leone", "SC": "Seychelles", "KZ": "Kazakhstan", "KY": "Cayman Islands", "SG": "Singapore", "SE": "Sweden", "SD": "Sudan", "DO": "Dominican Republic", "DM": "Dominica", "DJ": "Djibouti", "DK": "Denmark", "VG": "Virgin Islands, British", "DE": "Germany", "YE": "Yemen", "DZ": "Algeria", "US": "United States", "UY": "Uruguay", "YT": "Mayotte", "UM": "United States Minor Outlying Islands", "LB": "Lebanon", "LC": "Saint Lucia", "LA": "Lao People's Democratic Republic", "TV": "Tuvalu", "TW": "Taiwan", "TT": "Trinidad and Tobago", "TR": "Turkey", "LK": "Sri Lanka", "LI": "Liechtenstein", "A1": "Anonymous Proxy", "TO": "Tonga", "LT": "Lithuania", "A2": "Satellite Provider", "LR": "Liberia", "LS": "Lesotho", "TH": "Thailand", "TF": "French Southern Territories", "TG": "Togo", "TD": "Chad", "TC": "Turks and Caicos Islands", "LY": "Libyan Arab Jamahiriya", "VA": "Holy See (Vatican City State)", "VC": "Saint Vincent and the Grenadines", "AE": "United Arab Emirates", "AD": "Andorra", "AG": "Antigua and Barbuda", "AF": "Afghanistan", "AI": "Anguilla", "VI": "Virgin Islands, U.S.", "IS": "Iceland", "IR": "Iran, Islamic Republic of", "AM": "Armenia", "AL": "Albania", "AO": "Angola", "AN": "Netherlands Antilles", "AQ": "Antarctica", "AP": "Asia/Pacific Region", "AS": "American Samoa", "AR": "Argentina", "AU": "Australia", "AT": "Austria", "AW": "Aruba", "IN": "India", "AX": "Aland Islands", "AZ": "Azerbaijan", "IE": "Ireland", "ID": "Indonesia", "UA": "Ukraine", "QA": "Qatar", "MZ": "Mozambique"}, function(k, v) {
            countries.push({id: k, text: v});
        }); 

        $('#Activity').editable({
            title: 'Select activity',
            source: '/api/hierarchies/list/Activity',
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select activity',
                allowClear: true,
                sortResults: function(results, container, query) {
                        if (query.term) {
                            // use the built in javascript sort function
                            return results.sort(function(a, b) {
                                if (a.text.length > b.text.length) {
                                    return 1;
                                } else if (a.text.length < b.text.length) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            });
                        }
                        return results;
                    }
            },
            success: function(response, newValue) {
                $scope.KPI.activity = newValue;
                console.log($scope.KPI.activity );

            }
        }); 

        $('#Context').editable({
            title: 'Select context',
            source: '/api/hierarchies/list/Context',
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select context',
                allowClear: true
            },
            success: function(response, newValue) {
                $scope.KPI.context = newValue;
                console.log($scope.KPI.context );

            }
        }); 

        $('#Axe').editable({
            title: 'Select axe',
            source: countries,
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select axe',
                allowClear: true
            }, 
            success: function(response, newValue) {
                $scope.KPI.axe = newValue;
                console.log($scope.KPI.axe );

            }
        }); 


        $('#Tags').editable({
            title: 'Select tags',
            type: 'select2',
            select2: {
                tags: ['html', 'javascript', 'css', 'ajax'],
                tokenSeparators: [",", " "]
            },
            inputclass: 'input-large',
            success: function(response, newValue) {
                  $scope.KPI.tags = newValue;
            }
        }); 

        $('#Action').editable({
            title: 'Select action',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: actionKPI,
            success: function(response, newValue) {
                  $scope.KPI.action = newValue;
            }
        }); 

        $('#type').editable({
            title: 'Select action',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: [
              {value: 'mean', text: 'mean'},
              {value: 'sum', text: 'sum'},
              {value: 'list', text: 'list'}
             ],
            success: function(response, newValue) {
                  $scope.KPI.action = newValue;
            }
        }); 

        $('#refresh').editable({
            title: 'Select refresh interval (days)',
            type: 'number',
            inputclass: 'input-small',
            success: function(response, newValue) {
                  $scope.KPI.refresh = newValue;
            }
        }); 

        $('#Category').editable({
            title: 'Select Category',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: categoryKPI,
            success: function(response, newValue) {
                  $scope.KPI.category = newValue;
            }
        }); 
    };





});
