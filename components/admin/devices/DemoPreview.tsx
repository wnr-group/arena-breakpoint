import React from 'react';
import { motion } from 'framer-motion';

// Extracted exactly from the original HTML
const demos = [
  { id: 1, title: 'Homepage Main', subtitle: 'With hero slider', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-1.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 2, title: 'Homepage Two', subtitle: 'With hero thumbnail slider', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-2.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 3, title: 'Homepage Three', subtitle: 'With hero image', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-3.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 4, title: 'Homepage Four', subtitle: 'With hero carousel', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-4.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 5, title: 'Homepage Five', subtitle: 'With hero video background', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-5.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 6, title: 'Homepage Six', subtitle: 'With hero slider', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-6.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 7, title: 'Homepage Seven', subtitle: 'With hero slider', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-7.webp', links: ['MultiPage', 'OnePage'], badge: null },
  { id: 8, title: 'Homepage Eight', subtitle: 'With hero slider', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/showcase8.webp', links: ['MultiPage', 'OnePage'], badge: 'NEW' },
  { id: 9, title: 'Homepage Nine', subtitle: 'With hero slider', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/homepage-4.webp', links: ['MultiPage', 'OnePage'], badge: 'NEW' },
  { id: 10, title: 'Homepage Ten', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/06/homepage-10.webp', links: ['MultiPage', 'OnePage'], badge: 'NEW' },
  { id: 11, title: 'Game Server One', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/games-1.webp', links: ['MultiPage'], badge: null },
  { id: 12, title: 'Game Server Two', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/games-2-1.webp', links: ['MultiPage'], badge: null },
  { id: 13, title: 'Pricing Table One', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/server-single-one.webp', links: ['MultiPage'], badge: null },
  { id: 14, title: 'Pricing Table Two', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/server-single-two.webp', links: ['MultiPage'], badge: null },
  { id: 15, title: 'Pricing Table Three', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/server-single-three.webp', links: ['MultiPage'], badge: null },
  { id: 16, title: 'Pricing Table Four', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/server-single-four.webp', links: ['MultiPage'], badge: null },
  { id: 17, title: 'Locations', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/locations.webp', links: ['MultiPage'], badge: null },
  { id: 18, title: 'Knowledgebase', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/knowledgebase.webp', links: ['MultiPage'], badge: null },
  { id: 19, title: 'FAQ', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/server-single-four.webp', links: ['MultiPage'], badge: null },
  { id: 20, title: 'Contact', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/contact.webp', links: ['MultiPage'], badge: null },
  { id: 21, title: 'News', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/news.webp', links: ['MultiPage'], badge: null },
  { id: 22, title: 'About', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/about.webp', links: ['MultiPage'], badge: null },
  { id: 23, title: 'Affliates', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/affliate.webp', links: ['MultiPage'], badge: null },
  { id: 24, title: 'Login', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/login.webp', links: ['MultiPage'], badge: null },
  { id: 25, title: 'Register', subtitle: '', img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/01/register.webp', links: ['MultiPage'], badge: null },
];

export default function DemoPreview() {
  return (
    <section id="demo" className="bg-playhost-bg py-24 overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-4">
        
        {/* Section Heading */}
        <div className="text-center mb-16 flex flex-col items-center">
          <motion.span 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[#ADB7BE] text-sm md:text-base font-medium tracking-wide mb-3 block"
          >
            All demo are included
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold font-oxanium bg-clip-text text-transparent bg-gradient-to-r from-[#5623d8] to-[#6a79fa]"
          >
            Demo preview
          </motion.h2>
        </div>

        {/* Demos Grid - 3 columns perfectly matching the 'elementor-col-33' structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              // Uses modulo math to stagger by row (0s, 0.2s, 0.4s) instead of endless accumulation
              transition={{ duration: 0.5, delay: (index % 3) * 0.2 }} 
              className="text-center group"
            >
              {/* Image & Hover Overlay Container */}
              <div className="relative overflow-hidden rounded-xl bg-playhost-card shadow-lg mb-5">
                <div className="w-full h-[300px] sm:h-[400px] lg:h-[270px]">
                  <img 
                    src={demo.img} 
                    alt={demo.title} 
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                
                {/* NEW Badge */}
                {demo.badge && (
                  <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow z-10 tracking-widest uppercase">
                    {demo.badge}
                  </span>
                )}

                {/* Hover Buttons Overlay */}
                <div className="absolute inset-0 bg-[#1E1F22]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col md:flex-row items-center justify-center gap-3 p-4 backdrop-blur-sm">
                  {demo.links.map((linkText, linkIndex) => (
                    <a 
                      key={linkIndex}
                      href="#" 
                      className="bg-[#2A2B30] text-white font-oxanium font-semibold text-sm px-6 py-3 rounded-md border border-white/10 hover:border-transparent hover:bg-gradient-to-r hover:from-[#5623d8] hover:to-[#6a79fa] transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                      style={{ transitionDelay: `${linkIndex * 100}ms` }}
                    >
                      <span>{linkText}</span>
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Card Text */}
              <h5 className="text-white text-xl font-bold font-oxanium mb-1">
                {demo.title}
              </h5>
              {demo.subtitle && (
                <div className="text-[#ADB7BE] text-sm font-medium">
                  {demo.subtitle}
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}