(function () {
  const height = 10;
  const width = 10;

  const roomRatio = 5;

  const numRooms = Math.floor((height / roomRatio) * (width / roomRatio));

  const canvas = document.getElementById("canvas");

  let map = [];
  for (let y = 0; y < height; y++) {
    let row = [];
    for (let x = 0; x < width; x++) {
      row.push('X');
    }
    map.push(row);
  }

  drawMap(map)

  document.getElementById("generateBtn").onclick = () => {
    generateMap()
  }

  function generateMap() {
    let rooms = []
  }

  function drawMap() {
    let buffer = map.map(x =>
      `<tr>${x.map(col => `<td class="${getColClass(col)}"></td>`).join('')}</tr>`
    ).join('\n');
    console.log(buffer);
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
})()

