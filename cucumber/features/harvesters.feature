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





