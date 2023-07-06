/*********************************************************************************
 * WEB322 – Assignment 03
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 * 
 * Name: Jie He Student ID: 130987225 Date: 2023/07/05
 * 
 * Online (Cyclic) Link: 
 * 
 * ********************************************************************************/

var express = require("express");
var app = express();
const path = require("path");
const store = require("./store-service.js");
const exphbs = require('express-handlebars'); 

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

//fixing the navigation bar 
app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Register handlebars as the rendering engine for views
app.engine('.hbs', exphbs.engine({ extname: '.hbs', 
helpers: { //custom helpers
    navLink: function(url, options){
        return(
            '<li class="nav-item"><a ' +
            //if the app.locals.activeRoute matches the url (about) it will dynamically update the navbar to active link
            (url == app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ') +
            ' href=" ' + 
            url + 
            ' ">' + 
            options.fn(this) +
            "</a></li>"
        );
    },
    equal: function(lvalue, rvalue, options){ //this helper gives the ability to evaluate conditions for equality
        if(arguments.length < 3){
            throw new Error("Handlebars Helper equal needs 2 parameters");
        }
        if(lvalue != rvalue){
            return options.inverse(this);
        }
        else{
            return options.fn(this);
        }
    }
}
}));
app.set('view engine', '.hbs');

//The route "/" must redirect the user to the "/about" route – this can be accomplished using res.redirect() 
app.get("/", function(req, res){
    res.redirect("/shop");
});

//Setup a route to listen for the "/about" must return the about.html file from the views folder
app.get("/about", function(req, res){
    res.render('about',{
        layout: 'main' //use main as the layout 
    });
});

//setup the /shop route given to us 
app.get("/shop", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
    try {
      // declare empty array to hold "post" objects
      let items = [];
  
      // if there's a "category" query, filter the returned posts by category
      if (req.query.category) {
        // Obtain the published "posts" by category
        items = await store.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published "items"
        items = await store.getPublishedItems();
      }
      // sort the published items by postDate
      items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
  
      // get the latest post from the front of the list (element 0)
      let post = items[0];
  
      // store the "items" and "post" data in the viewData object (to be passed to the view)
      viewData.items = items;
      viewData.post = post;
    } catch (err) {
      viewData.message = "no results";
    }
    try {
      // Obtain the full list of "categories"
      let categories = await store.getCategories();
      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
  });

//adding the shop/:id route to we can show items with that specific id
  app.get('/shop/:id', async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
    try{
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            items = await itemData.getPublishedItems();
        }
  
        // sort the published items by postDate
        items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
    }catch(err){
        viewData.message = "no results";
    }
    try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
    try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
  });

app.get("/categories", function(req, res){
    store.getCategories().then((data)=>{
        res.render("categories", {
            categories: data
        }); //display data on the webpage
    }).catch(function(err){
        res.render("posts", {
            message: "Unable to open " + err
        });
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
    res.render('addItem', {
        layout: 'main'
    });
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
            res.render("items", {
                items: data
            }); 
        }).catch(function(err){ 
            res.render("posts", {
                message: "Unable to get items by category " + err
            });
        })
    }
    else if(minDate){
        store.getItemsByMinDate(minDate).then((data)=>{
            res.render("items", {
                items: data
            }); 
        }).catch(function(err){
            res.render("posts", {
                message: "Unable to get items by min date " + err
            });
        })
    }
    else{
        //no filters at all
        store.getAllItems().then((data)=>{
            res.render("items", {
                items: data
            }); 
        }).catch((err)=>{
            res.render("posts", {
                message: "no results" + err
            });
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
    res.status(404).render("404", {
        message: "Page Not Found"
    });
});