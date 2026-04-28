import { motion } from "framer-motion";

export function BrandLogo({ size = 64 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 14 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-2xl brand-gradient shadow-brand" />
      <motion.svg
        viewBox="0 0 64 64"
        className="absolute inset-0"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
      >
        <motion.path
          d="M16 36 L28 46 L48 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        />
      </motion.svg>
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: "spring" }}
        className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-foreground"
      />
    </motion.div>
  );
}

export function BrandWordmark() {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo size={48} />
      <motion.span
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-extrabold tracking-tight"
      >
        Verde
      </motion.span>
    </div>
  );
}
