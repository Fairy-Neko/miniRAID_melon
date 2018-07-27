game.dataBackend = me.Object.extend
({
    init: function()
    {
        // Save all available players (characters).
        // Characters will be spawned by PlayerSpawnPoint,
        // playerList[0:playerCount-1] will be spawned. (e.g. 4 player map = the first 4 players in list)
        this.playerList = [];

        // Array saving Inventory(bag) data.
        this.inventory = [];
    },

    addPlayer: function(player)
    {
        if(this.playerList.length < 8)
        {
            this.playerList.push(player);
        }
    },

    removePlayer: function(idx)
    {
        this.playerList.splice(idx, 1);
    },

    adjustPlayer: function(idx, offset)
    {
        if(idx + offset >= this.playerList.length || idx + offset < 0)
        {
            return false;
        }

        var tmp = this.playerList[idx + offset];
        this.playerList[idx + offset] = this.playerList[idx];
        this.playerList[idx] = tmp;
    },

    getPlayerList: function()
    {
        return this.playerList;
    }
});

game.dataBackend.mob = me.Object.extend
({
    init: function(settings)
    {
        this.name = settings.name || "noname";
        // this.position = {x: this.body.left, y: this.body.top};

        // health related
        this.maxHealth = settings.health || 100;
        this.currentHealth = this.maxHealth - settings.damage || 0;
    
        // speed related (1.0 means 100% (NOT a value but a ratio))
        this.modifiers = {
            speed: settings.speed || 1.0,
            movingSpeed: settings.movingSpeed || 1.0,
            attackSpeed: settings.attackSpeed || 1.0,
        };

        this.baseSpeed = settings.baseSpeed || 2.0;
        this.baseAttackSpeed = settings.baseAttackSpeed || 20.0;

        // Stats
        this.level = settings.level || 1;
        this.baseStats = {
            vit: settings.vit || 1,
            str: settings.str || 1,
            dex: settings.dex || 1,
            tec: settings.tec || 1,
            int: settings.int || 1,
            mag: settings.mag || 1,
        };

        // Stats (cannot increase directly)
        this.battleStats = {
            resist: {
                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0
            },

            attackPower: {
                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0
            },

            hitAcc: 100,
            avoid: 0,
            attackRange: 0,
            extraRange: 0,
        };
    
        // buff related
        this.buffList = new Set();

        // Equipment related
        this.weaponLeft = settings.weaponLeft;// || new game.weapon(settings);
        this.weaponRight = settings.weaponRight;// || new game.weapon(settings);
        // this.armor = settings.armor || new game.armor(settings);
        // this.accessories = settings.accessories || new game.accessory(settings);

        this.currentWeapon = this.weaponLeft;

        // Is this mob a player?
        this.isPlayer = settings.isPlayer || false;
    },

    getMovingSpeed: function()
    {
        return this.modifiers.speed * this.modifiers.movingSpeed * this.baseSpeed;
    },

    getAttackSpeed: function()
    {
        return (1 / this.modifiers.speed) * (1 / this.modifiers.attackSpeed) * this.currentWeapon.baseAttackSpeed;
    },
});

game.armor = me.Object.extend
({
    init: function(settings)
    {

    },

    onAttack: function(mob, target)
    {

    },
});

game.accessory = me.Object.extend
({
    init: function(settings)
    {

    },

    onAttack: function(mob, target)
    {

    },
});
