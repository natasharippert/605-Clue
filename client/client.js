
// let msg = "pre anything";
// var item = document.createElement('li');
// item.textContent = msg;
// messages.appendChild(item);
// window.scrollTo(0, document.body.scrollHeight);

// ES6 import or TypeScript
// import { io } from "socket.io-client";
// CommonJS
// const io = require("socket.io-client");
 // start javascript section
// var socket = io('http://localhost:3000/');
var socket = io();
// const socket = io.connect("http://localhost:3001");

// msg = "post socket";
// var item = document.createElement('li');
// item.textContent = msg;
// messages.appendChild(item);
// window.scrollTo(0, document.body.scrollHeight);
   
var allCards = {
   "rooms" : ['Reception', 'ConferenceRoom', 'BreakRoom', 'Annex', 'Accounting', 'ParkingLot', 'Warehouse', 'Kitchen', 'MichaelsOffice'],
   "suspects" : ['Jim', 'Pam', 'Dwight', 'Angela', 'Michael', 'Andy',],
   "weapons" : ['DundieTrophy', 'PoisonedPretzel', 'CoffeeMug', 'BaconGrill', 'DunderMifflinPaper', 'RabidBat',],
}

var suspectSel = document.getElementById("suspectSel");
// suspectSel.options = allCards.suspects;
for (let i=0; i < allCards.suspects.length; i++) {
   suspectSel.options[suspectSel.options.length] = new Option(allCards.suspects[i], allCards.suspects[i]);
}
var weaponSel = document.getElementById("weaponSel");
for (let i=0; i < allCards.weapons.length; i++) {
   weaponSel.options[weaponSel.options.length] = new Option(allCards.weapons[i], allCards.weapons[i]);
}


 // !!!!!!!!!!!!!!!!!!
 // START input
 // !!!!!!!!!!!!!!!!!!

//  // this is for text based input
//  var form = document.getElementById('form');
//  var input = document.getElementById('input');

//  form.addEventListener('submit', function(e) {
//  e.preventDefault();
//  if (input.value) {
//     socket.emit('action', input.value);
//     input.value = '';
//  }
//  }); // end text based input

 //  this receives the message to send (which will go to all users)
 var messages = document.getElementById('messages');
 socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
 });
 // !!!!!!!!!!!!!!!!!!!!!
 // END chatting
 // !!!!!!!!!!!!!!!!!!!1

 // !!!!!!!!!!!!!!!!!!!!!
 // START usernames
 // !!!!!!!!!!!!!!!!!!!1
 var nameform = document.getElementById('nameform');
 var nameIn = document.getElementById('nameIn');

 // this will submit the username via emit to server (from 1 user)
 nameform.addEventListener('submit', function(e) {
 e.preventDefault();
 if (nameIn.value) {
    socket.emit('username', nameIn.value);
    nameIn.value = '';
    document.getElementById("userbutton").disabled = true;
    nameform.style.display = "none";
   //  toggleSuggestForm();

 }
 });


 // !!!!!!!!!!!!!!!!!!!!!
 // END usernames
 // !!!!!!!!!!!!!!!!!!!1


 // startgame
 var startButton = document.getElementById("start")
 startButton.addEventListener("click", function() { 
    
   socket.emit('go');
 }); 

 socket.on('startOff', () => {
   startButton.style.display = "none";
 });

 // showCard
var subShow = document.getElementById("showForm")
subShow.addEventListener('submit', function(e) {
   e.preventDefault();
   let showSelectn = document.getElementById('card2show');
   if (showSelectn.value) {
      socket.emit('showCard', showSelectn.value);
      showSelectn.value = '';
      togglePopup();
   }
});


// //suggestion button
var sugForm = document.getElementById('sugForm')
var suggestionButton = document.getElementById('suggestion')
suggestionButton.addEventListener('click', function() {   
   toggleSuggestForm();
});


//suggestion button
sugForm.addEventListener('submit', function(e) {
   e.preventDefault();
   if (suspectSel.value && weaponSel.value) {
      let data = {};
      data.suspect = suspectSel.value;
      data.weapon = weaponSel.value;
      socket.emit('makeSuggestion', data);
      toggleSuggestForm();
   }
});



//accusation button
var accusationButton = document.getElementById("accusation")
accusationButton.addEventListener("click", function () {
   socket.emit('makeAccusation');
});

//end button (end turn)
var endButton = document.getElementById("endbutton")
endButton.addEventListener("click", function () {
   socket.emit('endTurn');
});

// up button
var upButton = document.getElementById("up");
upButton.addEventListener("click", function() {
   socket.emit('goUp');
});

//down button 

var downButton = document.getElementById("down")
downButton.addEventListener("click", function () {
   socket.emit('goDown');
});


//right button 

var rightButton = document.getElementById("right") 
rightButton.addEventListener("click", function () {
   socket.emit('goRight');
});

//left button 

var leftButton = document.getElementById("left")
leftButton.addEventListener("click", function () {
   socket.emit('goLeft');
});

//passage button

var passageButton = document.getElementById("passage")
passageButton.addEventListener("click" , function() {
   socket.emit('goPassage');
});



 // endTurn to turn off buttons
 socket.on('endTurn', function() {         
    document.getElementById("chatbutton").disabled = true;
 });

 // startTurn to turn on buttons
 socket.on('startTurn', function() {  
   let actbut =    document.getElementById("chatbutton");    
   actbut.disabled = false;
 });

 socket.on('poke', (opts) => {
   let showLabel = document.getElementById('showLabel');
   let newLab = "Choose one of the following to show:"
   for (let i = 0; i < opts.length; i++) {
      newLab = newLab + " " + opts[i].name;
      if (i < opts.length - 1) {
         newLab = newLab + ","
      }
   }
   showLabel.innerHTML = newLab;
   togglePopup();
 });


socket.on('seeCard', (card) => {
   var item = document.createElement('li');
   let msg = "The card is: " + card;
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})
 
 // end javascript section

function togglePopup() { 
   const overlay = document.getElementById('popupOverlay'); 
   // overlay.classList.toggle('show');
   if (overlay.style.display === "block") {
      overlay.style.display = "none";
   } else {
      overlay.style.display = "block";
   } 
} 

function toggleSuggestForm() { 
   const suggestPopup = document.getElementById('suggestPopup'); 
   if (suggestPopup.style.display === "block") {
      suggestPopup.style.display = "none";
    } else {
      suggestPopup.style.display = "block";
    } 
} 

function displayCards(cards) {
   const cardsContainer = document.getElementById('cards-container');
   // Clear previous cards
   cardsContainer.innerHTML = '';

   // Iterate through the cards array and create HTML elements for each card
   cards.forEach(card => {
       const cardElement = document.createElement('div');
       cardElement.classList.add('card');
       cardElement.innerHTML = `
           <img src="${card.imageURL}" alt="${card.name}" title="${card.name}">
       `;
       cardsContainer.appendChild(cardElement);
   });
}

// Listen for 'dealCards' event from the server
socket.on('dealCards', function(cards) {
   console.log('Received cards:', cards);
   displayCards(cards);
});


const roomNames = {
   'room-0-0': 'Reception',
   'room-2-0': 'Conference Room',
   'room-4-0': 'Break Room',
   'room-0-2': 'Annex',
   'room-2-2': 'Accounting',
   'room-4-2': 'Parking lot',
   'room-0-4': 'Warehouse',
   'room-2-4': 'Kitchen',
   'room-4-4': 'Michaels Office'
};

socket.on('playerRoomPosition', (playerRoomPosition) => {
   console.log("Received positions: ", playerRoomPosition);
   const rooms = document.querySelectorAll('.room');
   rooms.forEach(room => {
      if (!playerRoomPosition.some(p => `room-${p.x}-${p.y}` === room.id)) {
         room.innerHTML = `<span class="room-name">${roomNames[room.id] || 'Unknown'}</span>`; // Reset with room name only
     }
   });

   playerRoomPosition.forEach(player => {
       const room = document.getElementById(`room-${player.x}-${player.y}`);
       if (room) {
            room.querySelectorAll('img').forEach(img => img.remove());
            const imgElement = document.createElement('img');
            imgElement.src = player.profile;
            imgElement.style.width = '50%';  
            imgElement.style.height = '50%'; 
            imgElement.style.display = 'block';
            room.appendChild(imgElement);  
       }
       else {
         console.log(`Room element not found for room-${player.x}-${player.y}`);
     }
   });
});