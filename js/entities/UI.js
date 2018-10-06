/**
 * a UI container and child items
 */

// This is In-Game UI, instead of HTML based Out-game UI

game.UI = game.UI || {};

game.UI.Container = me.Container.extend
({
    init: function() 
    {
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

        game.UIManager = this;

        // add our child score object at the top left corner
        game.UI.popupMgr = new game.UI.PopupTextManager(0, 0);

        game.UI.damageMonitorS = new game.UI.BattleMonitor(me.game.viewport.width - 320, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getDPSList.bind(game.data.monitor),
            title: "Damage Per Sec",
        });

        game.UI.healMonitorS = new game.UI.BattleMonitor(me.game.viewport.width - 420, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getHPSList.bind(game.data.monitor),
            title: "Heal Per Sec",
        });

        game.UI.damageMonitor = new game.UI.BattleMonitor(me.game.viewport.width - 100, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getDamageList.bind(game.data.monitor),
            title: "Damage Done",
        });

        game.UI.healMonitor = new game.UI.BattleMonitor(me.game.viewport.width - 200, me.game.viewport.height - 12*9 - 2, {
            grabFunction: game.data.monitor.getHealList.bind(game.data.monitor),
            title: "Heal Done",
        });

        game.UI.raidFrame = new game.UI.raidFrame(20, 20, {
            grabFunction: game.data.backend.getPlayerList.bind(game.data.backend),
            title: "raid frame",
        });

        game.UI.unitFrameSlots = new game.UI.unitFrameSlots();
        
        this.addChild(game.UI.damageMonitor);
        this.addChild(game.UI.damageMonitorS);
        this.addChild(game.UI.healMonitor);
        this.addChild(game.UI.healMonitorS);
        this.addChild(game.UI.raidFrame);
        this.addChild(game.UI.unitFrameSlots);
        this.addChild(game.UI.popupMgr);

        game.UI.selectingRect = new game.UI.ColoredRect({
            borderColor: new me.Color(0, 255, 0, 1),
            fillColor: new me.Color(0, 255, 0, 0.1),
        });
        this.addChild(game.UI.selectingRect);

        // Get the toolTip object
        this.toolTip = {};
        this.toolTip.toolTip = document.getElementById("tooltip");
        this.toolTip.title = this.toolTip.toolTip.querySelector("#title");
        this.toolTip.body = this.toolTip.toolTip.querySelector("#body");

        // Bind menu key
        me.input.bindKey(me.input.KEY.ESC, "menu");
        this.pauseMenu = document.getElementById("pause_menu");

        // Prevent auto un-pause when lose and re-get window focus.
        game.paused = false;
        me.state.onResume = function()
        {
            if(game.paused == true)
            {
                me.state.pause(true);
            }
        }
    },

    update(dt)
    {
        this._super(me.Container, 'update', [dt]);

        if(game.ignorePause === true)
        {
            // Prevent re-pausing while user still holding the escape key
            if(me.input.keyStatus("menu") === false)
            {
                game.ignorePause = false;
            }
        }
        else
        {
            if(me.input.isKeyPressed('menu'))
            {
                // Display the menu
                this.pauseMenu.style.display = "flex";

                // Set a "higher priority" pause
                game.menu.wakeupMenu();
                me.state.pause(true);
            }
        }

        game.data.monitor.update(dt);
    },

    // You can use any HTML in title and bodytext.
    // See index.html: body > #screen > #UI > #toolTip.
    showToolTip({
        titleColor = "#ffffff",
        title = "Title",
        bodyText = "toolTip",
    })
    {
        // change text
        this.toolTip.title.innerHTML = title;
        this.toolTip.body.innerHTML = bodyText;

        // change color
        this.toolTip.title.style.color = titleColor;

        // set it visible
        this.toolTip.toolTip.style.display = "inherit";
    },

    hideToolTip()
    {
        // set it invisible
        this.toolTip.toolTip.style.display = "none";
    },
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
        
        this.font['PixelFont'] = new me.BitmapFont(me.loader.getBinary('PixelFont'), me.loader.getImage('PixelFont'));
        this.font['PixelFont'].set("center");

        // this.font['Arial'] = new me.Font("Arial", 12, "#ffffff", "center");

        this.textList = new Set();
    },

    addText: function({
        text = "test",
        time = 1.0, // lifespan (sec)
        velX = -64, // direction
        velY = -256, // jumping speed
        accX = 0.0,   // gravity
        accY = 512,// gravity
        posX = game.data.width / 2.0,
        posY = game.data.height / 2.0,
        color = new me.Color(1, 1, 1, 1),
        fontFamily = "PixelFont",
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

            // delete me!(x
            // txt.posX += Math.sin(16 * Math.PI * txt.timeRemain) / (txt.timeRemain - 0.4) / 8;

            txt.alpha = txt.timeRemain;
        }

        return true;
    },

    /**
     * draw the text
     */
    draw : function (context) 
    {
        context.save();

        for (let txt of this.textList)
        {
            // Do not use standard Font in WebGL Renderer !!!

            // this.font[txt.fontFamily].setFont("Arial", 18, txt.color);
            // this.font[txt.fontFamily].lineWidth = 1;

            // TODO: We need a outlined bitmap Font !
            context.setColor(txt.color);
            context.setGlobalAlpha(txt.alpha);

            this.font[txt.fontFamily].draw(context, txt.text, txt.posX, txt.posY);

            // this.font[txt.fontFamily].drawStroke(context, txt.text, txt.posX, txt.posY);
        }        

        context.restore();
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
    },

    draw: function(context)
    {
        context.save();

        context.setColor('#333333');
        context.fillRect(this.pos.x, this.pos.y, 100, 12 * 9 + 2);

        var dataList = this.grabFunction();

        context.setColor('#ffffff');
        this.font.draw(context, this.title + ":", this.pos.x + 2, this.pos.y + 2);

        var maxLength = 0;
        for(var i = 0; i < dataList.length; i++)
        {
            maxLength = Math.max(maxLength, dataList[i].length);
        }

        if(maxLength <= 0 || isNaN(maxLength))
        {
            context.restore();
            return;
        }

        for(var i = 0; i < dataList.length; i++)
        {
            context.setColor('#ffffff');
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

        context.restore();
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

        // size of each grid (inner size, without outline)
        this.gridWidth = settings.gridWidth || 127;
        this.gridHeight = settings.gridHeight || 43;

        this.gapHeight = settings.gapHeight || 25;
        // calculated outlined size (single-sided outline)
        this.outlinedGridWidth = this.gridWidth + 1;
        this.outlinedGridHeight = this.gridHeight + this.gapHeight + 2;

        // max count of buffs that can show in a row
        this.buffsPerRow = settings.buffsPerRow || 20;

        // buffs pivot position
        this.buffsPivotX = settings.buffsPivotX || -1;
        this.buffsPivotY = settings.buffsPivotY || 45;

        // size of the buff (without outline)
        this.buffIconSize = settings.buffIconSize || 16;
        this.outlinedIconSize = this.buffIconSize + 2;

        this.font = {};
        
        this.font = new me.BitmapFont(me.loader.getBinary('SmallFont'), me.loader.getImage('SmallFont'));
        this.font.set("left");

        this.alpha = 0.9;

        this.cacheHealth = [0,0,0,0,0,0,0,0];
        this.cacheMana = [0,0,0,0,0,0,0,0];

        me.input.registerPointerEvent("pointermove", me.game.viewport, this.onPointerMove.bind(this));
        me.input.registerPointerEvent("pointerdown", me.game.viewport, this.onPointerDown.bind(this));
        this.prevBuffId = -1;
    },

    update: function(dt)
    {
        
    },

    draw: function(context)
    {
        context.save();

        this.dataList = this.grabFunction();

        for(var i = 0; i < this.dataList.length; i++)
        {
            //smooth the hp change
            if(Math.abs(this.cacheHealth[i] - this.dataList[i].currentHealth) < 3)
            {
                this.cacheHealth[i] = this.dataList[i].currentHealth;
            }
            else
            {
                this.cacheHealth[i] = (4 * this.cacheHealth[i] + this.dataList[i].currentHealth) / 5;
            }

            //smooth the mp change
            if(Math.abs(this.cacheMana[i] - this.dataList[i].currentMana) < 3)
            {
                this.cacheMana[i] = this.dataList[i].currentMana;
            }
            else
            {
                this.cacheMana[i] = (this.cacheMana[i] + 2 * this.dataList[i].currentMana) / 3;
            }

            // Black background
            context.setColor('#222222');
            context.fillRect(this.pos.x, this.pos.y + this.outlinedGridHeight * i, this.outlinedGridWidth + 1, this.outlinedGridHeight - this.gapHeight);

            // Draw a white border if the player is in control
            if(this.dataList[i].inControl)
            {
                context.setColor('#FFFFFF');
                context.fillRect(this.pos.x, this.pos.y + this.outlinedGridHeight * i, this.outlinedGridWidth + 1, this.outlinedGridHeight - this.gapHeight);
            }

            // Dont draw anything so the white border will not be overlaped
            // else
            // {
            //     context.setColor('#222222');
            // }
            
            // The background (deep green) rect
            context.setColor('#20604F');
            context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + 1, this.gridWidth, this.gridHeight);
        }

        for(var i = 0; i < this.dataList.length; i++)
        {
            if(this.dataList[i].alive)
            {
                var sliceLength = 0;

                // Health bar (Big & High green one)
                context.setColor('#1B813E');
                sliceLength = Math.floor((this.gridWidth - 1) * this.cacheHealth[i] / this.dataList[i].maxHealth);
                context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + 1, sliceLength + 1, this.gridHeight - 9);

                // Line between Health and Mana Bar
                context.setColor('#222222');
                context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 9, this.gridWidth, 1);

                // Mana bar (Small & Short light blue one)
                // It height was fixed at 3
                context.setColor('#33A6B8');
                sliceLength = Math.floor((this.gridWidth - 1) * this.cacheMana[i] / this.dataList[i].maxMana);
                context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 8, sliceLength + 1, 9);

                // TODO: CASTING BAR
                if(this.dataList[i].inCasting)
                {
                    // TODO: Custom spell cast bar color
                    context.setColor('#6d6d6d');
                    context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 12, this.gridWidth, 3)

                    context.setColor('#ff91d8');
                    context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 12, 
                        (1 - this.dataList[i].castRemain / this.dataList[i].castTime) * (this.gridWidth), 3);
                    
                    context.setColor('#ffffff');
                    this.font.set("right");
                    this.font.draw(context, this.dataList[i].currentSpell.name, this.pos.x + this.gridWidth, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 20);
                    this.font.set("left");
                }

                if(this.dataList[i].inChanneling)
                {
                    // TODO: Custom spell cast bar color
                    context.setColor('#6d6d6d');
                    context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 12, this.gridWidth, 3)

                    context.setColor('#dcff96');
                    context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 12, 
                        (this.dataList[i].channelRemain / this.dataList[i].channelTime) * (this.gridWidth), 3);
                    
                    context.setColor('#ffffff');
                    this.font.set("right");
                    this.font.draw(context, this.dataList[i].currentSpell.name, this.pos.x + this.gridWidth, this.pos.y + this.outlinedGridHeight * i + this.gridHeight - 20);
                    this.font.set("left");
                }

                // Left-upper corner white block = has been targeted
                if(this.dataList[i].beingAttack)
                {
                    context.setColor('#FFFFFF');
                    context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + 1, 10, 10);
                }

                // Right-upper corner white block = has priority on heal
                if(this.dataList[i].healPriority)
                {
                    context.setColor('#FFFFFF');
                    context.fillRect(this.pos.x + this.gridWidth - 9, this.pos.y + this.outlinedGridHeight * i + 1, 10, 10);
                }

                // Draw the buffs
                var buffNum = 0;
                var tmpBuffPivotX = this.pos.x + this.buffsPivotX;
                var tmpBuffPivotY = this.pos.y + this.outlinedGridHeight * i + this.buffsPivotY;
                
                // TODO: should we delete buffList and use listenerList instead ? ... (maybe not though)
                // for(let buff of this.dataList[i].buffList.values())
                for(let buff of this.dataList[i].buffList.values())
                {
                    // All the grids moved up by 1 px cause we have the bottom outline (y -= 1)

                    // Draw the very bottom outline of buffs (by draw 1px more than other grids)
                    // And the very right outline of buffs (every row ends and the list ends)
                    var xAdd = 0;
                    var yAdd = 0;

                    //Buff color
                    var localcolor = new me.Color();
                    localcolor.parseHex(buff.color);

                    // Outline rect
                    context.setColor(localcolor.darken(0.7));
                    context.fillRect(
                        tmpBuffPivotX + this.outlinedIconSize * (buffNum % this.buffsPerRow) + 1, 
                        tmpBuffPivotY + this.outlinedIconSize * Math.floor(buffNum / this.buffsPerRow), 
                        this.outlinedIconSize + xAdd, 
                        this.outlinedIconSize + yAdd);

                    // Background filling rect
                    context.setColor(localcolor.lighten(0.2));
                    context.fillRect(
                        tmpBuffPivotX + this.outlinedIconSize * (buffNum % this.buffsPerRow) + 2, 
                        tmpBuffPivotY + this.outlinedIconSize * (Math.floor(buffNum / this.buffsPerRow)) + 1, 
                        this.buffIconSize, 
                        this.buffIconSize);

                    // Timer rect
                    context.setColor(localcolor.lighten(0.2));
                    context.fillRect(
                        tmpBuffPivotX + this.outlinedIconSize * (buffNum % this.buffsPerRow) + 2, 
                        tmpBuffPivotY + this.outlinedIconSize * (Math.floor(buffNum / this.buffsPerRow)) + 1, 
                        this.buffIconSize * (buff.timeRemain / buff.timeMax), 
                        this.buffIconSize);

                    // Draw the buff name with seperate textline
                    // TODO: maybe '\n' works here ?
                    // context.setColor('#EFCDEF');
                    // this.font.draw(
                    //     context, 
                    //     buff.name.slice(0, 4), 
                    //     tmpBuffPivotX + this.outlinedIconSize * (buffNum % this.buffsPerRow) + 2, 
                    //     tmpBuffPivotY + this.outlinedIconSize * Math.floor(buffNum / this.buffsPerRow) + 1);

                    // this.font.draw(
                    //     context, 
                    //     buff.name.slice(4, 8), 
                    //     tmpBuffPivotX + this.outlinedIconSize * (buffNum % this.buffsPerRow) + 2, 
                    //     tmpBuffPivotY + this.outlinedIconSize * Math.floor(buffNum / this.buffsPerRow) + 10);
                    
                    // Draw the stack count
                    context.setColor('#FFFFFF');
                    this.font.draw(
                        context,
                        buff.stacks,
                        tmpBuffPivotX + this.outlinedIconSize * (buffNum % this.buffsPerRow) + 2, 
                        tmpBuffPivotY + this.outlinedIconSize * Math.floor(buffNum / this.buffsPerRow) + 10);

                    buffNum++;
                }
            }
            else
            {
                // Draw a red rect for dead players
                context.setColor('#CB4042');

                // Should this fulfill the target area ?
                // context.fillRect(this.pos.x + 64 * i + 1, this.pos.y + 1, 49, 38);
                context.fillRect(this.pos.x + 1, this.pos.y + this.outlinedGridHeight * i + 1, this.gridWidth, this.gridHeight);
            }

            context.setColor('#ffffff');
            
            // Show a part of player name (should be full name after testing)
            this.font.draw(context, this.dataList[i].name, this.pos.x + 2, this.pos.y + this.outlinedGridHeight * i + 16);

            // Player HP
            this.font.draw(context, this.dataList[i].currentHealth + "/" + this.dataList[i].maxHealth, this.pos.x + 2, this.pos.y + this.outlinedGridHeight * i + 23);

            // Player Mana
            this.font.draw(context, Math.round(this.dataList[i].currentMana) + "/" + this.dataList[i].maxMana, this.pos.x + 2, this.pos.y + this.outlinedGridHeight * i + 35);
            
        }

        context.restore();
    },

    onPointerMove(pointer)
    {
        if(typeof this.dataList === "undefined")
        {
            return true;
        }

        var buffFrameX = pointer.gameX - this.pos.x - this.buffsPivotX;
        var buffFrameY = pointer.gameY - this.pos.y - this.buffsPivotY;

        playerIdx = Math.floor(buffFrameY / this.outlinedGridHeight);
        buffFrameY = buffFrameY - playerIdx * this.outlinedGridHeight;

        var buffId = 0;

        if(buffFrameX >= 0 && buffFrameX <= this.outlinedIconSize * this.buffsPerRow)
        {
            buffId = Math.floor(buffFrameX / this.outlinedIconSize) + Math.floor(buffFrameY / this.outlinedIconSize) * this.buffsPerRow;
        }
        else
        {
            buffId = -1;
        }

        // console.log("player: " + playerIdx + "buff: " + buffId);

        // test
        if(playerIdx < 0 || playerIdx >= this.dataList.length || buffId >= this.dataList[playerIdx].buffList.size || buffId == -1)
        {
            this.prevBuffId = -1;
            game.UIManager.hideToolTip();

            return true;
        }

        if(buffId !== this.prevBuffId)
        {
            this.prevBuffId = buffId;

            // need more great ways ?
            var buff = [...this.dataList[playerIdx].buffList][buffId];

            buff.showToolTip();
        }

        return true;
    },

    onPointerDown(pointer)
    {
        var buffFrameX = pointer.gameX - this.pos.x;
        var buffFrameY = pointer.gameY - this.pos.y;

        playerIdx = Math.floor(buffFrameY / this.outlinedGridHeight);
        buffFrameY = buffFrameY - playerIdx * this.outlinedGridHeight;

        if( buffFrameX >= 0 && buffFrameY >= 0 && 
            buffFrameX <= this.outlinedGridWidth + 1 && buffFrameY <= this.outlinedGridHeight - this.gapHeight)
        {
            if(this.dataList[playerIdx].alive)
            {
                this.dataList.forEach(function(e, i){ e.inControl = false; });
                this.dataList[playerIdx].inControl = true;
            }
            return false;
        }

        return true;
    },
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

game.UI.unitFrameSlots = me.Container.extend
({
    init: function() 
    {
        // call the constructor
        this._super(me.Container, 'init');

        this.anchorPoint.set(0, 0);

        // persistent across level change
        this.isPersistent = true;

        // make sure we use screen coordinates
        this.floating = true;
        this.z = Infinity;

        // give a name
        this.name = "spell slot";
        this.slots = [];

        // No more IOCCC lol
        for(var i = 0; i < 8; i++)
        {
            var settings = {};
            settings.id = i;
            this.slots[settings.id] = new game.UI.slot(12, 70 * i + 29, settings);
            this.addChild(this.slots[settings.id]);

            this.addChild(new game.UI.WeaponIcons({id: i}));
            this.addChild(new game.UI.WeaponSwitchButton(193, 70 * i + 29 + 14, {id: i}));
        }
    }
});

game.UI.slot = me.GUI_Object.extend(
{
    init:function (x, y, settings)
    {
        settings.image = "healButton";
        settings.framewidth = 16;
        settings.frameheight = 16;
        this.id = settings.id;
        this._super(me.GUI_Object, "init", [x, y, settings]);

        this.pos.z = 4;
    },

    onClick:function (event)
    {
        //test button
        //delete me!
        game.UI.popupMgr.addText({
            // text: "The head of the hospital is a swindler!",
            text: "Delete me!", // lol.
            color: "#ff0000",
            posX: this.pos.x,
            posY: this.pos.y - 30,
            velX: 0,
        });

        this.player = game.units.getPlayerListWithDead()[this.id];

        // TODO: add a parent in player data ...? (be careful for loop reference and GC)
        // this.playerData = game.data.backend.getPlayerList()[this.id];

        if(this.player.data.alive){
            this.player.data.currentHealth = this.player.data.maxHealth;
            this.player.data.currentMana = this.player.data.maxMana;

            this.player.data.healPriority = !this.player.data.healPriority;
            
            // TODO: should the source of a raid skill be a global mob!

            // a raid skill source should be one of the player characters.
            // e.g. bloodlust's target is shamans etc. (no shaman though)
            // When user adding skills to global raid skill slots, 
            // they add them from each character, so we know the actual source.

            this.player.receiveBuff({
                source: this.player, 
                buff: new game.Buff.Bloodlust({time: 15.0}), 
                popUp: true
            });
        }
        return false;
    }
});

game.UI.WeaponIcons = me.Renderable.extend
({
    init: function(settings)
    {
        this.weaponIconSize = settings.iconSize || 32;
        this.weaponIconGap = settings.iconGap || 20;

        this.pivotX = settings.pivotX || 150;
        this.pivotY = settings.pivotY || 26;
        this.multiplierY = settings.multiplierY || 70;

        this.imageSize = settings.imageSize || 512;
        this.imageGrid = settings.imageGrid || 32;
        this.imageGridCount = this.imageSize / this.imageGrid;

        this.image = settings.image || "Weapon_icon_32x32";
        settings.image = this.image;
        settings.width = this.imageSize;
        settings.height = this.imageSize;

        this.id = settings.id;

        this._super(me.Renderable, 'init', [this.pivotX, this.pivotY + this.id * this.multiplierY, this.weaponIconSize * 2 + this.weaponIconGap, this.weaponIconSize]);
        this.anchorPoint.set(0, 0);

        this.alwaysUpdate = true;
        this.floating = true;
    },

    draw: function(context)
    {
        this.player = game.units.getPlayerListWithDead()[this.id];
        this.weaponFront = this.player.data.currentWeapon;
        this.weaponBack = this.player.data.anotherWeapon;

        var color = context.getColor();

        context.setColor(this.weaponFront.color);
        context.drawImage(
            me.loader.getImage(this.image), 
            // this.image, 
            this.weaponFront.iconIdx % this.imageGridCount * this.imageGrid, //sx
            Math.floor(this.weaponFront.iconIdx / this.imageGridCount) * this.imageGrid, //sy
            this.imageGrid, //sw
            this.imageGrid, //sh
            this.pos.x, this.pos.y, this.imageGrid, this.imageGrid // dx, dy, dw, dh
        );

        if(typeof this.weaponBack !== "undefined")
        {
            context.setColor(this.weaponBack.color);
            context.drawImage(
                me.loader.getImage(this.image), 
                // this.image, 
                this.weaponBack.iconIdx % this.imageGridCount * this.imageGrid, //sx
                Math.floor(this.weaponBack.iconIdx / this.imageGridCount) * this.imageGrid, //sy
                this.imageGrid, //sw
                this.imageGrid, //sh
                this.pos.x + this.weaponIconSize + this.weaponIconGap, this.pos.y, this.imageGrid, this.imageGrid // dx, dy, dw, dh
            );
        }

        context.setColor(color);
    },
});

game.UI.WeaponSwitchButton = me.GUI_Object.extend(
{
    init:function (x, y, settings)
    {
        // FIXME: another image !
        settings.image = "healButton";
        settings.framewidth = 16;
        settings.frameheight = 16;
        this.id = settings.id;
        this._super(me.GUI_Object, "init", [x, y, settings]);

        this.pos.z = 4;
    },

    onClick:function (event)
    {
        this.player = game.units.getPlayerListWithDead()[this.id];

        if(this.player.data.alive)
        {
            this.player.data.switchWeapon();
        }
        return false;
    }
});
