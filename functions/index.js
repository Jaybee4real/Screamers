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
const { user } = require("firebase-functions/lib/providers/auth");
firebase.initializeApp(config);

const db = admin.firestore();


////////////////////Get Screams or posts///////////
app.get("/screams", (req, res) => {
  db.collection("screams")
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
  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })

    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.err(err);
    });
});


///////////////////Sign Up//////////////////////////
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassoword: req.body.confirmPassoword,
    userHandle: req.body.userHandle,
  };

  let token, userId;
  db.doc(`/users/${newUser.userHandle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.userHandle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };

      db.doc(`/users/${newUser.userHandle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.https.onRequest(app);
