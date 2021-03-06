(function(window){
  var SUPER7 = window.SUPER7 = {};
  SUPER7.levels = [];
  
  // Bullet min speed, Bullet max speed, Bullet rate,
  // Monster min speed, Monster max speed, Monster rate, Boss speed
  SUPER7.levels[0] = [3, 3, 200, 1, 3, 1000, 1];
  SUPER7.levels[1] = [3, 3, 200, 2, 3, 800,  1];
  SUPER7.levels[2] = [3, 3, 300, 2, 3, 600,  1];
  SUPER7.levels[3] = [3, 3, 300, 2, 4, 500,  1];
  SUPER7.levels[4] = [3, 3, 400, 2, 4, 400,  2];
  SUPER7.levels[5] = [3, 3, 500, 3, 5, 300,  2];
  SUPER7.levels[6] = [3, 3, 600, 3, 5, 200,  2];
  SUPER7.levels[7] = [3, 3, 700, 3, 5, 100,  2];
  SUPER7.levels[8] = [3, 3, 800, 3, 5, 100,  2];
  SUPER7.levels[9] = [3, 3, 900, 3, 5, 80,   2];
  
  // Boss colors
  SUPER7.levels[0][7] = [
    [240, 0,  52],
    [51,  8,  52],
    [51,  17, 51],
    [200, 1,  47],
    [240, 0,  42]
  ];
  SUPER7.levels[1][7] = [
    [0, 60, 40],
    [0, 60, 40],
    [0, 60, 40],
    [0, 60, 40],
    [0, 60, 40]
  ];
  SUPER7.levels[2][7] = [
    [40, 60, 40],
    [40, 60, 40],
    [40, 60, 40],
    [40, 60, 40],
    [40, 60, 40]
  ];
  SUPER7.levels[3][7] = [
    [80, 60, 40],
    [80, 60, 40],
    [80, 60, 40],
    [80, 60, 40],
    [80, 60, 40]
  ];
  SUPER7.levels[4][7] = [
    [120, 60, 40],
    [120, 60, 40],
    [120, 60, 40],
    [120, 60, 40],
    [120, 60, 40]
  ];
  SUPER7.levels[5][7] = [
    [160, 60, 40],
    [160, 60, 40],
    [160, 60, 40],
    [160, 60, 40],
    [160, 60, 40]
  ];
  SUPER7.levels[6][7] = [
    [200, 60, 40],
    [200, 60, 40],
    [200, 60, 40],
    [200, 60, 40],
    [200, 60, 40]
  ];
  SUPER7.levels[7][7] = [
    [240, 60, 40],
    [240, 60, 40],
    [240, 60, 40],
    [240, 60, 40],
    [240, 60, 40]
  ];
  SUPER7.levels[8][7] = [
    [280, 60, 40],
    [280, 60, 40],
    [280, 60, 40],
    [280, 60, 40],
    [280, 60, 40]
  ];
  SUPER7.levels[9][7] = [
    [320, 60, 40],
    [320, 60, 40],
    [320, 60, 40],
    [320, 60, 40],
    [320, 60, 40]
  ];
})(this);
