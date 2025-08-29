"use client";

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "framer-motion";
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  isValidElement,
} from "react";
import { cn } from "@/lib/utils";

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};
type DockItemProps = {
  className?: string;
  children: React.ReactNode;
};
type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};
type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type DocContextType = {
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};
type DockProviderProps = {
  children: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("useDock must be used within an DockProvider");
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  const lastPointerType = useRef<string | null>(null);
  const leaveTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimeout.current) {
        window.clearTimeout(leaveTimeout.current);
        leaveTimeout.current = null;
      }
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    lastPointerType.current = e.pointerType;
    isHovered.set(1);
    mouseX.set(e.clientX);
    if (leaveTimeout.current) {
      window.clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    lastPointerType.current = e.pointerType;
    // On touch devices, debounce collapse so a tap/click doesn't immediately close it.
    if (e.pointerType === "touch") {
      leaveTimeout.current = window.setTimeout(() => {
        isHovered.set(0);
        mouseX.set(Infinity);
        leaveTimeout.current = null;
      }, 700);
    } else {
      isHovered.set(0);
      mouseX.set(Infinity);
    }
  };

  return (
    <motion.div
      style={{
        height: height,
        scrollbarWidth: "none",
      }}
      className="mx-2 flex max-w-full items-end overflow-x-auto"
    >
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={(e: React.PointerEvent) => {
          // ensure immediate expansion on pointer down (helpful for touch)
          lastPointerType.current = e.pointerType;
          isHovered.set(1);
          mouseX.set((e as any).clientX ?? Infinity);
          if (leaveTimeout.current) {
            window.clearTimeout(leaveTimeout.current);
            leaveTimeout.current = null;
          }
        }}
        onPointerUp={(e: React.PointerEvent) => {
          // keep expanded briefly after pointer up on touch
          if ((e as any).pointerType === "touch") {
            if (leaveTimeout.current) window.clearTimeout(leaveTimeout.current);
            leaveTimeout.current = window.setTimeout(() => {
              isHovered.set(0);
              mouseX.set(Infinity);
              leaveTimeout.current = null;
            }, 800);
          }
        }}
  className={cn(
          // glass / frosted effect: translucent background + backdrop blur + subtle border
          "mx-auto flex w-fit gap-4 rounded-2xl px-4 bg-white/30 dark:bg-neutral-900/30 backdrop-blur-md border border-white/20 dark:border-neutral-800/30 shadow-lg",
          className
        )}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        <DockProvider value={{ mouseX, spring, distance, magnification }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, mouseX, spring } = useDock();

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [40, magnification, 40]
  );

  const width = useSpring(widthTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onPointerEnter={() => isHovered.set(1)}
      onPointerLeave={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as React.ReactElement<any>, { width, isHovered } as any)
          : child
      )}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps["isHovered"] as MotionValue<number>;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            // glass tooltip: translucent panel with small blur and subtle border
            "absolute -top-6 left-1/2 w-fit whitespace-pre rounded-md border border-white/20 bg-white/20 dark:border-neutral-800/30 dark:bg-neutral-900/30 px-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-100 backdrop-blur-sm",
            className
          )}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps["width"] as MotionValue<number>;

  const widthTransform = useTransform(width, (val) => val / 2);

  return (
    <motion.div
      style={{ width: widthTransform }}
      className={cn("flex items-center justify-center", className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
