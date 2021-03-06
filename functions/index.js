const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./utilities/fbAuth");
const { db } = require("./utilities/admin");

const {
  getAllScreams,
  postOneScream,
  getOneScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./handlers/screams");
const {
  signUp,
  logIn,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");

////////////////////Get Screams or posts///////////
app.get("/screams", getAllScreams);
app.post("/screams", FBAuth, postOneScream);
app.get("/scream/:screamId", getOneScream);
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);
app.get("/scream/:screamId/like", FBAuth, likeScream);
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
app.delete("/scream/:screamId", FBAuth, deleteScream);

///////////////////Sign In / Users Routes///////////////////
app.get("/signup", signUp);
app.post("/login", logIn);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.deleteNotificationsOnUnlike = functions.region("us-central1").firestore.document("likes/{id}").onDelete((snapshot) => {
  db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .then(() => {
      return;
    })
    .catch((err) => {
      console.error(err);
    });
});


exports.createNotificationOnLike = functions.region("us-central1").firestore.document("likes/{id}").onCreate((snapshot) => {
  db.doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: "like",
          read: false,
          screamId: doc.id,
        });
      }
    })
    .then(() => {
      return;
    })
    .catch((err) => {
      console.error(err);
      return;
    });
});

exports.createNotificationOnComment = functions.region("us-central1").firestore.document("comments/{id}").onCreate((snapshot) => {
  db.doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: "comment",
          read: false,
          screamId: doc.id,
        });
      }
    })
    .then(() => {
      return;
    })
    .catch((err) => {
      console.error(err);
      return;
    });
});

