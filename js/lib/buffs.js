'use strict';
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
            popupColor: "aqua"
        });
    }

    onStatCalculation(mob)
    {
        if('speed' in mob)
        {
            mob.speed = 0.2 * mob.speed;
        }
    }

    onRender(mob)
    {
        mob.sprite.color = new BABYLON.Color4(0.6, 0.6, 1, 1);
    }
}

class Fired extends Buff
{
    constructor({name = "fired", time = 1.0, stacks = 1, damageMin = 1, damageMax = 500, damageGap = 0.09} = {})
    {
        super({
            name: name,
            time: time,
            stacks: stacks,
            iconId: 2,
            popupName: "FIRED!",
            popupColor: "red"
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
            mob.recieveDamage({
                source: this.source,
                damage: {
                    fire: getRandomInt(this.damageMin, this.damageMax + 1),
                }
            });
        }
    }

    onRender(mob)
    {
        mob.sprite.color = new BABYLON.Color4(1, 0.8, 0.4, 1);
    }
}
