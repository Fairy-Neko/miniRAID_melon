
/**
 * TODOs: 
 * - Select player though the raid frame
 * - Player grouping (ctrl + 1, ctrl + 2, ...) like RTS
 * - combine left click for moving (support mobile devices ?)
 * - Hold long time to sprase players
 * - double click to cast special spells?
 */

/* Game namespace */
var game = {

    // an object where to store game information
    data : {
        // score
        score : 0,

        // pixel per unit and screen size
        ppu : 1,
        width : 960,
        height : 540,

        // TODO: Change to 768 x 432 (To fit a 200% scale on a common 1080P screen)
        // 960 x 540 -> 32 x 32 grids -> 30 x 16.875 grids
        // Also need rewrite the HTML UI & UI frame...... JEZZ > <
        // TODO: auto-fitting to nearest pixel perfect resolution when enabling full-screen

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

            // Let them just add 0 (as themselves when calculating) for convinence
            light: "pure",
            physical: "pure",
            elemental: "pure",
            heal: "pure",
        },

        damageTypeArray : ["slash", "knock", "pierce", "fire", "ice", "water", "nature", "wind", "thunder", "light"],

        damageTypeString: {
            slash: "斩击",  
            knock: "打击",  
            pierce: "突刺",  
            fire: "火焰",
            ice: "冰霜",
            water: "水",
            nature: "自然",
            wind: "风",
            thunder: "雷",
            light: "光",
            heal: "治疗",
        },

        statChs: {
            vit: "体格",
            mag: "魔力",
            str: "力量",
            int: "智力",
            dex: "敏捷",
            tec: "技巧",
        },

        critMultiplier: {
            slash: 2.0,
            knock: 1.6,
            pierce: 2.5,
            fire: 2.0,
            ice: 2.0,
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

        ItemPClassChs: {
            item: "道具",
            plant: "植物",
            dailyObj: "生活用品",

            sword: "剑",
            lance: "枪",
            shield: "盾",
            heavy: "重武器",
            bow: "弓",
            conceal: "暗器",

            book: "魔导书",
            magicItem: "魔法道具",
            mystery: "神秘道具",
            staff: "法杖",
            instrument: "乐器",
        },

        ItemSClassChs: {
            // plant
            flowerGrass: "草花",
            
            // dailyObj
            toys: "玩具",

            //instrument
            flute: "笛",
            harp: "竖琴",
        },

        rarityChs: ["垃圾", "普通", "优秀", "精良", "我编不出来了", "之后再补吧"],
        rarityColor: ["#888", "#fff", "#3f3", "#3af", "#fb3", "#faa"],

        weaponSubType: {
            common: "common",
        },
    },

    disableToolTip: false,
    disableCursor: false,

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

        me.video.setMaxSize(game.data.width, game.data.height);

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
        console.log("Loaded func()")

        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // add our player entity in the entity pool
        me.pool.register("testMob", game.Mobs.TestMob, true);
        me.pool.register("testBoss", game.Mobs.TestBoss, true);
        me.pool.register("testIcyZone", game.testIcyZone);
        me.pool.register("playerSpawnPoint", game.playerSpawnPoint, true);
        me.pool.register("levelLoader", game.levelLoader);
        me.pool.register("clickCollect", game.sceneObject.clickCollect, true);
        // me.pool.register("loot", game.sceneObject.clickCollect);
        me.pool.register("loot", game.sceneObject.loot);
        me.pool.register("projectile", game.Spell.Projectile, true);
        // me.pool.register("playerSpawnPoint", game.PlayerMobs.test);

        // Load data tables
        game.data.imageSize = me.loader.getJSON("imageSize");
        game.data.itemList = me.loader.getJSON("Items");
        game.data.classes = me.loader.getJSON("classes");

        // Init item list with image sizes
        for(var item in game.data.itemList)
        {
            game.data.itemList[item].width = game.data.imageSize[game.data.itemList[item].image].width || 32;
            game.data.itemList[item].height = game.data.imageSize[game.data.itemList[item].image].height || 32;
            game.data.itemList[item].framewidth = game.data.imageSize[game.data.itemList[item].image].framewidth || 32;
            game.data.itemList[item].frameheight = game.data.imageSize[game.data.itemList[item].image].frameheight || 32;
        }

        this.data.backend = new game.dataBackend();
        this.data.monitor = new game.dataBackend.BattleMonitor();

        this.data.backend.inventory.addItem("testShield");

        // var playerType = [1, 1, 5];
        // var playerType = [2, 1, 4];
        var playerType = [2, 2, 3, 1];
        // var playerType = [0, 0, 1];

        // Tank
        for(var i = 0; i < playerType[0]; i++)
        {
            var shield = new game.Item({item: "testShield"});
            var staff = new game.Item({item: "testFireStaff"});

            var tank = new game.dataBackend.Mob({name: "(T) girl " + i, 
                weaponLeft: staff.linkedObject, 
                weaponRight: shield.linkedObject, 
                isPlayer: true, health: 120, str: 5, vit: 3, 
                class: "forestGuardian", image: "tank_girl2",});

            // give them a taunt skill
            tank.spells.taunt = new game.dataBackend.Spell.Taunt({});

            this.data.backend.addPlayer(tank);
        }

        // Healer
        for(var i = 0; i < playerType[1]; i++)
        {
            // this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(H) girl " + i, weaponLeft: new game.Weapon.TestHealStaff(
            //     {
            //         baseAttackSpeed: game.helper.getRandomFloat(1.0, 1.3),
            //         activeRange: game.helper.getRandomInt(150, 175),
            //         targetCount: 1,
            //         power: 15,
            //         manaCost: 15,
            //     }), isPlayer: true, health: 60, mobPrototype: game.PlayerMobs.test, image: "healer_girl2"}));

            var lamp = new game.Item({item: "chibiFairyLamp"});
            var staff = new game.Item({item: "testHealStaff"});

            this.data.backend.addPlayer(
                new game.dataBackend.Mob({
                    name: "(H) fairy " + i, 
                    weaponLeft: lamp.linkedObject, 
                    weaponRight: staff.linkedObject,
                    isPlayer: true, health: 60, vit: 3, mag: 5, int: 2, 
                    class: "floraFairy"}));
        }

        // DPS
        for(var i = 0; i < playerType[2]; i++)
        {
            var choice = Math.random();

            var staff = new game.Item({item: "cometWand"});
            var lamp = new game.Item({item: "chibiFairyLamp"});

            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(D) girl (R) " + i, 
                weaponLeft: staff.linkedObject,
                weaponRight: lamp.linkedObject,
                isPlayer: true, health: 65, vit: 2, int: 5, 
                class: "humanIFMagican", image: "magical_girl2"}));
        }

        // Assist
        for(var i = 0; i < playerType[3]; i++)
        {
            var staff = new game.Item({item: "simpleGrassFlute"});
            var lamp = new game.Item({item: "chibiFairyLamp"});

            this.data.backend.addPlayer(new game.dataBackend.Mob({name: "(A) Singer " + i, 
                weaponLeft: staff.linkedObject,
                weaponRight: lamp.linkedObject,
                isPlayer: true, health: 65, vit: 2, int: 5, 
                class: "forestSinger"}));
        }

        // Init the menu
        game.menu.init();

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

        funcFromString: function(str)
        {
            var arr = str.split(".");

            var fn = (window || this);
            for (var i = 0, len = arr.length; i < len; i++) 
            {
                fn = fn[arr[i]];
            }

            if (typeof fn !== "function") 
            {
                throw new Error("function not found");
            }

            // return fn.bind(fn.prototype); // <- WTF this will not create a new object but modify the prototype
            return fn;
        },

        toolTip:
        {
            beginSection: function()
            {
                return "<div>";
            },

            switchSection: function()
            {
                return "</div><div>";
            },

            endSection: function()
            {
                return "</div>";
            },

            row: function(text, style)
            {
                if(style)
                {
                    return "<p style = '" + style + "'>" + text + "</p>";
                }
                return "<p>" + text + "</p>";
            },

            column: function(text, style)
            {
                if(style)
                {
                    return "<span style = '" + style + "'>" + text + "</span>";
                }
                return "<span>" + text + "</span>";
            },

            colored: function(text, color, style)
            {
                if(style)
                {
                    return "<strong style='color:" + color + ";" + style + "'>" + text + "</strong>"
                }
                return "<strong style='color:" + color + ";'>" + text + "</strong>"
            },
        }
    },
};
