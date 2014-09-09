Feature: Get the list of resources 
  Retrieves list of resources such as machines, locations
  or other type of data streams.

  Scenario: Get configurations for harvesters 
    Given the client is logged in
    When the client requests "configurations" for "machines" that are "harvesters" 
    Then the response is a resource with multiple machines entries organized by VIN
    And each machine has the following attributes:
      |  ATTRIBUTE         |  DESCRIPTION                               | 
      |  formats           |  describes the format of the data          | 
      |  meta              |  contains metadata                         | 
      |  data              |  contains stream of data                   | 
    And each "meta" attribute of each machine contains the following information:
      |  ATTRIBUTE     |
      |  serial_number |
      |  model_year    |
      |  model         |
      |  name          |
    And each "data" attributes of each machine are "streams" of the following resources:
      |  swath_width     |
      |  location        |
      |  header_position |
      |  wet_mass_flow   |
      |  moisture        |
      |  geofence        |
      
  Scenario: Get geofence stream
    Given the client is logged in
    When the client requests resource number "1241"
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
      