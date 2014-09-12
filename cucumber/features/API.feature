Feature: Get resources
  Retrieves list of resources such as machines, locations
  or other type of data streams.

  Scenario: Get configurations for harvesters
    Given the client is logged in
    And the client is authorized
    When the client requests "configurations" for "machines" that are "harvesters"
    Then the response is a "configuration"
    And each "machine" has the following attributes:
      | ATTRIBUTE | DESCRIPTION                      |
      | formats   | describes the format of the data |
      | meta      | contains metadata                |
      | data      | contains stream of data          |
    And the "meta" attribute of each "machine" contains the following information:
      | ATTRIBUTE     |
      | serial_number |
      | model_year    |
      | model         |
      | name          |
    And the "formats" attribute contains the following information:
      | ATTRIBUTE                                |   DESCRIPTION                            |
      | vnd.oada.machines.harvester+json         |   harvester stream format id for oada    |
    And the "data" attribute of each "machine" contains the following information:
      | ATTRIBUTE     | DESCRIPTION      |
      | streams       | resource streams |
    And the "streams" attribute contains the following information:
      | ATTRIBUTE       |
      | swath_width     |
      | location        |
      | header_position |
      | wet_mass_flow   |
      | moisture        |
      | geofence        |
      
      
      
  Scenario: Get geofence stream
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "geofence" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the response contains the following information:
    | ATTRIBUTE | DESCRIPTION                        |
    | data      | resource for geofence stream item  |
    | formats   | specifies the format of the data   |
    | meta      | other information like units. etc. |
    | _href     | current document location          |
    | _etag     | md5 hash sum of current document   |
    | _changeId | revision number                    |
    And the "data" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | _etag      | md5 hash sum of data document          |
    | _format    | specifies the format of the data       |
    | _href      | other information like units. etc.     |
    | items      | actual data in this resource stream    |
    And the "items" attribute contains 0 or more item
  
  Scenario: Get swath width stream
    Retrieves the swath width data for specified machine .
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "swath_width" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the response contains the following information:
    | ATTRIBUTE | DESCRIPTION                        |
    | data      | swath_width data.                  |
    | formats   | specifies the format of the data   |
    | meta      | other information like units. etc. |
    | _href     | current document location          |
    | _etag     | md5 hash sum of current document   |
    | _changeId | revision number                    |
    And the "data" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | _etag      | md5 hash sum of data document          |
    | _format    | specifies the format of the data       |
    | _href      | other information like units. etc.     |
    | _changeId  | revision number                        |
    | items      | actual data in this resource stream    |
    And the "items" attribute contains 0 or more item
    And each item in "items" has the following information:
    | ATTRIBUTE  | DESCRIPTION      |
    | _id        | just id          |
    | time       | just timestamp   |
    | width      | swath_width      |
    And the "meta" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | units      | units of data resource                 |


  Scenario: Get moisture stream
    Retrieves the moisture data for specified machine  .
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "moisture" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the response contains the following information:
    | ATTRIBUTE | DESCRIPTION                        |
    | data      | swath_width data.                  |
    | formats   | specifies the format of the data   |
    | meta      | other information like units. etc. |
    | _href     | current document location          |
    | _etag     | md5 hash sum of current document   |
    | _changeId | revision number                    |
    And the "data" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | _etag      | md5 hash sum of data document          |
    | _format    | specifies the format of the data       |
    | _href      | other information like units. etc.     |
    | _changeId  | revision number                        |
    | items      | actual data in this resource stream    |
    And the "items" attribute contains 0 or more item
    And each item in "items" has the following information:
    | ATTRIBUTE  | DESCRIPTION      |
    | _id        | just id          |
    | time       | just timestamp   |
    | percent    | your data        |
    And the "meta" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | units      | units of data resource                 |

  Scenario: Get header position stream
    Retrieves the header position for specified machine  .
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "header_position" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the response contains the following information:
    | ATTRIBUTE | DESCRIPTION                        |
    | data      | swath_width data.                  |
    | formats   | specifies the format of the data   |
    | meta      | other information like units. etc. |
    | _href     | current document location          |
    | _etag     | md5 hash sum of current document   |
    | _changeId | revision number                    |
    And the "data" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | _etag      | md5 hash sum of data document          |
    | _format    | specifies the format of the data       |
    | _href      | other information like units. etc.     |
    | _changeId  | revision number                        |
    | items      | actual data in this resource stream    |
    And the "items" attribute contains 0 or more item
    And each item in "items" has the following information:
    | ATTRIBUTE  | DESCRIPTION      |
    | _id        | just id          |
    | time       | just timestamp   |
    | position   | your data        |
    And the "meta" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | units      | units of data resource                 |

  Scenario: Get location stream
    Retrieves the header position for specified machine  .
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "location" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the response contains the following information:
    | ATTRIBUTE | DESCRIPTION                        |
    | data      | swath_width data.                  |
    | formats   | specifies the format of the data   |
    | meta      | other information like units. etc. |
    | _href     | current document location          |
    | _etag     | md5 hash sum of current document   |
    | _changeId | revision number                    |
    And the "data" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | _etag      | md5 hash sum of data document          |
    | _format    | specifies the format of the data       |
    | _href      | other information like units. etc.     |
    | _changeId  | revision number                        |
    | items      | actual data in this resource stream    |
    And the "formats" attribute contains the following information:
    | ATTRIBUTE                                | DESCRIPTION                            |
    | vnd.oada.harvester.streams.location      | location stream format id for oada     |
    And the "items" attribute contains 0 or more item
    And each item in "items" has the following information:
    | ATTRIBUTE  | DESCRIPTION      |
    | _id        | just id          |
    | time       | just timestamp   |
    | location   | coordinate       |
    And the "meta" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | units      | units of data resource                 |

  Scenario: Get wet mass flow stream
    Retrieves the header position for specified machine  .
  
    Given the client is logged in
    And the client is authorized
    When the client requests a "wet_mass_flow" stream for harvester with VIN "4000AA"
    Then the response is a "resource"
    And the response contains the following information:
    | ATTRIBUTE | DESCRIPTION                        |
    | data      | swath_width data.                  |
    | formats   | specifies the format of the data   |
    | meta      | other information like units. etc. |
    | _href     | current document location          |
    | _etag     | md5 hash sum of current document   |
    | _changeId | revision number                    |
    And the "data" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | _etag      | md5 hash sum of data document          |
    | _format    | specifies the format of the data       |
    | _href      | other information like units. etc.     |
    | _changeId  | revision number                        |
    | items      | actual data in this resource stream    |
    And the "formats" attribute contains the following information:
    | ATTRIBUTE                                     | 
    | vnd.oada.harvester.streams.wet_mass_flow      |
    And the "items" attribute contains 0 or more item
    And each item in "items" has the following information:
    | ATTRIBUTE  | DESCRIPTION      |
    | _id        | just id          |
    | time       | just timestamp   |
    | gram       | weight in gram   |
    And the "meta" attribute contains the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    | units      | units of data resource                 |



