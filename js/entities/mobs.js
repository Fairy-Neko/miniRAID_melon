game.Mobs = game.Mobs || {};

game.Moveable = me.Entity.extend
({
    init: function(x, y, settings) 
    {
        this._super(me.Entity, 'init', [x, y, settings]);

        // Center position helper
        this.renderAnchorPos = new me.Vector2d(0, 0);
        this.renderAnchorPos.x = this.pos.x + this.anchorPoint.x * this.body.width + this.renderable.pos.x;
        this.renderAnchorPos.y = this.pos.y + this.anchorPoint.y * this.body.height + this.renderable.pos.y;

        // Body center position helper
        this.bodyAnchorPos = new me.Vector2d(0, 0);
        this.bodyAnchorPos.x = this.pos.x + this.anchorPoint.x * this.body.width;
        this.bodyAnchorPos.y = this.pos.y + this.anchorPoint.y * this.body.height;
    },

    update: function(dt)
    {
        this.renderAnchorPos.x = this.pos.x + this.anchorPoint.x * this.body.width + this.renderable.pos.x;
        this.renderAnchorPos.y = this.pos.y + this.anchorPoint.y * this.body.height + this.renderable.pos.y;

        this.bodyAnchorPos.x = this.pos.x + this.anchorPoint.x * this.body.width;
        this.bodyAnchorPos.y = this.pos.y + this.anchorPoint.y * this.body.height;

        this.updateMoveable(dt);
        
        this._super(me.Entity, 'update', [dt]);
    },

    updateMoveable: function(dt)
    {

    },

    setColliderRelativePos: function(x, y)
    {
        this.renderable.pos.x = -x;
        this.renderable.pos.y = -y;
    },

    getBodyPos(x, y)
    {
        result = new me.Vector2d(0, 0);
        result.x = this.pos.x + x * this.body.width;
        result.y = this.pos.y + y * this.body.height;

        return result;
    },

    getRenderPos(x, y)
    {
        result = new me.Vector2d(0, 0);
        result.x = this.renderAnchorPos.x - (this.renderable.anchorPoint.x - x) * this.renderable.width;
        result.y = this.renderAnchorPos.y - (this.renderable.anchorPoint.y - y) * this.renderable.height;

        return result;
    },
});

game.Mobs.UnitManager = me.Container.extend
({
    init: function()
    {
        this._super(me.Container, 'init');

        this.isPersistent = true;

        this.name = "Unit Manager";

        this.alwaysUpdate = true;

        this.playerContainer = new game.Mobs.subContainer('playerContainer');
        this.enemyContainer = new game.Mobs.subContainer('enemyContainer');

        this.addChild(this.playerContainer);
        this.addChild(this.enemyContainer);

        this.playerCount = 0;
        this.enemyCount = 0;
        this.totalCount = 0;
    },

    update: function()
    {
        me.input.registerPointerEvent('pointerdown', me.game.viewport, this.pointerDown.bind(this));
    },

    pointerDown: function(pointer)
    {
        if(typeof this.origin === "undefined")
        {
            this.origin = new me.Vector2d(0, 0);
        }
        this.origin.set(pointer.gameX, pointer.gameY);

        console.log(this.playerCount);
        for(var i = 0; i < this.playerCount; i++)
        {
            this.playerContainer.getChildAt(i).targetPos = this.origin;
        }
        return true;
    },

    addPlayer: function(player, z)
    {
        z = z || 1;
        this.playerContainer.addChild(player, z);
        this.playerCount ++;
        this.totalCount ++;
    },

    addEnemy: function(enemy, z)
    {
        z = z || 1;
        this.enemyContainer.addChild(enemy, z);

        this.enemyCount ++;
        this.totalCount ++;
    },

    removePlayer: function(player)
    {
        this.playerContainer.removeChild(player);

        this.playerCount --;
        this.totalCount --;
    },

    removeEnemy: function(enemy)
    {
        this.enemyContainer.removeChild(enemy);

        this.enemyCount --;
        this.totalCount --;
    },
});

game.Mobs.subContainer = me.Container.extend
({
    init: function(name)
    {
        this._super(me.Container, 'init');
        this.alwaysUpdate = true;
        this.name = name;
    }
});

game.Mobs.baseMob = game.Moveable.extend(
{
    init: function(x, y, settings) 
    {
        console.log(this);
        console.log(settings);

        this._super(game.Moveable, 'init', [x, y, settings]);

        this.alwaysUpdate = true;
        this.body.gravity = 0;

        this.data = settings.backendData || new game.dataBackend.mob(settings);
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
            console.log("[" + this.name + "] : Recieved buff <" + buff.name + "> from <" + source.name, "> !");

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
        popUp = true
    } = {})
    {
        var finalDmg = {};

        for(var dmgType in damage)
        {
            // damage% = 0.9659 ^ resist
            // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
            // which will reach 50% damage reducement at 20 points.
            finalDmg[dmgType] = Math.ceil(damage[dmgType] * (Math.pow(0.9659, this.data.battleStats.resist[dmgType])));
            
            if(popUp == true && finalDmg[dmgType] > 0)
            {
                game.UI.popupMgr.addText({
                    text: finalDmg[dmgType].toString(),
                    color: game.data.damageColor[dmgType],
                    posX: this.pos.x,
                    posY: this.pos.y,
                });
            }
        }
    },
});

// Some mobs (player & enemies)
game.Mobs.TestMob = game.Mobs.baseMob.extend(
{
    init: function(x, y, settings)
    {
        this._super(game.Mobs.baseMob, 'init', [x, y, settings]);
        this.recieveBuff({source: this, buff: new Fired({time: 5.0})});
    },

    updateMob: function(dt)
    {
        // move the mob a little bit to left
        this.body.vel.x = this.data.getMovingSpeed() * Math.sin(me.timer.getTime() * 0.001) * me.timer.tick;
        this.body.update(dt);

        me.collision.check(this);
    },

    onCollision: function(response, other)
    {
        if(other.body.collisionType === game.collisionTypes.AREA_EFFECT)
        {
            return false;
        }
        return true;
    }
});
