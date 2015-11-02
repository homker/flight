/**
 * 有心核心处理逻辑
 */

var GameSceneLayer = cc.Layer.extend({
        isMouseDown: false,
        hellolmg: null,
        helleLabel: null,
        circle: null,
        _size: null,
        gameLayer: null,
        gameLayer02: null,
        _jetSprite: null,
        _targets: null,
        _enemyButtles: null,
        _bullets: null,
        score: 0,
        scoreBord: null,
        livesnumber: null,
        livesBord: null,
        ctor: function () {
            var self = this;
            this._super();
            this._size = cc.winSize;
            this.gameLayer02 = cc.Layer.create();
            this.addChild(this.gameLayer02);
            this._jetSprite = cc.Sprite.create(res.s_jet);
            this._jetSprite.setAnchorPoint(0.5, 0.5);
            this._jetSprite.setPosition(this._size.width / 2, this._size.height / 5);
            this._jetSprite.setScale(0.25);
            this.gameLayer02.addChild(this._jetSprite, 0);
            this.setPosition(new cc.Point(0, 0));

            //定义集合
            this._bullets = []; //子弹集合
            this._targets = [];   //敌机集合
            this._enemyButtles = []; //敌军子弹集合


            //分数管理
            this.score = "0";
            this.scoreBord = cc.LabelTTF.create(this.score, "impact", 28);
            this.scoreBord.setPosition(this._size.width * 3 / 4, this._size.height - 40);
            this.gameLayer02.addChild(this.scoreBord, 4);
            this.livesnumber = 5; //初始生命值
            this.livesBord = cc.LabelTTF.create(this.livesnumber, "impact", 28);
            this.livesBord.setPosition(this._size.width * 1 / 4, this._size.height - 40);
            this.gameLayer02.addChild(this.livesBord, 5);

            //状态集管理
            var isFight = false;//是否在射击

            //敌机动画生成
            self.schedule(self.addEnemyJetWithBullet, 0.3);

            //碰撞检测和损毁处理
            self.schedule(self.checkBoom, 0.1);

            //事件处理
            var keyBoradEventHandle = cc.EventListener.create({
                    event: cc.EventListener.KEYBOARD,
                    onKeyPressed: function (keyCode, event) {
                        self.keyBordEventHandle(keyCode, event);
                        if (!isFight) {
                            self.schedule(self.addBullets, 0.3);
                            isFight = true;
                        }
                    },
                    onKeyReleased: function (keyCode, event) {
                        if (isFight) {
                            self.unschedule(self.addBullets);
                            isFight = false;
                        }
                    }
                }),
                TouchEventHandle = cc.EventListener.create({
                    event: cc.EventListener.TOUCH_ONE_BY_ONE,
                    onTouchBegan: function (touch, event) {
                        //子弹动画处理
                        self.schedule(self.addBullets, 0.3);
                        return true;
                    },
                    onTouchMoved: function (touch, event) {
                        var curPos = self.getDelay(touch);
                        self.fly2(curPos);
                        //console.log(curPos);
                    },
                    onTouchEnded: function (touch, event) {
                        self.unschedule(self.addBullets);
                    }
                });

            cc.eventManager.addListener(keyBoradEventHandle, this);
            cc.eventManager.addListener(TouchEventHandle, this);

        },
        calculateLives: function () {
            this.livesnumber -= 1;
            this.livesBord.setString(this.livesnumber);
            if (this.livesnumber === 0) {
                this.unscheduleAllCallbacks();
                window.score = this.score;
                var gameOver = new GameOver();
                //cc.director.runScene(gameOver);
                cc.director.runScene(cc.TransitionProgressRadialCCW.create(1.2, gameOver), this);
            }
        },
        updateScore: function () {
            this.score = parseInt(this.score) + 100;
            this.scoreBord.setString(this.score);
        },
        addEnemyJetWithBullet: function () {
            var enemyJet = cc.Sprite.create(res.s_jet),
                showUpPos = Math.random() * this._size.width,
                minDuration = 2.5,
                maxDuration = 10.0,
                differDuration = maxDuration - minDuration,
                actualDuration = Math.random() * differDuration + minDuration,
                enemyMoveAction = cc.MoveTo.create(actualDuration, cc.p(showUpPos, 0 - enemyJet.getContentSize().height)),
                enemyActionDone = cc.CallFunc.create(this.spriteMoveFinished, this, enemyJet);
            enemyJet.setScale(0.3);
            enemyJet.setRotation(180);
            enemyJet.setPosition(cc.p(showUpPos, this._size.height));
            enemyJet.runAction(cc.Sequence.create(enemyMoveAction, enemyActionDone));
            this._targets.push(enemyJet);
            this.gameLayer02.addChild(enemyJet, 0);
            enemyJet.setTag(1);

           var enemyBullet = cc.Sprite.create(res.s_bullets, cc.rect(0, 50, 33, 70)),
                targetPosition = enemyJet.getPosition(),
                enemyBulletDuration = 2,  // 子弹时间
                enemyBulletTime = enemyBulletDuration * (targetPosition.y / this._size.height), // 实际子弹时间
                ebActionMoveTo = cc.MoveTo.create(enemyBulletTime, cc.p(showUpPos, 0 - enemyBullet.getContentSize().height)),
                ebActionMoveDone = cc.CallFunc.create(this.spriteMoveFinished, this);
            enemyBullet.setRotation(180);
            enemyBullet.setScale(0.3);
            enemyBullet.setPosition(targetPosition.x, targetPosition.y - enemyBullet.getContentSize().height);
            enemyBullet.runAction(cc.Sequence.create(ebActionMoveTo, ebActionMoveDone)); // 子弹动作
            enemyBullet.setTag(5); // 设置子弹标签为5
            this._enemyButtles.push(enemyBullet); // 推入数组中
            this.gameLayer02.addChild(enemyBullet, 1); // 将子弹载入层中
        },
        addBullets: function () {
            var jetPos = this._jetSprite.getPosition(),
                buttle = cc.Sprite.create(res.s_bullets, cc.rect(0, 0, 33, 33)),
                bulletLiveTime = 5,//子弹最长存活时间.
                timeScale = (this._size.height - jetPos.y - (buttle.getContentSize().height / 2)) / this._size.height,
                bulletAction = cc.MoveTo.create(bulletLiveTime * timeScale, cc.p(jetPos.x, this._size.height)),
                bulletActionMoveDone = cc.CallFunc.create(this.spriteMoveFinished, this, buttle);
            //设定子弹位置
            buttle.setScale(0.3);
            buttle.setPosition(cc.p(jetPos.x, jetPos.y + buttle.getContentSize().height + 22));
            //执行action
            buttle.runAction(cc.Sequence.create(bulletAction, bulletActionMoveDone));
            this._bullets.push(buttle);
            this.gameLayer02.addChild(buttle, 0);
            buttle.setTag(6);
        },
        checkBoom: function () {
            //碰撞检测和死亡处理
            var self = this,
                jetRect = self._jetSprite.getBoundingBox();//飞机的实际区域.

            //敌机子弹 和 我机 碰撞检测
            self.checkDele(self._enemyButtles, jetRect, function () {
                self.calculateLives();
            });
            //敌机 和 我机 检测
            self.checkDele(self._targets, jetRect, function () {
                self.calculateLives();
            });
            //敌机 和 我机子弹 检测
            self._bullets.forEach(function (bullets) {
                self.checkDele(self._targets, bullets.getBoundingBox(),function () {
                    self.gameLayer02.removeChild(bullets);
                    var index = self._bullets.indexOf(bullets);
                    self._bullets.splice(index,1);
                    self.updateScore();
                });
            });
        },
        checkDele: function (checkArr, checkRect, callback) {
            var self = this;
            this.rectCheck(checkArr, checkRect, function (removeArr) {
                removeArr.forEach(function (ele) {
                    var index = checkArr.indexOf(ele);
                    if (index > -1) {
                        self.gameLayer02.removeChild(ele, true);
                        checkArr.splice(index, 1);
                        callback && callback();
                    }
                });
            })
        },
        rectCheck: function (checkArr, checkRect, callback) {
            var deleArr = [];
            for (var l = checkArr.length; l--;) {
                var checkElem = checkArr[l],
                    checkElemRect = checkElem.getBoundingBox();
                if (cc.rectIntersectsRect(checkElemRect, checkRect)) {
                    deleArr.push(checkElem);
                }
            }
            callback && callback(deleArr);
        }
        ,
        spriteMoveFinished: function (sprite) {
            var self = this;
            if (sprite.getTag() == 6) { //如果是子弹,则从bullet数组中删除
                //this.gameLayer02.removeChild(sprite, true);
                this._bullets.forEach(function (ele) {
                    if (self.chechkOut(ele.getPosition(), ele)) {
                        self.gameLayer02.removeChild(ele, true);
                        var index = self._bullets.indexOf(ele);
                        self._bullets.splice(index, 1);
                    }
                })
            }
            if (sprite.getTag() == 1) {
                this._targets.forEach(function (ele) {
                    if (self.chechkOut(ele.getPosition(), ele)) {
                        self.gameLayer02.removeChild(ele, true);
                        var index = self._targets.indexOf(ele);
                        self._targets.splice(index, 1);
                    }
                })
            }
        }
        ,
        chechkOut: function (position, sprite) {
            var self = this;
            return position.x < 0 || position.x > self._size.width || position.y < 0 || position.y > (self._size.height - sprite.getContentSize().height);
        }
        ,
        getDelay: function () {
            var preCurpos = {x: 400, y: 100},//这里用得并不是鼠标的初始位置,而是飞机的初始位置
                curPos = {x: 0, y: 0};
            return function (touch) {
                curPos.x = touch.getLocation().x - preCurpos.x;
                curPos.y = touch.getLocation().y - preCurpos.y;
                preCurpos.x = touch.getLocation().x;
                preCurpos.y = touch.getLocation().y;
                return curPos;
            }
        }(),
        keyBordEventHandle: function (keyCode, event) {
            switch (keyCode) {
                case 37 :
                    this.fly2({x: -10, y: 0});
                    break;
                case 38 :
                    this.fly2({x: 0, y: 10});
                    break;
                case 39 :
                    this.fly2({x: 10, y: 0});
                    break;
                case 40:
                    this.fly2({x: 0, y: -10});
                    break;
            }
        }
        ,
        fly2: function (direction) {
            var curPos = this._jetSprite.getPosition();
            curPos = cc.pAdd(curPos, direction);
            curPos = cc.pClamp(curPos, {x: 0, y: 0}, cc.p(this._size.width, this._size.height));
            this._jetSprite.setPosition(curPos);
        }

    })
    ;

var EnterLayer = cc.Layer.extend({
    sprite: null,
    ctor: function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;

        this.gameLayer = cc.Layer.create();
        this.addChild(this.gameLayer, 0);


        this.sprite = new cc.Sprite(res.HelloWorld_png);
        this.sprite.attr({
            x: size.width / 2,
            y: size.height / 2
        });
        this.gameLayer.addChild(this.sprite, 1);

        var newGameNormal = cc.Sprite.create(res.s_menu, cc.rect(0, 0, 126, 33)),
            newGameSelected = cc.Sprite.create(res.s_menu, cc.rect(0, 33, 126, 33)),
            newGameDisabled = cc.Sprite.create(res.s_menu, cc.rect(0, 33 * 2, 126, 33)),
            newGame = cc.MenuItemSprite.create(newGameNormal, newGameSelected, newGameDisabled, this.onNewGame, this),
            newGameButton = cc.Menu.create(newGame);
        newGameButton.setAnchorPoint(cc.p(0.5, 0.5));
        newGameButton.setPosition(size.width / 2, size.height / 2 + 100);
        newGameButton.alignItemsVerticallyWithPadding(10);
        this.gameLayer.addChild(newGameButton, 1, 2);
    },
    onNewGame: function (pSender) {
        this._size = cc.winSize;
        var scene = cc.Scene.create(),
            gsl = new GameSceneLayer();
        gsl.init();
        scene.addChild(gsl, 1);
        var bgLayer = cc.Layer.create(),
            bgImage = cc.Sprite.create();
        bgLayer.addChild(bgImage);
        bgImage.setAnchorPoint(cc.p(0.5, 0.5));
        bgImage.setPosition(this._size.width / 2, this._size.height / 2);
        scene.addChild(bgLayer, 0);
        cc.director.runScene(cc.TransitionFade.create(1.2, scene));
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new EnterLayer();
        this.addChild(layer);
    }
});

