(function(window, document, KeyboardJS){
  'use strict';

  var levelElt = document.getElementById('lvl'),
      // BASE_URL = 'http://pierrebertet.net/tmp/7/',
      BASE_URL = '',
      CANVAS_WIDTH = 550,
      CANVAS_HEIGHT = 550,
      MUTE_SOUND = false,
      MAX_FPS = 60,
      GAME_SPEED = 20,
      INSTRUCTIONS = [
        'YOU ARE THE GREEN GUY.',
        'THERE IS A GREY BOSS.',
        'YOU HAVE TO KILL HIM.',
        'BUT HE HAS TO KILL YOU TOO.',
        'AVOID ITS BULLETS. KILL HIM FIRST.',
        'GOOD LUCK.',
        'PRESS [SPACE]'
      ],
      PLAYER_SPEED = 4,
      BULLET_MIN_SPEED = 3,
      BULLET_MAX_SPEED = 3,
      BULLET_RATE = 200,
      MONSTER_MIN_SPEED = 1,
      MONSTER_MAX_SPEED = 3,
      MONSTER_RATE = 1000,
      BOSS_SPEED = 1,
      LEVELS = [
        [BULLET_MIN_SPEED, BULLET_MAX_SPEED, BULLET_RATE, MONSTER_MIN_SPEED, MONSTER_MAX_SPEED, MONSTER_RATE, BOSS_SPEED],
        [3,                3,                200,         2,                 3,                 800,          1],
        [3,                3,                300,         2,                 3,                 600,          1],
        [3,                3,                300,         2,                 4,                 500,          1],
        [3,                3,                400,         2,                 4,                 400,          2],
        [3,                3,                500,         3,                 5,                 300,          2],
        [3,                3,                600,         3,                 5,                 200,          2],
        [3,                3,                700,         3,                 5,                 100,          2],
        [3,                3,                800,         3,                 5,                 100,          2],
        [3,                3,                900,         3,                 5,                 80,           2]
      ],
      PLAYER_SIZE = 11,
      BULLET_SIZE = 5,
      BOSS_SIZE = 11,
      MONSTER_SIZE = 5,
      IMAGES = ['boss', 'player', 'bullet', 'monster'],
      SOUNDS = ['bullet', 'monster', 'death', 'level', 'win'],
      level = {},
      pressedKeys = { left: false, right: false, up: false, down: false },
      lastRenderTime = null,
      game = null,
      canv = document.getElementById('c'),
      ctx = canv.getContext('2d');
  
  canv.width = CANVAS_WIDTH;
  canv.height = CANVAS_HEIGHT;
  canv.style.backgroundColor = '#1D1F23';
  
  /* Utilities */
  var getRandomInt = function(min, max, excludes) {
    var result = Math.floor(Math.random() * (max - min + 1)) + min;
    if (excludes && excludes.indexOf(result) !== -1) {
      return getRandomInt(min, max, excludes);
    }
    return result;
  };
  var inherits = function(Sub, Base) {
    var F = function(){};
    F.prototype = Base.prototype;
    Sub.prototype = new F();
    Sub.prototype.constructor = Sub;
  };
  
  /* Keyboard events */
  KeyboardJS.bind.key('up', function(){ pressedKeys.up = true; }, function(){ pressedKeys.up = false; });
  KeyboardJS.bind.key('down', function(){ pressedKeys.down = true; }, function(){ pressedKeys.down = false; });
  KeyboardJS.bind.key('left', function(){ pressedKeys.left = true; }, function(){ pressedKeys.left = false; });
  KeyboardJS.bind.key('right', function(){ pressedKeys.right = true; }, function(){ pressedKeys.right = false; });
  
  /* Change the current level */
  var setLevel = function(levelNum) {
    if (LEVELS.length < levelNum + 1) {
      return false;
    }
    levelElt.innerHTML = ' - LEVEL ' + (levelNum + 1);
    level.num = levelNum;
    level.BULLET_MIN_SPEED  = LEVELS[levelNum][0];
    level.BULLET_MAX_SPEED  = LEVELS[levelNum][1];
    level.BULLET_RATE       = LEVELS[levelNum][2];
    level.MONSTER_MIN_SPEED = LEVELS[levelNum][3];
    level.MONSTER_MAX_SPEED = LEVELS[levelNum][4];
    level.MONSTER_RATE      = LEVELS[levelNum][5];
    level.BOSS_SPEED        = LEVELS[levelNum][6];
    return true;
  };
  
  /* Load and return an Image */
  var getImage = (function(){
    var loadedImages = {};
    for (var i=0; i < IMAGES.length; i++) {
      loadedImages[IMAGES[i]] = document.createElement('img');
      loadedImages[IMAGES[i]].src = BASE_URL + 'img/' + IMAGES[i] + '.png';
    }
    return function(name){
      return loadedImages[name];
    };
  })();
  
  /* Load and return a Sound */
  var playSound = (function(){
    var loadedSounds = {};
    if (!MUTE_SOUND) {
      for (var i=0; i < SOUNDS.length; i++) {
        loadedSounds[SOUNDS[i]] = document.createElement('audio');
        loadedSounds[SOUNDS[i]].preload = 'auto';
        loadedSounds[SOUNDS[i]].controls = false;
        loadedSounds[SOUNDS[i]].src = BASE_URL + 'sound/' + SOUNDS[i] + '.ogg';
      }
    }
    return function(name){
      if (MUTE_SOUND) {
        return;
      }
      if (loadedSounds[name].readyState > 0) {
        loadedSounds[name].pause();
        loadedSounds[name].currentTime = 0;
      }
      loadedSounds[name].play();
    };
  })();
  
  /* Draw a text overlay */
  var drawOverlay = function(text, base) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#FFF';
    ctx.font = "24px sans-serif";
    ctx.textAlign = 'center';
    for (var i = text.length - 1; i >= 0; i--){
      ctx.fillText(text[i], CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 150 + (base || 0) + (50 * i));
    }
  };
  
  /* Entity (Player, Boss, Bullets, Monsters) */
  var Entity = function(x, y, width, height, canExit) {
    this.x = 0;
    this.y = 0;
    this.limits = {};
    this.canExit = canExit || false;
    this.setWidth(width);
    this.setHeight(height);
    if (x) { this.setX(x || 0); }
    if (y) { this.setY(y || 0); }
  };
  Entity.prototype.setWidth = function(width) {
    this.width = width || 10;
    this.limits.left = 0 - (this.canExit? this.width : 0);
    this.limits.right = CANVAS_WIDTH - (this.canExit? 0 : this.width);
  };
  Entity.prototype.setHeight = function(height) {
    this.height = height || 10;
    this.limits.top = 0 - (this.canExit? this.height : 0);
    this.limits.bottom = CANVAS_HEIGHT - (this.canExit? 0 : this.height);
  };
  Entity.prototype.setX = function(x) {
    if (x < this.limits.left) {
      this.x = this.limits.left;
      return false;
    } else if (x > this.limits.right) {
      this.x = this.limits.right;
      return false;
    }
    this.x = x;
    return true;
  };
  Entity.prototype.setY = function(y) {
    if (y < this.limits.top) {
      this.y = this.limits.top;
      return false;
    } else if (y > this.limits.bottom) {
      this.y = this.limits.bottom;
      return false;
    }
    this.y = y;
    return true;
  };
  Entity.prototype.addX = function(x) {
    return this.setX(this.x + x);
  };
  Entity.prototype.addY = function(y) {
    return this.setY(this.y + y);
  };
  Entity.prototype.collide = function(entity) {
    if ((this.x + this.width) < entity.x) {
      return false;
    }
    if (this.x > (entity.x + entity.width)) {
      return false;
    }
    if ((this.y + this.height) < entity.y) {
      return false;
    }
    if (this.y > (entity.y + entity.height)) {
      return false;
    }
    return true;
  };
  
  /* Bullet */
  var Bullet = function(x, y, xSpeed, ySpeed){
    Entity.call(this, x, y, BULLET_SIZE, BULLET_SIZE, true);
    this.xSpeed = xSpeed || 0;
    this.ySpeed = ySpeed || 0;
  };
  inherits(Bullet, Entity);
  Bullet.prototype.draw = function(){
    ctx.drawImage(getImage('bullet'), this.x, this.y, this.width, this.height);
  };
  
  /* Player */
  var Player = function(x, y){
    Entity.call(this, x, y, PLAYER_SIZE, PLAYER_SIZE, false);
    this.bullets = [];
    this.popRate = level.BULLET_RATE;
    this.lastPop = null;
  };
  inherits(Player, Entity);
  Player.prototype.draw = function(){
    ctx.drawImage(getImage('player'), this.x, this.y, this.width, this.height);
  };
  Player.prototype.popBullet = function(xSpeed, ySpeed) {
    var bulletX, bulletY;
    if (xSpeed > 0) {
      bulletX = this.x + this.width;
    } else if (xSpeed < 0) {
      bulletX = this.x - BULLET_SIZE;
    } else {
      bulletX = this.x + Math.round(this.width / 2 - BULLET_SIZE / 2);
    }
    if (ySpeed > 0) {
      bulletY = this.y + this.height;
    } else if (ySpeed < 0) {
      bulletY = this.y - BULLET_SIZE;
    } else {
      bulletY = this.y + Math.round(this.height / 2 - BULLET_SIZE / 2);
    }
    this.bullets.push(new Bullet(bulletX, bulletY, xSpeed, ySpeed));
    playSound('bullet');
  };
  
  /* Boss */
  var Boss = function(x, y){
    Entity.call(this, x, y, BOSS_SIZE, BOSS_SIZE, false);
    this.bullets = [];
    this.popRate = level.MONSTER_RATE;
    this.lastPop = null;
    this.target = { x: x, y: y };
  };
  inherits(Boss, Entity);
  Boss.prototype.draw = function(){
    ctx.drawImage(getImage('boss'), this.x, this.y, this.width, this.height);
  };
  Boss.prototype.popBullet = function(){
    var xSpeed = getRandomInt(-level.MONSTER_MAX_SPEED, level.MONSTER_MAX_SPEED, [level.BOSS_SPEED]),
        ySpeed = getRandomInt(-level.MONSTER_MAX_SPEED, level.MONSTER_MAX_SPEED, [level.BOSS_SPEED]),
        pos = [this.x + Math.round(this.width / 2 - MONSTER_SIZE/2), this.y + Math.round(this.height/2 - MONSTER_SIZE/2)],
        monster = null;
        
    // Force movement
    if (!xSpeed && !ySpeed) {
      if (getRandomInt(0, 1)) {
        xSpeed = getRandomInt(-level.MONSTER_MAX_SPEED, level.MONSTER_MAX_SPEED, [0, level.BOSS_SPEED]);
      } else {
        ySpeed = getRandomInt(-level.MONSTER_MAX_SPEED, level.MONSTER_MAX_SPEED, [0, level.BOSS_SPEED]);
      }
    }
        
    if (xSpeed > 0) {
      pos[0] = this.x + this.width + MONSTER_SIZE;
    } else if (xSpeed < 0) {
      pos[0] = this.x - BULLET_SIZE;
    }
    if (ySpeed > 0) {
      pos[1] = this.y + this.height + MONSTER_SIZE;
    } else if (ySpeed < 0) {
      pos[1] = this.y - MONSTER_SIZE;
    }
        
    monster = new Bullet(pos[0], pos[1], xSpeed, ySpeed);
    monster.draw = function() {
      ctx.drawImage(getImage('monster'), monster.x, monster.y, monster.width, monster.height);
    };
    this.bullets.push(monster);
    playSound('monster');
  };
  Boss.getInitialPosition = function(){
    if (getRandomInt(0, 1)) {
      return [getRandomInt(100, CANVAS_WIDTH - BOSS_SIZE), getRandomInt(0, CANVAS_HEIGHT - BOSS_SIZE)];
    } else {
      return [getRandomInt(0, CANVAS_WIDTH - BOSS_SIZE), getRandomInt(100, CANVAS_HEIGHT - BOSS_SIZE)];
    }
  };
  
  var nextLevel = 0;
  var startGame = function(gameover, win) {
    
    setLevel(nextLevel);
    
    // Player
    var player = new Player(10, 10);
    
    // Boss
    var bossPosition = Boss.getInitialPosition();
    var boss = new Boss(bossPosition[0], bossPosition[1]);
    
    var loopTimer = 0, reqAnimId = 0;
    var game = {
      loop: function(){
        
        var now = Date.now();
        
        var plSpeed = PLAYER_SPEED;
        if ((pressedKeys.left || pressedKeys.right) && (pressedKeys.up || pressedKeys.down)) {
          plSpeed = plSpeed / 2;
        }
        if (pressedKeys.left) {
          player.addX(-plSpeed);
        } else if (pressedKeys.right) {
          player.addX(plSpeed);
        }
        if (pressedKeys.up) {
          player.addY(-plSpeed);
        } else if (pressedKeys.down) {
          player.addY(plSpeed);
        }
        
        // Add bullet
        var bulletSpeedX = 0, bulletSpeedY = 0;
        if (!player.lastPop || now - player.lastPop > player.popRate) {
          if (pressedKeys.left) {
            bulletSpeedX = getRandomInt(-level.BULLET_MAX_SPEED, -level.BULLET_MIN_SPEED);
          } else if (pressedKeys.right) {
            bulletSpeedX = getRandomInt(level.BULLET_MIN_SPEED, level.BULLET_MAX_SPEED);
          }
          if (pressedKeys.up) {
            bulletSpeedY = getRandomInt(-level.BULLET_MAX_SPEED, -level.BULLET_MIN_SPEED);
          } else if (pressedKeys.down) {
            bulletSpeedY = getRandomInt(level.BULLET_MIN_SPEED, level.BULLET_MAX_SPEED);
          }
          
          if (bulletSpeedX || bulletSpeedY) {
            player.popBullet(bulletSpeedX, bulletSpeedY);
          }
          
          player.lastPop = now;
          
          canv.classList.add('active');
          window.setTimeout(function(){
            canv.classList.remove('active');
          }, 50);
        }
        
        // Move bullets
        var bulletsMoveX, bulletsMoveY, bullets = player.bullets;
        for (var bi = bullets.length - 1; bi >= 0; bi--) {
          
          if (bullets[bi].xSpeed !== 0 && bullets[bi].ySpeed !== 0) {
            bulletsMoveX = bullets[bi].addX(bullets[bi].xSpeed/2);
            bulletsMoveY = bullets[bi].addY(bullets[bi].ySpeed/2);
          } else {
            bulletsMoveX = bullets[bi].addX(bullets[bi].xSpeed);
            bulletsMoveY = bullets[bi].addY(bullets[bi].ySpeed);
          }
          
          // Bullet / boss collision
          if (bullets[bi].collide(boss)) {
            return win();
          }
          if (!bulletsMoveX || !bulletsMoveY) {
            // Remove the bullet from the bullets list
            bullets.splice(bullets.indexOf(bullets[bi]), 1);
          }
        }
        
        // Move monsters
        var xMove, yMove, monsters = boss.bullets;
        for (var i = monsters.length - 1; i >= 0; i--) {
          
          if (monsters[i].xSpeed !== 0 && monsters[i].xSpeed !== 0) {
            xMove = monsters[i].addX(monsters[i].xSpeed/2);
            yMove = monsters[i].addY(monsters[i].ySpeed/2);
          } else {
            xMove = monsters[i].addX(monsters[i].xSpeed);
            yMove = monsters[i].addY(monsters[i].ySpeed);
          }
          
          // Player / monster collision
          if (player.collide(monsters[i])) {
            return gameover();
          }
          
          if (!xMove || !yMove) {
            // Remove the monster from the monsters list
            monsters.splice(monsters.indexOf(monsters[i]), 1);
          }
        }
        
        // Add monster
        if (!boss.lastPop || now - boss.lastPop > boss.popRate) {
          boss.popBullet();
          boss.lastPop = now;
        }
        
        // Move boss
        if (boss.target.x === boss.x || boss.target.y === boss.y) {
          boss.target.x = getRandomInt(boss.limits.left, boss.limits.right);
          boss.target.y = getRandomInt(boss.limits.top, boss.limits.bottom);
        } else {
          if (boss.target.x < boss.x) {
            boss.addX(-level.BOSS_SPEED);
            // Prevent boss hover
            if (boss.target.x > boss.x) {
              boss.x = boss.target.x;
            }
          } else if (boss.target.x > boss.x) {
            boss.addX(level.BOSS_SPEED);
            // Prevent boss hover
            if (boss.target.x < boss.x) {
              boss.x = boss.target.x;
            }
          }
          if (boss.target.y < boss.y) {
            boss.addY(-level.BOSS_SPEED);
            // Prevent boss hover
            if (boss.target.y > boss.y) {
              boss.y = boss.target.y;
            }
          } else if (boss.target.y > boss.y) {
            boss.addY(level.BOSS_SPEED);
            // Prevent boss hover
            if (boss.target.y < boss.y) {
              boss.y = boss.target.y;
            }
          }
        }
        
        // Boss / player collision
        if (player.collide(boss)) {
          return gameover();
        }
        
        loopTimer = window.setTimeout(game.loop, GAME_SPEED);
      },
      draw: function(last){
        var now = Date.now();
        
        // Max fps
        if (last !== true && lastRenderTime && now - lastRenderTime < 1000 / MAX_FPS) {
          reqAnimId = window.requestAnimationFrame(game.draw);
          return;
        }
        // Save the last rendering time (to lock the max. framerate)
        lastRenderTime = now;
        
        // Clear
        canv.width = canv.width;
        
        // Bullets
        for (var i = player.bullets.length - 1; i >= 0; i--) {
          player.bullets[i].draw();
        }
        
        // Player
        player.draw();
        
        // Monsters
        for (var j = boss.bullets.length - 1; j >= 0; j--) {
          boss.bullets[j].draw();
        }
        
        // Boss
        boss.draw();
        
        if (last !== true) {
          reqAnimId = window.requestAnimationFrame(game.draw);
        }
      },
      stop: function(){
        game.draw(true);
        window.clearTimeout(loopTimer);
        window.cancelAnimationFrame(reqAnimId);
        lastRenderTime = 0;
      }
    };
    
    return game;
  };
  
  var initOverlay = function(text, base) {
    drawOverlay(text, base);
    document.addEventListener('keypress', initGame, false);
  };
  
  var initGame = function(e){
    if (e.charCode === 32) { // Space bar
      document.removeEventListener('keypress', initGame, false);
      game = startGame(
        // Game over
        function(){
          playSound('death');
          game.stop();
          game = null;
          nextLevel = 0;
          initOverlay(['YOU LOSE AT LEVEL ' + (level.num + 1) + '.', 'HE WINS.', 'HA HA HA.'], 80);
        },
        // Win
        function(){
          game.stop();
          game = null;
          if (level.num < LEVELS.length-1) {
            playSound('level');
            nextLevel = level.num + 1;
            initOverlay(['YOU WIN!', 'READY FOR THE NEXT LEVEL?', 'PRESS [SPACE]'], 60);
          } else {
            playSound('win');
            nextLevel = 0;
            initOverlay(['\u2605\u2605\u2605 THE END \u2605\u2605\u2605', 'START AGAIN?', 'PRESS [SPACE]'], -40);
          }
        });
      game.loop();
      game.draw();
    }
  };
  
  initOverlay(INSTRUCTIONS);
  
  window.toggleMute = function(){
    return (MUTE_SOUND = !MUTE_SOUND);
  };
  
})(window, document, KeyboardJS);