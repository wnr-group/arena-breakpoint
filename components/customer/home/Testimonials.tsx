import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate } from 'framer-motion';
import { Star } from 'lucide-react';

// --- Dummy Data 
const testimonials = [
  {
    id: 1,
    name: "Bryan G.",
    text: "The DDoS protection from Playhost is a lifesaver. We used to get attacked regularly, but since switching to their servers, we haven't had any downtime.",
    avatar: "https://i.pravatar.cc/150?u=bryan",
    rating: 5
  },
  {
    id: 2,
    name: "Michael S.",
    text: "I've been using Playhost for my game server needs, and I couldn't be happier. The server uptime is fantastic, and the customer support team is always quick to assist with any issues.",
    avatar: "https://i.pravatar.cc/150?u=michael",
    rating: 5
  },
  {
    id: 3,
    name: "Robert L.",
    text: "Running a game server used to be a hassle, but Playhost makes it easy. The control panel is user-friendly, and I love how they handle server maintenance and updates.",
    avatar: "https://i.pravatar.cc/150?u=robert",
    rating: 5
  },
  {
    id: 4,
    name: "Jake M.",
    text: "I've tried several hosting providers in the past, and Playhost is by far the best. Their server performance is top-notch, and I've never experienced lag while playing with friends.",
    avatar: "https://i.pravatar.cc/150?u=jake",
    rating: 5
  },
  {
    id: 5,
    name: "Sarah T.",
    text: "Customer support is unparalleled. Whenever I have a question about mod installations, they reply within minutes. Highly recommend to any serious gamer.",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    rating: 5
  }
];

export default function Testimonials() {
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Custom Cursor States
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const x = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Measure the width of exactly ONE set of testimonials to calculate the seamless jump
  useEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth;
        const gap = 24; 
        const setWidth = (cardWidth + gap) * testimonials.length;
        
        setSingleSetWidth(setWidth);
        
        // Start the carousel in the "middle" set so we can drag left OR right immediately
        x.jump(-setWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [x]);

  // Infinite Scroll Logic: Seamlessly jump the X coordinate when crossing thresholds
  useMotionValueEvent(x, "change", (latestX) => {
    if (singleSetWidth === 0) return;

    // If we drag too far Right (entering the first cloned set) -> Jump left to the middle set
    if (latestX > -singleSetWidth) {
      x.jump(latestX - singleSetWidth);
      return; 
    } 
    // If we drag too far Left (entering the third cloned set) -> Jump right to the middle set
    else if (latestX <= -singleSetWidth * 2) {
      x.jump(latestX + singleSetWidth);
      return;
    }

    // Calculate Active Dot based on the current position within the middle set
    const positionWithinSet = Math.abs(latestX + singleSetWidth);
    const scrollPercentage = positionWithinSet / singleSetWidth;
    let index = Math.round(scrollPercentage * testimonials.length);
    if (index >= testimonials.length) index = 0;
    
    setActiveIndex(index);
  });

  // Handle clicking on a dot to scroll to that specific card
  const handleDotClick = (index: number) => {
    if (singleSetWidth === 0) return;
    
    // Calculate the exact width of a single card + gap
    const itemWidth = singleSetWidth / testimonials.length;
    
    // Target the specific card inside the *middle* set
    const targetX = -singleSetWidth - (index * itemWidth);
    
    // Animate the carousel to that position
    animate(x, targetX, {
      type: "spring",
      stiffness: 200,
      damping: 25
    });
  };

  // Update custom cursor position
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const extendedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="w-full bg-[#141414] py-24 overflow-hidden  relative">
      
      {/* Custom Black Circle Cursor with SVGs */}
      {isHovering && (
        <motion.div 
          className="fixed top-0 left-0 w-20 h-20 bg-[#0a0a0a] rounded-full flex items-center justify-center pointer-events-none z-50 shadow-2xl hidden md:flex gap-3"
          animate={{ 
            x: mousePosition.x - 40, 
            y: mousePosition.y - 40 
          }}
          transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
        >
          {/* Solid Left Triangle */}
          <svg width="12" height="14" viewBox="0 0 12 14" fill="white" className="opacity-90">
            <path d="M12 14L0 7L12 0V14Z" />
          </svg>
          
          {/* Solid Right Triangle */}
          <svg width="12" height="14" viewBox="0 0 12 14" fill="white" className="opacity-90">
            <path d="M0 0L12 7L0 14V0Z" />
          </svg>
        </motion.div>
      )}

      <div className="max-w-[1500px] mx-auto px-6 md:px-12 relative border">
        
        {/* Header Section */}
        <div className="mb-14 flex flex-col items-start gap-5">
          <div className="px-5 py-2 rounded-full border border-white/10 bg-transparent">
            <span className="text-sm font-medium text-white tracking-wide">
              Customer reviews
            </span>
          </div>
          
          <h2 
            className="text-5xl md:text-6xl font-black tracking-wide text-gray-200"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
          >
            4.85 out of 5
          </h2>
        </div>

        {/* Draggable Infinite Carousel Container */}
        <motion.div 
          className="overflow-hidden md:cursor-none select-none py-4 "
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
        >
          <motion.div 
            drag="x"
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            style={{ x }}
            className="flex gap-6 w-max"
          >
            {extendedTestimonials.map((testimonial, idx) => (
              <div 
                // Attach the ref to the first card to calculate our set widths
                ref={idx === 0 ? cardRef : null}
                key={`${testimonial.id}-${idx}`} 
                className="w-[340px] md:w-[420px] bg-[#1f1f1f] rounded-2xl p-8 md:p-10 border border-transparent hover:border-white/5 transition-colors duration-300 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-5 h-5 fill-[var(--primary)] text-[var(--primary)]" 
                      />
                    ))}
                  </div>

                  <p className="text-gray-300 text-[15px] md:text-[17px] leading-relaxed font-light mb-10">
                    "{testimonial.text}"
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover shadow-md pointer-events-none"
                    draggable="false" 
                  />
                  <span className="text-white font-bold tracking-wide">
                    {testimonial.name}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom Section: Dots Indicator */}
        <div className="mt-14 flex items-center justify-center w-full">
          <div className="flex items-center gap-3 relative z-10">
            {testimonials.map((_, idx) => (
              <div 
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${
                  activeIndex === idx 
                    ? "bg-[var(--primary)] scale-125" 
                    : "bg-white/20 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}