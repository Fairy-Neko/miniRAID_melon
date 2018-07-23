'use strict';
// I don't know how to do OOP in JS...lol

// Why it is all started with a lower case character ?????????!!?!?
// (in JS tutorials and babylonjs)
// OMG.

// Helper for generate random ints
// The maximum is exclusive and the minimum is inclusive
function getRandomInt(min, max) 
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; 
}

function getRandomFloat(min, max) 
{
    return Math.random() * (max - min) + min;
}

function radian(degree)
{
    return degree / 180.0 * Math.PI;
}

function readTextFile(self, file, callback) 
{
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() 
    {
        if (rawFile.readyState === 4 && rawFile.status == "200") 
        {
            callback(self, rawFile.responseText);
        }
    }
    rawFile.send(null);
}

//
// ─── HELPER CLASS FOR RENDERING MASSIVE MOVING TEXT ON UI ───────────────────────
//
// TODO: transfer this to melonjs

class UIPopupTextMgr
{
    static RegisterGameApp(game)
    {
        UIPopupTextMgr.game = game;
    }

    static Singleton()
    {
        if(typeof this.singleton == 'undefined')
        {
            UIPopupTextMgr.singleton = new UIPopupTextMgr();
        }

        return UIPopupTextMgr.singleton;
    }

    constructor()
    {
        this.textList = new Set();
    }

    AddText({
        text = "test",
        time = 1.0, // lifespan (sec)
        velX = 0, // direction
        velY = 4, // jumping speed
        accX = 0.0,   // gravity
        accY = -4,// gravity
        posX = 0.0,
        posY = 0.0,
        color = "white",
        outlineWidth = 0,
        outlineColor = "black",
        fontSize = 8,
        fontFamily = "Arial",
    } = {})
    {
        var textObj = new BABYLON.GUI.TextBlock();

        textObj.text = text;
        textObj.color = color;
        textObj.fontSize = fontSize;
        textObj.top = -posY;
        textObj.left = posX;
        textObj.outlineWidth = outlineWidth;
        textObj.outlineColor = outlineColor;
        textObj.fontFamily = fontFamily;

        textObj.popUpCtrl = {
            timeRemain: time, 
            posX: posX * 32.0, 
            posY: posY * 32.0, 
            velX: velX * 32.0, 
            velY: velY * 32.0, 
            accX: accX * 32.0, 
            accY: accY * 32.0};

        UIPopupTextMgr.game.UITex.addControl(textObj);

        this.textList.add(textObj);
    }

    update(deltaTime)
    {
        for (let txt of this.textList)
        {
            txt.popUpCtrl.timeRemain -= deltaTime;

            if(txt.popUpCtrl.timeRemain < 0)
            {
                UIPopupTextMgr.game.UITex.removeControl(txt);
                this.textList.delete(txt);
                continue;
            }

            txt.popUpCtrl.posX += txt.popUpCtrl.velX * deltaTime;
            txt.popUpCtrl.posY += txt.popUpCtrl.velY * deltaTime;

            txt.popUpCtrl.velX += txt.popUpCtrl.accX * deltaTime;
            txt.popUpCtrl.velY += txt.popUpCtrl.accY * deltaTime;

            txt.alpha = (txt.popUpCtrl.timeRemain > 1 ? 1 : txt.popUpCtrl.timeRemain);
            txt.top = -txt.popUpCtrl.posY;
            txt.left = txt.popUpCtrl.posX;
        }
    }
}

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
        popupColor = "black",
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
        //This should be changed in recieveBuff() of mobs
        this.source = undefined;
        this.parent = undefined;
    }

    // make a popUp
    popUp()
    {
        UIPopupTextMgr.Singleton().AddText({
            text: this.popupName,
            color: this.popupColor,
            outlineWidth: 2,
            fontSize: 14,
            posX: this.parent.position.x,
            posY: this.parent.position.y
        });

        console.log("(Buff popUp): " + this.popupName);
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

    // Be triggered when the mob is going to be rendered.
    // e.g. change sprite color here etc.
    onRender(mob) {}
};

//
// ─── MOB CLASS ──────────────────────────────────────────────────────────────────
//
// Anything that has life, appears as a sprite, can recieve damage, being buffed / debuffed and move.
// e.g. players, enemies, bosses ...
class Mob 
{
    constructor({
        name = "mob",
        health = 100,
        damage = 0,
        spriteMgrPool = undefined,
        scene = undefined,
        spriteName = "mob",
        spriteCount = 512,
        renderSprite = true,
        position = new BABYLON.Vector3(0, 0, 0),
    } = {}) 
    {
        this.name = name;

        // health related
        this.maxHealth = health;
        this.currentHealth = health - damage;
    
        // speed related (1.0 means 100% (NOT a value but a ratio))
        this.speed = 1.0;
        this.movingSpeed = 1.0;
        this.attackSpeed = 1.0;

        // Stats
        this.level = 1;
        this.baseStats = {
            vit: 1,
            str: 1,
            dex: 1,
            tec: 1,
            int: 1,
            mag: 1,
        };

        // Stats (cannot increase directly)
        this.battleStats = {
            resist: {
                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0
            },

            attackPower: {
                slash: 0,
                knock: 0,
                pierce: 0,
                fire: 0,
                ice: 0,
                water: 0,
                nature: 0,
                wind: 0,
                thunder: 0,
                light: 0
            },

            hitAcc: 100,
            avoid: 0,
            attackRange: 0,
            extraRange: 0,
        };
    
        // buff related
        this.buffList = new Set();

        // rendering
        this.spriteMgrPool = spriteMgrPool;
        this.scene = scene;
        this.spriteCount = spriteCount;
        this.spriteName = spriteName;
        this.position = position;

        this.renderSprite = renderSprite;

        // create sprite
        if(this.renderSprite == true)
        {
            this.sprite = new BABYLON.Sprite(this.name, this.spriteMgrPool.getMgr(this.spriteName, this.scene, this.spriteCount));
            this.sprite.position = this.position;
        }
    }

    init()
    {

    }

    update(deltaTime)
    {
        //Update all the buffes
        for (let buff of this.buffList.values())
        {
            buff.onUpdate(this, deltaTime);
            
            if(buff.isOver == true)
            {
                //this buff is over. delete it from the list.
                this.buffList.delete(buff);
            }
        }

        //calculate Stats
        this.calcStats();
        for (let buff of this.buffList.values())
        {
            buff.onStatCalculation(this);
        }
    }

    render(deltaTime)
    {
        // Update all buffes
        for (let buff of this.buffList.values())
        {
            buff.onRender(this);
        }

        // update the position of the sprite.
        if(this.renderSprite == true)
        {
            this.sprite.position = this.position;
        }
    }

    calcStats()
    {
        //Go back to base speed
        this.speed = 1.0;
        this.movingSpeed = 1.0;
        this.attackSpeed = 1.0;
    }

    // Will be called when a buff is going to affect the mob.
    // If anything some object with buff ability (e.g. fireball can fire sth up) hits has method recieveBuff(),
    // recieveBuff() will be called and the mob will be buffed.
    // recieveBuff() should be the final step of being buffed, and if the mob resists some buff this should not be called.
    // e.g. in some inherited classes use:
    //                                       if(...){ nothing happens; } else { super.recieveBuff() }.
    recieveBuff({
        source = undefined, 
        buff = undefined,
        popUp = true
    } = {})
    {
        if(buff != undefined)
        {
            console.log("[" + this.name + "] : Recieved buff <" + buff.name + "> from <" + source.name, "> !");

            this.buffList.add(buff);

            //Set source and belongings
            buff.source = source;
            buff.parent = this;

            //Initial popUp
            if(popUp == true)
            {
                buff.popUp();
            }
        }
    }

    // Same as recieveBuff(),
    // this method will be used to recieve damage from any object.
    // this method will calculate damage reducement *only* based on mob's resist stats,
    // So if you have any other damage calculation processes (e.g. fire resist necklace / -3 fire dmg), 
    // do it first and then call super.recieveDamage().
    
    // This method will also popup a text with the final amount of damage, 
    // with corresponding color defined in tables.js (var damageColor).
    // this action could be disabled by setting popUp = false.
    recieveDamage({
        source = undefined, 
        damage = {
            slash = 0,
            knock = 0,
            pierce = 0,
            fire = 0,
            ice = 0,
            water = 0,
            nature = 0,
            wind = 0,
            thunder = 0,
            light = 0
        } = {},
        popUp = true
    } = {})
    {
        var finalDmg = {};

        for(var dmgType in damage)
        {
            // damage% = 0.9659 ^ resist
            // This is, every 1 point of resist reduces corresponding damage by 3.41%, 
            // which will reach 50% damage reducement at 20 points.
            finalDmg[dmgType] = Math.ceil(damage[dmgType] * (Math.pow(0.9659, this.battleStats.resist[dmgType])));
            
            if(popUp == true && finalDmg[dmgType] > 0)
            {
                UIPopupTextMgr.Singleton().AddText({
                    text: finalDmg[dmgType].toString(),
                    color: damageColor[dmgType],
                    posX: this.position.x,
                    posY: this.position.y,
                    fontSize: 12,
                    outlineWidth: 2
                });
            }
        }
    }
};
