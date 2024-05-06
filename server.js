const express = require('express');
const app = express();
const http = require('http');
const path = require('path');

const server = http.createServer(app);


const { Server } = require("socket.io");
const io = new Server(server);


const lib = require('./library');
const dr = require('./Driver');
const ca = require('./cardLogic');
const { players } = require('./Player.js');


app.use(express.static(path.join(__dirname, '/client')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/components/index.html');
});

let playerRoomPosition = [
   {name: "Jim", x: 1, y: 4, profile:'images/profile_jim.png'},
   {name: "Pam", x: 0, y: 3, profile:'images/profile_pam.png'},
   {name: "Dwight", x: 4, y: 1, profile:'images/profile_dwight.png'},
   {name: "Angela", x: 3, y: 0, profile:'images/profile_angela.png'},
   {name: "Michael", x: 3, y: 4, profile:'images/profile_michael.png'},
   {name: "Andy", x: 0, y: 1, profile:'images/profile_andy.png'}
]

let roomCoordinates = [
   {name: "Reception", x: 0, y: 0},
   {name: "ConferenceRoom", x: 2, y: 0},
   {name: "BreakRoom", x: 4, y: 0},
   {name: "Annex", x: 0, y: 2},
   {name: "Accounting", x: 2, y: 2},
   {name: "ParkingLot", x: 4, y: 2},
   {name: "Warehouse", x: 0, y: 4},
   {name: "Kitchen", x: 2, y: 4},
   {name: "MichaelsOffice", x: 4, y: 4}
]
   
var users = [];
var n = 0;
var data;

io.on('connection', (socket) => {
   io.emit('chat message', 'Welcome to Clue-Less! Enter your name and click start when all players have joined.');
   // initialize a user when they enter
   console.log('a user connected');
   n = n+1;

   var username = 'Player ' + n;

   users.push({
       'name' : username,
       'id' : socket.id,
   });
   io.emit('playerRoomPosition', playerRoomPosition);

   

   // this receives username, assigns it to socket for given user, and sends message to all that name has joined
   socket.on('username', (name) => {
      username = name;
      let iu = getUserIndex(socket.id);
      users[iu]['name'] = username;
      io.emit('chat message', username + ' joined the chat!!!');
      console.log(socket.id + ' is: ' + name);
   });


   // this receives a chat message and emits to all users
   // (IT DOESNT get used RN bc chat box is for playing game)
   socket.on('chat message', (msg) => {
      io.emit('chat message', username + ': ' + msg);
   });

   // when someone presses start button
   socket.on('go', () => {
      io.emit('chat message', 'Starting Game!!!');

      let msg = lib.genHello();
      io.emit('chat message', msg);

      data = dr.init(users);
      let players = data.players;
      // updatePlayerPositions()

      let cardTxt;
      for (let ip = 0; ip < data.players.length; ip++) {
         cardTxt = "Your cards are:";
         for (let ic = 0; ic < data.players[ip].cardList.length; ic++) {
            cardTxt = cardTxt + " " + data.players[ip].cardList[ic].name;
         } // end loop over cards
         io.to(data.players[ip].userID).emit('chat message', cardTxt);
      } // end loop over players

      msg = data.activePlayer.character + '(' + data.activePlayer.name + ') you are up!!';
      io.emit('chat message', msg);
      io.emit('startOff');

      let buttonList = dr.startTurn(data.activePlayer);
      io.to(data.activePlayer.userID).emit('startTurn', buttonList);

      users.forEach((user, index) => {
         // Send individual start data to each client
         io.to(user.id).emit('startGame', {
             character: data.players[index].charName,
             startRoom: data.players[index].startRoom
         });
      });

      players.forEach((player, index) => {
         io.to(players[index].userID).emit('dealCards', players[index].cardList);
       });
   });

   socket.on('showCard', (card) => {
      io.to(data.activePlayer.userID).emit('seeCard', card);
      
   });

   socket.on('goUp', () => {
      handleMove('up');
   });

   //socket on for move down
   socket.on('goDown', () => {
      handleMove('down');
   });

   //socket on for move right
   socket.on('goRight' , () => {
      handleMove('right');
   });

   //socket on for move left
   socket.on('goLeft', () => {
      handleMove('left');
   });

   //socket on for passage move
   socket.on('goPassage', () => {
      handleMove('passage'); 
   });

   socket.on('makeAccusation', (dat) => {
      let win;
      win = handleAccusation(dat);
      if (win) {
         io.emit('endGame', data.activePlayer, dat);
      }
      else {
         handleEnd();
      }
   });

   //socket on for suggestion
   socket.on('makeSuggestion', (dat) => {
      let pokee = handleSuggestion(dat);
      let msg;
      if (pokee == null) {
         msg = "Suggestion was not disproven!";
      }
      else {
         msg = "Waiting for " + pokee.character  + '(' + pokee.name + ') to show a card!'; 
      }
      io.emit('chat message', msg);
      io.to(data.activePlayer.userID).emit('postSugg');
   });

   //socket on end turn
   socket.on('endTurn', (data) => {
      handleEnd();
   });

   //     // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$
   //    // $$$ end socket.on(action) $$$
   //    // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$
   // });

      // $$$$$$$$$$$$$$$$$$$$$$$
      // $$$   functions     $$$
      // $$$$$$$$$$$$$$$$$$$$$$$      

      function handleMove(act) {
         // Create message start
         let msg = data.activePlayer.character + '(' + data.activePlayer.name + ') moved from ';
         
         
         const player = playerRoomPosition.find(p => p.name === data.activePlayer.character);
         if (!player) {
            console.log("Player not found");
            return;
         }

         switch (act) {
            case 'up':
                // Check if the move is within the bounds of the board
                if (player.y > 0) player.y--;
                break;
            case 'down':
                // Assuming the board has a maximum `y` value of 4 (based on your data)
                if (player.y < 4) player.y++;
                break;
            case 'left':
                if (player.x > 0) player.x--;
                break;
            case 'right':
                // Assuming the board has a maximum `x` value of 4
                if (player.x < 4) player.x++;
                break;
            case 'passage':
               if (player.x==0 && player.y ==0){
                  player.x = 4
                  player.y =4
               }
               else if (player.x==4 && player.y ==0){
                  player.x = 0
                  player.y =4
               }
               else if (player.x==0 && player.y ==4){
                  player.x = 4
                  player.y = 0
               }
               else if (player.x==4 && player.y ==4){
                  player.x = 0
                  player.y = 0
               }
               break;
        }

         // Create descriptive message of first room for text based
         let adr = 'hallway';
         if (data.activePlayer.room.name != 'hallway') {
            let ir = 0;
            let found = false;
            while (!found) {
               if (data.rooms[ir].name == data.activePlayer.room.name) {
                  found = true;
               }
               else {ir++}
            }

            adr = data.activePlayer.room.name + '(room #' + ir + ') to ';
         }
         msg = msg + adr;

         // Run move method to update data structures
         dr.move(data.activePlayer, act);
         io.emit('playerRoomPosition', playerRoomPosition);

         // Add new room to message
         msg = msg + data.activePlayer.room.name;
         io.emit('chat message', msg);
         io.to(data.activePlayer.userID).emit('postMove', data.activePlayer.room.name);

         // updatePlayerPositions();
      }

      function handleEnd() {
         // Deactivate player button
         io.to(data.activePlayer.userID).emit('endTurn');

         // end turn and pass return value (next player) back
         data.activePlayer = dr.endTurn(data.activePlayer)
         

         // Start active player turn (initialize vars and activate button)
         let buttonList = dr.startTurn(data.activePlayer);
         io.to(data.activePlayer.userID).emit('startTurn', buttonList);

         // // Start active player turn (initialize vars and activate button)
         // dr.startTurn(data.activePlayer);
         // io.to(data.activePlayer.userID).emit('startTurn');

         // Tell next player they're up
         let msg = data.activePlayer.character + '(' + data.activePlayer.name + ') you are up!!';
         io.emit('chat message', msg);
      }

      function handleSuggestion(sug) {

         var suggestion = dr.makeSuggestion(data.activePlayer, sug.suspect, sug.weapon)
         let susPlayer = playerRoomPosition.find(player => player.name === suggestion.suspect);
         let susRoom = roomCoordinates.find(room => room.name === suggestion.room);
         susPlayer.x = susRoom.x;
         susPlayer.y = susRoom.y;
         io.emit('playerRoomPosition', playerRoomPosition);
         for (let ip = 0; ip < data.players.length; ip++) {
            if (suggestion.suspect == data.players[ip].character) {
               let roomObj = getPropMatchObj(data.rooms, 'name', suggestion.room);
               data.players[ip].jump(roomObj)
               io.emit('chat message', data.players[ip].character + '(' + data.players[ip].name + ') got moved to ' + suggestion.room )
            }
         }

         playerToPoke = dr.pollSuggestion(data.activePlayer, suggestion, data.players.length);
         // io.emit('chat message', 'in suggestion');

         data.activePlayer.hasSuggested = true;

         if (playerToPoke == null) {
            return null;
         }

         var opts = playerToPoke.checkPoll(suggestion);
         
         // io.emit('chat message', 'ab 2 poke');
         // io.to(playerToPoke.userID).emit('chat message', 'im gonna poke you');

         socket.to(playerToPoke.userID).emit('poke', opts);

         

         

         return  playerToPoke;
      }

      function handleAccusation(acc) {         
         var accusation = dr.makeSuggestion(data.activePlayer, acc.suspect, acc.weapon, true, acc.room)
         var isRight = dr.checkAccusation(accusation, data.secret);

         let msg;
         if (isRight) {
            msg = data.activePlayer.character + '(' + data.activePlayer.name + ') won the game!!!!'
         }
         else {
            let iActiv = getUserIndex(data.activePlayer.userID);
            let iLast, iNew;
            if (iActiv == 0) {
               iLast = data.players.length-1;
            }
            else {iLast = iActiv - 1;}
            if (iActiv == data.players.length-1) {
               iNew = 0;
            }
            else {iNew = iActiv + 1;}

            data.players[iLast].next = data.players[iNew];
            data.players.splice(iActiv,1);
            msg = data.activePlayer.character + '(' + data.activePlayer.name + ') was wrong - they are out of the game'
         }
         io.emit('chat message', msg);
         return isRight;
      }

     
   


// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$ end io.on(connection) $$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});



function getUserIndex(id) {
   let i = 0;
   let found = false;
   while (!found) {
      if (users[i]['id'] == id) {
         found = true;
      }
      else {
         i++;
      }
   }
   return i;
}

function getPropMatchObj(objArray, propStr, strMatch) {
   let match = null;
   for (let i = 0; i < objArray.length; i++) {
      if (objArray[i][propStr] == strMatch) {
         match = objArray[i];
      }
   }
   return match;
}

// // This should be called whenever you need to update the player positions, such as after a move or at game start.
// function updatePlayerPositions() {
//    playerRoomPosition = data.players
//        .filter(player => player.active)  // Only include active players
//        .map(player => ({
//            name: player.character,  // Assuming you store the character's name here
//            x: player.room.x,        // You need these properties in your player or room object
//            y: player.room.y,
//            profile: player.profile  // Path to image of the character
//        }));
//        console.log("Emitting updated positions: ", playerRoomPosition);
//    io.emit('playerRoomPosition', playerRoomPosition);
// }


