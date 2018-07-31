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
            grabFunction: game.data.monitor.getDPSList.bind(game.data.monitor),
            title: "Damage Per Sec",
        });

        game.UI.healMonitor = new game.UI.BattleMonitor(me.game.viewport.width - 200, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getHPSList.bind(game.data.monitor),
            title: "Heal Per Sec",
        });

        game.UI.raidFrame = new game.UI.raidFrame(300, me.game.viewport.height - 100, {
            grabFunction: game.data.backend.getPlayerList.bind(game.data.backend),
            title: "raid frame"
        })

        this.addChild(game.UI.popupMgr);
        this.addChild(game.UI.damageMonitor);
        this.addChild(game.UI.healMonitor);
        this.addChild(game.UI.raidFrame);

        game.UI.selectingRect = new game.UI.ColoredRect({
            borderColor: new me.Color(0, 255, 0, 1),
            fillColor: new me.Color(0, 255, 0, 0.1),
        });
        this.addChild(game.UI.selectingRect);
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
            // vv This cannot work vv
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

game.UI.raidFrame = me.Renderable.extend
({
    init: function(x, y, settings)
    {
        // call the parent constructor
        this._super(me.Renderable, 'init', [x, y, 320, 25]);
        this.anchorPoint.set(0, 0);

        this.alwaysUpdate = true;
        this.floating = true;

        this.grabFunction = settings.grabFunction || game.data.backend.getPlayerList.bind(game.data.backend);
        this.title = settings.title || "raid";

        this.font = {};
        
        this.font = new me.BitmapFont(me.loader.getBinary('SmallFont'), me.loader.getImage('SmallFont'));
        this.font.set("left");
    },

    update: function(dt)
    {
        
    },

    draw: function(context)
    {
        var color = context.getColor();

        context.setColor('#222222');
        context.fillRect(this.pos.x, this.pos.y, 401, 40);

        var dataList = this.grabFunction();

        for(var i = 0; i < dataList.length; i++)
        {
            context.setColor('#20604F');
            context.fillRect(this.pos.x + 50 * i + 1, this.pos.y + 1, 49, 38);
        }

        for(var i = 0; i < dataList.length; i++)
        {
            var sliceLength = 0;
            
            if(dataList[i].alive){
                context.setColor('#1B813E');
                sliceLength = Math.floor(48 * dataList[i].currentHealth / dataList[i].maxHealth);
                context.fillRect(this.pos.x + 50 * i + 1, this.pos.y + 1, sliceLength + 1, 38);
            }
            else
            {
                context.setColor('#CB4042');
                context.fillRect(this.pos.x + 50 * i + 1, this.pos.y + 1, 49, 38);
            }

            this.font.draw(context, dataList[i].name.slice(0, 4) + dataList[i].name.slice(-1), this.pos.x + 50 * i + 2, this.pos.y + 15);

        }
        context.setColor(color);
    }
});

game.UI.ColoredRect = me.Renderable.extend
({
    init: function(settings)
    {
        this._super(me.Renderable, "init", [0, 0, me.game.viewport.width, me.game.viewport.height]);

        this.anchorPoint.set(0, 0);
        this.floating = true;

        this.borderColor = settings.borderColor || new me.Color(0, 1, 0, 1);
        this.fillColor = settings.fillColor || new me.Color(0, 1, 0, 0.1);

        this.min = new me.Vector2d(0, 0);
        this.max = new me.Vector2d(100, 100);

        this.show = false;
    },

    draw: function(context)
    {
        if(this.show === true)
        {
            var color = context.getColor();

            context.setColor(this.borderColor);
            context.fillRect(this.min.x - 1, this.min.y - 1, this.max.x - this.min.x + 1, 1);
            context.fillRect(this.min.x - 1, this.min.y - 1, 1, this.max.y - this.min.y + 1);
            context.fillRect(this.min.x - 1, this.max.y + 1, this.max.x - this.min.x + 1, 1);
            context.fillRect(this.max.x + 1, this.min.y - 1, 1, this.max.y - this.min.y + 1);
    
            context.setColor(this.fillColor);
            context.fillRect(this.min.x, this.min.y, this.max.x - this.min.x, this.max.y - this.min.y);
    
            context.setColor(color);
        }
    },
});
