game.PlayerMobs.FloraFairy = game.PlayerMobs.base.extend
({
    init: function(x, y, settings)
    {
        settings.image = "FloraFairy";
        settings.width = 256;
        settings.height = 256;
        settings.framewidth = 32;
        settings.frameheight = 32;

        settings.name = "Flora_Fairy";
        settings.classUID = 'floraFairy';

        settings.shapes = [new me.Rect(0, 0, 20, 20)];

        this._super(game.PlayerMobs.base, 'init', [x, y, settings]);

        this.setColliderRelativePos(0, 6);
        this.autoTransform = true;

        this.renderable.anchorPoint.set(0.5, 0.5);
        
        // Animations
        this.renderable.addAnimation("idle", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("move", [0, 1, 2, 3, 4]);
        this.renderable.addAnimation("dead", [5]);

        this.renderable.setCurrentAnimation("idle");

        this.targetPos = this.getRenderPos(0.5, 0.8).clone();

        this.isMoving = false;

        // Add a spell
        // this.data.spells.floraHeal = new game.dataBackend.Spell.FloraHeal({});

        this.data.currentFlower = new game.dataBackend.Spell.NekoClawGrass({});
    },

    updatePlayer: function(dt)
    {
        // TODO: move this to agent!
        // TODO: cast ranges

        // use flora heal if ready
        // if(this.data.spells.floraHeal.available)
        // {
        //     this.data.spells.floraHeal.cast(this, game.units.getUnitList({
        //         sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
        //         isPlayer: this.data.isPlayer,
        //     })[0]);
        // }

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

    /** 
     * Flora fairy: energy pass
     */
    onDealDamageFinal(damageInfo)
    {
        var healAmount = 0;

        for(dmgType in damageInfo.damage)
        {
            healAmount += Math.floor(damageInfo.damage[dmgType] * 0.4);
            damageInfo.damage[dmgType] -= healAmount;
        }

        // grab targets
        var healList = game.units.getUnitList({
            sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
            availableTest: function(a)
            {
                return (a.getRenderPos(0.5, 0.5).distance(damageInfo.target.parentMob.getRenderPos(0.5, 0.5)) < 128);
            },
            isPlayer: !damageInfo.target.isPlayer,
        });

        var spellDummy = new game.Spell.dummy({
            source: damageInfo.source.parentMob, 
            name: "Flora fairy: energy pass",
            flags: {
                isHeal: true,
                areaEffect: true,
            },
        });

        for(i = 0; i < healList.length; i++)
        {
            if(healAmount <= 0)
            {
                return true;
            }

            var targetHealAmount = Math.min(healList[i].data.maxHealth - healList[i].data.currentHealth, healAmount)
            healAmount -= targetHealAmount;

            healList[i].receiveHeal({
                source: damageInfo.source.parentMob,
                heal: targetHealAmount,
                spell: spellDummy,
            });
        }

        return true;
    },

    /** 
     * Flora fairy: Seed of life
     */
    onDealHealFinal(healInfo)
    {
        // Only affects on spells has a target
        // and is not a HOT effect.
        if(healInfo.spell.flags.hasTarget && !healInfo.spell.flags.overTime)
        {
            var healAmount = Math.ceil(healInfo.heal.total * 0.3);

            // TODO: add a HOT effect to target
            healInfo.target.parentMob.receiveBuff({
                source: this,
                buff: new game.Buff.LifeRegen({
                    time: 16.0,
                    healTotal: healAmount,
                    healGap: 2.0,
                    vitInc: 1,

                    name: "生命之种",
                }),
                popUp: true,
            });

            this.data.currentFlower.cast(this, undefined);
        }
    },

    onSwitchWeapon(mob, weapon)
    {
        // FIXME: remove this !
        this.data.currentFlower.forceCast(this, undefined);
    },

    onStatCalculation(mob)
    {
        mob.data.battleStats.attackPower.nature = mob.data.baseStats.mag + mob.data.baseStats.int * 0.5;

        // mob.data.modifiers.spellSpeed = 5.5;
    },

    onStatCalculationFinish(mob)
    {
        mob.data.battleStats.attackPower.heal = mob.data.battleStats.attackPower.nature;
    },
});

game.dataBackend.Spell.FloraHeal = game.dataBackend.Spell.base.extend
({
    init: function(settings)
    {
        settings.coolDown = 6.0;
        settings.manaCost = 15;
        settings.name = "Flora Heal";

        this._super(game.dataBackend.Spell.base, 'init', [settings]);

        this.isCast = true;
        this.isChannel = true;
        this.channelTime = 2.0;
        this.castTime = 1.5;

        this.totalTime = 0;
        this.hitCount = 0;
    },

    onCast: function(mob, target)
    {
        // For test: automatically grabs target
        target = game.units.getUnitList({
            sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
            isPlayer: mob.data.isPlayer,
        })[0];

        // Generate a spell dummy
        var spellDummy = new game.Spell.dummy({
            source: mob, 
            name: "Flora heal",
            flags: {
                isHeal: true,
                hasTarget: true,
            },
        });

        // Heals the target
        target.receiveHeal({
            source: mob,
            heal: Math.ceil(20 * game.helper.getRandomFloat(0.8, 1.2)),
            spell: spellDummy,
        });

        this.totalTime = 0;
        this.hitCount = 0;
    },

    onChanneling: function(mob, target, dt)
    {
        this.totalTime += dt;
        if(Math.ceil(this.totalTime / 1) > this.hitCount)
        {
            this.hitCount += 1;

            targets = game.units.getUnitList({
                sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
                isPlayer: mob.data.isPlayer,
            });

            // Generate a spell dummy
            var spellDummy = new game.Spell.dummy({
                source: mob, 
                name: "Flora heal",
                flags: {
                    isHeal: true,
                    hasTarget: false,
                    overTime: true,
                },
            });

            // Heals the target
            targets.forEach(target => {
                target.receiveHeal({
                    source: mob,
                    heal: Math.ceil(3 * game.helper.getRandomFloat(0.8, 1.2)),
                    spell: spellDummy,
                });
            });
        }
    }
});

// Test
game.dataBackend.Spell.NekoClawGrass = game.dataBackend.Spell.base.extend
({
    init: function(settings)
    {
        settings.coolDown = 0.0;
        settings.manaCost = 0;

        this._super(game.dataBackend.Spell.base, 'init', [settings]);
    },

    onCast: function(mob, target)
    {
        // For test: automatically grabs target
        if(typeof target === "undefined")
        {
            target = game.units.getUnitList({
                availableTest: 
                    function(mob)
                    {
                        for(let localBuff of mob.data.buffList)
                        {
                            if(localBuff.name === "猫爪草")
                            {
                                return false;
                            }
                        }
                        return true;
                    },
                sortMethod: game.Mobs.UnitManager.sortByHealthPercentage,
                isPlayer: mob.data.isPlayer,
            }).slice(0, 1);
        }

        for(var i = 0; i < target.length; i++)
        {
            target[i].receiveBuff({
                source: mob,
                buff: new game.Buff.LifeRegen({
                    time: 12.0,
                    healTotal: 20,
                    healGap: 1.5,
                    vitInc: 0,
                    
                    color: "#ffff00",
                    name: "猫爪草",
                    popUpName: "MEOW",
                }),
                popUp: true,
            })
        }
    },
});
