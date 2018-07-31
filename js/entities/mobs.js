game.Mobs = game.Mobs || {};

game.Mobs.UnitManager = me.Object.extend
({
    init: function()
    {
        this.name = "Unit Manager";

        this.player = new Set();
        this.enemy = new Set();
        this.selectedPlayerCount = 0;

        this.isDown = false;
        this.isDragging = false;
        this.timeCounter = 0;

        this.rectOrigin = new me.Vector2d(0, 0);
        this.rectTarget = new me.Vector2d(0, 0);
        this.selectingRect = new me.Rect(0, 0, 0, 0);

        me.input.registerPointerEvent('pointerdown', me.game.viewport, this.pointerDown.bind(this));
        me.input.registerPointerEvent('pointerup', me.game.viewport, this.pointerUp.bind(this));
        me.input.registerPointerEvent('pointerleave', me.game.viewport, this.pointerLeave.bind(this));
        me.input.registerPointerEvent('pointermove', me.game.viewport, this.pointerMove.bind(this));

        me.input.bindKey(me.input.KEY.F, "f");
        me.input.bindKey(me.input.KEY.R, "r");

        this.playerRotation = 0;
    },

    update: function(dt)
    {
        if(this.isDragging == true)
        {
            game.UI.selectingRect.show = true;

            game.UI.selectingRect.min.copy(this.rectOrigin);
            game.UI.selectingRect.max.copy(this.rectTarget);

            var minX = Math.min(this.rectOrigin.x, this.rectTarget.x);
            var minY = Math.min(this.rectOrigin.y, this.rectTarget.y);
            var maxX = Math.max(this.rectOrigin.x, this.rectTarget.x);
            var maxY = Math.max(this.rectOrigin.y, this.rectTarget.y);

            this.selectingRect.setShape(0, 0, maxX - minX, maxY - minY);
            for(let player of this.player)
            {
                var pt = player.getRenderPos(0.5, 0.5).clone();
                if(this.selectingRect.containsPoint(pt.x - minX, pt.y - minY))
                {
                    player.inControl = true;
                }
                else
                {
                    player.inControl = false;
                }
            }
        }
        else
        {
            game.UI.selectingRect.show = false;
        }
    },

    isMouseLeft: function(pointer)
    {
        if ("which" in pointer.event)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            return pointer.event.which == 1; 
        else if ("button" in pointer.event)  // IE, Opera 
            return pointer.event.button == 0; 
    },

    isMouseMiddle: function(pointer)
    {
        if ("which" in pointer.event)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            return pointer.event.which == 2; 
        else if ("button" in pointer.event)  // IE, Opera 
            return pointer.event.button == 1; 
    },

    isMouseRight: function(pointer)
    {
        if ("which" in pointer.event)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            return pointer.event.which == 3; 
        else if ("button" in pointer.event)  // IE, Opera 
            return pointer.event.button == 2; 
    },

    pointerDown: function(pointer)
    {
        pointer.event.preventDefault();

        // Drag a rect
        if(this.isMouseLeft(pointer))
        {
            this.isDown = true;
            this.isDragging = true;

            this.rectOrigin.set(pointer.gameX, pointer.gameY);
            this.rectTarget.set(pointer.gameX, pointer.gameY);

            return true;
        }

        // Move player
        if(this.isMouseRight(pointer))
        {
            this.selectedPlayerCount = 0;
            for(var player of this.player)
            {
                if(player.inControl == true)
                {
                    this.selectedPlayerCount += 1;
                }
            }

            if(typeof this.origin === "undefined")
            {
                this.origin = new me.Vector2d(0, 0);
            }
            this.origin.set(pointer.gameX, pointer.gameY);

            var playerNum = 0;

            var playerSparse = game.data.playerSparse;

            if(me.input.isKeyPressed("f"))
            {
                playerSparse = 60;
            }
            if(me.input.isKeyPressed("r"))
            {
                this.playerRotation += 2;
            }

            if(this.selectedPlayerCount == 1)
            {
                playerSparse = 0;
            }

            for(var player of this.player)
            {
                if(player.inControl == true)
                {
                    console.log(this.origin);
                    player.agent.setTargetPos(player, this.origin.clone().add(new me.Vector2d(playerSparse, 0).rotate((playerNum + this.playerRotation) / this.selectedPlayerCount * 2 * Math.PI)));
                    playerNum++;
                }
            }

            return false;
        }
    },

    pointerMove: function(pointer)
    {
        // this.timeCounter += me.timer.lastUpdate;
        // console.log(this.timeCounter);

        if(this.isDragging)
        {
            this.rectTarget.set(pointer.gameX, pointer.gameY);
        }
    },

    pointerUp: function(pointer)
    {
        this.isDown = false;

        if(this.isMouseLeft(pointer))
        {
            this.isDragging = false;
        }

        return true;
    },

    pointerLeave: function(pointer)
    {
        this.isDown = false;
        this.isDragging = false;

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

    _boardcastAgent: function(set, boardcastObj, isFinal = true)
    {
        for(var obj of set)
        {
            if(obj.agent.focusList.has(boardcastObj.target))
            {
                if(boardcastObj.isDamage === true)
                {
                    if(isFinal === true)
                    {
                        obj.agent.onFocusReceiveDamageFinal(boardcastObj);
                    }
                    else
                    {
                        obj.agent.onFocusReceiveDamage(boardcastObj);
                    }
                }
                else
                {
                    if(isFinal === true)
                    {
                        obj.agent.onFocusReceiveHealFinal(boardcastObj);
                    }
                    else
                    {
                        obj.agent.onFocusReceiveHeal(boardcastObj);
                    }
                }
            }
        }
    },

    boardcastDamage: function(damage, isFinal = true)
    {
        damage.isDamage = true;
        this._boardcastAgent(this.player, damage, isFinal);   
        this._boardcastAgent(this.enemy, damage, isFinal);   
    },

    boardcastHeal: function(heal, isFinal = true)
    {
        heal.isDamage = false;
        this._boardcastAgent(this.player, heal, isFinal);   
        this._boardcastAgent(this.enemy, heal, isFinal);  
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
        this.body.update(dt);

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
    // If anything some object with buff ability (e.g. fireball can fire sth up) hits has method receiveBuff(),
    // receiveBuff() will be called and the mob will be buffed.
    // receiveBuff() should be the final step of being buffed, and if the mob resists some buff this should not be called.
    // e.g. in some inherited classes use:
    //                                       if(...){ nothing happens; } else { super.receiveBuff() }.
    receiveBuff: function({
        source = undefined, 
        buff = undefined,
        popUp = true
    } = {})
    {
        if(buff != undefined)
        {
            // console.log("[" + this.name + "] : Received buff <" + buff.name + "> from <" + source.name, "> !");

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

    // Same as receiveBuff(),
    // this method will be used to receive damage from any object.
    // this method will calculate damage reducement *only* based on mob's resist stats,
    // So if you have any other damage calculation processes (e.g. fire resist necklace / -3 fire dmg), 
    // do it first and then call super.receiveDamage().
    
    // This method will also popup a text with the final amount of damage, 
    // with corresponding color defined in tables.js (var damageColor).
    // this action could be disabled by setting popUp = false.
    receiveDamage: function({
        source = undefined, 
        damage = {},
        isCrit = false,
        spell = undefined,
        popUp = true
    } = {})
    {
        var finalDmg = {};
        var dmgTotal = 0;

        // Let buffs and agents know what is happening
        var damageObj = {
            source: source,
            target: this,
            damage: damage,
            isCrit: isCrit,
            spell: spell,
        };

        this._callBuffAndAgents('onReceiveDamage', damageObj);
        source._callBuffAndAgents('onDealDamage', damageObj);
        game.units.boardcastDamage(damageObj, false);

        // Do the calculation
        for(var dmgType in damage)
        {
            // damage% = 0.9659 ^ resist
            // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
            // which will reach 50% damage reducement at 20 points.
            finalDmg[dmgType] = Math.ceil(damage[dmgType] * (Math.pow(0.9659, this.data.battleStats.resist[dmgType])));

            // Show popUp texts
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

        // Let buffs and agents know what is happening
        damageObj.damage = finalDmg;

        this._callBuffAndAgents('onReceiveDamageFinal', damageObj);
        source._callBuffAndAgents('onDealDamageFinal', damageObj);
        game.units.boardcastDamage(damageObj, true);

        // Decrese HP and check if I am dead
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

    receiveHeal: function({
        source = undefined,
        heal = 0,
        isCrit = false,
        spell = undefined,
        popUp = true,
    } = {})
    {
        // Package the healing in to an object so that buffs and agents can
        // modify them.
        var healObject = {real: heal, over: 0};

        // Let buffs and agents know what is happening
        var healObj = {
            source: source,
            target: this,
            heal: healObject,
            isCrit: isCrit,
            spell: spell,
        };

        this._callBuffAndAgents('onReceiveHeal', healObj);
        source._callBuffAndAgents('onDealHeal', healObj);
        game.units.boardcastHeal(healObj, false);

        // Do the calculation
        // _finalHeal: total amount of healing (real + over)
        var _finalHeal = heal * 1.0; // Maybe something like heal resist etc.
        var finalHeal = {real: _finalHeal, over: 0};

        // calculate overHealing using current HP and max HP.
        finalHeal.real = Math.min(this.data.maxHealth - this.data.currentHealth, _finalHeal);
        finalHeal.over = _finalHeal - finalHeal.real;

        // Let buffs and agents know what is happening
        healObj.heal = finalHeal;

        this._callBuffAndAgents('onReceiveHeal', healObj);
        source._callBuffAndAgents('onDealHeal', healObj);
        game.units.boardcastHeal(healObj, true);

        // Increase the HP.
        this.data.currentHealth += finalHeal.real;

        // Show popUp text with overhealing hint
        if(popUp == true && _finalHeal > 0)
        {
            var popUpPos = this.getRenderPos(0.5, 0.0);
            if(finalHeal.over > 0)
            {
                game.UI.popupMgr.addText({
                    text: finalHeal.real.toString() + "(" + finalHeal.over.toString() + ")" + "蛤蛤蛤",
                    color: game.data.healColor,
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
            }
            else
            {
                game.UI.popupMgr.addText({
                    text: finalHeal.real.toString(),
                    color: game.data.healColor,
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
            }
        }

        game.data.monitor.addHeal(finalHeal.real, finalHeal.over, source, this, isCrit, spell);
    },

    die: function({
        source = undefined, 
        damage = {},
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

    // Function used to tell buffs and agents what was going on
    // when damage and heal happens. They can modify them.
    _callBuffAndAgents: function(method, args)
    {
        var flag = false;

        for(let buff of this.data.buffList.values())
        {
            flag = flag | buff[method](args);
        }
        flag = flag | this.agent[method](args);

        return flag;
    },

    onDeath: function({ source, damage, isCrit, spell } = {})
    {
        return true;
    },
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
        settings.health = 12000;

        settings.weaponLeft = new game.weapon.TestHomingStaff
        ({
            baseAttackSpeed: game.helper.getRandomFloat(0.3, 0.5),
            activeRange: game.helper.getRandomInt(30, 60),
            power: 30,
            targetCount: 1,
        });

        settings.agent = game.MobAgent.TauntBased;

        this._super(game.Mobs.base, 'init', [x, y, settings]);

        //Animations
        this.renderable.addAnimation("idle", [0]);
        this.renderable.addAnimation("move", [0, 1, 2, 3, 4, 5, 6, 7]);
        
        if(Math.random() < 0)
        {
            this.receiveBuff({source: this, buff: new Fired({time: 5.0})});
        }
    },

    updateMob: function(dt)
    {
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

//For Fun(x
game.Mobs.TestBoss = game.Mobs.base.extend(
{
    init: function(x, y, settings)
    {
        settings.health = 160000;

        settings.weaponLeft = new game.weapon.TestBossStaff
        ({
            baseAttackSpeed: game.helper.getRandomFloat(2, 3),
            activeRange: game.helper.getRandomInt(100, 500),
            power: 600,
            targetCount: 1,
        });

        settings.agent = game.MobAgent.TauntBased;

        this._super(game.Mobs.base, 'init', [x, y, settings]);
        
        //Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4, 5, 6, 7]);
        this.renderable.addAnimation("move", [0, 1, 2, 3, 4, 5, 6, 7]);
    },

    updateMob: function(dt)
    {
        // move the mob a little bit to left
        // this.body.vel.x = this.data.getMovingSpeed() * Math.sin(me.timer.getTime() * 0.001) * me.timer.tick;
        this.body.update(dt);

        // if(this.doAttack(dt) === true)
        // {
        //     if(typeof (targets = this.data.currentWeapon.grabTargets(this)) !== "undefined")
        //     {
        //         for(var target of targets.values())
        //         {
        //             if(this.data.currentWeapon.isInRange(this, target))
        //             {
        //                 this.data.currentWeapon.attack(this, target);
        //             }
        //         }
        //     }
        // }

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

    onFocusReceiveDamage: function({ source, target, damage, isCrit, spell } = {}) { return false; },
    onFocusReceiveDamageFinal: function({ source, target, damage, isCrit, spell } = {}) { return false; },

    onFocusReceiveHeal: function({ source, target, heal, isCrit, spell } = {}) { return false; },
    onFocusReceiveHealFinal: function({ source, target, heal, isCrit, spell } = {}) { return false; },

    onDeath: function({ source, damage, isCrit, spell } = {}) { return false; },
});

game.MobAgent.TauntBased = game.MobAgent.base.extend
({
    init(mob, settings)
    {
        this._super(game.MobAgent.base, 'init', [mob, settings]);

        this.tauntList = {};

        this.targetMob = undefined;

        // idleCount will count down from idleFrame if player is in idle (-1 / frame) to smooth the animation.
        // Only if idleCount = 0, the player will be "idle".
        // idleFrame is seperated for targeting Mob (which may move = need more smooth)
        // and targeting a static position (don't move and need high precision)
        this.idleFrameMob = 10;
        this.idleFramePos = 0;
        this.idleCount = 0;
        this.speedFriction = 0.9;
    },

    updateMob(mob, dt)
    {
        // borrowed from playerAgent
        this.footPos = mob.getRenderPos(0.5, 0.5);

        this.updateTaunt(mob);
        
        // We have already checked if targetMob alive in updateTaunt()
        // as that function checks every one in this.focusList.
        if(this.targetMob)
        {
            // we need move to goin the range of our current weapon
            if(mob.data.currentWeapon.isInRange(mob, this.targetMob) == false)
            {
                mob.body.vel = this.targetMob.getRenderPos(0.5, 0.5).clone().sub(this.footPos).normalize().scale(mob.data.getMovingSpeed() * me.timer.tick);

                this.isMoving = true;

                // Reset the anim counter
                this.idleCount = this.idleFrameMob;
            }
            // and then we don't move anymore.
            else
            {
                this.isMoving = false;
            }
        }
        else
        {
            // We lose the target.
            this.targetMob = undefined;
            this.isMoving = false;
        }

        if(this.isMoving === true)
        {
            // Fix our face direction when moving
            if(mob.body.vel.x < 0)
            {
                mob.renderable.flipX(true);
            }
            else
            {
                mob.renderable.flipX(false);
            }

            if(!mob.renderable.isCurrentAnimation("move"))
            {
                mob.renderable.setCurrentAnimation("move");
            }
        }
        else
        {
            // Count the frames
            if(this.idleCount > 0)
            {
                this.idleCount --;

                // Also smooth the speed
                mob.body.vel.scale(this.speedFriction);
            }
            else
            {
                mob.body.vel.set(0, 0);

                if(!mob.renderable.isCurrentAnimation("idle"))
                {
                    mob.renderable.setCurrentAnimation("idle");
                }
            }
        }

        // Attack !
        if(mob.doAttack(dt) === true)
        {
            if(typeof this.targetMob !== "undefined")
            {
                if(mob.data.currentWeapon.isInRange(mob, this.targetMob))
                {
                    mob.data.currentWeapon.attack(mob, this.targetMob);
                }
            }
        }
    },

    updateTaunt(mob)
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
            this.targetMob = nextTarget;

            // TODO: popUp a "!" and a red line for taunt focus
            var pPos = mob.getRenderPos(0.5, 0.0);
            game.UI.popupMgr.addText({
                text: "!",
                color: "#ff0000",
                posX: pPos.x,
                posY: pPos.y,
                velX: 64,
            });
        }
        else if (typeof nextTarget === "undefined")
        {
            // TODO: popUp a "?" as the mob losted its target
            this.targetMob = undefined;
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

    // Test if we can modify the result here !
    // Yes we CAN ! (uncomment this and mob using this agent will deal no damage)
    // onDealDamage({ target, damage, isCrit, spell } = {}) 
    // {
    //     for(var dmg in damage)
    //     {
    //         damage[dmg] = 0;
    //     } 
    //     return true; 
    // },

    onReceiveDamageFinal({ source, damage, isCrit, spell } = {}) 
    {
        // Add the damage source in to our focus list,
        if(!this.focusList.has(source))
        {
            this.focusList.add(source);
            this.tauntList[source.data.ID] = {taunt: 0};
        }

        var damageTotal = 0;
        for(dmg in damage)
        {
            damageTotal += damage[dmg];
        }

        // and create the taunt of that target based on damage
        this.tauntList[source.data.ID].taunt += damageTotal * source.data.tauntMul;

        // We do not change the values
        return false;
    },

    onFocusReceiveHealFinal({ source, target, heal, isCrit, spell } = {}) 
    {
        // Add the healing source in to our focus list,
        if(!this.focusList.has(source))
        {
            this.focusList.add(source);
            this.tauntList[source.data.ID] = {taunt: 0};
        }

        // and create the taunt of that target based on healing
        this.tauntList[source.data.ID].taunt += (heal.real + heal.over) * source.data.tauntMul * game.data.healTaunt;
    },
})
