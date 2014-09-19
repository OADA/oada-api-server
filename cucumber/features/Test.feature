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
      
 
