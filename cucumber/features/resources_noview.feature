Feature: Get resources WITHOUT view parameters
  Scenario: Get swath width stream (1236) without view
    Given the client is authorized
    When the client requests a "swath_width" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  units     | unit stream   	 	   	  |
    |  widths    | width stream			   	  |
    And the "widths" attribute contains 1 or more item
    And each item in "widths" has at least the following information:
    | ATTRIBUTE  | DESCRIPTION   			  |
    |  t         | timestamp 			 	  |
    |  width     | width  			          |

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

  Scenario: Get the moisture stream (1240) without view
    Given the client is authorized
    When the client requests a "moisture" stream for harvester with identifier "4727" without view parameter A
    And the response contains at least the following information:
    | ATTRIBUTE          | DESCRIPTION                |
    |       units        |                            |
    |       moisture     |                            |
    And each item in "moisture" has at least the following information:
    |     ATTRIBUTE      |
    |       _meta        |
    |       moisture     |
    |       t            |
    And the "_meta" of each item in "moisture" contains at least the following information:
    | ATTRIBUTE                | DESCRIPTION                         |
    |   _changeId              | What revision are these data        |


