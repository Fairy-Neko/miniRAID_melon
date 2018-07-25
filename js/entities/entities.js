game.playerSpawnPoint = me.Entity.extend
({
    init:function (x, y, settings) 
    {
        this._super(me.Entity, 'init', [x, y, settings]);

        console.log("Settings:");
        console.log(settings);
        console.log(this);
        settings.anchorPoint = new me.Vector2d(0.5, 0.5);

        me.game.world.addChild(new game.PlayerMobs.test(x, y, settings), settings.z);
    },

    update: function(dt)
    {
        me.game.world.removeChild(this);
        return true;
    },
});

game.testIcyZone = me.Entity.extend({
    init:function (x, y, settings) 
    {
        this._super(me.Entity, 'init', [x, y, settings]);
    },

    update: function (dt) 
    {
        me.collision.check(this);
    },

    onCollision: function (response, other)
    {
        if(typeof other.recieveBuff !== "undefined" && other.buffList.size == 0)
        {
            other.recieveBuff({source: this, buff: new IceSlowed({time: 0.2})});
        }

        return false;
    }
});
