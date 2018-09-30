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

    console.log(game.data.backend);
    if(game.data.backend.playerList.length !== game.menu.currentPlayerCount)
    {
        game.menu.currentPlayerCount = game.data.backend.playerList.length;

        // Set a correct layout
        var teamContentPanel = document.getElementById("team_content");

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
            playerPanel.querySelector("#character_name").innerHTML = player.name;

            console.log(player);
            teamContentPanel.appendChild(playerPanel);

            i += 1;
        }
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
