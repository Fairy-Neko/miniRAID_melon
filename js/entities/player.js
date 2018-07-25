game.PlayerMobs = game.PlayerMobs || {};

game.PlayerMobs.base = game.Mobs.baseMob.extend
({
    init: function(x, y, settings)
    {
        this._super(game.Mobs.baseMob, 'init', [x, y, settings]);
    },

    updateMob: function(dt)
    {
        this.body.update(dt);
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

        settings.shapes = [new me.Rect(0, 0, 20, 20)];
        // settings.shapes = [new me.Ellipse(0, 0, 20, 20)];
        console.log(settings);

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        //Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("run", [8, 9, 10, 11, 12, 13, 14, 15]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = [game.data.width / 2, game.data.height / 2];
        // this.targetPos = [0, 0];
        this.isMoving = false;

        me.input.registerPointerEvent('pointerdown', me.game.viewport, this.pointerDown.bind(this));
    },

    updateMob: function(dt)
    {
        this.footPos = this.getRenderPos(0.5, 0.8);
        if(game.helper.vec2.distance(this.targetPos, [this.footPos.x, this.footPos.y]) > 2)
        {
            var vel = game.helper.vec2.normalize(game.helper.vec2.sub(this.targetPos, [this.footPos.x, this.footPos.y]));
            vel = game.helper.vec2.scalar(vel, this.speed * this.movingSpeed * 2 * me.timer.tick);

            this.body.vel.x = vel[0];
            this.body.vel.y = vel[1];

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
            if(!this.renderable.isCurrentAnimation("run"))
            {
                this.renderable.setCurrentAnimation("run");
            }
        }
        else
        {
            if(!this.renderable.isCurrentAnimation("idle"))
            {
                this.renderable.setCurrentAnimation("idle");
            }
        }

        this.body.update(dt);
        return true;
    },

    pointerDown: function(pointer)
    {
        console.log(this);
        this.targetPos = [pointer.gameX, pointer.gameY];
        return true;
    },

    onCollision: function(response, other)
    {
        return false;
    },
})
