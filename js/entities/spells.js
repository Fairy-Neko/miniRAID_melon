game.Spell = game.Spell || {};

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

game.Spell.base = game.Moveable.extend
({
    init:function (x, y, source, target, settings) 
    {
        this._super(game.Moveable, 'init', [x, y, settings]);

        this.alwaysUpdate = true;
        this.name = settings.name;

        this.source = source;
        this.target = target;

        // Not sure which collision type it should be
        // this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;
    },

    updateMoveable: function (dt) 
    {
        // Check is target alive
        // If target dead, set it to undefined
        if(game.Mobs.checkAlive(this.target) !== true)
        {
            this.target = undefined;
        }

        // Cannot see me so die
        if(this.inViewport === false)
        {
            me.game.world.removeChild(this);
        }

        me.collision.check(this);
        this.updateSpell(dt);
    },

    updateSpell: function(dt) {},

    onCollision: function(response, other)
    {
        // Don't collide to any objects
        return false;
    },
});

game.Spell.Projectile = game.Spell.base.extend
({
    init:function (x, y, source, target, settings) 
    {
        settings.name = settings.name || 'Projectile';

        this._super(game.Spell.base, 'init', [x, y, source, target, settings]);

        this.isTargetPlayer = settings.isTargetPlayer || false;
        this.isTargetEnemy = settings.isTargetEnemy || false;

        this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;

        if(this.isTargetPlayer && (!this.isTargetEnemy))
        {
            this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT | me.collision.types.WORLD_SHAPE);
        }
        else if((!this.isTargetPlayer) && this.isTargetEnemy)
        {
            this.body.setCollisionMask(me.collision.types.ENEMY_OBJECT | me.collision.types.WORLD_SHAPE);
        }
        else
        {
            this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT | me.collision.types.ENEMY_OBJECT | me.collision.types.WORLD_SHAPE);
        }
    },

    updateSpell: function (dt) 
    {
        this.updateProjectile(dt);
        this.body.update(dt);
    },

    updateProjectile: function(dt) {},

    onMobCollision: function(other) {},
    onWorldCollision: function(other) 
    {
        this.destroy(other);
    },

    destroy: function(other) 
    {
        // make sure it cannot be collected "again"
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);

        me.game.world.removeChild(this);
    },

    onCollision: function(response, other)
    {
        if(other.body.collisionType === me.collision.types.WORLD_SHAPE)
        {
            this.onWorldCollision(other);
            return false;
        }
        // It is my target! (player or enemy)
        else
        {
            this.onMobCollision(other);
            return false;
        }
    },
});

game.Spell.TestFireball = game.Spell.Projectile.extend
({
    init: function (x, y, source, target, settings) 
    {
        // Do not ask why it is a gold coin (x
        settings.image = "goldcoin";
        settings.width = 16;
        settings.height = 16;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "testFireball";

        this._super(game.Spell.Projectile, 'init', [x, y, source, target, settings]);

        this.power = settings.power || 50;

        this.speed = settings.projectileSpeed || 5;
        this.speedVec = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize().scale(this.speed);
    },

    onMobCollision: function(other)
    {
        if(typeof other.recieveDamage !== "undefined")
        {
            other.recieveDamage({
                source: this.source,
                damage: {
                    fire: game.helper.getRandomInt(this.power * 0.5, this.power * 1.5),
                },
                isCrit: false,
                spell: this,
            });
            this.destroy(other);
        }
    },

    updateProjectile: function(dt)
    {
        this.body.vel.copy(this.speedVec.clone().scale(me.timer.tick));
    }
})

game.Spell.TestHomingIceball = game.Spell.Projectile.extend
({
    init: function (x, y, source, target, settings) 
    {
        // Do not ask why it is a gold coin (x
        settings.image = "crystalcoin";
        settings.width = 16;
        settings.height = 16;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "HomingIceBall";

        this._super(game.Spell.Projectile, 'init', [x, y, source, target, settings]);

        this.power = settings.power || 30;

        this.speed = settings.projectileSpeed || 5;
        this.speedVector = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize();
    },

    onMobCollision: function(other)
    {
        if(typeof other.recieveDamage !== "undefined")
        {
            other.recieveDamage({
                source: this.source,
                damage: {
                    ice: game.helper.getRandomInt(this.power * 0.5, this.power * 1.5),
                },
                isCrit: false,
                spell: this,
            });
            this.destroy(other);
        }
    },

    updateProjectile: function(dt)
    {
        // Homing
        if(this.target)
        {
            this.speedVector = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize();
        }

        this.body.vel.copy(this.speedVector.clone().scale(this.speed * me.timer.tick));
    }
})