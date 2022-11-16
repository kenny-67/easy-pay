const MongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};

const db = {
  connect: (url, done) => {
    if (state.db) return done();
    MongoClient.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) return done(err);
        state.db = client.db("easypay");
        done();
      }
    );
  },
  getCollection: (collectionName) => state.db.collection(collectionName),
  getDB: () => state.db,
  close: (done) => {
    if (state.db) {
      state.db.close((err, result) => {
        state.db = null;
        state.mode = null;
        done(err);
      });
    }
  },
};

module.exports = db;
