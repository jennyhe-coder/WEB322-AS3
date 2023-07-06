const fs = require('fs');
const path = require("path");

//read all the data from the file and save it in the array
let itemArray = [];
let categoriesArray = [];

//open, read and save the file into the items array
module.exports.initialize = function(){
    return new Promise((resolve, reject) =>{
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf-8', (err, data)=>{
            if(err){ //if error occured in code reject the promise and show err in console
                reject(err);
            }
            else{
                itemArray = JSON.parse(data); //convert the file's content into an array of objects  
                resolve();
                //Do the same for the categories file after success in reading the items array
                fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf-8', (err, data)=>{
                    if(err){ //if error occured in code reject the promise and show err in console
                        reject(err);
                    }
                    else{
                        categoriesArray = JSON.parse(data); //convert the file's content into an array of objects  
                        resolve();
                    }
                })
            }
        })
    })
}

//This function will provide the full array of "items" objects using the resolve method of thereturned promise
module.exports.getAllItems = function(){
    return new Promise((resolve, reject)=>{
        if(itemArray.length == 0){
            reject("No results returned for items array");
        }
        else{
            resolve(itemArray);
        }
    })
}

//This function will provide an array of "items" objects whose published property is true using the resolve method of the returned promise
module.exports.getPublishedItems = function(){
    return new Promise((resolve, reject)=>{
        let publishedItems = [];
        for(let i = 0; i < itemArray.length; i++){
            if(itemArray[i].published === true){
                publishedItems.push(itemArray[i]);
            }
        }
        if(publishedItems.length === 0){
            reject("No results returned for published items");
        }
        else{
            resolve(publishedItems);
        }
    })
}

//This function will provide the full array of "category" objects using the resolve method of thereturned promise
module.exports.getCategories = function(){
    return new Promise((resolve, reject)=>{
        if(categoriesArray.length === 0){
            reject("No results returned for categories array");
        }
        else{
            resolve(categoriesArray);
        }
    })
}

//this function will add an item to the items array
module.exports.addItem = function(itemData){
    return new Promise((resolve, reject)=> {
        //gets around the issue of the checkbox not sending false if it is unchecked 
        if(itemData.published === undefined){
            itemData.published = false; //explicity set to false
        }
        else{
            itemData.published = true;
        }
        itemData.id = itemArray.length + 1;
        itemData[itemArray.length + 1].postDate = new Date().toISOString().split("T")[0];
        itemArray.push(itemData);
        if(itemArray.length === 0){
            reject("No results returned for the added items array");
        }
        else{
            resolve(itemData);
        }
    })
}

//functions to support the new "item" routes in server.js
module.exports.getItemsByCategory = function(category){
    return new Promise((resolve, reject)=>{
        let categoryItems = [];
        for(let i = 0; i < itemArray.length; i++){
            if(itemArray[i].category == category){
                categoryItems.push(itemArray[i]);
            }
        }
        if(categoryItems.length === 0){
            reject("no results returned for the category items")
        }
        else{
            resolve(categoryItems);
        }
    })
}

module.exports.getItemsByMinDate = function(minDateStr){
    return new Promise((resolve, reject) =>{
        let minDateItem = [];
        for(let i = 0; i < itemArray.length; i++){
            if(new Date(itemArray[i].postDate) >= new Date(minDateStr)){
                minDateItem.push(itemArray[i]);
            }
        }
        if(minDateItem.length === 0){
            reject("no results returned for an array of items whose postDate is greater than the minimum")
        }
        else{
            resolve(minDateItem);
        }
    })
}

module.exports.getItemById = function(id){
    return new Promise((resolve, reject) =>{
        const itemId = itemArray.filter(item => item.id == id);
        if(itemId){
            resolve(itemId);
        }
        else{
            reject("no results returned for a single item object that matches with the id");
        }
    })
}

//filtering items by category 
module.exports.getPublishedItemsByCategory = function(category){
    return new Promise((resolve, reject)=>{
        let publishedItems = [];
        for(let i = 0; i < itemArray.length; i++){
            if(itemArray[i].published === true && itemArray[i].category == category){
                publishedItems.push(itemArray[i]);
            }
        }
        if(publishedItems.length === 0){
            reject("No results returned for published items");
        }
        else{
            resolve(publishedItems);
        }
    })
}