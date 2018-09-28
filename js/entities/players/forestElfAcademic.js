game.PlayerMobs.ForestElfAcademic = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "magical_girl2";
        settings.width = 256;
        settings.height = 256;
        settings.framewidth = 32;
        settings.frameheight = 32;

        settings.name = "Forest_Elf_Academic";

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        // Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [8, 9, 10, 11, 12, 13, 14, 15]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = this.getRenderPos(0.5, 0.8).clone();

        this.isMoving = false;

        // Add a spell
        this.data.spells.MagicEnhancementFire = new game.dataBackend.Spell.Elf.MagicEnhancement.Fire({});
        this.data.spells.MagicEnhancementThunder = new game.dataBackend.Spell.Elf.MagicEnhancement.Thunder({});

        this.receiveBuff({
            source: this,
            // for test
            buff: new game.Buff.Elf.MagicRing.FireFireFire({}),
            popUp: false,
        });
    },

    updatePlayer: function(dt)
    {
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

    onSwitchWeapon(mob, weapon)
    {
    },

    onStatCalculation(mob)
    {
    },

    onStatCalculationFinish(mob)
    {
    },
});

//
// ─── SPELLS ─────────────────────────────────────────────────────────────────────
//

game.dataBackend.Spell.Elf = game.dataBackend.Spell.Elf || {};
game.dataBackend.Spell.Elf.MagicEnhancement = game.dataBackend.Spell.Elf.MagicEnhancement || {};

// Need weapon skill queue or elf academic cannot work
game.dataBackend.Spell.Elf.MagicEnhancement.Fire = game.dataBackend.Spell.base.extend
({
    init: function(settings)
    {
        settings.coolDown = 3.0;
        settings.manaCost = 5.0;
        settings.name = "Enhance: Fire";

        this._super(game.dataBackend.Spell.base, 'init', [settings]);

        this.isCast = true;
        this.castTime = 0.5;
    },

    onCast: function(mob, target)
    {
        mob.receiveBuff({
            source: mob,
            // for test
            buff: new game.Buff.Elf.MagicEnhancement.Fire({}),
            popUp: true,
        });
    },
});

game.dataBackend.Spell.Elf.MagicEnhancement.Thunder = game.dataBackend.Spell.base.extend
({
    init: function(settings)
    {
        settings.coolDown = 3.0;
        settings.manaCost = 5.0;
        settings.name = "Enhance: Thunder";

        this._super(game.dataBackend.Spell.base, 'init', [settings]);

        this.isCast = true;
        this.castTime = 0.5;
    },

    onCast: function(mob, target)
    {
        mob.receiveBuff({
            source: mob,
            // for test
            buff: new game.Buff.Elf.MagicEnhancement.Thunder({}),
            popUp: true,
        });
    },
});

//
// ─── BUFFS ──────────────────────────────────────────────────────────────────────
//

game.Buff.Elf = game.Buff.Elf || {};

game.Buff.Elf.MagicRing = game.Buff.Elf.MagicRing || {};
game.Buff.Elf.MagicRing.FireFireFire = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.countTime = false;

        settings.name = settings.name || "Magic Ring";
        settings.popupName = settings.popupName || "RING";
        settings.time = settings.time || 10.0;
        settings.stacks = settings.stacks || 1;
        settings.stackable = false;
        settings.color = settings.color || '#2bcdff';
        settings.iconId = 4;

        this._super(game.Buff.base, 'init', [settings]);

        this.stacks = 0;
        
        this.timer = 0.0;
        this.magicTypes = [];

        this.toolTip = 
        {
            title: "魔力之环", 
            text: "蕴藏着魔力的本质。"
        };
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);
    },

    canStack: function(newType)
    {
        // 3rd ring -> boom !
        if(this.stacks >= 3)
        {
            return false;
        }

        // The very beginning
        if(this.stacks == 0)
        {
            return true;
        }

        // for debug
        return true;

        // For test: Fire -> Fire
        switch (this.currentType) 
        {
            case "fire":
                if(newType == "thunder" || newType == "light")
                {
                    return true;
                }
                return false;

            case "light":
                if(newType == "fire" || newType == "nature")
                {
                    return true;
                }
                return false;

            case "ice":
                if(newType == "water" || newType == "wind")
                {
                    return true;
                }
                return false;

            case "water":
                if(newType == "ice" || newType == "nature")
                {
                    return true;
                }
                return false;
            
            case "thunder":
                if(newType == "wind" || newType == "fire")
                {
                    return true;
                }
                return false;

            case "wind":
                if(newType == "thunder" || newType == "fire")
                {
                    return true;
                }
                return false;

            case "nature":
                if(newType == "water" || newType == "light")
                {
                    return true;
                }
                return false;
        
            default:
                return false;
        }
    },

    addStack: function(mob, newType)
    {
        if(this.canStack(newType) == false)
        {
            // TODO: Summon spirits
            this.stacks = 0;
            this.currentType = null;
            this.magicTypes = [];

            // Remove buffs
            while(true)
            {
                buff = mob.data.findBuffIncludesName("MagicEnhancement");
                if(buff)
                {
                    mob.data.removeListener(buff);
                }
                else
                {
                    break;
                }
            }

            while(true)
            {
                buff = mob.data.findBuff("Magic Fountain");
                if(buff)
                {
                    mob.data.removeListener(buff);
                }
                else
                {
                    break;
                }
            }
        }
        else
        {
            this.stacks ++;
            this.currentType = newType;

            this.magicTypes.push(this.currentType);

            // Add Magic Fountain to mob
            mob.receiveBuff({
                source: mob,
                buff: new game.Buff.Elf.MagicFountain({}),
                popUp: true,
            });
        }

        var str = "</p><p>";

        for(let elem in this.magicTypes)
        {
            str += game.data.damageTypeString[this.magicTypes[elem]] + " - ";
        }

        this.toolTip = 
        {
            title: "魔力之环", 
            text: "蕴藏着魔力的本质。" + str,
        };
    },

    onDealDamageFinal: function(damageInfo)
    {
        if(damageInfo.spell.flags.hasTarget == true && (typeof damageInfo.spell.flags.overTime == undefined || damageInfo.spell.flags.overTime == false))
        {
            maxDamage = 0;
            dmgType = null;

            for(let dmg in damageInfo.damage)
            {
                if(damageInfo.damage[dmg] > maxDamage)
                {
                    maxDamage = damageInfo.damage[dmg];
                    dmgType = dmg;
                }
            }

            if(/*dmgType == this.currentType ||*/ dmgType == null)
            {
                return;
            }
            else
            {
                this.addStack(damageInfo.source, dmgType);
            }
        }
    },

    onStatCalculation: function(mob)
    {},
});

game.Buff.Elf.MagicFountain = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.countTime = false;

        settings.name = settings.name || "Magic Fountain";
        settings.popupName = settings.popupName || "RING";
        settings.time = settings.time || 10.0;
        settings.stacks = settings.stacks || 1;
        settings.stackable = true;
        settings.color = settings.color || '#ff2bcd';
        settings.iconId = 4;

        this._super(game.Buff.base, 'init', [settings]);

        this.toolTip = 
        {
            title: "魔力潮涌", 
            text: "-"
        };
    },

    onAdded(mob, source)
    {
        var str = "";
        if(this.stacks > 0)
        {
            str += "造成的伤害提高" + (40 * this.stacks) + "%，<br/>消耗的资源提高" + (80 * this.stacks) + "%，<br/>攻击和施法速度减慢" + (50 * this.stacks) + "%。";   
        }

        this.toolTip = 
        {
            title: "魔力潮涌", 
            text: str,
        };
    },

    onStatCalculationFinish(mob)
    {
        mob.data.modifiers.resourceCost *= 1.0 + (0.8 * this.stacks);
        mob.data.modifiers.spellSpeed /= 1.0 + (0.5 * this.stacks);
    },

    onDealDamage(damageInfo)
    {
        for(let dmg in damageInfo.damage)
        {
            damageInfo.damage[dmg] *= 1.0 + (0.4 * this.stacks);
        }
    },
});

game.Buff.Elf.MagicEnhancement = game.Buff.Elf.MagicEnhancement || {};
game.Buff.Elf.MagicEnhancement.Fire = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.countTime = false;

        settings.name = settings.name || "MagicEnhancement Fire";
        settings.popupName = settings.popupName || "FIRE";
        settings.stackable = false;
        settings.color = settings.color || game.data.damageColor["fire"];
        settings.iconId = 4;

        this._super(game.Buff.base, 'init', [settings]);

        this.changeType = true;
        
        this.toolTip = 
        {
            title: "魔力附加：火", 
            text: "下次造成的直接伤害变为火属性。<br/>攻击带有额外50%的溅射伤害。"
        };
    },

    disableTypeChange: function()
    {
        this.changeType = false;

        this.toolTip = 
        {
            title: "魔力附加：火", 
            text: "攻击带有额外50%的溅射伤害。"
        };
    },

    onDealDamage: function(damageInfo)
    {
        if(this.changeType == true)
        {
            if(!damageInfo.damage.hasOwnProperty("fire"))
            {
                damageInfo.damage["fire"] = 0;
            }
            for(let dmg in damageInfo.damage)
            {
                if(dmg != "fire")
                {
                    damageInfo.damage["fire"] += damageInfo.damage[dmg];
                    damageInfo.damage[dmg] = 0;
                }
            }
            console.log(damageInfo)

            if(damageInfo.spell.flags.hasTarget == true && (typeof damageInfo.spell.flags.overTime == undefined || damageInfo.spell.flags.overTime == false))
            {
                this.disableTypeChange();
            }
        }
    },

    onDealDamageFinal: function(damageInfo)
    {
        // TODO: Extra effect
        var dmgTotal = 0;

        for(let dmg in damageInfo.damage)
        {
            dmgTotal += damageInfo.damage[dmg];
        }

        if(!damageInfo.hasOwnProperty("fire"))
        {
            damageInfo.damage["fire"] = 0;
        }
        damageInfo.damage["fire"] += Math.ceil(dmgTotal * 0.5);
    },
});

game.Buff.Elf.MagicEnhancement.Thunder = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.countTime = false;

        settings.name = settings.name || "MagicEnhancement Thunder";
        settings.popupName = settings.popupName || "THUNDER";
        settings.stackable = false;
        settings.color = settings.color || game.data.damageColor["thunder"];
        settings.iconId = 4;

        this._super(game.Buff.base, 'init', [settings]);

        this.changeType = true;
        
        this.toolTip = 
        {
            title: "魔力附加：雷", 
            text: "下次造成的直接伤害变为雷属性。<br/>暴击提高33%。"
        };
    },

    disableTypeChange: function()
    {
        this.changeType = false;

        this.toolTip = 
        {
            title: "魔力附加：雷", 
            text: "暴击提高33%。"
        };
    },

    onDealDamage: function(damageInfo)
    {
        if(this.changeType == true)
        {
            if(!damageInfo.damage.hasOwnProperty("thunder"))
            {
                damageInfo.damage["thunder"] = 0;
            }
            for(let dmg in damageInfo.damage)
            {
                if(dmg != "thunder")
                {
                    damageInfo.damage["thunder"] += damageInfo.damage[dmg];
                    damageInfo.damage[dmg] = 0;
                }
            }
            console.log(damageInfo)

            if(damageInfo.spell.flags.hasTarget == true && (typeof damageInfo.spell.flags.overTime == undefined || damageInfo.spell.flags.overTime == false))
            {
                this.disableTypeChange();
            }
        }
    },

    onStatCalculation: function(mob)
    {
        mob.data.battleStats.crit += 33;
    },

    onDealDamageFinal: function(damageInfo)
    {
        // TODO: Extra effect
    },
});
