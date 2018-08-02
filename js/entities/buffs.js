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
        this.timeMax = time;

        //time in seconds, will automatically reduce by time
        this.timeRemain = settings.time || 1.0; 

        //Is the buff over? (should be removed from buff list)
        this.isOver = false;

        //stacks of the buff (if any)
        this.stacks = settings.stacks || 1;
        this.stackable = settings.stackable || true; 

        //cellIndex of this buff in the buffIcons image, might be shown under boss lifebar / player lifebar
        this.iconId = settings.iconId || 0;

        //when the buff was attached or triggered, a small text will pop up like damages e.g. "SLOWED!"
        this.popupName = settings.popupName || "buff";

        //Color for the popup text. default is white.
        this.popupColor = settings.popupColor || "#ffffff";

        //Where does this buff come from?
        //This should be changed in receiveBuff() of mobs
        this.source = undefined;
    },

    // make a popUp
    popUp: function()
    {
        var popUpPos = this.parent.getRenderPos(0.5, 0.0);
        
        game.UI.popupMgr.addText({
            text: this.popupName,
            color: this.popupColor,
            posX: popUpPos.x,
            posY: popUpPos.y
        });
    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.MobListener, 'init', [mob, deltaTime]);

        this.timeRemain -= deltaTime;
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
        settings.popupColor = settings.popupColor || "#0000ff";
        settings.iconId = settings.iconId || 1;

        this._super(game.Buff.base, 'init', [settings]);
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

game.Buff.bloodlustBuff = game.Buff.base.extend
({
    init: function(settings)
    {
        settings.name = settings.name || "bloodlust";
        settings.time = settings.time || 15.0;
        settings.stacks = settings.stacks || 1;

        this._super(game.Buff.base, 'init', [settings]);
        
        this.timer = 0.0;

    },

    onUpdate: function(mob, deltaTime)
    {
        this._super(game.Buff.base, 'onUpdate', [mob, deltaTime]);
    },

    onStatCalculation(mob)
    {
        if('modifiers' in mob.data)
        {
            mob.data.modifiers.attackSpeed = 1.4 * mob.data.modifiers.attackSpeed;
        }
    },
});
