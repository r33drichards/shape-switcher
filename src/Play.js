import Phaser from 'phaser';

export class Play extends Phaser.Scene {
    constructor() {
        super('play');
        
        this.gridWidth = 7;
        this.gridHeight = 7;
        this.tileSize = 80;
        this.candyTypes = 6;
        this.grid = [];
        this.selectedCandy = null;
        this.isProcessing = false;
        this.score = 0;
        this.moves = 30;
        this.candyColors = [
            0xff0000, // Red
            0x00ff00, // Green
            0x0000ff, // Blue
            0xffff00, // Yellow
            0xff00ff, // Purple
            0x00ffff  // Cyan
        ];
        this.candyShapes = ['circle', 'square', 'triangle', 'star', 'hexagon', 'diamond'];
    }

    create() {
        this.cameras.main.fadeIn(200);
        
        // Game title
        this.add.text(this.scale.width / 2, 40, 'CARNIVAL CRASHERS', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        // Score and moves display
        this.scoreText = this.add.text(50, 100, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        });
        
        this.movesText = this.add.text(this.scale.width - 50, 100, 'Moves: 30', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        }).setOrigin(1, 0);
        
        // Create grid container
        const gridOffsetX = (this.scale.width - this.gridWidth * this.tileSize) / 2;
        const gridOffsetY = 180;
        
        this.gridContainer = this.add.container(gridOffsetX, gridOffsetY);
        
        // Initialize grid
        this.initializeGrid();
        
        // Initial check for existing matches
        this.time.delayedCall(500, () => {
            this.checkForMatches();
        });
        
        // Add input handlers
        this.input.on('gameobjectdown', this.onCandyClicked, this);
    }

    initializeGrid() {
        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                const candy = this.createCandy(col, row);
                this.grid[row][col] = candy;
            }
        }
    }

    createCandy(col, row) {
        const x = col * this.tileSize + this.tileSize / 2;
        const y = row * this.tileSize + this.tileSize / 2;
        const type = Phaser.Math.Between(0, this.candyTypes - 1);
        
        // Create candy background
        const bg = this.add.graphics();
        bg.fillStyle(0x34495e);
        bg.fillRoundedRect(-35, -35, 70, 70, 10);
        
        // Create candy shape
        const candy = this.add.graphics();
        candy.fillStyle(this.candyColors[type]);
        
        switch (this.candyShapes[type]) {
            case 'circle':
                candy.fillCircle(0, 0, 30);
                break;
            case 'square':
                candy.fillRect(-25, -25, 50, 50);
                break;
            case 'triangle':
                candy.fillTriangle(0, -30, -30, 30, 30, 30);
                break;
            case 'star':
                this.drawStar(candy, 0, 0, 5, 30, 15);
                break;
            case 'hexagon':
                this.drawHexagon(candy, 0, 0, 30);
                break;
            case 'diamond':
                candy.fillTriangle(-30, 0, 0, -30, 30, 0);
                candy.fillTriangle(-30, 0, 0, 30, 30, 0);
                break;
        }
        
        const candyContainer = this.add.container(x, y, [bg, candy]);
        candyContainer.setSize(this.tileSize, this.tileSize);
        candyContainer.setInteractive();
        candyContainer.setData('type', type);
        candyContainer.setData('col', col);
        candyContainer.setData('row', row);
        
        this.gridContainer.add(candyContainer);
        
        // Add hover effect
        candyContainer.on('pointerover', () => {
            if (!this.isProcessing) {
                candyContainer.setScale(1.1);
            }
        });
        
        candyContainer.on('pointerout', () => {
            candyContainer.setScale(1);
        });
        
        return candyContainer;
    }

    drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        graphics.beginPath();
        graphics.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            graphics.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            graphics.lineTo(x, y);
            rot += step;
        }
        
        graphics.lineTo(cx, cy - outerRadius);
        graphics.closePath();
        graphics.fillPath();
    }

    drawHexagon(graphics, cx, cy, size) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = cx + size * Math.cos(angle);
            const y = cy + size * Math.sin(angle);
            points.push({ x, y });
        }
        
        graphics.fillPoints(points);
    }

    onCandyClicked(pointer, candy) {
        if (this.isProcessing) return;
        
        if (!this.selectedCandy) {
            this.selectedCandy = candy;
            this.tweens.add({
                targets: candy,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        } else {
            const col1 = this.selectedCandy.getData('col');
            const row1 = this.selectedCandy.getData('row');
            const col2 = candy.getData('col');
            const row2 = candy.getData('row');
            
            // Check if candies are adjacent
            const isAdjacent = (Math.abs(col1 - col2) === 1 && row1 === row2) ||
                              (Math.abs(row1 - row2) === 1 && col1 === col2);
            
            if (isAdjacent) {
                this.swapCandies(this.selectedCandy, candy);
            } else {
                // Deselect and select new candy
                this.tweens.killTweensOf(this.selectedCandy);
                this.selectedCandy.setScale(1);
                this.selectedCandy = candy;
                this.tweens.add({
                    targets: candy,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    swapCandies(candy1, candy2) {
        if (this.moves <= 0) return;
        
        this.isProcessing = true;
        
        const col1 = candy1.getData('col');
        const row1 = candy1.getData('row');
        const col2 = candy2.getData('col');
        const row2 = candy2.getData('row');
        
        // Swap in grid
        this.grid[row1][col1] = candy2;
        this.grid[row2][col2] = candy1;
        
        // Update candy data
        candy1.setData('col', col2);
        candy1.setData('row', row2);
        candy2.setData('col', col1);
        candy2.setData('row', row1);
        
        // Animate swap
        const x1 = candy1.x;
        const y1 = candy1.y;
        const x2 = candy2.x;
        const y2 = candy2.y;
        
        this.tweens.killTweensOf(this.selectedCandy);
        this.selectedCandy.setScale(1);
        this.selectedCandy = null;
        
        this.tweens.add({
            targets: candy1,
            x: x2,
            y: y2,
            duration: 300,
            ease: 'Power2'
        });
        
        this.tweens.add({
            targets: candy2,
            x: x1,
            y: y1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.moves--;
                this.movesText.setText('Moves: ' + this.moves);
                
                // Check for matches after swap
                const matches = this.findMatches();
                if (matches.length > 0) {
                    this.handleMatches(matches);
                } else {
                    // No matches, swap back
                    this.swapBack(candy1, candy2);
                }
            }
        });
    }

    swapBack(candy1, candy2) {
        const col1 = candy1.getData('col');
        const row1 = candy1.getData('row');
        const col2 = candy2.getData('col');
        const row2 = candy2.getData('row');
        
        // Swap back in grid
        this.grid[row1][col1] = candy2;
        this.grid[row2][col2] = candy1;
        
        // Update candy data
        candy1.setData('col', col2);
        candy1.setData('row', row2);
        candy2.setData('col', col1);
        candy2.setData('row', row1);
        
        // Animate swap back
        const x1 = candy1.x;
        const y1 = candy1.y;
        const x2 = candy2.x;
        const y2 = candy2.y;
        
        this.tweens.add({
            targets: candy1,
            x: x2,
            y: y2,
            duration: 300,
            ease: 'Power2'
        });
        
        this.tweens.add({
            targets: candy2,
            x: x1,
            y: y1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.isProcessing = false;
                this.checkGameOver();
            }
        });
    }

    findMatches() {
        const matches = [];
        
        // Check horizontal matches
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth - 2; col++) {
                const type = this.grid[row][col].getData('type');
                if (type === this.grid[row][col + 1].getData('type') &&
                    type === this.grid[row][col + 2].getData('type')) {
                    
                    const match = [
                        { row, col },
                        { row, col: col + 1 },
                        { row, col: col + 2 }
                    ];
                    
                    // Check for longer matches
                    for (let i = col + 3; i < this.gridWidth; i++) {
                        if (this.grid[row][i].getData('type') === type) {
                            match.push({ row, col: i });
                        } else {
                            break;
                        }
                    }
                    
                    matches.push(match);
                    col += match.length - 1;
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < this.gridWidth; col++) {
            for (let row = 0; row < this.gridHeight - 2; row++) {
                const type = this.grid[row][col].getData('type');
                if (type === this.grid[row + 1][col].getData('type') &&
                    type === this.grid[row + 2][col].getData('type')) {
                    
                    const match = [
                        { row, col },
                        { row: row + 1, col },
                        { row: row + 2, col }
                    ];
                    
                    // Check for longer matches
                    for (let i = row + 3; i < this.gridHeight; i++) {
                        if (this.grid[i][col].getData('type') === type) {
                            match.push({ row: i, col });
                        } else {
                            break;
                        }
                    }
                    
                    matches.push(match);
                    row += match.length - 1;
                }
            }
        }
        
        return matches;
    }

    handleMatches(matches) {
        // Remove matched candies
        const toRemove = new Set();
        
        matches.forEach(match => {
            match.forEach(pos => {
                toRemove.add(`${pos.row},${pos.col}`);
            });
        });
        
        // Calculate score
        const points = toRemove.size * 10;
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
        
        // Animate removal
        toRemove.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const candy = this.grid[row][col];
            
            this.tweens.add({
                targets: candy,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    candy.destroy();
                }
            });
            
            this.grid[row][col] = null;
        });
        
        // After removal animation, drop candies
        this.time.delayedCall(350, () => {
            this.dropCandies();
        });
    }

    dropCandies() {
        for (let col = 0; col < this.gridWidth; col++) {
            let emptySpaces = 0;
            
            // Count empty spaces from bottom to top
            for (let row = this.gridHeight - 1; row >= 0; row--) {
                if (this.grid[row][col] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Move candy down
                    const candy = this.grid[row][col];
                    const newRow = row + emptySpaces;
                    
                    this.grid[newRow][col] = candy;
                    this.grid[row][col] = null;
                    
                    candy.setData('row', newRow);
                    
                    this.tweens.add({
                        targets: candy,
                        y: newRow * this.tileSize + this.tileSize / 2,
                        duration: 300,
                        ease: 'Bounce.easeOut'
                    });
                }
            }
            
            // Fill empty spaces with new candies
            for (let i = 0; i < emptySpaces; i++) {
                const row = i;
                const candy = this.createCandy(col, row);
                candy.y = -this.tileSize * (emptySpaces - i);
                this.grid[row][col] = candy;
                
                this.tweens.add({
                    targets: candy,
                    y: row * this.tileSize + this.tileSize / 2,
                    duration: 300,
                    delay: i * 50,
                    ease: 'Bounce.easeOut'
                });
            }
        }
        
        // Check for new matches after drop
        this.time.delayedCall(500, () => {
            this.checkForMatches();
        });
    }

    checkForMatches() {
        const matches = this.findMatches();
        if (matches.length > 0) {
            this.handleMatches(matches);
        } else {
            this.isProcessing = false;
            this.checkGameOver();
        }
    }

    checkGameOver() {
        if (this.moves <= 0) {
            this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 
                             this.scale.width, this.scale.height, 0x000000, 0.7);
            
            const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 
                'GAME OVER', {
                fontFamily: 'Arial Black',
                fontSize: 48,
                color: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 8
            }).setOrigin(0.5);
            
            const finalScoreText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, 
                'Final Score: ' + this.score, {
                fontFamily: 'Arial',
                fontSize: 32,
                color: '#ffffff'
            }).setOrigin(0.5);
            
            const restartButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, 
                'RESTART', {
                fontFamily: 'Arial',
                fontSize: 28,
                color: '#ffffff',
                backgroundColor: '#2c3e50',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive();
            
            restartButton.on('pointerdown', () => {
                this.scene.restart();
            });
        }
    }
}