//
// ─── BUFFS ──────────────────────────────────────────────────────────────────────
//
game.Buff = game.Buff || {};

game.Buff.base = game.MobListener.extend
({
    init: function(settings)
    {
        this._super(game.MobListener, 'init', [settings]);

        //Name of the buff
        this.name = settings.name || "buff";

        //This listener is a buff
        this.isBuff = true;
        
        //time in seconds, indicates the durtion of buff
        this.timeMax = settings.time || 1.0;

        //time in seconds, will automatically reduce by time
        this.timeRemain = settings.time || 1.0; 

        //Is the buff over? (should be removed from buff list)
        this.isOver = false;

        //stacks of the buff (if any)
        this.stacks = settings.stacks || 1;
        this.stackable = settings.stackable || true; 

        //cellIndex of this buff in the buffIcons image, might be shown under boss lifebar / player lifebar
        this.iconId = settings.iconId || 0;

        //the color used for UI rendering
        this.color = settings.color || '#56CDEF';

        //when the buff was attached or triggered, a small text will pop up like damages e.g. "SLOWED!"
        this.popupName = settings.popupName || "buff";

        //Color for the popup text. default is this.color.
        this.popupColor = settings.popupColor || this.color;

        //Where does this buff come from?
        this.source = settings.source || undefined;

        this.toolTip = {title: "Buff", text: "lol."};
    },

    // make a popUp
    popUp: function(mob)
    {
        var popUpPos = mob.getRenderPos(0.5, 0.0);
        
        game.UI.popupMgr.addText({
            text: this.popupName,
            color: this.popupColor,
            velY: -64,
            velX: 0,
            accY: 64,
            accX: 0,
            posX: popUpPos.x,
            posY: popUpPos.y
        });
    },

    onUpdate: function(mob, deltaTime)
    {
        // unit of deltaTime now becomes ms. (instead of s)

        this._super(game.MobListener, 'init', [mob, deltaTime]);

        this.timeRemain -= deltaTime * 0.001;
        if(this.timeRemain < 0)
        {
            this.isOver = true;
        }
    },
});

// Some buffes

game.Buff.IceSlowed = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name || "Ice slowed";
        settings.popupName = settings.popupName || "SLOWED!";
        settings.color = settings.color || "#0066FF";
        settings.iconId = settings.iconId || 1;

        this._super(game.Buff.base, 'init', [settings]);

        this.toolTip = 
        {
            title: "减速", 
            text: "速度降低80%。"
        };
    },

    onStatCalculation: function(mob)
    {
        if('modifiers' in mob.data)
        {
            mob.data.modifiers.speed = 0.2 * mob.data.modifiers.speed;
        }
    },

    onRender: function(mob, renderer)
    {
        // mob.sprite.color = new BABYLON.Color4(0.6, 0.6, 1, 1);
    },
});

game.Buff.Fired = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name || "fired";
        settings.time = settings.time || 1.0;
        settings.stacks = settings.stacks || 1;

        this._super(game.Buff.base, 'init', [settings]);

        this.damageMin = settings.damageMin || 1;
        this.damageMax = settings.damageMax || 10;
        this.damageGap = settings.damageGap || 0.57;
        
        this.timer = 0.0;
        this.fireCount = 0;

        this.toolTip = 
        {
            title: "燃烧", 
            text: "每" + this.damageGap + "秒损失" + this.damageMin + "~" + this.damageMax + "点生命值。"
        };
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);

        this.timer += deltaTime;

        for(;this.fireCount < Math.floor(this.timer / this.damageGap); this.fireCount++)
        {
            mob.receiveDamage({
                source: this.source,
                damage: {
                    fire: game.helper.getRandomInt(this.damageMin, this.damageMax + 1),
                }
            });
        }
    },
});

game.Buff.Bloodlust = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name || "bloodlustBuff";
        settings.time = settings.time || 10.0;
        settings.stacks = settings.stacks || 1;
        settings.iconId = 2;
        settings.popupName = "TIME WARP!",
        settings.color = settings.color || "#FF5566";

        this._super(game.Buff.base, 'init', [settings]);

        this.timer = 0.0;

        this.toolTip = 
        {
            title: "嗜血术", 
            text: "行动速度提升40%。"
        };
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);
    },

    onStatCalculation: function(mob)
    {
        if('modifiers' in mob.data)
        {
            mob.data.modifiers.attackSpeed = 1.4 * mob.data.modifiers.attackSpeed;
        }
    },
});

// Triggered buff for Icespick
game.Buff.IceSpikeTriggered = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name || "IceSpick!";
        // time to kick some ass
        settings.popupName = settings.popupName || "TKSS!";
        settings.time = settings.time || 10.0;
        settings.stacks = settings.stacks || 1;
        settings.color = settings.color || '#AA77FF';
        settings.iconId = 4;

        this._super(game.Buff.base, 'init', [settings]);
        
        this.timer = 0.0;

        this.toolTip = 
        {
            title: "冰刺", 
            text: "你的下一次冰属性攻击造成1000%的伤害，并拥有额外的减速效果。"
        };
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);
    },

    onStatCalculation: function(mob)
    {
        if('modifiers' in mob.data)
        {
            mob.data.modifiers.attackSpeed = 0.3 * mob.data.modifiers.attackSpeed;
        }
    },
});

game.Buff.IceSpikeDebuff = game.Buff.base.extend
({
    init: function(settings)
    {
        if(me.pool.exists("icedFx") === false)
        {
            me.pool.register("icedFx", game.Spell.IcedFxSprite, true);
        }

        settings.name = settings.name || "IceSpickDebuff";
        settings.time = settings.time || 0.75;
        settings.stacks = settings.stacks || 1;
        settings.iconId = 4;
        settings.color = settings.color || '#AA55FF';
        settings.popUp = settings.popUp || false;
        settings.popupName = "ICE !!";

        this._super(game.Buff.base, 'init', [settings]);
        
        this.timer = 0.0;

        this.toolTip = 
        {
            title: "刺骨寒冰", 
            text: "行动速度降低99%。"
        };
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);
    },

    onStatCalculation: function(mob)
    {
        me.game.world.addChild(me.pool.pull("icedFx", mob.centerX, mob.centerY, {}));

        if('modifiers' in mob.data)
        {
            mob.data.modifiers.speed = 0.01 * mob.data.modifiers.speed;
        }
    },
});

game.Buff.LifeRegen = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name || "Rejuvenation"; // for fun
        settings.time = settings.time || 12.0;
        settings.stacks = settings.stacks || 1;
        settings.color = settings.color || "#71ff42";
        settings.popUp = settings.popUp || false;
        settings.popupName = "SEED"

        this._super(game.Buff.base, 'init', [settings]);

        this.healPower = Math.ceil(settings.healTotal / (settings.time / settings.healGap)) || 3;
        this.healGap = settings.healGap || 1.2;
        this.healCountTotal = Math.floor(settings.time / settings.healGap);
        
        this.timer = 0.0;
        this.healCount = 0;

        this.spellDummy = new game.Spell.dummy({
            source: this.source,
            name: "Seed of life",
            flags: {
                isHeal: true,
                hasTarget: true,
                overTime: true,
            }
        });

        this.toolTip = 
        {
            title: "生命之种", 
            text: "在" + settings.time + "秒内回复共计" + this.healPower * this.healCountTotal + "点生命值。"
        };
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);

        this.timer += deltaTime * 0.001;

        for(;this.healCount < Math.floor(this.timer / this.healGap); this.healCount++)
        {
            mob.receiveHeal({
                source: this.source,
                heal: this.healPower,
                spell: this.spellDummy,
            });
        }
    },
});

game.Buff.GerneralInfo = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name
        settings.time = settings.time || 5.0;
        settings.stacks = settings.stacks || 1;
        settings.color = settings.color || "#ffffff";
        settings.popUp = settings.popUp || false;
        settings.popupName = settings.popupName;

        this._super(game.Buff.base, 'init', [settings]);

        this.timer = 0.0;
        this.healCount = 0;

        this.toolTip = settings.toolTip;
    },
    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);
        this.timer += deltaTime * 0.001;
    },
});