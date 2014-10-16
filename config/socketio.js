'use strict';

var updaterService = require('../app/service/superheros');


function joinRoom(socket,room) {
	socket.join(room);
}

function handleRoomJoin(socket) {
	socket.on('join',function(data) {
		joinRoom(socket,data.roomName);
	});
}

function handleClientDisconnect(socket) {
	socket.on('disconnect',function(){
	});
}

module.exports = function(app) {
	//Get socketIO
	var socketio = require('socket.io')(app);

	var lineCount = 0; 
	var convertedLine = 0;

	//Get Connected
	socketio.on('connection',function(socket){
		socket.emit('connected',{connected:'connected'});

		handleRoomJoin(socket);

		handleClientDisconnect(socket);

		//Release updater
		socket.on('start-to-release-updater',function(data){
			console.log(data);
			//1 step
			// socket.emit('updater-inf-line-count',{
			// 	infLine:lineCount,
			// 	convertedLine:0
			// });

			//2 step
			updaterService.releaseCompanyUpdater(data,socket);
			//updaterService.sendProgressMessage(data,socket,'5417db9bbc561f242a30c8cb');
		});

		//Convert products: CWS,CJK,CSR..
		socket.on('start-to-convert-product',function(data){
			console.log(data.productVersion + data.productDirectory);
			updaterService.convertProductForCompanyUpdater(data,socket);
		});


		socket.on('start-to-release-updater-reply',function(data){
			var convertedLineFromClient = data.convertedLine;
			convertedLine = convertedLine>convertedLineFromClient?convertedLine:convertedLineFromClient;
		});



	});

	//
}