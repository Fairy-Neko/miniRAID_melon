
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

        playerSparse: 12,
        playerSparseInc: 2,
        playerMax: 8,
        useAutomove : false,
        moveThreshold : 150,

        // How much heal will taunt? (multiplier)
        healTaunt: 2,

        damageColor : {
            slash: "#ffffff",
            knock: "#ffffff",
            pierce: "#ffffff",
            fire: "#ffa342",
            ice: "#72ffe2",
            water: "#5b8fff",
            nature: "#b1ed1a",
            wind: "#aaffc8",
            thunder: "#fffb21",
            light: "#fffbd1",
            miss: "#ff19e0",
            heal: "#66f95c",
        },

        damageType: {
            slash: "physical",  
            knock: "physical",  
            pierce: "physical",  
            fire: "elemental",
            ice: "elemental",
            water: "elemental",
            nature: "elemental",
            wind: "elemental",
            thunder: "elemental",
            light: "pure",
        },

        damageTypeArray : ["slash", "knock", "pierce", "fire", "ice", "water", "nature", "wind", "thunder", "light"],

        critMultiplier: {
            slash: 2.0,  
            knock: 1.6,  
            pierce: 2.5,  
            fire: 2.0,
            ice: 2.5,
            water: 1.6,
            nature: 2.0,
            wind: 2.5,
            thunder: 2.5,
            light: 1.6,
            heal: 2.0,
        },

        weaponType: {
            sword: "sword",
            lance: "lance",
            shield: "shield",
            heavy: "heavy",
            bow: "bow",
            conceal: "conceal",

            book: "book",
            magicItem: "magicItem",
            mystery: "mystery",
            staff: "staff",
            instrument: "instrument",
        },

        weaponSubType: {
            common: "common",
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
        if (!me.video.init(game.data.width, game.data.height, 
            {wrapper : "screen", scale : 'auto'/*window.devicePixelRatio*/, 
            scaleMethod: "fit", useParentDOMSize: false, doubleBuffering: true, renderer: me.video.WEBGL })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        me.video.setMaxSize(1024, 768);

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

        var playerType = [1, 1, 5];
        // var playerType = [2, 1, 4];
        // var playerType = [2, 2, 4];

        // Tank
        for(var i = 0; i < playerType[0]; i++)
        {
            var tank = new game.dataBackend.Mob({name: "(T) girl " + i, weaponLeft: new game.Weapon.TestStaff(
                {
                    baseAttackSpeed: game.helper.getRandomFloat(0.2, 0.3),
                    activeRange: game.helper.getRandomInt(40, 60),
                    targetCount: 1,
                    power: 2,
                    manaCost: 1,
                }), isPlayer: true, health: 120, tauntMul: 5.0, mobPrototype: game.PlayerMobs.test, image: "tank_girl2",});

            // give them a taunt skill
            tank.spells.taunt = new game.dataBackend.Spell.Taunt({});

            this.data.backend.addPlayer(tank);
        }

        // Healer
        for(var i = 0; i < playerType[1]; i++)
        {
            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(H) girl " + i, weaponLeft: new game.Weapon.TestHealStaff(
                {
                    baseAttackSpeed: game.helper.getRandomFloat(1.0, 1.3),
                    activeRange: game.helper.getRandomInt(150, 175),
                    targetCount: 1,
                    power: 15,
                    manaCost: 15,
                }), isPlayer: true, health: 60, mobPrototype: game.PlayerMobs.test, image: "healer_girl2"}));

            this.data.backend.addPlayer(
                new game.dataBackend.Mob(
                    {name: "(H) fairy " + i, weaponLeft: new game.Weapon.ChibiFairyLamp({}), 
                    isPlayer: true, health: 60, mag: 5, mobPrototype: game.PlayerMobs.FloraFairy}));
        }

        // DPS
        for(var i = 0; i < playerType[2]; i++)
        {
            var choice = Math.random();
            choice = 0; // force spawn ranged DPS
            if(choice < 0.5)
            {
                this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) girl (R) " + i, weaponLeft: new game.Weapon.DPSHomingStaff(
                    {
                        baseAttackSpeed: game.helper.getRandomFloat(0.6, 1.2),
                        activeRange: game.helper.getRandomInt(200, 240),
                        targetCount: 3,
                        power: 7,
                        manaCost: 2,
                    }), isPlayer: true, health: 65, mobPrototype: game.PlayerMobs.test, image: "magical_girl2"}));
            }
            else
            {
                this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) girl (M) " + i, weaponLeft: new game.Weapon.TestStaff(
                    {
                        baseAttackSpeed: game.helper.getRandomFloat(0.3, 0.5),
                        activeRange: game.helper.getRandomInt(50, 70),
                        targetCount: 1,
                        power: 5,
                        manaCost: 1,
                    }), isPlayer: true, health: 100, mobPrototype: game.PlayerMobs.test, image: "magical_girl2"}));
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
