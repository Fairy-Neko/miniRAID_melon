game.Weapon = game.Weapon || {};

game.Weapon.base = game.Equipable.extend
({
    init: function(settings)
    {
        this._super(game.Equipable, 'init', [settings]);

        // Weapon gauge full = special attack !
        this.weaponGauge = 0;
        this.weaponGaugeMax = 100;
        this.weaponGaugeIncreasement = function(mob, target){ return 1; };

        this.activeRange = settings.activeRange || 200;
        this.targetCount = settings.targetCount || 1;

        this.manaCost = settings.manaCost || 1;
        this.manaRegen = settings.manaRegen || 10;

        this.weaponType = game.data.weaponType.staff;
        this.weaponSubType = game.data.weaponType.common;
        this.level = 1;
    },

    attack: function(mob, target) 
    {
        this.weaponGauge += this.weaponGaugeIncreasement(mob, target);
        
        if(this.weaponGauge > this.weaponGaugeMax)
        {
            this.weaponGauge -= this.weaponGaugeMax;
            this.specialAttack(mob, target);
        }
    },

    specialAttack: function(mob, target) {},

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
            // settings.image = "vioBullet";
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

        if(result.length > 0)
        {
            if(result[0].data.currentHealth === result[0].data.maxHealth)
            {
                return undefined;
            }
            return result.slice(0, Math.min(result.length, this.targetCount));
        }
        return [];
    },
});

game.Weapon.ChibiFairyLamp = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
      <<<<<<< betairya-dev
        this.name = "Chibi fairy lamp";

        this.minPower = settings.minPower || 3;
        this.maxPower = settings.maxPower || 5;
        this.targetCount = settings.targetCount || 3;

        // Stat requirements
        this.statRequirements = { mag: 5 };

        // Weapon stats
        this.weaponGaugeMax = 20;
        this.weaponGaugeIncreasement = function(mob) { return mob.data.baseStats.mag; }

        if(me.pool.exists("chibiFairyLampBullet") === false)
        {
            me.pool.register("chibiFairyLampBullet", game.Spell.ChibiFairyLamp, true);
        }
        if(me.pool.exists("chibiFairyLampSpecial") === false)
        {
            me.pool.register("chibiFairyLampSpecial", game.Spell.ChibiFairyLampSpecial, true);
        }
    },

    attack: function(mob, target)
    {
        this._super(game.Weapon.base, 'attack', [mob, target]);

        var settings = {};
        settings.isTargetPlayer = target.data.isPlayer;
        settings.isTargetEnemy = !target.data.isPlayer;

        settings.initAngle = game.helper.getRandomFloat(0, 6.28319);

        settings.power = game.helper.getRandomInt(this.minPower, this.maxPower + 1);

        me.game.world.addChild(me.pool.pull("chibiFairyLampBullet", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    specialAttack: function(mob, target)
    {
        // AoE healing
        // Use single healing for test
        var settings = {};
        settings.isTargetPlayer = mob.data.isPlayer;
        settings.isTargetEnemy = !mob.data.isPlayer;

        settings.power = game.helper.getRandomInt(this.minPower, this.maxPower + 1);
        // healing
        me.game.world.addChild(me.pool.pull("chibiFairyLampSpecial", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, settings));
      },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});

game.Weapon.DPSHomingStaff = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);

        this.name = "dps test staff";

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

        // A buff triggered heavy attack
        var buff = mob.data.findBuff("IceSpick!");
        if(buff){
            settings.power = 10 * this.power;
            settings.image = "crystalcoin3";
            settings.width = 32;
            settings.height = 48;
            mob.data.removeListener(buff);
        }
        else
        {
            // randomly get buffed with a nicely gurantee mechanism(x
            if(game.helper.getRandomFloat(0, 1) > 0.8 || this.weaponGauge > 4){
                this.weaponGauge = 0;
                mob.receiveBuff({
                    source: mob,
                    buff: new game.Buff.IceSpikeTriggered({time: 10.0}),
                    popUp: true,
                });
            }
            else{
                this.weaponGauge++;
            }
        }

        me.game.world.addChild(me.pool.pull("testHomingIceball", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings));
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});
