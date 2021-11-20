(function () {
  const sizeElement = document.getElementById("size")

  let mapHeight = 25;
  let mapWidth = 25;

  const roomRatio = 5;

  let numRooms = Math.floor((mapHeight / roomRatio) * (mapWidth / roomRatio));

  const canvas = document.getElementById("canvas");

  let map = createFreshMap();

  drawMap(map)

  document.getElementById("generateBtn").onclick = () => {
    mapHeight = mapWidth = sizeElement.value;
    numRooms = Math.floor((mapHeight / roomRatio) * (mapWidth / roomRatio));
    console.time('generate')
    generateMap()
    console.timeEnd('generate')
  }

  function addConnection(room1Tile, room2Tile) {
    let firstRoom = null;
    let secondRoom = null;

    if (room1Tile.x > room2Tile.x) {
      firstRoom = room2Tile;
      secondRoom = room1Tile;
    } else {
      firstRoom = room1Tile;
      secondRoom = room2Tile;
    }

    let firstRoomPlacement = null;

    if (firstRoom.y > secondRoom.y) {
      firstRoomPlacement = 'bottom';
    } else {
      firstRoomPlacement = 'top';
    }

    /**
     * So this is annoying. For top placement we go right/down and for bottom we go right/up
     * we can pick a direction at random.
     */

    let firstDirection = getRandomInt(1) === 0 ? 'vert' : 'side';

    let y = firstRoom.y;
    let x = firstRoom.x;
    const moveSide = () => {
      while (x !== secondRoom.x) {
        x++;
        map[y][x] = 'O'
      }
    }

    const moveVert = () => {
      // we need to give a shit about direction
      let step = firstRoom.y < secondRoom.y ? 1 : -1;

      while (y !== secondRoom.y) {
        y += step;
        map[y][x] = 'O'
      }
    }
    if (firstDirection === "vert") {
      moveVert();
      moveSide();
    } else {
      moveSide();
      moveVert();
    }
  }

  function getNewRoom1(connectedRooms, pullRoom, getClosestRoom) {
    let currentConnected = [...connectedRooms];
    while (currentConnected.length !== 0) {

      const index = getRandomInt(currentConnected.length)
      let room = currentConnected[index];
      currentConnected = currentConnected.filter(x => x !== room);

      let newClosest = getClosestRoom(room);

      if (newClosest !== null) {
        return { room1: room, room2: newClosest };
      }
    }

    return { room1: null, room2: null };
  }

  function generateMap() {
    map = createFreshMap()
    let rooms = []
    let mapForCollisions = createFreshMap();

    // for each room, try 5 times to not collide with another room until giving up and ending room generation
    let goodToContinue = true;
    for (let i = 0; i < numRooms; i++) {
      if (!goodToContinue) {
        break;
      }

      // start with 3x3 rooms and go from there
      for (let retry = 0; retry < 10; retry++) {
        let room = {
          height: 3 + getRandomInt(2),
          width: 3 + getRandomInt(2)
        }

        room = {
          ...room,
          x: getRandomInt(mapWidth - (room.width - 1)),
          y: getRandomInt(mapHeight - (room.height - 1))
        }

        let newMap = updateMap(room, map);

        if (newMap !== null) {
          goodToContinue = true;
          rooms.push(room);
          break;
        }
        else {
          // basically if it never succeeds don't keep trying to make new rooms
          goodToContinue = false;
        }
      }



      for (let room of rooms) {
        drawRoom(room);
      }
    }

    let indexer = 0;
    let roomsToConnect = rooms.map(r => ({
      ...r,
      id: indexer++
    }));
    console.log(roomsToConnect.length)

    const pullRoom = (arr = null) => {

      if (roomsToConnect.length === 0) {
        return null;
      }

      const index = getRandomInt(roomsToConnect.length)
      let room = roomsToConnect[index];
      return room;
    }

    // store anything with a connection (both sides)
    let connected = {};

    /**
     * This is what I want to do. Start with a random room
     * Find the three closest neighbors
     * connect to one of them at random if there are any that aren't connected to the network.
     * if it's not possible loop through the list to find a neighbor that isn't connected. and connect them and continue
     * If you cannot then error and end (we'll figure it out)
     */



    let allRooms = [...roomsToConnect];
    let connectedRooms = [];

    // to store weights, don't need to calculate if it's already here
    let weights = {};

    const getClosestRoom = (room, ignoreConnections) => {
      // this will be id: weight
      let tempWeights = [];

      for (let target of allRooms) {
        if (target.id === room.id) {
          // this is the current room, no need to check
          continue;
        }

        let weightKey = `${Math.min(room.id, target.id)}-${Math.max(room.id, target.id)}`

        if (weights[weightKey] !== undefined) {
          tempWeights.push({
            id: target.id,
            weight: weights[weightKey]
          })
        }
        else {
          let xDist = Math.abs(target.x - room.x);
          let yDist = Math.abs(target.y - room.y);

          let weight = (xDist + yDist) / 2;

          tempWeights.push({
            id: target.id,
            weight: weight
          })

          weights[weightKey] = weight;
        }
      }

      tempWeights.sort((a, b) => a.weight - b.weight);
      for (let i = 0; i < Math.min(3, tempWeights.length); i++) {
        if (connectedRooms.filter(x => x.id === tempWeights[i].id).length === 0) {
          return allRooms.filter(x => x.id === tempWeights[i].id)[0]
        }
      }
      // if we got nothing return null
      return null;
    }

    let room1 = pullRoom();
    connectedRooms.push(room1)
    do {
      let room2 = getClosestRoom(room1);

      if (room2 === null) {
        // let's try and get something else
        let newRooms = getNewRoom1(connectedRooms, pullRoom, getClosestRoom);
        room1 = newRooms.room1;
        room2 = newRooms.room2;

        if (room1 === null || room2 === null) {
          break;
        }
      }

      roomsToConnect = roomsToConnect.filter(x => x.id !== room1.id);
      roomsToConnect = roomsToConnect.filter(x => x.id !== room2.id);


      connectedRooms.push(room2)

      let room1Tile = getRandomRoomTile(room1);
      let room2Tile = getRandomRoomTile(room2);

      addConnection(room1Tile, room2Tile);

      room1 = room2;
    }
    while (true)


    let blackListed = roomsToConnect.map(x => rooms.filter(y => x.z === y.z && x.x === y.x)[0])

    drawMap()
  }

  function getRandomRoomTile(room) {
    return {
      x: room.x + getRandomInt(room.width),
      y: room.y + getRandomInt(room.height)
    }
  }

  function drawRoom(room, kind = 'O') {
    for (let currentY = room.y; currentY < room.y + room.height; currentY++) {
      for (let currentX = room.x; currentX < room.x + room.width; currentX++) {
        map[currentY][currentX] = kind;
      }
    }
  }
  function createFreshMap() {
    let map = []
    for (let y = 0; y < mapHeight; y++) {
      let row = [];
      for (let x = 0; x < mapWidth; x++) {
        row.push('X');
      }
      map.push(row);
    }
    return map;
  }
  function updateMap(room, map) {
    map = [...map.map(x => [...x])];

    let y = room.y === 0 ? room.y : room.y - 1;
    let x = room.x === 0 ? room.x : room.x - 1;

    let height = room.height + 2;
    let width = room.width + 2;

    for (let currentY = y; currentY < y + height; currentY++) {
      for (let currentX = x; currentX < x + width; currentX++) {
        // check for OOB
        if (currentX >= mapWidth || currentY >= mapHeight) {
          continue;
        }

        if (map[currentY][currentX] === 'O') {
          return null;
        }
        map[currentY][currentX] = 'O'
      }
    }

    // TODO: Check for rooms rubbing against each other

    return map;
  }

  function drawMap() {
    let buffer = map.map(x =>
      `<tr>${x.map(col => `<td class="${getColClass(col)}"></td>`).join('')}</tr>`
    ).join('\n');
    canvas.innerHTML = buffer;
  }

  function getColClass(c) {
    if (c === 'O') {
      return 'box box-open'
    }
    else {
      return 'box';
    }
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
})()

