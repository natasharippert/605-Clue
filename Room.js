// Room object

//NOTE: can I use name val pairs???
class Room{
   constructor(name, imgURL, x, y, occupancy = 50, up=null, left=null, right=null, down=null, passage=null, occupants=new Set(), weapons=new Set())  {
      this.name =  name;
      this.imgURL =  imgURL;
      // this.x = x; // X coordinate
      // this.y = y; // Y coordinate
		this.up =  up;
		this.left =  left;
		this.right =  right;
		this.down =  down;
		this.passage =  passage;
		this.occupants =  occupants;
      this.weapons =  weapons;
      this.occupancy =  occupancy;
   }

      // Move the character to the requested position
      removePlayer(player){
            this.occupants.delete(player);
      } // end removePlayer

      addPlayer(player){
         this.occupants.add(player);
      } // end addPlayer

      
      // Move the weapon to the requested position
      removeWeapon(weapon){
         this.occupants.delete(weapon);
      } // end removeWeapon

      addWeapon(weapon){
         this.occupants.add(weapon);
      } // end addWeapon

      isfull() {
         if (this.occupants.length > this.occupancy) {
            return true;
         }
         else {
            return false;
         }
      }
      
         


} // end Room

// var allRooms = [
//    new Room('Reception', 'images/card_reception.png', 0, 0),
//    new Room('ConferenceRoom', 'images/card_conference.png', 1, 0),
//    new Room('BreakRoom', 'images/card_break.png', 2, 0),
//    new Room('Annex', 'images/card_annex.png', 0, 1),
//    new Room('Accounting', 'images/card_accounting.png', 1, 1),
//    new Room('ParkingLot', 'images/card_parking.png', 2, 1),
//    new Room('Warehouse', 'images/card_warehouse.png', 0, 2),
//    new Room('Kitchen', 'images/card_kitchen.png', 1, 2),
//    new Room('MichaelsOffice', 'images/card_office.png', 2, 2),
// ];

module.exports = { Room };