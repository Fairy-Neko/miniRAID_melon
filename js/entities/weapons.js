game.Weapon = game.Weapon || {};

game.Weapon.base = game.Equipable.extend
({
    init: function(settings)
    {
        this._super(game.Equipable, 'init', [settings]);

        // Weapon gauge full = special attack !
        this.weaponGauge = 0;
        this.weaponGaugeMax = 100;

        this.activeRange = settings.activeRange || 200;
        this.targetCount = settings.targetCount || 1;

        this.manaCost = settings.manaCost || 1;
        this.manaRegen = settings.manaRegen || 10;
    },

    onAttack: function(mob, target) {},

    onSpecialAttack: function(mob, target) {},

    // Can mob equip this weapon ?
    isEquipable: function(mob)
    {
        for(stat in this.statRequirements)
        {
            // If any requirement does not satisfied
            if(mob.data.baseStats[stat] < this.statRequirements[stat])
            {
                return false;
            }
        }
        return true;
    },

    isInRange: function(mob, target)
    {
        if(mob.getRenderPos(0.5, 0.5).distance(target.getRenderPos(0.5, 0.5)) < this.activeRange)
        {
            return true;
        }
        return false;
    },

    grabTargets: function(mob)
    {
        return undefined;
    },

    onStatCalculation: function(mob)
    {

    },
});

// TODO: refactory the weapons code, make the base class more useful.
game.Weapon.TestStaff = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "test staff";

        this.power = settings.power || 5;

        if(me.pool.exists("testFireball") === false)
        {
            me.pool.register("testFireball", game.Spell.TestFireball, true);
        }
    },

    attack: function(mob, target)
    {
        var settings = {};
        if(target.data.isPlayer === true)
        {
            settings.isTargetPlayer = true;
        }
        else
        {
            settings.isTargetEnemy = true;
        }

        settings.power = this.power;

        me.game.world.addChild(me.pool.pull("testFireball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});

game.Weapon.TestBossStaff = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "test boss staff";

        this.power = settings.power || 5;

        if(me.pool.exists("testFireball") === false)
        {
            me.pool.register("testFireball", game.Spell.TestFireball, true);
        }
    },

    attack: function(mob, target)
    {
        var settings = {};
        
        settings.isTargetPlayer = true;
        settings.image = "heart";
        settings.width = 54;
        settings.height = 54;

        settings.power = this.power;

        me.game.world.addChild(me.pool.pull("testFireball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});

game.Weapon.TestHomingStaff = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "test staff";

        this.power = settings.power || 3;

        if(me.pool.exists("testHomingIceball") === false)
        {
            me.pool.register("testHomingIceball", game.Spell.TestHomingIceball, true);
        }
    },

    attack: function(mob, target)
    {
        var settings = {};
        if(target.data.isPlayer === true)
        {
            settings.isTargetPlayer = true;
            settings.image = "coppercoin";
        }
        else
        {
            settings.isTargetEnemy = true;
            settings.image = "crystalcoin2";
        }

        settings.power = this.power;

        me.game.world.addChild(me.pool.pull("testHomingIceball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});

game.Weapon.TestHealStaff = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "test staff";

        this.power = settings.power || 15;

        if(me.pool.exists("testHealBeam") === false)
        {
            me.pool.register("testHealBeam", game.Spell.TestHealBeam, true);
        }
    },

    attack: function(mob, target)
    {
        var settings = {};
        if(target.data.isPlayer === true)
        {
            settings.isTargetPlayer = true;
        }
        else
        {
            settings.isTargetEnemy = true;
        }

        settings.power = this.power;
        
        if(target !== undefined)
        {
            me.game.world.addChild(me.pool.pull("testHealBeam", mob, mob, target, settings));

            // Chain healing
            var currentStartMob = target;
            var nextMob = undefined;
            for(var i = 0; i < 3; i++)
            {
                var result = game.units.getUnitList({
                    sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
                    availableTest: function(a)
                    {
                        return a != nextMob && this.isInRange(currentStartMob, a);
                    }.bind(this),
                    isPlayer: mob.data.isPlayer,
                });

                if(result)
                {
                    nextMob = result[0];
                }
                else
                {
                    break;
                }

                settings.power *= 0.6;

                if(nextMob === undefined)
                {
                    break;
                }

                me.game.world.addChild(me.pool.pull("testHealBeam", currentStartMob, mob, nextMob, settings));
                currentStartMob = nextMob;
            }
        }
    },

    grabTargets: function(mob)
    {
        var result = game.units.getUnitList({
            sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
            isPlayer: mob.data.isPlayer,
        });
        if(result[0].data.currentHealth === result[0].data.maxHealth)
        {
            return undefined;
        }
        return result.slice(0, Math.min(result.length, this.targetCount));
    },
});
