/**
 * a UI container and child items
 */

game.UI = game.UI || {};


game.UI.Container = me.Container.extend({

    init: function() {
        // call the constructor
        this._super(me.Container, 'init');

        this.anchorPoint.set(0, 0);

        // persistent across level change
        this.isPersistent = true;

        // make sure we use screen coordinates
        this.floating = true;
        this.z = Infinity;

        // give a name
        this.name = "UI";

        // add our child score object at the top left corner
        game.UI.popupMgr = new game.UI.PopupTextManager(0, 0);
        game.UI.monitor = new game.UI.BattleMonitor(me.game.viewport.width - 100, me.game.viewport.height - 12*9 - 2);

        this.addChild(game.UI.popupMgr);
        this.addChild(game.UI.monitor);
    }
});

//
// ─── POPUP TEXT MANAGER ─────────────────────────────────────────────────────────
//

game.UI.PopupTextManager = me.Renderable.extend ({
    /**
     * constructor
     */
    init: function(x, y) {

        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [0, 0, me.game.viewport.width, me.game.viewport.height]);
        this.anchorPoint.set(0, 0);

        this.alwaysUpdate = true;
        this.floating = true;

        this.font = {};
        
        this.font['FixedSys'] = new me.BitmapFont(me.loader.getBinary('FixedSys'), me.loader.getImage('FixedSys'));
        this.font['FixedSys'].set("center");

        // this.font['Arial'] = new me.Font("Arial", 8, "#ffffff", "center");

        this.textList = new Set();
    },

    addText: function({
        text = "test",
        time = 1.0, // lifespan (sec)
        velX = 0, // direction
        velY = -256, // jumping speed
        accX = 0.0,   // gravity
        accY = 512,// gravity
        posX = game.data.width / 2.0,
        posY = game.data.height / 2.0,
        color = new me.Color(1, 1, 1, 1),
        fontFamily = "FixedSys",
        // fontFamily = "Arial",
    } = {})
    {
        var textObj = {
            text: text,
            timeRemain: time,
            color: color,
            alpha: 1.0,
            posX: posX * game.data.ppu,
            posY: posY * game.data.ppu,
            velX: velX * game.data.ppu,
            velY: velY * game.data.ppu,
            accX: accX * game.data.ppu,
            accY: accY * game.data.ppu,
            fontFamily: fontFamily,
        };

        this.textList.add(textObj);
    },

    /**
     * update function
     */
    update : function () 
    {
        for (let txt of this.textList)
        {
            txt.timeRemain -= me.timer.getDeltaSec();

            if(txt.timeRemain < 0)
            {
                this.textList.delete(txt);
                continue;
            }

            txt.posX += txt.velX * me.timer.getDeltaSec();
            txt.posY += txt.velY * me.timer.getDeltaSec();

            txt.velX += txt.accX * me.timer.getDeltaSec();
            txt.velY += txt.accY * me.timer.getDeltaSec();

            txt.alpha = (txt.timeRemain > 1 ? 1 : txt.timeRemain);
        }

        return true;
    },

    /**
     * draw the text
     */
    draw : function (context) 
    {
        for (let txt of this.textList)
        {
            // this.font[txt.fontFamily].fillStyle = txt.color;
            // this.font[txt.fontFamily].setFont("Arial", 10, txt.color);

            this.font[txt.fontFamily].draw(context, txt.text, txt.posX, txt.posY);
        }        
    }
});

game.UI.BattleMonitor = me.Renderable.extend
({
    init: function(x, y) 
    {
        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [x, y, 100, 12 * 9 + 2]);
        this.anchorPoint.set(0, 0);

        this.alwaysUpdate = true;
        this.floating = true;

        this.font = {};
        
        this.font = new me.BitmapFont(me.loader.getBinary('SmallFont'), me.loader.getImage('SmallFont'));
        this.font.set("left");
    },

    update: function(dt)
    {
        game.data.monitor.update(dt);
    },

    draw: function(context)
    {
        var color = context.getColor();

        context.setColor('#333333');
        context.fillRect(this.pos.x, this.pos.y, 100, 12 * 9 + 2);
        context.setColor('#ffc477');

        // var dmgList = game.data.monitor.getDamageList();
        // this.font.draw(context, "Total Damage:", this.pos.x + 2, this.pos.y + 2);

        var dmgList = game.data.monitor.getDPSList();
        this.font.draw(context, "DPS:", this.pos.x + 2, this.pos.y + 2);

        for(var i = 0; i < dmgList.length; i++)
        {
            this.font.draw(context, dmgList[i].player.data.name + ": " + dmgList[i].dmg.toLocaleString(), this.pos.x + 2, this.pos.y + 12 * i + 14);
            context.fillRect(this.pos.x + 2, this.pos.y + 12 * i + 22, 96 * dmgList[i].dmg / dmgList[0].dmg, 1);
        }
        context.setColor(color);
    }
})
