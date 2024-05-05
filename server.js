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
  res.sendFile(__dirname + '/client/index.html');
});

let playerRoomPosition = [
   {name: "Jim", x: 1, y: 4, profile:'images/profile_jim.png'},
   {name: "Pam", x: 0, y: 3, profile:'images/profile_pam.png'},
   {name: "Dwight", x: 4, y: 1, profile:'images/profile_dwight.png'},
   {name: "Angela", x: 3, y: 0, profile:'images/profile_angela.png'},
   {name: "Michael", x: 3, y: 4, profile:'images/profile_michael.png'},
   {name: "Andy", x: 0, y: 1, profile:'images/profile_andy.png'}
]

var users = [];
var n = 0;
var data;

io.on('connection', (socket) => {
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

      msg = data.activePlayer.character + '(' + data.activePlayer.name + ') you are up!!';
      io.emit('chat message', msg);
      io.emit('startOff');

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

      // // Populate each player's cardList
      // const playerHands = ca.DealCards(users.length);
      // users.forEach((user, index) => {
      //    user.cardList = playerHands[index];
      // });

      // // Emit the 'dealCards' event with the player's card list
      // users.forEach(user => {
      //    io.to(user.id).emit('dealCards', user.cardList);
      // });
      
      io.to(data.activePlayer.userID).emit('startTurn');
   });

   socket.on('showCard', (card) => {
      io.to(data.activePlayer.userID).emit('seeCard', card);
      
   });

   socket.on('suggestion', (data) => {
      handleSuggestion(data);
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

   socket.on('makeAccusation', (data) => {
      handleAccusation('accusation', data);
   });

   //socket on for suggestion
   socket.on('makeSuggestion', (data) => {
      handleSuggestion( data);
   });

   //socket on end turn
   socket.on('endTurn', (data) => {
      handleEnd();
   });

   // // when someone submits action text
   // socket.on('action', (act) => {
   //    let all = act.split(" ");
   //    if (all.length > 1) {
   //       act = all[0];
   //    }

   //    switch (act) {
   //       case 'suggestion':
   //          handleSuggestion(all);
   //          break;
   //       case 'accusation':
   //          let msg = handleAccusation(all);
   //          io.emit('chat message', msg)
   //          break;
   //       case 'end':
   //          handleEnd();
   //          break;
   //       default:
   //          if (act == 'up' || act == 'down' || act == 'left' || act == 'right' || act == 'passage') {
   //             handleMove(act);
   //          }
   //          else {
   //             io.emit('chat message', 'Invalid entry!!!');
   //          }
   //    }
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
         // updatePlayerPositions();
      }

      function handleEnd() {
         // Deactivate player button
         io.to(data.activePlayer.userID).emit('endTurn');

         // end turn and pass return value (next player) back
         data.activePlayer = dr.endTurn(data.activePlayer)
         

         // Start active player turn (initialize vars and activate button)
         dr.startTurn(data.activePlayer);
         io.to(data.activePlayer.userID).emit('startTurn');

         // Tell next player they're up
         let msg = data.activePlayer.character + '(' + data.activePlayer.name + ') you are up!!';
         io.emit('chat message', msg);
      }

      function handleSuggestion(sug) {

         var suggestion = dr.makeSuggestion(data.activePlayer, sug.suspect, sug.weapon)

         playerToPoke = dr.pollSuggestion(data.activePlayer, suggestion, data.players.length);
         // io.emit('chat message', 'in suggestion');

         if (playerToPoke == null) {
            return 'Suggestion was not disproven'
         }

         var opts = playerToPoke.checkPoll(suggestion);
         
         io.emit('chat message', 'ab 2 poke');
         io.to(playerToPoke.userID).emit('chat message', 'im gonna poke you');

         socket.to(playerToPoke.userID).emit('poke', opts);

         

         data.activePlayer.hasSuggested = true;

         return  playerToPoke.name + ' showed a card'
      }

      function handleAccusation(accArray) {
         let suspect = accArray[1];
         let weapon = accArray[2];
         let room = accArray[3];
         
         var accusation = makeSuggestion(data.activePlayer, suspect, weapon, true, room)
         var isRight = dr.checkAccusation(accusation, data.secret);

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


