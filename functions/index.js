const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./utilities/fbAuth");

const { getAllScreams, postOneScream, getOneScream } = require("./handlers/screams");
const { signUp, logIn, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handlers/users");

////////////////////Get Screams or posts///////////
app.get("/screams", getAllScreams);
app.post("/screams", FBAuth, postOneScream);
app.get("/scream/:screamId", getOneScream)

///todo
//Like a Scream
//Unlike a Scream
//Coment on a scream

///////////////////Sign In / Users Routes///////////////////
app.post("/signup", signUp);
app.post("/login", logIn);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/scream/:screamId", getOneScream)



exports.api = functions.https.onRequest(app);
