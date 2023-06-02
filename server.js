/*********************************************************************************
 * WEB322 – Assignment 02
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 * 
 * Name: Jie He Student ID: 130987225 Date: 2023/06/02
 * 
 * Online (Cyclic) Link: ________________________________________________________
 * 
 * ********************************************************************************/

var express = require("express");
var app = express();
const path = require("path");
const store = require("./store-service.js");

var HTTP_PORT = process.env.PORT || 8080;

//public refers to the name of the directory
app.use(express.static('public'));

function onHTTPStart(){
    console.log("Express http server listening on port " + HTTP_PORT);
}

//The route "/" must redirect the user to the "/about" route – this can be accomplished using res.redirect() 
app.get("/", function(req, res){
    res.redirect("/about");
});

//Setup a route to listen for the "/about" must return the about.html file from the views folder
app.get("/about", function(req, res){
    res.sendFile(path.join(__dirname, "views", "about.html"));
});

//setup the other routes 
app.get("/shop", function(req, res){
    store.getPublishedItems().then((data)=>{
        res.json(data); //display data on the webpage
    }).catch(function(err){
        console.log("Unable to open " + err);
    })
});

app.get("/items", function(req, res){
    store.getAllItems().then((data)=>{
        res.json(data); //display data on the webpage
    }).catch(function(err){
        console.log("Unable to open " + err);
    })
});

app.get("/categories", function(req, res){
    store.getCategories().then((data)=>{
        res.json(data); //display data on the webpage
    }).catch(function(err){
        console.log("Unable to open " + err);
    })
});

//no matching route 
app.use((req, res)=>{
    res.status(404).send("Page Not Found");
});

//app.listen code
store.initialize().then(function(){
    app.listen(HTTP_PORT, onHTTPStart);
}).catch(function(err){
    console.log("Unable to start server " + err);
})
