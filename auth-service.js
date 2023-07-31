var mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    "userName": String,
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

let User; // to be defined on new connection (see initialize) 

module.exports.initialize = function(){
    return new Promise((resolve, reject) =>{
        let db = mongoose.createConnection("mongodb+srv://jennyhe1686:0n3d1r3ct10n@seneca.jyqatnu.mongodb.net/");
        db.on('error', (err) =>{
            reject(err); //reject promise with provided error
        });
        db.once('open', () =>{
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

//This function is slightly more complicated, as it needs to perform some data validation
module.exports.registerUser = function(userData){
    return new Promise((resolve, reject) =>{
        //if the passwords do not match 
        if(userData.password !== userData.password2){
            reject("Passwords do not match");
        }
        else{
            //create a new User from the userData passed 
            let newUser = new User(userData);

            // Encrypt the user entered password with it's hashed version
            bcrypt.hash(userData.password, 10).then(hash=>{ // Hash the password using a Salt that was generated using 10 rounds
                // TODO: Store the resulting "hash" value in the DB
                userData.password = hash;
                return newUser.save();
            })
            .then(() =>{
                resolve(userData.password);
            })
            .catch((err) =>{
                if(err.code === 11000){
                    reject("User Name already taken");
                }
                else{
                    reject("There was an error encrypting the password");
                }
            });
        };
    });
};


//This function is also more complex because, while we may find the user in the database whose userName property 
//matches userData.userName, the provided password (ie, userData.password) may not match (or the user may not be 
//found at all / there was an error with the query)
module.exports.checkUser = function(userData){
    return new Promise((reject, resolve) =>{
        User.find({
            userName : userData.userName
        })
        .exec()
        .then((users) =>{ //users will be an array of objects
            // Pull the password "hash" value from the DB and compare it to "myPassword123" (match)
            bcrypt.compare(userData.password, hash).then((result) => {
                if(result === false){  // does not match
                    reject("Incorrect Password for user: " + userData.userName);
                }
                else if(result === true){ //does match
                    const login = {
                        dateTime: (new Date()).toString(),
                        userAgent: userData.userAgent
                    }
                    users[0].loginHistory.push(login);
    
                    users.updateOne(
                        {userName: users[0].userName},
                        {$set: {
                            loginHistory: users[0].loginHistory
                        }}
                    )
                    .exec()
                    .then(() =>{
                        resolve(users[0]);
                    })
                    .catch((err) =>{
                        reject("There was an error verifying the user: " + err);
                    });
                }
                else{
                    reject("Unable to find user: " + userData.userName);
                }
            });
        }).catch((err) =>{
            reject("There was an error verifying the user: " + userData.userName);
        });
    });
};

