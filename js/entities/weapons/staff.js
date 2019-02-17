game.Weapon.CometWand = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "Comet Wand";
        this.weaponType = game.data.weaponType.magicItem;

        this.minPower = settings.minPower || 6;
        this.maxPower = settings.maxPower || 18;
        this.targetCount = settings.targetCount || 1;
        this.manaCost = 1;
        this.baseAttackSpeed = 1.5;

        // stats
        this.baseAttackMin = this.minPower * this.targetCount;
        this.baseAttackMax = this.maxPower * this.targetCount;
        this.energyType = "1x 魔力";
        this.damageType = 'ice';

        // Stat requirements
        this.statRequirements = { int: 10 };

        // Weapon stats
        this.weaponGaugeMax = 25;
        this.weaponGaugeIncreasement = function(mob) { return mob.data.baseStats.mag; }

        // Description
        this.getBaseAttackDesc = function(mobData)
        {
            // TODO: implement those in mob data
            body = sprintf(
                "放出彗星弾进行攻击，造成 6-18 点冰属性伤害。被击中的敌人会被减速40%%，持续5秒。"
            );
            return {title: "彗星弹幕", body: body};
        }

        this.getSpecialAttackDesc = function(mobData)
        {
            body = sprintf(
                "召唤一颗彗星坠落到目标敌人位置进行攻击。在2秒的延迟后对目标原先位置50px范围内的所有敌人造成 20-30 点冰属性伤害，并减速50%%（包括攻击速度），持续6秒。"
            );

            return {title: "彗星冲击", body: body};
        }
    },

    attack: function(mob, target)
    {
        
    },

    specialAttack: function(mob, target)
    {
        
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});