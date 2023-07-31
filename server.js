/*********************************************************************************
 * WEB322 – Assignment 03
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 * 
 * Name: Jie He Student ID: 130987225 Date: 2023/08/06
 * 
 * Online (Cyclic) Link: https://tame-jade-hare-cap.cyclic.app
 * 
 * ********************************************************************************/

var express = require("express");
var app = express();
const store = require("./store-service.js");
const exphbs = require('express-handlebars'); 
const authData = require("./auth-service.js");
const clientSessions = require("client-sessions");

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

//categories does not require users to upload an image we should also include the regular middleware 
app.use(express.urlencoded({extended: true}));

var HTTP_PORT = process.env.PORT || 8080;

function onHTTPStart(){
    console.log("Express http server listening on port " + HTTP_PORT);
}

//app.listen code
//added authData initialize method to the promise chain
store.initialize().then(authData.initialize).then(function(){
    app.listen(HTTP_PORT, onHTTPStart);
}).catch(function(err){
    console.log("Unable to start server " + err);
})

//setup client-sessions
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_assignment6",
    duration: 2 * 60 * 1000, //duration of the session in millisecs (2 min)
    activeDuration: 1000 * 60 //the session will be extended by this many ms (1 min)
}))

//ensure that all the templates will have access to a "session" object, need this to conditionally hide/show elements
app.use(function(req, res, next){
    //the session data will be available in all templates rendered by the application via res.locals
    res.locals.session = req.session; 
    next(); //callback function that must be called to pass control to the next middleware in the chain
});

//Define a helper middleware function that checks if a user is logged in
function ensureLogin(req, res, next){
    if(!req.session.user){
        res.redirect("/login");
    }
    else{
        next();
    }
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
    },
    formatDate: function(dateObj){ //real date values instead of strings
            let year = dateObj.getFullYear(); 
            let month = (dateObj.getMonth() + 1).toString(); 
            let day = dateObj.getDate().toString(); 
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`; 
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

app.get("/categories", ensureLogin, function(req, res){
    store.getCategories().then((data)=>{
        if(data.length > 0){
            res.render("categories", {
                categories: data
            }); 
        }
        else{
            res.render("categories", {
                message: "no results"
            })
        }
    }).catch(function(err){
        res.render("posts", {
            message: "Unable to open " + err
        });
    })
});

//setup a route to senend the html form to the clit 
app.get("/items/add", ensureLogin, function(req, res){
    store.getCategories().then((data)=>{
        res.render('addItem', {
            categories: data
        });
    }).catch(()=>{
        res.render('addItem', {
            categories: [] //if promise is rejected then send an empty array for categories
        });
    })
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

//setup a route to send the html form to the client 
app.get("/categories/add", ensureLogin, function(req, res){
    res.render('addCategory', { //set up route to render an addCategory view 
        layout: 'main'
    });
})

//adding the /categories/add route 
app.post("/categories/add", (req, res) => {
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
            upload(req).then(()=>{
                processCategory();
            });
        }
        else{
            processCategory("");
        }
        function processCategory(){
            // TODO: Process the req.body and add it as a new Item before redirecting to /items
            const newCategory = {}; //make the new variable equal to the data submitted in the req body

            newCategory.id = req.body.id;
            newCategory.name = req.body.name;

            //the additem function is then used to add a new item 
            store.addCategory(req.body).then(()=>{
                res.redirect('/categories');
            }).catch((err)=>{
                res.send('Unable to add category ' + err);
            })
        }
});

// do the /categories/delete/:id route
app.get("/categories/delete/:id", ensureLogin, function(req, res){
    store.deleteCategoryById(req.params.id).then(() =>{
        res.redirect('/Categories');
    }).catch((err) =>{
        res.status(500).send("Unable to Remove Category / Category not found");
    });
});

//adding new routes to query items
//update the /items?category=value route 
app.get("/items", ensureLogin, function(req, res){
    const{category, minDate} = req.query;
    if(category){
        store.getItemsByCategory(category).then((data)=>{
            if(data.length > 0){
                res.render("items", {
                    items: data
                }); 
            }
            else{
                res.render("items",{ 
                    message: "no results" 
                });
            }
        }).catch(function(err){ 
            res.render("posts", {
                message: "Unable to get items by category " + err
            });
        })
    }
    else if(minDate){
        store.getItemsByMinDate(minDate).then((data)=>{
            if(data.length > 0){
                res.render("items", {
                    items: data
                }); 
            }
            else{
                res.render("items",{ 
                    message: "no results" 
                });
            }
        }).catch(function(err){
            res.render("posts", {
                message: "Unable to get items by min date " + err
            });
        })
    }
    else{
        //no filters at all
        store.getAllItems().then((data)=>{
            if(data.length > 0){
                res.render("items", {
                    items: data
                }); 
            }
            else{
                res.render("items",{ 
                    message: "no results" 
                });
            }
        }).catch((err)=>{
            res.render("posts", {
                message: "no results" + err
            });
        })
    }
});

//add the /item/value route 
app.get("items/:value", ensureLogin, function(req, res){
    store.getItemById(req.params.value).then((data)=>{
        res.send(data);
    }).catch(function(err){
        res.send("Unable get items by id " + err);
    })
});


// add the /Items/delete/:id route
app.get("/items/delete/:id", ensureLogin, function(req, res){
    store.deletePostById(req.params.id).then(()=>{
        res.redirect("/items");
    }).catch((err) =>{
        res.status(500).send("Unable to Remove Category / Category not found");
    });
})

//get /login route 
app.get("/login", (req, res) =>{
    res.render("login");
})

//get /register route
app.get("/register", (req, res) =>{
    res.render("register");
})

//post /register route
app.post("/register", (req, res) =>{
    const userData = req.body;

    authData.registerUser(userData).then(() =>{
        res.render("register", {
            successMessage: "User created"
        })
    }).catch((err) =>{
        res.render("register", {
            errorMessage: err,
            userName: req.body.userName
        })
    });
});

//post /login route
app.post("/login", (req, res) =>{
    //set the value of the client's "User-Agent" to the request body
    req.body.userAgent = req.get('User-Agent');
    const userData = req.body;

    authData.checkUser(userData).then((user) =>{
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect("/items");
    }).catch((err) =>{
        res.render("/login", {
            errorMessage: err,
            //returning the user back to the page so they don't forget the user value that was used to attempt to log into the system 
            userName: req.body.userName
        })
    });
});

// get /logout route will simply reset the session and redirect the user to the "/" route
app.get("/logout", (req, res) =>{
    req.session.reset();
    res.redirect("/");
});

//get /userHistory route 
app.get("/userHistory", ensureLogin, (req, res) =>{
    res.render("userHistory");
});

//no matching route 
app.use((req, res)=>{
    res.status(404).render("404", {
        message: "Page Not Found"
    });
});

