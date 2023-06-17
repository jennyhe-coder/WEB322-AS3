/*********************************************************************************
 * WEB322 – Assignment 03
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 * 
 * Name: Jie He Student ID: 130987225 Date: 2023/06/16
 * 
 * Online (Cyclic) Link: 
 * 
 * ********************************************************************************/

var express = require("express");
var app = express();
const path = require("path");
const store = require("./store-service.js");

//middleware
const multer = require("multer");
const upload = multer(); //no {storage:storage} since we are not using disk storage
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

//set the cloudinary config 
cloudinary.config({
    cloud_name: 'dbo2mm0wu',
    api_key: '871748684893386',
    api_secret: 'IvSdVUn12Mr9azxbOmhJ4oSLsLg',
    secure: true
});

//public refers to the name of the directory
app.use(express.static('public'));

var HTTP_PORT = process.env.PORT || 8080;

function onHTTPStart(){
    console.log("Express http server listening on port " + HTTP_PORT);
}

//The route "/" must redirect the user to the "/about" route – this can be accomplished using res.redirect() 
app.get("/", function(req, res){
    res.redirect("/about");
});

//Setup a route to listen for the "/about" must return the about.html file from the views folder
app.get("/about", function(req, res){
    res.sendFile(path.join(__dirname, "views/about.html"));
});

//setup the other routes 
app.get("/shop", function(req, res){
    store.getPublishedItems().then((data)=>{
        res.send(data); //display data on the webpage
    }).catch(function(err){
        res.send("Unable to open " + err);
    })
});

app.get("/categories", function(req, res){
    store.getCategories().then((data)=>{
        res.send(data); //display data on the webpage
    }).catch(function(err){
        res.send("Unable to open " + err);
    })
});

//app.listen code
store.initialize().then(function(){
    app.listen(HTTP_PORT, onHTTPStart);
}).catch(function(err){
    console.log("Unable to start server " + err);
})

//setup a route to send the html form to the client 
app.get("/items/add", function(req, res){
    res.sendFile(path.join(__dirname, "views/addItem.html"));
})

//adding the /item/add route 
app.post("/items/add", upload.single("featureImage"), (req,res)=>{
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {resolve(result);
                        } 
                        else {
                            reject(error);
                        }
                    });
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };
            async function upload(req) {
                let result = await streamUpload(req);
                console.log(result);
                return result;
            }
            upload(req).then((uploaded)=>{
                processItem(uploaded.url);
            });
        }
        else{
            processItem("");
        }
        function processItem(imageUrl){
            req.body.featureImage = imageUrl;
            // TODO: Process the req.body and add it as a new Item before redirecting to /items
            const newItem = {}; //make the new variable equal to the data submitted in the req body

            newItem.category = req.body.category;
            newItem.postDate = req.body.postDate;
            newItem.featureImage = req.body.featureImage;
            newItem.price = req.body.price;
            newItem.title = req.body.title;
            newItem.body = req.body.body;
            newItem.published = req.body.published;

            //the additem function is then used to add a new item 
            store.addItem(req.body).then(()=>{
                res.redirect('/items');
            }).catch((err)=>{
                res.send('Unable to add item ' + err);
            })
        }
})

//adding new routes to query items
//update the /items?category=value route 
app.get("/items", function(req, res){
    const{category, minDate} = req.query;
    if(category){
        store.getItemsByCategory(category).then((data)=>{
            res.send(data); //return a JSON string of all items whose category = value (ex. 1,2,3,4)
        }).catch(function(err){ 
            res.send("Unable to get items by category " + err);
        })
    }
    else if(minDate){
        store.getItemsByMinDate(minDate).then((data)=>{
            res.send(data); //return a JSON string
        }).catch(function(err){
            res.send("Unable to get items by min date " + err);
        })
    }
    else{
        //no filters at all
        store.getAllItems().then((data)=>{
            res.send(data); //return a json string 
        }).catch((err)=>{
            res.send('Unable to get all items ' + err);
        })
    }
});

//add the /item/value route 
app.get("items/:value", function(req, res){
    store.getItemById(req.params.value).then((data)=>{
        res.send(data);
    }).catch(function(err){
        res.send("Unable get items by id " + err);
    })
});

//no matching route 
app.use((req, res)=>{
    res.status(404).send("Page Not Found");
});