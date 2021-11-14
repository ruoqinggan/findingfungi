var popup;
var button;
var tween = null;
var has_popup = false;

let mushroom_array = ['mushroom_s_brown', 'mushroom_s_red', 'mushroom_s_tan',
    'mushroom_tall_brown', 'mushroom_tall_red', 'mushroom_tall_tan'];

let mushroom_info_array = ['mushroom_info_ag_ar', 'mushroom_info_om_ol',
    'mushroom_info_xe_su'];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true; // stay in screen
}

PlayState = {};

// ************************ init ************************
PlayState.init = function () {
    this.healthCount = 5;
    this.broccoliCount = 0;
    this.mushroomWisdomCount = 0;
    this.game.renderer.renderSession.roundPixels = true;
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });
    this.keys.up.onDown.add(function () {
        this.hero.jump();
        this.sfx.jump.play();
    }, this);
};

// ************************ preload ************************
// load game assets here
PlayState.preload = function () {
    // load background image
    this.game.load.image('background', 'images/background.png');
    // load level 1 assets
    this.game.load.json('level:1', 'data/level01.json');
    // load health count icon
    this.game.load.image('icon:heart_full', 'images/heart_full.png');
    // load mushroom wisdom icon
    this.game.load.image('icon:mushroom_wisdom', 'images/mushroom_wisdom.png');
    // load hud values
    this.game.load.image('font:numbers', 'images/numbers.png');
    // load images for the platforms
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('tile:8x1', 'images/tile_8x1.png');
    this.game.load.image('tile:6x1', 'images/tile_6x1.png');
    this.game.load.image('tile:4x1', 'images/tile_4x1.png');
    this.game.load.image('tile:2x1', 'images/tile_2x1.png');
    this.game.load.image('tile:1x1', 'images/tile_1x1.png');
    // load hero image
    this.game.load.image('hero', 'images/hero_stopped.png');
    // load mushroom images
    this.game.load.image('mushroom_s_brown', 'images/mushroom_s_brown.png');
    this.game.load.image('mushroom_s_tan', 'images/mushroom_s_tan.png');
    this.game.load.image('mushroom_s_red', 'images/mushroom_s_red.png');
    this.game.load.image('mushroom_tall_brown', 'images/mushroom_tall_brown.png');
    this.game.load.image('mushroom_tall_tan', 'images/mushroom_tall_tan.png');
    this.game.load.image('mushroom_tall_red', 'images/mushroom_tall_red.png');
    // load mushroom info pages
    this.game.load.image('mushroom_info_ag_ar', 'images/mushroom_info_ag_ar.png');
    this.game.load.image('mushroom_info_om_ol', 'images/mushroom_info_om_ol.png');
    this.game.load.image('mushroom_info_xe_su', 'images/mushroom_info_xe_su.png');
    // load sound effect for jumping
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    // load sound effect for eating a broccoli
    this.game.load.audio('sfx:broccoli', 'audio/broccoli.wav');
    // load sound effect for eating a mushroom
    this.game.load.audio('sfx:mushroom', 'audio/mushroom.wav');
    // load broccoli image
    this.game.load.spritesheet('broccoli', 'images/broccoli_animated.png', 22, 22);
    // load close button images
    this.game.load.image('close', 'images/green_button.png');
    this.game.load.spritesheet('button', 'images/green_button.png', 60, 60);

};

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;
Hero.prototype.move = function (direction) {
    const SPEED = 200;
    this.body.velocity.x = direction * SPEED;
};
Hero.prototype.jump = function () {
    const JUMP_SPEED = 400;
    this.body.velocity.y = -JUMP_SPEED;
};

// ************************ create ************************
// create game entities and set up world here
PlayState.create = function () {
    // add background image
    this.game.add.image(0, 0, 'background');
    // load level
    this._loadLevel(this.game.cache.getJSON('level:1'));
    // create sound entities
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        broccoli: this.game.add.audio('sfx:broccoli'),
        mushroom: this.game.add.audio('sfx:mushroom')
    };

    //create hud
    this._createHud();
};

PlayState._createHud = function () {
    let healthIcon = this.game.make.image(0, 0, 'icon:heart_full');
    let wisdomIcon = this.game.make.image(0, 40, 'icon:mushroom_wisdom');
    this.hud = this.game.add.group();
    this.hud.add(healthIcon);
    this.hud.add(wisdomIcon);
    this.hud.position.set(10, 10);

    const NUMBERS_STR = '0123456789X ';
    this.healthFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);
    this.wisdomFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);

    let healthScoreImg = this.game.make.image(healthIcon.x + healthIcon.width,
        healthIcon.height / 2, this.healthFont);
    healthScoreImg.anchor.set(0, 0.5);
    let wisdomScoreImg = this.game.make.image(wisdomIcon.x + wisdomIcon.width,
        wisdomIcon.height * 1.5, this.wisdomFont);
    wisdomScoreImg.anchor.set(0, 0.5);

    this.hud.add(healthScoreImg);
    this.hud.add(wisdomScoreImg);
};

PlayState._loadLevel = function (data) {
    // create all the groups/layers that we need
    this.platforms = this.game.add.group();
    // create broccolis
    this.broccolis = this.game.add.group();
    // create mushrooms
    this.mushrooms = this.game.add.group();
    // spawn all platforms
    data.platforms.forEach(this._spawnPlatform, this);
    // spawn hero and enemies
    this._spawnCharacters({hero: data.hero});
    // spawn important objects
    data.broccolis.forEach(this._spawnBroccoli, this);
    data.mushrooms.forEach(this._spawnMushrooom, this);
    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

// spawn the platforms
PlayState._spawnPlatform = function (platform) {
    // a factory method for sprites.
    // the new sprite will be added as a child of the group.
    let sprite = this.platforms.create(platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false; // disable gravity for platforms
    sprite.body.immovable = true; // platforms can't be moved when colliding
};

// spawn hero
PlayState._spawnCharacters = function (data) {
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

// spawn broccolis
PlayState._spawnBroccoli = function (broccoli) {
    let sprite = this.broccolis.create(broccoli.x, broccoli.y, 'broccoli');
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
}

// spawn mushrooms
PlayState._spawnMushrooom = function (mushroom) {
    let sprite = this.mushrooms.create(mushroom.x, mushroom.y, mushroom.image);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
}

PlayState._createPopup = function(mushroom_info) {
    // create pop-up window
    popup = this.game.add.sprite(this.game.world.centerX,
        this.game.world.centerY, mushroom_info);
    popup.anchor.set(0.5);
    popup.inputEnabled = true;
    popup.input.enableDrag();
    //  Position the close button to the top-right of the popup sprite (minus 8px for spacing)
    var pw = (popup.width / 2) - 30;
    var ph = (popup.height / 2) + 10;

    //  And click the close button to close it down again
    var closeButton = this.game.make.sprite(pw, -ph, 'close');
    closeButton.inputEnabled = true;
    closeButton.input.priorityID = 1;
    closeButton.input.useHandCursor = true;
    closeButton.events.onInputDown.add(this._closeWindow, this);

    //  Add the "close button" to the popup window image
    popup.addChild(closeButton);

    //  Hide it awaiting a click
    popup.scale.set(0);
}

PlayState._openWindow = function() {
    if ((tween !== null && tween.isRunning) || popup.scale.x === 1) {
        return;
    }
    //  Create a tween that will pop-open the window, but only if it's not already tweening or open
    tween = this.game.add.tween(popup.scale).to( { x: 1, y: 1 }, 1000, Phaser.Easing.Elastic.Out, true);
}

PlayState._closeWindow = function() {
    if (tween && tween.isRunning || popup.scale.x === 0) {
        return;
    }
    //  create a tween that will close the window, but only if it's not already tweening or closed
    tween = this.game.add.tween(popup.scale).to( { x: 0, y: 0}, 500, Phaser.Easing.Elastic.In, true);
    has_popup = false;
}

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'findingfungi');
    game.state.add('play', PlayState);
    game.state.start('play');
};

// ************************ uodate ************************
PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();
    this.healthFont.text = `x${this.healthCount}`;
    this.wisdomFont.text = `x${this.mushroomWisdomCount}`;
};

PlayState._handleInput = function () {
    if (has_popup) {
        this.hero.move(0);
        return;
    }
    if (this.keys.left.isDown) { // move hero left
        this.hero.move(-1);
    }
    else if (this.keys.right.isDown) { // move hero right
        this.hero.move(1);
    }
    else { // stop
        this.hero.move(0);
    }
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.overlap(this.hero, this.broccolis,
        this._onHeroVsBrocolli, null, this);
    this.game.physics.arcade.overlap(this.hero, this.mushrooms,
        this._onHeroVsMushroom, null, this);
};

// hero collides with broccolis
PlayState._onHeroVsBrocolli = function (hero, broccoli) {
    ++this.broccoliCount;
    if (this.broccoliCount <= 5) {
        ++this.healthCount;
    } else if (this.broccoliCount % 5 === 0) {
        --this.healthCount;
    }
    this.sfx.broccoli.play();
    broccoli.kill();
};

// hero collides with mushrooms
PlayState._onHeroVsMushroom = function (hero, mushroom) {
    ++this.mushroomWisdomCount;
    this.sfx.mushroom.play();
    mushroom.kill();
    has_popup = true;
    var int = getRandomInt(3);
    this._createPopup(mushroom_info_array[int]);
    if (int === 1) {
        this.healthCount -= 5;
    }
    this._openWindow();
};
