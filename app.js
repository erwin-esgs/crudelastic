const http = require("http");
const https = require("https");
const url = require("url"); 
const fs = require("fs"); 

const privateKey  = fs.readFileSync('ssl/key.key', 'utf8');
const certificate = fs.readFileSync('ssl/crt.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const express = require('express');
const app = express(); 
const bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({ extended: true }));
const session = require('express-session'); 
const md5 = require('crypto-js/md5')
const elasticsearch = require('elasticsearch')


var client = new elasticsearch.Client({
//hosts: [ 'https://username:password@host:port']
hosts: [ 'http://localhost:9202']
});
 
app.use(session({secret: "secretkeyforhash", resave: true,  saveUninitialized: true}));

//testconnect to elasticsearch
client.ping({
requestTimeout: 30000,
}, function(error) {
if (error) {
console.error('Cannot connect to Elasticsearch.');
} else {
console.log('Connection to Elasticsearch was successful!');
}
});

	app.get('/', function(req, res) { 
	//console.log(req.session.username);
		if(req.session.username){
			res.sendFile(__dirname + "/" + "index.html");
		}else{ 
			res.sendFile(__dirname + "/" + "login.html");
		} 
	});
	
	app.post('/login',function(req,res){ 
	   let username = req.body.username;
	   let password = md5( req.body.password ); 
	   console.log(username + " " + password );

		const data = JSON.stringify({"query":"SELECT three FROM user WHERE one='"+username+"'  ","fetch_size":20})

		const options = {
		  hostname: 'localhost',
		  port: 9202,
		  path: '/_sql?format=json',
		  method: 'GET',
		  headers: {
			'Content-Type': 'application/json',
			'Content-Length': data.length
		  },
		  //"data": JSON.stringify({"query":"SELECT three FROM user WHERE one=asd ","fetch_size":20}),
		}

		const reqE = http.request(options, resE => {
		  console.log(`statusCode: ${res.statusCode}`) 
		  resE.on('data', d => {
			console.log(JSON.parse(d).rows[0][0]) 
		  }) 
		  
		})

		reqE.on('error', error => {
		  console.error(error)
		})

		reqE.write(data)
		reqE.end()
	   
	});
	
	app.get('/logout',(req,res)=>{
	  req.session.destroy(function (err) {
		res.redirect('/'); //Inside a callback… bulletproof!
	   });
	});
	
	app.get('/adm', function(req, res) { 
		res.sendFile(__dirname + "/" + "enginecore.html");
	});
	app.get('/user', function(req, res) { 
		res.sendFile(__dirname + "/" + "enginecorenode2.html");
	});

app.use(express.static(__dirname + '/'));  
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443);
//app.listen(3000)

console.log("Server is running..");