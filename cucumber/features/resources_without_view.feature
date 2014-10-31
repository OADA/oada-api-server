Feature: Get resources with NO view parameters

  Scenario: Get geofence stream without view
    Retrieves the geofence data for specified machine to obtain locations and actions that it performs.

    Given the client is authorized
    When the client requests a "geofence" stream for harvester with identifier "4727" without view parameter A
    And the "events" attribute contains 1 or more item
    And each item in "events" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |      t     | timestamp of stream                    |
    |    field   | field information                      |
    And the "field" of each item in "events" contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION                            |
    |   _id      | ..                                     |
    |    name    | human-readable name of the field       |

  Scenario: Get location stream without view
    Given the client is authorized
    When the client requests a "location" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                |
    |   coordinate_system      | what coordinate system     |
    |   locations              | action data array          |
    And the "locations" attribute contains 1 or more item
    And each item in "locations" has at least the following information:
    | ATTRIBUTE            |
    |  _id                 |
    |  t                   |
    |  lat                 |
    |  lon                 |
    |  alt                 |

  Scenario: Get swath width stream without view
    Given the client is authorized
    When the client requests a "swath_width" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  units     | unit stream   	 	   	  |
    |  widths    | width stream			   	  |
    And the "widths" attribute contains 1 or more item
    And each item in "widths" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  _id       | id                         |
    |  t         | timestamp 			 	  |
    |  width     | width  			          |

  Scenario: Get work status stream without view
    Given the client is authorized
    When the client requests a "work_status" stream for harvester with identifier "4727" without view parameter A
    And the "status" attribute contains 1 or more item
    And the response contains at least the following information:
    |     ATTRIBUTE        | DESCRIPTION                |
    |      status          | Array                      |
    And each item in "status" has at least the following information:
    |      ATTRIBUTE     |
    |        _id         |
    |        t           |
    |        case        |

  Scenario: Get wet_mass_flow stream without view
    Given the client is authorized
    When the client requests a "wet_mass_flow" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE          | DESCRIPTION                |
    |  units             |                            |
    |  flows             |                            |
    And each item in "flows" has at least the following information:
    |     ATTRIBUTE      |
    |       _id          |
    |        t           |
    |      flow          |

  Scenario: Get the moisture stream without view
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE          | DESCRIPTION                |
    |       units        |                            |
    |       moistures    |                            |
    And each item in "moistures" has at least the following information:
    |     ATTRIBUTE      |
    |       _id          |
    |       moisture     |
    |       t            |

