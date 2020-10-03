const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const config = (firebaseConfig = {
  apiKey: "AIzaSyAdC0RBmqCgT99jmX7XtSFQyB9MDy_TP64",
  authDomain: "screamers-5a283.firebaseapp.com",
  databaseURL: "https://screamers-5a283.firebaseio.com",
  projectId: "screamers-5a283",
  storageBucket: "screamers-5a283.appspot.com",
  messagingSenderId: "916491392774",
  appId: "1:916491392774:web:9ac2554cd4c38910f2f087",
  measurementId: "G-JX1X4354DT",
});

const app = require("express")();
const firebase = require("firebase");
firebase.initializeApp(config);

app.get("/screams", (req, res) => {
  admin
    .firestore()
    .collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(screams);
    })

    .catch((err) => console.error(err));
});

app.post("/screams", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(),
  };
  admin
    .firestore()
    .collection("screams")
    .add(newScream)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })

    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.err(err);
    });
});

//////Sign Up////

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassoword: req.body.confirmPassoword,
    userHandle: req.body.userHandle,
  };

  //////TODO Validate Data

  firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then((data) => {
      return res
        .status(201)
        .json({ message: `user ${data.user.uid} signed up successfully` });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
});

exports.api = functions.https.onRequest(app);
