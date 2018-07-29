game.weapon = me.Object.extend
({
    init: function(settings)
    {
        this.name = "undefined weapon";

        this.baseAttackSpeed = settings.baseAttackSpeed || 1.0;
        this.statRequirements = {
            vit: 0,
            str: 0,
            dex: 0,
            tec: 0,
            int: 0,
            mag: 0,
        };

        this.stats = {
            vit: 0,
            str: 0,
            dex: 0,
            tec: 0,
            int: 9,
            mag: 0,
        };

        this.healthIncreasement = 0;

        this.battleStats = {
            resist: {
                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0
            },

            attackPower: {
                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0
            },

            hitAcc: 100,
            avoid: 0,
            attackRange: 0,
            extraRange: 0,
        };

        // Weapon gauge full = special attack !
        this.weaponGauge = 0;
        this.weaponGaugeMax = 100;

        this.activeRange = settings.activeRange || 200;
        this.targetCount = settings.targetCount || 1;
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
});

// TODO: refactory the weapons code, make the base class more useful.
game.weapon.TestStaff = game.weapon.extend
({
    init: function(settings)
    {
        this._super(game.weapon, 'init', [settings]);
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

game.weapon.TestHomingStaff = game.weapon.extend
({
    init: function(settings)
    {
        this._super(game.weapon, 'init', [settings]);
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
            settings.image = "crystalcoin";
        }

        settings.power = this.power;

        me.game.world.addChild(me.pool.pull("testHomingIceball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});

game.weapon.TestHealStaff = game.weapon.extend
({
    init: function(settings)
    {
        this._super(game.weapon, 'init', [settings]);
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

            me.game.world.addChild(me.pool.pull("testHealBeam", currentStartMob, mob, nextMob, settings));
            currentStartMob = nextMob;
        }
    },

    grabTargets: function(mob)
    {
        var result = game.units.getUnitList({
            sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
            isPlayer: mob.data.isPlayer,
        });
        return result.slice(0, Math.min(result.length, this.targetCount));
    },
});
