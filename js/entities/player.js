game.PlayerMobs = game.PlayerMobs || {};

game.PlayerMobs.base = game.Mobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.isPlayer = true;

        this._super(game.Mobs.base, 'init', [x, y, settings]);

        this.agent = new game.PlayerAgent.Simple(this);
    },

    updateMob: function(dt)
    {
        this.agent.updatePlayer(this, dt);

        this.updatePlayer(dt);

        this.body.update(dt);
    },

    updatePlayer: function(dt)
    {

    },

    onCollision: function(response, other)
    {

    },
});

game.PlayerAgent = game.PlayerAgent || {};
// Interface for AI Agent controlling a player character
game.PlayerAgent.base = me.Object.extend
({
    init(player, settings) {},

    updatePlayer(player, dt) {},

    setTargetPos(player, position, dt) {},

    setTargetMob(player, mob, dt) {},

    // TODO: onCollision, recieving an array of collision event (some sensors equipped on player etc.)
});

// A simple agent, moves to a target position or mob.
game.PlayerAgent.Simple = game.PlayerAgent.base.extend
({
    init(player, settings)
    {
        this._super(game.PlayerAgent.base, 'init', []);

        this.targetPos = undefined;
        this.targetMob = undefined;

        // Will the player move automatically (to nearest mob) if it is free ?
        this.autoMove = true;

        // idleCount will count down from idleFrame if player is in idle (-1 / frame) to smooth the animation.
        // Only if idleCount = 0, the player will be "idle".
        // idleFrame is seperated for targeting Mob (which may move = need more smooth)
        // and targeting a static position (don't move and need high precision)
        this.idleFrameMob = 10;
        this.idleFramePos = 0;
        this.idleCount = 0;
        this.speedFriction = 0.9;

        // TODO: smooth when hit world object ?
    },

    updatePlayer(player, dt)
    {
        this.footPos = player.getRenderPos(0.5, 0.8);

        if(typeof this.targetPos !== "undefined")
        {
            if(this.targetPos.distance(this.footPos) > 1.5)
            {
                player.body.vel = this.targetPos.clone().sub(this.footPos).normalize().scale(player.data.getMovingSpeed() * me.timer.tick);
    
                this.isMoving = true;

                // Reset the anim counter
                this.idleCount = this.idleFramePos;
            }
            else
            {
                this.targetPos = undefined;

                this.isMoving = false;
            }
        }
        else if(game.Mobs.checkAlive(this.targetMob) == true)
        {
            // we need move to goin the range of our current weapon
            if(player.data.currentWeapon.isInRange(player, this.targetMob) == false)
            {
                player.body.vel = this.targetMob.getRenderPos(0.5, 0.5).clone().sub(this.footPos).normalize().scale(player.data.getMovingSpeed() * me.timer.tick);

                this.isMoving = true;

                // Reset the anim counter
                this.idleCount = this.idleFrameMob;
            }
            // and then we don't move anymore.
            else
            {
                this.targetMob = undefined;

                this.isMoving = false;
            }
        }
        else
        {
            // We lose the target.

            this.targetPos = undefined;
            this.targetMob = undefined;
            this.isMoving = false;
        }

        if(this.isMoving === true)
        {
            // Fix our face direction when moving
            if(player.body.vel.x > 0)
            {
                player.renderable.flipX(true);
            }
            else
            {
                player.renderable.flipX(false);
            }

            if(!player.renderable.isCurrentAnimation("move"))
            {
                player.renderable.setCurrentAnimation("move");
            }
        }
        else
        {
            // Count the frames
            if(this.idleCount > 0)
            {
                this.idleCount --;

                // Also smooth the speed
                player.body.vel.scale(this.speedFriction);
            }
            else
            {
                player.body.vel.set(0, 0);

                if(!player.renderable.isCurrentAnimation("idle"))
                {
                    player.renderable.setCurrentAnimation("idle");
                }
            }

            if(this.autoMove === true)
            {
                if(typeof (targetList = player.data.currentWeapon.grabTargets(player)) !== "undefined")
                {
                    this.setTargetMob(player, targetList[0]);
                }
            }
        }

        // Attack !
        if(player.doAttack(dt) === true)
        {
            if(typeof (targets = player.data.currentWeapon.grabTargets(player)) !== "undefined")
            {
                for(var target of targets.values())
                {
                    if(player.data.currentWeapon.isInRange(player, target))
                    {
                        player.data.currentWeapon.attack(player, target);
                    }
                }
            }
        }
    },

    setTargetPos(player, position, dt)
    {
        this.targetPos = position;
    },

    setTargetMob(player, mob, dt)
    {
        this.targetMob = mob;
    },
})

game.PlayerMobs.test = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.width = 128;
        settings.height = 128;
        settings.framewidth = 32;
        settings.frameheight = 32;
        settings.name = "Magical_girl";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        //Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [8, 9, 10, 11, 12, 13, 14, 15]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = this.getRenderPos(0.5, 0.8).clone();

        this.isMoving = false;
    },

    updatePlayer: function(dt)
    {
        return true;
    },

    onCollision: function(response, other)
    {
        if(other.body.collisionType !== me.collision.types.WORLD_SHAPE)
        {
            return false;
        }
        return true;
    },
})
