const { admin, db } = require("../utilities/admin");
const config = require("../utilities/config");

const firebase = require("firebase");
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../utilities/validators");
const { user } = require("firebase-functions/lib/providers/auth");

////////////Sign a user up/////////

exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userHandle: req.body.userHandle,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  const noImg = "no-img.png";

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId: userId,
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
};

//////Login User///////
exports.logIn = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials, Please Try Again" });
      } else return res.status(500).json({ error: err.code });
    });
};


////////////Update User Details//////////
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);
  db.doc(`/users/${req.user.userHandle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details added successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

////////Get Any Users Details///////
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`).get()
    .then(doc => {
      if (doc.exists) {
        userData.user = doc.data()
        return db.collection("screams").where("userHandle", "==", req.params.handle).orderBy("createdAt", "desc").get()
          .then(data => {
            userData.screams = []
            data.forEach(doc => {
              userData.screams.push({
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                screamId: doc.id
              })
            })
            return res.json({ userData })
          })
          .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code + err  })
          })
      }
      else {
        return res.status(404).json({error: "User Not Found"})
      }
    })
}

//////////////Get Own User Details//////////
exports.getAuthenticatedUser = (req, res) => {
  console.log("Boooom")
  let userData = {}
  db.doc(`/users/${req.user.userHandle}`).get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data()
        return db.collection("likes").where("userHandle", "==", req.user.userHandle).get()
      }
    })
    .then(data => {
      userData.likes = []
      data.forEach(doc => {
        userData.likes.push(doc.data())
      })
      return db.collection("notifications").where("recipient", "==", req.user.userHandle).orderBy("createdAt", "desc").get()
        .then(data => {
          userData.notificatons = []
          data.forEach(doc => {
            userData.notificatons.push({
              recipient: doc.data().recipient,
              sender: doc.data().sender,
              createdAt: doc.data().createdAt,
              screamId: doc.data().screamId,
              type: doc.data().type,
              read: doc.data().read,
              notificatonId: doc.id,
            })
          })
          return res.json({ userData })
        })
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code + err })
    })
}

//////Upload a profile Image of a user///////
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    ///////Handle bad image files Extension//////
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong File Type Submitted" });
    }
    ///////////////////

    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000000
    )}.${imageExtension}`;

    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.userHandle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        return res.status(500).json({
          error: err.code,
        });
      });
  });
  busboy.end(req.rawBody);
};


exports.markNotificationsRead = (req, res) => {
  let batch = db.batch()
  req.body.forEach(notificatonId => { 
    const notificaton = db.doc(`/notifications/${notificatonId}`)
    batch.update(notificaton, {
      read: true
    })
  })
  batch.commit()
  .then(() => {
    return res.json({message: "notifications marked read"})
  })
  .catch(err => {
    console.error(err)
    res.status(500).json({error: err + err.code})
  })
} 
