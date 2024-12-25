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
    const submissionCollection = database.collection("submissions");

    app.get("/user/:email", async (req, res) => {
        const query = {email: req.params.email};
        const result = await userCollection.findOne(query);
        console.log(result);
        if(result === null) res.send({}); 
        else res.send(result);
    });

    app.get("/user/:email/rooms", async (req, res) => {
        const query = {owner: req.params.email};
        const result = await roomCollection.find(query);
        const resArray = await result.toArray();
        if(resArray.length) res.send(resArray);
        else {
          const memberRes = await roomCollection.find({members: req.params.email});
          const memberArray = await memberRes.toArray();
          res.send(memberArray);
        } 
    });

    app.get("/room/:roomid", async (req, res) => {
        const query = {_id: new ObjectId(req.params.roomid)};
        const result = await roomCollection.findOne(query);
        const assignmentQuery = {roomId: req.params.roomid};

        const assignmentCursor = await assignmentCollection.find(assignmentQuery);
        const assignmentResult = await assignmentCursor.toArray();
        console.log(assignmentResult);
        if(result === null) res.send({}); 
        else res.send({...result, assignments: assignmentResult});
    });

    app.get("/room/:roomid/:assignmentid", async (req, res) => {
        const query = {_id: new ObjectId(req.params.assignmentid)};
        const result = await assignmentCollection.findOne(query);
        if(result === null) res.send({}); 
        else res.send(result);
    });

    app.post("/createassignment", async (req, res) => {
        const assignment = req.body;
        const result = await assignmentCollection.insertOne(assignment);
        res.send(result);
    });

    app.put("/editassignment", async (req, res) => {
      const {title, description, _id} = req.body;
      const filter = {_id: new ObjectId(_id)};
      const updatedAssignment = {$set: {title, description}};
      const result = await assignmentCollection.updateOne(filter, updatedAssignment);
      res.send(result);
    });

    app.delete("/deleteassignment/:id", async (req, res) => {
      const filterSubs = {assignmentId: req.params.id};
      const subResult = await submissionCollection.deleteMany(filterSubs);
      console.log(subResult);
      const filter = {_id: new ObjectId(req.params.id)};
      const result = await assignmentCollection.deleteOne(filter);
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

    app.get("/submission/:assignmentid", async (req, res) => {
        const query = {
          assignmentId: req.params.assignmentid
        };
        const result = await submissionCollection.find(query);
        const resArray = await result.toArray();
        res.send(resArray);
    });

    app.get("/submission/:assignmentid/:email", async (req, res) => {
        const query = {
          assignmentId: req.params.assignmentid,
          submittedBy: req.params.email
        };
        const result = await submissionCollection.findOne(query);
        res.send(result);
    });

    app.post("/submission", async (req, res) => {
        const submission = req.body;
        const result = await submissionCollection.insertOne(submission);
        res.send(result);
    });

    app.put("/submission/:submissionid", async (req, res) => {
      const {grade} = req.body;
      const filter = {_id: new ObjectId(req.params.submissionid)};
      const updatedSubmission = {$set: {grade}};
      const result = await submissionCollection.updateOne(filter, updatedSubmission);
      res.send(result);
    });

    app.post("/joinroom", async (req, res) => {
      const room = req.body;
      const dbRoom = await roomCollection.findOne({_id: new ObjectId(room.roomCode)});
      console.log(dbRoom);
      if(!dbRoom) res.send({status: 404})
      else {
        const updatedRoom = await roomCollection.updateOne({_id: new ObjectId(room.roomCode)},
        {$push: {members: room.user}}
      );
        if(updatedRoom.modifiedCount) res.send({status: 200});
      }
    });

    app.put("/editroom", async (req, res) => {
      const {roomName, description, _id} = req.body;
      const filter = {_id: new ObjectId(_id)};
      const updatedRoom = {$set: {roomName, description}};
      const result = await roomCollection.updateOne(filter, updatedRoom);
      res.send(result);
    });

    app.delete("/deleteroom/:id", async (req, res) => {
      const assignmentQuery = {roomId: req.params.id};
      const assignmentCursor = await assignmentCollection.find(assignmentQuery);
      const assignmentResult = await assignmentCursor.toArray();

      const assignmentIds = assignmentResult.map(item => (item._id.toString()));
      const assignmentObjectIds = assignmentResult.map(item => item._id);
      // delete all submissions of all assignments of the room
      const subResult = await submissionCollection.deleteMany({"assignmentId" : {"$in": assignmentIds}});
      console.log(subResult);

      // delete all assignments of the room
      const assignmentDel = await assignmentCollection.deleteMany({"_id": {"$in": assignmentObjectIds}});
      console.log(assignmentDel);

      // delete the room
      const result = await roomCollection.deleteOne({"_id": new ObjectId(req.params.id)});

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