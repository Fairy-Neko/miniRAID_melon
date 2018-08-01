
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
        useAutomove : true,
        moveThreshold : 150,

        // How much heal will taunt? (multiplier)
        healTaunt: 2,

        damageColor : {
            slash: "white",
            knock: "white",
            pierce: "white",
            fire: "#ffa342",
            ice: "#72ffe2",
            water: "blue",
            nature: "green",
            wind: "lightgreen",
            thunder: "yellow",
            light: "lightyellow"
        },

        healColor: "#66f95c",
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
        if (!me.video.init(game.data.width, game.data.height, {wrapper : "screen", scale : window.devicePixelRatio, doubleBuffering: true, renderer: me.video.WEBGL })) {
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
            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(T) girl " + i, weaponLeft: new game.weapon.TestStaff(
                {
                    baseAttackSpeed: game.helper.getRandomFloat(0.05, 0.08),
                    activeRange: game.helper.getRandomInt(40, 60),
                    targetCount: 20,
                    power: 20,
                }), isPlayer: true, health: 1200, tauntMul: 5.0, image: "tank_girl",}));
        }

        // Healer
        for(var i = 0; i < playerType[1]; i++)
        {
            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(H) girl " + i, weaponLeft: new game.weapon.TestHealStaff(
                {
                    baseAttackSpeed: game.helper.getRandomFloat(1.0, 1.3),
                    activeRange: game.helper.getRandomInt(100, 150),
                    targetCount: 1,
                    power: 150,
                }), isPlayer: true, health: 800, image: "healer_girl"}));
        }

        // DPS
        for(var i = 0; i < playerType[2]; i++)
        {
            var choice = Math.random();
            if(choice < 0.5)
            {
                this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) girl (R) " + i, weaponLeft: new game.weapon.TestHomingStaff(
                    {
                        baseAttackSpeed: game.helper.getRandomFloat(0.6, 1.2),
                        activeRange: game.helper.getRandomInt(200, 300),
                        targetCount: 6,
                        power: 150,
                    }), isPlayer: true, health: 500, image: "magical_girl"}));
            }
            else
            {
                this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) girl (M) " + i, weaponLeft: new game.weapon.TestStaff(
                    {
                        baseAttackSpeed: game.helper.getRandomFloat(0.1, 0.15),
                        activeRange: game.helper.getRandomInt(50, 70),
                        targetCount: 2,
                        power: 120,
                    }), isPlayer: true, health: 500, image: "magical_girl"}));
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

        genAnimFrames: function(start, end)
        {
            var array = [];
            for(var i = start; i <= end; i++)
            {
                array.push(i);
            }

            return array;
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
