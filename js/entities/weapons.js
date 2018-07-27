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
    },

    onAttack: function(mob, target) {},

    onSpecialAttack: function(mob, target) {},

    // Can mob equip this weapon ?
    isEquipable: function(mob)
    {
        return true;
    },

    isInRange: function(mob, target)
    {
        return true;
    },
});

// TODO: refactory the weapons code, make the base class more useful.
game.weapon.testStaff = game.weapon.extend
({
    init: function(settings)
    {
        this._super(game.weapon, 'init', [settings]);
        this.name = "test staff";

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

        me.game.world.addChild(me.pool.pull("testFireball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    isEquipable: function(mob)
    {
        if(mob.data.stats.int > 3)
        {
            return true;
        }
        return false;
    },

    isInRange: function(mob, target)
    {
        if(mob.getRenderPos(0.5, 0.5).distance(target.getRenderPos(0.5, 0.5)) < 1500)
        {
            return true;
        }
        return false;
    }
});

game.weapon.testHomingStaff = game.weapon.extend
({
    init: function(settings)
    {
        this._super(game.weapon, 'init', [settings]);
        this.name = "test staff";

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
        }
        else
        {
            settings.isTargetEnemy = true;
        }

        me.game.world.addChild(me.pool.pull("testHomingIceball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    isEquipable: function(mob)
    {
        if(mob.data.stats.int > 3)
        {
            return true;
        }
        return false;
    },

    isInRange: function(mob, target)
    {
        if(mob.getRenderPos(0.5, 0.5).distance(target.getRenderPos(0.5, 0.5)) < 1500)
        {
            return true;
        }
        return false;
    }
});
