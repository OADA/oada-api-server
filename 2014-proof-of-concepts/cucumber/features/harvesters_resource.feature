Feature: Get harvester resource

  Scenario: Get the harvester resource
    Using a hard-coded ID for the harvester resource (4727), get that resource and make sure it has the
    proper keys for a harvester document.

    Given the client is authorized
    When the client requests for the harvester with identifier "4727"
    Then the response contains at least the following information:
    | ATTRIBUTE      | DESCRIPTION                          |
    | serial_number  | Serial number of the vehicle         |
    | model_year     | Model Year                           |
    | model          | Model Name                           |
    | name           | Name of the harvester                |
    | streams        | links to individual resoruce streams |
    And each item in "streams" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |  _id       | link to data stream                    |

