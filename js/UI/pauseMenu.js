game.menu = game.menu || {};
game.menu.currentPlayerCount = 0;

game.menu.openMenuTab = function(menuName) 
{
    var i, tabcontent, tablinks;

    menuName = "pm_" + menuName;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) 
    {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tab");
    for (i = 0; i < tablinks.length; i++) 
    {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(menuName).style.display = "block";

    if(document.getElementById("btn_" + menuName))
    {
        document.getElementById("btn_" + menuName).className += " active";
    }

    if(menuName == "pm_Characters")
    {
        // init characters panel
        game.menu.openCharactersTabSubTab("cT_character_equipment_panel");
    }
}

game.menu.cT_tTab = function(isEquip, equipPos, slot)
{
    // TODO: check if slot exists
    if(isEquip === true)
    {
        game.menu.currentEquipPos = equipPos;
        game.menu.currentEquipSlot = slot;

        game.menu.fillInventoryPanel(document.querySelector("#cT_equipment_selector .scrollable_inventory_list ul"), []);

        game.menu.openCharactersTabSubTab("cT_equipment_selector");
    }
    else
    {
        game.menu.openCharactersTabSubTab("cT_character_equipment_panel");
    }
}

game.menu.openCharactersTabSubTab = function(tabName)
{
    document.getElementById("cT_equipment_selector").style.display = "none";
    document.getElementById("cT_character_equipment_panel").style.display = "none";

    document.getElementById(tabName).style.display = "block";
}

game.menu.init = function()
{
    document.getElementById("btn_pm_Team").click();
    // document.getElementById("btn_pm_Characters").click();

    // Set up a event listener for escape key -> close menu and resume game
    document.body.addEventListener('keydown', function(e)
    {
        if(game.ignorePause === true)
        {
            return;
        }
        if(e.key === "Escape")
        {
            if(game.paused === true)
            {
                game.paused = false;
                game.ignorePause = true;
            }
            me.state.resume(true);

            document.getElementById("pause_menu").style.display = "none";
        }
    });

    // Get DOM Elements
    game.menu.teamTab = document.getElementById("pm_Team");
    game.menu.teamContentPanel = document.getElementById("team_content");

    game.menu.charactersTab = document.getElementById("pm_Characters");
}

game.menu.getOffset = function(gridSizeX, gridSizeY, rowSize, iconIdx)
{
    return {x: -(iconIdx % rowSize * gridSizeX) + 'px', y: -(Math.floor(iconIdx / rowSize) * gridSizeY) + 'px'};
}

game.menu.wakeupMenu = function()
{
    game.paused = true;

    //
    // ─── TEAM PANEL ─────────────────────────────────────────────────────────────────
    //

    if(game.data.backend.playerList.length !== game.menu.currentPlayerCount)
    {
        game.menu.currentPlayerCount = game.data.backend.playerList.length;

        // Set a correct layout
        if(game.menu.currentPlayerCount > 4)
        {
            var columns = Math.ceil(game.menu.currentPlayerCount / 2);
            var rows = Math.ceil(game.menu.currentPlayerCount / columns);

            var tmpstr = ""

            for(var i = 0; i < rows; i ++)
            {
                tmpstr += "1fr ";
            }

            game.menu.teamContentPanel.style.gridTemplateRows = tmpstr;
            tmpstr = "";

            for(var i = 0; i < columns; i ++)
            {
                tmpstr += "1fr ";
            }
            game.menu.teamContentPanel.style.gridTemplateColumns = tmpstr;
        }

        // Clear and dulipcate character panels
        var characterPanel_base = document.getElementById("character_0").cloneNode(true);

        while(game.menu.teamContentPanel.firstChild)
        {
            game.menu.teamContentPanel.removeChild(game.menu.teamContentPanel.firstChild);
        }

        var i = 0;
        for(var player of game.data.backend.playerList)
        {
            var playerPanel = characterPanel_base.cloneNode(true);

            playerPanel.id = "character_" + i;

            game.menu.teamContentPanel.appendChild(playerPanel);

            i += 1;
        }
    }

    // Set player data
    var i = 0;
    for(var player of game.data.backend.playerList)
    {
        var playerPanel = game.menu.teamContentPanel.querySelector("#character_" + i);

        // Event to jump to character panel
        playerPanel.index = i;
        playerPanel.onclick = function()
        { 
            game.menu.setCurrentCharacter(this.index);
            game.menu.openMenuTab('Characters');
        }

        // Player name
        playerPanel.querySelector("#character_name").innerHTML = player.name;

        // Player avatar
        playerPanel.querySelector("#character_avatar").style.setProperty('--image-url', 
            'url(' + player.parentMob.children[0].image.src + ')');
        
        // Health and resource
        playerPanel.querySelector(".progress_bar#health .progress_bar_fill").style.setProperty('width', 
            100 * (player.currentHealth / player.maxHealth) + '%');
        
        playerPanel.querySelector(".progress_bar#health .progress_bar_label .bar_num").innerHTML = 
            Math.floor(player.currentHealth) + " / " + Math.floor(player.maxHealth);

        playerPanel.querySelector(".progress_bar#resource .progress_bar_fill").style.setProperty('width', 
            100 * (player.currentMana / player.maxMana) + '%');
        
        // TODO: different resource name
        playerPanel.querySelector(".progress_bar#resource .progress_bar_label .bar_head").innerHTML = 
            "魔力";
        
        playerPanel.querySelector(".progress_bar#resource .progress_bar_label .bar_num").innerHTML = 
            Math.floor(player.currentMana) + " / " + Math.floor(player.maxMana);

        // Buffs
        var buffIcon_base = playerPanel.querySelector("#buff_base");
        var playerBuffList = playerPanel.querySelector("#buff_list_team_tab_character");

        while(playerBuffList.firstChild)
        {
            playerBuffList.removeChild(playerBuffList.firstChild);
        }

        for(var buff of player.buffList)
        {
            var buffIcon = buffIcon_base.cloneNode(true);
            buffIcon.id = "buff";

            buffIcon.style.setProperty('background-color', buff.color);
            buffIcon.querySelector(".buff_timer").style.setProperty('width', 100 * (1 - buff.timeRemain / buff.timeMax) + "%");

            buffIcon.querySelector("p").innerHTML = buff.stacks;
            buffIcon.buff = buff;

            // Show tool tip when hover
            buffIcon.onmouseover = function() 
            {
                this.buff.showToolTip();
            };

            buffIcon.onmouseout = function()
            {
                game.UIManager.hideToolTip();
            };

            // Let it visible and append it to the list
            buffIcon.style.setProperty('display', 'inherit');
            playerBuffList.appendChild(buffIcon);
        }

        // Equipments
        // Main weapon
        wMain_main = playerPanel.querySelector("#character_equipment_panel li#character_weapon_main");
        wMain_main.style.setProperty('--image-url', 'url(' + 'data/img/Weapon_icon_32x32.png' + ')');
        wMain_main.style.setProperty('--image-offsetX', game.menu.getOffset(32, 32, 8, player.currentWeapon.iconIdx).x);
        wMain_main.style.setProperty('--image-offsetY', game.menu.getOffset(32, 32, 8, player.currentWeapon.iconIdx).y);
        // TODO: slots

        // Sub weapon
        wSub_main = playerPanel.querySelector("#character_equipment_panel li#character_weapon_sub");
        wSub_main.style.setProperty('--image-url', 'url(' + 'data/img/Weapon_icon_32x32.png' + ')');
        wSub_main.style.setProperty('--image-offsetX', game.menu.getOffset(32, 32, 8, player.anotherWeapon.iconIdx).x);
        wSub_main.style.setProperty('--image-offsetY', game.menu.getOffset(32, 32, 8, player.anotherWeapon.iconIdx).y);

        i += 1;
    }

    //
    // ─── CHARACTER PANEL ────────────────────────────────────────────────────────────
    //

    game.menu.setCurrentCharacter(game.menu.currentCharacterIdx || 0);
    game.menu.openCharactersTabSubTab("cT_character_equipment_panel");

    //
    // ─── INVENTORY PANEL ────────────────────────────────────────────────────────────
    //

    game.menu.fillInventoryPanel(document.querySelector("#Items.scrollable_inventory_list ul"), []);
}

game.menu.fillInventoryPanel = function(panel, filters)
{
    var idx = 0
    while(panel.childNodes.length > idx)
    {
        if(panel.childNodes[idx].id != "back" && panel.childNodes[idx].id != "title")
        {
            panel.removeChild(panel.childNodes[idx]);
        }
        else
        {
            idx += 1;
        }
    }

    // TODO: FIXME: change .data to methods
    for(var item of game.data.backend.inventory.data)
    {
        // TODO: FIXME: filters
        var itemIcon = document.createElement("li");
        itemIcon.classList.add("show_image");
        itemIcon.classList.add("inventory_block");

        // TODO: add stacks count
        // itemIcon.innerHTML = "<span>" + item.stacks + "</span>";

        var r_item = game.data.itemList[item];
        itemIcon.style.setProperty('--image-url', 'url(' + me.loader.getImage(r_item.image).src + ')');
        itemIcon.style.setProperty('--image-offsetX', game.menu.getOffset(r_item.framewidth, r_item.frameheight, 
            Math.round(r_item.width / r_item.framewidth), r_item.iconIdx).x);
        itemIcon.style.setProperty('--image-offsetY', game.menu.getOffset(r_item.framewidth, r_item.frameheight, 
            Math.round(r_item.width / r_item.framewidth), r_item.iconIdx).y);
        
        itemIcon.item = r_item;
        
        // Show tool tip when hover
        itemIcon.onmouseover = function() 
        {
            game.UIManager.showToolTip({
                title: this.item.showName,
                bodyText: this.item.toolTipText,
                titleColor: this.item.color,
            });
        };

        itemIcon.onmouseout = function()
        {
            game.UIManager.hideToolTip();
        };
        
        panel.appendChild(itemIcon);
    }
}

game.menu.setCurrentCharacter = function(index)
{
    game.menu.currentCharacterIdx = index;
    
    var player = game.data.backend.playerList[index];

    // Left & Right arrows
    game.menu.charactersTab.querySelector("#left_arrow").onclick = function()
    {
        game.menu.setCurrentCharacter((8 + index - 1) % game.data.backend.playerList.length)
    };

    game.menu.charactersTab.querySelector("#right_arrow").onclick = function()
    {
        game.menu.setCurrentCharacter((index + 1) % game.data.backend.playerList.length)
    };

    // Player name
    game.menu.charactersTab.querySelector("#character_name").innerHTML = player.name;

    // Player avatar
    game.menu.charactersTab.querySelector("#character_avatar").style.setProperty('--image-url', 
        'url(' + player.parentMob.children[0].image.src + ')');
    
    // Health and resource
    game.menu.charactersTab.querySelector(".progress_bar#health .progress_bar_fill").style.setProperty('width', 
        100 * (player.currentHealth / player.maxHealth) + '%');
    
    game.menu.charactersTab.querySelector(".progress_bar#health .progress_bar_label .bar_num").innerHTML = 
        Math.floor(player.currentHealth) + " / " + Math.floor(player.maxHealth);

    game.menu.charactersTab.querySelector(".progress_bar#resource .progress_bar_fill").style.setProperty('width', 
        100 * (player.currentMana / player.maxMana) + '%');
    
    // TODO: different resource name
    game.menu.charactersTab.querySelector(".progress_bar#resource .progress_bar_label .bar_head").innerHTML = 
        "魔力";
    
    game.menu.charactersTab.querySelector(".progress_bar#resource .progress_bar_label .bar_num").innerHTML = 
        Math.floor(player.currentMana) + " / " + Math.floor(player.maxMana);

    // Buffs
    var buffIcon_base = game.menu.charactersTab.querySelector("#buff_base");
    var playerBuffList = game.menu.charactersTab.querySelector("#buff_list_character_tab_character");

    while(playerBuffList.firstChild)
    {
        playerBuffList.removeChild(playerBuffList.firstChild);
    }

    for(var buff of player.buffList)
    {
        var buffIcon = buffIcon_base.cloneNode(true);
        buffIcon.id = "buff";

        buffIcon.style.setProperty('background-color', buff.color);
        buffIcon.querySelector(".buff_timer").style.setProperty('width', 100 * (1 - buff.timeRemain / buff.timeMax) + "%");

        buffIcon.querySelector("p").innerHTML = buff.stacks;
        buffIcon.buff = buff;

        // Show tool tip when hover
        buffIcon.onmouseover = function() 
        {
            this.buff.showToolTip();
        };

        buffIcon.onmouseout = function()
        {
            game.UIManager.hideToolTip();
        };

        // Let it visible and append it to the list
        buffIcon.style.setProperty('display', 'inherit');
        playerBuffList.appendChild(buffIcon);
    }

    //
    // ─── EQUIPMENT ──────────────────────────────────────────────────────────────────
    //

    // Main weapon
    wMain_main = game.menu.charactersTab.querySelector("ul#weapon_main li#main");
    wMain_main.style.setProperty('--image-url', 'url(' + 'data/img/Weapon_icon_32x32.png' + ')');
    wMain_main.style.setProperty('--image-offsetX', game.menu.getOffset(32, 32, 8, player.currentWeapon.iconIdx).x);
    wMain_main.style.setProperty('--image-offsetY', game.menu.getOffset(32, 32, 8, player.currentWeapon.iconIdx).y);
    // TODO: slots

    // Sub weapon
    wMain_main = game.menu.charactersTab.querySelector("ul#weapon_sub li#main");
    wMain_main.style.setProperty('--image-url', 'url(' + 'data/img/Weapon_icon_32x32.png' + ')');
    wMain_main.style.setProperty('--image-offsetX', game.menu.getOffset(32, 32, 8, player.anotherWeapon.iconIdx).x);
    wMain_main.style.setProperty('--image-offsetY', game.menu.getOffset(32, 32, 8, player.anotherWeapon.iconIdx).y);

    // TODO: armor & acc
    // TODO: if nothing equipped

    //
    // ─── CHARACTER STATS ────────────────────────────────────────────────────────────
    //

    statsPanel = game.menu.charactersTab.querySelector("#characterStats");

    // Update character stats to keep it fresh
    player.calcStats(player.parentMob);

    // Character stat
    statsPanel.querySelector("tr#race #value").innerHTML = player.race;
    statsPanel.querySelector("tr#class #value").innerHTML = player.class;
    statsPanel.querySelector("tr#level #value").innerHTML = player.level;
    statsPanel.querySelector("tr#availableBP #value").innerHTML = player.availableBP;
    statsPanel.querySelector("tr#availableSP #value").innerHTML = player.availableSP;

    // Base stat
    statsPanel.querySelector("tr#VIT #value").innerHTML = player.baseStats.vit;
    statsPanel.querySelector("tr#MAG #value").innerHTML = player.baseStats.mag;
    statsPanel.querySelector("tr#STR #value").innerHTML = player.baseStats.str;
    statsPanel.querySelector("tr#INT #value").innerHTML = player.baseStats.int;
    statsPanel.querySelector("tr#DEX #value").innerHTML = player.baseStats.dex;
    statsPanel.querySelector("tr#TEC #value").innerHTML = player.baseStats.tec;

    statsPanel.querySelector("tr#VIT #value2").innerHTML = "(+ " + (player.baseStats.vit - player.baseStatsFundemental.vit) + ")";
    statsPanel.querySelector("tr#MAG #value2").innerHTML = "(+ " + (player.baseStats.mag - player.baseStatsFundemental.mag) + ")";
    statsPanel.querySelector("tr#STR #value2").innerHTML = "(+ " + (player.baseStats.str - player.baseStatsFundemental.str) + ")";
    statsPanel.querySelector("tr#INT #value2").innerHTML = "(+ " + (player.baseStats.int - player.baseStatsFundemental.int) + ")";
    statsPanel.querySelector("tr#DEX #value2").innerHTML = "(+ " + (player.baseStats.dex - player.baseStatsFundemental.dex) + ")";
    statsPanel.querySelector("tr#TEC #value2").innerHTML = "(+ " + (player.baseStats.tec - player.baseStatsFundemental.tec) + ")";

    // Battle stat
    statsPanel.querySelector("tr#movingSpeed #value").innerHTML = (player.baseSpeed * player.modifiers.speed * player.modifiers.movingSpeed).toFixed(2);
    statsPanel.querySelector("tr#attackGap #value").innerHTML = player.getAttackSpeed().toFixed(2) + "秒";
    statsPanel.querySelector("tr#castingSpeed #value").innerHTML = (player.modifiers.speed * player.modifiers.spellSpeed).toFixed(2) + "x";
    statsPanel.querySelector("tr#resourceCost #value").innerHTML = (player.modifiers.resourceCost).toFixed(2) + "x";
    statsPanel.querySelector("tr#tauntMul #value").innerHTML = (player.tauntMul).toFixed(2) + "x";

    // TODO: add calculation for level-based stats (hit, crit, etc.)
    statsPanel.querySelector("tr#hitAcc #value").innerHTML = "-";
    statsPanel.querySelector("tr#hitAcc #value2").innerHTML = player.battleStats.hitAcc + "%";
    statsPanel.querySelector("tr#avoid #value").innerHTML = "-";
    statsPanel.querySelector("tr#avoid #value2").innerHTML = player.battleStats.avoid + "%";
    statsPanel.querySelector("tr#crit #value").innerHTML = "-";
    statsPanel.querySelector("tr#crit #value2").innerHTML = player.battleStats.crit + "%";
    statsPanel.querySelector("tr#antiCrit #value").innerHTML = "-";
    statsPanel.querySelector("tr#antiCrit #value2").innerHTML = player.battleStats.antiCrit + "%";
    
    statsPanel.querySelector("tr#attackRange #value").innerHTML = Math.ceil(player.battleStats.attackRange + player.currentWeapon.activeRange);
    statsPanel.querySelector("tr#attackRange #value2").innerHTML = "(+ " + Math.ceil(player.battleStats.attackRange) + ")";
    statsPanel.querySelector("tr#extraRange #value").innerHTML = Math.ceil(player.battleStats.extraRange);

    // Attack power and resist
    var types = ["physical", "elemental", "heal", "slash", "knock", "pierce", "fire", "ice", "water", "nature", "wind", "thunder", "light"];
    for(var type of types)
    {
        // TODO: let damage / resist factor calculation be an independent module
        var typePanel = statsPanel.querySelector("#elements tr#" + type);

        // Attack power
        typePanel.querySelector("#value").innerHTML = player.battleStats.attackPower[type];
        // Attack power factor
        typePanel.querySelector("#value2").innerHTML = Math.pow(
            1.0353,
            player.battleStats.attackPower[game.data.damageType[type]] +
            player.battleStats.attackPower[type]).toFixed(2) + 'x';

        // Resist
        typePanel.querySelector("#value3").innerHTML = player.battleStats.resist[type];
        // Resist factor
        typePanel.querySelector("#value4").innerHTML = Math.pow(
            0.9659,
            player.battleStats.resist[game.data.damageType[type]] +
            player.battleStats.resist[type]).toFixed(2) + 'x';
    }

    // Spells
    var skillList = statsPanel.querySelector("#avilableSkills");
    var skillCount = 0;
    var currentRow;

    while(skillList.firstChild)
    {
        skillList.removeChild(skillList.firstChild);
    }

    for(var spell in player.spells)
    {
        if(skillCount % 3 == 0)
        {
            currentRow = document.createElement("tr");
            skillList.appendChild(currentRow);
        }

        currentRow.innerHTML += "\n<td><h3>" + player.spells[spell].name + "</h3></td>"

        skillCount++;
    }
}
