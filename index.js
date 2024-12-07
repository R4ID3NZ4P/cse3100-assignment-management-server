const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER, process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sml8dnv.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("notClassroomDB");
    const userCollection = database.collection("users");
    const roomCollection = database.collection("rooms");
    const assignmentCollection = database.collection("assignments");

    app.get("/user/:email", async (req, res) => {
        const query = {email: req.params.email};
        // console.log(query);
        const result = await userCollection.findOne(query);
        console.log(result);
        if(result === null) res.send({}); 
        else res.send(result);
    });

    app.get("/user/:email/rooms", async (req, res) => {
        const query = {owner: req.params.email};
        // console.log(query);
        const result = await roomCollection.find(query);
        const resArray = await result.toArray();
        // console.log(resArray);
        if(result === null) res.send({}); 
        else res.send(resArray);
    });

    app.get("/room/:roomid", async (req, res) => {
        const query = {_id: new ObjectId(req.params.roomid)};
        const result = await roomCollection.findOne(query);
        // console.log(result);
        const assignmentQuery = {roomId: req.params.roomid};

        const assignmentCursor = await assignmentCollection.find(assignmentQuery);
        const assignmentResult = await assignmentCursor.toArray();
        console.log(assignmentResult);
        if(result === null) res.send({}); 
        else res.send({...result, assignments: assignmentResult});
    });

    app.post("/createassignment", async (req, res) => {
        const assignment = req.body;
        const result = await assignmentCollection.insertOne(assignment);
        res.send(result);
    });

    app.post("/adduser", async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    app.post("/createroom", async (req, res) => {
        const room = req.body;
        const result = await roomCollection.insertOne(room);
        res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

// app.get("/brands/:brand", async (req, res) => {
//     const query = {brand: req.params.brand};
//     const cursor = productCollection.find(query);
//     const result = await cursor.toArray();
//     res.send(result);
// });

// app.get("/brands/:brand/:_id", async (req, res) => {
//   const query = {_id: new ObjectId(req.params._id)};
//   const result = await productCollection.findOne(query);;
//   res.send(result);
// });

// app.get("/cart/:user", async (req, res) => {
//     const query = {user: req.params.user};
//     console.log(query);
//     const result = await userCollection.findOne(query);
//     console.log(result);
//     if(result === null) res.send({}); 
//     else res.send(result);
// });

// app.get("/cartitem/:_id", async (req, res) => {
//   const query = {_id: new ObjectId(req.params._id)};
//   const result = await productCollection.findOne(query);;
//   res.send(result);
// });

// app.put("/brands/:brand/:_id/update", async (req, res) => {
//   const filter = {_id: new ObjectId(req.params._id)};
//   const options = {upsert: true};
//   const {
//     name,
//     image,
//     brand,
//     type,
//     price,
//     description,
//     rating
//   } = req.body;

//   const updatedProduct = {
//     $set: {
//       name,
//       image,
//       brand,
//       type,
//       price,
//       description,
//       rating
//     }
//   };
//   const result = await productCollection.updateOne(filter, updatedProduct, options);
//   console.log(result);
//   res.send(result);
// });

// app.put("/addtocart", async (req, res) => {
//   const {user, items} = req.body;
//   const filter = {user};
//   const options = {upsert: true};
//   const updatedCart = {$set: {user, items}};
//   const result = await userCollection.updateOne(filter, updatedCart, options);
//   res.send(result);
// })