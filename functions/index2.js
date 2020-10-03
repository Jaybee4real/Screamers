
////////////////////////////Screams Fectch FUunction///////////////////////
app.get("/screams", (req, res) => {
    db.collection("screams")
      .orderBy("createdAt", "desc")
      .get()
      .then((data) => {
        let screams = [];
        data.forEach((document) => {
          screams.push({
            screamId: document.id,
            body: document.data().body,
            userHandle: document.data().userHandle,
            createdAt: document.data().createdAt,
          });
        });
        return response.json(screams);
      })
      .catch((error) => console.error(error));
  });
  
  /////////////Screams Post Function////////////////////////////
  
  const FirebaseAuth = (req, res, next) => {
    let idToken;
    if (
      request.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      idToken = req.headers.authorization.split("Bearer ")[1];
    } else {
      console.error("No token found");
      return res.status(403).json({ error: "Unauthorized(id Token)" });
    }
  
    admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        req.user = decodedToken;
        console.log(decodedToken);
        return db
          .collection("users")
          .where("userId", "==", req.user.uid)
          .limit(1)
          .get();
      })
  
      .then((data) => {
        req.user.handle = data.docs[0].data().handle;
        return next();
      })
  
      .catch((error) => {
        console.error("Error while verifying token");
        return res.status(403).json({ error });
      });
  };
  
  app.post("/screams", FirebaseAuth, (req, res) => {
    const newScream = {
      body: req.body.body,
      userHandle: req.user.handle,
      createdAt: new Date().toISOString(),
    };
  
    db.collection("Screams")
      .add(newScream)
      .then((document) => {
        res.json({ message: `document ${document.id} created successfully` });
      })
  
      .catch((error) => {
        res.status(500).json({ error: `something went wrong` });
        console.error(error);
      });
  });
  
  const isEmail = (email) => {
    const RegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
    if (email.match(regEx)) return true;
    else return false;
  };
  
  const isEmpty = (string) => {
    if (string.trim() === "") return true;
    else return false;
  };
  
  //////////////////////Signup fuction //////////////////////////////;
  
  app.post("./signup", (req, res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle,
    };
  
    let errors = {};
  
    if (isEmpty(newUser.email)) {
      errors.email = "Must not be empty";
    } else if (!isEmail(newUser.email)) {
      errors.email = "Must be a valid email address";
    }
  
    if (isEmpty(newUser.password)) {
      errors.password = "Must not be empty";
    }
  
    if (newUser.passoword !== newUser.confirmPassword) {
      errors.confirmPassword = "Passwords must match";
    } else if (!isEmail(newUser.handle)) {
      errors.handle = "Must be a valid email address";
    }
  
    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }
  
    let token, userId;
    db.doc(`./users =/${newUSer.handle}`)
      .get()
      .then((document) => {
        if (doc.exists) {
          return res.status(400).json({ handle: "this handle is already taken" });
        } else {
          firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUSer.password);
        }
      })
  
      .then((data) => {
        userId - data.user.uid;
        return data.user.getIdToken();
      })
  
      .then((idToken) => {
        token = idToken;
        const userCredenetials = {
          handle: newUser.handle,
          email: newUser.email,
          createdAt: new Date().toISOString(),
          userId,
        };
        db.doc(`./users/${newUser.handle}`).set(userCredenetials);
      })
  
      .then(() => {
        return res.status(201).json({ token });
      })
  
      .catch((error) => {
        console.error(error);
  
        if (error.code === "auth/email-already-in-use") {
          return res.status(400).json({ email: "Email is already in use" });
        } else {
          return res.status(500).json({ error: error.code });
        }
      });
  });
  
  /////////////////Login Function///////////////
  
  app.post("/login", (req, res) => {
    const user = {
      email: req.body.email,
      password: req.body.passoword,
    };
  
    let errors = {};
  
    if (isEmpty(user.email)) errprs.email = "Must not be empty";
    if (isEmpty(user.password)) errors.passoword = "Must not be empty";
  
    if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  
    firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.passoword)
      .then((data) => {
        return data.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
  
      .catch((error) => {
        console.log(error);
        if (error.code === "auth/wrong-password") {
          return res
            .status(403)
            .json({ general: "wrong credentials, please try again" });
        } else
          return res
            .status(500)
            .json({ error: `something went wrong  :( : ${error.code} ` });
      });
  });
  
  exports.api = functions.https.onRequest(app);
  