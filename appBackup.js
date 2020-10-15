var http = require("http");
var url = require("url"); 
var fs = require("fs"); 

http.createServer( (req,res) => {
	var path = url.parse(req.url).pathname;
	console.log(path);
	if(path == "/"){
		fs.readFile('./index.html' , (err,html) => {
			if (err) {
				throw err; 
			} 
			//res.writeHeader(200, {"Content-Type": "text/html"});  
			//res.write(html);
			res.end(html);
		});
	}else if(path == "/home"){
		fs.readFile('./layout.html' , (err,html) => {
			if (err) {
				throw err; 
			} 
			html = html.toString().replace("{ user }", "Erwin");
			res.end(html);
		});
	}
	
} ).listen(8888);

console.log("Server is running..");