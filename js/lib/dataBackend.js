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

        // Equipment related
        this.weaponLeft = settings.weaponLeft;// || new game.weapon(settings);
        this.weaponRight = settings.weaponRight;// || new game.weapon(settings);
        this.armor = settings.armor;// || new game.Armor(settings);
        this.accessories = settings.accessories;// || new game.Accessory(settings);

        this.currentWeapon = this.weaponLeft;

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

        //calculate Stats
        this.calcStats();
        this.updateListeners('onStatCalculation', [mob]);
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
        this.addListener(buff);
    },

    addListener: function(listener, source = undefined)
    {
        this.listeners.add(listener);

        // Set source and belongings
        listener.source = source;

        if(listener.isBuff)
        {
            // Should we still keep buffList ?
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

    receiveDamage: function({
        source = undefined, 
        target = undefined,
        damage = {},
        isCrit = false,
        spell = undefined,
    } = {})
    {
        // Let everyone know what is happening
        var damageObj = {
            source: source,
            target: target,
            damage: damage,
            isCrit: isCrit,
            spell: spell,
        };

        var finalDmg = {};

        this.updateListeners('onReceiveDamage', damageObj);
        if(source)
        {
            source.data.updateListeners('onDealDamage', damageObj);
        }
        game.units.boardcast('onFocusReceiveDamage', damageObj.target, damageObj);
        game.units.boardcast('onFocusDealDamage', damageObj.source, damageObj);

        // Do the calculation
        for(var dmgType in damage)
        {
            // damage% = 0.9659 ^ resist
            // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
            // which will reach 50% damage reducement at 20 points.
            finalDmg[dmgType] = Math.ceil(damage[dmgType] * (Math.pow(0.9659, this.battleStats.resist[dmgType])));
        }

        // Let everyone know what is happening
        damageObj.damage = finalDmg;

        this.updateListeners('onReceiveDamageFinal', damageObj);
        if(source)
        {
            source.data.updateListeners('onDealDamageFinal', damageObj);
        }
        game.units.boardcast('onFocusReceiveDamageFinal', damageObj.target, damageObj);
        game.units.boardcast('onFocusDealDamageFinal', damageObj.source, damageObj);

        // Decrese HP
        // Check if I am dead
        for(dmg in finalDmg)
        {
            this.currentHealth -= finalDmg[dmg];
            game.data.monitor.addDamage(finalDmg[dmg], dmg, source, target, isCrit, spell);
            
            if(this.currentHealth <= 0)
            {
                // Let everyone know what is happening
                this.updateListeners('onDeath', damageObj);
                if(source)
                {
                    source.data.updateListeners('onKill', damageObj);
                }
                game.units.boardcast('onFocusDeath', damageObj.target, damageObj);
                game.units.boardcast('onFocusKill', damageObj.source, damageObj);

                // If still I am dead
                if(this.currentHealth <= 0)
                {
                    // I die cuz I am killed
                    this.alive = false;
                }
            }
        }

        return finalDmg;
    },

    receiveHeal: function({
        source = undefined,
        target = undefined,
        heal = 0,
        isCrit = false,
        spell = undefined,
    } = {})
    {
        // Package the healing in to an object so that buffs and agents can
        // modify them.
        var healObject = {real: heal, over: 0};

        // Let everyone know what is happening
        var healObj = {
            source: source,
            target: target,
            heal: healObject,
            isCrit: isCrit,
            spell: spell,
        };

        this.updateListeners('onReceiveHeal', healObj);
        if(source)
        {
            source.data.updateListeners('onDealHeal', healObj);
        }
        game.units.boardcast('onFocusReceiveHeal', healObj.target, healObj);
        game.units.boardcast('onFocusDealHeal', healObj.source, healObj);

        // Do the calculation
        // _finalHeal: total amount of healing (real + over)
        var _finalHeal = heal * 1.0; // Maybe something like heal resist etc.
        var finalHeal = {total: _finalHeal, real: _finalHeal, over: 0};

        // calculate overHealing using current HP and max HP.
        finalHeal.real = Math.min(this.maxHealth - this.currentHealth, _finalHeal);
        finalHeal.over = _finalHeal - finalHeal.real;

        // Let buffs and agents know what is happening
        healObj.heal = finalHeal;

        this.updateListeners('onReceiveHealFinal', healObj);
        if(source)
        {
            source.data.updateListeners('onDealHealFinal', healObj);
        }
        game.units.boardcast('onFocusReceiveHealFinal', healObj.target, healObj);
        game.units.boardcast('onFocusDealHealFinal', healObj.source, healObj);

        // Increase the HP.
        this.currentHealth += finalHeal.real;
        game.data.monitor.addHeal(finalHeal.real, finalHeal.over, source, target, isCrit, spell);

        return finalHeal;
    },

    die: function({
        source = undefined, 
        damage = {},
    } = {})
    {
        this.beingAttack = 0;
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

    onDealDamage: function({ target, damage, isCrit, spell } = {}) { return false; },
    onDealDamageFinal: function({ target, damage, isCrit, spell } = {}) { return false; },

    onDealHeal: function({ target, heal, isCrit, spell } = {}) { return false; },
    onDealHealFinal: function({ target, heal, isCrit, spell } = {}) { return false; },
    
    onReceiveDamage: function({ source, damage, isCrit, spell } = {}) { return false; },
    onReceiveDamageFinal: function({ source, damage, isCrit, spell } = {}) { return false; },

    onReceiveHeal: function({ source, heal, isCrit, spell } = {}) { return false; },
    onReceiveHealFinal: function({ source, heal, isCrit, spell } = {}) { return false; },

    onKill: function({ source, damage, isCrit, spell } = {}) { return false; },
    onDeath: function({ source, damage, isCrit, spell } = {}) { return false; },

    onFocusDealDamage: function({ source, target, damage, isCrit, spell } = {}) { return false; },
    onFocusDealDamageFinal: function({ source, target, damage, isCrit, spell } = {}) { return false; },

    onFocusDealHeal: function({ source, target, heal, isCrit, spell } = {}) { return false; },
    onFocusDealHealFinal: function({ source, target, heal, isCrit, spell } = {}) { return false; },

    onFocusReceiveDamage: function({ source, target, damage, isCrit, spell } = {}) { return false; },
    onFocusReceiveDamageFinal: function({ source, target, damage, isCrit, spell } = {}) { return false; },

    onFocusReceiveHeal: function({ source, target, heal, isCrit, spell } = {}) { return false; },
    onFocusReceiveHealFinal: function({ source, target, heal, isCrit, spell } = {}) { return false; },

    onFocusKill: function({ source, target, damage, isCrit, spell } = {}) { return false; },
    onFocusDeath: function({ source, target, damage, isCrit, spell } = {}) { return false; },
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
