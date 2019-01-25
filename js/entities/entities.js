game.playerSpawnPoint = me.Entity.extend
({
    init:function (x, y, settings) 
    {
        this._super(me.Entity, 'init', [x, y, settings]);

        settings.anchorPoint = new me.Vector2d(0.5, 0.5);
        this.spawnCount = settings.spawnCount || 1;

        this.origin = new me.Vector2d(x, y);

        for(var i = 0; i < this.spawnCount; i++)
        {
            // TODO: spawn them in a circle sprasely
            var spawnPos = this.origin.clone().add(new me.Vector2d(game.data.playerSparse + game.data.playerSparseInc * this.spawnCount, 0).rotate(i / this.spawnCount * 2 * Math.PI));
            settings.backendData = game.data.backend.getPlayerList()[i];
            settings.isPlayer = true;
            settings.image = settings.backendData.image;

            game.data.backend.getPlayerList()[i].parentMob = me.game.world.addChild(new settings.backendData.mobPrototype(spawnPos.x, spawnPos.y, settings), settings.z);
        }

        // debug
        // Display the menu
        document.getElementById("pause_menu").style.display = "flex";

        // Set a "higher priority" pause
        game.menu.wakeupMenu();
        me.state.pause(true);
    },

    update: function(dt)
    {
        me.game.world.removeChild(this);
        return true;
    },
});

game.Utils = game.Utils || {};

game.Utils.TestHPBarRenderable = me.Renderable.extend
({
    init : function (parent) 
    {
        this.HPBarParent = parent;
        this._super(me.Renderable, "init", [0, 0, game.Utils.TestHPBar.width, game.Utils.TestHPBar.height]);
    },
    destroy : function () {},
    draw : function (renderer) 
    {
        var color = renderer.getColor();
        
        // Background
        renderer.setColor('#606060');
        renderer.fillRect(0, 0, this.width, this.height);
        
        // HP
        renderer.setColor('#ff4c4c');
        renderer.fillRect(0, 0, this.width * Math.max(this.HPBarParent.percentage, 0), this.height);

        renderer.setColor(color);
    }
})

// Could it added directly in entity.child as a renderable ?
game.Utils.TestHPBar = me.Entity.extend
({
    init : function(x, y, mob)
    {
        this.relativePos = new me.Vector2d(x, y);
        this.relativePos.x -= game.Utils.TestHPBar.width / 2;

        var tmpPos = mob.getRenderPos(0.5, 0.0);
        x = tmpPos.x + x;
        y = tmpPos.y + y;

        this._super(me.Entity, "init", [x, y, {width: game.Utils.TestHPBar.width, height: game.Utils.TestHPBar.height, anchorPoint: new me.Vector2d(0.5, 0.5)}]);
        
        // this.body.anchorPoint.set(0.5, 0.5);
        // this.renderable.anchorPoint.set(0.5, 0.5);
        this.z = mob.pos.z;
        this.body.collisionType = me.collision.types.NO_OBJECT;
        this.mob = mob;
        this.percentage = this.mob.data.currentHealth / this.mob.data.maxHealth;

        this.renderable = new game.Utils.TestHPBarRenderable(this);
    },

    update: function(dt)
    {
        this.percentage = this.mob.data.currentHealth / this.mob.data.maxHealth;

        this.pos = this.mob.getRenderPos(0.5, 0.0).clone().add(this.relativePos);

        this._super(me.Entity, 'update', [dt]);
        return true;
    }
});

game.Utils.TestHPBar.width = 32;
game.Utils.TestHPBar.height = 2;

game.Utils.logicalEntity = me.Renderable.extend
({
    init : function(settings)
    {
        this._super(me.Renderable, "init", [0, 0, 0, 0]);
        this.alwaysUpdate = true;
    },

    update: function(dt)
    {
        game.units.update(dt);
        return true;
    }
});

game.testIcyZone = me.Entity.extend({
    init:function (x, y, settings) 
    {
        this._super(me.Entity, 'init', [x, y, settings]);
        this.body.collisionType = game.collisionTypes.AREA_EFFECT;
    },

    update: function (dt) 
    {
        me.collision.check(this);
    },

    onCollision: function (response, other)
    {
        if(typeof other.receiveBuff !== "undefined" && other.data.buffList.size == 0)
        {
            other.receiveBuff({source: this, buff: new IceSlowed({time: 2.0})});
        }

        return false;
    }
});

//
// ─── SCENE OBJECTS ──────────────────────────────────────────────────────────────
//

game.sceneObject = game.sceneObject || {};

// Spawn some collectable objects when clicked
game.sceneObject.clickCollect = me.Entity.extend
({
    init: function(x, y, settings)
    {
        settings.image = "SO_shinePoint";
        settings.framewidth = 32;
        settings.frameheight = 32;

        this._super(me.Entity, 'init', [x, y, settings]);

        this.isLocked = settings.isLocked || false;
        this.keyType = settings.keyType || "None";
        this.maxAmount = settings.maxAmount || 1;
        this.minAmount = settings.minAmount || 0;
        this.typeCount = settings.typeCount || 0;

        this.spawnRange = settings.spawnRange || 30;

        this.types = [];
        this.totalWeight = 0.0;

        // no types in settings
        if(this.typeCount == 0)
        {
            this.types.push({name: "unknown", weight: 1.0});
            this.totalWeight = 1.0;
        }
        // else read from settings
        else
        {
            for(var i = 0; i < this.typeCount; i++)
            {
                this.types.push({
                    name: settings['type' + i] || "unknown",
                    weight: settings['weight' + i] || 1.0
                });

                this.totalWeight += settings['weight' + i] || 1.0;
            }
        }

        this.renderable.addAnimation("idle", game.helper.genAnimFrames(0, 60), 16);
        this.renderable.setCurrentAnimation("idle");

        me.input.registerPointerEvent('pointerdown', this, this.pointerDown.bind(this));
    },

    pointerDown: function(pointer)
    {
        console.log("You clicked the scene object!");

        var totalNum = Math.floor(Math.random() * (this.maxAmount - this.minAmount + 1)) + this.minAmount;
        var spawnAngle = 0.0;

        for(var i = 0; i < totalNum; i++)
        {
            var randomSeed = Math.random();
            var randomSum = 0.0;
            for(var type of this.types)
            {
                if(randomSeed < randomSum + (type.weight / this.totalWeight))
                {
                    // WHY IT (loot objects) CANNOT SHOW (RENDER) PROPERLY AFTER UPDATING CHROME 70.0????????????????????????????????????????????????????????????????
                    // If we change mobs.js:425 from:
                    // this.HPBar = me.game.world.addChild(new game.Utils.TestHPBar(0, -10, this), 100);
                    // to
                    // this.HPBar = me.game.world.addChild(new game.Utils.TestHPBar(0, -10, this));
                    // Then the loot object would not show properly.
                    // WHY?????

                    // This type!
                    console.log(game.data.itemList[type.name]);
                    var loot = me.pool.pull("loot", this.pos.x + Math.cos(spawnAngle) * this.spawnRange, this.pos.y + Math.sin(spawnAngle) * this.spawnRange, {item: type.name});
                    me.game.world.addChild(loot, 100);
                    break;
                }
                else
                {
                    // Not this type.
                    randomSum += type.weight / this.totalWeight;
                }
            }

            spawnAngle += 2 * Math.PI / totalNum;
        }

        if(me.game.world.hasChild(this))
        {
            me.game.world.removeChild(this);
        }

        return false;
    },
});

game.sceneObject.lootRenderable = me.Renderable.extend
({
    init: function(x, y, settings)
    {
        this.image = game.data.itemList[settings.item].image;
        this.imagewidth = game.data.itemList[settings.item].width;
        this.imageheight = game.data.itemList[settings.item].height;
        this.framewidth = game.data.itemList[settings.item].framewidth;
        this.frameheight = game.data.itemList[settings.item].frameheight;
        this.imageGridCount = Math.floor(this.imagewidth / this.framewidth);
        this.item = settings.item;

        this._super(me.Renderable, 'init', [x, y, this.framewidth, this.frameheight]);
    },

    draw: function(context)
    {
        var color = context.getColor();

        if(game.data.itemList[this.item].tint === true)
        {
            context.setColor(game.data.itemList[this.item].color);
        }
        else
        {
            context.setColor("#ffffff");
        }

        context.drawImage(
            me.loader.getImage(this.image), 
            game.data.itemList[this.item].iconIdx % this.imageGridCount * this.framewidth, //sx
            Math.floor(game.data.itemList[this.item].iconIdx / this.imageGridCount) * this.frameheight, //sy
            this.framewidth, //sw
            this.frameheight, //sh
            this.pos.x, this.pos.y, this.framewidth, this.frameheight // dx, dy, dw, dh
        );

        context.setColor(color);
    },
})

game.sceneObject.loot = me.Entity.extend
({
    init: function(x, y, settings)
    {
        this.image = game.data.itemList[settings.item].image;
        this.imagewidth = game.data.itemList[settings.item].width;
        this.imageheight = game.data.itemList[settings.item].height;
        this.framewidth = game.data.itemList[settings.item].framewidth;
        this.frameheight = game.data.itemList[settings.item].frameheight;
        this.imageGridCount = Math.floor(this.imagewidth / this.framewidth);

        settings.image = this.image;
        settings.width = this.framewidth;
        settings.height = this.frameheight;

        this._super(me.Entity, 'init', [x, y, settings]);

        this.item = settings.item;
        this.renderable.item = this.item;

        // this.renderable.addAnimation("idle", [game.data.itemList[this.item].iconIdx]);
        // this.renderable.setCurrentAnimation("idle");

        me.input.registerPointerEvent('pointerdown', this, this.pointerDown.bind(this));

        //TODO: Hover to show toolTip.

        this.renderable = new game.sceneObject.lootRenderable(0, 0, settings);
    },

    pointerDown: function(pointer)
    {
        console.log(game.data.itemList[this.item]);

        game.data.backend.inventory.addItem(this.item);
        
        if(me.game.world.hasChild(this))
        {
            me.game.world.removeChild(this);
        }

        return false;
    },
});
