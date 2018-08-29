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
            spellSpeed: settings.spellSpeed || 1.0,
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
                physical: 0,
                elemental: 0,
                pure: 0, // It should be 0

                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0,

                heal: 0,
            },

            attackPower: {
                physical: 0,
                elemental: 0,
                pure: 0, // It should be 0

                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 25, 
                wind: 0,
                thunder: 0,
                light: 0,

                heal: 0, 
            },

            // Write a helper to get hit / avoid / crit percentage from current level and parameters ?
            // Percentage
            // Those are basic about overall hit accuracy & avoid probabilities, critical hits.
            // Advanced actions (avoid specific spell) should be calculated inside onReceiveDamage() etc.
            // Same for shields, healing absorbs (Heal Pause ====...===...==...=>! SS: [ABSORB]!!! ...*&@^#), etc.
            hitAcc: 100,
            avoid: 0,

            // Percentage
            crit: 0, // Should crit have types? e.g. physical elemental etc.
            antiCrit: 0,

            // Parry for shield should calculate inside the shield itself when onReceiveDamage().

            attackRange: 0,
            extraRange: 0,
        };

        // Equipment related
        this.weaponLeft = settings.weaponLeft;// || new game.weapon(settings);
        this.weaponRight = settings.weaponRight;// || new game.weapon(settings);
        this.armor = settings.armor;// || new game.Armor(settings);
        this.accessory = settings.accessory;// || new game.Accessory(settings);

        this.currentWeapon = this.weaponLeft;
        this.anotherWeapon = this.weaponRight;

        // Is this mob a player?
        this.isPlayer = settings.isPlayer || false;

        // How much taunt will this mob generate?
        this.tauntMul = settings.tauntMul || 1.0;
        this.beingAttack = 0;
        this.healPriority = false;

        // A Specific identify name only for this mob
        this.ID = game.data.backend.getID();

        // ref for MobListeners (buffs, agent, weapons, armor, ...)
        this.listeners = new Set();

        // buff list, only for rendering UI
        // buffs are actually plain mob listeners
        // maybe they have something different (x)
        this.buffList = new Set();

        // spell list, only for spells with cooldowns.
        this.spells = {};

        // Which class should be used when realize this mob ?
        this.mobPrototype = settings.mobPrototype || game.Mobs.TestMob;
    },

    switchWeapon: function()
    {
        if(typeof this.anotherWeapon !== "undefined")
        {
            var tmp = this.currentWeapon;
            this.currentWeapon = this.anotherWeapon;
            this.anotherWeapon = tmp;
        }
        // TODO: trigger onWeaponChange()
    },

    getPercentage: function(parameter)
    {
        // TODO: convert parameter to percentage from level
        return parameter;
    },

    getMovingSpeed: function()
    {
        return this.modifiers.speed * this.modifiers.movingSpeed * this.baseSpeed;
    },

    getAttackSpeed: function()
    {
        return (1 / this.modifiers.speed) * (1 / this.modifiers.attackSpeed) * this.currentWeapon.baseAttackSpeed;
    },

    updateMobBackend: function(mob, dt)
    {
        // Update all listeners
        this.updateListeners('onUpdate', [mob, dt]);
        for (let listener of this.listeners.values())
        {
            if(listener.isOver && listener.isOver == true)
            {
                //this buff is over. delete it from the list.
                // this.buffList.delete(buff);
                this.removeListener(listener);
            }
        }

        // calculate Stats
        // TODO: seperate calculation to 2 phase, base and battle stats.
        this.calcStats();
        this.updateListeners('onStatCalculation', [mob]);

        // update spells
        for (let spell in this.spells)
        {
            if(this.spells.hasOwnProperty(spell))
            {
                this.spells[spell].update(mob, dt);
            }
        }
    },

    // Function used to tell buffs and agents what was going on
    // when damage and heal happens. They can modify them.
    updateListeners: function(method, args)
    {
        var flag = false;
        if(!Array.isArray(args))
        {
            args = [args];
        }

        // call every listener
        for(let listener of this.listeners.values())
        {
            if(
                (listener.enabled == undefined || listener.enabled && listener.enabled == true)
              && listener[method])
            {
                flag = flag | listener[method].apply(listener, args);
            }
        }

        return flag;
    },

    addBuff: function(buff)
    {
        for(let localBuff of this.buffList)
        {
            // no more unlimited bloodlust!
            // maybe we should add stacks here
            if(localBuff.name === buff.name && localBuff.source === buff.source){
                localBuff.timeRemain = buff.timeMax;
                return;
            }
        }
        this.addListener(buff);
    },
    
    findBuff: function(buffname)
    {
        for(let localBuff of this.buffList)
        {
            if(localBuff.name === buffname){
                return localBuff;
            }
        }
    },

    addListener: function(listener)
    {
        this.listeners.add(listener);

        if(listener.isBuff)
        {
            // Should we still keep buffList ? Maybe(x
            this.buffList.add(listener);
        }
    },

    removeListener: function(listener)
    {
        if(listener.isBuff)
        {
            this.buffList.delete(listener);
        }

        this.listeners.delete(listener);
    },

    calcStats: function()
    {
        //Go back to base speed
        this.modifiers.speed = 1.0;
        this.modifiers.movingSpeed = 1.0;
        this.modifiers.attackSpeed = 1.0;
    },

    receiveDamage: function(damageInfo)
    {
        // Calculate crit based on parameters
        if(!damageInfo.isCrit)
        {
            damageInfo.isCrit = (100 * Math.random()) < (
                damageInfo.source.data.getPercentage(damageInfo.source.data.battleStats.crit) - 
                damageInfo.target.data.getPercentage(damageInfo.target.data.battleStats.antiCrit));

            damageInfo.isAvoid = (100 * Math.random()) > (
                damageInfo.source.data.getPercentage(damageInfo.source.data.battleStats.hitAcc) - 
                damageInfo.target.data.getPercentage(damageInfo.target.data.battleStats.avoid));
        }

        this.updateListeners('onReceiveDamage', damageInfo);
        if (damageInfo.source)
        {
            damageInfo.source.data.updateListeners('onDealDamage', damageInfo);
        }
        game.units.boardcast('onFocusReceiveDamage', damageInfo.target, damageInfo);
        game.units.boardcast('onFocusDealDamage', damageInfo.source, damageInfo);

        // Check if it was avoided (we check it before final calculation, so when onReceiveDamageFinal(), damage are guaranteed not avoided)
        if (damageInfo.isAvoid === true)
        {
            // Tell mob this attack was avoided
            return {isAvoid: true};
        }
        // N.B. if you want do something if target avoid, e.g. deal extra on avoid,
        // you should let it change the damage at onDealDamage() when isAvoid == true. (e.g. set other to 0 and add extra damage)
        // then set isAvoid to false. You can also pop some text when you add the extra damage.

        // Do the calculation
        for(var dmgType in damageInfo.damage)
        {
            // damage% = 1.0353 ^ power
            // 20pts of power = 100% more damage
            if(damageInfo.source)
            {
                damageInfo.damage[dmgType] = Math.ceil(
                    damageInfo.damage[dmgType] * 
                    (Math.pow(
                        1.0353,
                        damageInfo.source.data.battleStats.attackPower[game.data.damageType[dmgType]] +
                        damageInfo.source.data.battleStats.attackPower[dmgType])));
            }

            // damage% = 0.9659 ^ resist
            // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
            // which will reach 50% damage reducement at 20 points.
            damageInfo.damage[dmgType] = Math.ceil(
                damageInfo.damage[dmgType] * 
                (Math.pow(
                    0.9659, 
                    this.battleStats.resist[game.data.damageType[dmgType]] + 
                    this.battleStats.resist[dmgType])));

            // Apply criticals
            damageInfo.damage[dmgType] = Math.ceil( 
                damageInfo.damage[dmgType] * 
                (damageInfo.isCrit ? game.data.critMultiplier[dmgType] : 1.0));
        }

        // Let everyone know what is happening
        // damageObj.damage = finalDmg;

        this.updateListeners('onReceiveDamageFinal', damageInfo);
        if(damageInfo.source)
        {
            damageInfo.source.data.updateListeners('onDealDamageFinal', damageInfo);
        }
        game.units.boardcast('onFocusReceiveDamageFinal', damageInfo.target, damageInfo);
        game.units.boardcast('onFocusDealDamageFinal', damageInfo.source, damageInfo);

        // Decrese HP
        // Check if I am dead
        for(dmg in damageInfo.damage)
        {
            this.currentHealth -= damageInfo.damage[dmg];
            game.data.monitor.addDamage(damageInfo.damage[dmg], dmg, damageInfo.source, damageInfo.target, damageInfo.isCrit, damageInfo.spell);
            
            if(this.currentHealth <= 0)
            {
                // Let everyone know what is happening
                this.updateListeners('onDeath', damageInfo);
                if(damageInfo.source)
                {
                    damageInfo.source.data.updateListeners('onKill', damageInfo);
                }
                game.units.boardcast('onFocusDeath', damageInfo.target, damageInfo);
                game.units.boardcast('onFocusKill', damageInfo.source, damageInfo);

                // If still I am dead
                if(this.currentHealth <= 0)
                {
                    // I die cuz I am killed
                    this.alive = false;
                }
            }
        }

        // It hits!
        return damageInfo.damage;
    },

    receiveHeal: function(healInfo)
    {
        // Calculate crit based on parameters
        if(!healInfo.isCrit)
        {
            healInfo.isCrit = (100 * Math.random()) < (
                healInfo.source.data.getPercentage(healInfo.source.data.battleStats.crit) - 
                healInfo.target.data.getPercentage(healInfo.target.data.battleStats.antiCrit));
        }

        // Let everyone know what is happening
        this.updateListeners('onReceiveHeal', healInfo);
        if(healInfo.source)
        {
            healInfo.source.data.updateListeners('onDealHeal', healInfo);
        }
        game.units.boardcast('onFocusReceiveHeal', healInfo.target, healInfo);
        game.units.boardcast('onFocusDealHeal', healInfo.source, healInfo);

        // Do the calculation
        // _finalHeal: total amount of healing (real + over)
        healInfo.heal.total = healInfo.heal.real;

        if(healInfo.source)
        {
            healInfo.heal.total = Math.ceil(
                healInfo.heal.total * 
                (Math.pow(
                    1.0353,
                    healInfo.source.data.battleStats.attackPower.heal)));
        }

        // damage% = 0.9659 ^ resist
        // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
        // which will reach 50% damage reducement at 20 points.
        healInfo.heal.total = Math.ceil(
            healInfo.heal.total * 
            (Math.pow(
                0.9659,
                this.battleStats.resist.heal)));
        
        healInfo.heal.total = Math.ceil(
            healInfo.heal.total 
            * ( healInfo.isCrit ? game.data.critMultiplier.heal : 1.0 )
        );

        // calculate overHealing using current HP and max HP.
        healInfo.heal.real = Math.min(healInfo.target.data.maxHealth - healInfo.target.data.currentHealth, healInfo.heal.total);
        healInfo.heal.over = healInfo.heal.total - healInfo.heal.real;

        // Let buffs and agents know what is happening
        this.updateListeners('onReceiveHealFinal', healInfo);
        if(healInfo.source)
        {
            healInfo.source.data.updateListeners('onDealHealFinal', healInfo);
        }
        game.units.boardcast('onFocusReceiveHealFinal', healInfo.target, healInfo);
        game.units.boardcast('onFocusDealHealFinal', healInfo.source, healInfo);

        // Increase the HP.
        this.currentHealth += healInfo.heal.real;
        game.data.monitor.addHeal(healInfo.heal.real, healInfo.heal.over, healInfo.source, healInfo.target, healInfo.isCrit, healInfo.spell);

        return healInfo.heal;
    },

    canCastSpell: function()
    {
        return true;
    },

    useMana: function(mana)
    {
        if(this.currentMana >= mana)
        {
            this.currentMana -= mana;
            return true;
        }
        return false;
    },

    die: function({
        source = undefined, 
        damage = {},
    } = {})
    {
        this.beingAttack = 0;
    },
});

/**
 * Data backend for spells.
 * This is different from game.Spell, this is only for spells could cast by mob (& player).
 * And this is the data "backend" for spells, they don't have any renderable and physics body.
 * When used, they create a game.Spell in the game world, and reset cooldown time etc.
 */
game.dataBackend.Spell = game.dataBackend.Spell || {};

game.dataBackend.Spell.base = me.Object.extend
({
    init: function(settings)
    {
        // CD (sec)
        this.coolDown = settings.coolDown || 10.0;
        this.manaCost = settings.manaCost || 0;

        // Available when init
        this.coolDownRemain = 0;

        // priority should be calculated on the fly
        this.priority = 0;
        this.available = true;

        // TODO: casting time?
    },

    update: function(mob, dt)
    {
        if(this.coolDownRemain >= 0)
        {
            this.coolDownRemain -= dt * 0.001;
        }

        this.available = this.isAvailable(mob);
    },

    cast: function(mob, target)
    {
        if(this.available && mob.data.canCastSpell() && mob.data.useMana(this.getManaCost(mob)))
        {
            this.coolDownRemain = this.coolDown;
            this.onCast(mob, target);
        }
    },

    isAvailable: function(mob)
    {
        return (this.coolDownRemain <= 0);
    },

    getManaCost: function(mob)
    {
        return this.manaCost;
    },
});

game.MobListener = me.Object.extend
({
    init: function(settings)
    {
        this.focusList = new Set();
        this.priority = 0;
        this.enabled = true;
    },

    // N.B.
    // In javascript, parameters were passed via "call-by-sharing".
    // In this case, if you change the parameter itself in a function, it will not make sense;
    // However, if you change a member of the parameter in a function, it will make sense.
    // e.g. func(x) { x = {sth}; } => DOES NOT change x
    //      func(x) { x.y = sth; } => DOES change x.y

    // Be triggered when the mob is calculating its stats.
    // Typically, this will trigged on start of each frame.
    // On every frame, the stats of the mob will be recalculated from its base value.
    onStatCalculation: function(mob) {},

    // Be triggered when the mob is attacking.
    // This is triggered before the mob's attack.
    onAttack: function(mob) {},

    // Be triggered when the mob has finished an attack.
    onAfterAttack: function(mob) {},

    // Be triggered when the mob is making a special attack.
    // This is triggered before the attack.
    onSpecialAttack: function(mob) {},

    // Be triggered when the mob has finished a special attack.
    onAfterSpecialAttack: function(mob) {},

    // Be triggered when the mob is going to be rendered.
    // e.g. change sprite color here etc.
    onRender: function(mob, renderer) {},

    // Be triggered when the mob is updating.
    // This will be triggered before onStatCalculation.
    // e.g. reduce remain time, etc.
    onUpdate: function(mob, dt) {},

    // Following functions return a boolean.
    // True:    the damage / heal was modified.
    // False:   the damage / heal was not modified.
    
    // XXFinal will happen after resist calculation, and vice versa.
    // You can modify the values in damage / heal in order to change the final result.

    // DamageInfo: { source, target, damage, isCrit, isAvoid, spell } = {}
    // HealInfo  : { source, target, heal, isCrit, spell } = {}

    onDealDamage: function(damageInfo) { return false; },
    onDealDamageFinal: function(damageInfo) { return false; },

    onDealHeal: function(healInfo) { return false; },
    onDealHealFinal: function(healInfo) { return false; },
    
    onReceiveDamage: function(damageInfo) { return false; },
    onReceiveDamageFinal: function(damageInfo) { return false; },

    onReceiveHeal: function(healInfo) { return false; },
    onReceiveHealFinal: function(healInfo) { return false; },

    onKill: function(damageInfo) { return false; },
    onDeath: function(damageInfo) { return false; },

    onFocusDealDamage: function(damageInfo) { return false; },
    onFocusDealDamageFinal: function(damageInfo) { return false; },

    onFocusDealHeal: function(healInfo) { return false; },
    onFocusDealHealFinal: function(healInfo) { return false; },

    onFocusReceiveDamage: function(damageInfo) { return false; },
    onFocusReceiveDamageFinal: function(damageInfo) { return false; },

    onFocusReceiveHeal: function(healInfo) { return false; },
    onFocusReceiveHealFinal: function(healInfo) { return false; },

    onFocusKill: function(damageInfo) { return false; },
    onFocusDeath: function(damageInfo) { return false; },
})

game.Equipable = game.MobListener.extend
({
    init: function(settings)
    {
        this._super(game.MobListener, 'init', [settings])

        this.name = "undefined weapon";

        this.baseAttackSpeed = settings.baseAttackSpeed || 1.0;
        this.statRequirements = {
            vit: 0,
            str: 0,
            dex: 0,
            tec: 0,
            int: 0,
            mag: 0,
        };

        this.stats = {
            vit: 0,
            str: 0,
            dex: 0,
            tec: 0,
            int: 9,
            mag: 0,
        };

        this.healthIncreasement = 0;

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
    },

    onStatCalculation: function(mob)
    {

    },
});

game.Armor = game.Equipable.extend
({
    init: function(settings)
    {

    },

    onAttack: function(mob, target)
    {

    },
});

game.Accessory = game.Equipable.extend
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
        if(source){
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
                    "#ff7777"],
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
