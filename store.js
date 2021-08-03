var Promise = require('bluebird');
const Sequelize = require('sequelize')
var assert = require('assert');
var _ = require('lodash');

function Store(opts){
    var self = this;

    self.sequelize = new Sequelize(opts.db_url, {
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    self.sequelize.authenticate().then(() => { 
        console.log('Connection has been established successfully.');
    }).catch(err => {
        console.log('Unable to connect to the database:', err);
    });
    const User = self.sequelize.define('user', {
        firstName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        lastName: {
            type: Sequelize.STRING
        }
    }, { 
        // options
    });
};

Store.prototype.fetchPersistedParticipants = function(storeName){
    var self = this;

    return new Promise(function(resolve, reject) {
        self.sequelize.authenticate().then(() => { 
            resolve([]);
            console.log('Connection has been established successfully.');
        }).catch(err => {
            reject(err);
        });
        // MongoClient.connect(self.mongo_url, function(err, db){
        //     if(err) {
        //         reject(err);
        //         return;
        //     }

        //     db.collection('participants').find({ name: storeName }).limit(1).next(function(err, storeParticipants){
        //         if(err) {
        //             reject(err);
        //             return;
        //         }

        //         resolve(storeParticipants);
        //         db.close();
        //     });
        // });
    });
};

Store.prototype.persistParticipantsIn = function(storeName, participants) {
    var self = this;

    return new Promise(function(resolve, reject) {

        self.sequelize.authenticate().then(() => { 
            resolve();
            console.log('Connection has been established successfully.');
        }).catch(err => {
            reject(err);
        });
        // MongoClient.connect(self.mongo_url, function(err, db){
        //     if(err) {
        //         reject(err);
        //         return;
        //     }

        //     db.collection('participants').updateOne({ name: storeName }, { $set: {
        //         name: storeName,
        //         participants: participants,
        //         latest_creation: _.max(_.map(participants, 'create_date'))
        //     } }, function(err, r){
        //         if(err) {
        //             reject(err);
        //             return;
        //         }

        //         resolve();
        //         db.close();
        //     });
        // });
    });
};

module.exports = Store;