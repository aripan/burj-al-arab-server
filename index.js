const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const admin = require("firebase-admin");

app.use(cors());
app.use(express.json());

const serviceAccount = require("./config/burj-al-arab-91975-firebase-adminsdk-kxqny-0d1af6a669.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@burjalarab.xzssu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const bookingCollection = client.db("book").collection("bookings");

  app.post("/addBookings", (req, res) => {
    const newBooking = req.body;
    bookingCollection.insertOne(newBooking).then((result) => res.send(result));
  });

  app.get("/bookings", (req, res) => {
    console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    // idToken comes from the client app
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if (tokenEmail === req.query.email) {
            bookingCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => res.status(200).send(documents));
          } else {
            res.status(401).send("Unauthorized access");
          }
        })
        .catch(() => {
          res.status(401).send("Unauthorized access");
        });
    } else {
      res.status(401).send("Unauthorized access");
    }
  });
  console.log("DB connected successfully");
});

app.get("/", function (req, res) {
  res.send("hello world");
});

app.listen(5000, () => {
  console.log("listening on port 5000");
});
