game.Mobs = game.Mobs || {};

game.Mobs.baseMob = me.Entity.extend(
{
    init: function(x, y, settings) 
    {
        console.log(this);
        console.log(settings);

        this._super(me.Entity, 'init', [x, y, settings]);

        this.alwaysUpdate = true;
        this.body.gravity = 0;

        this.name = settings.name || "noname";
        this.position = {x: this.body.left, y: this.body.top};

        // health related
        this.maxHealth = settings.health || 100;
        this.currentHealth = this.maxHealth - settings.damage || 0;
    
        // speed related (1.0 means 100% (NOT a value but a ratio))
        this.speed = settings.speed || 1.0;
        this.movingSpeed = settings.movingSpeed || 1.0;
        this.attackSpeed = settings.attackSpeed || 1.0;

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

        // Center position helper
        this.centerPos = new me.Vector2d(0, 0);
        this.centerPos.x = this.pos.x + this.body.width / 2;
        this.centerPos.y = this.pos.y + this.body.width / 2;
    },

    update: function(dt)
    {
        //Update all the buffes
        for (let buff of this.buffList.values())
        {
            buff.onUpdate(this, dt / 1000);
            
            if(buff.isOver == true)
            {
                //this buff is over. delete it from the list.
                this.buffList.delete(buff);
            }
        }

        //calculate Stats
        this.calcStats();
        for (let buff of this.buffList.values())
        {
            buff.onStatCalculation(this);
        }

        this.centerPos.x = this.pos.x + this.body.width / 2;
        this.centerPos.y = this.pos.y + this.body.width / 2;

        this.updateMob(dt);

        // Update all buffes
        // Since we cannot access draw() so we call onRender() here (end of update).
        for (let buff of this.buffList.values())
        {
            buff.onRender(this);
        }

        this._super(me.Entity, 'update', [dt]);
    },

    updateMob: function(dt)
    {

    },

    calcStats: function()
    {
        //Go back to base speed
        this.speed = 1.0;
        this.movingSpeed = 1.0;
        this.attackSpeed = 1.0;
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

            this.buffList.add(buff);

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
            finalDmg[dmgType] = Math.ceil(damage[dmgType] * (Math.pow(0.9659, this.battleStats.resist[dmgType])));
            
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
        this.body.vel.x = this.speed * this.movingSpeed * 3 * Math.sin(me.timer.getTime() * 0.001) * me.timer.tick;
        this.body.update(dt);

        // if(this.position.x > 0 && this.position.x < 1 && this.buffList.size == 0)
        // {
        //     this.recieveBuff({source: this, buff: new Fired({time: 5.0})});
        // }

        // if(this.position.x < -2 && this.buffList.size <= 1)
        // {
        //     this.recieveBuff({source: this, buff: new IceSlowed()});
        // }
    },

    onCollision: function(response, other)
    {
        return false;
    }
});
