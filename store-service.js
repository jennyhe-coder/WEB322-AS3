const fs = require('fs');
const path = require("path");

//read all the data from the file and save it in the array
let itemArray = [];

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
            }
        })
    })
}

//Do the same for the categories file
let categoriesArray = [];
module.exports.initialize = function(){
    return new Promise((resolve, reject) =>{
        fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf-8', (err, data)=>{
            if(err){ //if error occured in code reject the promise and show err in console
                reject(err);
            }
            else{
                categoriesArray = JSON.parse(data); //convert the file's content into an array of objects  
                resolve();
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


