'use strict';
// Some mobs (enemies)

class TestMob extends Mob
{
    constructor({
        spriteMgrPool = undefined,
        scene = undefined,
        spriteName = "mob_test",
        name = "test mob",
        health = 10,
        damage = 0,
        position = new BABYLON.Vector3(0, 0, 0),
    } = {})
    {
        super({
            name: name,
            health: health,
            damage: damage,
            spriteMgrPool: spriteMgrPool,
            scene: scene,
            spriteName: spriteName,
            position: position,
        });
    }

    update(deltaTime)
    {
        super.update(deltaTime);

        // move the mob a little bit to left
        this.position.x -= 3.0 * this.speed * this.movingSpeed * deltaTime;

        if(this.position.x > 0 && this.position.x < 1 && this.buffList.size == 0)
        {
            this.recieveBuff({source: this, buff: new Fired({time: 5.0})});
        }

        if(this.position.x < -2 && this.buffList.size <= 1)
        {
            this.recieveBuff({source: this, buff: new IceSlowed()});
        }
    }
}
