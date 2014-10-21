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


