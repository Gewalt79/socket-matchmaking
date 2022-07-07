const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.URI_LINK;
const baza = process.env.BAZA;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect(async function (err, client) {
  console.log('connected to database: ' + baza);
});

module.exports.createLobby = function (lobbyID) {
  return new Promise((resolve, reject) => {
    client.connect(function (err) {
      if (err) {
        reject(err);
      }
      client.db(baza).createCollection(lobbyID, (err, results) => {
        if (err) {
          reject(err);
        }
        client.close();
        resolve(results);
      });
    });
  });
};

module.exports.fillLobby = function (teams, lobbyID) {
  return new Promise((resolve, reject) => {
    client.connect(function (err) {
      if (err) {
        reject(err);
      }
      client
        .db(baza)
        .collection(lobbyID)
        .insertMany(teams, function (err, results) {
          if (err) {
            reject(err);
          }
          client.close();
          resolve(results);
        });
    });
  });
};

module.exports.deleteLobby = function (lobbyID) {
  return new Promise((resolve, reject) => {
    client.connect(function (err) {
      if (err) {
        reject(err);
      }
      client.db(baza).collection(lobbyID).drop((err, results) => {
        if (err) {
          reject(err);
        }
        client.close();
        resolve(results);
      });
    });
  });
};