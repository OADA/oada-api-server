#
# Copyright 2014 Open Ag Data Alliance
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#

Feature: Get Fields with and without view
  
  Scenario: Go to fields bookmark endpoint with no view parameter
    Retrieves the boundary coordinates of all fields in this oada cloud
    Given the client is authorized
    When the client requests the "fields" bookmark without view parameter
    And the response is a "configuration"  
    And each item has just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           | id of the field resources          |

  Scenario: Go to fields bookmarks finder endpoint with view GET parameter to expand responses
    Retrieves the boundary coordinates of all fields in this oada cloud
    Given the client is authorized
    When the client requests the "fields" bookmark with view parameter
    And the response is a "configuration"  
    And each item has just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           | id of the field resources          |
    | boundary      | bounding coordinates               |
    | name          | human-readable field name          |
    | crop          |                                    |
    And each item in "boundary" has at least the following information:
    | ATTRIBUTE     | DESCRIPTION    |
    | coordinates   |                |
    | type          |                |
    And each key has a valid resource with just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | boundary      | bounding coordinates               |
    | name          | human-readable field name          |
    | crop          |                                    |

Feature: Get harvesters bookmark

  Scenario: Go to harvesters bookmarks endpoint with no view parameter
    test that what comes back is an object with one key in it, and the value at that key is an object with only an "_id" key

    Given the client is authorized
    When the client requests the "machines/harvesters" bookmark without view parameter
    And each item has just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           | id of the field resources          |

  Scenario: Go to the harvesters bookmarks endpoint 
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.

    Given the client is authorized
    When the client requests for the harvester with identifier "4727"
    And the response contains at least the following information:
    | ATTRIBUTE      | DESCRIPTION                        |
    | serial_number  | Serial number of the vehicle       |
    | model_year     | Model Year                         |
    | model          | Model Name                         |
    | name           | Name of the harvester              |
    | streams        | Stream of useful data              |
    And the response is a "configuration"
    And each item in "streams" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |  _id       | link to data stream                    |




Feature: Get resources WITHOUT view parameters
  Scenario: Get swath width stream (1236) without view
    Given the client is authorized
    When the client requests a "swath_width" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  units     | unit stream   	 	   	  |
    |  widths    | width stream			   	  |
    And the "widths" attribute contains 1 or more item
    And each item in "widths" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  t         | timestamp 			 	  |
    |  width     | width  			          |

  Scenario: Get work status stream (1238)  without view
    Given the client is authorized
    When the client requests a "work_status" stream for harvester with identifier "4727" without view parameter A
    And the "status" attribute contains 1 or more item
    And the response contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                |
    |   status                 | Array                      |
    And each item in "positions" has at least the following information:
    | ATTRIBUTE          |
    |  _meta             |
    |  t                 |
    |  case              |

  Scenario: Get wet_mass_flow stream (resource 1239) without view
    Given the client is authorized
    When the client requests a "wet_mass_flow" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information: 
    | ATTRIBUTE          | DESCRIPTION                |
    |  units             |                            |
    |  flows             |                            |
    And each item in "flows" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |        t           |
    |      flow          |

  Scenario: Get the moisture stream (1240) without view
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information: 
    | ATTRIBUTE          | DESCRIPTION                |
    |       units        |                            |
    |       moisture     |                            |
    And each item in "moisture" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |       moisture     |
    |       t            |
    And the "_meta" of each item in "moisture" contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                         |
    |   _changeId              | What revision are these data        |

Feature: Get resources without view parameter
  Scenario: Get geofence stream (1241) without view
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.

    Given the client is authorized
    When the client requests a "geofence" stream for harvester with identifier "4727" without view parameter A
    And the "events" attribute contains 1 or more item
    And each item in "events" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |      t     | timestamp of stream                    |
    |    field   | field information                      |
    And the "field" of each item in "events" contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |   _id      | ..                                     |
    |    name    | human-readable name of the field       |

  Scenario: Get swath width stream (1236) without view
    Given the client is authorized
    When the client requests a "swath_width" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION                |
    |  units     | unit stream                |
    |  widths    | width stream               |
    And the "widths" attribute contains 1 or more item
    And each item in "widths" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                |
    |  t         | timestamp                  |
    |  width     | width                      |

  Scenario: Get location stream (1237)  without view
    Given the client is authorized
    When the client requests a "location" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information: 
    | ATTRIBUTE                | DESCRIPTION                |
    |   coordinate_system      | what coordinate system     |
    |   locations              | action data array          |
    And the "locations" attribute contains 1 or more item
    And each item in "locations" has at least the following information:
    | ATTRIBUTE            | 
    |  _meta               |
    |  t                   |
    |  lat                 |
    |  lon                 |
    |  alt                 |
  
  Scenario: Get work status stream (1238)  without view
    Given the client is authorized
    When the client requests a "work_status" stream for harvester with identifier "4727" without view parameter A
    And the "status" attribute contains 1 or more item
    And the response contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                |
    |   status                 | Array                      |
    And each item in "positions" has at least the following information:
    | ATTRIBUTE          |
    |  _meta             |
    |  t                 |
    |  case              |

  Scenario: Get wet_mass_flow stream (resource 1239) without view
    Given the client is authorized
    When the client requests a "wet_mass_flow" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information: 
    | ATTRIBUTE          | DESCRIPTION                |
    |  units             |                            |
    |  flows             |                            |
    And each item in "flows" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |        t           |
    |      flow          |

Feature: Get resources WITH various view parameters
  Scenario: Get the moisture stream (1240) with filtering changeId > 0 
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" with view parameter A
    And the response contains at least the following information: 
    |    ATTRIBUTE       |     DESCRIPTION            |
    |       units        |                            |
    |       moisture     |                            |
    And each item in "moisture" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |       moisture     |
    |       t            |
    And the "moisture" attribute contains 1 or more item
    And the "_meta" of each item in "moisture" contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                         |
    |   _changeId              | What revision are these data        |
  
  # Scenario: Get the moisture stream (1240) with filtering changeId > max - 1 
  #   Given the client is authorized
  #   When the client requests a "moisture" stream for harvester with identifier "4727" with view parameter B
  #   And the response contains at least the following information: 
  #   |    ATTRIBUTE       |     DESCRIPTION            |
  #   |       units        |                            |
  #   |       moisture     |                            |
  #   And the "moisture" attribute contains 1 or more item
  #   And each item in "moisture" has at least the following information:
  #   |     ATTRIBUTE      |
  #   |       _meta        |
  #   |       moisture     |
  #   |       t            |
  #   And the "_meta" of each item in "moisture" contains at least the following information:
  #   | ATTRIBUTE                | DESCRIPTION                         |
  #   |   _changeId              | What revision are these data        |


  # Scenario: Get geofence stream (1241) and verify that the data make sense
  #   Retrieves the geofence data with view and check for enter/exit pairs.

  #   Given the client is authorized
  #   When the client requests a "geofence" stream for harvester with identifier "4727" with view parameter 1 
  #   And the "events" attribute contains 1 or more item
  #   And the 1st event for any particular field in this sorted array is an "enter" event
  #   And the 2nd event (if any exit) for a particular field is an "exit" event
  #   And there are no subsequent enter events for a particular field before exiting that field
  #   And there are no subsequent exit events for a particular field before entering that field
  #   And each item in "events" has at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION                            |
  #   |      t     | timestamp of stream                    |
  #   |    field   | field information                      |
  #   And the "field" of each item in "events" contains at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION                            |
  #   |   _id      | ..                                     |
  #   |    name    | human-readable name of the field       |

