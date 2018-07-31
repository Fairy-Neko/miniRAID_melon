game.Mobs = game.Mobs || {};

game.Mobs.UnitManager = me.Object.extend
({
    init: function()
    {
        this.name = "Unit Manager";

        this.player = new Set();
        this.enemy = new Set();

        me.input.registerPointerEvent('pointerdown', me.game.viewport, this.pointerDown.bind(this));
    },

    pointerDown: function(pointer)
    {
        if(typeof this.origin === "undefined")
        {
            this.origin = new me.Vector2d(0, 0);
        }
        this.origin.set(pointer.gameX, pointer.gameY);

        var playerNum = 0;
        for(var player of this.player)
        {
            player.agent.setTargetPos(player, this.origin.clone().add(new me.Vector2d(game.data.playerSparse, 0).rotate(playerNum / this.player.size * 2 * Math.PI)));
            playerNum++;
        }
        return true;
    },

    addPlayer: function(player)
    {
        this.player.add(player);
    },

    addEnemy: function(enemy)
    {
        this.enemy.add(enemy);
    },

    removePlayer: function(player)
    {
        this.player.delete(player);
    },

    removeEnemy: function(enemy)
    {
        this.enemy.delete(enemy);
    },

    _getUnitList: function(targetSet, sortMethod, availableTest)
    {
        var result = [];

        for(var unit of targetSet)
        {
            if(availableTest(unit) === true)
            {
                result.push(unit);
            }
        }

        result.sort(sortMethod);
        return result;
    },

    getPlayerList: function(sortMethod, availableTest)
    {
        sortMethod = sortMethod || function(a, b) {return 0;};
        availableTest = availableTest || function(a) {return true;};

        return this._getUnitList(this.player, sortMethod, availableTest);
    },

    getEnemyList: function(sortMethod, availableTest)
    {
        sortMethod = sortMethod || function(a, b) {return 0;};
        availableTest = availableTest || function(a) {return true;};

        return this._getUnitList(this.enemy, sortMethod, availableTest);
    },

    getUnitList: function({
        sortMethod = function(a, b) {return 0;}, 
        availableTest = function(a) {return true;}, 
        isPlayer = false
    } = {})
    {
        if(isPlayer === true)
        {
            return this._getUnitList(this.player, sortMethod, availableTest);
        }
        else
        {
            return this._getUnitList(this.enemy, sortMethod, availableTest);
        }
    },

    getUnitListAll: function(sortMethod, availableTest)
    {
        sortMethod = sortMethod || function(a, b) {return 0;};
        availableTest = availableTest || function(a) {return true;};

        return this._getUnitList(this.enemy, sortMethod, availableTest).concat(this._getUnitList(this.player, sortMethod, availableTest)).sort(sortMethod);
    },

    getNearest: function(position, isPlayer = false, count = 1)
    {
        var result = this.getUnitList({
            sortMethod: function(a, b) {return a.getRenderPos(0.5, 0.5).distance(position) - b.getRenderPos(0.5, 0.5).distance(position);},
            isPlayer: isPlayer,
        });
        return result.slice(0, Math.min(count, result.length));
    },

    getNearestUnitAll: function(position, count = 1)
    {
        var result = this.getUnitListAll(function(a, b) {return a.getRenderPos(0.5, 0.5).distance(position) - b.getRenderPos(0.5, 0.5).distance(position);});
        return result.slice(0, Math.min(count, result.length));
    },

    _boardcastAgent: function(set, boardcastObj)
    {
        for(var obj of set)
        {
            if(obj.agent.focusList.has(boardcastObj.target))
            {
                if(boardcastObj.isDamage === true)
                {
                    obj.agent.onFocusRecieveDamage(boardcastObj);
                }
                else
                {
                    obj.agent.onFocusRecieveHeal(boardcastObj);
                }
            }
        }
    },

    boardcastDamage: function(damage)
    {
        damage.isDamage = true;
        this._boardcastAgent(this.player, damage);   
        this._boardcastAgent(this.enemy, damage);   
    },

    boardcastHeal: function(heal)
    {
        heal.isDamage = false;
        this._boardcastAgent(this.player, heal);   
        this._boardcastAgent(this.enemy, heal);  
    },
});

game.Mobs.UnitManager.sortByHealth = function(a, b)
{
    return a.data.currentHealth - b.data.currentHealth;
};

game.Mobs.UnitManager.sortByHealthPercentage = function(a, b)
{
    return (a.data.currentHealth / a.data.maxHealth) - (b.data.currentHealth / b.data.maxHealth);
};

game.Mobs.base = game.Moveable.extend(
{
    init: function(x, y, settings) 
    {
        this._super(game.Moveable, 'init', [x, y, settings]);

        if(settings.isPlayer === true)
        {
            this.body.collisionType = me.collision.types.PLAYER_OBJECT;
            game.units.addPlayer(this);
        }
        else
        {
            this.body.collisionType = me.collision.types.ENEMY_OBJECT;
            game.units.addEnemy(this);
        }

        this.alwaysUpdate = true;
        this.body.gravity = 0;

        if(settings.agent)
        {
            this.agent = new settings.agent(this, settings);
        }
        else
        {
            this.agent = new game.MobAgent.base(this, settings);
        }

        this.attackCounter = 0;

        this.data = settings.backendData || new game.dataBackend.Mob(settings);

        // Add a test HP bar for it
        this.HPBar = me.game.world.addChild(new game.Utils.TestHPBar(0, -10, this));
    },

    updateMoveable: function(dt)
    {
        //Update all the buffes
        for (let buff of this.data.buffList.values())
        {
            buff.onUpdate(this, dt / 1000);
            
            if(buff.isOver == true)
            {
                //this buff is over. delete it from the list.
                this.data.buffList.delete(buff);
            }
        }

        //calculate Stats
        this.calcStats();
        for (let buff of this.data.buffList.values())
        {
            buff.onStatCalculation(this);
        }

        me.collision.check(this);
        this.agent.updateMob(this, dt);
        this.updateMob(dt);

        // Update all buffes
        // Since we cannot access draw() so we call onRender() here (end of update).
        for (let buff of this.data.buffList.values())
        {
            buff.onRender(this);
        }
    },

    updateMob: function(dt)
    {

    },

    doAttack: function(dt)
    {
        if(typeof this.data.currentWeapon === "undefined")
        {
            return false;
        }

        this.attackCounter += dt * 0.001;

        if(this.attackCounter > this.data.getAttackSpeed())
        {
            // This will cause mutiple attacks if attackspeed increases.
            // this.attackCounter -= this.data.getAttackSpeed();
            
            this.attackCounter = 0;
            return true;
        }

        return false;
    },

    calcStats: function()
    {
        //Go back to base speed
        this.data.modifiers.speed = 1.0;
        this.data.modifiers.movingSpeed = 1.0;
        this.data.modifiers.attackSpeed = 1.0;
    },

    // Will be called when a buff is going to affect the mob.
    // If anything some object with buff ability (e.g. fireball can fire sth up) hits has method recieveBuff(),
    // recieveBuff() will be called and the mob will be buffed.
    // recieveBuff() should be the final step of being buffed, and if the mob resists some buff this should not be called.
    // e.g. in some inherited classes use:
    //                                       if(...){ nothing happens; } else { super.recieveBuff() }.
    recieveBuff: function({
        source = undefined, 
        buff = undefined,
        popUp = true
    } = {})
    {
        if(buff != undefined)
        {
            // console.log("[" + this.name + "] : Recieved buff <" + buff.name + "> from <" + source.name, "> !");

            this.data.buffList.add(buff);

            //Set source and belongings
            buff.source = source;
            buff.parent = this;

            //Initial popUp
            if(popUp == true)
            {
                buff.popUp();
            }
        }
    },

    // Same as recieveBuff(),
    // this method will be used to recieve damage from any object.
    // this method will calculate damage reducement *only* based on mob's resist stats,
    // So if you have any other damage calculation processes (e.g. fire resist necklace / -3 fire dmg), 
    // do it first and then call super.recieveDamage().
    
    // This method will also popup a text with the final amount of damage, 
    // with corresponding color defined in tables.js (var damageColor).
    // this action could be disabled by setting popUp = false.
    recieveDamage: function({
        source = undefined, 
        damage = {
            // slash = 0,
            // knock = 0,
            // pierce = 0,
            // fire = 0,
            // ice = 0,
            // water = 0,
            // nature = 0,
            // wind = 0,
            // thunder = 0,
            // light = 0
        } = {},
        isCrit = false,
        spell = undefined,
        popUp = true
    } = {})
    {
        var finalDmg = {};
        var dmgTotal = 0;

        for(var dmgType in damage)
        {
            // damage% = 0.9659 ^ resist
            // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
            // which will reach 50% damage reducement at 20 points.
            finalDmg[dmgType] = Math.ceil(damage[dmgType] * (Math.pow(0.9659, this.data.battleStats.resist[dmgType])));
            dmgTotal += finalDmg[dmgType];

            if(popUp == true && finalDmg[dmgType] > 0)
            {
                var popUpPos = this.getRenderPos(0.5, 0.0);
                game.UI.popupMgr.addText({
                    text: finalDmg[dmgType].toString(),
                    color: game.data.damageColor[dmgType],
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
            }
        }

        var damageObj = {
            source: source,
            target: this,
            damage: damage,
            finalDamage: finalDmg,
            damageTotal: dmgTotal,
            isCrit: isCrit,
            spell: spell,
        };
        this.agent.onRecieveDamage(damageObj);
        game.units.boardcastDamage(damageObj);

        for(dmg in finalDmg)
        {
            this.data.currentHealth -= finalDmg[dmg];
            game.data.monitor.addDamage(finalDmg[dmg], dmg, source, this, isCrit, spell);

            if(this.data.currentHealth <= 0)
            {
                this.die(source, damage);
            }
        }
    },

    recieveHeal: function({
        source = undefined,
        heal = 0,
        isCrit = false,
        spell = undefined,
        popUp = true,
    } = {})
    {
        var finalHeal = heal;
        var realHeal = 0;
        var overHeal = 0;

        if(finalHeal > 0)
        {
            realHeal = Math.min(this.data.maxHealth - this.data.currentHealth, finalHeal);
            overHeal = finalHeal - realHeal;
            this.data.currentHealth += realHeal;

            if(popUp == true)
            {
                var popUpPos = this.getRenderPos(0.5, 0.0);
                if(overHeal > 0)
                {
                    game.UI.popupMgr.addText({
                        text: realHeal.toString() + "(" + overHeal.toString() + ")",
                        posX: popUpPos.x,
                        posY: popUpPos.y,
                    });
                }
                else
                {
                    game.UI.popupMgr.addText({
                        text: realHeal.toString(),
                        posX: popUpPos.x,
                        posY: popUpPos.y,
                    });
                }
            }

            game.data.monitor.addHeal(realHeal, overHeal, source, this, isCrit, spell);
        }

        var healObj = {
            source: source,
            target: this,
            totalHeal: finalHeal,
            realHeal: realHeal,
            isCrit: isCrit,
            spell: spell,
        };
        this.agent.onRecieveHeal(healObj);
        game.units.boardcastHeal(healObj);
    },

    die: function({
        source = undefined, 
        damage = {
            slash = 0,
            knock = 0,
            pierce = 0,
            fire = 0,
            ice = 0,
            water = 0,
            nature = 0,
            wind = 0,
            thunder = 0,
            light = 0
        } = {},
    } = {})
    {
        if(this.onDeath(source, damage) === true)
        {
            me.game.world.removeChild(this.HPBar);

            this.data.alive = false;
            this.body.collisionType = me.collision.types.NO_OBJECT;

            if(this.data.isPlayer === true)
            {
                game.units.removePlayer(this);
            }
            else
            {
                game.units.removeEnemy(this);
            }
            me.game.world.removeChild(this);
        }
    },

    onDeath: function({
        source = undefined, 
        damage = {
            slash = 0,
            knock = 0,
            pierce = 0,
            fire = 0,
            ice = 0,
            water = 0,
            nature = 0,
            wind = 0,
            thunder = 0,
            light = 0
        } = {},
    } = {})
    {
        return true;
    }
});

game.Mobs.checkAlive = function(target)
{
    return ((typeof target !== "undefined") && (typeof target.renderable !== "undefined") && (typeof target.body !== "undefined") && (target.data.alive === true));
};

// Some mobs (player & enemies)
game.Mobs.TestMob = game.Mobs.base.extend(
{
    init: function(x, y, settings)
    {
        settings.health = 20000;

        settings.weaponLeft = new game.weapon.TestHomingStaff
        ({
            baseAttackSpeed: game.helper.getRandomFloat(0.7, 0.9),
            activeRange: game.helper.getRandomInt(200, 300),
            power: 50,
            targetCount: 1,
        });

        this._super(game.Mobs.base, 'init', [x, y, settings]);
        
        if(Math.random() < 0)
        {
            this.recieveBuff({source: this, buff: new Fired({time: 5.0})});
        }
    },

    updateMob: function(dt)
    {
        // move the mob a little bit to left
        this.body.vel.x = this.data.getMovingSpeed() * Math.sin(me.timer.getTime() * 0.001) * me.timer.tick;
        this.body.update(dt);

        if(this.doAttack(dt) === true)
        {
            if(typeof (targets = this.data.currentWeapon.grabTargets(this)) !== "undefined")
            {
                for(var target of targets.values())
                {
                    if(this.data.currentWeapon.isInRange(this, target))
                    {
                        this.data.currentWeapon.attack(this, target);
                    }
                }
            }
        }

        me.collision.check(this);
    },

    onCollision: function(response, other)
    {
        if(other.body.collisionType !== me.collision.types.WORLD_SHAPE)
        {
            return false;
        }
        return true;
    }
});

// TODO - combine mob agent and player agent
game.MobAgent = game.MobAgent || {};

game.MobAgent.base = me.Object.extend
({
    init(mob, settings) 
    {
        this.focusList = new Set();
    },
    updateMob(mob, dt) {},
    
    onRecieveDamage({
        source, 
        damage, 
        finalDamage, 
        damageTotal,
        isCrit,
        spell, 
    } = {}) {},

    onRecieveHeal({
        source, 
        totalHeal, 
        realHeal, 
        isCrit,
        spell, 
    } = {}) {},

    onFocusRecieveDamage({
        source, 
        target, 
        damage, 
        finalDamage,
        damageTotal, 
        isCrit,
        spell, 
    } = {}) {},

    onFocusRecieveHeal({
        source,
        target,  
        totalHeal, 
        realHeal, 
        isCrit,
        spell, 
    } = {}) {},

    onDeath({
        source, 
        damage, 
        finalDamage,
        damageTotal, 
        isCrit,
        spell, 
    } = {}) {},
});

game.MobAgent.TauntBased = game.MobAgent.base.extend
({
    init(mob, settings)
    {
        this.tauntList = {};
        this.targetMob = undefined;
    },

    updateMob(mob, dt)
    {
        this.updateTaunt();

        // borrowed from playerAgent
        
    },

    updateTaunt()
    {
        // Find current target with highest taunt
        var maxValue = 0;
        var nextTarget = undefined;

        // Use iteration instead of sort to save a O(logN) time.
        // Don't know if this will slower than obj -> array -> sort() cuz javascript vs native...
        // But we need update the list though
        for(var tmpTargetMob of this.focusList)
        {
            // Remove the mob if it is dead or it has no taunt
            if(!game.Mobs.checkAlive(tmpTargetMob) || this.tauntList[tmpTargetMob.data.ID].taunt <= 0)
            {
                this.focusList.delete(tmpTargetMob);
                delete this.tauntList[tmpTargetMob.data.ID];
            }
            else
            {
                if(this.tauntList[tmpTargetMob.data.ID].taunt > maxValue)
                {
                    maxValue = this.tauntList[tmpTargetMob.data.ID].taunt;
                    nextTarget = tmpTargetMob;
                }
            }
        }

        if(nextTarget && nextTarget != this.targetMob)
        {
            // TODO: popUp a "!" and a red line for taunt focus
            this.targetMob = nextTarget;
        }
        else if (typeof nextTarget === "undefined")
        {
            // TODO: popUp a "?"
        }
    },

    // Some skills that will change taunt value directly 
    // (e.g. Taunt(skill), Wind rush(some skill that will reduce some taunt from target), etc.)
    changeTaunt({
        source,
        taunt,
    })
    {
        if(!this.focusList.has(source))
        {
            this.focusList.add(source);
            this.tauntList[source.data.ID] = {taunt: 0};
        }

        this.tauntList[source.data.ID].taunt += taunt;
    },

    onRecieveDamage({
        source, 
        damage, 
        finalDamage, 
        damageTotal,
        isCrit,
        spell, 
    } = {}) 
    {
        // Add the damage source in to our focus list,
        if(!this.focusList.has(source))
        {
            this.focusList.add(source);
            this.tauntList[source.data.ID] = {taunt: 0};
        }

        // and create the taunt of that target based on damage
        this.tauntList[source.data.ID].taunt += damageTotal * source.data.tauntMul;
    },

    onFocusRecieveHeal({
        source,
        target,  
        totalHeal, 
        realHeal, 
        isCrit,
        spell, 
    } = {}) 
    {
        // Add the healing source in to our focus list,
        if(!this.focusList.has(source))
        {
            this.focusList.add(source);
            this.tauntList[source.data.ID] = {taunt: 0};
        }

        // and create the taunt of that target based on healing
        this.tauntList[source.data.ID].taunt += realHeal * source.data.tauntMul * game.data.healTaunt;
    },
})
