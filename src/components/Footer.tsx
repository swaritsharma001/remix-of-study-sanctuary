import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Youtube, Mail, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [tapCount, setTapCount] = useState(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Mail, href: 'mailto:contact@studyx.com', label: 'Email' },
  ];

  const handleLogoTap = () => {
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 5) {
      setTapCount(0);
      navigate('/admin');
      return;
    }

    tapTimeout.current = setTimeout(() => {
      setTapCount(0);
    }, 1000);
  };

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo and Brand - Tap 5 times to access admin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={handleLogoTap}
          >
            <img src={logo} alt="StudyX Logo" className="h-12 w-12 object-contain" />
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              StudyX
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-muted-foreground"
          >
            Learn smarter, achieve more. Your premium learning platform.
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </motion.a>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground"
          >
            <p className="flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> by StudyX Team
            </p>
            <p>© {new Date().getFullYear()} StudyX. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
