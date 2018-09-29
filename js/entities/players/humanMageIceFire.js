game.PlayerMobs.HumanMageIceFire = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "magical_girl2";
        settings.width = 256;
        settings.height = 256;
        settings.framewidth = 32;
        settings.frameheight = 32;

        settings.name = "Human_Mage_Ice_Fire";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        // Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [8, 9, 10, 11, 12, 13, 14, 15]);
        this.renderable.addAnimation("dead", [5]);

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

    onSwitchWeapon(mob, weapon)
    {
    },

    onStatCalculation(mob)
    {
        mob.data.battleStats.attackPower.elemental = mob.data.baseStats.int * 0.3;
        
        mob.data.battleStats.attackPower.ice = mob.data.baseStats.int;
        mob.data.battleStats.attackPower.fire = mob.data.baseStats.int;
    },

    onStatCalculationFinish(mob)
    {
    },
});