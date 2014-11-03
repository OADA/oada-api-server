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

Feature: Get Fields without view

  Scenario: Fields bookmark with NO view parameter
    Given the client is authorized
    When the client requests the "fields" bookmark without view parameter
    Then the response contains 1 or more items
    And each item has just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           |  the _id of the linked field       |

