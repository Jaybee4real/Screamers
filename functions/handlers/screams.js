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
    userHandle: req.user.userHandle,
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

    db.doc(`screams/${req.params.screamId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({ error: "Scream Not Found" });
        }
        return db.collection("comments").add(newComment);
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
