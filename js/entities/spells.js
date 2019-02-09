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

game.Spell.magicalHitSprite = me.Sprite.extend
({
    init: function(x, y, settings)
    {
        settings.image = settings.image || "Hit_64x64px";
        settings.framewidth = settings.framewidth || 64;
        settings.frameheight = settings.frameheight || 64;

        this._super(me.Sprite, 'init', [x, y, settings]);

        this.addAnimation("play", game.helper.genAnimFrames(0, 11), 32);
        this.setCurrentAnimation("play", (function(){
            me.game.world.removeChild(this);
            return false;
        }).bind(this));
    },
});

game.Spell.HealFxSprite = me.Sprite.extend
({
    init: function(x, y, settings)
    {
        settings.image = settings.image || "heal_fx";
        settings.framewidth = settings.framewidth || 32;
        settings.frameheight = settings.frameheight || 32;

        this._super(me.Sprite, 'init', [x, y, settings]);

        this.addAnimation("play", game.helper.genAnimFrames(0, 29), 32);
        this.setCurrentAnimation("play", (function(){
            me.game.world.removeChild(this);
            return false;
        }).bind(this));
    },
});

game.Spell.IcedFxSprite = me.Sprite.extend
({
    init: function(x, y, settings)
    {
        settings.image = settings.image || "iced_fx";
        settings.framewidth = settings.framewidth || 32;
        settings.frameheight = settings.frameheight || 32;

        this._super(me.Sprite, 'init', [x, y, settings]);

        this.addAnimation("play", game.helper.genAnimFrames(0, 29), 32);
        this.setCurrentAnimation("play", (function(){
            me.game.world.removeChild(this);
            return false;
        }).bind(this));
    },
});

game.Spell.dummy = me.Object.extend
({
    init: function(settings)
    {
        this.name = settings.name;
        this.source = settings.source;
        this.flags = settings.flags;
    }
});

/**
 * Spell flags:
 * 
 * isDamage
 * isHeal
 * hasTarget
 * areaEffect
 * overTime (DOT / HOT)
 * 
 */
game.Spell.base = game.Moveable.extend
({
    init:function (x, y, source, target, settings, useCollider = true) 
    {
        this._super(game.Moveable, 'init', [x, y, settings]);

        this.alwaysUpdate = false;
        this.name = settings.name;

        this.source = source;
        this.target = target;

        this.isTargetPlayer = target.data.isPlayer;

        this.flags = {};

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
        if(this.inViewport === false && this.alwaysUpdate === false)
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

        this.onDestroy(other);

        if(me.game.world.hasChild(this))
        {
            me.game.world.removeChild(this);
        }
    },

    onDestroy: function(other)
    {

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
        me.collision.check(this);
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
            settings.image = "coppercoin2";
            settings.width = 16;
            settings.height = 24;
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
        settings.image = settings.image || "crystalcoin2";
        settings.width = settings.width || 16;
        settings.height = settings.height || 24;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = settings.name || "HomingIceBall";

        this._super(game.Spell.Projectile, 'init', [x, y, source, target, settings]);

        this.power = settings.power || 3;

        this.speed = settings.projectileSpeed || 200;
        this.speedVector = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize();

        this.flags.overTime = false;
        this.flags.hasTarget = true;

        if(me.pool.exists("magicalHit") === false)
        {
            me.pool.register("magicalHit", game.Spell.magicalHitSprite, true);
        }
    },

    onMobCollision: function(other)
    {
        if(typeof other.receiveDamage !== "undefined")
        {
            // for fun !
            // random type damage (comment out, no more fun)
            var dmg = {};
            // dmg[game.data.damageTypeArray[game.helper.getRandomInt(0, game.data.damageTypeArray.length)]] = game.helper.getRandomInt(this.power * 0.5, this.power * 1.5);
            dmg.ice = game.helper.getRandomInt(this.power * 0.5, this.power * 1.5);

            other.receiveDamage({
                source: this.source,
                damage: dmg,
                isCrit: false,
                spell: this,
            });
            this.destroy(other);
        }
        if(typeof other.receiveBuff !== "undefined")
        {
            if(this.power > 30){
                other.receiveBuff({
                    source: this.source,
                    buff: new game.Buff.IceSpikeDebuff({time: 1.5}),
                    popUp: true,
                })
            }
            else{
                other.receiveBuff({
                    source: this.source,
                    buff: new game.Buff.IceSlowed({time: 1.0}),
                    popUp: false, //Annoying!! (x
                })
            }
        }
    },

    onDestroy: function(other)
    {
        // me.game.world.addChild(me.pool.pull("magicalHit", this.renderAnchorPos.x, this.renderAnchorPos.y, {}));
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
        if(me.pool.exists("healFx") === false)
        {
            me.pool.register("healFx", game.Spell.HealFxSprite, true);
        }

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

        this.name = settings.name || "Test heal stuff: attack";

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

            me.game.world.addChild(me.pool.pull("healFx", target.renderAnchorPos.x, target.renderAnchorPos.y, {}));
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
            this.pos.copy(this.visualSource.getRenderPos(0.5, 0.5));
        }
    },

    onCollision: function(response, other)
    {
        // Don't collide to any objects
        return false;
    },
});

game.Spell.TestStarBomb = game.Spell.base.extend
({
    init: function(x, y, source, target, settings)
    {
        settings.image = settings.image || "Star_fall_64x64px";
        settings.width = 512;
        settings.height = 512;
        settings.framewidth = 64;
        settings.frameheight = 64;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "Star bomb";
        settings.startHeight = settings.startHeight || 200.0;
        settings.shapes = [new me.Rect(0, 0, 10, 10)];

        this._super(game.Spell.base, 'init', [x, y - settings.height, source, target, settings, false]);

        // update it when it invisiable
        this.alwaysUpdate = true;

        this.startHeight = settings.startHeight;
        this.currentHeight = this.startHeight;
        this.fallTime = settings.fallTime || 3.0;
        this.chaseTarget = settings.chaseTarget || true;
        this.groundPos = target.getRenderPos(0.5, 0.5);

        this.power = settings.power || 200;
        this.type = settings.type || "stand";

        this.renderable.addAnimation("falling", game.helper.genAnimFrames(0, 59), 16);
        this.renderable.setCurrentAnimation("falling");

        this.renderable.anchorPoint.set(0.5, 0.5);
        this.pos.copy(this.groundPos.clone().add(new me.Vector2d(0, -this.currentHeight)));

        // Create a range hint
        this.rangeHint = new me.Sprite(this.groundPos.x, this.groundPos.y, {
            image: "StarBombRange",
        });
        me.game.world.addChild(this.rangeHint);
    },

    updateSpell: function(dt)
    {
        if(this.target && this.chaseTarget)
        {
            this.groundPos = this.target.getRenderPos(0.5, 0.5);
        }

        this.currentHeight -= dt * 0.001 * (this.startHeight / this.fallTime);

        if(this.currentHeight < 0)
        {
            this.currentHeight = 0;

            // make the attack
            // grab targets
            var gPos = this.groundPos;

            var AoEList = game.units.getUnitList({
                availableTest: function(a)
                {
                    return (a.getRenderPos(0.5, 0.5).distance(gPos) < 64);
                },
                isPlayer: this.isTargetPlayer,
            });

            if(this.type === "stand"){
                for(var i = 0; i < AoEList.length; i++)
                {
                    AoEList[i].receiveDamage({
                        source: this.source,
                        damage: {wind: this.power / AoEList.length},
                        popUp: true,
                    });
                }
            }
            else
            {
                for(var i = 0; i < AoEList.length; i++)
                {
                    AoEList[i].receiveDamage({
                        source: this.source,
                        damage: {wind: this.power},
                        popUp: true,
                    });
                }
            }
            this.destroy();
            return;
        }

        this.pos.copy(this.groundPos.clone().add(new me.Vector2d(0, -this.currentHeight)));
        this.rangeHint.pos.copy(this.groundPos);
    },

    onDestroy: function(other)
    {
        if(me.game.world.hasChild(this.rangeHint))
        {
            me.game.world.removeChild(this.rangeHint);
        }
    },
});

game.Spell.ChibiFairyLamp = game.Spell.Projectile.extend
({
    init: function (x, y, source, target, settings) 
    {
        settings.image = settings.image || "vioBullet";
        settings.width = 16;
        settings.height = 16;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "Chibi fairy lamp: Attack";

        this._super(game.Spell.Projectile, 'init', [x, y, source, target, settings]);

        this.flags.isDamage = true;
        this.flags.hasTarget = true;

        this.power = settings.power || 3;

        this.speed = settings.projectileSpeed || 400;
        this.speedVector = new me.Vector2d(1, 0).rotate(settings.initAngle);
        this.targetVector = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize();
    },

    onMobCollision: function(other)
    {
        if(typeof other.receiveDamage !== "undefined")
        {
            other.receiveDamage({
                source: this.source,
                damage: {
                    nature: this.power,
                },
                isCrit: false,
                spell: this,
            });
            this.destroy(other);
        }
    },

    onDestroy: function(other)
    {
        // me.game.world.addChild(me.pool.pull("magicalHit", this.renderAnchorPos.x, this.renderAnchorPos.y, {}));
    },

    updateProjectile: function(dt)
    {
        // Homing
        if(this.target)
        {
            this.targetVector = this.target.getRenderPos(0.5, 0.5).clone().sub(this.bodyAnchorPos).normalize();
            this.speedVector.add(this.targetVector.clone().scale(0.2)).normalize();
        }

        this.body.vel.copy(this.speedVector.clone().scale(this.speed * dt * 0.001));
    }
});

game.Spell.ChibiFairyLampSpecial = game.Spell.base.extend
({
    init:function (x, y, source, settings) 
    {
        settings.image = "HealRing";
        settings.width = 64;
        settings.height = 64;
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        settings.name = "Chibi fairy lamp: special";

        settings.shapes = [new me.Ellipse(0, 0, 64, 64)];
        settings.useRotation = true;
        settings.scale = new me.Vector2d(2, 2);

        this._super(game.Spell.base, 'init', [x, y, source, source, settings, false]);

        this.flags.isHeal = true;
        this.flags.areaEffect = true;
        this.flags.overTime = true;

        // this.setScale(2, 2);

        this.power = settings.power || 10;
        this.isPlayer = this.target.data.isPlayer;

        this.timer = 600;
        this.count = 2;
    },

    updateSpell: function(dt) 
    {
        // if(typeof this.target === "undefined")
        // {
        //     this.timer = 599;
        //     this.count = 0;
        // }

        if(this.timer == 600)
        {
            // grab targets
            var currentPos = this.getRenderPos(0.5, 0.5);

            var targetList = game.units.getUnitList({
                sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
                availableTest: function(a)
                {
                    return (a.getRenderPos(0.5, 0.5).distance(currentPos) < 64);
                },
                isPlayer: this.isPlayer,
            }).slice(0, 3);

            for(var i = 0; i < targetList.length; i++)
            {
                targetList[i].receiveHeal({
                    source: this.source, 
                    heal: this.power,
                    isCrit: false,
                    spell: this,
                });
            }
        }

        this.timer -= dt;
        if(this.timer <= 0)
        {
            this.count --;
            this.timer = 600;
        }

        if(this.count < 0)
        {
            this.destroy();
        }

        this.renderable.setOpacity(Math.min(600, (this.count) * 600 + this.timer) / 600);
    },
});

// A simple taunt spell for Tanks
game.dataBackend.Spell.Taunt = game.dataBackend.Spell.base.extend
({
    init: function(settings)
    {
        settings.coolDown = 5.0;
        settings.manaCost = 0;
        settings.name = "Taunt"

        this._super(game.dataBackend.Spell.base, 'init', [settings]);

        this.isCast = true;
        this.castTime = 1.0;
    },

    onCast: function(mob, target)
    {
        // For test: automatically grabs target
        var tmpPos = mob.getRenderPos(0.5, 0.5);
        target = game.units.getUnitList({
            availableTest: function(a) { return (tmpPos.distance(a.getRenderPos(0.5, 0.5)) < 100); },
            isPlayer: !mob.data.isPlayer,
        });

        if(target.length <= 0)
        {
            return;
        }

        // Generate a spell dummy
        var spellDummy = new game.Spell.dummy({
            source: mob, 
            name: "Test Taunt",
            flags: {
                hasTarget: true,
            },
        });

        // Taunt targets
        for(var i = 0; i < target.length; i++)
        {
            if(typeof target[i].agent.changeTaunt !== "undefined")
            {
                target[i].agent.changeTaunt({source: mob, taunt: 2000});
            }
        }
    },
});
