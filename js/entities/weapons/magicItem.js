
game.Weapon.ChibiFairyLamp = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "Chibi fairy lamp";
        this.weaponType = game.data.weaponType.magicItem;

        this.minPower = settings.minPower || 3;
        this.maxPower = settings.maxPower || 5;
        this.targetCount = settings.targetCount || 3;
        this.manaCost = 6;

        // stats
        this.baseAttackMin = this.minPower * this.targetCount;
        this.baseAttackMax = this.maxPower * this.targetCount;
        this.energyType = "1x 魔力";
        this.damageType = 'nature';

        // Stat requirements
        this.statRequirements = { mag: 5 };

        // Weapon stats
        this.weaponGaugeMax = 15;
        this.weaponGaugeIncreasement = function(mob) { return mob.data.baseStats.mag; }

        // Description
        this.getBaseAttackDesc = function(mobData)
        {
            // TODO: implement those in mob data
            body = sprintf(
                "释放 %d 颗飞弹飞向周围的敌人，具有追踪效果。每颗将造成 %d-%d 点自然伤害。",
                3 + this.getMobDataSafe(mobData, ['bullets'], 0),
                this.getDamage(mobData, 3, 'nature').value,
                this.getDamage(mobData, 5, 'nature').value
            );
            return {title: "小飞弹", body: body};
        }

        this.getSpecialAttackDesc = function(mobData)
        {
            body = sprintf(
                "在自身周围产生一片花田，每 %.1f 秒治愈周围 %dpx 范围内最多三名生命值最低的队友 %d 点HP，持续 %.1f 秒（3跳）。",
                this.getAttackTime(mobData, 1.2).value,
                64, // TODO: extraRange
                this.getDamage(mobData, 6, 'heal').value,
                this.getAttackTime(mobData, 2.4).value
            );

            return {title: "广域治疗", body: body};
        }

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
