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

    getDamageRange: function(mobData)
    {
        if(!mobData)
        {
            return {modified: false, value: [this.baseAttackMin, this.baseAttackMax]};
        }

        modified = false;
        pwrCorrect = 1.0;
        pwrCorrect *= Math.pow(
            1.0353, 
            mobData.battleStats.attackPower[game.data.damageType[this.damageType]] + mobData.battleStats.attackPower[this.damageType]);
        
        if(pwrCorrect > 1.01 || pwrCorrect < 0.99)
        {
            modified = true;
        }

        return {modified: modified, value: [this.baseAttackMin * pwrCorrect, this.baseAttackMax * pwrCorrect]};
    },

    getAttackTime: function(mobData)
    {
        if(!mobData)
        {
            return {modified: false, value: this.baseAttackSpeed};
        }

        modified = false;
        mobSpd = (1 / mobData.modifiers.speed) * (1 / mobData.modifiers.attackSpeed);
        if(mobSpd < 0.99 || mobSpd > 1.01)
        {
            modified = true;
        }
        
        return {modified: modified, value: mobSpd * this.baseAttackSpeed};
    },

    getAttackRange: function(mobData)
    {
        if(!mobData)
        {
            return {modified: false, value: this.activeRange};
        }

        modified = false;
        if(mobData.battleStats.attackRange > 0)
        {
            modified = true;
        }
        
        return {modified: modified, value: mobData.battleStats.attackRange + this.activeRange};
    },

    getResourceCost: function(mobData)
    {
        if(!mobData)
        {
            return {modified: false, value: this.manaCost};
        }

        modified = false;
        if(mobData.modifiers.resourceCost < 0.99 || mobData.modifiers.resourceCost > 1.01)
        {
            modified = true;
        }
        
        return {modified: modified, value: mobData.modifiers.resourceCost * this.manaCost};
    },

    getBaseAttackDesc: function(mobData)
    {

    },

    getSpecialAttackDesc: function(mobData)
    {

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
          
        ttBody += "<div>"

            // Item Level - Rarity
            ttBody += "<p><span style='display:flex'>" + 
                "<strong style=\"width:4.5em; color:" + game.data.rarityColor[this.linkedItem.getData().rarity] +
                "\">" + game.data.rarityChs[this.linkedItem.getData().rarity] + "</strong>" +
                "阶级" + this.linkedItem.getData().level + " </span>";

            // Primary class - Sub class
            ttBody += "<span>" + game.data.ItemPClassChs[this.linkedItem.getData().pClass];
            if(this.linkedItem.getData().sClass !== "")
            {
                ttBody += " - " + game.data.ItemSClassChs[this.linkedItem.getData().sClass];
            }
            ttBody += "</span></p>"
            
            // Attack power (type)
            attackType = this.damageType;

            ttBody += "<p><span>";
            
            dmgR = this.getDamageRange(this.equipper);
            console.log(dmgR);
            if(dmgR.modified)
            {
                ttBody += 
                    "攻击伤害<strong style = \"color: aqua\"> " + 
                    dmgR.value[0].toFixed(1) + " - " + dmgR.value[1].toFixed(1) + " </strong><strong style=\"color:" + game.data.damageColor[attackType] + "\"> " + 
                    game.data.damageTypeString[attackType] + " </strong></span>";
            }
            else
            {
                ttBody += 
                    "攻击伤害<strong style = \"color: " + game.data.damageColor[attackType] + "\"> " + 
                    dmgR.value[0].toFixed(1) + " - " + dmgR.value[1].toFixed(1) + " " + 
                    game.data.damageTypeString[attackType] + " </strong></span>";
            }
            
            // Attack time
            atkTime = this.getAttackTime(this.equipper);
            if(atkTime.modified){ ttBody += "<span><strong style='color:aqua'>" + atkTime.value.toFixed(1) + "</strong> 秒</span></p>"; }
            else                { ttBody += "<span>" + atkTime.value.toFixed(1) + " 秒</span></p>"; }
            
            dpsR = [dmgR.value[0] / atkTime.value, dmgR.value[1] / atkTime.value];
            ttBody += "<p>每秒伤害 " + dpsR[0].toFixed(1) + " - " + dpsR[1].toFixed(1) + "</p>";

            // Attack range
            actRange = this.getAttackRange(this.equipper);
            if (actRange.modified)  { ttBody += "<p>攻击距离 <strong style='color:aqua'>" + actRange.value.toFixed(0) + "</strong> px</p>"; }
            else                    { ttBody += "<p>攻击距离 " + actRange.value.toFixed(0) + " px</p>"; }

            // Energy statement
            if(this.equipper)
            {
                ttBody += "<p><span>武器能量 " + this.weaponGauge + " / " + this.weaponGaugeMax + "</span><span><strong style='color:aqua'>+ " + this.weaponGaugeIncreasement(this.equipper.parentMob) + " </strong>(" + this.energyType + ")</span></p>";
            }
            else
            {
                ttBody += "<p><span>武器能量 " + this.weaponGauge + " / " + this.weaponGaugeMax + "</span><span>"+ this.energyType + "</span></p>";
            }

        ttBody += "</div><div>"

            // Equip requirement
            isFirst = true;

            for(stat in this.statRequirements)
            {
                if(this.statRequirements[stat] <= 0){continue;}
                if(isFirst)
                {
                    isFirst = false;
                    ttBody += "<p> 装备需求 " + this.statRequirements[stat] + " " + game.data.statChs[stat] + "</p>"
                }
                else
                {
                    ttBody += "<p><span style='padding-left:4.5em'>" + this.statRequirements[stat] + " " + game.data.statChs[stat] + "</span></p>"
                }
            }

            if(isFirst)
            {
                ttBody += "<p>无需求</p>";

            }
            
        // Weapon special properties (if any)
        if(false)
        {
            ttBody += "</div><div>"        
        }

        ttBody += "</div><div>"

            // Base attack
            ttBody += "<p><span>普通攻击 <strong style=\"color:" + this.linkedItem.getData().color + "\">" + 
                "小飞弹" + "</strong>" + "</span>"
            
            // Cost / Cost per sec
            rCost = this.getResourceCost(this.equipper);
            if (rCost.modified) { ttBody += "<span> <strong style='color:aqua'>" + rCost.value.toFixed(0) + "</strong> 法力 (" + (rCost.value / atkTime.value).toFixed(1) + " 每秒)</span></p>"; }
            else                { ttBody += "<span> " + rCost.value.toFixed(0) + " 法力 (" + (rCost.value / atkTime.value).toFixed(1) + " 每秒)</span></p>"; }
            

            // description - todo: generate description by weapon (varing numbers)
            ttBody += "<p><strong style='color:darkturquoise'>" + "释放3颗飞弹飞向周围的敌人，具有追踪效果。每颗造成 3-5 点自然伤害。" +
                "</strong></p>";

        ttBody += "</div><div>"

            // Special attack
            ttBody += "<p><span>特殊攻击 <strong style=\"color:" + this.linkedItem.getData().color + "\">" + 
                "广域治疗" + "</strong>" + "</span>"
            
            // Energy cost
            ttBody += "<span> " + this.weaponGaugeMax + " 能量</span></p>";

            // description - todo: generate description by weapon (varing numbers)
            ttBody += "<p><strong style='color:darkturquoise'>" + 
                "在自身周围产生一片花田，每 1.2 秒治愈周围 64px 范围内最多三名生命值最低的队友 6 点HP，持续 2.4 秒（3跳）。" +
                "</strong></p>";

        ttBody += "</div><div>"

            ttBody += "<p style='color: gold;'>" + 
                this.linkedItem.getData().toolTipText + "</p>"
        
        ttBody += "</div>"

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
