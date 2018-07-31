//
// ─── BUFFS ──────────────────────────────────────────────────────────────────────
//
class Buff 
{
    constructor({
        name = "buff", 
        time = 1.0, 
        stacks = 1, 
        iconId = 0, 
        popupName = "buff", 
        popupColor = new me.Color(1, 1, 1, 1),
    } = {})
    {
        //Name of the buff
        this.name = name;
        
        //time in seconds, will automatically reduce by time
        this.timeRemain = time; 

        //Is the buff over? (should be removed from buff list)
        this.isOver = false;

        //stacks of the buff (if any)
        this.stacks = stacks; 

        //cellIndex of this buff in the buffIcons image, might be shown under boss lifebar / player lifebar
        this.iconId = iconId;

        //when the buff was attached or triggered, a small text will pop up like damages e.g. "SLOWED!"
        this.popupName = popupName;

        //Color for the popup text. default is white.
        this.popupColor = popupColor;

        //Where does this buff come from? and which mob does it belongs to?
        //This should be changed in receiveBuff() of mobs
        this.source = undefined;
        this.parent = undefined;
    }

    // make a popUp
    popUp()
    {
        var popUpPos = this.parent.getRenderPos(0.5, 0.0);
        
        game.UI.popupMgr.addText({
            text: this.popupName,
            color: this.popupColor,
            posX: popUpPos.x,
            posY: popUpPos.y
        });
    }

    // N.B.
    // In javascript, parameters were passed via "call-by-sharing".
    // In this case, if you change the parameter itself in a function, it will not make sense;
    // However, if you change a member of the parameter in a function, it will make sense.
    // e.g. func(x) { x = {sth}; } => DOES NOT change x
    //      func(x) { x.y = sth; } => DOES change x.y

    // Be triggered when the mob is updating.
    // This will be triggered before onStatCalculation.
    // e.g. reduce remain time, etc.
    onUpdate(mob, deltaTime)
    {
        this.timeRemain -= deltaTime;
        if(this.timeRemain < 0)
        {
            this.isOver = true;
        }
    }

    // Be triggered when the mob is calculating its stats.
    // Typically, this will trigged on start of each frame.
    // On every frame, the stats of the mob will be recalculated from its base value.
    onStatCalculation(mob) {}

    // Be triggered when the mob is attacking.
    // This is triggered before the mob's attack.
    onAttack(mob) {}

    // Be triggered when the mob has finished an attack.
    onAfterAttack(mob) {}

    // Be triggered when the mob is making a special attack.
    // This is triggered before the attack.
    onSpecialAttack(mob) {}

    // Be triggered when the mob has finished a special attack.
    onAfterSpecialAttack(mob) {}

    // Following functions return a boolean.
    // True:    the damage / heal was modified.
    // False:   the damage / heal was not modified.
    
    // XXFinal will happen after resist calculation, and vice versa.
    // You can modify the values in damage / heal in order to change the final result.

    onDealDamage({ target, damage, isCrit, spell } = {}) { return false; }
    onDealDamageFinal({ target, damage, isCrit, spell } = {}) { return false; }

    onDealHeal({ target, heal, isCrit, spell } = {}) { return false; }
    onDealHealFinal({ target, heal, isCrit, spell } = {}) { return false; }
    
    onReceiveDamage({ source, damage, isCrit, spell } = {}) { return false; }
    onReceiveDamageFinal({ source, damage, isCrit, spell } = {}) { return false; }

    onReceiveHeal({ source, heal, isCrit, spell } = {}) { return false; }
    onReceiveHealFinal({ source, heal, isCrit, spell } = {}) { return false; }

    onFocusReceiveDamage({ source, target, damage, isCrit, spell } = {}) { return false; }
    onFocusReceiveDamageFinal({ source, target, damage, isCrit, spell } = {}) { return false; }

    onFocusReceiveHeal({ source, target, heal, isCrit, spell } = {}) { return false; }
    onFocusReceiveHealFinal({ source, target, heal, isCrit, spell } = {}) { return false; }

    onDeath({ source, damage, isCrit, spell } = {}) { return false; }

    // Be triggered when the mob is going to be rendered.
    // e.g. change sprite color here etc.
    onRender(mob) {}
};

// Some buffes

class IceSlowed extends Buff
{
    constructor({name = "ice_slowed", time = 1.0, stacks = 1} = {})
    {
        super({
            name: name,
            time: time,
            stacks: stacks,
            iconId: 1,
            popupName: "SLOWED!",
            popupColor: new me.Color(1, 0, 1, 1)
        });
    }

    onStatCalculation(mob)
    {
        if('modifiers' in mob.data)
        {
            mob.data.modifiers.speed = 0.2 * mob.data.modifiers.speed;
        }
    }

    onRender(mob)
    {
        // mob.sprite.color = new BABYLON.Color4(0.6, 0.6, 1, 1);
    }
}

class Fired extends Buff
{
    constructor({name = "fired", time = 1.0, stacks = 1, damageMin = 1, damageMax = 10, damageGap = 0.57} = {})
    {
        super({
            name: name,
            time: time,
            stacks: stacks,
            iconId: 2,
            popupName: "FIRED!",
            popupColor: new me.Color(1, 1, 0, 1)
        });

        this.damageMin = damageMin;
        this.damageMax = damageMax;
        this.damageGap = damageGap;
        
        this.timer = 0.0;
        this.fireCount = 0;
    }

    onUpdate(mob, deltaTime)
    {
        super.onUpdate(mob, deltaTime);

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
    }

    onRender(mob)
    {
    }
}
