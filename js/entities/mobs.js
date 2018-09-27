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
            var playerCount = 0;
            for(let player of this.player)
            {
                if(game.Mobs.checkAlive(player))
                {
                    var pt = player.getRenderPos(0.5, 0.5).clone();
                    var frame = game.UI.unitFrameSlots.slots[playerCount];

                    // TODO: use box intersection instead of containsPoint
                    if(this.selectingRect.containsPoint(pt.x - minX, pt.y - minY))
                    {
                        player.data.inControl = true;
                    }
                    else if(this.selectingRect.containsPoint(frame.pos.x - minX, frame.pos.y - minY))
                    {
                        player.data.inControl = true;
                    }
                    else
                    {
                        player.data.inControl = false;
                    }
                }
                playerCount++;
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

            console.log("Drag start");

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
                if(player.data.inControl == true)
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

            var playerSparse = game.data.playerSparse + game.data.playerSparseInc * this.selectedPlayerCount;

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
                if(player.data.inControl == true)
                {
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

    _getUnitList: function(targetSet, sortMethod, availableTest, containsDead = false)
    {
        var result = [];

        for(var unit of targetSet)
        {
            // TODO: how to do with raise skills ?
            if((containsDead || game.Mobs.checkAlive(unit)) && availableTest(unit) === true)
            {
                result.push(unit);
            }
        }

        result.sort(sortMethod);
        return result;
    },

    // Get a list of units, e.g. attack target list etc.
    // You will get a list that:
    // * The list was sorted using sortMethod,
    // * The list will contain units only if they have passed availableTest. (availableTest(unit) returns true)
    getPlayerList: function(sortMethod, availableTest, containsDead = false)
    {
        sortMethod = sortMethod || function(a, b) {return 0;};
        availableTest = availableTest || function(a) {return true;};

        return this._getUnitList(this.player, sortMethod, availableTest, containsDead);
    },

    getPlayerListWithDead: function(sortMethod, availableTest)
    {
        sortMethod = sortMethod || function(a, b) {return 0;};
        availableTest = availableTest || function(a) {return true;};

        return this._getUnitList(this.player, sortMethod, availableTest, true);
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

    // Shorthand to get k-nearest (as a parameter "count") player around a position using above API.
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

    // Boardcast the method targeted target with args to any listeners of any mobs that focused on the target.
    boardcast: function(method, target, args)
    {
        var flag = false;

        flag = flag | this._boardcast(this.player, method, target, args);
        flag = flag | this._boardcast(this.enemy, method, target, args);

        return flag;
    },

    // The actually boardcast process goes here.
    _boardcast: function(set, method, target, args)
    {
        var flag = false;

        if(target)
        {
            for(var _mob of set)
            {
                for(let obj of _mob.data.listeners)
                {
                    if((obj.enabled == undefined || obj.enabled && obj.enabled == true)
                     && obj.focusList && obj.focusList.has(target))   
                    {
                        flag = flag | obj[method](args);
                    }
                }
            }
        }

        return flag;
    },
});

game.Mobs.UnitManager.sortByHealth = function(a, b)
{
    return a.data.currentHealth - b.data.currentHealth;
};

game.Mobs.UnitManager.sortByHealthPercentage = function(a, b)
{
    return ((a.data.currentHealth / a.data.maxHealth) - 0.4 * a.data.healPriority) - ((b.data.currentHealth / b.data.maxHealth) - 0.4 * a.data.healPriority);

};

/**Base class for Mobs.
 * 
 * It is a combination of:
 * 
 * - A mob data backend object
 *      Stores the backend data used by the mob, anything that does not shows on the screen.
 *      Status of the mob (health, str, dex, int, ...), buffs, equipments, ...
 *      It has a list holding all "MobListener"s. 
 * 
 *      a mobListener is anything that needs recieve events on something happened to the mob.
 *      e.g. dealDamage, receiveDamage, dealHeal, Death, etc.
 *      a mobListener could also change the results of those events, 
 *      e.g. let all fire damage become 0 when the mob was damaged,
 *      by change the event parameter itself directly.
 *      
 *      equipments, buffs, agents (handle taunt) and mob itself (different class / job specification) are all mobListeners.
 *      Specially, although the mob itself "is" a mobListener, it doesn't extends mobListener class.
 *      Instead, you can write functions in mobs, with the same name as mobListener, receiving same arguments,
 *      so the function can be called, and that function will be called when it should be.
 *      
 * - A mob agent
 *      Mob agent is a "AI" agent that controlles the mob's action, including movement, attack target, etc.
 *      Player character were also controlled by some player agent, which could receive pointer events.
 *      In fact, player agents receive pointer event from game.Mobs.UnitManager (game.units).
 *
 * - A MelonJS Entity
 *      A mob is a MelonJS entity. So it can be rendered on the screen, check collisions with others, be updated every frame.
 * 
 * The mob class combines several concepts (data backend, agent, ...), builds up a mob, providing interfaces,
 * and do the jobs with MelonJS engine, in order to show itself to screen and check collisions.
 * 
 * If there're anything that a data backend was enough, do it in the data backend instead of the mob itself.
 */
game.Mobs.base = game.Moveable.extend(
{
    init: function(x, y, settings) 
    {
        this._super(game.Moveable, 'init', [x, y, settings]);

        // Initialize the backend data.
        this.data = settings.backendData || new game.dataBackend.Mob(settings);
        
        // Check if this is a player and set proper body collision types.
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

        // Initialize an agent
        if(settings.agent)
        {
            this.agent = new settings.agent(this, settings);
        }
        else
        {
            this.agent = new game.MobAgent.base(this, settings);
        }

        // and add it as a listener to backend.
        this.data.addListener(this.agent);

        // Timer counter for attack (attackSpeed countdown)
        this.attackCounter = 0;

        // Add a test HP bar for it
        this.HPBar = me.game.world.addChild(new game.Utils.TestHPBar(0, -10, this));

        // Mob itself is also a listener.
        this.data.addListener(this);
    },

    updateMoveable: function(dt)
    {
        if(this.renderable.isCurrentAnimation("move") == true)
        {
            this.data.isMoving = true;
        }
        else
        {
            this.data.isMoving = false;
        }

        // Tell data backend to update our data.
        // This does almost all the things with our backend data (status calculation, update listeners, etc.)
        this.data.updateMobBackend(this, dt);

        me.collision.check(this);
        this.agent.updateMob(this, dt);
        this.updateMob(dt);
        this.body.update(dt);

        // Update all buffes
        // Since we cannot access draw() so we call onRender() here (end of update).
        // TODO: uncomment this and move it to proper place, this.draw().
        // and change buff to listeners.
        // for (let buff of this.data.buffList.values())
        // {
        //     buff.onRender(this);
        // }
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

        if(this.attackCounter > (this.data.getAttackSpeed()))
        {
            // This will cause mutiple attacks if attackspeed increases.
            // this.attackCounter -= this.data.getAttackSpeed();
            
            this.attackCounter = 0;
            return true;
        }

        return false;
    },
    
    // Will be called when a buff is going to affect the mob.
    // If anything some object with buff ability (e.g. fireball can fire sth up) hits has method receiveBuff(),
    // receiveBuff() will be called and the mob will be buffed.
    // receiveBuff() should be the final step of being buffed, and if the mob resists some buff this should not be called.
    // e.g. in some inherited classes use:
    //                                       if(...){ nothing happens; } else { super.receiveBuff() }.

    // N.B. recieveBuff should also work like recieveDamage(), that triggers listener events and decide
    // if we should keep the buff or ignore it.
    // But I have not write it.

    // TODO: add onReceiveBuff & onFocusReceiveBuff for game.MobListeners.
    // ...Maybe we should let them auto trigger onFocusXXX for any events ?
    receiveBuff: function({
        source = undefined, 
        buff = undefined,
        popUp = true
    } = {})
    {
        if(game.Mobs.checkAlive(this) == false)
        {
            return false;
        }

        if(buff != undefined)
        {
            // Set source if not
            if(typeof buff.source === "undefined")
            {
                buff.source = source;
            }

            // Call backend to add the buff.
            // Actually, for the backend, a buff is same as a plain listener (this.data.addListener(listener)).
            this.data.addBuff(buff);

            // Initial popUp
            if(popUp == true)
            {
                buff.popUp(this);
            }
        }
    },

    // Same as receiveBuff(),
    // this method will be used to receive damage from any object.
    // this method will also trigger events for listeners, and let them modify the damage.
    // e.g. mob equiped fire resist necklace -> it's event will be triggered ...
    // (actually for fire resist necklace, change parameters in onStatsChange() is convinent, though. lol.)
    
    // This method will also popup a text with the final amount of damage, 
    // with corresponding color defined in gama.data.damageColor.
    // this action could be disabled by setting popUp = false.

    /**
     * Params of damageInfo (default value)
     * source:          damage source
     * damage ({}):     actual damage. e.g. {fire: 165, ice: 100, thunder: 600}
     * isCrit (false):  is this damage crits ? It will be calculated automatically if it is false.
     * isAvoid (false): Same as above.
     * spell:           the spell used at this attack
     * popUp (true):    Should this damage popup a text ?
     */
    receiveDamage: function(damageInfo)
    {
        if(game.Mobs.checkAlive(this) == false)
        {
            return false;
        }

        damageInfo.target = this;
        damageInfo.damage = damageInfo.damage || {};
        damageInfo.popUp = damageInfo.popUp || true;
        damageInfo.isCrit = damageInfo.isCrit || false;
        damageInfo.isAvoid = damageInfo.isAvoid || false;

        // The actual damage calculate and event trigger moved into backend
        // If mob dead finally, this.data.alive will become false
        this.data.receiveDamage(damageInfo);

        // It does not hit !
        if(damageInfo.isAvoid)
        {
            if(damageInfo.popUp == true)
            {
                var popUpPos = this.getRenderPos(0.5, 0.0);
                game.UI.popupMgr.addText({
                    text: "MISS",
                    color: game.data.damageColor.miss,
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
            }

            return false;
        }

        // Mob itself only do rendering popUp texts
        for(var dmgType in damageInfo.damage)
        {
            if(damageInfo.popUp == true && damageInfo.damage[dmgType] > 0)
            {
                var popUpPos = this.getRenderPos(0.5, 0.0);
                game.UI.popupMgr.addText({
                    text: damageInfo.damage[dmgType].toString() + (damageInfo.isCrit ? " !" : ""),
                    color: game.data.damageColor[dmgType],
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
                
                // popUp texts on unit frames
                // fade from the edge of currentHealth to the left
                if(this.data.isPlayer)
                {
                    for(var i = 0; i < game.units.getPlayerListWithDead().length; i++)
                    {
                        if(this === game.units.getPlayerListWithDead()[i])
                        {
                            popUpPos = game.UI.unitFrameSlots.slots[i].pos;
                            game.UI.popupMgr.addText({
                                text: "-" + damageInfo.damage[dmgType].toString(),
                                time: 0.75,
                                color: game.data.damageColor[dmgType],
                                posX: popUpPos.x + 126,// * (this.data.currentHealth / this.data.maxHealth), // Maybe this is better ? (or cannot see if sudden death)
                                posY: popUpPos.y - 10,
                                velX: -256,
                                velY: 0.0,
                                accX: 384,
                                accY: 0.0,
                            });
                        }
                    }
                }
            }
        }

        // However, it should also check if self dead here
        // since it should remove the renderable (actual object) from the scene and mob list
        // Check if I am alive
        if(this.data.alive == false)
        {
            this.die(damageInfo.source, damageInfo.damage);
        }

        return true;
    },

    // Receive healing, same as recieve damage.

    /**
     * Params of healInfo (default value)
     * source:          heal source
     * heal (0):        actual heal, a number.
     * isCrit (false):  is this heal crits ? It will be calculated automatically if it is false.
     * spell:           the spell used at this attack
     * popUp (true):    Should this heal popup a text ?
     */
    receiveHeal: function(healInfo)
    {
        if(game.Mobs.checkAlive(this) == false)
        {
            return false;
        }

        // Same as above
        healInfo.heal = {total: healInfo.heal, real: healInfo.heal, over: 0};
        healInfo.target = this;
        healInfo.heal = healInfo.heal || 0;
        healInfo.popUp = healInfo.popUp || true;
        healInfo.isCrit = healInfo.isCrit || false;

        this.data.receiveHeal(healInfo);

        // Show popUp text with overhealing hint
        if(healInfo.popUp == true && healInfo.heal.total > 0)
        {
            var popUpPos = this.getRenderPos(0.5, 0.0);
            if(healInfo.heal.over > 0)
            {
                game.UI.popupMgr.addText({
                    text: healInfo.heal.real.toString() + (healInfo.isCrit ? " !" : "") + " <" + healInfo.heal.over.toString() + ">",
                    color: game.data.damageColor.heal,
                    velX: 64,
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
            }
            else
            {
                game.UI.popupMgr.addText({
                    text: healInfo.heal.real.toString() + (healInfo.isCrit ? " !" : ""),
                    color: game.data.damageColor.heal,
                    velX: 64,
                    posX: popUpPos.x,
                    posY: popUpPos.y,
                });
            }
            // popUp texts on unit frames
            // fade from left to the the edge of currentHealth
            if(this.data.isPlayer && healInfo.heal.real > 0){
                for(var i = 0; i < game.units.getPlayerListWithDead().length; i++)
                {
                    if(this === game.units.getPlayerListWithDead()[i])
                    {
                        popUpPos = game.UI.unitFrameSlots.slots[i].pos;
                        game.UI.popupMgr.addText({
                            text: "+" + healInfo.heal.real.toString(),
                            time: 0.75,
                            color: game.data.damageColor.heal,
                            posX: popUpPos.x + 30,
                            posY: popUpPos.y + 10,
                            velX: 256,
                            velY: 0.0,
                            accX: -384,
                            accY: 0.0,
                        });
                    }
                }
            }
        }
    },

    die: function({
        source = undefined, 
        damage = {},
    } = {})
    {
        this.data.die({source: source, damage: damage});

        me.game.world.removeChild(this.HPBar);

        this.body.collisionType = me.collision.types.NO_OBJECT;

        if(this.data.isPlayer === true)
        {
            // Don't remove it, keep it dead
            // game.units.removePlayer(this);
        }
        else
        {
            game.units.removeEnemy(this);
        }
        me.game.world.removeChild(this);
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
        settings.health = 200;

        settings.weaponLeft = new game.Weapon.TestHomingStaff
        ({
            // baseAttackSpeed: game.helper.getRandomFloat(0.15, 0.2),
            baseAttackSpeed: game.helper.getRandomFloat(0.3, 0.5),
            activeRange: game.helper.getRandomInt(30, 60),
            power: 5,
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
        settings.health = 5200;

        settings.weaponLeft = new game.Weapon.TestBossStaff
        ({
            baseAttackSpeed: 1.2,
            activeRange: 200,
            power: 45,
            targetCount: 2,
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

    onStatCalculation: function(mob)
    {
        // Horrible !!
        mob.data.battleStats.crit = 0;
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

game.MobAgent.base = game.MobListener.extend
({
    init(mob, settings) 
    {
        this._super(game.MobListener, 'init', [settings])
    },
    updateMob(mob, dt) {},
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
            // Taunt reduces over time
            this.tauntList[tmpTargetMob.data.ID].taunt *= 0.99;

            // Remove the mob if it is dead or it has no taunt
            if(!game.Mobs.checkAlive(tmpTargetMob) || this.tauntList[tmpTargetMob.data.ID].taunt <= 1 /*a small enough value*/ )
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
            if(this.targetMob)
            {
                this.targetMob.data.beingAttack -= 1;
            }
            this.targetMob = nextTarget;
            nextTarget.data.beingAttack += 1;

            // TODO: popUp a "!" and a red line for taunt focus
            var pPos = mob.getRenderPos(0.5, 0.0);
            game.UI.popupMgr.addText({
                text: "!",
                color: "#ff0000",
                posX: pPos.x,
                posY: pPos.y,
                velX: 0,
            });
        }
        else if (typeof nextTarget === "undefined")
        {
            // TODO: popUp a "?" as the mob losted its target
            if(typeof this.targetMob !== "undefined")
            {
                var pPos = mob.getRenderPos(0.5, 0.0);
                game.UI.popupMgr.addText({
                    text: "?",
                    color: "#ffff00",
                    posX: pPos.x,
                    posY: pPos.y,
                    velX: 0,
                });
            }

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

    onDeath()
    {
        if(this.targetMob)
        {
            this.targetMob.data.beingAttack -= 1;
        }
    },
})
