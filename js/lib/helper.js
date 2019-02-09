game.Helper = 
{
    // Helper for generate random ints
    // The maximum is exclusive and the minimum is inclusive
    getRandomInt: function (min, max) 
    {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; 
    },

    getRandomFloat: function (min, max) 
    {
        return Math.random() * (max - min) + min;
    },

    radian: function (degree)
    {
        return degree / 180.0 * Math.PI;
    },

    readTextFile: function (self, file, callback) 
    {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function() 
        {
            if (rawFile.readyState === 4 && rawFile.status == "200") 
            {
                callback(self, rawFile.responseText);
            }
        }
        rawFile.send(null);
    },
};

game.Helper.Tooltip = 
{
    beginSection: function(self)
    {
        return "<div>";
    },

    switchSection: function(self)
    {
        return "</div><div>";
    },

    endSection: function(self)
    {
        return "</div>";
    },

    row: function(self, text, style)
    {
        if(style)
        {
            return "<p style = '" + style + "'>" + text + "</p>";
        }
        return "<p>" + text + "</p>";
    },

    column: function(self, text, style)
    {
        if(style)
        {
            return "<span style = '" + style + "'>" + text + "</span>";
        }
        return "<span>" + text + "</span>";
    },

    colored: function(self, text, color, style)
    {
        return "<strong style='color:" + color + ";" + style + "'>" + text + "</strong>"
    },
}
