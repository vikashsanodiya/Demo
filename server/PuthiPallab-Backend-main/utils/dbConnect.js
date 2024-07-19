import mongoose from "mongoose";
import ensureCounterSequence from "./ensureCounterSequence.js";

const mongodbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@puthipallab.1gtwpll.mongodb.net/puthipallab?retryWrites=true&w=majority
`;
// const localDbUrl = "mongodb://localhost:27017/puthipallab";

const dbConnect = async () => {
  await mongoose
    .connect(mongodbUrl)
    .then(async () => {
      await ensureCounterSequence();
      console.log("Successfully connected to MongoDB!");
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB", error);
    });
};

export default dbConnect;
