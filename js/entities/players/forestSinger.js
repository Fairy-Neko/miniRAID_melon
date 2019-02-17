game.PlayerMobs.ForestSinger = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "forestSinger";
        settings.width = 128;
        settings.height = 32;
        settings.framewidth = 32;
        settings.frameheight = 32;

        settings.name = "Forest_Elf_Singer";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        // Animations
        this.renderable.addAnimation("idle", [0]);
        this.renderable.addAnimation("move", [1, 2, 3, 0]);
        this.renderable.addAnimation("dead", [0]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = this.getRenderPos(0.5, 0.8).clone();

        this.isMoving = false;

        // Add a spell
        // this.data.spells.taunt = new game.dataBackend.Spell.Taunt({});
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

    onSwitchWeapon(mob, weapon)
    {
    },

    onStatCalculation(mob)
    {
    },

    onStatCalculationFinish(mob)
    {
    },
});
