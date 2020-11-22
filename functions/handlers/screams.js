const { app } = require("firebase-admin");
const { db } = require("../utilities/admin");

exports.getAllScreams = (req, res) => {
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
};

exports.postOneScream = (req, res) => {
  const newScream = {
    body: req.body.body,
    userImage: req.user.imageUrl,
    userHandle: req.user.userHandle,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };
  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      const screamData = newScream;
      screamData.screamId = doc.id;
      res.json({ screamData });
    })

    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.err(err);
    });
};

//////get One Scream
exports.getOneScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "scream not found!" });
      } else screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamId", "==", req.params.screamId)
        .get()
        .then((data) => {
          screamData.comments = [];
          data.forEach((doc) => {
            screamData.comments.push(doc.data());
          });
          return res.json(screamData);
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err: err.code });
    });
};

////////Comment On Scream

exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() == "")
    return res.status(400).json({ error: "Must Not BE Empty" });
  else {
    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      screamId: req.params.screamId,
      userHandle: req.user.userHandle,
      userImage: req.user.imageUrl,
    };
    let screamData;
    db.doc(`screams/${req.params.screamId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({ error: "Scream Not Found" });
        } else {
          screamData = doc.data();
          screamData.commentCount++;
          db.doc(`/screams/${req.params.screamId}`).update({
            commentCount: screamData.commentCount,
          });
          return db.collection("comments").add(newComment);
        }
      })
      .then(() => {
        res.json(newComment);
      })
      .catch((err) => {
        console.error(err + "error, from catch");
        res.status(500).json({ error: "Something went wrong" + err });
      });
  }
};

/////////Like A Scream//////

exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData;

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(400).json({ error: "Scream Not Found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.userHandle,
          })
          .then(() => {
            screamData.likeCount++;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      } else if (!data.empty) {
        return res.status(400).json({ error: "Scream Already Liked" });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.log(err);
    });
};

/////unlike a scream

exports.unlikeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData;

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(400).json({ error: "Scream Not Found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Scream Not Liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.log(err);
    });
};

//////Delete Scream///

exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Not Found" });
      }
      if (doc.data().userHandle !== req.user.userHandle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Scream Sucessfully Deleted" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code + "Something Went Wrong" });
    });
};
