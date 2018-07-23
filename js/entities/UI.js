/**
 * a UI container and child items
 */

game.UI = game.UI || {};


game.UI.Container = me.Container.extend({

    init: function() {
        // call the constructor
        this._super(me.Container, 'init');

        // persistent across level change
        this.isPersistent = true;

        // make sure we use screen coordinates
        this.floating = true;

        // give a name
        this.name = "UI";

        // add our child score object at the top left corner
        this.addChild(new game.UI.ScoreItem(5, 5));
    }
});


/**
 * a basic UI item to display score
 */
game.UI.ScoreItem = me.Renderable.extend({
    /**
     * constructor
     */
    init: function(x, y) {

        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [x, y, 10, 10]);

        this.font = new me.BitmapFont(me.loader.getBinary('FixedSys'), me.loader.getImage('FixedSys'));

        // local copy of the global score
        this.score = -1;

        this.offX = 0;
        this.offY = 0;
    },

    /**
     * update function
     */
    update : function () {
        // we don't do anything fancy here, so just
        // return true if the score has been updated
        this.offX += me.timer.lastUpdate * 0.001;
        if (this.score !== game.data.score) {
            this.score = game.data.score;
            return true;
        }
        return false;
    },

    /**
     * draw the score
     */
    draw : function (context) 
    {
        // draw it baby !
        for(var x = 0; x < 1024; x += 51.2)
        {
            for(var y = 0; y < 576; y += 32)
            {
                this.font.draw(context, "100", Math.floor(Math.random() * 1024) + 1, Math.floor(Math.random() * 576) + 1);
                // this.font.draw(context, "100", x + this.offX, y + this.offY);
                // this.font.draw(context, Math.floor(Math.random() * 1000) + 1, x, y);
            }
        }
    }
});
