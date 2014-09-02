Feature: Get the list of resources 
  Retrieves list of resources such as machines, locations
  or other type of data streams.

  Scenario: Get the list of harvesters
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