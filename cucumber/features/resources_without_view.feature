Feature: Get resources with NO view parameters 
  These tests only check the format of the returned resources, not any of the numeric values.

  ##################################
  # Geofence
  ##################################

  Scenario: Get geofence stream without view
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.

    Given the client is authorized
    When the client requests a "geofence" stream for harvester with identifier "4727" without view parameter A
    And the "stream_type" attribute is "geofence"
    And the "stream" attribute contains 1 or more item
    And each item in "stream" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                             |
    |      t     | timestamp of stream                     |
    |    field   | field information                       |
    |    event   | whether this was enter or exit          |
    And the "field" of each item in "stream" contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION                             |
    |    _id     | id of the field resource that is remote |


  ##################################
  # Location
  ##################################

  Scenario: Get location stream without view
    Given the client is authorized
    When the client requests a "location" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                 |
    |   coordinate_system      | what coordinate system      |
    |   stream                 | action data array           |
    |   stream_type            | the type of this stream doc |
    And the "stream_type" attribute is "location"
    And the "stream" attribute contains 1 or more item
    And each item in "stream" has at least the following information:
    | ATTRIBUTE            |
    |  t                   |
    |  lat                 |
    |  lon                 |
    |  alt                 |


  ##################################
  # Swath width
  ##################################

  Scenario: Get swath width stream without view
    Given the client is authorized
    When the client requests a "swath_width" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE    | DESCRIPTION     			  |
    |  units       | unit stream   	 	   	  |
    |  stream      | width stream			   	  |
    |  stream_type | "swath width"          |
    And the "stream_type" attribute is "swath width"
    And the "stream" attribute contains 1 or more item
    And each item in "stream" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION 			  |
    |  t         | timestamp 			 	  |
    |  width     | width  		        |

  
  ##################################
  # Work Status
  ##################################

  Scenario: Get work status stream without view
    Given the client is authorized
    When the client requests a "work_status" stream for harvester with identifier "4727" without view parameter A
    And the "stream_type" attribute is "work status"
    And the "stream" attribute contains 1 or more item
    And the response contains at least the following information:
    |     ATTRIBUTE        | DESCRIPTION                |
    |      stream          | Array                      |
    |      stream_type     | Array                      |
    And each item in "stream" has at least the following information:
    |      ATTRIBUTE     |
    |        t           |
    |        case        |


  ##################################
  # Wet mass flow
  ##################################

  Scenario: Get wet_mass_flow stream without view
    Given the client is authorized
    When the client requests a "wet_mass_flow" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE          | DESCRIPTION                |
    |  units             |                            |
    |  stream            |                            |
    |  stream_type       |                            |
    And the "stream_type" attribute is "wet mass flow"
    And each item in "stream" has at least the following information:
    |     ATTRIBUTE      |
    |        t           |
    |      flow          |


  ##################################
  # Moisture
  ##################################

  Scenario: Get the moisture stream without view
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE          | DESCRIPTION                |
    |       units        |                            |
    |       stream       |                            |
    |       stream_type  |                            |
    And the "stream_type" attribute is "moisture"
    And each item in "stream" has at least the following information:
    |     ATTRIBUTE      |
    |       moisture     |
    |       t            |

