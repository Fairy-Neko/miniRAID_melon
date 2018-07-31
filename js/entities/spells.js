game.Spell = game.Spell || {};

game.Moveable = me.Entity.extend
({
    init: function(x, y, settings) 
    {
        this._super(me.Entity, 'init', [x, y, settings]);

        this.body.gravity = 0;

        // Note: the body (collision bound) will not rotate.
        this._mv_useRotation = settings.useRotation || false;
        this._mv_rotation = settings.rotation || 0;
        this._mv_prevRotation = 0;
        this._mv_scale = settings.scale || new me.Vector2d(1, 1);

        if(this._mv_useRotation == true)
        {            
            this._applyRotate();
        }

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

        if(this._mv_useRotation === true)
        {
            this._applyRotate();
        }
    },

    _applyRotate: function()
    {
        this.renderable.currentTransform = new me.Matrix2d().identity();
        this.renderable.currentTransform.rotate(this._mv_rotation);
        this.renderable.currentTransform.scaleV(this._mv_scale);
    },

    setRotation: function(r)
    {
        this._mv_rotation = r;
        this._applyRotate();
    },

    setScale: function(x, y)
    {
        if(this._mv_useRotation == true)
        {
            this._mv_scale.set(x, y);
            this._applyRotate();
        }
        else
        {
            this.renderable.scale(x, y);
        }
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
    init:function (x, y, source, target, settings, useCollider = true) 
    {
        this._super(game.Moveable, 'init', [x, y, settings]);

        this.alwaysUpdate = true;
        this.name = settings.name;

        this.source = source;
        this.target = target;

        this.useCollider = useCollider;

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

        if(this.useCollider == true)
        {
            // me.collision.check(this);
        }
        this.updateSpell(dt);
    },

    updateSpell: function(dt) {},

    destroy: function(other) 
    {
        // make sure it cannot be collected "again"
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);

        if(me.game.world.hasChild(this))
        {
            me.game.world.removeChild(this);
        }
    },

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
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "testFireball";
        if(!settings.image)
        {
        settings.image = "goldcoin";
        settings.width = 16;
        settings.height = 16;
        }

        this._super(game.Spell.Projectile, 'init', [x, y, source, target, settings]);

        this.power = settings.power || 5;

        this.speed = settings.projectileSpeed || 200;
        this.speedVec = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize().scale(this.speed);
    },

    onMobCollision: function(other)
    {
        if(typeof other.receiveDamage !== "undefined")
        {
            other.receiveDamage({
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
        this.body.vel.copy(this.speedVec.clone().scale(dt * 0.001));
    }
})

game.Spell.TestHomingIceball = game.Spell.Projectile.extend
({
    init: function (x, y, source, target, settings) 
    {
        // Do not ask why it is a gold coin (x
        settings.image = settings.image || "crystalcoin";
        settings.width = 16;
        settings.height = 16;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "HomingIceBall";

        this._super(game.Spell.Projectile, 'init', [x, y, source, target, settings]);

        this.power = settings.power || 3;

        this.speed = settings.projectileSpeed || 200;
        this.speedVector = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize();
    },

    onMobCollision: function(other)
    {
        if(typeof other.receiveDamage !== "undefined")
        {
            other.receiveDamage({
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

        this.body.vel.copy(this.speedVector.clone().scale(this.speed * dt * 0.001));
    }
});

game.Spell.TestHealBeam = game.Spell.base.extend
({
    init:function (visualSource, source, target, settings) 
    {
        // We will use the rotation notation in game.Moveable.
        settings.useRotation = true;

        // subVec: source -> target
        var subVec = target.getRenderPos(0.5, 0.5).clone().sub(visualSource.getRenderPos(0.5, 0.5));

        // Calculate the scale and rotation
        var scaleX = subVec.length() / 16.0;
        
        var rotation = new me.Vector2d(1, 0).angle(subVec);
        // Vector2d.angle() uses Math.acos, which only returns an angle between [0, pi].
        // We should check the angle manully:
        if(subVec.y < 0)
        {
            rotation = Math.PI * 2 - rotation;
        }

        settings.image = "tst_HealBeam";
        settings.width = 16;
        settings.height = 16;

        // We want it origined at the left middle of the image.
        // In order to rotate it properly.
        settings.anchorPoint = new me.Vector2d(0, 0.5);
        // settings.rotation = rotation;

        var visualPos = visualSource.getRenderPos(0.5, 0.5);
        this._super(game.Spell.base, 'init', [visualPos.x, visualPos.y, source, target, settings, false]);

        this.setRotation(rotation);
        this.setScale(scaleX, 1);

        // We only use this as a image effect
        // We heal the target directly.
        this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);
        this.body.removeShapeAt(0);

        this.power = settings.power || 10;

        this.visualSource = visualSource;

        // Heal the target!
        if(game.Mobs.checkAlive(target) == true)
        {
            target.receiveHeal({
                source: this.source, 
                heal: game.helper.getRandomInt(this.power * 0.5, this.power * 1.5),
                isCrit: false,
                spell: this,
            });
        }

        this.timer = 500;
    },

    updateSpell: function(dt) 
    {
        this.timer -= dt;
        if(this.timer <= 0)
        {
            this.destroy();
        }

        this.renderable.setOpacity(Math.min(300, this.timer) / 300);

        if(typeof this.target !== "undefined" && game.Mobs.checkAlive(this.visualSource))
        {
            var subVec = this.target.getRenderPos(0.5, 0.5).clone().sub(this.visualSource.getRenderPos(0.5, 0.5));

            var rotation = new me.Vector2d(1, 0).angle(subVec);
            // Vector2d.angle() uses Math.acos, which only returns an angle between [0, pi].
            // We should check the angle manully:
            if(subVec.y < 0)
            {
                rotation = Math.PI * 2 - rotation;
            }

            this.setRotation(rotation);
            this.setScale(subVec.length() / 16, 1);
            this.pos.copy(this.visualSource.pos);
        }
    },

    onCollision: function(response, other)
    {
        // Don't collide to any objects
        return false;
    },
});
