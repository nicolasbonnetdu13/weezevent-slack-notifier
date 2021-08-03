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

    self.Participants = self.sequelize.define('participants', {
        participants: {
            type: Sequelize.JSON
        },
        latest_creation: {
            type: Sequelize.DATE
        }
    }, { });
    self.Participants.sync({force: false})
};

Store.prototype.fetchPersistedParticipants = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.sequelize.authenticate().then(() => { 
            self.Participants.findOne({
                order: [ [ 'latest_creation', 'DESC' ]]
            }).then(function(storedParticipants) {
                resolve(storedParticipants);
            }).catch(function(error) {
                reject(error);
            });
        }).catch(err => {
            reject(err);
        });
    });
};

Store.prototype.persistParticipantsIn = function(participants) {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.sequelize.authenticate().then(() => { 
            self.Participants.create({
                participants: participants,
                latest_creation: _.max(_.map(participants, 'create_date'))
            }).then(function() {
                resolve();
            }).catch(function(error) {
                reject(error);
            });
        }).catch(err => {
            reject(err);
        });
    });
};

module.exports = Store;