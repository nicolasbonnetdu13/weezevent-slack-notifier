var _ = require('lodash');

function SlackMessageProducer(){
};

function writeParticipants(participants) {
    return _.map(participants, function(participant){
        return participant.first_name+" "+participant.last_name+" "+(participant.paid?(participant.origin==="saisir"?"(Ajout manuel)":"(Payé "+participant.ticket_price+"chf)"):"(Non Payé)");
    }).join(", ");
};

SlackMessageProducer.prototype.produceMessageForLastParticipants = function(persistedParticipants, upToDateFetchedParticipants){
    var thresholdDate = persistedParticipants.latest_creation?Date.parse(persistedParticipants.latest_creation):0;

    var newParticipantsByTicket = _(upToDateFetchedParticipants)
        // First, filtering every fetched participants already present in persisted participants
        .filter(function(bdxioParticipant){
            return Date.parse(bdxioParticipant.create_date) > thresholdDate;
            // Grouping by ticket type
        }).groupBy('ticket').value();

    var msg = ':tada: ',
        ticketTypes = _.keys(newParticipantsByTicket),
        newParticipantsCount = _(newParticipantsByTicket).values().flatten().value().length,
        plural = newParticipantsCount>=2;

    if(ticketTypes.length === 0) {
        // Returning null won't trigger slack bot
        return null;
    } else if(ticketTypes.length === 1) {
        // If we only have 1 type of ticket price concerned, using the one-line-formatted message
        msg += newParticipantsCount+" place"+(plural?"s":"")+" de type "+ticketTypes[0]+" "+(plural?"viennent":"vient")+" d'être vendue"+(plural?"s":"")+" à : "+writeParticipants(newParticipantsByTicket[ticketTypes[0]]);
    } else {
        // If we have more than 1 type of tickets, using the multi-line big message
        msg += newParticipantsCount+" place"+(plural?"s viennent":" vient")+" d'être vendue"+(plural?"s":"")+" répartie"+(plural?"s":"")+" comme suit :\n";
        msg += _.reduce(newParticipantsByTicket, function(result, value, key) {
            var plural = value.length>=2;
            result += "- "+value.length+" place"+(plural?"s":"")+" "+key+" : "+writeParticipants(value)+"\n";
            newParticipantsCount += value.length;
            return result;
        }, "");
    }

    // Because emojis are important on slack ! \o/
    return msg;
};

SlackMessageProducer.prototype.produceMessageForAllParticipants = function(upToDateFetchedParticipants){
    var thresholdDate = 0;

    var allParticipantsByTicket = _(upToDateFetchedParticipants)
        // First, filtering every fetched participants already present in persisted participants
        .filter(function(bdxioParticipant){
            return Date.parse(bdxioParticipant.create_date) > thresholdDate;
            // Grouping by ticket type
        }).groupBy('ticket').value();

    var msg = 'Liste de tous les participants ayant un billet:\n',
        ticketTypes = _.keys(allParticipantsByTicket),
        newParticipantsCount = _(allParticipantsByTicket).values().flatten().value().length,
        plural = newParticipantsCount>=2;

    if(ticketTypes.length === 0) {
        // Returning null won't trigger slack bot
        return ":sob: Désolé mais il n'y a aucun participants d'inscrit.";
    } else if(ticketTypes.length === 1) {
        // If we only have 1 type of ticket price concerned, using the one-line-formatted message
        msg += newParticipantsCount+" place"+(plural?"s":"")+" de type "+ticketTypes[0]+" se sont vendue"+(plural?"s":"")+" à : "+writeParticipants(allParticipantsByTicket[ticketTypes[0]]);
    } else {
        // If we have more than 1 type of tickets, using the multi-line big message
        msg += newParticipantsCount+" place se sont vendue"+(plural?"s":"")+" répartie"+(plural?"s":"")+" comme suit :\n";
        msg += _.reduce(allParticipantsByTicket, function(result, value, key) {
            var plural = value.length>=2;
            result += "- "+value.length+" place"+(plural?"s":"")+" "+key+" : "+writeParticipants(value)+"\n";
            newParticipantsCount += value.length;
            return result;
        }, "");
    }

    // Because emojis are important on slack ! \o/
    return msg;
};

SlackMessageProducer.prototype.convertWZParticipantsToBDXIOParticipants = function(wzParticipants, wzTickets) {
    var ticketsById = _.keyBy(wzTickets, 'id');

    return _(wzParticipants)
        .map(function(wzParticipant) {
            if(!ticketsById[wzParticipant.id_ticket]) {
                return {
                    id: wzParticipant.buyer.id_acheteur,
                    ticket: "__unknown__",
                    ticket_price: 0,
                    deleted: false,
                    refund: false,
                    create_date: null,
                    paid: true,
                    origin: "__unknown__",
                    first_name: wzParticipant.buyer.acheteur_first_name,
                    last_name: wzParticipant.buyer.acheteur_last_name,
                    company: _.map(_.filter(wzParticipant.answers, function(answ){ return answ.label === 'Societe'; }), "value").join("")
                };
            } else {
                return {
                    id: wzParticipant.id_participant,
                    ticket: ticketsById[wzParticipant.id_ticket].name,
                    ticket_price: ticketsById[wzParticipant.id_ticket].price,
                    deleted: wzParticipant.deleted,
                    refund: wzParticipant.refund,
                    create_date: wzParticipant.create_date,
                    paid: wzParticipant.paid,
                    origin: wzParticipant.owner.origin,
                    first_name: wzParticipant.owner.first_name,
                    last_name: wzParticipant.owner.last_name,
                    company: _.map(_.filter(wzParticipant.answers, function(answ){ return answ.label === 'Societe'; }), "value").join("")
                };
            }
        }).filter(participant => !!participant).sortBy('create_date').value();
};

module.exports = SlackMessageProducer;
