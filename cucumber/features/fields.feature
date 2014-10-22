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

  Scenario: Fields bookmark with NO view parameter
    Given the client is authorized
    When the client requests the "fields" bookmark without view parameter
    And the response contains at least the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           | id of the field resources          |
    | fields        | Array of fields                    |

  Scenario: Fields bookmark WITH view parameter and follow its key
    Given the client is authorized
    When the client requests the "fields" bookmark with view parameter
    And each item in "fields" has at least the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           | id of the field resources          |
    | boundary      | bounding coordinates               |
    | name          | human-readable field name          |
    | crop          |                                    |
    And the "boundary" of each item in "fields" contains at least the following information:
    | ATTRIBUTE     | DESCRIPTION    |
    | coordinates   |                |
    | type          |                |
    And each key in "fields" has a valid resource with just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | boundary      | bounding coordinates               |
    | name          | human-readable field name          |
    | crop          |                                    |
