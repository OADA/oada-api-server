## Configuration documents 

	SSK.json -- contains the relations for stream-specific key for each type of stream
	known_words.json -- deprecated
	world.js -- cucumber global scope object
	config.js -- user configurable file

The *view_parameter* directory contains all the view parameters used in the feature file.
For example, 

	the client requests a "something" stream for harvester with identifier "XYZ" with view parameter A

will use the view parameter defined in *view_parameters/A.json*