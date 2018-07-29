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

        game.UI.damageMonitor = new game.UI.BattleMonitor(me.game.viewport.width - 100, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getDamageList.bind(game.data.monitor),
            title: "Damage Done",
        });

        game.UI.healMonitor = new game.UI.BattleMonitor(me.game.viewport.width - 200, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getHealList.bind(game.data.monitor),
            title: "Heal Done",
        });

        this.addChild(game.UI.popupMgr);
        this.addChild(game.UI.damageMonitor);
        this.addChild(game.UI.healMonitor);
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
    init: function(x, y, settings)
    {
        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [x, y, 100, 12 * 9 + 2]);
        this.anchorPoint.set(0, 0);

        this.alwaysUpdate = true;
        this.floating = true;

        this.grabFunction = settings.grabFunction || game.data.monitor.getDPSList.bind(game.data.monitor);
        this.title = settings.title || "DPS";

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

        var dataList = this.grabFunction();
        this.font.draw(context, this.title + ":", this.pos.x + 2, this.pos.y + 2);

        var maxLength = 0;
        for(var i = 0; i < dataList.length; i++)
        {
            maxLength = Math.max(maxLength, dataList[i].length);
        }

        for(var i = 0; i < dataList.length; i++)
        {
            this.font.draw(context, dataList[i].player.data.name + ": " + dataList[i].number.toLocaleString(), this.pos.x + 2, this.pos.y + 12 * i + 14);

            var pxOffset = 0, sliceLength = 0;
            for(var j = 0; j < dataList[i].slices.length; j++)
            {
                context.setColor(dataList[i].colors[j]);

                sliceLength = Math.floor(96 * dataList[i].slices[j] / maxLength);
                context.fillRect(this.pos.x + pxOffset + 2, this.pos.y + 12 * i + 22, sliceLength, 1);

                pxOffset += sliceLength;
            }
        }
        context.setColor(color);
    }
})
