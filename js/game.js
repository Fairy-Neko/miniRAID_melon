
/* Game namespace */
var game = {

    // an object where to store game information
    data : {
        // score
        score : 0,

        // pixel per unit and screen size
        ppu : 1,
        width : 1024,
        height : 576,

        playerSparse: 25,
        playerMax: 8,

        damageColor : {
            slash: "white",
            knock: "white",
            pierce: "white",
            fire: new me.Color(1, 1, 0, 1),
            ice: new me.Color(1, 0, 1, 1),
            water: "blue",
            nature: "green",
            wind: "lightgreen",
            thunder: "yellow",
            light: "lightyellow"
        },
    },

    collisionTypes:
    {
        AREA_EFFECT : me.collision.types.USER << 0,
    },

    containers: {},

    // Run on page load.
    "onload" : function () {
        me.timer.getDeltaSec = function(){ return me.timer.getDelta() * 0.001; }

        // Initialize the video.
        if (!me.video.init(game.data.width, game.data.height, {wrapper : "screen", scale : window.devicePixelRatio, doubleBuffering: true})) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // add "#debug" to the URL to enable the debug Panel
        if (me.game.HASH.debug === true) 
        {
            me.device.onReady(function () 
            {
                me.plugin.register.defer(this, me.debug.Panel, "debug", me.input.KEY.V);
            });
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

        // set and load all resources.
        // (this will also automatically switch to the loading screen)
        me.loader.preload(game.resources, this.loaded.bind(this));
    },

    // Run on game resources loaded.
    "loaded" : function () {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // add our player entity in the entity pool
        me.pool.register("testMob", game.Mobs.TestMob);
        me.pool.register("testBoss", game.Mobs.TestBoss);
        me.pool.register("testIcyZone", game.testIcyZone);
        me.pool.register("playerSpawnPoint", game.playerSpawnPoint);
        // me.pool.register("playerSpawnPoint", game.PlayerMobs.test);

        this.data.backend = new game.dataBackend();
        this.data.monitor = new game.dataBackend.BattleMonitor();

        var playerType = [2, 2, 4];

        // Tank
        for(var i = 0; i < playerType[0]; i++)
        {
            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(T) Magical girl " + i, weaponLeft: new game.weapon.TestStaff(
                {
                    baseAttackSpeed: game.helper.getRandomFloat(0.05, 0.08),
                    activeRange: game.helper.getRandomInt(20, 60),
                    power: 130,
                }), isPlayer: true, health: 1800}));
        }

        // Healer
        for(var i = 0; i < playerType[1]; i++)
        {
            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(H) Magical girl " + i, weaponLeft: new game.weapon.TestHealStaff(
                {
                    baseAttackSpeed: game.helper.getRandomFloat(0.5, 0.7),
                    activeRange: game.helper.getRandomInt(100, 150),
                    targetCount: 1,
                    power: 300,
                }), isPlayer: true, health: 800}));
        }

        // DPS
        for(var i = 0; i < playerType[2]; i++)
        {
            var choice = Math.random();
            if(choice < 0.5)
            {
                this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) Magic_l girl " + i, weaponLeft: new game.weapon.TestHomingStaff(
                    {
                        baseAttackSpeed: game.helper.getRandomFloat(0.6, 1.4),
                        activeRange: game.helper.getRandomInt(200, 300),
                        targetCount: 16,
                        power: 150,
                    }), isPlayer: true, health: 500}));
            }
            else
            {
                this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) Magical girl " + i, weaponLeft: new game.weapon.TestStaff(
                    {
                        baseAttackSpeed: game.helper.getRandomFloat(0.6, 1.4),
                        activeRange: game.helper.getRandomInt(250, 350),
                        targetCount: 16,
                        power: 200,
                    }), isPlayer: true, health: 500}));
            }
        }

        // Start the game.
        me.state.change(me.state.PLAY);
    },

    "helper": 
    {
        // Helper for generate random ints
        // The maximum is exclusive and the minimum is inclusive
        getRandomInt: function (min, max) 
        {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min; 
        },

        getRandomFloat: function (min, max) 
        {
            return Math.random() * (max - min) + min;
        },

        radian: function (degree)
        {
            return degree / 180.0 * Math.PI;
        },

        readTextFile: function (self, file, callback) 
        {
            var rawFile = new XMLHttpRequest();
            rawFile.overrideMimeType("application/json");
            rawFile.open("GET", file, true);
            rawFile.onreadystatechange = function() 
            {
                if (rawFile.readyState === 4 && rawFile.status == "200") 
                {
                    callback(self, rawFile.responseText);
                }
            }
            rawFile.send(null);
        },

        vec2:
        {
            dot: function(a, b)
            {
                return a[0] * b[0] + a[1] * b[1];
            },

            scalar: function(a, s)
            {
                return [s * a[0], s * a[1]];
            },

            add: function(a, b)
            {
                return [a[0] + b[0], a[1] + b[1]];
            },

            sub: function(a, b)
            {
                return [a[0] - b[0], a[1] - b[1]];
            },

            length: function(a)
            {
                return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
            },

            normalize: function(a)
            {
                return this.scalar(a, 1.0 / this.length(a));
            },

            distance: function(a, b)
            {
                return this.length(this.sub(a, b));
            },

            // Material for 2D rotation:
            // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/2drota.htm
            rotate: function(a, rad)
            {
                return [a[0] * Math.cos(rad) - a[1] * Math.sin(rad), a[1] * Math.cos(rad) + a[0] * Math.sin(rad)];
            },
        },
    },
};
