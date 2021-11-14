PlayState = {};

// ************************ init ************************
PlayState.init = function () {
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
    // load images for the platforms
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('tile:8x1', 'images/tile_8x1.png');
    this.game.load.image('tile:6x1', 'images/tile_6x1.png');
    this.game.load.image('tile:4x1', 'images/tile_4x1.png');
    this.game.load.image('tile:2x1', 'images/tile_2x1.png');
    this.game.load.image('tile:1x1', 'images/tile_1x1.png');
    // load hero image
    this.game.load.image('hero', 'images/hero_stopped.png');
    // load sound effect for jumping
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    // load sound effect for eating a broccoli
    this.game.load.audio('sfx:broccoli', 'audio/broccoli.wav');
    // load broccoli image
    this.game.load.spritesheet('broccoli', 'images/broccoli_animated.png', 22, 22);

};

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true; // stay in screen
}

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

var popup;

// ************************ create ************************
// create game entities and set up world here
PlayState.create = function () {
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON('level:1'));
    // create sound entities
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        broccoli: this.game.add.audio('sfx:broccoli')
    };
};

PlayState._loadLevel = function (data) {
    // create all the groups/layers that we need
    this.platforms = this.game.add.group();
    // create broccolis
    this.broccolis = this.game.add.group();
    // spawn all platforms
    data.platforms.forEach(this._spawnPlatform, this);
    // spawn hero and enemies
    this._spawnCharacters({hero: data.hero});
    // spawn important objects
    data.broccolis.forEach(this._spawnBroccoli, this);
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

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'fungifun');
    game.state.add('play', PlayState);
    game.state.start('play');
};

// ************************ uodate ************************
PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();
};

PlayState._handleInput = function () {
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
        this._onHeroVsBrocolli, null, this);;
};

PlayState._onHeroVsBrocolli = function (hero, broccoli) {
    this.sfx.broccoli.play();
    broccoli.kill();
};
