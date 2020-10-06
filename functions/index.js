const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./utilities/fbAuth");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signUp, logIn, uploadImage, addUserDetails } = require("./handlers/users");

////////////////////Get Screams or posts///////////
app.get("/screams", getAllScreams);
app.post("/screams", FBAuth, postOneScream);

///////////////////Sign In / Users Routes///////////////////
app.post("/signup", signUp);
app.post("/login", logIn);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);

exports.api = functions.https.onRequest(app);
