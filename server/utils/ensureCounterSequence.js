import Counter from "../models/counterModel.js";

const ensureCounterSequence = async (db, name) => {
  const existingDocument = await Counter.findOne();

  if (existingDocument) return;

  await Counter.create({ userSequence: 100, bookSequence: 100 });
};

export default ensureCounterSequence;
