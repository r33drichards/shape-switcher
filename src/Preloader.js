import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('preloader');
    }

    preload() {
        // For now, we're using procedurally generated graphics
        // In a full version, we would load carnival-themed sprites here
    }

    create() {
        // Immediately start the game
        this.scene.start('play');
    }
}