const express = require('express'); // Web Framework
const app = express();
const mysql = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');
var md5 = require('md5');
app.use(cors());

const connection = mysql.createConnection({
  host: process.env.CONN_DEV_HOST,
  user: process.env.CONN_DEV_USER,
  password: process.env.CONN_DEV_PASSWORD,
  database: process.env.CONN_DEV_DB
});

let approved_conn = JSON.parse(process.env.CONN_DEV_LIST);

app.use(bodyParser.json()); 						  // for  application/json
app.use(bodyParser.urlencoded({extended: false})); // for application/x-www-form-urlencoded

var server = app.listen(process.env.PORT || 8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("app listening at http://%s:%s", host, port)
});

app.post("/add", function(req,res) {
  let macAddress = req.body.macAddress;
  let sessionKey = req.body.sessionKey;
  let data = JSON.stringify(req.body.data);
  let toBeHashed = new Date().toString();
  let transactionID = md5(toBeHashed);
  //now we will approve the client
  if(macAddress in approved_conn && approved_conn[macAddress] == sessionKey){
    let query = "INSERT INTO conn_dev.readings VALUES ('"
    + sessionKey
    + "','"
    + macAddress
    + "', "
    + "CURTIME()"
    + ",'"
    + data
    + "', '"
    + transactionID
    + "');";
    console.log(query);
    connection.connect((err) => {
      connection.query(query, function(error, results, fields){
        res.send(200, {"response":"👌",  "transactionID": transactionID});
      });
    });
  } else {
    res.send(403,"💩");
  }


});

app.post("/data", function(req,res) {
  let macAddress = req.body.macAddress;
  let sessionKey = req.body.sessionKey;

  if(macAddress in approved_conn && approved_conn[macAddress] == sessionKey){
    connection.connect((err) => {
      query = 'select * from conn_dev.readings where sessionKey="' + sessionKey + '" and macAddress="' + macAddress +'";';
      console.log(query);
      connection.query(query, function(error, results, fields){
        res.end(JSON.stringify(results)); // Result in JSON format
      });
    });
  } else {
    res.send(403,"💩");
  }
})


app.delete("/delete", function(req,res) {
  let macAddress = req.body.macAddress;
  let sessionKey = req.body.sessionKey;
  let transactionID = req.body.transactionID;
  if(macAddress in approved_conn && approved_conn[macAddress] == sessionKey){
    connection.connect((err) => {
      query = 'delete from conn_dev.readings where sessionKey="' + sessionKey + '" and macAddress="' + macAddress + '" and transactionID="' + transactionID + '";';
      console.log(query);
      connection.query(query, function(error, results, fields){
        if(results.affectedRows > 0) {
          res.send(200, "👌");
        }
        else {
          res.send(200, "This row does not exist");
        }
      });
    });
  } else {
    res.send(403,"💩");
  }

})

app.get("/hello", function(req,res) {
  console.log("hello");
})
