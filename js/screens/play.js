game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() 
    {
        me.game.viewport.fadeIn("#000", 1);
        // me.game.world.autoDepth = false;
        // me.game.world.autoSort = false;

        game.units = new game.Mobs.UnitManager();
        // me.game.world.addChild(game.units, 0);

        // Add our HUD to the game world, add it last so that this is on top of the rest.
        // Can also be forced by specifying a "Infinity" z value to the addChild function.
        this.UI = new game.UI.Container();
        me.game.world.addChild(this.UI, 1000);

        // load a level
        // a small trick to load the level again after finish loading
        // directly load the level will cause some z-order related issues (many things disappeared)
        // really annoying. Fortunately, re-load it after a small delay solves it.
        // served with a fade-out fx to prevent artifacts 
        opt = {};
        opt.onLoaded = function(){
            console.log("loaded");
            
            optopt = {}
            optopt.onLoaded = function()
            {
                me.game.viewport.fadeOut("#000", 500);
            }

            me.timer.setTimeout(function(){
                me.levelDirector.loadLevel("playground", optopt);
            }, 300, false);
        };
        me.levelDirector.loadLevel("playground", opt);
    },

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() 
    {
        // remove the HUD from the game world
        me.game.world.removeChild(this.UI);
        me.game.world.removeChild(game.units);
    }
});
