Feature: Get harvesters bookmark without view

  Scenario: Go to harvesters bookmarks endpoint
    Test that what comes back is an object with one key in it, and the value at that key is an object 
    with only an "_id" key

    Given the client is authorized
    When the client requests the "machines/harvesters" bookmark without view parameter specified
    Then the response contains 1 or more items
    And each item has just the following information:
    | ATTRIBUTE     | DESCRIPTION                        |
    | _id           | id of the harvester resource       |


