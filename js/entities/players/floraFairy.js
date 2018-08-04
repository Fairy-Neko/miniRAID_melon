game.PlayerMobs.FloraFairy = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "FloraFairy";
        settings.width = 256;
        settings.height = 256;
        settings.framewidth = 32;
        settings.frameheight = 32;

        settings.name = "Flora_Fairy";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        // Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [0, 1, 2, 3, 4]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = this.getRenderPos(0.5, 0.8).clone();

        this.isMoving = false;

        // Add a spell
        this.data.spells.floraHeal = new game.dataBackend.Spell.FloraHeal({});
    },

    updatePlayer: function(dt)
    {
        // TODO: move this to agent!
        // TODO: cast ranges

        // use flora heal if ready
        if(this.data.spells.floraHeal.available)
        {
            this.data.spells.floraHeal.cast(this, game.units.getUnitList({
                sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
                isPlayer: this.data.isPlayer,
            })[0]);
        }

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

    /** 
     * Flora fairy: energy pass
     */
    onDealDamageFinal(damageInfo)
    {
        var healAmount = 0;

        for(dmgType in damageInfo.damage)
        {
            healAmount += Math.floor(damageInfo.damage[dmgType] * 0.4);
            damageInfo.damage[dmgType] -= healAmount;
        }

        // grab targets
        var healList = game.units.getUnitList({
            availableTest: function(a)
            {
                return (a.getRenderPos(0.5, 0.5).distance(damageInfo.target.getRenderPos(0.5, 0.5)) < 128);
            },
            isPlayer: !damageInfo.target.data.isPlayer,
        });

        var spellDummy = new game.Spell.dummy({
            source: damageInfo.source, 
            name: "Flora fairy: energy pass",
            flags: {
                isHeal: true,
                areaEffect: true,
            },
        });

        for(i = 0; i < healList.length; i++)
        {
            healList[i].receiveHeal({
                source: damageInfo.source,
                heal: Math.ceil(healAmount / healList.length),
                spell: spellDummy,
            });
        }

        return true;
    },

    /** 
     * Flora fairy: Seed of life
     */
    onDealHealFinal(healInfo)
    {
        // Only affects on spells has a target
        // and is not a HOT effect.
        if(healInfo.spell.flags.hasTarget && !healInfo.spell.flags.overTime)
        {
            var healAmount = healInfo.heal.total;

            // TODO: add a HOT effect to target
        }
    }
});

game.dataBackend.Spell.FloraHeal = game.dataBackend.Spell.base.extend
({
    init: function(settings)
    {
        settings.coolDown = 6.0;
        settings.manaCost = 10;

        this._super(game.dataBackend.Spell.base, 'init', [settings]);
    },

    onCast: function(mob, target)
    {
        // Generate a spell dummy
        var spellDummy = new game.Spell.dummy({
            source: mob, 
            name: "Flora heal",
            flags: {
                isHeal: true,
                hasTarget: true,
            },
        });

        // Heals the target
        target.receiveHeal({
            source: mob,
            heal: Math.ceil(30 * game.helper.getRandomFloat(0.8, 1.2)),
            spell: spellDummy,
        });
    },
});
