game.Weapon.SimpleGrassFlute = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "Grass Flute";
        this.weaponType = game.data.weaponType.magicItem;

        this.minPower = settings.minPower || 6;
        this.maxPower = settings.maxPower || 9;
        this.targetCount = settings.targetCount || 1;
        this.manaCost = 1;
        this.baseAttackSpeed = 2.5;

        // stats
        this.baseAttackMin = this.minPower * this.targetCount;
        this.baseAttackMax = this.maxPower * this.targetCount;
        this.energyType = "1x 魔力";
        this.damageType = 'light';

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
                "放出一颗带有追踪效果的音符进行攻击，对目标造成 6-9 点光伤害。音符命中后，将破裂并使附近50px内的团队成员造成的物理伤害提高1，可叠加3次。"
            );
            return {title: "音符", body: body};
        };

        this.getSpecialAttackDesc = function(mobData)
        {
            body = sprintf(
                "吹响欢快的旋律，使所有团队成员造成的伤害提高5，持续5秒。"
            );

            return {title: "微风之歌", body: body};
        };
    },

    attack: function(mob, target)
    {
        settings = {
            chasingRange: -1,
            chasingPower: 1,
            image: 'projectiles',
            width: 16,
            height: 16,
            frames: [0],
            speed: 100,
            onMobCollision: function(mob)
            {
                this.dieAfter(this.safeDmg, [mob, {'light': helper.getRandomInt(6, 9)}], mob);
            },
            onDestroy: function(mob)
            {
                helper.aoe(
                    helper.safeBuff, [this.source, null, game.Buff.Fired, {time: 5.0, damageGap: 0.1, damageMax: 1}, false],
                    this.bodyAnchorPos, 200, false, false
                );
            },
        };

        obj = me.pool.pull("projectile", mob.renderAnchorPos.x, mob.renderAnchorPos.y, mob, target, settings)
        me.game.world.addChild(obj, 10000);
        me.game.world.moveToTop(obj);
        obj.z = 10000;
    },

    specialAttack: function(mob, target)
    {
        
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});