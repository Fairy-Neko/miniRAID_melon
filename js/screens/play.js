game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        // reset the score
        game.data.score = 0;

        this.units = new game.Mobs.UnitManager();
        me.game.world.addChild(this.units);

        // Add our HUD to the game world, add it last so that this is on top of the rest.
        // Can also be forced by specifying a "Infinity" z value to the addChild function.
        this.UI = new game.UI.Container();
        me.game.world.addChild(this.UI);

        // load a level
        me.levelDirector.loadLevel("playground");
    },

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        // remove the HUD from the game world
        me.game.world.removeChild(this.UI);
    }
});
