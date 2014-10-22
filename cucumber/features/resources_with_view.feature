# Feature: Get resources WITH various view parameters
#   Scenario: Get the moisture stream (1240) with filtering changeId > 0
#     Given the client is authorized
#     When the client requests a "moisture" stream for harvester with identifier "4727" with view parameter A
#     And the response contains at least the following information:
#     |    ATTRIBUTE       |     DESCRIPTION            |
#     |       units        |                            |
#     |       moisture     |                            |
#     And each item in "moisture" has at least the following information:
#     |     ATTRIBUTE      |
#     |       _meta        |
#     |       moisture     |
#     |       t            |
#     And the "moisture" attribute contains 1 or more item
#     And the "_meta" of each item in "moisture" contains at least the following information:
#     | ATTRIBUTE                | DESCRIPTION                         |
#     |   _changeId              | What revision are these data        |

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

