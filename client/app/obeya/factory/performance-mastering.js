'use strict';

angular.module('boardOsApp').factory('generator', function($rootScope, $http) {

  function quantiOvertimeChartData() {

    $http.get('/api/taskFulls/countByMonth', {
      params: {
        filterPerimeter: $rootScope.filterPerimeter
      }
    }).success(function(tasks) {
      console.log('tasks', tasks);
      var taskNb = _.map(tasks, function(task) {
        return task.value.count;
      });
      console.log('taskNb', taskNb);
      return taskNb;
    }).error(function(err) {
      console.log('err', err);
    });
  }
  function quantiChartData() {

    return [
      {
        dataDragging: false, // need this to enable drag
        values: [
          20, 40
        ],
        goals: [
          25, 43
        ],
        goal: {
          backgroundColor: '#64b5f6',
          borderWidth: 0
        },
        rules: [
          { // rules for color
            rule: '%v >= %g', // if greater than goal
            backgroundColor: '#81c784'
          }, {
            rule: '%v < %g/2', // if less than half goal
            backgroundColor: '#ef5350'
          }, {
            rule: '%v >= %g/2 && %v < %g', // if in between
            backgroundColor: '#ffca28'
          }
        ]
      }
    ];
  }
  function qualiChartData() {
    return [
      {
        dataDragging: false, // need this to enable drag
        values: [
          99, 112, 83
        ],
        goals: [
          100, 100, 100
        ],
        goal: {
          backgroundColor: '#a9b1b8',
          borderWidth: 0
        },
        rules: [
          { // rules for color
            rule: '%v >= %g*0.9 && %v <= %g*1.1', // if greater than goal
            backgroundColor: '#81c784'
          }, {
            rule: '%v < %g/2', // if less than half goal
            backgroundColor: '#ef5350'
          }, {
            rule: '%v < %g*0.9', // if in between
            backgroundColor: '#ffca28'
          }, {
            rule: '%v > %g*1.1', // if in between
            backgroundColor: '#2f634e'
          }
        ]
      }
    ];
  }
  /* Random Data Generator */
  function lineChartData() {

    var sin = [],
      sin2 = [],
      cos = [];

    //Data is represented as an array of {x,y} pairs.
    for (var i = 0; i < 100; i++) {
      sin.push({
        x: i,
        y: Math.sin(i / 10)
      });
      sin2.push({
        x: i,
        y: (i % 10 === 5)
          ? null
          : Math.sin(i / 10) * 0.25 + 0.5
      });
      cos.push({
        x: i,
        y: 0.5 * Math.cos(i / 10 + 2) + Math.random() / 10
      });
    }

    //Line chart data should be sent as an array of series objects.
    return [
      {
        values: sin, //values - represents the array of {x,y} data points
        key: 'Sine Wave', //key  - the name of the series.
        color: '#ff7f0e' //color - optional: choose your own line color.
      }, {
        values: cos,
        key: 'Cosine Wave',
        color: '#2ca02c'
      }, {
        values: sin2,
        key: 'Another sine wave',
        color: '#7777ff',
        area: true //area - set to true if you want this line to turn into a filled area chart.
      }
    ];
  }
  function cumulativeChartData() {
    return [
      {
        key: 'Long',
        values: [
          [1083297600000, -2.974623048543]
        ],
        mean: 250
      }, {
        key: 'Short',
        values: [
          [1083297600000, -0.77078283705125]
        ],
        mean: -60
      }, {
        key: 'Gross',
        mean: 125,
        values: [
          [1083297600000, -3.7454058855943]
        ]
      }, {
        key: 'S&P 1500',
        values: [
          [1083297600000, -1.7798428181819]
        ]
      }
    ];
  }
  function stackedAreaChartData() {
    return [
      {
        'key': 'North America',
        'values': [
          [1025409600000, 23.041422681023]
        ]
      }, {
        'key': 'Africa',
        'values': [
          [1025409600000, 7.9356392949025]
        ]
      }, {
        'key': 'South America',
        'values': [
          [1025409600000, 7.9149900245423]
        ]
      }, {
        'key': 'Asia',
        'values': [
          [1025409600000, 13.153938631352]
        ]
      }, {
        'key': 'Europe',
        'values': [
          [1025409600000, 9.3433263069351]
        ]
      }, {
        'key': 'Australia',
        'values': [
          [1025409600000, 5.1162447683392]
        ]
      }, {
        'key': 'Antarctica',
        'values': [
          [1025409600000, 1.3503144674343]
        ]
      }
    ];
  }
  function discreteBarChartData() {
    return [
      {
        key: 'Cumulative Return',
        values: [
          {
            'label': 'A',
            'value': -29.765957771107
          }, {
            'label': 'B',
            'value': 0
          }, {
            'label': 'C',
            'value': 32.807804682612
          }, {
            'label': 'D',
            'value': 196.45946739256
          }, {
            'label': 'E',
            'value': 0.19434030906893
          }, {
            'label': 'F',
            'value': -98.079782601442
          }, {
            'label': 'G',
            'value': -13.925743130903
          }, {
            'label': 'H',
            'value': -5.1387322875705
          }
        ]
      }
    ];
  }
  function pieChartData() {
    return [
      {
        key: 'One',
        y: 5
      }, {
        key: 'Two',
        y: 2
      }, {
        key: 'Three',
        y: 9
      }, {
        key: 'Four',
        y: 7
      }, {
        key: 'Five',
        y: 4
      }, {
        key: 'Six',
        y: 3
      }, {
        key: 'Seven',
        y: 0.5
      }
    ];
  }
  function boxPlotChartData() {
    return [
      {
        label: 'A',
        values: {
          Q1: 180,
          Q2: 200,
          Q3: 250,
          whisker_low: 115,
          whisker_high: 400,
          outliers: [50, 100, 425]
        }
      }, {
        label: 'B',
        values: {
          Q1: 300,
          Q2: 350,
          Q3: 400,
          whisker_low: 225,
          whisker_high: 425,
          outliers: [175, 450, 480]
        }
      }, {
        label: 'C',
        values: {
          Q1: 100,
          Q2: 200,
          Q3: 300,
          whisker_low: 25,
          whisker_high: 400,
          outliers: [450, 475]
        }
      }, {
        label: 'D',
        values: {
          Q1: 75,
          Q2: 100,
          Q3: 125,
          whisker_low: 50,
          whisker_high: 300,
          outliers: [450]
        }
      }, {
        label: 'E',
        values: {
          Q1: 325,
          Q2: 400,
          Q3: 425,
          whisker_low: 225,
          whisker_high: 475,
          outliers: [50, 100, 200]
        }
      }
    ];
  }

  return {

    quantiChart: {
      options: function() {
        return {
          'graphset': [
            { // chart configuration
              type: 'vbullet',
              scaleX: {
                labels: [
                  'Tasks', 'Workload'
                ],
                mediaRules: [
                  {
                    maxWidth: 350,
                    maxItems: 3,
                    label: {
                      fontSize: 12
                    },
                    item: {
                      fontSize: 9
                    }
                  }, {
                    maxWidth: 300,
                    label: {
                      visible: false
                    }
                  }
                ]
              },
              width: '100%',
              tooltip: { // tooltip changes based on value
                fontSize: 14,
                borderRadius: 3,
                borderWidth: 0,
                shadow: true
              },
              plot: {
                valueBox: [
                  {
                    type: 'all',
                    color: '#000',
                    placement: 'goal',
                    text: '[%node-value / %node-goal-value]'
                  }
                ]
              },
              series: quantiChartData()
            }
          ]
        };

      }
    },

    qualiChart: {
      options: function() {
        return {
          'graphset': [
            { // chart configuration
              type: 'vbullet',
              scaleX: {
                labels: [
                  'Quality', 'Cost', 'Time'
                ],
                mediaRules: [
                  {
                    maxWidth: 350,
                    maxItems: 3,
                    label: {
                      fontSize: 12
                    },
                    item: {
                      fontSize: 9
                    }
                  }, {
                    maxWidth: 300,
                    label: {
                      visible: false
                    }
                  }
                ]
              },
              width: '100%',
              tooltip: { // tooltip changes based on value
                fontSize: 14,
                borderRadius: 3,
                borderWidth: 0,
                shadow: true
              },
              plot: {
                valueBox: [
                  {
                    type: 'all',
                    color: '#000',
                    placement: 'goal',
                    text: '[%node-value / %node-goal-value]'
                  }
                ]
              },
              series: qualiChartData()
            }
          ]
        };

      }
    },

    lineChart: {
      options: function() {
        return {
          'graphset': [
            {
              'type': 'line',
              'utc': true,
              'title': {
                'y': '7px',
                'text': 'Webpage Analytics',
                'font-size': '24px',
                'font-color': 'white',
                'height': '25px'
              },
              'legend': {
                'layout': 'float',
                'background-color': 'none',
                'border-width': 0,
                'shadow': 0,
                'width': '100%',
                'text-align': 'middle',
                'x': '0%',
                'y': '0%',
                'item': {
                  'font-size': '14px'
                }
              },
              'scale-x': {
                'min-value': 1383292800000,
                'shadow': 0,
                'step': 3600000 * 24,
                'line-color': '#222222',
                'tick': {
                  'line-color': '#222222'
                },
                'guide': {
                  'line-color': '#222222'
                },
                'item': {
                  'font-color': '#222222'
                },
                'transform': {
                  'type': 'date',
                  'all': '%D, %d %M',
                  'guide': {
                    'visible': false
                  },
                  'item': {
                    'visible': false
                  }
                },
                'label': {
                  'visible': false
                },
                'minor-ticks': 0
              },
              'scale-y': {
                'values': '0:500:100',
                'line-color': '#222222',
                'shadow': 0,
                'tick': {
                  'line-color': '#222222'
                },
                'guide': {
                  'line-color': '#222222',
                  'line-style': 'dashed'
                },
                'item': {
                  'font-color': '#222222'
                },
                'minor-ticks': 0,
                'thousands-separator': ' '
              },
              'crosshair-x': {
                'line-color': '#222222',
                'plot-label': {
                  'border-radius': '5px',
                  'border-width': '1px',
                  'border-color': '#222222',
                  'padding': '10px',
                  'font-weight': 'bold'
                },
                'scale-label': {
                  'font-color': '#00baf0',
                  'background-color': '#222222',
                  'border-radius': '5px'
                }
              },
              'tooltip': {
                'visible': false
              },
              'plot': {
                'tooltip-text': '%t views: %v<br>%k',
                'shadow': 0,
                'line-width': '3px',
                'marker': {
                  'type': 'circle',
                  'size': 3
                },
                'hover-marker': {
                  'type': 'circle',
                  'size': 4,
                  'border-width': '1px'
                }
              },
              'series': [
                {
                  'values': quantiOvertimeChartData(),
                  'text': 'Tasks',
                  'line-color': '#c7a1e8',
                  'legend-marker': {
                    'type': 'circle',
                    'size': 5,
                    'border-width': 1,
                    'shadow': 0,
                    'border-color': '#785d90'
                  },
                  'marker': {
                    'background-color': '#c7a1e8',
                    'border-width': 1,
                    'shadow': 0,
                    'border-color': '#785d90'
                  }
                }, {
                  'values': quantiOvertimeChartData(),
                  'text': 'Workload',
                  'line-color': '#a2d6ec',
                  'legend-marker': {
                    'type': 'circle',
                    'size': 5,
                    'background-color': '#a2d6ec',
                    'border-width': 1,
                    'shadow': 0,
                    'border-color': '#729bac'
                  },
                  'marker': {
                    'background-color': '#a2d6ec',
                    'border-width': 1,
                    'shadow': 0,
                    'border-color': '#729bac'
                  }
                }
              ]
            }
          ]
        };
      },
      data: lineChartData
    },
    treemap: {
      options: function() {
        return {
          'graphset': [
            {
              type: 'treemap',
              options: {
                aspectType: 'palette',
                'max-children': [
                  4, 4, 4
                ],
                'tooltip-box': {
                  'text': '$%value spent on %text each year'
                }
              },
              series: [
                {
                  text: 'HOUSING',
                  value: 8963.00,
                  'data-catagory': 'Housing',
                  box: {
                    fontSize: 20
                  },
                  children: [
                    {
                      text: 'Shelter',
                      value: 5452.00,
                      'data-catagory': 'Housing',
                      children: [
                        {
                          text: 'Rented dwellings',
                          value: 3583.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Property taxes',
                          value: 655.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Mortgage interest and charges',
                          value: 629.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Maintenance, rep., ins., oth. exp., owend dwelling',
                          value: 629.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Other lodging',
                          value: 140.00,
                          'data-catagory': 'Housing'
                        }
                      ]
                    }, {
                      text: 'UTILITIES, FUELS, AND PUBLIC SERVICES',
                      value: 2197.00,
                      'data-catagory': 'Housing',
                      children: [
                        {
                          text: 'Electricity',
                          value: 971.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Telephone services',
                          value: 653.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Cellular phone service',
                          value: 405.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Water and other public services',
                          value: 287.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Residential phone service, VOIP, and phone cards',
                          value: 248.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Natural gas',
                          value: 217.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Fuel oil and other',
                          value: 69.00,
                          'data-catagory': 'Housing'
                        }
                      ]
                    }, {
                      text: 'HOUSEHOLD FURNISHINGS',
                      value: 588.00,
                      'data-catagory': 'Housing',
                      children: [
                        {
                          text: 'Misc. household equipment',
                          value: 278.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Furniture',
                          value: 124.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Major appliances',
                          value: 74.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Household textiles',
                          value: 56.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Small appliances, misc. housewares',
                          value: 50.00,
                          'data-catagory': 'Housing'
                        }
                      ]
                    }, {
                      text: 'HOUSEHOLD OPERATIONS',
                      value: 401.00,
                      'data-catagory': 'Housing',
                      children: [
                        {
                          text: 'Other household expenses',
                          value: 312.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Personal services',
                          value: 89.00,
                          'data-catagory': 'Housing'
                        }
                      ]
                    }, {
                      text: 'HOUSEKEEPING SUPPLIES',
                      value: 325.00,
                      'data-catagory': 'Housing',
                      children: [
                        {
                          text: 'Other household expenses',
                          value: 312.00,
                          'data-catagory': 'Housing'
                        }, {
                          text: 'Personal services',
                          value: 89.00,
                          'data-catagory': 'Housing'
                        }
                      ]
                    }
                  ]
                }, {
                  text: 'FOOD',
                  value: 3655.00,
                  'data-catagory': 'Food',
                  children: [
                    {
                      text: 'FOOD AT HOME',
                      value: 2514.00,
                      'data-catagory': 'Food',
                      children: [
                        {
                          text: 'Miscellaneous foods',
                          value: 436.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Nonalcoholic beverages',
                          value: 256.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Sugar and other sweets',
                          value: 84.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Fats and oils',
                          value: 82.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Food prep. by consumer, out-of-town trips',
                          value: 13.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Beef',
                          value: 135.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Poultry',
                          value: 120.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Pork',
                          value: 114.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Fish and seafood',
                          value: 79.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Other meats',
                          value: 73.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Eggs',
                          value: 40.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Fresh fruits',
                          value: 163.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Fresh vegetables',
                          value: 145.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Processed fruits',
                          value: 84.00,
                          'data-catagory': 'Food'
                        }, {
                          text: 'Processed vegetables',
                          value: 72.00,
                          'data-catagory': 'Food'
                        }
                      ]
                    }, {
                      text: 'Food away from home',
                      value: 1142.00,
                      'data-catagory': 'Food'
                    }
                  ]
                }, {
                  text: 'TRANSPORTATION',
                  value: 3327.00,
                  'data-catagory': 'TRANSPORTATION',
                  children: [
                    {
                      text: 'Gasoline and motor oil',
                      value: 1231.00,
                      'data-catagory': 'TRANSPORTATION'
                    }, {
                      text: 'OTHER VEHICLE EXPENSES',
                      value: 1074.00,
                      'data-catagory': 'TRANSPORTATION',
                      children: [
                        {
                          text: 'Vehicle insurance',
                          value: 546.00,
                          'data-catagory': 'TRANSPORTATION'
                        }, {
                          text: 'Vehicle maintenance and repairs',
                          value: 327.00,
                          'data-catagory': 'TRANSPORTATION'
                        }, {
                          text: 'Vehicle rend., leas., licen., oth. charges',
                          value: 149.00,
                          'data-catagory': 'TRANSPORTATION'
                        }, {
                          text: 'Vehicle financing charges',
                          value: 52.00,
                          'data-catagory': 'TRANSPORTATION'
                        }
                      ]
                    }, {
                      text: 'VEHICLE PURCHASES (NET OUTLAY)',
                      value: 1074.00,
                      'data-catagory': 'TRANSPORTATION',
                      children: [
                        {
                          text: 'Vehicle purchases: Cars and trucks, used',
                          value: 594.00,
                          'data-catagory': 'TRANSPORTATION'
                        }, {
                          text: 'Vehicle purchases: Cars and trucks, new',
                          value: 261.00,
                          'data-catagory': 'TRANSPORTATION'
                        }
                      ]
                    }, {
                      text: 'Public Transportation',
                      value: 163.00,
                      'data-catagory': 'TRANSPORTATION'
                    }
                  ]
                }, {
                  text: 'HEALTHCARE',
                  value: 1790.00,
                  'data-catagory': 'HEALTHCARE',
                  children: [
                    {
                      text: 'Health insurance',
                      value: 1094.00,
                      'data-catagory': 'HEALTHCARE'
                    }, {
                      text: 'Medical services',
                      value: 352.00,
                      'data-catagory': 'HEALTHCARE'
                    }, {
                      text: 'Drugs: Prescription and nonprescription',
                      value: 352.00,
                      'data-catagory': 'HEALTHCARE'
                    }, {
                      text: 'Medical supplies',
                      value: 63.00,
                      'data-catagory': 'HEALTHCARE'
                    }
                  ]
                }, {
                  text: 'ENTERTAINMENT',
                  value: 1002.00,
                  'data-catagory': 'ENTERTAINMENT',
                  children: [
                    {
                      text: 'Audio and visual equipment and services',
                      value: 548.00,
                      'data-catagory': 'ENTERTAINMENT'
                    }, {
                      text: 'Fees and admission',
                      value: 112.00,
                      'data-catagory': 'ENTERTAINMENT'
                    }, {
                      text: 'Other supplies, equip., & services',
                      value: 55.00,
                      'data-catagory': 'ENTERTAINMENT'
                    }, {
                      text: 'PETS, TOYS, AND PLAYGROUND EQUIPMENT',
                      value: 286.00,
                      'data-catagory': 'ENTERTAINMENT',
                      children: [
                        {
                          text: 'Pets',
                          value: 211.00,
                          'data-catagory': 'ENTERTAINMENT'
                        }, {
                          text: 'Toys, hobbies, and other equipment',
                          value: 75.00,
                          'data-catagory': 'ENTERTAINMENT'
                        }
                      ]
                    }
                  ]
                }, {
                  text: 'APPAREL',
                  value: 724.00,
                  'data-catagory': 'APPAREL',
                  children: [
                    {
                      text: 'WOMEN & GIRLS',
                      value: 302.00,
                      'data-catagory': 'APPAREL',
                      children: [
                        {
                          text: 'Girls, 2 to 15',
                          value: 42,
                          'data-catagory': 'APPAREL'
                        }, {
                          text: 'Women, 16 and over',
                          value: 260,
                          'data-catagory': 'APPAREL'
                        }
                      ]
                    }, {
                      text: 'MEN AND BOYS',
                      value: 144.00,
                      'data-catagory': 'APPAREL'
                    }, {
                      text: 'Footwear',
                      value: 140.00,
                      'data-catagory': 'APPAREL'
                    }, {
                      text: 'Children under 2',
                      value: 2.00,
                      'data-catagory': 'APPAREL'
                    }, {
                      text: 'Other appearel products and services',
                      value: 106.00,
                      'data-catagory': 'APPAREL'
                    }
                  ]
                }, {
                  text: 'CASH CONTRIBUTIONS',
                  value: 577.00,
                  'data-catagory': 'CASH CONTRIBUTIONS'
                }, {
                  text: 'EDUCATION',
                  value: 830.00,
                  'data-catagory': 'EDUCATION'
                }, {
                  text: 'INSURANCE AND PENSIONS',
                  value: 463.00,
                  'data-catagory': 'INSURANCE AND PENSIONS',
                  children: [
                    {
                      text: 'Pensions and social security',
                      value: 368.00,
                      'data-catagory': 'INSURANCE AND PENSIONS'
                    }, {
                      text: 'Life and other personal insurance',
                      value: 95.00,
                      'data-catagory': 'INSURANCE AND PENSIONS'
                    }
                  ]
                }, {
                  text: 'TOBACCO PRODUCTS AND SMOKING SUPPLIES',
                  value: 291.00,
                  'data-catagory': 'TOBACCO PRODUCTS AND SMOKING SUPPLIES'
                }, {
                  text: 'PERSONAL CARE PRODUCTS AND SERIVCES',
                  value: 275.00,
                  'data-catagory': 'PERSONAL CARE PRODUCTS AND SERIVCES'
                }, {
                  text: 'MISC. SPENDING',
                  value: 292.00,
                  'data-catagory': 'MISC. SPENDING'
                }, {
                  text: 'ALOC. BEV.',
                  value: 168.00,
                  'data-catagory': 'ALCOHOLIC BEVERAGES'
                }, {
                  text: 'READING',
                  value: 37.00,
                  'data-catagory': 'READING'
                }
              ]
            }
          ]
        };
      },
      data: cumulativeChartData
    },
    stackedAreaChart: {
      options: function() {
        return {
          chart: {
            type: 'stackedAreaChart',
            margin: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 44
            },
            x: function(d) {
              return d[0];
            },
            y: function(d) {
              return d[1];
            },
            useVoronoi: false,
            clipEdge: true,
            transitionDuration: 500,
            useInteractiveGuideline: true,
            xAxis: {
              showMaxMin: false,
              tickFormat: function(d) {
                return d3.time.format('%x')(new Date(d));
              }
            },
            yAxis: {
              tickFormat: function(d) {
                return d3.format(',.2f')(d);
              }
            }
          }
        };
      },
      data: stackedAreaChartData
    },
    discreteBarChart: {
      options: function() {
        return {
          chart: {
            type: 'discreteBarChart',
            margin: {
              top: 10,
              right: 20,
              bottom: 35,
              left: 55
            },
            x: function(d) {
              return d.label;
            },
            y: function(d) {
              return d.value;
            },
            showValues: true,
            valueFormat: function(d) {
              return d3.format(',.4f')(d);
            },
            transitionDuration: 500,
            xAxis: {
              axisLabel: 'X Axis',
              axisLabelDistance: -8
            },
            yAxis: {
              axisLabel: 'Y Axis',
              axisLabelDistance: -10
            }
          }
        };
      },
      data: discreteBarChartData
    },
    pieChart: {
      options: function() {
        return {
          chart: {
            type: 'pieChart',
            margin: {
              top: 0,
              right: 0,
              bottom: 30,
              left: 0
            },
            x: function(d) {
              return d.key;
            },
            y: function(d) {
              return d.y;
            },
            showLabels: true,
            labelSunbeamLayout: true,
            donutLabelsOutside: true,
            donutRatio: 0.3,
            donut: true,
            transitionDuration: 500,
            labelThreshold: 0.02,
            legend: {
              margin: {
                top: 5,
                right: 35,
                bottom: 0,
                left: 0
              }
            }
          }
        };
      },
      data: pieChartData
    },
    boxPlotChart: {
      options: function() {
        return {
          chart: {
            type: 'boxPlotChart',
            margin: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 40
            },
            color: [
              'darkblue', 'darkorange', 'green', 'darkred', 'darkviolet'
            ],
            x: function(d) {
              return d.label;
            },
            //y: function(d){return d.values.Q3;},
            maxBoxWidth: 55,
            yDomain: [0, 500]
          }
        };
      },
      data: boxPlotChartData
    }
  };
});
