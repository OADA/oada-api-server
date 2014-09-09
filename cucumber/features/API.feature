Feature: Get resources 
  Retrieves list of resources such as machines, locations
  or other type of data streams.

  Scenario: Get configurations for harvesters 
    Given the client is logged in
    And the client is authorized
    When the client requests "configurations" for "machines" that are "harvesters" 
    Then the response is a "configuration" 
    And each "machine" has the following attributes:
      |  ATTRIBUTE         |  DESCRIPTION                               | 
      |  formats           |  describes the format of the data          | 
      |  meta              |  contains metadata                         | 
      |  data              |  contains stream of data                   |  
    And the "meta" attribute of each "machine" contains the following information:
      |  ATTRIBUTE     |
      |  serial_number |
      |  model_year    |
      |  model         |
      |  name          |
    And the "data" attribute of each "machine" contains the following information:
      |  ATTRIBUTE     |       DESCRIPTION         | 
      |  streams       |        resource streams   |
    And the "streams" attribute contains the following information:
      |  ATTRIBUTE       |
      |  swath_width     |
      |  location        |
      |  header_position |
      |  wet_mass_flow   |
      |  moisture        |
      |  geofence        |
      
      
      
  Scenario: Get geofence stream
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.
  
    Given the client is logged in
    And the client is authorized
    When the client requests a geofence stream for harvester with VIN "4000AA"
    Then the response is a resource with the following information:
    |   ATTRIBUTE    |   DESCRIPTION                          |
    |   data         |   resource for geofence stream item    |
    |   formats      |   specifies the format of the data     |
    |   meta         |   other information like units. etc.   |
    |   _href        |   current document location            |
    |   _etag        |   md5 hash sum of current document     |
    |   _changeId    |   revision number                      |
    And each item has the following information:
    |   ATTRIBUTE    |   DESCRIPTION                               |
    |   action       |   enter or leave the field                  |
    |   field        |   which field                               |
    |   time         |   what time did it perform the above action |
  
  Scenario: Get swath_width streams
    Retrieves the swath_width data for specified machine to obtain width of swath(?)
    
    Given the client is logged in 
    And the client is authorized
    When the client requests a swath_width stream for harvester with VIN "4000AA"
    Then the response is a resource with the following information:
    