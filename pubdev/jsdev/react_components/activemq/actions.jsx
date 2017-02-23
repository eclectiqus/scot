var Dispatcher = require('./dispatcher.jsx');
var client;
function s4(){
    return Math.floor((1+ Math.random()) * 0x10000).toString(16).substring(1);
}

function get_guid(){
    return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4()
}

function register_client(){
    client = get_guid()
    $.ajax({
        type: 'POST',
        url:'/scotaq/amq',
        data: {
            message: 'chat',
            type: 'listen',
            clientId: client,
            destination: 'topic://scot'
        }
    }).success(function(){
        console.log('Registered client as '+client);
    }).error(function() {
        console.log("Error: failed to register client, retry in 1 sec");
        setTimeout(function() {register_client()}, 1000);
    })
}

var Actions = {

   getClient: function(){
        register_client()
    },
    updateView: function(){
        var now = new Date();
        $.ajax({
            type: 'GET',
            url:  '/scotaq/amq',
            data: {
                /*loc: location.hash, */
                clientId: client,
                timeout: 20000,
                d: now.getTime(),
                r: Math.random(),
                json:'true',
                username: whoami
            }
        }).success(function(data) {
            console.log("Received Message")
            var set = setTimeout(function() {Actions.updateView()}, 40)
            var messages = $(data).text().split('\n')
            $.each(messages, function(key,message){
                if(message != ""){
                    var json = JSON.parse(message);
                    console.log(json)
                    Dispatcher.handleActivemq({
                        activemq: json
                    })
                }
            });       
        }).error(function(){
            setTimeout(function() {Actions.updateView()}, 1000)
            console.log('AMQ not detected, retrying in 1 second.')
        })
    }
}



module.exports = Actions
