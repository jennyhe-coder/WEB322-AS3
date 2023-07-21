const Sequelize = require('sequelize');

//set up sequelize to point to our postgres database 
var sequelize = new Sequelize('buiarift', 'buiarift', 'OTx8UT3kqs_-MUg6TwQh6IjxRmzJSb4I', {
    host: 'stampy.db.elephantsql.com',
    dialect: 'postgres',
    post: 5432,
    dialectOptions: {
        ssl: {rejectUnauthorized: false}
    },
    query: {raw : true}
});

sequelize.authenticate().then(function(){
    console.log('Connection has been established successfully.');
}).catch(function(err){
    console.log('Unable to connect to the database:', err);
});

//creating data models for item
var Item = sequelize.define('Item',{
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

//creating data models for category
var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

//Since a item belongs to a specific category, we must define a relationship between Items and Categories
Item.belongsTo(Category, {foreignKey: 'category'}); //item model now has a category column that acts as the foreign key

//open, read and save the file into the items array
// synchronize the Database with our models and automatically add the 
// table if it does not exist
module.exports.initialize = function(){
    return new Promise((resolve, reject) =>{
        sequelize.sync().then(function(){
            resolve();
        }).catch((error) =>{
            reject("unable to sync the database");
        });
    });
}

//This function will provide the full array of "items" objects using the resolve method of thereturned promise
module.exports.getAllItems = function(){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(function(){
            Item.findAll().then(function(data){
                resolve(data);
            }).catch((error) =>{
                reject("no results returned");
            });
        });
    });
}

//This function will provide an array of "items" objects whose published property is true using the resolve method of the returned promise
module.exports.getPublishedItems = function(){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(function(){
            Item.findAll({
                where: {
                    published: true
                }
            }).then((data) =>{
                resolve(data);
            }).catch((error) =>{
                reject("no results returned");
            });
        });
    });
}

//This function will provide the full array of "category" objects using the resolve method of thereturned promise
module.exports.getCategories = function(){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(function(){
            Category.findAll().then(function(data){
                resolve(data);
            }).catch((error) =>{
                reject("no results returned");
            });
        });
    });
}

//this function will add an item to the items array
module.exports.addItem = function(itemData){
    return new Promise((resolve, reject)=> {
        itemData.published = (itemData.published) ? true : false; 

        //loop through to check for empty values 
        for (let i in itemData){
            if(itemData[i] === ""){
                itemData[i] = null;
            }
        }
        //assign a value for the postDate (the current date)
        postDate = new Date();

        sequelize.sync().then(function(){
            Item.create(itemData).then(function(){
                resolve(itemData);
            }).catch((error) =>{
                reject("Unable to create post");
            });
        });
    });
}

//functions to support the new "item" routes in server.js
module.exports.getItemsByCategory = function(category){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(function(){
            Item.findAll({where:{
                category: category
            }}).then(function(data){
                resolve(data);
            }).catch((error) => function(){
                reject("no results returned");
            });
        });
    });
}

module.exports.getItemsByMinDate = function(minDateStr){
    return new Promise((resolve, reject) =>{
        sequelize.sync().then(function(){
            const {gte} = Sequelize.Op; //use the operator greater then

            Item.findAll({
                where: {
                    postDate:{
                        [gte]: new Date(minDateStr)
                    }
                }
            }).then(function(data){
                resolve(data);
            }).catch((error) => function(){
                reject("no results returned");
            });
        });
    });
}

module.exports.getItemById = function(id){
    return new Promise((resolve, reject) =>{
        sequelize.sync().then(function(){
            Item.findAll({
                where: {
                    id: id
                }
            }).then((data) =>{
                if(data.length > 0){
                    resolve(data[0].dataValues);
                }
                else{
                    reject("no results returned");
                }
            }).catch((error) => function(){
                reject("no results returned");
            });
        });
    });
}

//filtering items by category 
module.exports.getPublishedItemsByCategory = function(category){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(function(){
            Item.findAll({
                where:{
                    published: true,
                    category: category
                }
            }).then((data) =>{
                resolve(data);
            }).catch((error) =>{
                reject("no results returned");
            });
        });
    });
}

//add new categories 
module.exports.addCategory = function(categoryData){
    return new Promise((resolve, reject) =>{
        //loop through to check for blank values in categoryData
        for (let i in categoryData){
            if(categoryData[i] === ""){
                categoryData[i] = null;
            }
        }
        sequelize.sync().then(function(){
            Category.create(categoryData).then(function(){
                resolve(categoryData);
            }).catch((error) =>{
                reject("Unable to create category");
            });
        });
    });
}

//delete categories from the list 
module.exports.deleteCategoryById = function(id){
    return new Promise((resolve, reject) =>{
        Category.destroy({
            where:{
                id: id
            }
        }).then((deletedRowsCount) =>{
            if(deletedRowsCount > 0){
                resolve();
            }
            else{
                reject();
            }
        }).catch((err) =>{
            reject(err);
        });
    });
};

//delete items by specific id
module.exports.deletePostById = function(id){
    return new Promise((resolve, reject) =>{
        sequelize.sync().then(() =>{
            Item.destroy({
                where:{
                    id: id 
                }}).then((data)=>{
                    resolve(data);
                }).catch((err) =>{
                    reject(err);
                });
        });
    });
};
