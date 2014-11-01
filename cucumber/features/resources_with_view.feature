Feature: Get resources WITH various view parameters


  Scenario: Get the MOISTURE stream with filtering changeId > 0, changeId > max -1
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" with view parameter stream_gt_0
    Then the response contains at least the following information:
    |    ATTRIBUTE       |  
    |       units        |  
    |       stream       |  
    |       _meta        | 
    And the "_meta" attribute contains at least the following information:
    |    ATTRIBUTE       |  
    |     _changeId      | 
    And the "stream_type" attribute is "moisture"
    And the "stream" attribute contains 1 or more item
    And each item in "stream" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |       moisture     |
    |       t            |
    And the "_meta" attribute of each item in "stream" contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                         |
    |   _changeId              | What version  are these data        |
    And remember the maximum value of "$.*._meta._changeId" for every items in "stream"
    And check the "moisture" stream again, this time with view parameter stream_max
    And all values of "$.stream.*._meta._changeId" are equals to the previously remembered value


  # Scenario: Get the LOCATION stream with filtering changeId > 0, changeId > max -1
  #   Given the client is authorized
  #   When the client requests a "location" stream for harvester with identifier "4727" with view parameter A 
  #   And the response contains at least the following information:
  #   | ATTRIBUTE                | DESCRIPTION                |
  #   |   coordinate_system      | what coordinate system     |
  #   |   locations              | action data array          |
  #   And the "locations" attribute contains 1 or more item
  #   And each item in "locations" has at least the following information:
  #   | ATTRIBUTE            |
  #   |     _meta            |
  #   |     t                |
  #   |     lat              |
  #   |     lon              |
  #   |     alt              |
  #   And the "_meta" of each item in "locations" contains at least the following information:
  #   | ATTRIBUTE                | DESCRIPTION                         |
  #   |   _changeId              | What revision are these data        |
  #   And remember the maximum value of "$.*._meta._changeId" for every items in "locations"
  #   And check the "locations" stream again, this time with view parameter MAXCHG
  #   And all values of "$.locations.*._meta._changeId" are equals to the previously remembered value





  # Scenario: Get the SWATH WIDTH stream with filtering changeId > 0, changeId > max -1
  #   Given the client is authorized
  #   When the client requests a "swath_width" stream for harvester with identifier "4727" with view parameter A
  #   And the response contains at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION          |
  #   |  units     | unit stream          |
  #   |  widths    | width stream         |
  #   And the "widths" attribute contains 1 or more item
  #   And each item in "widths" has at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION          |
  #   |  _meta     | meta                 |
  #   |  t         | timestamp            |
  #   |  width     | width                |
  #   And the "_meta" of each item in "widths" contains at least the following information:
  #   | ATTRIBUTE                | DESCRIPTION                         |
  #   |   _changeId              | What revision are these data        |
  #   And remember the maximum value of "$.*._meta._changeId" for every items in "widths"
  #   And check the "widths" stream again, this time with view parameter MAXCHG
  #   And all values of "$.widths.*._meta._changeId" are equals to the previously remembered value



  # Scenario: Get the WORK STATUS stream with filtering changeId > 0, changeId > max -1
  #   Given the client is authorized
  #   When the client requests a "work_status" stream for harvester with identifier "4727" with view parameter A
  #   And the response contains at least the following information:
  #   |     ATTRIBUTE        | DESCRIPTION                |
  #   |      status          | Array                      |
  #   And the "status" attribute contains 1 or more item
  #   And each item in "status" has at least the following information:
  #   |      ATTRIBUTE     |
  #   |        _meta       |
  #   |        t           |
  #   |        case        |
  #   And the "_meta" of each item in "status" contains at least the following information:
  #   | ATTRIBUTE                | DESCRIPTION                         |
  #   |   _changeId              | What revision are these data        |
  #   And remember the maximum value of "$.*._meta._changeId" for every items in "status"
  #   And check the "work_status" stream again, this time with view parameter MAXCHG
  #   And all values of "$.status.*._meta._changeId" are equals to the previously remembered value




  # Scenario: Get geofence stream (1241) and verify that the data make sense
  #   Retrieves the geofence data with view and check for enter/exit pairs.

  #   Given the client is authorized
  #   When the client requests a "geofence" stream for harvester with identifier "4727" with view parameter A
  #   And the "events" attribute contains 1 or more item
  #   And the items in "$.events" has enter-exit pair, if any exit.
  #   And each item in "events" has at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION                            |
  #   |      t     | timestamp of stream                    |
  #   |    field   | field information                      |
  #   And the "field" of each item in "events" contains at least the following information:
  #   | ATTRIBUTE  | DESCRIPTION                            |
  #   |   _id      | ..                                     |
  #   |    name    | human-readable name of the field       |

