game.Weapon = game.Weapon || {};

game.Weapon.base = game.Equipable.extend
({
    init: function(settings)
    {
        this._super(game.Equipable, 'init', [settings]);

        // Weapon gauge full = special attack !
        this.weaponGauge = 0;
        this.weaponGaugeMax = 100;
        this.weaponGaugeIncreasement = function(mob){ return 1; };

        this.activeRange = settings.activeRange || 200;
        this.targetCount = settings.targetCount || 1;

        this.manaCost = settings.manaCost || 1;
        this.manaRegen = settings.manaRegen || 10;

        this.weaponType = game.data.weaponType.staff;
        this.weaponSubType = game.data.weaponType.common;

        // stats
        this.baseAttackMin = 4;
        this.baseAttackMax = 6;
        this.energyType = "1x 魔力";
        this.damageType = 'nature';
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
    checkSelfEquipable: function(mob)
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
        if(mob.getRenderPos(0.5, 0.5).distance(target.getRenderPos(0.5, 0.5)) < (this.activeRange + mob.data.battleStats.attackRange))
        {
            return true;
        }
        return false;
    },

    grabTargets: function(mob)
    {
        return undefined;
    },

    onBaseStatCalculation(mob)
    {
        for(let stat in this.stats)
        {
            mob.data.baseStats[stat] += this.stats[stat];
        }
    },

    onStatCalculation: function(mob)
    {

    },

    getDamage: function(mobData, dmg, dmgType)
    {
        if(!mobData)
        {
            return {modified: false, value: dmg};
        }

        modified = false;
        pwrCorrect = 1.0;
        pwrCorrect *= Math.pow(
            1.0353, 
            mobData.battleStats.attackPower[game.data.damageType[dmgType]] + mobData.battleStats.attackPower[dmgType]);
        
        if(pwrCorrect > 1.01 || pwrCorrect < 0.99)
        {
            modified = true;
        }

        return {modified: modified, value: dmg * pwrCorrect};
    },

    getAttackTime: function(mobData, time)
    {
        if(!mobData)
        {
            return {modified: false, value: time};
        }

        modified = false;
        mobSpd = (1 / mobData.modifiers.speed) * (1 / mobData.modifiers.attackSpeed);
        if(mobSpd < 0.99 || mobSpd > 1.01)
        {
            modified = true;
        }
        
        return {modified: modified, value: mobSpd * time};
    },

    getAttackRange: function(mobData, range)
    {
        if(!mobData)
        {
            return {modified: false, value: range};
        }

        modified = false;
        if(mobData.battleStats.attackRange > 0)
        {
            modified = true;
        }
        
        return {modified: modified, value: mobData.battleStats.attackRange + range};
    },

    getResourceCost: function(mobData, cost)
    {
        if(!mobData)
        {
            return {modified: false, value: cost};
        }

        modified = false;
        if(mobData.modifiers.resourceCost < 0.99 || mobData.modifiers.resourceCost > 1.01)
        {
            modified = true;
        }
        
        return {modified: modified, value: mobData.modifiers.resourceCost * cost};
    },

    getMobDataSafe(mobData, entry, defaultValue)
    {
        if(mobData)
        {
            len = entry.length;
            currentObj = mobData;
            for(var i = 0; i < len; i++)
            {
                currentObj = currentObj[entry[i]];
                if(!currentObj)
                {
                    return defaultValue;
                }
            }
            return currentObj;
        }
        return defaultValue;
    },

    _getBaseAttackDesc: function(mobData)
    {
        if(this.getBaseAttackDesc)
        {
            return this.getBaseAttackDesc(mobData);
        }

        return {title: "攻击", body: "无描述。"}
    },

    _getSpecialAttackDesc: function(mobData)
    {
        if(this.getSpecialAttackDesc)
        {
            return this.getSpecialAttackDesc(mobData);
        }

        return {title: "无", body: "这个武器没有特殊攻击。"}
    },

    showToolTip: function()
    {
        // Weapon properties:
        // Item Level - Rarity / Primary class - Sub class
        // Attack power (type) / Attack time (DPS)
        // Attack range
        // Energy statement 0 / Max value (Energy type)

        // Equip requirement

        // Weapon special properties (if any)

        // Base attack      cost / (Cost per sec)
        // base attack description

        // Special attack   energy cost
        // Special attack description

        // Weapon description (italic)

        ttBody = "";
        
        //
        // ─── BASIC PROPERTIES ────────────────────────────────────────────
        //
        
        th = game.helper.toolTip;

        ttBody += th.beginSection();

            // Item Level - Rarity / Primary class - Sub class
            ttBody += th.row(
                th.column(
                    th.colored(
                        game.data.rarityChs[this.linkedItem.getData().rarity],
                        game.data.rarityColor[this.linkedItem.getData().rarity],
                        'width: 4.5em;'
                    ) + 
                    "阶级 " + this.linkedItem.getData().level
                    , 'display:flex;') +
                th.column(
                    game.data.ItemPClassChs[this.linkedItem.getData().pClass] + 
                    (
                        this.linkedItem.getData().sClass !== "" ? 
                        (" - " + game.data.ItemSClassChs[this.linkedItem.getData().sClass]) : 
                        ("")
                    )
                )
            );

            // Attack power (type) & Attack time
            attackType = this.damageType;
            dmgMin = this.getDamage(this.equipper, this.baseAttackMin, attackType);
            dmgMax = this.getDamage(this.equipper, this.baseAttackMax, attackType);
            atkTime = this.getAttackTime(this.equipper, this.baseAttackSpeed);

            ttBody += th.row(
                th.column(
                    "攻击伤害 " +
                    th.colored(
                        sprintf("%.1f - %.1f ", dmgMin.value, dmgMax.value),
                        dmgMin.modified ? 'aqua' : game.data.damageColor[attackType]
                    ) + 
                    th.colored(
                        game.data.damageTypeString[attackType],
                        game.data.damageColor[attackType]
                    )
                ) + 
                th.column(
                    th.colored(
                        atkTime.value.toFixed(1),
                        atkTime.modified ? 'aqua' : 'white'
                    ) + " 秒"
                )
            );
            
            // DPS
            dpsR = [dmgMin.value / atkTime.value, dmgMax.value / atkTime.value];
            ttBody += th.row(sprintf("每秒伤害 %.1f", (dpsR[0] + dpsR[1]) / 2.0))

            // Attack range
            actRange = this.getAttackRange(this.equipper, this.activeRange);
            ttBody += th.row(th.column(
                "攻击距离 " + 
                th.colored(
                    actRange.value.toFixed(0),
                    actRange.modified ? 'aqua' : 'white'
                ) + " px"
            ));

            // Energy statement
            ttBody += th.row(
                th.column(
                    sprintf("武器能量 %d / %d", this.weaponGauge, this.weaponGaugeMax)
                ) + 
                th.column(
                    this.equipper ? 
                    (
                        th.colored("+ " + this.weaponGaugeIncreasement(this.equipper.parentMob), 'aqua') +
                        sprintf(" (%s)", this.energyType)
                    ) : 
                    (
                        this.energyType
                    )
                )
            );

        ttBody += th.switchSection();

            // Equip requirement
            isFirst = true;

            for(stat in this.statRequirements)
            {
                if(this.statRequirements[stat] <= 0){continue;}
                if(isFirst)
                {
                    isFirst = false;
                    ttBody += th.row(sprintf("装备需求 %d %s", this.statRequirements[stat], game.data.statChs[stat]))
                }
                else
                {
                    ttBody += th.row(th.column(sprintf("%d %s", this.statRequirements[stat], game.data.statChs[stat]), 'padding-left:4.5em'));
                }
            }

            if(isFirst)
            {
                ttBody += th.row("无需求");

            }
            
        // Weapon special properties (if any)
        if(false)
        {
            ttBody += th.switchSection();        
        }

        ttBody += th.switchSection();

            // Base attack
            baseDesc = this._getBaseAttackDesc(this.equipper);
            rCost = this.getResourceCost(this.equipper, this.manaCost);

            ttBody += th.row(
                th.column(
                    "普通攻击 " + 
                    th.colored(
                        baseDesc.title,
                        this.linkedItem.getData().color
                    )
                ) + 
                th.column(
                    th.colored(
                        rCost.value.toFixed(0), 
                        (rCost.modified) ? 'aqua' : 'white'
                    ) + 
                    " 法力 (" +
                    (rCost.value / atkTime.value).toFixed(1) + " 每秒)"
                )
            )
            ttBody += th.row(
                baseDesc.body,
                'color:darkturquoise; display:block;'
            );

        ttBody += th.switchSection();

            spDesc = this._getSpecialAttackDesc(this.equipper);

            ttBody += th.row(
                th.column(
                    "特殊攻击 " + 
                    th.colored(
                        spDesc.title,
                        this.linkedItem.getData().color
                    )
                ) + 
                th.column(
                    sprintf("%d 能量", this.weaponGaugeMax)
                )
            )
            ttBody += th.row(
                spDesc.body,
                'color:darkturquoise; display:block;'
            );

        ttBody += th.switchSection();

            ttBody += "<p style='color: gold;'>" + 
                this.linkedItem.getData().toolTipText + "</p>"
        
        ttBody += th.endSection();

        game.UIManager.showToolTip({
            title: this.linkedItem.getData().showName,
            bodyText: ttBody,
            titleColor: this.linkedItem.getData().color,
        });
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

        // stats
        this.baseAttackMin = this.power;
        this.baseAttackMax = this.power;
        this.energyType = "1x 魔力";
        this.damageType = 'fire';

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

        // stats
        this.baseAttackMin = this.power;
        this.baseAttackMax = this.power;
        this.energyType = "1x 魔力";
        this.damageType = 'fire';

        if(me.pool.exists("testFireball") === false)
        {
            me.pool.register("testFireball", game.Spell.TestFireball, true);
        }

        if(me.pool.exists("testStarBomb") === false)
        {
            me.pool.register("testStarBomb", game.Spell.TestStarBomb, true);
        }

        this.countMax = 2;
        this.count = 2;
        this.type = "stand";
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

        if(this.count < 0)
        {
            this.count = Math.floor(this.countMax);
            this.countMax -= 0.8;
            if(this.countMax < 1) { this.countMax = 1; } // this becomes faster and faster

            var rndTarget = game.units.getUnitList({isPlayer: !mob.data.isPlayer});
            starBombTarget = rndTarget[game.helper.getRandomInt(0, rndTarget.length)];

            if(this.type === "stand"){
                starBombTarget.receiveBuff({
                    source: mob,
                    buff: new game.Buff.GerneralInfo({
                        name: "starBomb",
                        time: 3.0,
                        color: "#FF85C2",
                        toolTip: {
                            title: "流星-分担！",
                            text: "在3秒后由范围内所有单位分担200点伤害.",
                        },
                    }),
                    popUp: true,
                });
                me.game.world.addChild(me.pool.pull("testStarBomb", starBombTarget.renderAnchorPos.x, starBombTarget.renderAnchorPos.y, mob, starBombTarget, {
                    isTargetPlayer: starBombTarget.data.isPlayer,
                    isTargetEnemy: !starBombTarget.data.isPlayer,
                    type: "stand",
                    power: 200,
                }));
                this.type = "spread";
            }
            else if(this.type === "spread"){
                starBombTarget.receiveBuff({
                    source: mob,
                    buff: new game.Buff.GerneralInfo({
                        name: "starBomb",
                        time: 3.0,
                        color: "#FF85C2",
                        toolTip: {
                            title: "流星-分散！",
                            text: "在3秒后范围内所有单位受到40点伤害.",
                        },
                    }),
                    popUp: true,
                });
                me.game.world.addChild(me.pool.pull("testStarBomb", starBombTarget.renderAnchorPos.x, starBombTarget.renderAnchorPos.y, mob, starBombTarget, {
                    isTargetPlayer: starBombTarget.data.isPlayer,
                    isTargetEnemy: !starBombTarget.data.isPlayer,
                    type: "spread",
                    power: 40,
                }));
                this.type = "stand";
            }
        }

        game.UI.popupMgr.addText({
            text: "< " + this.count + " ! >",
            color: "#FF0000",
            velY: -128,
            velX: 0,
            accY: 128,
            accX: 0,
            posX: mob.getRenderPos(0.5, 0.5).x,
            posY: mob.getRenderPos(0.5, 0.5).y
        });

        this.count --;
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

        // stats
        this.baseAttackMin = this.power;
        this.baseAttackMax = this.power;
        this.energyType = "1x 魔力";
        this.damageType = 'ice';

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
        this.manaCost = 10;

        // stats
        this.baseAttackMin = this.power;
        this.baseAttackMax = this.power;
        this.energyType = "1x 魔力";
        this.damageType = 'heal';

        this.getBaseAttackDesc = function(mobData)
        {
            // TODO: implement those in mob data
            body = sprintf(
                "恢复目标 %d 点HP，并跳转至当前 %dpx 内生命值最低的另一名队伍成员。<br/>每次跳转都会使治疗量减少当前的40%%。<br/>最多跳转 %d 次 （ %d 个目标 ）。",
                this.getDamage(mobData, this.power, 'heal').value,
                this.getAttackRange(mobData, this.activeRange).value,
                2 + this.getMobDataSafe(mobData, ['bullets'], 0),
                3 + this.getMobDataSafe(mobData, ['bullets'], 0)
            );
            return {title: "联结治疗", body: body};
        }

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

game.Weapon.DPSHomingStaff = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);

        this.name = "dps test staff";

        this.power = settings.power || 3;

        // stats
        this.baseAttackMin = this.power;
        this.baseAttackMax = this.power;
        this.energyType = "1x 魔力";
        this.damageType = 'ice';

        // Description
        this.getBaseAttackDesc = function(mobData)
        {
            // TODO: implement those in mob data
            body = sprintf(
                "发射冰刺造成 %d 点冰霜伤害，并使目标减速80%%，持续1秒。<br/><br/>攻击有 20%% 几率使你获得<strong style='color:lightsalmon'>冰川尖刺</strong>增益，使你的下一次冰刺造成<strong style='color:lightsalmon'> %d </strong>点冰霜伤害，并使目标减速99%%，持续1.5秒。<br/>每5次攻击必定会触发冰川尖刺。<br/>被冰川尖刺影响的普通攻击不会触发冰川尖刺。",
                this.getDamage(mobData, this.power, 'ice').value,
                this.getDamage(mobData, this.power, 'ice').value * 10
            );
            return {title: "冰刺", body: body};
        }

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
            settings.name = "Ice Spick"
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

game.Weapon.TestShield = game.Weapon.base.extend
({
    init: function(settings)
    {
        this._super(game.Weapon.base, 'init', [settings]);
        this.name = "test shield";
        this.weaponType = game.data.weaponType.shield;

        this.stats.vit = 3;

        this.power = settings.power || 5;

        // stats
        this.baseAttackMin = this.power;
        this.baseAttackMax = this.power;
        this.energyType = "1x 魔力";
        this.damageType = 'knock';

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

    onReceiveDamage: function(damageInfo)
    {
        // for(var dmgType in damageInfo.damage)
        // {
        //     damageInfo.damage[dmgType] *= 0.7;
        // }
    },

    grabTargets: function(mob)
    {
        return result = game.units.getNearest(mob.getRenderPos(0.5, 0.5), isPlayer = !mob.data.isPlayer, count = this.targetCount);
    },
});
