document.getElementById("btnTeam").click();

game.menu = game.menu || {};
game.menu.currentPlayerCount = 0;

function openMenuTab(evt, menuName) 
{
    var i, tabcontent, tablinks;

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
    evt.currentTarget.className += " active";
}

function wakeupMenu()
{
    game.paused = true;

    //
    // ─── TEAM PANEL ─────────────────────────────────────────────────────────────────
    //

    var teamContentPanel = document.getElementById("team_content");

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

            teamContentPanel.style.gridTemplateRows = tmpstr;
            tmpstr = "";

            for(var i = 0; i < columns; i ++)
            {
                tmpstr += "1fr ";
            }
            teamContentPanel.style.gridTemplateColumns = tmpstr;
        }

        // Clear and dulipcate character panels
        var characterPanel_base = document.getElementById("character_0").cloneNode(true);

        while(teamContentPanel.firstChild)
        {
            teamContentPanel.removeChild(teamContentPanel.firstChild);
        }

        var i = 0;
        for(var player of game.data.backend.playerList)
        {
            var playerPanel = characterPanel_base.cloneNode(true);

            playerPanel.id = "character_" + i;

            teamContentPanel.appendChild(playerPanel);

            i += 1;
        }
    }

    // Set player data
    var i = 0;
    for(var player of game.data.backend.playerList)
    {
        var playerPanel = teamContentPanel.querySelector("#character_" + i);

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
}

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
