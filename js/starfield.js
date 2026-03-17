/**
 * Star Wars Opening Crawl Style Particle Background
 * Particles move from bottom to top with perspective effect (towards vanishing point)
 */

(function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Canvas styling
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    
    document.body.insertBefore(canvas, document.body.firstChild);
    
    let width, height, centerX, centerY;
    const particles = [];
    const maxParticles = 200;
    const focalLength = 300; // Perspective focal length
    
    // Resize handler
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        centerX = width / 2;
        centerY = height / 2;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    // Particle class
    class Particle {
        constructor() {
            this.reset(true);
        }
        
        reset(initial = false) {
            // Random position in 3D space
            // x, y spread across screen width/height at starting z
            // z starts from near (positive) to far (negative)
            this.x = (Math.random() - 0.5) * width * 2;
            this.y = (Math.random() - 0.5) * height * 2;
            
            // Start from near camera and move away
            // Initial z position - closer to camera = larger values
            if (initial) {
                // Distribute particles evenly across z space to avoid flash
                this.z = Math.random() * 2000 - 1000;
            } else {
                // Start far away and move towards camera for smoother entry
                this.z = 1500 + Math.random() * 500;
            }
            
            this.size = Math.random() * 2 + 0.5;
            this.speed = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.3;
            
            // Trail properties
            this.trail = [];
            this.maxTrailLength = 15;
        }
        
        update() {
            // Move towards viewer (decreasing z)
            // This creates the "coming from distance" effect
            this.z -= this.speed * 3;
            
            // Store position for trail
            this.trail.push({
                x: this.x,
                y: this.y,
                z: this.z,
                opacity: this.opacity
            });
            
            // Limit trail length
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
            
            // Reset if passed the viewer
            if (this.z < -focalLength + 50) {
                this.reset();
            }
        }
        
        // Project 3D coordinates to 2D screen space
        project(x, y, z) {
            const scale = focalLength / (focalLength + z);
            const x2d = centerX + x * scale;
            // Shift up by 30% of screen height
            const y2d = centerY + y * scale - height * 0.3;
            return { x: x2d, y: y2d, scale: scale };
        }
        
        draw() {
            // Project current position
            const current = this.project(this.x, this.y, this.z);
            
            // Calculate size based on depth
            const currentSize = this.size * current.scale;
            
            // Don't draw if behind camera or too small
            if (this.z < -focalLength + 10 || currentSize < 0.1) return;
            
            // Draw trail
            if (this.trail.length > 1) {
                ctx.beginPath();
                
                for (let i = 0; i < this.trail.length - 1; i++) {
                    const point = this.trail[i];
                    const projected = this.project(point.x, point.y, point.z);
                    
                    // Fade trail based on age
                    const trailOpacity = (i / this.trail.length) * this.opacity * projected.scale;
                    
                    if (i === 0) {
                        ctx.moveTo(projected.x, projected.y);
                    } else {
                        ctx.lineTo(projected.x, projected.y);
                    }
                }
                
                // Create gradient for trail
                const gradient = ctx.createLinearGradient(
                    this.project(this.trail[0].x, this.trail[0].y, this.trail[0].z).x,
                    this.project(this.trail[0].x, this.trail[0].y, this.trail[0].z).y,
                    current.x, current.y
                );
                
                gradient.addColorStop(0, `rgba(100, 150, 255, 0)`);
                gradient.addColorStop(0.5, `rgba(100, 150, 255, ${this.opacity * 0.3})`);
                gradient.addColorStop(1, `rgba(150, 200, 255, ${this.opacity})`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = currentSize * 0.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }
            
            // Draw particle head (glow effect)
            const glowSize = currentSize * 3;
            const gradient = ctx.createRadialGradient(
                current.x, current.y, 0,
                current.x, current.y, glowSize
            );
            
            gradient.addColorStop(0, `rgba(200, 220, 255, ${this.opacity})`);
            gradient.addColorStop(0.4, `rgba(100, 150, 255, ${this.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);
            
            ctx.beginPath();
            ctx.arc(current.x, current.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw core
            ctx.beginPath();
            ctx.arc(current.x, current.y, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    let animationId;
    function animate() {
        // Clear with fade effect for motion blur
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, width, height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationId);
    });
})();
