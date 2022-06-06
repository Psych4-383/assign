const express = require("express")

var app = express()
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.get("/", function (request, response) {
    response.send("Hello World!")
})

app.listen(port, function () {
    console.log("Started application on port %d", port)
});