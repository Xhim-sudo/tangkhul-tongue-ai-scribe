import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface MobileRouterProps {
  activeTab: string;
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: "tween" as const,
  duration: 0.2,
  ease: "easeInOut" as const,
};

export default function MobileRouter({ activeTab, children }: MobileRouterProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
