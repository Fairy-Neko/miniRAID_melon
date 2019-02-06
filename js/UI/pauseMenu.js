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

        game.menu.refreshEveryInventoryList();

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

    game.menu.floatingBlock = document.querySelector("#draggableItem li");
    game.menu.floatingBlock.style.display = "none";
    game.menu.hasItemSelected = false;
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
            return false;
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

    //
    // ─── INVENTORY PANEL ────────────────────────────────────────────────────────────
    //

    game.menu.refreshEveryInventoryList();
}

game.menu.refreshEveryInventoryList = function()
{
    // Sort the inventory first
    game.data.backend.inventory.sortData();

    // Team tab, character equipments
    var i = 0;
    for(var player of game.data.backend.playerList)
    {
        var playerPanel = game.menu.teamContentPanel.querySelector("#character_" + i);

        var wMain_main = playerPanel.querySelector("#character_equipment_panel li#character_weapon_main");
        var wSub_main = playerPanel.querySelector("#character_equipment_panel li#character_weapon_sub");
        var armor_main = playerPanel.querySelector("#character_equipment_panel li#character_armor");
        var acc_main = playerPanel.querySelector("#character_equipment_panel li#character_acc");

        // Reset them
        game.menu.fillInventoryBlock(wMain_main, undefined, 'p-' + i + '-wMain-0');
        game.menu.fillInventoryBlock(wSub_main, undefined, 'p-' + i + '-wSub-0');
        game.menu.fillInventoryBlock(armor_main, undefined, 'p-' + i + '-armor-0');
        game.menu.fillInventoryBlock(acc_main, undefined, 'p-' + i + '-acc-0');

        // Equipments
        // Main weapon
        if(typeof player.currentWeapon !== "undefined")
        {
            game.menu.fillInventoryBlock(wMain_main, player.currentWeapon.linkedItem, 'p-' + i + '-wMain-0');
        }
        // TODO: slots

        // Sub weapon
        if(typeof player.anotherWeapon !== "undefined")
        {
            game.menu.fillInventoryBlock(wSub_main, player.anotherWeapon.linkedItem, 'p-' + i + '-wSub-0');
        }

        i += 1;
    }

    // Team tab, Inventory shortcut for equipments
    game.menu.fillInventoryPanel(document.querySelector("#pm_Team .scrollable_inventory_list ul"), ["equipment"], "eq", false, 154);

    // Character tab, character equipments
    // TODO: slots

    var player = game.data.backend.playerList[game.menu.currentCharacterIdx];

    wMain_main = game.menu.charactersTab.querySelector("ul#weapon_main li#main");
    wSub_main = game.menu.charactersTab.querySelector("ul#weapon_sub li#main");
    armor_main = game.menu.charactersTab.querySelector("ul#armor li#main");
    acc_main = game.menu.charactersTab.querySelector("ul#acc li#main");

    game.menu.fillInventoryBlock(wMain_main, undefined, 'p');
    game.menu.fillInventoryBlock(wSub_main, undefined, 'p');
    game.menu.fillInventoryBlock(armor_main, undefined, 'p');
    game.menu.fillInventoryBlock(acc_main, undefined, 'p');

    // Main weapon
    if(typeof player.currentWeapon !== "undefined")
    {
        game.menu.fillInventoryBlock(wMain_main, player.currentWeapon.linkedItem, 'p');
    }

    // Sub weapon
    if(typeof player.anotherWeapon !== "undefined")
    {
        game.menu.fillInventoryBlock(wSub_main, player.anotherWeapon.linkedItem, 'p');
    }

    // Armor
    if(typeof player.armor !== "undefined")
    {
        game.menu.fillInventoryBlock(armor_main, player.anotherWeapon.linkedItem, 'p');
    }

    // Accessory
    if(typeof player.accessory !== "undefined")
    {
        game.menu.fillInventoryBlock(acc_main, player.anotherWeapon.linkedItem, 'p');
    }

    // Character tab, temporal inventory
    game.menu.fillInventoryPanel(document.querySelector("#cT_equipment_selector .scrollable_inventory_list ul"), 
            ["equipment"] /* + [] Character filters*/, "all", true);

    // Temporal inventory header (current equipment) in characters panel when selecting equipment
    var equipPos = game.menu.currentEquipPos;
    var slot = game.menu.currentEquipSlot;

    var sIcon = document.querySelector("#cT_equipment_selector ul.equipment_row #title");
    var sMain = document.querySelector("#cT_equipment_selector ul.equipment_row #main");
    var s1 = document.querySelector("#cT_equipment_selector ul.equipment_row #enchant");
    var s2 = document.querySelector("#cT_equipment_selector ul.equipment_row #slot1");
    var s3 = document.querySelector("#cT_equipment_selector ul.equipment_row #slot2");

    game.menu.fillInventoryBlock(sMain, undefined, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-0');
    game.menu.fillInventoryBlock(s1, undefined, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-1');
    game.menu.fillInventoryBlock(s2, undefined, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-2');
    game.menu.fillInventoryBlock(s3, undefined, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-3');

    switch(equipPos)
    {
        case "wMain":
            sIcon.style.setProperty('--image-url', "url('data/img/weapons_1.png')");
            sIcon.style.setProperty('--image-offsetX', "0px");
            if(typeof player.currentWeapon !== "undefined")
            {
                game.menu.fillInventoryBlock(sMain, player.currentWeapon.linkedItem, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-0');
            }
        break;
        case "wSub":
            sIcon.style.setProperty('--image-url', "url('data/img/weapons_1.png')");
            sIcon.style.setProperty('--image-offsetX', "-32px");
            if(typeof player.anotherWeapon !== "undefined")
            {
                game.menu.fillInventoryBlock(sMain, player.anotherWeapon.linkedItem, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-0');
            }
        break;
        case "armor":
            sIcon.style.setProperty('--image-url', "url('data/img/weapons_1.png')");
            sIcon.style.setProperty('--image-offsetX', "-64px");
            if(typeof player.armor !== "undefined")
            {
                game.menu.fillInventoryBlock(sMain, player.armor.linkedItem, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-0');
            }
        break;
        case "acc":
            sIcon.style.setProperty('--image-url', "url('data/img/weapons_1.png')");
            sIcon.style.setProperty('--image-offsetX', "-96px");
            if(typeof player.accessory !== "undefined")
            {
                game.menu.fillInventoryBlock(sMain, player.accessory.linkedItem, 'p-' + game.menu.currentCharacterIdx + '-' + equipPos + '-0');
            }
        break;
    }

    // Inventory tab
    game.menu.fillInventoryPanel(document.querySelector("#Equipments.scrollable_inventory_list ul"), ["equipment"], "eq", false, 154);
    game.menu.fillInventoryPanel(document.querySelector("#Items.scrollable_inventory_list ul"), ["item"], "it", false, 140);
}

// TODO: logic when pick and drop items (check is equipable, equip, dismount, replace items etc.)
game.menu.onClickInventoryBlock = function(icon)
{
    console.log(icon.idString);

    // Check if it works
    // var srcArray = game.menu.floatingBlock.idString.split('-');
    var dstArray = icon.idString.split('-');

    var srcItem = game.menu.floatingBlock.item;
    var dstItem = icon.item;

    if(((game.menu.hasItemSelected === false) || this.placeItemToBlock(dstArray, srcItem, true)) && 
        ((typeof icon.item === "undefined") || this.removeItemFromBlock(dstArray, dstItem, true)))
    {
        var refresh = (game.menu.hasItemSelected === true) || (typeof icon.item !== "undefined");

        if(game.menu.hasItemSelected === true)
        {
            this.placeItemToBlock(dstArray, srcItem);

            game.menu.floatingBlock.style.display = "none";
            game.menu.hasItemSelected = false;

            game.UIManager.enableToolTip();
            game.UIManager.enableCursor();
        }
        
        // Drop & Pick a new item at current block
        // Although the real icon may has been replaced, variable icon itself still saves it's original state.
        if(icon.item)
        {
            // Set picked block properties
            game.menu.floatingBlock.idString = icon.idString;
            game.menu.floatingBlock.item = icon.item;

            console.log(game.menu.floatingBlock.item);

            game.menu.floatingBlock.style.setProperty('--image-url', icon.style.getPropertyValue('--image-url'));
            game.menu.floatingBlock.style.setProperty('--image-offsetX', icon.style.getPropertyValue('--image-offsetX'));
            game.menu.floatingBlock.style.setProperty('--image-offsetY', icon.style.getPropertyValue('--image-offsetY'));
            
            game.menu.floatingBlock.innerHTML = icon.innerHTML;

            game.UIManager.disableToolTip();
            game.UIManager.disableCursor();

            game.menu.floatingBlock.style.display = "list-item";
            game.menu.hasItemSelected = true;

            // Equipments will not be unequipped if they are no longer belongs to player
            this.removeItemFromBlock(icon.idString.split('-'), icon.item);
        }

        if(refresh === true)
        {
            game.menu.refreshEveryInventoryList();
            game.menu.setCurrentCharacter(game.menu.currentCharacterIdx);
        }
    }
}

game.menu.removeItemFromBlock = function(srcIdArray, item, isCheck = false)
{
    if(!item)
    {
        return true;
    }

    // You are going to unequip a player!
    if(srcIdArray[0] == 'p')
    {
        if(!item.linkedObject)
        {
            // ??? (This should not happen since you selected a equipped block which SHOULD has a linkedObject.)
            return true;
        }

        if(isCheck === false)
        {
            game.menu.unequipFromIdArray(srcIdArray, item.linkedObject);
            item.equipper = undefined;
        }
    }
    else
    {
        if(isCheck === false)
        {
            // Remove the item from current grid and inventory
            game.data.backend.inventory.removeItemSlot(item);
        }
    }

    // You can always remove an item from a block ?
    return true;
}

game.menu.placeItemToBlock = function(targetIdArray, item, isCheck = false)
{
    var typeDict = {wMain: "weapon", wSub: "weapon", armor: "armor", acc: "accessory"};
    var propDict = {wMain: "currentWeapon", wSub: "anotherWeapon", armor: "armor", acc: "accessory"};

    // You are going to equip a player!
    if(targetIdArray[0] == 'p')
    {
        if(!item)
        {
            // TODO: unequip, since you assigned a empty grid to equip = unequip current equipment.
            return false;
        }

        if(!item.linkedObject)
        {
            return false;
        }

        var playerId = parseInt(targetIdArray[1]);
        if(playerId < 0 || playerId >= game.data.backend.playerList.length)
        {
            return false;
        }

        var player = game.data.backend.playerList[playerId];
        var type = typeDict[targetIdArray[2]];
        var prop = propDict[targetIdArray[2]];

        var equipableTags = [];
        var equipable = false;

        // Slots
        if(targetIdArray[3] > 0)
        {
            if(player[prop])
            {
                equipableTags = player[prop].getSlotType(targetIdArray[3]);
            }
            else
            {
                return false;
            }
        }
        // Equipment itself
        else
        {
            equipableTags = player.getEquipableTags(type);
        }

        // Check if item contains any of the tag = equipable
        for(let tag of equipableTags)
        {
            if(item.getData().tags.includes(tag))
            {
                equipable = true;
            }
        }

        if(equipable === true && item.linkedObject.isEquipable(player.parentMob))
        {
            // Only check if we can do this so return
            if(isCheck === true)
            {
                return true;
            }

            // Or edit the contents carefully.
            // Equip to the target player
            player[prop] = item.linkedObject;
            item.equipper = player;
            item.linkedObject.equipper = player;

            return true;
        }

        return false;
    }
    else
    {
        // Check equipment or item
        if((!item) ||
           (targetIdArray[0] === 'eq' && item.getData().tags.includes("equipment")) || 
           (targetIdArray[0] === 'it' && item.getData().tags.includes("item")) || 
           (targetIdArray[0] === 'all'))
        {
            if(isCheck === true)
            {
                return true;
            }
            
            // Place it to the new place
            // Note: for temporal inventory selector in characters tab, it is gruanteed that src and dst are same type (both equipment or items).
            // Even if you selecting a flower to florafairy's armor-main slot, cuz it cannot pass the first part of the big if-else statement.
            // ( A flower cannot equipped to the armor-main slot so nothing happens. )
            if(item)
            {
                if(targetIdArray[1] === "lowest")
                {
                    console.log(item);
                    item.positionId = game.data.backend.inventory.findLowestId(item.getData().tags[0]);
                }
                else
                {
                    item.positionId = parseInt(targetIdArray[1]);
                }

                game.data.backend.inventory.addItemSlot(item);
            }

            return true;
        }

        return false;
    }
}

// TODO: move (part of) this to databackend.js ?
game.menu.unequipFromIdArray = function(idArray, obj)
{
    var typeDict = {wMain: "weapon", wSub: "weapon", armor: "armor", acc: "accessory"};
    var propDict = {wMain: "currentWeapon", wSub: "anotherWeapon", armor: "armor", acc: "accessory"};

    if(idArray[0] == 'p')
    {
        // Slots
        if(idArray[3] > 0)
        {
            // Unequip it
            if(game.data.backend.playerList[idArray[1]][propDict[idArray[2]]].slots[idArray[3]] == obj)
            {
                game.data.backend.playerList[idArray[1]][propDict[idArray[2]]].slots[idArray[3]] = undefined;
            }
        }
        // Equipment itself
        else
        {
            // Unequip it
            if(game.data.backend.playerList[idArray[1]][propDict[idArray[2]]] == obj)
            {
                game.data.backend.playerList[idArray[1]][propDict[idArray[2]]] = undefined;
            }
        }
    }
}

game.menu.fillInventoryPanel = function(panel, filters, prefix = "", relative = false, minimumCount = 0)
{
    var idx = 0;
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

    var itemList = game.data.backend.inventory.getData(filters, !relative);
    idx = 0;

    // TODO: FIXME: change .data to methods
    for(var item of itemList)
    {
        // TODO: FIXME: filters
        var itemIcon = document.createElement("li");

        var idstr = prefix + "-";
        if(relative === false)
        {
            idstr += idx;
        }
        else
        {
            idstr += item.positionId;
        }

        idx += 1;

        this.fillInventoryBlock(itemIcon, item, idstr);
        
        panel.appendChild(itemIcon);
    }

    if(relative === false)
    {
        for(idx = itemList.length; idx < minimumCount; idx++)
        {
            var itemIcon = document.createElement("li");
            var idstr = prefix + "-" + idx;
            this.fillInventoryBlock(itemIcon, undefined, idstr);
            
            panel.appendChild(itemIcon);
        }
    }
    else
    {
        var itemIcon = document.createElement("li");
        var idstr = prefix + "-lowest";
        this.fillInventoryBlock(itemIcon, undefined, idstr);
        
        panel.appendChild(itemIcon);
    }
}

game.menu.fillInventoryBlock = function(itemIcon, item, id)
{
    itemIcon.classList.add("show_image");
    itemIcon.classList.add("inventory_block");
    itemIcon.idString = id;

    if(typeof item === "undefined")
    {
        // Set it to empty
        itemIcon.style.setProperty('--image-url', '');
        itemIcon.style.setProperty('--image-offsetX', '0px');
        itemIcon.style.setProperty('--image-offsetY', '0px');

        itemIcon.innerHTML = "";

        itemIcon.item = null;
        itemIcon.onmouseover = null;
        itemIcon.onmouseout = null;

        // Nothing to do with a empty slot
        // TODO: pointer click events etc.
    }
    else
    {
        var r_item = item.getData();
        itemIcon.style.setProperty('--image-url', 'url(' + me.loader.getImage(r_item.image).src + ')');
        itemIcon.style.setProperty('--image-offsetX', game.menu.getOffset(r_item.framewidth, r_item.frameheight, 
            Math.round(r_item.width / r_item.framewidth), r_item.iconIdx).x);
        itemIcon.style.setProperty('--image-offsetY', game.menu.getOffset(r_item.framewidth, r_item.frameheight, 
            Math.round(r_item.width / r_item.framewidth), r_item.iconIdx).y);
        
        // TODO: add stacks count
        if(r_item.stackable === true)
        {
            itemIcon.innerHTML = "<span>" + item.stacks + "</span>";
        }

        if(id.split('-')[0] !== 'p' && item.equipper)
        {
            itemIcon.innerHTML = "<span>E</span>";
        }
        
        itemIcon.item = item;
        
        // Show tool tip when hover
        itemIcon.onmouseover = function() 
        {
            this.item.showToolTip();
            // game.UIManager.showToolTip({
            //     title: this.item.getData().showName,
            //     bodyText: this.item.getData().toolTipText,
            //     titleColor: this.item.getData().color,
            // });
        };

        itemIcon.onmouseout = function()
        {
            game.UIManager.hideToolTip();
        };
    }

    if(!itemIcon.onclick)
    {
        itemIcon.onclick = function(event)
        {
            game.menu.onClickInventoryBlock(this);
            event.stopPropagation();
            return false;
        };
    }
}

game.menu.setCurrentCharacter = function(index)
{
    game.menu.currentCharacterIdx = index;
    
    var player = game.data.backend.playerList[index];
    player.calcStats(player.parentMob);

    // Left & Right arrows
    game.menu.charactersTab.querySelector("#left_arrow").onclick = function()
    {
        game.menu.setCurrentCharacter((8 + index - 1) % game.data.backend.playerList.length)
        game.menu.refreshEveryInventoryList();
    };

    game.menu.charactersTab.querySelector("#right_arrow").onclick = function()
    {
        game.menu.setCurrentCharacter((index + 1) % game.data.backend.playerList.length)
        game.menu.refreshEveryInventoryList();
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
    
    if(player.currentWeapon)
    {
        statsPanel.querySelector("tr#attackRange #value").innerHTML = Math.ceil(player.battleStats.attackRange + player.currentWeapon.activeRange);
    }
    else
    {
        statsPanel.querySelector("tr#attackRange #value").innerHTML = Math.ceil(player.battleStats.attackRange);
    }

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
