// Bill Management Application
// This file contains the Node.js server-side logic with APIs to interact with a PostgreSQL database for this billing application.

// The "express" module is used when defining routes (the URL path and HTTP method (like GET, POST, etc.)) for APIs.
const express=require("express");
// The "cors" module handles cross-origin resource sharing (CORS) in relation to frameworks like Express.js.
const cors=require("cors");
// The constant variable named "postgresPool" is assigned once to the loaded "pg" module for interacting with a PostgreSQL database.  The ".Pool" property provides access to the "Pool" class in the "pg" module and enables management of the connection pool to the PostgreSQL database.
const postgresPool=require("pg").Pool;
// Initialize this Express.js application by calling the "express()" top-level function provided by the "express" module.
const app=express();
// Body parser is used for parsing JSON.
const bodyParser=require("body-parser");

// Setup a port - either take this from the configuration or choose a port number you specify (you have freedom to choose any port).
const port=process.env.port || 3007;

// Enable cross-origin resource sharing.  This makes the server accessible to any domain that is submitting a request.
app.use(cors())
// Call the Express.js "use" method for mounting middleware which is "body-parser" in this case.  When there are POST or PUT requests, bodyParser.json() intercepts the request, parses the JSON in the request body, converts the JSON to a JavaScript object, and then this JavaScript object is associated with the "req.body" property of the request object.
app.use(bodyParser.json())
// Call the "urlencoded" function from the "body-parser" library.  This helps with parsing HTML form submissions with the default encoding header of "Content-Type: application/x-www-form-urlencoded".  The "extended:true" option is passed to the "urlencoded()" function to allow parsing of rich objects, such as nested objects or arrays.  For example, if a form has an input field named "billfrom", then it could be used in a route handler using "req.body.billfrom".
app.use(bodyParser.urlencoded({
    extended:true
}))

// Set the application to listen on the port that was setup.  It will also catch an error and the "err" object is passed.
// If there is an error it is thrown; otherwise a message is printed to the console to indicate the server is running.
app.listen(port,(err)=>{
    if(err) throw err;
    console.log(`Server is running successfully on port: ${port}`)
})

// Configure the connection to the PostgreSQL database, bill_manager.
// The maximum number of client connections will be 10 (signified by "max").
const pool= new postgresPool({
    user: "postgres",
    password: "PASSWORD_REDACTED",
    database: "bill_manager",
    host: "localhost",
    port: 5432,
    max: 10
})

// Try connecting to the database.
// The err object and a connection are passed in.
pool.connect((err, connection)=>{
    if(err) throw err;
    console.log(`Connected successfully to the bill_manager database!`)
})


// The remainder of the file contains APIs that are used for CRUD functionality for interfacing with the PostgreSQL database.

// GET all bills - /bills
// This is an HTTP GET to retrieve all bills and it has an endpoint of "/bills".
// The API is passed a request and response (which is common for APIs).
app.get("/bills",(req, res)=>{
    // Formulate a query to select all contents of the "bills" table.
    // PostgreSQL columns with capital letters have to be surrounded in double quotes; the double quotes need to be escaped here.
    // To use an HTML "date" field to display a date, the select statement converts a date (typically in ISO 8601 extended format, such as 2025-08-07T04:00:00Z) to YYYY-MM-DD format an existing date will display correctly in the HTML input field.
    const sql="select billid, billfrom, \"billType\", \"amountDue\", TO_CHAR(\"dueDate\", 'YYYY-MM-DD') AS \"dueDate\", \"isPaid\", \"paidInFull\", \"amountPaid\", TO_CHAR(\"datePaid\", 'YYYY-MM-DD') AS \"datePaid\", \"paidBy\" from bills ORDER BY billid ASC";
    // Submit the query and pass in error and result objects.
    pool.query(sql,(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if (err) return res.json(err);
        // Otherwise return a 200 HTTP status code for success and the JSON results of the query.
        return res.status(200).json(result.rows);
    })
})

// GET one specific bill - /bills/<billId>
// This is an HTTP GET to retrieve a particular bill and it has an endpoint of "/bills/<value of bill ID>".
// The API is passed a request and response.
app.get("/bills/:billId",(req, res)=>{
    // Extract the bill ID from the request.  There is an upper case "Id" to correspond to the value given for the route in the line above.
    const billNum=Number(req.params.billId);
    // Formulate a query.  Include a where clause for a particular bill and put a placeholder reference ($1) in for that value.
    // See further explanation of the SQL statement within the GET /bills API above.
    const sql="select billid, billfrom, \"billType\", \"amountDue\", TO_CHAR(\"dueDate\", 'YYYY-MM-DD') AS \"dueDate\", \"isPaid\", \"paidInFull\", \"amountPaid\", TO_CHAR(\"datePaid\", 'YYYY-MM-DD') AS \"datePaid\", \"paidBy\" from bills WHERE billid=$1";
    // Submit the query and pass in error and result objects.  Pass in the bill number that was extracted from the request parameters.
    pool.query(sql,[billNum],(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if (err) return res.json(err);
        // Otherwise return a 200 HTTP status code for success and the JSON results of the query.
        // Specify "rows[0]" to indicate only one row will be returned.
        return res.status(200).json(result.rows[0]);
    })
})

// GET the amount that has been paid for one specific bill - /bills/amountPaid/<billId>
// This is an HTTP GET to retrieve how much has already been paid for a particular bill and it has an endpoint of "/bills/amountPaid/<value of bill ID>".
// The API is passed a request and response.
app.get("/bills/amountPaid/:billId",(req, res)=>{
    // Extract the bill ID from the request.  There is an upper case "Id" to correspond to the value given for the route in the line above.
    const billNum=parseInt(req.params.billId);
    // Formulate a query.  Include a where clause for a particular bill and put a placeholder reference ($1) in for that value.
    const sql="SELECT \"amountPaid\" FROM bills WHERE billid=$1";
    // Submit the query and pass in error and result objects.  Pass in the bill number that was extracted from the request parameters.
    pool.query(sql,[billNum],(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if (err) return res.json(err);
        // Otherwise return a 200 HTTP status code for success and the JSON results of the query.
        // Specify "rows[0]" to indicate only one row will be returned.
        return res.status(200).json(result.rows[0]);
    })
})

// POST API for adding a new bill - /addbill
app.post("/addbill",(req, res)=>{
    console.log("Entering the addbill method.");
    // Get column values to add from the request body.
    const {billfrom,billType,amountDue,dueDate,isPaid,paidInFull,amountPaid,datePaid,paidBy}=req.body;

    console.log("\tbillfrom is: " + billfrom);
    console.log("\tbillType is: " + billType);
    console.log("\tamountDue is: " + amountDue);
    console.log("\tdueDate is: " + dueDate);
    console.log("\tisPaid is: " + isPaid);
    console.log("\tpaidInFull is: " + paidInFull);
    console.log("\tamountPaid is: " + amountPaid);
    console.log("\tdatePaid is: " + datePaid);
    console.log("\tpaidBy is: " + paidBy);

    // Formulate an insert statement to insert information about a new bill.
    // When formulating queries, make sure that the number of columns to include (minus columns populated automatically by a sequence) and the corresponding number of replaceable values is correct.
    // The billid primary key column is set by a sequence (bills_billid_seq) so it does not need to be specified.  If the sequence isn't added to the database, the billid will try to be added as null which will fail with PostgreSQL error code 23502.
    // The $1, $2, $3, etc. are placeholders for the values of billfrom, billType, amountDue, etc. columns.  Note that if the column name has upper case characters, it must be enclosed in double quotes (which need to be escaped here with \).  If the upper case characters in column names aren't handled this way, there will be a PostgreSQL 42601 error.
    // The "RETURNING *" portion means that the table will be queried after the addition.
    const sql="INSERT INTO bills(billfrom,\"billType\",\"amountDue\",\"dueDate\",\"isPaid\",\"paidInFull\",\"amountPaid\",\"datePaid\",\"paidBy\") VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *";
    // Submit the query and pass in error and result objects.
    pool.query(sql,[billfrom,billType,amountDue,dueDate,isPaid,paidInFull,amountPaid,datePaid,paidBy],(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if(err) return res.json(err);
        // Otherwise return a 201 HTTP status code to signify that a new bill record has been created. Also return the JSON results of the query.
        // Specifying the zero index for the result row will print the new bill that was added.  Otherwise, it would print all bills.
        return res.status(201).json(result.rows[0])
    })
})

// API for marking a bill paid  - /paybill<bill ID>
// This uses the "patch" call to update an existing record.
app.patch("/paybill/:billId",(req, res)=>{
    // Extract the bill ID from the request.  There is an upper case "Id" to correspond to the value given for the route in the line above.
    // Use "parseInt" to make sure the billId is an integer.  This is preferable to using the more general "Number" in case incorrect characters are included in the request (like periods after the number) which would cause the value to be "NaN" rather than the desired integer value.  This helps ensure that the WHERE clause is populated correctly.
    const billNum=parseInt(req.params.billId);
    console.log("Entering the paybill method.");
    console.log("The bill number to pay is: " + billNum);
    
    // Get column values from the request body.  The "amountDue" will be compared to the "amountPaid" to determine if the bill has been paid in full.  The properties other than "amountDue" will be updated as needed.
    const {amountDue,isPaid,paidInFull,amountPaid,datePaid,paidBy}=req.body
    console.log("\tamountDue is: " + amountDue);
    console.log("\tisPaid is: " + isPaid);
    console.log("\tpaidInFull is: " + paidInFull);
    console.log("\tamountPaid is: " + amountPaid);
    console.log("\tdatePaid is: " + datePaid);
    console.log("\tpaidBy is: " + paidBy);
        
    // Formulate an update statement to mark a bill paid.
    // The replaceable values like $1, $2, $3, and $4 correspond to the list of parameters within the square brackets after the "sql" string (which has the replaceable parameters).
    // Declare a variable named "sql" outside the scope of the if statement so it can be used after the if / else.
    let sql = null; 
    
    // First check if the bill is being paid in full.  In this case, set both isPaid and paidInFull to true.
    if ((amountPaid == amountDue) && (amountPaid > 0)) {
        sql="UPDATE bills SET \"isPaid\"=true,\"paidInFull\"=true,\"amountPaid\"=$1,\"datePaid\"=$2,\"paidBy\"=$3 WHERE billid=$4";
    } else if (amountPaid > 0) {
        // If this condition is reached, it means that the bill isn't being paid in full.
        sql="UPDATE bills SET \"isPaid\"=true,\"paidInFull\"=false,\"amountPaid\"=$1,\"datePaid\"=$2,\"paidBy\"=$3 WHERE billid=$4";
    }

    // Submit the query and pass in error and result objects.  Pass in the billId as "billNum" at the end of the parameter list.
    pool.query(sql,[amountPaid,datePaid,paidBy,billNum],(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if(err) return res.json(err);
        // Otherwise return a 200 HTTP status code to indicate success. Also print a message about the table update.
        return res.status(200).send(`The bills table has been updated successfully for payment of the billId: ${billNum}`)
    })
})


// API for updating any of the fields for a bill 
// This uses the "patch" call to update an existing record.
app.patch("/updatebill/:billId",(req, res)=>{
    // Extract the bill ID from the request.  There is an upper case "Id" to correspond to the value given for the route in the line above.
    // Use "parseInt" to make sure the billId is an integer.  This is preferable to using the more general "Number" in case incorrect characters are included in the request (like periods after the number) which would cause the value to be "NaN" rather than the desired integer value.  This helps ensure that the WHERE clause is populated correctly.
    const billNum=parseInt(req.params.billId);
    console.log("Entering the updatebill method.");
    console.log("The bill number to update is: " + billNum);
    
    // Get column values from the request body.  The "amountDue" will be compared to the "amountPaid" to determine if the bill has been paid in full.  The properties other than "amountDue" will be updated as needed.
    const {billfrom,billType,amountDue,dueDate,isPaid,paidInFull,amountPaid,datePaid,paidBy}=req.body
    console.log("\tbillfrom is: " + billfrom);
    console.log("\tbillType is: " + billType);
    console.log("\tamountDue is: " + amountDue);
    console.log("\tdueDate is: " + dueDate);
    console.log("\tisPaid is: " + isPaid);
    console.log("\tpaidInFull is: " + paidInFull);
    console.log("\tamountPaid is: " + amountPaid);
    console.log("\tdatePaid is: " + datePaid);
    console.log("\tpaidBy is: " + paidBy);
    
    // Declare a variable named "sql" outside the scope of the if statement so it can be used after the if / else.
    let sql = null; 
    // Set paidInFull programatically.  If the amountPaid equals the amountDue, then set this to true.  Otherwise, set paidInFull to false.
    if (amountPaid == amountDue) {
        sql="UPDATE bills SET billfrom=$1,\"billType\"=$2,\"amountDue\"=$3,\"dueDate\"=$4,\"isPaid\"=true,\"paidInFull\"=true,\"amountPaid\"=$5,\"datePaid\"=$6,\"paidBy\"=$7 WHERE billid=$8";
    } else if (amountPaid > 0) {
        // If this condition is reached, it means that the bill isn't being paid in full.
        sql="UPDATE bills SET billfrom=$1,\"billType\"=$2,\"amountDue\"=$3,\"dueDate\"=$4,\"isPaid\"=true,\"paidInFull\"=false,\"amountPaid\"=$5,\"datePaid\"=$6,\"paidBy\"=$7 WHERE billid=$8";
    } 
    else {
        // No payment has been made for the bill.
        sql="UPDATE bills SET billfrom=$1,\"billType\"=$2,\"amountDue\"=$3,\"dueDate\"=$4,\"isPaid\"=false,\"paidInFull\"=false,\"amountPaid\"=$5,\"datePaid\"=$6,\"paidBy\"=$7 WHERE billid=$8";
    }

    // Submit the query and pass in error and result objects.  Pass in the billId as "billNum" at the end of the parameter list.
    pool.query(sql,[billfrom,billType,amountDue,dueDate,amountPaid,datePaid,paidBy,billNum],(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if(err) return res.json(err);
        // Otherwise return a 200 HTTP status code to indicate success. Also print a message about the table update.
        return res.status(200).send(`The bills table has been updated successfully for the billId: ${billNum}`)
    })
})

// Delete API for removing a bill record - /bills/<bill ID>
app.delete("/bills/:billId",(req, res)=>{
    // Extract the bill ID from the request.
    const billNum=parseInt(req.params.billId);
    console.log("Entering the delete bill method.");
    console.log("The bill number to delete is: " + billNum);

    // Formulate a delete statement to remove an existing bill.
    // The $1 placeholder is for the billid.
    const sql="DELETE FROM bills WHERE billid=$1";
    // Submit the query and pass in error and result objects.  Pass in the bill ID.
    pool.query(sql,[billNum],(err, result)=>{
        // If there is an error, return a JSON response with the error.
        if(err) return res.json(err);
        // Otherwise return a 200 HTTP status code to indicate success. Also print a message about the deletion.
        return res.status(200).send(`Successfully deleted the bill with the billId: ${billNum}`)
    })
})