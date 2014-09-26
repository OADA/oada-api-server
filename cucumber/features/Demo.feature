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

Feature: Get resources
  Retrieves list of resources such as machines, locations
  or other type of data streams.

  Scenario: Get configurations for harvesters
    Given the client is logged in
    And the client is authorized
    When the client requests "configurations" for "machines" that are "harvesters"
    Then the response contains 1 or more items
    And each item has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |  _href     | link to data stream                    |
  
 
  Scenario: Get available information about one of the machine
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.
  
    Given the client is logged in
    And the client is authorized
    When the client requests for the harvester with VIN "4000AA"
    And the response contains at least the following information:
    | ATTRIBUTE      | DESCRIPTION                        |
    | serial_number  | Serial number of the vehicle       |
    | model_year     | Model Year                         |
    | model          | Model Name                         |
    | name           | Name of the harvester              |
    | streams        | Stream of useful data              |
    And the response is a "configuration"
    And each item in "streams" has the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |  _href     | link to data stream                    |

  Scenario: Get geofence stream
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "geofence" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the "events" attribute contains 0 or more item
    And each item in "events" has the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |      t     | timestamp of stream                    |
    |    field   | field information                      |
    And the "field" of each item in "events" contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |   _oada    | .. 			 	   	  |
    |    name    | human-readable name of the field       |
  Scenario: Get swath width
    Given the client is logged in
    And the client is authorized
    When the client requests a "swath_width" stream for harvester with VIN "4000AA"
    Then the response is a "resource" 
    And the response contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  units     | unit stream   	 	   	  |
    |  widths    | width stream			   	  |
    And the "widths" attribute contains 1 or more item
    And each item in "widths" has the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  t         | timestamp 			 	  |
    |  width     | width  			          |
   
