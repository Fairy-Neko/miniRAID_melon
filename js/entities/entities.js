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
            var spawnPos = this.origin.clone().add(new me.Vector2d(game.data.playerSparse, 0).rotate(i / this.spawnCount * 2 * Math.PI));
            settings.backendData = game.data.backend.getPlayerList()[i];
            settings.isPlayer = true;
            settings.image = settings.backendData.image;
            me.game.world.addChild(new settings.backendData.mobPrototype(spawnPos.x, spawnPos.y, settings), settings.z);
        }
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
        renderer.fillRect(0, 0, this.width * this.HPBarParent.percentage, this.height);

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
