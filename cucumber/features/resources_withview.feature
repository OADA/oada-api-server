Feature: Get resources without view parameter
  Scenario: Get geofence stream (1241) without view
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

  Scenario: Get swath width stream (1236) without view
    Given the client is authorized
    When the client requests a "swath_width" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION                |
    |  units     | unit stream                |
    |  widths    | width stream               |
    And the "widths" attribute contains 1 or more item
    And each item in "widths" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION                |
    |  t         | timestamp                  |
    |  width     | width                      |

  Scenario: Get location stream (1237)  without view
    Given the client is authorized
    When the client requests a "location" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                |
    |   coordinate_system      | what coordinate system     |
    |   locations              | action data array          |
    And the "locations" attribute contains 1 or more item
    And each item in "locations" has at least the following information:
    | ATTRIBUTE            |
    |  _meta               |
    |  t                   |
    |  lat                 |
    |  lon                 |
    |  alt                 |

  Scenario: Get work status stream (1238)  without view
    Given the client is authorized
    When the client requests a "work_status" stream for harvester with identifier "4727" without view parameter A
    And the "status" attribute contains 1 or more item
    And the response contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                |
    |   status                 | Array                      |
    And each item in "positions" has at least the following information:
    | ATTRIBUTE          |
    |  _meta             |
    |  t                 |
    |  case              |

  Scenario: Get wet_mass_flow stream (resource 1239) without view
    Given the client is authorized
    When the client requests a "wet_mass_flow" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE          | DESCRIPTION                |
    |  units             |                            |
    |  flows             |                            |
    And each item in "flows" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |        t           |
    |      flow          |

Feature: Get resources WITH various view parameters
  Scenario: Get the moisture stream (1240) with filtering changeId > 0
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" with view parameter A
    And the response contains at least the following information:
    |    ATTRIBUTE       |     DESCRIPTION            |
    |       units        |                            |
    |       moisture     |                            |
    And each item in "moisture" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |       moisture     |
    |       t            |
    And the "moisture" attribute contains 1 or more item
    And the "_meta" of each item in "moisture" contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                         |
    |   _changeId              | What revision are these data        |

  # Scenario: Get the moisture stream (1240) with filtering changeId > max - 1
  #   Given the client is authorized
  #   When the client requests a "moisture" stream for harvester with identifier "4727" with view parameter B
  #   And the response contains at least the following information:
  #   |    ATTRIBUTE       |     DESCRIPTION            |
  #   |       units        |                            |
  #   |       moisture     |                            |
  #   And the "moisture" attribute contains 1 or more item
  #   And each item in "moisture" has at least the following information:
  #   |     ATTRIBUTE      |
  #   |       _meta        |
  #   |       moisture     |
  #   |       t            |
  #   And the "_meta" of each item in "moisture" contains at least the following information:
  #   | ATTRIBUTE                | DESCRIPTION                         |
  #   |   _changeId              | What revision are these data        |


  # Scenario: Get geofence stream (1241) and verify that the data make sense
  #   Retrieves the geofence data with view and check for enter/exit pairs.

  #   Given the client is authorized
  #   When the client requests a "geofence" stream for harvester with identifier "4727" with view parameter 1
  #   And the "events" attribute contains 1 or more item
  #   And the 1st event for any particular field in this sorted array is an "enter" event
  #   And the 2nd event (if any exit) for a particular field is an "exit" event
  #   And there are no subsequent enter events for a particular field before exiting that field
  #   And there are no subsequent exit events for a particular field before entering that field
  #   And each item in "events" has at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION                            |
  #   |      t     | timestamp of stream                    |
  #   |    field   | field information                      |
  #   And the "field" of each item in "events" contains at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION                            |
  #   |   _id      | ..                                     |
  #   |    name    | human-readable name of the field       |

