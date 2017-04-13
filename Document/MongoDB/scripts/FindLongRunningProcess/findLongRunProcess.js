/* Script to detect and kill long running processes
 */
var THRESHOLD_SECONDS = 60*2;
var AUTH_DB = "admin";
var USER = "userid";
var PASSWORD = "pwd";
var logDB = "DBAdatabase";
var logCollection = "LongProcessLog";
var NAMESPACES_TO_SKIP = [ "local.oplog.rs" ];
var recordProcess = function(db,op,message) {
	var log = { ts : new Date(), threshold_seconds : THRESHOLD_SECONDS, op : op };
    if ( typeof(message) != 'undefined' ) {
        log.message = message;
    }
	//printjson(log);
	var result = db.getMongo().getDB(logDB).getCollection(logCollection).insert( log );
	//printjson(result);
};

var reapProcesses = function(db) {
	db.currentOP().inprog.forEach( function(op) {
		if ( op.secs_running > THRESHOLD_SECONDS ) {
            if ( NAMESPACES_TO_SKIP.indexOf( op.ns ) == -1 ) {
			    recordProcess(db,op);
			    db.killOp(op.opid);
            } else {
                recordProcess(db,op,"Skipping op because of ns");
            }
		}
	});
};


// Find the primary
var primary_connection = {};
rs.status().members.forEach( function(m) {
	if ( m.stateStr == "PRIMARY" ) {
		primary_connection = m;
	}
});

if ( primary_connection.name === undefined ) {
	print("ERROR - Count not detect promary!");
//	return;
}

var db = connect(primary_connection.name + "/" + AUTH_DB);
var authOk = db.auth( USER, PASSWORD );

if ( !authOk ) {
	print("ERROR - Authentication to " + primary_connection.name + " failed!");
//	return;
}

reapProcesses(db);

