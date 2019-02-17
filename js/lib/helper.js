helper = 
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

    genAnimFrames: function(start, end)
    {
        var array = [];
        for(var i = start; i <= end; i++)
        {
            array.push(i);
        }

        return array;
    },

    vec2:
    {
        dot: function(a, b)
        {
            return a[0] * b[0] + a[1] * b[1];
        },

        scalar: function(a, s)
        {
            return [s * a[0], s * a[1]];
        },

        add: function(a, b)
        {
            return [a[0] + b[0], a[1] + b[1]];
        },

        sub: function(a, b)
        {
            return [a[0] - b[0], a[1] - b[1]];
        },

        length: function(a)
        {
            return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
        },

        normalize: function(a)
        {
            return this.scalar(a, 1.0 / this.length(a));
        },

        distance: function(a, b)
        {
            return this.length(this.sub(a, b));
        },

        // Material for 2D rotation:
        // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/2drota.htm
        rotate: function(a, rad)
        {
            return [a[0] * Math.cos(rad) - a[1] * Math.sin(rad), a[1] * Math.cos(rad) + a[0] * Math.sin(rad)];
        },
    },

    funcFromString: function(str)
    {
        var arr = str.split(".");

        var fn = (window || this);
        for (var i = 0, len = arr.length; i < len; i++) 
        {
            fn = fn[arr[i]];
        }

        if (typeof fn !== "function") 
        {
            throw new Error("function not found");
        }

        // return fn.bind(fn.prototype); // <- WTF this will not create a new object but modify the prototype
        return fn;
    },

    toolTip:
    {
        beginSection: function()
        {
            return "<div>";
        },

        switchSection: function()
        {
            return "</div><div>";
        },

        endSection: function()
        {
            return "</div>";
        },

        row: function(text, style)
        {
            if(style)
            {
                return "<p style = '" + style + "'>" + text + "</p>";
            }
            return "<p>" + text + "</p>";
        },

        column: function(text, style)
        {
            if(style)
            {
                return "<span style = '" + style + "'>" + text + "</span>";
            }
            return "<span>" + text + "</span>";
        },

        colored: function(text, color, style)
        {
            if(style)
            {
                return "<strong style='color:" + color + ";" + style + "'>" + text + "</strong>"
            }
            return "<strong style='color:" + color + ";'>" + text + "</strong>"
        },
    },

    //
    // ─── DAMAGE HELPERS ─────────────────────────────────────────────────────────────
    //

    safeDmg: function(source, target, spell, dmg)
    {
        if(typeof target.receiveDamage !== "undefined")
        {
            target.receiveDamage({
                source: source,
                damage: dmg,
                isCrit: false,
                spell: spell
            });
        }
    },

    safeHeal: function(source, target, spell, heal)
    {
        if(typeof target.receiveHeal !== "undefined" && game.Mobs.checkAlive(target) == true)
        {
            target.receiveHeal({
                source: source,
                heal: heal,
                isCrit: false,
                spell: spell
            });
        }
    },

    safeBuff: function(source, target, buff, buffSettings, popUp)
    {
        if(typeof target.receiveBuff !== "undefined")
        {
            if(typeof buffSettings !== "object")
            {
                buffSettings = {};
            }
            
            target.receiveBuff({
                source: source,
                buff: new buff(buffSettings),
                popUp: popUp
            });
        }
    },

    // Please use with safeDmg, safeHeal or safeBuff.
    aoe: function(func, arg, pos, range, toPlayer, willReduce)
    {
        if(typeof willReduce == "undefined")
        {
            willReduce = false;
        }

        // Get a list.
        var AoEList = game.units.getUnitList({
            availableTest: function(a)
            {
                return (a.getRenderPos(0.5, 0.5).distance(pos) < range);
            },
            isPlayer: toPlayer,
        });

        if(willReduce == true && arg.length == 4)
        {
            if(typeof arg[3] == "object")
            {
                for(var dmgType in arg[3])
                {
                    if(arg[3].hasOwnProperty(dmgType))
                    {
                        arg[3][dmgType] /= AoEList.length;
                    }
                }
            }
            else if(typeof arg[3] == "number")
            {
                arg[3] /= AoEList.length;
            }
        }

        // Apply the effect.
        for(var i = 0; i < AoEList.length; i++)
        {
            arg[1] = AoEList[i];
            func.apply(null, arg);
        }
    },

    // Please use with safeDmg, safeHeal or safeBuff.
    aoeWithMax: function(func, arg, pos, range, max, sort, toPlayer, willReduce)
    {
        if(typeof willReduce == "undefined")
        {
            willReduce = false;
        }

        // Get a list.
        var AoEList = game.units.getUnitList({
            availableTest: function(a)
            {
                return (a.getRenderPos(0.5, 0.5).distance(pos) < range);
            },
            sortMethod: sort,
            isPlayer: toPlayer,
        }).slice(0, max);

        if(willReduce == true)
        {
            if(typeof arg[3] == "object")
            {
                for(var dmgType in arg[3])
                {
                    if(arg[3].hasOwnProperty(dmgType))
                    {
                        arg[3][dmgType] /= AoEList.length;
                    }
                }
            }
            else if(typeof arg[3] == "number")
            {
                arg[3] /= AoEList.length;
            }
        }

        // Apply the effect.
        for(var i = 0; i < AoEList.length; i++)
        {
            arg[1] = AoEList[i];
            func.apply(null, arg);
        }
    },
};
