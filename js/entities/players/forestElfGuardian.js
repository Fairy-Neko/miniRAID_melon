game.PlayerMobs.ForestElfGuardian = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "tank_girl2";
        settings.width = 256;
        settings.height = 256;
        settings.framewidth = 32;
        settings.frameheight = 32;

        settings.name = "Forest_Elf_Guardian";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        // Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [8, 9, 10, 11, 12, 13, 14, 15]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = this.getRenderPos(0.5, 0.8).clone();

        this.isMoving = false;

        // Add a spell
        this.data.spells.taunt = new game.dataBackend.Spell.Taunt({});
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
        // If switched to shield,
        // cast a ultimate taunt on close targets
        if(weapon.weaponType === game.data.weaponType.shield)
        {
            this.data.spells.taunt.forceCast(mob);
        }
    },

    onStatCalculation(mob)
    {
        mob.data.battleStats.resist.physical = mob.data.baseStats.vit + mob.data.baseStats.str * 0.5;
        mob.data.battleStats.resist.elemental = mob.data.baseStats.str + mob.data.baseStats.vit * 0.5;

        mob.data.tauntMul = 5.0;
    },

    onStatCalculationFinish(mob)
    {
    },
});