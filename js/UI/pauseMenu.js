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

        i += 1;
    }

    //
    // ─── CHARACTER PANEL ────────────────────────────────────────────────────────────
    //

    game.menu.setCurrentCharacter(game.menu.currentCharacterIdx || 0);
    game.menu.openCharactersTabSubTab("cT_character_equipment_panel");
}

game.menu.setCurrentCharacter = function(index)
{
    game.menu.currentCharacterIdx = index;
    game.menu.charactersTab.querySelector("#character_name").innerHTML = game.data.backend.playerList[index].name;
}
