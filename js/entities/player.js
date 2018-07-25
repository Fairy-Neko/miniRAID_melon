game.PlayerMobs = game.PlayerMobs || {};

game.PlayerMobs.base = game.Mobs.baseMob.extend
({
    init: function(x, y, settings)
    {
        this._super(game.Mobs.baseMob, 'init', [x, y, settings]);
    },

    updateMob: function(dt)
    {
        this.footPos = this.getRenderPos(0.5, 0.8);
        if(this.targetPos.distance(this.footPos) > 1.5)
        {
            this.body.vel = this.targetPos.clone().sub(this.footPos).normalize().scale(this.data.getMovingSpeed() * me.timer.tick);

            this.isMoving = true;

            if(this.body.vel.x > 0)
            {
                this.renderable.flipX(true);
            }
            else
            {
                this.renderable.flipX(false);
            }
        }
        else
        {
            if(this.isMoving === true)
            {
                console.log(this);
            }

            this.body.vel.x = 0;
            this.body.vel.y = 0;

            this.isMoving = false;
        }

        if(this.isMoving === true)
        {
            if(!this.renderable.isCurrentAnimation("move"))
            {
                this.renderable.setCurrentAnimation("move");
            }
        }
        else
        {
            if(!this.renderable.isCurrentAnimation("idle"))
            {
                this.renderable.setCurrentAnimation("idle");
            }
        }

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

game.PlayerMobs.test = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "magical_girl";
        settings.width = 128;
        settings.height = 128;
        settings.framewidth = 32;
        settings.frameheight = 32;
        settings.name = "Magical_girl";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];
        // settings.shapes = [new me.Ellipse(0, 0, 20, 20)];
        console.log(settings);

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        //Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [8, 9, 10, 11, 12, 13, 14, 15]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = new me.Vector2d(game.data.width / 2, game.data.height / 2);
        // this.targetPos = [0, 0];
        this.isMoving = false;

        me.input.registerPointerEvent('pointerdown', me.game.viewport, this.pointerDown.bind(this));
    },

    updatePlayer: function(dt)
    {
        me.collision.check(this);
        return true;
    },

    pointerDown: function(pointer)
    {
        console.log(this);
        this.targetPos.set(pointer.gameX, pointer.gameY);
        return true;
    },

    onCollision: function(response, other)
    {
        if(other.body.collisionType === game.collisionTypes.AREA_EFFECT)
        {
            return false;
        }
        return true;
    },
})
