import React, { useEffect, useState, useRef } from 'react';

interface EffectLayerProps {
    type: string;
    config: {
        speed?: number;
        count?: number;
        imageUrl?: string;
        minSize?: number;
        maxSize?: number;
    };
}

interface ParticleItem {
    id: number;
    left: number;
    duration: number;
    delay: number;
    size: number;
    opacity: number;
}

class Particle {
    x: number;
    y: number;
    color: string;
    velocity: { x: number, y: number };
    alpha: number;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.alpha = 1;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.05; // gravity
        this.alpha -= 0.01;
    }
}

export const EffectLayer: React.FC<EffectLayerProps> = ({ type, config }) => {
    // Generate items with stable random values using useState/useEffect to avoid purity issues
    const [items, setItems] = useState<ParticleItem[]>([]);

    useEffect(() => {
        if (!type || type === 'NONE' || type === 'FIREWORKS') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setItems([]);
            return;
        }
        
        const count = config?.count || 30;
        const speed = config?.speed || 1;
        
        const newItems = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            duration: (Math.random() * 5 + 5) / speed,
            delay: Math.random() * 5,
            size: Math.random() * 20 + 10,
            opacity: Math.random() * 0.5 + 0.3
        }));
        setItems(newItems);
    }, [type, config?.count, config?.speed]);

    if (!type || type === 'NONE') return null;

    if (type === 'FIREWORKS') {
        return <FireworksEffect />;
    }

    const getContent = () => {
        switch (type) {
            case 'SNOW': return '❄️';
            case 'HEART': return '❤️';
            case 'STAR': return '⭐';
            case 'IMAGE': 
                return config?.imageUrl ? <img src={config.imageUrl} alt="" className="w-full h-full object-contain" /> : '🖼️';
            default: return '✨';
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {items.map((item) => (
                <div 
                    key={item.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${item.left}%`,
                        top: -50,
                        width: item.size,
                        height: item.size,
                        fontSize: `${item.size}px`,
                        animation: `fall ${item.duration}s linear ${item.delay}s infinite`,
                        opacity: item.opacity
                    }}
                >
                    {getContent()}
                </div>
            ))}
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(-50px) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const FireworksEffect = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use parent dimensions instead of window
        const updateSize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        updateSize();

        const particles: Particle[] = [];

        const createFirework = () => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height / 2;
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle(x, y, color));
            }
        };

        let frame = 0;
        let animationId: number;

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (frame % 60 === 0) createFirework();
            
            particles.forEach((p, index) => {
                if (p.alpha <= 0) {
                    particles.splice(index, 1);
                } else {
                    p.update();
                    p.draw(ctx);
                }
            });
            
            frame++;
            animationId = requestAnimationFrame(animate);
        };

        animate();

        window.addEventListener('resize', updateSize);
        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};
