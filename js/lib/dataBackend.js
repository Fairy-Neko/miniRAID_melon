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

        // Used to generate ID for mobs.
        this.mobCount = -1;
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
    },

    getID: function()
    {
        this.mobCount++;
        return this.mobCount;
    }
});

game.dataBackend.Mob = me.Object.extend
({
    init: function(settings)
    {
        this.name = settings.name || "noname";
        // this.position = {x: this.body.left, y: this.body.top};
        this.image = settings.image || "magical_girl";

        // health related
        this.maxHealth = settings.health || 100;
        this.currentHealth = this.maxHealth - settings.damage || settings.health || 100;
        this.alive = true;

        this.maxMana = settings.mana || 100;
        this.currentMana = this.maxMana || settings.mana || 100;
    
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

        // How much taunt will this mob generate?
        this.tauntMul = settings.tauntMul || 1.0;
        this.beingAttack = 0;

        // A Specific identify name only for this mob
        this.ID = game.data.backend.getID();
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

game.dataBackend.BattleMonitor = me.Object.extend
({
    init: function(settings)
    { 
        this.time = 0;
        this.damageDict = {};
        this.healDict = {};
    },

    update: function(dt)
    {
        // If there are any enemy on the field
        if(game.units.enemy.size > 0)
        {
            this.time += dt * 0.001;
        }
    },

    clear: function(dt)
    {
        this.time = 0;
        this.damageDict = {};
        this.healDict = {};
    },

    addDamage: function(damage, dmgType, source, target, isCrit, spell)
    {
        if(source.data.isPlayer === true)
        {
            // Create a dict if it does not exist
            this.damageDict[source.data.name] = this.damageDict[source.data.name] || 
            {
                totalDamage: 0,
                normalDamage: 0,
                critDamage: 0,
                targetDict: {},
                typeDict: {},
                spellDict: {},
                player: source,
            };

            this.damageDict[source.data.name].totalDamage += damage;

            if(isCrit === true)
            {
                this.damageDict[source.data.name].critDamage += damage;
            }
            else
            {
                this.damageDict[source.data.name].normalDamage += damage;
            }

            //Category: spell
            if(typeof spell !== "undefined")
            {
                this.damageDict[source.data.name].spellDict[spell.name] = this.damageDict[source.data.name].spellDict[spell.name] || 0;
                this.damageDict[source.data.name].spellDict[spell.name] += damage;
            }
        }
    },

    addHeal: function(realHeal, overHeal, source, taret, isCrit, spell)
    {
        if(source.data.isPlayer === true)
        {
            // Create a dict if it does not exist
            this.healDict[source.data.name] = this.healDict[source.data.name] || 
            {
                totalHeal: 0,
                realHeal: 0,
                overHeal: 0,
                // TODO: crit
                targetDict: {},
                spellDict: {},
                player: source,
            };

            this.healDict[source.data.name].totalHeal += realHeal + overHeal;
            this.healDict[source.data.name].realHeal += realHeal;
            this.healDict[source.data.name].overHeal += overHeal;

            //Category: spell
            if(typeof spell !== "undefined")
            {
                this.healDict[source.data.name].spellDict[spell.name] = this.healDict[source.data.name].spellDict[spell.name] || { totalHeal: 0, realHeal: 0, overHeal: 0 };
                this.healDict[source.data.name].spellDict[spell.name].totalHeal += realHeal + overHeal;
                this.healDict[source.data.name].spellDict[spell.name].realHeal += realHeal;
                this.healDict[source.data.name].spellDict[spell.name].overHeal += overHeal;
            }
        }
    },

    getDamageList: function({} = {})
    {
        var dmgList = [];
        for(player in this.damageDict)
        {
            dmgList.push({
                number: this.damageDict[player].totalDamage,
                length: this.damageDict[player].totalDamage,
                slices: [
                    this.damageDict[player].normalDamage, 
                    this.damageDict[player].critDamage],
                colors: [
                    "#ffc477", 
                    "#ff0000"],
                player: this.damageDict[player].player
            });
        }

        dmgList.sort((a, b) => {return b.number - a.number;});
        return dmgList;
    },

    getDPSList: function({} = {})
    {
        var dmgList = this.getDamageList();
        for(element in dmgList)
        {
            dmgList[element].number = Math.round(dmgList[element].number / this.time);
        }

        return dmgList;
    },

    getHealList: function({} = {})
    {
        var healList = [];
        for(player in this.healDict)
        {
            healList.push({
                number: this.healDict[player].realHeal,
                length: this.healDict[player].totalHeal, 
                slices: [
                    this.healDict[player].realHeal,
                    this.healDict[player].overHeal],
                colors: [
                    "#00ff00",
                    "#ff0000"], 
                player: this.healDict[player].player});
        }

        healList.sort((a, b) => {return b.number - a.number});
        return healList;
    },

    getHPSList: function({} = {})
    {
        var healList = this.getHealList();
        for(element in healList)
        {
            healList[element].number = Math.round(healList[element].number / this.time);
        }

        return healList;
    }
});
