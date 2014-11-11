Feature: Get clients bookmark 
  Scenario: Test the correctness of clients bookmark

    Given the client is authorized
    When the client requests the "clients" bookmark with view parameter each_bookmarks_fields
    Then each item has at least the following information:
    | ATTRIBUTE     | 
    | _id           | 
    | bookmarks     | 
    | name          | 
    And the "bookmarks" attribute of each item contains at least the following information:
    | ATTRIBUTE     | 
    | _id           | 
    | fields        | 